USE suqwise_Hackathon; -- or change to your target DB

-- 1) Stores (sellers)
INSERT INTO stores (id, name, seller_name, domain, created_at) VALUES
  (1, 'Main Store', 'Main Store Seller', 'main.store', '2025-10-27 13:00:00'),
  (2, 'Outlet', 'Outlet Seller', 'outlet.store', '2025-10-27 13:00:00'),
  (3, 'Marketplace', 'Marketplace Seller', 'market.store', '2025-10-27 13:00:00');

-- 2) Categories (electronics only will use category_id = 1)
INSERT INTO categories (id, name, slug, created_at) VALUES
  (1, 'Electronics', 'electronics', '2025-10-27 13:00:00'),
  (2, 'Audio', 'audio', '2025-10-27 13:00:00'),
  (3, 'Accessories', 'accessories', '2025-10-27 13:00:00');

-- 3) Users (sample users)
-- password_hash: placeholder string; replace with real bcrypt hashes for real use
INSERT INTO users (id, uuid, email, password_hash, first_name, last_name, phone, created_at) VALUES
  (1, '11111111-1111-1111-1111-111111111111', 'alice@example.com', '$2a$10$EXAMPLEHASHAlice', 'Alice', 'Nguyen', '555-0101', '2025-10-27 13:05:00'),
  (2, '22222222-2222-2222-2222-222222222222', 'bob@example.com', '$2a$10$EXAMPLEHASHBob', 'Bob', 'Khan', '555-0102', '2025-10-27 13:05:00'),
  (3, '33333333-3333-3333-3333-333333333333', 'carol@example.com', '$2a$10$EXAMPLEHASHCarol', 'Carol', 'Martinez', '555-0103', '2025-10-27 13:05:00'),
  (4, '44444444-4444-4444-4444-444444444444', 'dave@example.com', '$2a$10$EXAMPLEHASHDave', 'Dave', 'Singh', '555-0104', '2025-10-27 13:05:00'),
  (5, '55555555-5555-5555-5555-555555555555', 'eve@example.com', '$2a$10$EXAMPLEHASHEve', 'Eve', 'Chen', '555-0105', '2025-10-27 13:05:00');

-- 4) Products (9 electronics products; all category_id = 1)
INSERT INTO products (id, sku, title, description, base_price, image_url, rating, delivery_time_days, store_id, category_id, created_at, updated_at) VALUES
  (1, 'PROD-E-200001', 'Wireless Earbuds Z1', 'Wireless Earbuds Z1 full description', 99.99, 'https://cdn.example.com/images/earbuds-z1.jpg', 4.4, 3, 1, 1, '2025-10-27 13:10:00', '2025-10-27 13:10:00'),
  (2, 'PROD-E-200002', 'Ultrabook Slim 14', 'Ultrabook Slim 14 full description', 1299.00, 'https://cdn.example.com/images/ultrabook-14.jpg', 4.6, 5, 1, 1, '2025-10-27 13:11:00', '2025-10-27 13:11:00'),
  (3, 'PROD-E-200003', 'Nexa 5G Plus', 'Nexa 5G Plus full description', 799.00, 'https://cdn.example.com/images/nexa-5g-plus.jpg', 4.2, 2, 2, 1, '2025-10-27 13:12:00', '2025-10-27 13:12:00'),
  (4, 'PROD-E-200004', 'Portable SSD X2', 'Portable SSD X2 full description', 149.99, 'https://cdn.example.com/images/ssd-x2.jpg', 4.8, 1, 1, 1, '2025-10-27 13:13:00', '2025-10-27 13:13:00'),
  (5, 'PROD-E-200005', 'Gaming Headset R7', 'Gaming Headset R7 full description', 119.50, 'https://cdn.example.com/images/headset-r7.jpg', 4.1, 4, 2, 1, '2025-10-27 13:14:00', '2025-10-27 13:14:00'),
  (6, 'PROD-E-200006', '4K Action Camera V3', '4K Action Camera V3 full description', 259.99, 'https://cdn.example.com/images/actioncam-v3.jpg', 4.5, 3, 3, 1, '2025-10-27 13:15:00', '2025-10-27 13:15:00'),
  (7, 'PROD-E-200007', 'Smart Home Hub S2', 'Smart Home Hub S2 full description', 129.00, 'https://cdn.example.com/images/hub-s2.jpg', 4.0, 2, 1, 1, '2025-10-27 13:16:00', '2025-10-27 13:16:00'),
  (8, 'PROD-E-200008', 'USB-C Dock Pro', 'USB-C Dock Pro full description', 199.00, 'https://cdn.example.com/images/dock-pro.jpg', 4.3, 2, 1, 1, '2025-10-27 13:17:00', '2025-10-27 13:17:00'),
  (9, 'PROD-E-200009', 'Noise Cancelling Headphones N10', 'Noise Cancelling Headphones N10 full description', 249.00, 'https://cdn.example.com/images/nc-headphones-n10.jpg', 4.7, 3, 2, 1, '2025-10-27 13:18:00', '2025-10-27 13:18:00');

-- 5) Reviews (user comments + rating)
INSERT INTO reviews (id, user_id, product_id, rating, comment, created_at) VALUES
  (1, 1, 1, 5, 'Great sound and battery life.', '2025-10-27 13:20:00'),
  (2, 2, 4, 5, 'Fast and reliable SSD.', '2025-10-27 13:21:00'),
  (3, 3, 2, 4, 'Very thin and lightweight, good battery.', '2025-10-27 13:22:00'),
  (4, 4, 5, 3, 'Comfortable but mic could be better.', '2025-10-27 13:23:00'),
  (5, 5, 9, 5, 'Excellent noise cancelation!', '2025-10-27 13:24:00');

-- 6) Orders + order_items (capture title/price/image snapshot)
INSERT INTO orders (id, user_id, total_amount, created_at) VALUES
  (1, 1, 199.98, '2025-10-27 13:30:00'),
  (2, 3, 1299.00, '2025-10-27 13:31:00'),
  (3, 5, 249.00, '2025-10-27 13:32:00');

INSERT INTO order_items (id, order_id, product_id, quantity, title_snapshot, price_snapshot, image_url_snapshot, created_at) VALUES
  (1, 1, 1, 2, 'Wireless Earbuds Z1', 99.99, 'https://cdn.example.com/images/earbuds-z1.jpg', '2025-10-27 13:30:00'),
  (2, 2, 2, 1, 'Ultrabook Slim 14', 1299.00, 'https://cdn.example.com/images/ultrabook-14.jpg', '2025-10-27 13:31:00'),
  (3, 3, 9, 1, 'Noise Cancelling Headphones N10', 249.00, 'https://cdn.example.com/images/nc-headphones-n10.jpg', '2025-10-27 13:32:00');