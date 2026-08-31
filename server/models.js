import mongoose from "./db.js";

const { Schema, model } = mongoose;

function withIdJson(schema, hide = []) {
  schema.set("toJSON", {
    virtuals: true,
    transform: (_doc, ret) => {
      delete ret._id;
      delete ret.__v;
      hide.forEach((f) => delete ret[f]);
    },
  });
}

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  crp: String,
  avatar: String,
  title: String,
  role: { type: String, required: true, default: "USER" },
  maxReports: { type: Number, required: true, default: 5 },
  usedReports: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, default: "Pendente" },
});
withIdJson(userSchema, ["password_hash"]);
export const User = model("User", userSchema);

const sessionSchema = new Schema({
  token: { type: String, required: true, unique: true },
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expires_at: { type: String, required: true },
});
withIdJson(sessionSchema);
export const Session = model("Session", sessionSchema);

const patientSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  avatar: String,
  birthDate: String,
  gender: String,
  cpf: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
  },
  insurance: {
    provider: String,
    policyNumber: String,
  },
  school: {
    name: String,
    grade: String,
  },
  notes: String,
  lateralidade: String,
  escolaridade: String,
  filiacao: String,
  appliedTests: [{ testName: String, result: String, _id: false }],
});
withIdJson(patientSchema);
export const Patient = model("Patient", patientSchema);

// Documentos de referência para a geração de laudo por IA: "style_model" (laudos exemplo, para
// a IA imitar tom/estrutura) ou "knowledge_base" (material clínico de apoio). Guardamos só o
// texto extraído, não o arquivo original.
const aiReferenceDocSchema = new Schema({
  type: { type: String, required: true, enum: ["style_model", "knowledge_base"] },
  filename: { type: String, required: true },
  content: { type: String, required: true },
  uploaded_by_user_id: { type: Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
});
withIdJson(aiReferenceDocSchema);
export const AiReferenceDoc = model("AiReferenceDoc", aiReferenceDocSchema);

// Pedaços de um AiReferenceDoc com embedding, para busca por similaridade (RAG) em vez de
// injetar o documento inteiro no prompt.
const aiDocChunkSchema = new Schema({
  doc_id: { type: Schema.Types.ObjectId, ref: "AiReferenceDoc", required: true },
  doc_type: { type: String, required: true },
  filename: { type: String, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
});
withIdJson(aiDocChunkSchema);
export const AiDocChunk = model("AiDocChunk", aiDocChunkSchema);
