import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import { connectDb } from "./db.js";
import { User, Session, Patient, AiReferenceDoc } from "./models.js";
import { hashPassword, verifyPassword, generateToken } from "./crypto.js";
import { extractText } from "./extractText.js";
import { embedAndStoreDoc, deleteDocChunks, retrieveRelevantContext } from "./ragRetrieval.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPER_ADMIN_EMAIL = "ivonei.admin@neuro.com";

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) console.warn("OPENAI_API_KEY não configurada — chamadas à IA vão falhar.");
const openai = new OpenAI({ apiKey: API_KEY || "" });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function getAge(birthDate) {
  const today = new Date();
  const b = new Date(birthDate);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

async function createSession(userId) {
  const token = generateToken();
  const expires_at = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await Session.create({ token, user_id: userId, expires_at });
  return token;
}

async function getUserFromRequest(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const session = await Session.findOne({ token });
  if (!session || new Date(session.expires_at) < new Date()) return null;
  return User.findById(session.user_id);
}

async function requireAuth(req, res, next) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Não autenticado" });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso restrito a administradores" });
  next();
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

// --- Autenticação ---

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, crp, title } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Nome é obrigatório" });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: "E-mail inválido" });
  if (!password || password.length < 6) return res.status(400).json({ error: "Senha deve ter ao menos 6 caracteres" });
  if (email.toLowerCase() === SUPER_ADMIN_EMAIL) {
    return res.status(400).json({ error: "Este e-mail é reservado para o administrador" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: "E-mail já cadastrado" });

  const password_hash = hashPassword(password);
  await User.create({
    name,
    email: email.toLowerCase(),
    password_hash,
    crp: crp || "PJ-CONSULTA",
    title: title || "Psicólogo(a)",
    avatar: `https://picsum.photos/seed/${encodeURIComponent(email)}/150`,
    role: "USER",
    maxReports: 5,
    usedReports: 0,
    status: "Pendente",
  });

  res.status(201).json({ ok: true, status: "Pendente" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "E-mail e senha são obrigatórios" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "E-mail ou senha inválidos" });
  }
  if (user.status === "Bloqueado") return res.status(403).json({ error: "Sua conta está bloqueada. Contate o administrador." });
  if (user.status === "Pendente") return res.status(403).json({ error: "Sua conta aguarda aprovação do administrador." });

  const token = await createSession(user.id);
  res.json({ user, token });
});

app.post("/api/auth/logout", requireAuth, async (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  await Session.deleteOne({ token });
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (req, res) => res.json({ user: req.user }));

app.put("/api/auth/profile", requireAuth, async (req, res) => {
  const { name, email, crp, avatar } = req.body;
  if (name) req.user.name = name;
  if (email && EMAIL_RE.test(email)) req.user.email = email.toLowerCase();
  if (crp !== undefined) req.user.crp = crp;
  if (avatar) req.user.avatar = avatar;
  await req.user.save();
  res.json({ user: req.user });
});

app.put("/api/auth/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Informe a senha atual e a nova senha" });
  if (!verifyPassword(currentPassword, req.user.password_hash)) {
    return res.status(401).json({ error: "Senha atual incorreta" });
  }
  if (newPassword.length < 6) return res.status(400).json({ error: "Nova senha deve ter ao menos 6 caracteres" });

  req.user.password_hash = hashPassword(newPassword);
  await req.user.save();
  res.json({ ok: true });
});

app.post("/api/auth/increment-usage", requireAuth, async (req, res) => {
  req.user.usedReports = (req.user.usedReports || 0) + 1;
  await req.user.save();
  res.json({ user: req.user });
});

// --- Usuários (admin) ---

app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
  res.json(await User.find().sort({ name: 1 }));
});

app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, crp, maxReports } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Nome é obrigatório" });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: "E-mail inválido" });
  if (!password || password.length < 6) return res.status(400).json({ error: "Senha deve ter ao menos 6 caracteres" });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: "E-mail já cadastrado" });

  const created = await User.create({
    name,
    email: email.toLowerCase(),
    password_hash: hashPassword(password),
    crp: crp || "",
    title: "Psicólogo(a)",
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
    role: "USER",
    maxReports: maxReports ?? 20,
    usedReports: 0,
    status: "Ativo",
  });

  res.status(201).json(created);
});

app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id).catch(() => null);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const { name, email, crp, role, maxReports, usedReports, status } = req.body;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email.toLowerCase();
  if (crp !== undefined) user.crp = crp;
  if (role !== undefined) user.role = role;
  if (maxReports !== undefined) user.maxReports = maxReports;
  if (usedReports !== undefined) user.usedReports = usedReports;
  if (status !== undefined) user.status = status;
  await user.save();

  res.json(user);
});

