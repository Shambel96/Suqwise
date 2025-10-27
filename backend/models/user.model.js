const db = require("./db");

async function findByEmail(email) {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [
    email,
  ]);
  return rows && rows.length ? rows[0] : null;
}

async function createUser({
  email,
  password_hash,
  first_name = null,
  last_name = null,
  phone = null,
}) {
  const [result] = await db.query(
    "INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)",
    [email, password_hash, first_name, last_name, phone]
  );
  // Return the newly created user row (omit password_hash in the select)
  return await findById(result.insertId);
}

async function findById(id) {
  const [rows] = await db.query(
    "SELECT id, email, first_name, last_name, phone, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows && rows.length ? rows[0] : null;
}

module.exports = {
  findByEmail,
  createUser,
  findById,
};
