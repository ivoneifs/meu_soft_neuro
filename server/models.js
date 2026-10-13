import { query } from "./db.js";

// Mapeamento linha -> JSON no mesmo formato que a API devolvia com o Mongoose.

export function userJson(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    crp: u.crp,
    avatar: u.avatar,
    title: u.title,
    role: u.role,
    maxReports: u.max_reports,
    usedReports: u.used_reports,
    status: u.status,
  };
}

export function patientJson(p) {
  return { ...p.data, id: p.id, userId: p.user_id };
}

// Campos de paciente ficam em jsonb: o formulário evolui sem migração de schema.
export function patientData(body) {
  const { id, _id, userId, user_id, ...data } = body || {};
  return data;
}

const USER_COLS = {
  name: "name",
  email: "email",
  password_hash: "password_hash",
  crp: "crp",
  avatar: "avatar",
  title: "title",
  role: "role",
  maxReports: "max_reports",
  usedReports: "used_reports",
  status: "status",
};

export async function findUserByEmail(email) {
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createUser(fields) {
  const keys = Object.keys(fields).filter((k) => USER_COLS[k] && fields[k] !== undefined);
  const cols = keys.map((k) => USER_COLS[k]);
  const { rows } = await query(
    `INSERT INTO users (${cols.join(", ")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
    keys.map((k) => fields[k])
  );
  return rows[0];
}

export async function updateUser(id, fields) {
  const keys = Object.keys(fields).filter((k) => USER_COLS[k] && fields[k] !== undefined);
  if (!keys.length) return findUserById(id);
  const sets = keys.map((k, i) => `${USER_COLS[k]} = $${i + 2}`);
  const { rows } = await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $1 RETURNING *`, [
    id,
    ...keys.map((k) => fields[k]),
  ]);
  return rows[0] || null;
}
