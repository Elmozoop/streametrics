// Quick fix: Drop and recreate database
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASS = 'Kundan@7601';

async function resetDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      multipleStatements: true
    });
    
    console.log('✅ Connected');
    console.log('🗑️  Dropping old database (if exists)...');
    
    // Drop existing database
    await connection.query('DROP DATABASE IF EXISTS ott;');
    
    console.log('📋 Creating fresh database...');
    
    // Read and execute SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'database-setup.sql'), 'utf8');
    await connection.query(sqlFile);
    
    console.log('\n✅ SUCCESS! Database created with all tables:');
    console.log('  ✓ users (4 demo users)');
    console.log('  ✓ movies (5 movies)');
    console.log('  ✓ user_activity');
    console.log('  ✓ watch_history');
    console.log('  ✓ notifications');
    console.log('  ✓ subscriptions');
    console.log('  ✓ storage_analytics');
    console.log('\n🎉 Ready! Now run: npm run dev');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

resetDatabase();
