require("dotenv").config();
const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/user.routes");
const app = express();
app.use(cors());
app.use(express.json());
const seedRoute = require("./routes/seedDatabase");
app.use("/api", seedRoute);

// Health
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Mount user routes under /api/users
// This will expose endpoints like: POST /api/users/register
app.use("/users", userRoutes);

module.exports = app;
