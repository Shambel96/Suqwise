const express = require("express");
const router = express.Router();
const pool = require("../models/db"); // adjust path if needed

// Helper to generate random data
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedDatabase(req, res) {
  try {
    // 1️⃣ Clear old data
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    await pool.query("TRUNCATE TABLE reviews");
    await pool.query("TRUNCATE TABLE order_items");
    await pool.query("TRUNCATE TABLE orders");
    await pool.query("TRUNCATE TABLE products");
    await pool.query("TRUNCATE TABLE categories");
    await pool.query("TRUNCATE TABLE users");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    // 2️⃣ Insert users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      users.push([
        `User ${i}`,
        `user${i}@gmail.com`,
        "hashedpassword123",
        random(["customer", "admin"]),
      ]);
    }
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ?",
      [users]
    );

    // 3️⃣ Insert categories (electronics-focused)
    const categories = [
      ["Smartphones"],
      ["Laptops"],
      ["Tablets"],
      ["Smartwatches"],
      ["Headphones"],
      ["Monitors"],
      ["Televisions"],
      ["Cameras"],
      ["Gaming Consoles"],
      ["Accessories"],
    ];
    await pool.query("INSERT INTO categories (name) VALUES ?", [categories]);

    // 4️⃣ Insert products
    const products = [];
    const sampleProducts = [
      "Samsung Galaxy S25",
      "iPhone 16 Pro",
      "Dell XPS 15",
      "MacBook Air M4",
      "iPad Pro 2025",
      "Sony WH-1000XM6",
      "LG OLED 55-inch TV",
      "Canon EOS R8 Camera",
      "PlayStation 6",
      "Xbox Series Z",
      "Lenovo Legion 7",
      "ASUS ROG Zephyrus G15",
      "Google Pixel 9",
    ];

    for (let i = 0; i < sampleProducts.length; i++) {
      const price = randNum(500, 3000);
      products.push([
        sampleProducts[i],
        `High-quality ${sampleProducts[i]} for tech lovers.`,
        price,
        randNum(5, 15), // discount %
        randNum(10, 50), // stock
        randNum(1, categories.length), // category_id
        `https://example.com/images/${sampleProducts[i]
          .toLowerCase()
          .replace(/ /g, "_")}.jpg`,
      ]);
    }

    await pool.query(
      "INSERT INTO products (title, description, price, discountPercentage, stock, category_id, image) VALUES ?",
      [products]
    );

    // 5️⃣ Insert orders
    const orders = [];
    for (let i = 1; i <= 10; i++) {
      orders.push([
        randNum(1, users.length), // user_id
        new Date(),
        random(["pending", "completed", "shipped"]),
      ]);
    }
    await pool.query(
      "INSERT INTO orders (user_id, order_date, status) VALUES ?",
      [orders]
    );

    // 6️⃣ Insert order_items
    const orderItems = [];
    for (let i = 1; i <= 20; i++) {
      orderItems.push([
        randNum(1, 10), // order_id
        randNum(1, products.length), // product_id
        randNum(1, 3), // quantity
      ]);
    }
    await pool.query(
      "INSERT INTO order_items (order_id, product_id, quantity) VALUES ?",
      [orderItems]
    );

    // 7️⃣ Insert reviews
    const reviews = [];
    for (let i = 1; i <= 15; i++) {
      reviews.push([
        randNum(1, users.length),
        randNum(1, products.length),
        randNum(3, 5),
        `Great product! I love my ${random(sampleProducts)}.`,
      ]);
    }
    await pool.query(
      "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ?",
      [reviews]
    );

    res.json({ message: "Database seeded successfully 🚀" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Seeding failed", details: err.message });
  }
}

router.post("/seed", seedDatabase);
module.exports = router;
