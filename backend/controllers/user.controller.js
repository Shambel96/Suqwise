const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const JWT_SECRET = process.env.JWT_SECRET || "please_change_this_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

async function register(req, res) {
  try {
    const { email, password, first_name, last_name, phone } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const existing = await User.findByEmail(email);
    if (existing) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user via model and get full user row (without password_hash)
    const createdUser = await User.createUser({
      email,
      password_hash,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
    });

    // Create JWT
    const token = jwt.sign({ id: createdUser.id, email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Return token and the created user (already excludes password_hash)
    return res.status(201).json({ token, user: createdUser });
  } catch (error) {
    // Handle duplicate email race condition
    if (error && error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }
    console.error("User registration error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Login handler
async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // user contains password_hash from the DB select
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Build token and return user (without password_hash)
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Remove password_hash before returning
    const { password_hash, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (error) {
    console.error("User login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { register, login };
