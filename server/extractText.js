import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";
import OpenAI from "openai";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const SPREADSHEET_EXTENSIONS = [".xls", ".xlsx", ".xlsm"];

let client = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

function hasExtension(filename, extensions) {
  const lower = filename.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext));
}

async function extractFromImage(buffer, mimetype) {
  const openai = getClient();
  if (!openai) throw new Error("OPENAI_API_KEY não configurada — necessária para ler imagens");

  const base64 = buffer.toString("base64");
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Transcreva integralmente todo o texto visível nesta imagem (inclusive tabelas, mantendo a " +
              "estrutura em linhas). Se for um protocolo de teste, planilha de correção ou documento clínico, " +
              "preserve nomes de campos e valores exatamente como aparecem. Não resuma, não interprete.",
          },
          { type: "image_url", image_url: { url: `data:${mimetype};base64,${base64}` } },
        ],
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

function extractFromSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    return `--- Planilha: ${name} ---\n${XLSX.utils.sheet_to_csv(sheet)}`;
  }).join("\n\n");
}

// Extrai texto de .docx, .pdf, .xls/.xlsx/.xlsm, imagens (via OCR com IA) ou texto puro (fallback
// para qualquer outro formato), para usar como referência na geração de laudo por IA.
export async function extractText(buffer, mimetype, filename) {
  if (mimetype === "application/pdf" || filename.endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (
    hasExtension(filename, SPREADSHEET_EXTENSIONS) ||
    mimetype.includes("spreadsheet") ||
    mimetype === "application/vnd.ms-excel"
  ) {
    return extractFromSpreadsheet(buffer);
  }
  if (mimetype.startsWith("image/") || hasExtension(filename, IMAGE_EXTENSIONS)) {
    return extractFromImage(buffer, mimetype || "image/jpeg");
  }
  return buffer.toString("utf-8");
}
