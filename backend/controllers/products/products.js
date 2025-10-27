const db = require("../../models/db");

// List all products (supports pagination and filtering)
async function getAllProducts(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id, 10) : null;
    const storeId = req.query.store_id ? parseInt(req.query.store_id, 10) : null;

    let sql = "SELECT * FROM vw_products_full";
    const conditions = [];
    const params = [];

    if (categoryId) {
      conditions.push("category_id = ?");
      params.push(categoryId);
    }

    if (storeId) {
      conditions.push("store_id = ?");
      params.push(storeId);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("getAllProducts error", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

// Get a single product by ID
async function getProductById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await db.query("SELECT * FROM vw_products_full WHERE id = ? LIMIT 1", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getProductById error", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
}

// Create a new product
async function createProduct(req, res) {
  try {
    const payload = req.body || {};
    const requiredFields = ["sku", "title", "base_price"];
    for (const field of requiredFields) {
      if (!payload[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const sql = `
      INSERT INTO products (
        sku, title, description, base_price, image_url, rating, delivery_time_days, store_id, category_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      payload.sku,
      payload.title,
      payload.description || null,
      payload.base_price,
      payload.image_url || null,
      payload.rating || null,
      payload.delivery_time_days || null,
      payload.store_id || null,
      payload.category_id || null,
    ];

    const [result] = await db.query(sql, params);
    const insertId = result.insertId;

    const [newRows] = await db.query("SELECT * FROM vw_products_full WHERE id = ? LIMIT 1", [insertId]);
    res.status(201).json(newRows[0]);
  } catch (err) {
    console.error("createProduct error", err);
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Duplicate product SKU" });
    }
    res.status(500).json({ error: "Failed to create product" });
  }
}

// Update an existing product
async function updateProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const payload = req.body || {};

    const allowed = [
      "sku",
      "title",
      "description",
      "base_price",
      "image_url",
      "rating",
      "delivery_time_days",
      "store_id",
      "category_id",
    ];

    const sets = [];
    const params = [];

    for (const key of allowed) {
      if (payload[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(payload[key]);
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: "No updatable fields provided" });
    }

    params.push(id);
    const sql = `UPDATE products SET ${sets.join(", ")} WHERE id = ?`;
    await db.query(sql, params);

    const [updated] = await db.query("SELECT * FROM vw_products_full WHERE id = ? LIMIT 1", [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error("updateProduct error", err);
    res.status(500).json({ error: "Failed to update product" });
  }
}

// Delete a product
async function deleteProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    await db.query("DELETE FROM products WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("deleteProduct error", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
