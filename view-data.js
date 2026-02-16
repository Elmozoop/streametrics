// View all database tables and data
const mysql = require('mysql2/promise');

async function viewAllData() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Kundan@7601',
      database: 'ott'
    });
    
    console.log('✅ Connected to ott database\n');
    console.log('═'.repeat(80));
    
    // 1. Users
    console.log('\n👥 USERS:');
    console.log('─'.repeat(80));
    const [users] = await connection.query('SELECT * FROM users');
    console.table(users);
    
    // 2. Movies
    console.log('\n🎬 MOVIES:');
    console.log('─'.repeat(80));
    const [movies] = await connection.query('SELECT movie_id, movie_name, genre, rating, duration_minutes, storage_size_mb FROM movies');
    console.table(movies);
    
    // 3. User Activity
    console.log('\n📊 USER ACTIVITY:');
    console.log('─'.repeat(80));
    const [activity] = await connection.query(`
      SELECT ua.*, u.username 
      FROM user_activity ua 
      JOIN users u ON ua.user_id = u.user_id
    `);
    console.table(activity);
    
    // 4. Watch History
    console.log('\n📺 WATCH HISTORY:');
    console.log('─'.repeat(80));
    const [history] = await connection.query(`
      SELECT 
        wh.history_id,
        u.username,
        m.movie_name,
        m.genre,
        wh.watched_at,
        wh.watch_duration_minutes,
        wh.completed,
        wh.rating_given
      FROM watch_history wh
      JOIN users u ON wh.user_id = u.user_id
      JOIN movies m ON wh.movie_id = m.movie_id
      ORDER BY wh.watched_at DESC
    `);
    console.table(history);
    
    // 5. Notifications
    console.log('\n🔔 NOTIFICATIONS:');
    console.log('─'.repeat(80));
    const [notifications] = await connection.query(`
      SELECT n.*, u.username 
      FROM notifications n 
      JOIN users u ON n.user_id = u.user_id
    `);
    if (notifications.length === 0) {
      console.log('  (No notifications yet)');
    } else {
      console.table(notifications);
    }
    
    // 6. Subscriptions
    console.log('\n💳 SUBSCRIPTIONS:');
    console.log('─'.repeat(80));
    const [subs] = await connection.query(`
      SELECT s.*, u.username 
      FROM subscriptions s 
      JOIN users u ON s.user_id = u.user_id
    `);
    console.table(subs);
    
    // 7. Storage Analytics
    console.log('\n💾 STORAGE ANALYTICS:');
    console.log('─'.repeat(80));
    const [storage] = await connection.query(`
      SELECT sa.*, u.username 
      FROM storage_analytics sa 
      JOIN users u ON sa.user_id = u.user_id
      ORDER BY sa.total_storage_used_mb DESC
    `);
    console.table(storage);
    
    // Summary Statistics
    console.log('\n📈 SUMMARY STATISTICS:');
    console.log('═'.repeat(80));
    
    const [stats] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM movies) as total_movies,
        (SELECT COUNT(*) FROM watch_history) as total_watch_records,
        (SELECT COUNT(*) FROM notifications) as total_notifications,
        (SELECT SUM(total_storage_used_mb) FROM storage_analytics) as total_storage_mb,
        (SELECT SUM(total_storage_used_mb)/1024 FROM storage_analytics) as total_storage_gb
    `);
    
    console.table(stats);
    
    // Inactive Users
    console.log('\n⚠️  INACTIVE USERS (90+ days):');
    console.log('─'.repeat(80));
    const [inactive] = await connection.query(`
      SELECT 
        u.username,
        u.email,
        ua.last_login,
        DATEDIFF(NOW(), ua.last_login) as days_inactive,
        sa.total_storage_used_mb
      FROM users u
      JOIN user_activity ua ON u.user_id = ua.user_id
      JOIN storage_analytics sa ON u.user_id = sa.user_id
      WHERE DATEDIFF(NOW(), ua.last_login) >= 90
      ORDER BY days_inactive DESC
    `);
    
    if (inactive.length === 0) {
      console.log('  ✅ No inactive users found!');
    } else {
      console.table(inactive);
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ Data view complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

viewAllData();
