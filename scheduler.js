// Scheduler - runs notification job daily
// This can be run as a separate process or integrated with server

const mysql = require('mysql2/promise');
const NotificationService = require('./notification-service');

// DB config
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || 'Kundan@7601';
const DB_NAME = process.env.DB_NAME || 'ott';

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
  
  notificationService = new NotificationService(pool);
  console.log('✅ Database connected for scheduler');
}

async function runDailyJob() {
  console.log(`\n🕐 Running daily notification job at ${new Date().toLocaleString()}`);
  
  try {
    const result = await notificationService.runNotificationJob();
    
    if (result.success) {
      console.log(`✅ Job completed: ${result.sent}/${result.total} notifications sent`);
    } else {
      console.error('❌ Job failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Job error:', error);
  }
}

async function startScheduler() {
  await initDb();
  
  console.log('🚀 Notification Scheduler Started');
  console.log('📅 Will check for inactive users daily at midnight');
  
  // Run immediately on start (for testing)
  console.log('\n🧪 Running initial check...');
  await runDailyJob();
  
  // Schedule to run every 24 hours (86400000 ms)
  // In production, use node-cron or similar for precise scheduling
  setInterval(async () => {
    await runDailyJob();
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  console.log('\n⏰ Scheduler is running. Press Ctrl+C to stop.');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down scheduler...');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

// Start the scheduler
startScheduler().catch(err => {
  console.error('Failed to start scheduler:', err);
  process.exit(1);
});
