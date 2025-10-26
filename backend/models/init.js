require("dotenv").config();
const pool = require("./db");

async function createTables() {
  try {
    console.log("🚀 Creating enhanced SuQSense database tables...");

    // Execute all table creation queries using shared pool
    await pool.query(`
-- Enhanced Users with AI Preferences
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    preferred_language VARCHAR(10) DEFAULT 'en',
    voice_assistance_enabled BOOLEAN DEFAULT true,
    ai_preferences JSON,
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_language (preferred_language)
);

-- Multiple Store Support
CREATE TABLE IF NOT EXISTS stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    description TEXT,
    reliability_score DECIMAL(3,2) DEFAULT 0.0,
    avg_delivery_days DECIMAL(5,2),
    return_policy_rating INT,
    customer_service_rating INT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_stores_domain (domain),
    INDEX idx_stores_reliability (reliability_score)
);

-- Categories for Better AI Classification
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT,
    image_url VARCHAR(500),
    search_volume_trend JSON,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id),
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_parent (parent_id)
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_brands_slug (slug)
);

-- Enhanced Products with Multi-Store Support
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    brand_id INT,
    category_id INT,
    base_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    specifications JSON NOT NULL,
    weight DECIMAL(8,3),
    dimensions JSON,
    warranty_information TEXT,
    return_policy TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    upc_code VARCHAR(255),
    model_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE KEY unique_product_sku (sku, brand_id),
    INDEX idx_products_slug (slug),
    INDEX idx_products_category (category_id),
    INDEX idx_products_brand (brand_id),
    INDEX idx_products_active (is_active)
);

-- Store-specific Product Listings
CREATE TABLE IF NOT EXISTS store_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    store_id INT NOT NULL,
    store_sku VARCHAR(100),
    current_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    availability_status VARCHAR(50) DEFAULT 'in_stock',
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    estimated_delivery_days INT,
    store_specific_url VARCHAR(500),
    last_price_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_available BOOLEAN DEFAULT true,
    ai_confidence_score DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE KEY unique_store_product (product_id, store_id),
    INDEX idx_store_products_price (current_price),
    INDEX idx_store_products_availability (is_available),
    INDEX idx_store_products_store (store_id)
);

-- Product Images
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_thumbnail BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_images_product (product_id),
    INDEX idx_product_images_order (sort_order)
);

-- AI-Powered Product Comparisons
CREATE TABLE IF NOT EXISTS product_comparisons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    comparison_hash CHAR(64) NOT NULL,
    product_ids JSON NOT NULL,
    store_ids JSON NOT NULL,
    comparison_criteria JSON NOT NULL,
    ai_recommendation JSON,
    user_feedback INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_comparisons_hash (comparison_hash),
    INDEX idx_comparisons_user (user_id),
    INDEX idx_comparisons_created (created_at),
    CHECK (user_feedback BETWEEN 1 AND 5)
);

-- Enhanced Reviews with Sentiment Analysis
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    store_id INT,
    user_id INT,
    rating INT NOT NULL,
    title VARCHAR(255),
    comment TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    sentiment_score DECIMAL(3,2),
    aspect_sentiments JSON,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    helpful_count INT DEFAULT 0,
    reviewer_name VARCHAR(255),
    reviewer_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_sentiment (sentiment_score),
    INDEX idx_reviews_language (language),
    INDEX idx_reviews_rating (rating),
    CHECK (rating BETWEEN 1 AND 5)
);

-- Review Helpful Votes
CREATE TABLE IF NOT EXISTS review_helpful (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_helpful_vote (review_id, user_id)
);

-- Search Analytics for Demand Prediction
CREATE TABLE IF NOT EXISTS search_queries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    query_text TEXT NOT NULL,
    normalized_query TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    user_id INT,
    session_id VARCHAR(255),
    filters_applied JSON,
    result_count INT,
    has_results BOOLEAN DEFAULT true,
    clicked_product_id INT,
    search_location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (clicked_product_id) REFERENCES products(id),
    INDEX idx_search_queries_normalized (normalized_query(255)),
    INDEX idx_search_queries_created (created_at),
    INDEX idx_search_queries_language (language)
);

-- Unmet Demand Detection
CREATE TABLE IF NOT EXISTS unmet_demands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    search_query_id INT,
    normalized_query TEXT NOT NULL,
    demand_score DECIMAL(3,2) NOT NULL,
    potential_category_id INT,
    estimated_price_range JSON,
    geographic_concentration JSON,
    frequency_count INT DEFAULT 1,
    first_detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_actionable BOOLEAN DEFAULT true,
    ai_insights TEXT,
    FOREIGN KEY (search_query_id) REFERENCES search_queries(id),
    FOREIGN KEY (potential_category_id) REFERENCES categories(id),
    INDEX idx_unmet_demands_score (demand_score),
    INDEX idx_unmet_demands_actionable (is_actionable),
    INDEX idx_unmet_demands_normalized (normalized_query(255))
);

-- User Behavior Tracking for Personalization
CREATE TABLE IF NOT EXISTS user_behavior (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    product_id INT,
    store_id INT,
    comparison_id INT,
    duration_seconds INT,
    scroll_depth DECIMAL(3,2),
    filters_used JSON,
    device_info JSON,
    location_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (comparison_id) REFERENCES product_comparisons(id),
    INDEX idx_user_behavior_event (event_type, created_at),
    INDEX idx_user_behavior_user (user_id),
    INDEX idx_user_behavior_session (session_id)
);

-- AI Model Training Data
CREATE TABLE IF NOT EXISTS ml_training_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL,
    input_features JSON NOT NULL,
    output_labels JSON NOT NULL,
    model_version VARCHAR(100),
    accuracy_score DECIMAL(4,3),
    is_training_data BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ml_training_type (data_type)
);

-- Multilingual Support
CREATE TABLE IF NOT EXISTS multilingual_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    original_id INT NOT NULL,
    original_content TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,
    translated_content TEXT NOT NULL,
    translation_confidence DECIMAL(3,2) DEFAULT 1.0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_multilingual_language (language),
    INDEX idx_multilingual_content_type (content_type, original_id)
);

-- Voice Assistant Interactions
CREATE TABLE IF NOT EXISTS voice_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    language VARCHAR(10) NOT NULL,
    voice_query TEXT NOT NULL,
    text_response TEXT NOT NULL,
    intent_detected VARCHAR(100),
    confidence_score DECIMAL(3,2),
    was_successful BOOLEAN DEFAULT true,
    processing_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_voice_language (language),
    INDEX idx_voice_created (created_at)
);

-- Price History for Trend Analysis
CREATE TABLE IF NOT EXISTS price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_product_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_discounted BOOLEAN DEFAULT false,
    discount_percentage DECIMAL(5,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_product_id) REFERENCES store_products(id) ON DELETE CASCADE,
    INDEX idx_price_history_product (store_product_id, recorded_at),
    INDEX idx_price_history_date (recorded_at)
);

-- Seller Insights and Recommendations
CREATE TABLE IF NOT EXISTS seller_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    insight_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_level DECIMAL(3,2) DEFAULT 0.0,
    recommended_action TEXT,
    potential_impact VARCHAR(50),
    affected_categories JSON,
    geographic_relevance JSON,
    is_action_taken BOOLEAN DEFAULT false,
    action_taken_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    INDEX idx_seller_insights_store (store_id),
    INDEX idx_seller_insights_type (insight_type)
);

-- Product Similarity for Recommendations
CREATE TABLE IF NOT EXISTS product_similarity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    similar_product_id INT NOT NULL,
    similarity_score DECIMAL(4,3) NOT NULL,
    similarity_type VARCHAR(50) NOT NULL,
    shared_features JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (similar_product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_similarity (product_id, similar_product_id, similarity_type),
    INDEX idx_similarity_score (similarity_score)
);

-- Shopping Cart
CREATE TABLE IF NOT EXISTS cart_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_token VARCHAR(255),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_cart_sessions_token (session_token)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_session_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_session_id) REFERENCES cart_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_cart_items_session (cart_session_id)
);

-- Orders and Payments (Simplified for AI context)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    store_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_store (store_id)
);
    `);

    console.log("✅ All tables created successfully!");

    // Create stored procedures
    console.log("📊 Creating stored procedures...");

    await pool.query(`
-- Stored Procedures for AI Data Processing
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS RefreshAIViews()
BEGIN
    -- This would refresh materialized views in MySQL (using temporary tables)
    DROP TEMPORARY TABLE IF EXISTS temp_product_metrics;
    CREATE TEMPORARY TABLE temp_product_metrics AS
    SELECT a
        p.id as product_id,
        p.title,
        p.category_id,
        COUNT(DISTINCT sp.store_id) as store_count,
        AVG(sp.current_price) as avg_price,
        MIN(sp.current_price) as min_price,
        MAX(sp.current_price) as max_price,
        AVG(r.rating) as avg_rating,
        COUNT(r.id) as review_count,
        AVG(r.sentiment_score) as avg_sentiment
    FROM products p
    LEFT JOIN store_products sp ON p.id = sp.product_id AND sp.is_available = true
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.is_active = true
    GROUP BY p.id, p.title, p.category_id;
    
    -- Update product similarity scores (simplified example)
    UPDATE product_similarity ps
    JOIN temp_product_metrics pm1 ON ps.product_id = pm1.product_id
    JOIN temp_product_metrics pm2 ON ps.similar_product_id = pm2.product_id
    SET ps.similarity_score = 
        (ABS(pm1.avg_price - pm2.avg_price) / GREATEST(pm1.avg_price, pm2.avg_price)) * 0.3 +
        (ABS(pm1.avg_rating - pm2.avg_rating) / 5) * 0.4 +
        (ABS(pm1.avg_sentiment - pm2.avg_sentiment) / 2) * 0.3;
END//

DELIMITER ;
    `);

    console.log("✅ Stored procedures created!");

    // Create triggers
    console.log("⚡ Creating triggers...");

    await pool.query(`
-- Triggers for automated data updates
DELIMITER //

CREATE TRIGGER IF NOT EXISTS after_price_update
    AFTER UPDATE ON store_products
    FOR EACH ROW
BEGIN
    IF OLD.current_price != NEW.current_price THEN
        INSERT INTO price_history (store_product_id, price, is_discounted, discount_percentage)
        VALUES (NEW.id, NEW.current_price, 
               NEW.original_price IS NOT NULL AND NEW.current_price < NEW.original_price,
               CASE WHEN NEW.original_price IS NOT NULL THEN 
                   ((NEW.original_price - NEW.current_price) / NEW.original_price) * 100 
               ELSE NULL END);
    END IF;
END//

CREATE TRIGGER IF NOT EXISTS after_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
BEGIN
    -- Update product average rating (simplified)
    UPDATE products 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
END//

DELIMITER ;
    `);

    console.log("✅ Triggers created!");

    // Note: MySQL Events require EVENT privilege and might be disabled by default
    console.log(
      "📝 Note: MySQL events require EVENT privilege. You may need to enable them manually."
    );

    console.log("🎉 SuQSense database setup completed successfully!");
    console.log("📋 Total tables created: 24");
  } catch (error) {
    console.error("❌ Error creating database:", error);
    throw error;
  } finally {
    // Close the pool when finished to allow the script to exit cleanly.
    try {
      await pool.end();
    } catch (err) {
      // ignore pool close errors during shutdown
    }
  }
}

// Run the initialization
createTables()
  .then(() => {
    console.log("\n🚀 SuQSense is ready! Next steps:");
    console.log("   1. Run your application");
    console.log("   2. Add sample data using seed scripts");
    console.log("   3. Start building your AI comparison engine!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Database initialization failed!");
    console.error("   Error:", error.message);
    process.exit(1);
  });
