const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a shared pool for the application
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "suqwise",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "suqwise",
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  queueLimit: 0,
  multipleStatements: true,
});

module.exports = pool;
