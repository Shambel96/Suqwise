require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

function generateProductTitle(i) {
  // Simple realistic-sounding generator without brand trademarks
  const types = [
    "Smartphone",
    "Tablet",
    "Laptop",
    "Headphones",
    "Camera",
    "Smartwatch",
    "Speaker",
    "Charger",
    "Accessory",
  ];
  const adjectives = ["Prime", "Pro", "Plus", "Max", "Lite", "Ultra", "S", "X"];
  const type = types[i % types.length];
  const adj = adjectives[i % adjectives.length];
  const model = 100 + (i % 900);
  return `${type} ${adj} ${model}`;
}

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    console.log("🔁 Clearing core tables for fresh seed (development only)");
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    // truncate in order that avoids FK issues when checks off
    const tables = [
      "price_history",
      "reviews",
      "product_images",
      "store_products",
      "products",
      "brands",
      "categories",
      "stores",
      "users",
    ];
    for (const t of tables) {
      await conn.query(`TRUNCATE TABLE \`${t}\``);
    }
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    // Users
    console.log("🧑‍🤝‍🧑 Inserting users");
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const seedUsers = [
      { email: "alice@store.local", first_name: "Alice", last_name: "Nguyen" },
      { email: "bob@store.local", first_name: "Bob", last_name: "Khan" },
      {
        email: "carol@store.local",
        first_name: "Carol",
        last_name: "Martinez",
      },
      { email: "dave@store.local", first_name: "Dave", last_name: "Singh" },
      { email: "eve@store.local", first_name: "Eve", last_name: "Chen" },
    ];
    const userIds = [];
    for (const u of seedUsers) {
      const [r] = await conn.query(
        "INSERT INTO users (email, password_hash, first_name, last_name, phone, is_email_verified) VALUES (?, ?, ?, ?, ?, ?)",
        [u.email, passwordHash, u.first_name, u.last_name, null, true]
      );
      userIds.push(r.insertId);
    }

    // Stores
    console.log("🏬 Inserting stores");
    const seedStores = [
      {
        name: "Main Store",
        domain: "main.store",
        description: "Primary online store",
        verified: true,
      },
      {
        name: "Outlet",
        domain: "outlet.store",
        description: "Outlet and deals",
        verified: false,
      },
      {
        name: "Marketplace",
        domain: "market.store",
        description: "Marketplace vendors",
        verified: true,
      },
    ];
    const storeIds = [];
    for (const s of seedStores) {
      const [r] = await conn.query(
        "INSERT INTO stores (name, domain, logo_url, description, is_verified) VALUES (?, ?, ?, ?, ?)",
        [s.name, s.domain, null, s.description, s.verified]
      );
      storeIds.push(r.insertId);
    }

    // Categories
    console.log("📂 Inserting categories");
    const seedCategories = [
      {
        name: "Smartphones",
        slug: "smartphones",
        description: "Mobile phones and smartphones",
      },
      {
        name: "Tablets",
        slug: "tablets",
        description: "Tablets and e-readers",
      },
      {
        name: "Laptops",
        slug: "laptops",
        description: "Laptops and notebooks",
      },
      {
        name: "Audio",
        slug: "audio",
        description: "Headphones, speakers and audio gear",
      },
      {
        name: "Accessories",
        slug: "accessories",
        description: "Chargers, cables, cases, and more",
      },
    ];
    const categoryIds = [];
    for (const c of seedCategories) {
      const [r] = await conn.query(
        "INSERT INTO categories (name, slug, description, is_active) VALUES (?, ?, ?, ?)",
        [c.name, c.slug, c.description, true]
      );
      categoryIds.push(r.insertId);
    }

    // Brands
    console.log("🔖 Inserting brands");
    const seedBrands = [
      {
        name: "NovaTech",
        slug: "novatech",
        description: "Innovative consumer electronics",
      },
      {
        name: "Orion Labs",
        slug: "orion-labs",
        description: "Precision electronics and gear",
      },
      {
        name: "Zenith Works",
        slug: "zenith-works",
        description: "Premium devices and accessories",
      },
      { name: "Auralis", slug: "auralis", description: "Audio-first brand" },
      {
        name: "VoltEdge",
        slug: "voltedge",
        description: "Power and charging solutions",
      },
    ];
    const brandIds = [];
    for (const b of seedBrands) {
      const [r] = await conn.query(
        "INSERT INTO brands (name, slug, description, website_url) VALUES (?, ?, ?, ?)",
        [b.name, b.slug, b.description, null]
      );
      brandIds.push(r.insertId);
    }

    // Ensure products table has an owner_store_id column so each product can point to its owning store
    console.log("🔧 Ensuring products.owner_store_id column exists");
    const [colCheck] = await conn.query(
      `SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'owner_store_id'`
    );
    if (colCheck[0].c === 0) {
      // Add the column (nullable) and try to add FK constraint (ignore errors if it already exists)
      await conn.query(
        "ALTER TABLE products ADD COLUMN owner_store_id INT NULL AFTER category_id"
      );
      try {
        await conn.query(
          "ALTER TABLE products ADD CONSTRAINT fk_products_owner_store FOREIGN KEY (owner_store_id) REFERENCES stores(id) ON DELETE SET NULL"
        );
      } catch (fkErr) {
        // Non-fatal: FK may already exist or privileges may be missing; continue without failing the seed
        console.warn(
          "⚠️ could not add fk_products_owner_store constraint:",
          fkErr.message
        );
      }
    }

    // Determine number of products to seed (CLI flag --count=N or env SEED_COUNT)
    const argvCount = (
      process.argv.find((a) => a.startsWith("--count=")) || ""
    ).split("=")[1];
    const seedCount = parseInt(
      argvCount || process.env.SEED_COUNT || "100",
      10
    );
    console.log(
      `📦 Inserting ${seedCount} products distributed across categories/brands/stores`
    );

    const inserted = [];
    for (let i = 0; i < seedCount; i++) {
      const title = generateProductTitle(i);
      const sku = `PROD-${String(100000 + i)}`;
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const price = Math.round((20 + Math.random() * 980) * 100) / 100; // $20 - $1000
      const categoryId = categoryIds[i % categoryIds.length];
      const brandId = brandIds[i % brandIds.length];
      const img = `https://cdn.store.local/images/${sku.toLowerCase()}.jpg`;
      const storeId = storeIds[i % storeIds.length];

      const [productRes] = await conn.query(
        `INSERT INTO products (sku, title, slug, description, short_description, brand_id, category_id, base_price, specifications, weight, dimensions, meta_title, meta_description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sku,
          title,
          slug,
          `${title} full description`,
          `${title} short description`,
          brandId,
          categoryId,
          price,
          JSON.stringify({
            features: ["wireless", "portable"],
            color: ["black", "silver"],
          }),
          Math.round((0.1 + Math.random() * 2) * 1000) / 1000,
          JSON.stringify({
            w: Math.floor(30 + Math.random() * 100),
            h: Math.floor(50 + Math.random() * 200),
            d: Math.floor(5 + Math.random() * 50),
          }),
          `${title} - Buy`,
          `${title} meta description`,
        ]
      );
      const newProductId = productRes.insertId;

      const storeSku = `ST-${sku}`;
      const currentPrice =
        Math.round(price * (0.85 + Math.random() * 0.3) * 100) / 100; // +/- ~15%
      const originalPrice = price;
      const [spRes] = await conn.query(
        "INSERT INTO store_products (product_id, store_id, store_sku, current_price, original_price, stock_quantity, availability_status, store_specific_url, ai_confidence_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newProductId,
          storeId,
          storeSku,
          currentPrice,
          originalPrice,
          Math.floor(Math.random() * 500),
          "in_stock",
          `https://store.local/product/${slug}`,
          Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
        ]
      );
      const newStoreProductId = spRes.insertId;

      // mark this product's owner store (owner_store_id on products)
      try {
        await conn.query(
          "UPDATE products SET owner_store_id = ? WHERE id = ?",
          [storeId, newProductId]
        );
      } catch (uErr) {
        console.warn(
          "⚠️ failed to set owner_store_id for product",
          newProductId,
          uErr.message
        );
      }

      await conn.query(
        "INSERT INTO product_images (product_id, image_url, alt_text, is_thumbnail) VALUES (?, ?, ?, ?)",
        [newProductId, img, `${title} image`, false]
      );

      const reviewerId = userIds[i % userIds.length];
      await conn.query(
        "INSERT INTO reviews (product_id, store_id, user_id, rating, title, comment, language, sentiment_score, is_verified_purchase) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newProductId,
          storeId,
          reviewerId,
          Math.ceil(3 + Math.random() * 2),
          `${title} review`,
          `I tested the ${title} and it performs as expected`,
          "en",
          Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
          true,
        ]
      );

      await conn.query(
        "INSERT INTO price_history (store_product_id, price, is_discounted, discount_percentage) VALUES (?, ?, ?, ?)",
        [
          newStoreProductId,
          currentPrice,
          currentPrice < originalPrice,
          Math.round(
            ((originalPrice - currentPrice) / originalPrice) * 100 * 100
          ) / 100,
        ]
      );

      inserted.push({
        productId: newProductId,
        storeProductId: newStoreProductId,
      });
    }

    await conn.commit();
    console.log("\n✅ Seeding complete! Summary:");
    console.log("  users:", userIds.length);
    console.log("  stores:", storeIds.length);
    console.log("  categories:", categoryIds.length);
    console.log("  brands:", brandIds.length);
    console.log("  products inserted:", inserted.length);
  } catch (err) {
    await conn.rollback();
    console.error("❌ Seed failed:", err);
  } finally {
    conn.release();
    try {
      await pool.end();
    } catch (e) {}
  }
}

// Run when executed directly
if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;
