require("dotenv").config();
const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
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

// Mount product routes under /products
// Endpoints: GET /products, GET /products/:id, POST /products, PUT /products/:id, DELETE /products/:id
app.use("/products", productRoutes);

module.exports = app;
