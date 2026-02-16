// Verify and list tables in ott database
const mysql = require('mysql2/promise');

async function verifyTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Kundan@7601',
      database: 'ott'
    });
    
    console.log('✅ Connected to ott database\n');
    
    // List all tables
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found! Need to create tables.');
    } else {
      console.log('📋 Tables in ott database:');
      tables.forEach((row, index) => {
        const tableName = Object.values(row)[0];
        console.log(`  ${index + 1}. ${tableName}`);
      });
    }
    
    // Check notifications table specifically
    console.log('\n🔍 Checking notifications table...');
    try {
      const [rows] = await connection.query('SELECT COUNT(*) as count FROM notifications');
      console.log(`✅ notifications table exists with ${rows[0].count} records`);
    } catch (err) {
      console.log('❌ notifications table does NOT exist');
      console.log('\n💡 Fix: Run this command:');
      console.log('   node reset-db.js');
    }
    
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('❌ Database "ott" does not exist!');
      console.log('\n💡 Fix: Run this command:');
      console.log('   node reset-db.js');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    if (connection) await connection.end();
  }
}

verifyTables();
