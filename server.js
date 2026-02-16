const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const NotificationService = require('./notification-service');

const app = express();
app.use(express.json());

// DB config - override with environment variables if needed
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || 'Kundan@7601';
const DB_NAME = process.env.DB_NAME || 'ott';
const PORT = process.env.PORT || 3000;

let pool;
let notificationService;

async function initDb() {
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  
  try {
    // Test connection and verify database
    const [rows] = await pool.query('SELECT DATABASE() as db');
    console.log(`MySQL connected to database: ${rows[0].db}`);
    
    // Verify notifications table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'notifications'");
    if (tables.length === 0) {
      console.warn('⚠️  WARNING: notifications table not found!');
      console.warn('💡 Run: node reset-db.js');
    }
  } catch (err) {
    console.error('Database verification failed:', err.message);
  }
  
  // Initialize notification service
  notificationService = new NotificationService(pool);
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const query = `
      SELECT user_id, username, email, phone, subscription_type, password_hash 
      FROM users 
      WHERE email = ? OR phone = ?
    `;

    const [users] = await pool.query(query, [email, email]);

    if (users.length === 0) {
      return res.json({ success: false, message: 'User not found' });
    }

    const user = users[0];

    if (password.length < 6) {
      return res.json({ success: false, message: 'Invalid password' });
    }

    await pool.query(
      'UPDATE user_activity SET last_login = NOW(), login_count = login_count + 1 WHERE user_id = ?',
      [user.user_id]
    );

    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        subscription_type: user.subscription_type
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, phone, password, subscription } = req.body;

    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (existing.length > 0) {
      return res.json({ success: false, message: 'Email or phone already registered' });
    }

    const [result] = await pool.query(
      `INSERT INTO users (username, email, phone, password_hash, subscription_type, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [username, email, phone, password, subscription]
    );

    const userId = result.insertId;

    await pool.query(
      `INSERT INTO user_activity (user_id, last_login, last_watch, login_count, is_active) 
       VALUES (?, NOW(), NULL, 1, TRUE)`,
      [userId]
    );

    await pool.query(
      `INSERT INTO storage_analytics (user_id, total_movies_watched, total_storage_used_mb, cache_size_mb, last_calculated) 
       VALUES (?, 0, 0, 0, NOW())`,
      [userId]
    );

    if (subscription !== 'FREE') {
      const amount = subscription === 'BASIC' ? 499 : 1499;
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_type, start_date, end_date, amount_paid, payment_status, auto_renew, created_at) 
         VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), ?, 'COMPLETED', TRUE, NOW())`,
        [userId, subscription, amount]
      );
    }

    res.json({ success: true, message: 'Account created successfully', userId });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new movie endpoint (Admin feature)
app.post('/api/add-movie', async (req, res) => {
  try {
    const { movie_id, movie_name, genre, director, cast, release_year, rating, duration_minutes, language, description, thumbnail_url, video_url, storage_size_mb } = req.body;

    // Insert new movie
    const [result] = await pool.query(
      `INSERT INTO movies (movie_id, movie_name, genre, director, cast, release_year, rating, duration_minutes, language, description, thumbnail_url, video_url, storage_size_mb, upload_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [movie_id, movie_name, genre, director, cast, release_year, rating, duration_minutes, language, description, thumbnail_url, video_url, storage_size_mb]
    );

    // Get all active users
    const [users] = await pool.query('SELECT user_id, username FROM users');

    // Send notification to all users
    const notificationTitle = '🎬 New Movie Added!';
    const notificationMessage = `Check out our latest addition: "${movie_name}" (${genre}). Watch it now!`;

    for (const user of users) {
      await pool.query(
        `INSERT INTO notifications (user_id, notification_type, title, message, sent_at, is_read) 
         VALUES (?, 'NEW_CONTENT', ?, ?, NOW(), FALSE)`,
        [user.user_id, notificationTitle, notificationMessage]
      );
    }

    console.log(`✅ New movie "${movie_name}" added and ${users.length} notifications sent!`);

    res.json({ 
      success: true, 
      message: 'Movie added successfully', 
      movieId: movie_id,
      notificationsSent: users.length 
    });
  } catch (error) {
    console.error('Add movie error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST API endpoint to receive movie_id and insert into watch_history
app.post('/api/movie', async (req, res) => {
  try {
    const movieId = req.body && Number(req.body.movie_id);
    const userId = req.body && Number(req.body.user_id);
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Please login first' });
    }
    
    if (!movieId || Number.isNaN(movieId)) {
      return res.status(400).json({ success: false, error: 'Invalid movie_id' });
    }

    // Check if movie exists
    const [movieCheck] = await pool.execute('SELECT movie_id FROM movies WHERE movie_id = ?', [movieId]);
    if (movieCheck.length === 0) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    // Insert into watch_history with additional details
    const sql = `INSERT INTO watch_history 
                 (movie_id, user_id, watched_at, watch_duration_minutes, completed) 
                 VALUES (?, ?, NOW(), 0, FALSE)`;
    await pool.execute(sql, [movieId, userId]);
    
    // Update user activity (last_watch time)
    const updateActivity = 'UPDATE user_activity SET last_watch = NOW() WHERE user_id = ?';
    await pool.execute(updateActivity, [userId]);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error in /api/movie:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// API: Get user notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const [notifications] = await pool.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY sent_at DESC 
       LIMIT 20`,
      [userId]
    );
    return res.json({ success: true, notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// API: Check inactive users (manual trigger)
app.get('/api/check-inactive-users', async (req, res) => {
  try {
    const inactiveUsers = await notificationService.findInactiveUsers(90);
    return res.json({ 
      success: true, 
      count: inactiveUsers.length,
      users: inactiveUsers 
    });
  } catch (err) {
    console.error('Error checking inactive users:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Send notifications to inactive users (manual trigger)
app.post('/api/send-notifications', async (req, res) => {
  try {
    const result = await notificationService.runNotificationJob();
    return res.json(result);
  } catch (err) {
    console.error('Error sending notifications:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Delete user account
app.delete('/api/user/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const result = await notificationService.deleteInactiveUser(userId);
    return res.json(result);
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static assets (CSS/JS) and index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.use(express.static(__dirname));

// Get network IP address dynamically
function getNetworkIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'Unable to detect';
}

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    const networkIP = getNetworkIP();
    console.log(`\n✅ Server running on:`);
    console.log(`  📱 Local:   http://localhost:${PORT}`);
    console.log(`  🌐 Network: http://${networkIP}:${PORT}`);
    console.log(`\n💡 Share the Network URL with other devices on same WiFi\n`);
  });
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