app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id).catch(() => null);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  if (user.email === SUPER_ADMIN_EMAIL) return res.status(400).json({ error: "Não é possível excluir o administrador mestre" });

  await Session.deleteMany({ user_id: user.id });
  await Patient.deleteMany({ userId: user.id });
  await User.deleteOne({ _id: user.id });
  res.json({ ok: true });
});

// --- Documentos de referência da IA (admin) ---

const AI_DOC_TYPES = ["style_model", "knowledge_base"];

app.get("/api/ai-docs", requireAuth, requireAdmin, async (req, res) => {
  res.json(await AiReferenceDoc.find().select("type filename created_at").sort({ created_at: -1 }));
});

app.post("/api/ai-docs", requireAuth, requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Arquivo é obrigatório" });
  if (!AI_DOC_TYPES.includes(req.body.type)) {
    return res.status(400).json({ error: `type deve ser um de: ${AI_DOC_TYPES.join(", ")}` });
  }

  let content;
  try {
    content = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
  } catch (err) {
    return res.status(400).json({ error: `Não foi possível ler o arquivo: ${err.message}` });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Não foi possível extrair texto do arquivo" });
  }

  const created = await AiReferenceDoc.create({
    type: req.body.type,
    filename: req.file.originalname,
    content,
    uploaded_by_user_id: req.user.id,
  });

  try {
    await embedAndStoreDoc({ docId: created.id, type: created.type, filename: created.filename, content });
  } catch (err) {
    await AiReferenceDoc.deleteOne({ _id: created.id });
    return res.status(500).json({ error: `Documento não pôde ser indexado: ${err.message}` });
  }

  res.status(201).json({ id: created.id, type: created.type, filename: created.filename, created_at: created.created_at });
});

app.delete("/api/ai-docs/:id", requireAuth, requireAdmin, async (req, res) => {
  const existing = await AiReferenceDoc.findById(req.params.id).catch(() => null);
  if (!existing) return res.status(404).json({ error: "Documento não encontrado" });
  await deleteDocChunks(existing.id);
  await AiReferenceDoc.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

// --- Pacientes ---

app.get("/api/patients", requireAuth, async (req, res) => {
  const filter = req.user.role === "ADMIN" ? {} : { userId: req.user.id };
  res.json(await Patient.find(filter).sort({ _id: -1 }));
});

app.post("/api/patients", requireAuth, async (req, res) => {
  const patient = await Patient.create({
    ...req.body,
    id: undefined,
    userId: req.user.id,
    avatar: req.body.avatar || `https://picsum.photos/seed/${Date.now()}/200`,
    appliedTests: req.body.appliedTests || [],
  });
  res.status(201).json(patient);
});

app.put("/api/patients/:id", requireAuth, async (req, res) => {
  const patient = await Patient.findById(req.params.id).catch(() => null);
  if (!patient) return res.status(404).json({ error: "Paciente não encontrado" });
  if (req.user.role !== "ADMIN" && String(patient.userId) !== String(req.user.id)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const { id, userId, ...updates } = req.body;
  Object.assign(patient, updates);
  await patient.save();
  res.json(patient);
});

app.delete("/api/patients/:id", requireAuth, async (req, res) => {
  const patient = await Patient.findById(req.params.id).catch(() => null);
  if (!patient) return res.status(404).json({ error: "Paciente não encontrado" });
  if (req.user.role !== "ADMIN" && String(patient.userId) !== String(req.user.id)) {
    return res.status(403).json({ error: "Acesso negado" });
  }
  await Patient.deleteOne({ _id: patient.id });
  res.json({ ok: true });
});

// --- Proxy de IA (OpenAI) ---

app.post("/api/openai/report", async (req, res) => {
  const { patient, reportData } = req.body;
  try {
    const systemInstruction =
      "Você é um assistente de compilação de laudos neuropsicológicos. Redija de forma técnica, " +
      "clara e profissional, em português, a partir dos dados fornecidos pelo(a) psicólogo(a). " +
      "Organize o texto final estritamente nestas seções, nesta ordem, usando os dados fornecidos " +
      "(omita a seção se não houver dado correspondente):\n" +
      "SOLICITANTE E FINALIDADE\nDESCRIÇÃO DA DEMANDA\nPROCEDIMENTOS E MEDICAÇÕES EM USO\n" +
      "ANÁLISE DOS INSTRUMENTOS\nIMPRESSÃO DIAGNÓSTICA\nCONCLUSÃO\nSUGESTÕES DE ENCAMINHAMENTO";
    const prompt =
      `Compilar laudo para ${patient.name} (idade: ${getAge(patient.birthDate)} anos).\n\n` +
      `Solicitante: ${reportData.solicitante || "—"}\n` +
      `Finalidade: ${reportData.finalidade || "—"}\n` +
      `Descrição da demanda: ${reportData.demanda || "—"}\n` +
      `Procedimentos: ${reportData.procedimentos || "—"}\n` +
      `Medicações em uso: ${reportData.medicacoes || "—"}\n` +
      `Análise de instrumentos (observações manuais): ${reportData.analiseInstrumentos || "—"}\n` +
      `Impressão diagnóstica (rascunho do profissional, pode ser refinada): ${reportData.impressaoDiagnostica || "—"}`;

    const referenceContext = await retrieveRelevantContext(prompt);
    const messages = [{ role: "system", content: systemInstruction }];
    if (referenceContext) messages.push({ role: "system", content: referenceContext });
    messages.push({ role: "user", content: prompt });

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      messages,
    });

    res.json({ text: completion.choices[0]?.message?.content?.trim() || "Erro na geração." });
  } catch (err) {
    console.error("Erro OpenAI (report):", err.message);
    res.status(500).json({ text: "Erro ao gerar laudo." });
  }
});

app.post("/api/openai/life-history", async (req, res) => {
  const { patient, anamnesisText, imageFiles } = req.body;
  try {
    const systemInstruction = `
Você é um neuropsicólogo especialista e sua tarefa é estruturar as informações de uma anamnese em uma seção coesa de "HISTÓRIA DE VIDA" para um laudo.
Organize as informações de forma clara e profissional, seguindo estritamente a estrutura:
- HISTÓRIA DE DOENÇA ATUAL
- HISTÓRIA DE VIDA (Gestacional, Desenvolvimento, Alimentação/Sono, Familiar/Social, Autonomia, Escolar).

IMPORTANTE: Se imagens forem fornecidas, transcreva o conteúdo relevante delas (ex: fotos de cadernos, exames antigos, relatórios manuais) e integre na narrativa.
`;

    const textContent = {
      type: "text",
      text:
        `**DADOS DO PACIENTE:**\n- Nome: ${patient.name}\n- Idade: ${getAge(patient.birthDate)} anos\n\n` +
        `**TEXTO DA ANÁLISE / CONTEXTO:**\n---\n${anamnesisText}\n---`,
    };

    const imageContents = (imageFiles || []).map((img) => ({
      type: "image_url",
      image_url: { url: img.data.startsWith("data:") ? img.data : `data:${img.mimeType};base64,${img.data}` },
    }));

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: [textContent, ...imageContents] },
      ],
    });

    res.json({ text: completion.choices[0]?.message?.content?.trim() || "Não foi possível gerar a história de vida." });
  } catch (err) {
    console.error("Erro OpenAI (life-history):", err.message);
    res.status(500).json({ text: "Erro ao processar documentos com a IA." });
  }
});

