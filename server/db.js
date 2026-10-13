import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

export const query = (text, params) => pool.query(text, params);

// Cria as tabelas se ainda não existirem. Os ids são texto para preservar os ObjectIds
// herdados do Mongo (o frontend guarda esses ids).
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY DEFAULT replace(gen_random_uuid()::text, '-', ''),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  crp text,
  avatar text,
  title text,
  role text NOT NULL DEFAULT 'USER',
  max_reports integer NOT NULL DEFAULT 5,
  used_reports integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pendente'
);
CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS patients (
  id text PRIMARY KEY DEFAULT replace(gen_random_uuid()::text, '-', ''),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patients_user_idx ON patients(user_id);
CREATE TABLE IF NOT EXISTS ai_reference_docs (
  id text PRIMARY KEY DEFAULT replace(gen_random_uuid()::text, '-', ''),
  type text NOT NULL CHECK (type IN ('style_model', 'knowledge_base')),
  filename text NOT NULL,
  content text NOT NULL,
  uploaded_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_doc_chunks (
  id bigserial PRIMARY KEY,
  doc_id text NOT NULL REFERENCES ai_reference_docs(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  filename text NOT NULL,
  text text NOT NULL,
  embedding real[] NOT NULL
);
`;

export async function connectDb() {
  await pool.query(SCHEMA);
}
