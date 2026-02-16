// Quick Database Setup Script
// Run this once to create all tables

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASS = 'Kundan@7601';

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    
    // Connect without database first
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      multipleStatements: true
    });
    
    console.log('✅ Connected to MySQL');
    console.log('📋 Reading SQL file...');
    
    // Read SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'database-setup.sql'), 'utf8');
    
    console.log('🚀 Executing SQL statements...');
    
    // Execute all SQL statements
    await connection.query(sqlFile);
    
    console.log('✅ Database setup completed successfully!');
    console.log('\nCreated tables:');
    console.log('  ✓ users');
    console.log('  ✓ movies');
    console.log('  ✓ user_activity');
    console.log('  ✓ watch_history');
    console.log('  ✓ notifications');
    console.log('  ✓ subscriptions');
    console.log('  ✓ storage_analytics');
    console.log('\n✅ Sample data inserted');
    console.log('\n🎉 Ready to use! Run: npm run dev');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n⚠️  Check your MySQL password in this script');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
