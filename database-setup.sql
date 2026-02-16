-- ============================================================
-- OTT PLATFORM DATABASE MANAGEMENT SYSTEM
-- Complete Schema for College DBMS Project
-- ============================================================
-- Project by: Kunal Kumar (RA2411026010747) & Yash Raj (RA2411026010746)
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS ott;
USE ott;

-- ============================================================
-- ENTITY 1: USERS
-- Purpose: Store user account information
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(15) DEFAULT NULL,
  subscription_type ENUM('FREE', 'BASIC', 'PREMIUM') DEFAULT 'FREE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_email_format CHECK (email LIKE '%@%.%'),
  
  -- Indexes for performance
  INDEX idx_email (email),
  INDEX idx_subscription (subscription_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Stores user account details';

-- ============================================================
-- ENTITY 2: MOVIES
-- Purpose: Store movie catalog information
-- ============================================================
CREATE TABLE IF NOT EXISTS movies (
  movie_id INT AUTO_INCREMENT PRIMARY KEY,
  movie_name VARCHAR(200) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  release_year INT DEFAULT NULL,
  duration_minutes INT DEFAULT NULL,
  rating DECIMAL(3,1) DEFAULT 0.0,
  director VARCHAR(150) DEFAULT NULL,
  language VARCHAR(50) DEFAULT 'English',
  description TEXT DEFAULT NULL,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  video_url VARCHAR(500) DEFAULT NULL,
  storage_size_mb DECIMAL(10,2) DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_year CHECK (release_year >= 1900 AND release_year <= 2100),
  CONSTRAINT chk_rating CHECK (rating >= 0.0 AND rating <= 10.0),
  CONSTRAINT chk_duration CHECK (duration_minutes > 0),
  
  -- Indexes
  INDEX idx_genre (genre),
  INDEX idx_rating (rating),
  INDEX idx_release_year (release_year),
  INDEX idx_movie_name (movie_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Stores movie catalog and metadata';

-- ============================================================
-- ENTITY 3: USER_ACTIVITY
-- Purpose: Track user login and activity patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS user_activity (
  activity_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  last_login DATETIME NOT NULL,
  last_watch DATETIME DEFAULT NULL,
  total_watch_time_minutes INT DEFAULT 0,
  login_count INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at DATETIME DEFAULT NULL,
  
  -- Foreign Key
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_user_activity (user_id, last_login),
  INDEX idx_inactive_check (last_login, is_active, notification_sent),
  INDEX idx_active_users (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks user activity and inactivity for notifications';

-- ============================================================
-- ENTITY 4: WATCH_HISTORY (Relationship Entity)
-- Purpose: Many-to-Many relationship between Users and Movies
-- ============================================================
CREATE TABLE IF NOT EXISTS watch_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  user_id INT NOT NULL,
  watched_at DATETIME NOT NULL,
  watch_duration_minutes INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  rating_given DECIMAL(3,1) DEFAULT NULL,
  
  -- Foreign Keys (establishes relationships)
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_rating_given CHECK (rating_given IS NULL OR (rating_given >= 0.0 AND rating_given <= 10.0)),
  CONSTRAINT chk_watch_duration CHECK (watch_duration_minutes >= 0),
  
  -- Indexes
  INDEX idx_user_movie (user_id, movie_id),
  INDEX idx_watched_at (watched_at),
  INDEX idx_user_history (user_id, watched_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Many-to-Many relationship: Users watch Movies';

-- ============================================================
-- ENTITY 5: NOTIFICATIONS
-- Purpose: Store system notifications to users
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  notification_type ENUM('INACTIVE_WARNING', 'ACCOUNT_DELETION', 'NEW_CONTENT', 'SUBSCRIPTION', 'GENERAL') DEFAULT 'GENERAL',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  action_taken BOOLEAN DEFAULT FALSE,
  action_taken_at DATETIME DEFAULT NULL,
  
  -- Foreign Key
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_user_notif (user_id, is_read),
  INDEX idx_notif_type (notification_type),
  INDEX idx_sent_at (sent_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Stores all user notifications';

-- ============================================================
-- ENTITY 6: SUBSCRIPTIONS
-- Purpose: Track subscription history and payments
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_type ENUM('FREE', 'BASIC', 'PREMIUM') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  auto_renew BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_dates CHECK (end_date >= start_date),
  CONSTRAINT chk_amount CHECK (amount_paid >= 0),
  
  -- Indexes
  INDEX idx_user_subscription (user_id, end_date DESC),
  INDEX idx_payment_status (payment_status),
  INDEX idx_active_subscriptions (end_date, payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks subscription plans and payment history';

-- ============================================================
-- ENTITY 7: STORAGE_ANALYTICS
-- Purpose: Track storage usage per user for cleanup
-- ============================================================
CREATE TABLE IF NOT EXISTS storage_analytics (
  analytics_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_movies_watched INT DEFAULT 0,
  total_storage_used_mb DECIMAL(10,2) DEFAULT 0.0,
  cache_size_mb DECIMAL(10,2) DEFAULT 0.0,
  last_calculated DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Unique constraint: one record per user
  UNIQUE KEY unique_user_analytics (user_id),
  
  -- Indexes
  INDEX idx_storage_usage (total_storage_used_mb DESC),
  INDEX idx_last_calculated (last_calculated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks storage usage per user for cleanup recommendations';

-- ============================================================
-- INSERT SAMPLE DATA FOR DEMO
-- ============================================================

-- Insert demo users
INSERT INTO users (user_id, username, email, phone, subscription_type, created_at) VALUES
(1, 'demo_user', 'demo@example.com', '9876543210', 'PREMIUM', NOW()),
(2, 'inactive_user', 'inactive@example.com', '9876543211', 'BASIC', DATE_SUB(NOW(), INTERVAL 4 MONTH)),
(3, 'kunal_kumar', 'kunal@ott.com', '9876543212', 'PREMIUM', DATE_SUB(NOW(), INTERVAL 2 MONTH)),
(4, 'yash_raj', 'yash@ott.com', '9876543213', 'FREE', DATE_SUB(NOW(), INTERVAL 100 DAY))
ON DUPLICATE KEY UPDATE username=username;

-- Insert demo movies
INSERT INTO movies (movie_id, movie_name, genre, release_year, duration_minutes, rating, director, language, storage_size_mb) VALUES
(101, 'The Silent Sea', 'Sci-Fi', 2024, 142, 8.5, 'Christopher Nolan', 'English', 2450.50),
(102, 'Midnight Sun', 'Romance', 2023, 118, 7.8, 'James Cameron', 'English', 1890.25),
(103, 'City of Echoes', 'Thriller', 2025, 135, 8.9, 'Denis Villeneuve', 'English', 2100.75),
(104, 'Road to Autumn', 'Drama', 2024, 156, 9.1, 'Martin Scorsese', 'English', 2680.00),
(105, 'Galactic Drift', 'Adventure', 2025, 168, 8.7, 'Ridley Scott', 'English', 3200.50)
ON DUPLICATE KEY UPDATE movie_name=movie_name;

-- Insert user activity records
INSERT INTO user_activity (user_id, last_login, last_watch, total_watch_time_minutes, login_count, is_active, notification_sent) VALUES
(1, NOW(), NOW(), 450, 125, TRUE, FALSE),
(2, DATE_SUB(NOW(), INTERVAL 95 DAY), DATE_SUB(NOW(), INTERVAL 95 DAY), 180, 45, TRUE, FALSE),
(3, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 320, 88, TRUE, FALSE),
(4, DATE_SUB(NOW(), INTERVAL 98 DAY), DATE_SUB(NOW(), INTERVAL 98 DAY), 95, 22, TRUE, FALSE)
ON DUPLICATE KEY UPDATE last_login=VALUES(last_login);

-- Insert watch history (establishes Many-to-Many relationship)
INSERT INTO watch_history (user_id, movie_id, watched_at, watch_duration_minutes, completed, rating_given) VALUES
(1, 101, NOW(), 142, TRUE, 9.0),
(1, 103, DATE_SUB(NOW(), INTERVAL 1 DAY), 135, TRUE, 8.5),
(1, 105, DATE_SUB(NOW(), INTERVAL 3 DAY), 168, TRUE, 8.0),
(2, 102, DATE_SUB(NOW(), INTERVAL 95 DAY), 118, TRUE, 7.5),
(3, 104, DATE_SUB(NOW(), INTERVAL 5 DAY), 156, TRUE, 9.5),
(3, 101, DATE_SUB(NOW(), INTERVAL 8 DAY), 142, TRUE, 8.5),
(4, 103, DATE_SUB(NOW(), INTERVAL 98 DAY), 60, FALSE, NULL)
ON DUPLICATE KEY UPDATE watched_at=VALUES(watched_at);

-- Insert subscriptions
INSERT INTO subscriptions (user_id, plan_type, start_date, end_date, amount_paid, payment_status, auto_renew) VALUES
(1, 'PREMIUM', DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 11 MONTH), 1499.00, 'COMPLETED', TRUE),
(2, 'BASIC', DATE_SUB(NOW(), INTERVAL 4 MONTH), DATE_ADD(NOW(), INTERVAL 8 MONTH), 499.00, 'COMPLETED', FALSE),
(3, 'PREMIUM', DATE_SUB(NOW(), INTERVAL 2 MONTH), DATE_ADD(NOW(), INTERVAL 10 MONTH), 1499.00, 'COMPLETED', TRUE),
(4, 'FREE', DATE_SUB(NOW(), INTERVAL 100 DAY), DATE_ADD(NOW(), INTERVAL 265 DAY), 0.00, 'COMPLETED', FALSE);

-- Insert storage analytics
INSERT INTO storage_analytics (user_id, total_movies_watched, total_storage_used_mb, cache_size_mb) VALUES
(1, 3, 7751.75, 450.25),
(2, 1, 1890.25, 120.50),
(3, 2, 5130.50, 380.00),
(4, 1, 2100.75, 150.00);

-- ============================================================
-- USEFUL QUERIES FOR PROJECT DEMO
-- ============================================================

-- Query 1: Find inactive users (90+ days)
-- SELECT u.user_id, u.username, u.email, ua.last_login, 
--        DATEDIFF(NOW(), ua.last_login) as days_inactive
-- FROM users u
-- INNER JOIN user_activity ua ON u.user_id = ua.user_id
-- WHERE DATEDIFF(NOW(), ua.last_login) >= 90 AND ua.is_active = TRUE;

-- Query 2: Total storage used by all users
-- SELECT SUM(total_storage_used_mb) as total_storage_mb,
--        SUM(total_storage_used_mb)/1024 as total_storage_gb
-- FROM storage_analytics;

-- Query 3: Most watched movies
-- SELECT m.movie_name, m.genre, COUNT(wh.history_id) as watch_count
-- FROM movies m
-- LEFT JOIN watch_history wh ON m.movie_id = wh.movie_id
-- GROUP BY m.movie_id
-- ORDER BY watch_count DESC;

-- Query 4: User watch history with movie details
-- SELECT u.username, m.movie_name, m.genre, wh.watched_at, wh.rating_given
-- FROM watch_history wh
-- INNER JOIN users u ON wh.user_id = u.user_id
-- INNER JOIN movies m ON wh.movie_id = m.movie_id
-- ORDER BY wh.watched_at DESC;

-- Query 5: Storage cleanup recommendations (inactive users using storage)
-- SELECT u.username, u.email, sa.total_storage_used_mb,
--        DATEDIFF(NOW(), ua.last_login) as days_inactive
-- FROM users u
-- INNER JOIN user_activity ua ON u.user_id = ua.user_id
-- INNER JOIN storage_analytics sa ON u.user_id = sa.user_id
-- WHERE DATEDIFF(NOW(), ua.last_login) >= 90
-- ORDER BY sa.total_storage_used_mb DESC;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
