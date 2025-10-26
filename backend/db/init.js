const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTables() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'suqsense',
      multipleStatements: true
    });

    console.log('🚀 Connaaecting to MySQL and creating enhanced SuQSense database tables...');

    // 1. Enhanced Users with AI Preferences
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    // 2. Brands Table (Referenced by products)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        logo_url VARCHAR(500),
        website_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Brands table created');

    // 3. Enhanced Categories for Better AI Classification
    await connection.execute(`
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
        FOREIGN KEY (parent_id) REFERENCES categories(id)
      );
    `);
    console.log('✅ Categories table created');

    // 4. Multiple Store Support
    await connection.execute(`
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Stores table created');

    // 5. Enhanced Products with Multi-Store Support
    await connection.execute(`
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
        specifications JSON NOT NULL DEFAULT ('{}'),
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
        UNIQUE KEY unique_sku_brand (sku, brand_id)
      );
    `);
    console.log('✅ Products table created');

    // 6. Store-specific Product Listings
    await connection.execute(`
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
        UNIQUE KEY unique_product_store (product_id, store_id)
      );
    `);
    console.log('✅ Store products table created');

    // 7. AI-Powered Product Comparisons
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_comparisons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        session_id VARCHAR(255),
        comparison_hash VARCHAR(64) NOT NULL,
        product_ids JSON NOT NULL,
        store_ids JSON NOT NULL,
        comparison_criteria JSON NOT NULL,
        ai_recommendation JSON,
        user_feedback INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        CHECK (user_feedback >= 1 AND user_feedback <= 5)
      );
    `);
    console.log('✅ Product comparisons table created');

    // 8. Enhanced Reviews with Sentiment Analysis
    await connection.execute(`
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
        CHECK (rating >= 1 AND rating <= 5)
      );
    `);
    console.log('✅ Reviews table created');

    // 9. Search Analytics for Demand Prediction
    await connection.execute(`
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
        FOREIGN KEY (clicked_product_id) REFERENCES products(id)
      );
    `);
    console.log('✅ Search queries table created');

    // 10. Unmet Demand Detection
    await connection.execute(`
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
        last_detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_actionable BOOLEAN DEFAULT true,
        ai_insights TEXT,
        FOREIGN KEY (search_query_id) REFERENCES search_queries(id),
        FOREIGN KEY (potential_category_id) REFERENCES categories(id)
      );
    `);
    console.log('✅ Unmet demands table created');

    // 11. User Behavior Tracking for Personalization
    await connection.execute(`
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
        FOREIGN KEY (comparison_id) REFERENCES product_comparisons(id)
      );
    `);
    console.log('✅ User behavior table created');

    // 12. AI Model Training Data
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ml_training_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        data_type VARCHAR(50) NOT NULL,
        input_features JSON NOT NULL,
        output_labels JSON NOT NULL,
        model_version VARCHAR(100),
        accuracy_score DECIMAL(4,3),
        is_training_data BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ ML training data table created');

    // 13. Multilingual Support
    await connection.execute(`
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Multilingual content table created');

    // 14. Voice Assistant Interactions
    await connection.execute(`
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
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    console.log('✅ Voice interactions table created');

    // 15. Price History for Trend Analysis
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_product_id INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        is_discounted BOOLEAN DEFAULT false,
        discount_percentage DECIMAL(5,2),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_product_id) REFERENCES store_products(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Price history table created');

    // 16. Seller Insights and Recommendations
    await connection.execute(`
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
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );
    `);
    console.log('✅ Seller insights table created');

    // 17. Product Similarity for Recommendations
    await connection.execute(`
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
        UNIQUE KEY unique_product_similarity (product_id, similar_product_id, similarity_type)
      );
    `);
    console.log('✅ Product similarity table created');

    // 18. Product Images Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_product_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255),
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_product_id) REFERENCES store_products(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Product images table created');

    console.log('🎉 All enhanced MySQL tables created successfully!');

    // Create indexes for better performance
    console.log('📊 Creating indexes...');
    
    await connection.execute(`CREATE INDEX idx_store_products_price ON store_products(current_price);`);
    await connection.execute(`CREATE INDEX idx_store_products_availability ON store_products(is_available);`);
    await connection.execute(`CREATE INDEX idx_reviews_sentiment ON reviews(sentiment_score);`);
    await connection.execute(`CREATE INDEX idx_reviews_language ON reviews(language);`);
    await connection.execute(`CREATE INDEX idx_search_queries_normalized ON search_queries(normalized_query(255));`);
    await connection.execute(`CREATE INDEX idx_search_queries_created ON search_queries(created_at);`);
    await connection.execute(`CREATE INDEX idx_unmet_demands_score ON unmet_demands(demand_score);`);
    await connection.execute(`CREATE INDEX idx_user_behavior_event ON user_behavior(event_type, created_at);`);
    await connection.execute(`CREATE INDEX idx_price_history_trend ON price_history(store_product_id, recorded_at);`);
    await connection.execute(`CREATE INDEX idx_voice_interactions_language ON voice_interactions(language);`);
    await connection.execute(`CREATE INDEX idx_product_comparisons_hash ON product_comparisons(comparison_hash);`);
    await connection.execute(`CREATE INDEX idx_ml_training_data_type ON ml_training_data(data_type);`);
    await connection.execute(`CREATE INDEX idx_products_category ON products(category_id, is_active);`);
    await connection.execute(`CREATE INDEX idx_store_products_composite ON store_products(product_id, is_available, current_price);`);

    console.log('✅ All indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
createTables().then(() => {
  console.log('🚀 Database initialization completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Database initialization failed:', error);
  process.exit(1);
});