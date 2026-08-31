import OpenAI from "openai";
import { AiDocChunk } from "./models.js";

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;
const TOP_K = 8;

let client = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

// Divide o texto em pedaços de tamanho fixo com sobreposição, para preservar contexto nas bordas.
export function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    chunks.push(cleaned.slice(start, end));
    if (end === cleaned.length) break;
    start = end - overlap;
  }
  return chunks;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Gera embeddings para um doc recém-enviado (upload) e salva os chunks. Lança erro se a IA
// não estiver configurada — quem chama decide se bloqueia o upload ou só loga o aviso.
export async function embedAndStoreDoc({ docId, type, filename, content }) {
  const openai = getClient();
  if (!openai) throw new Error("OPENAI_API_KEY não configurada");

  const chunks = chunkText(content);
  if (chunks.length === 0) return;

  const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: chunks });

  await AiDocChunk.insertMany(
    chunks.map((text, i) => ({
      doc_id: docId,
      doc_type: type,
      filename,
      text,
      embedding: response.data[i].embedding,
    }))
  );
}

// Busca os trechos mais relevantes (por similaridade de cosseno) para o texto de consulta —
// os escores/dados da avaliação atual — em vez de injetar todos os documentos no prompt.
export async function retrieveRelevantContext(queryText) {
  const openai = getClient();
  if (!openai) return "";

  const allChunks = await AiDocChunk.find();
  if (allChunks.length === 0) return "";

  const queryEmbeddingResp = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: queryText });
  const queryEmbedding = queryEmbeddingResp.data[0].embedding;

  const ranked = allChunks
    .map((c) => ({ chunk: c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  const styleChunks = ranked.filter((r) => r.chunk.doc_type === "style_model");
  const knowledgeChunks = ranked.filter((r) => r.chunk.doc_type === "knowledge_base");

  const parts = [];
  if (styleChunks.length) {
    parts.push(
      "TRECHOS DE LAUDOS-MODELO (referência de tom/estrutura — não copie dados de paciente deles):\n" +
        styleChunks.map((r) => `--- ${r.chunk.filename} ---\n${r.chunk.text}`).join("\n\n")
    );
  }
  if (knowledgeChunks.length) {
    parts.push(
      "TRECHOS DE MATERIAL CLÍNICO DE APOIO:\n" +
        knowledgeChunks.map((r) => `--- ${r.chunk.filename} ---\n${r.chunk.text}`).join("\n\n")
    );
  }
  return parts.join("\n\n");
}

export async function deleteDocChunks(docId) {
  await AiDocChunk.deleteMany({ doc_id: docId });
}