app.post("/api/openai/interpret-test", async (req, res) => {
  const { patient, test, notes, images } = req.body;
  try {
    const prompt = `
Como neuropsicólogo, interprete os dados brutos do teste ${test.testName}.
Paciente: ${patient.name} (${patient.birthDate}).
DADOS:
${test.result}

HISTÓRICO:
${notes}

Gere um texto clínico rico e conciso. Se houver tempos de reação (TAVIS-4), analise a velocidade psicomotora e variabilidade atencional.${
  images?.length ? " Também foram anexadas fotos do protocolo aplicado — use-as para conferir/enriquecer a leitura dos dados brutos." : ""
}
`;

    const imageContents = (images || []).map((img) => ({
      type: "image_url",
      image_url: { url: img.data.startsWith("data:") ? img.data : `data:${img.mimeType};base64,${img.data}` },
    }));

    const userContent = imageContents.length ? [{ type: "text", text: prompt }, ...imageContents] : prompt;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      messages: [{ role: "user", content: userContent }],
    });

    res.json({ text: completion.choices[0]?.message?.content?.trim() || "Sem retorno da IA." });
  } catch (err) {
    console.error("Erro OpenAI (interpret-test):", err.message);
    res.status(500).json({ text: "Erro na interpretação." });
  }
});

// Garante a existência da conta master (mesmas credenciais já usadas antes da migração para banco de dados).
async function seedSuperAdmin() {
  const exists = await User.findOne({ email: SUPER_ADMIN_EMAIL });
  if (exists) return;
  await User.create({
    name: "Ivonei - Administrador Mestre",
    email: SUPER_ADMIN_EMAIL,
    password_hash: hashPassword("151230"),
    crp: "MASTER-01",
    title: "Super Usuário / Admin",
    avatar: "https://i.pravatar.cc/150?u=ivonei",
    role: "ADMIN",
    maxReports: 99999,
    usedReports: 0,
    status: "Ativo",
  });
}

const PORT = process.env.PORT || 3002;

await connectDb();
await seedSuperAdmin();
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
