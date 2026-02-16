// Notification Service - handles inactive user detection and notifications

const nodemailer = require('nodemailer');

class NotificationService {
  constructor(pool) {
    this.pool = pool;
    
    // Email configuration (use env variables in production)
    this.emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }

  /**
   * Find users inactive for 90+ days (3 months)
   * Returns list of inactive users who haven't been notified yet
   */
  async findInactiveUsers(daysInactive = 90) {
    const sql = `
      SELECT 
        u.user_id, 
        u.username, 
        u.email,
        ua.last_login,
        ua.notification_sent,
        DATEDIFF(NOW(), ua.last_login) as days_inactive
      FROM users u
      INNER JOIN user_activity ua ON u.user_id = ua.user_id
      WHERE ua.is_active = TRUE
        AND ua.notification_sent = FALSE
        AND DATEDIFF(NOW(), ua.last_login) >= ?
      ORDER BY ua.last_login ASC
    `;
    
    const [rows] = await this.pool.execute(sql, [daysInactive]);
    return rows;
  }

  /**
   * Send notification to inactive user
   * Supports both email and in-app notification
   */
  async sendInactiveNotification(user) {
    const title = '⚠️ Your OTT Account is Inactive';
    const message = `
      Hi ${user.username},
      
      We noticed you haven't logged in to your OTT account for ${user.days_inactive} days (since ${new Date(user.last_login).toLocaleDateString()}).
      
      Your account is taking up storage space. If you're no longer using OTT, we recommend deleting your account to free up resources.
      
      📊 Your Data:
      - Watch history
      - Preferences
      - Saved content
      
      👉 Action Required:
      - Login to continue using OTT
      - OR Delete your account to free storage
      
      If you don't take action within 30 days, your account may be automatically deleted.
      
      Thanks,
      OTT Platform Team
    `;

    try {
      // 1. Save notification to database
      const insertSql = `
        INSERT INTO notifications (user_id, notification_type, title, message)
        VALUES (?, 'INACTIVE_WARNING', ?, ?)
      `;
      await this.pool.execute(insertSql, [user.user_id, title, message]);

      // 2. Mark user as notified
      const updateSql = `
        UPDATE user_activity 
        SET notification_sent = TRUE, notification_sent_at = NOW()
        WHERE user_id = ?
      `;
      await this.pool.execute(updateSql, [user.user_id]);

      // 3. Send email (optional - comment out if no email setup)
      /*
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@ott.com',
        to: user.email,
        subject: title,
        text: message,
        html: this.createEmailHTML(user, message)
      });
      */

      console.log(`✅ Notification sent to ${user.username} (${user.email})`);
      return { success: true, user_id: user.user_id };
    } catch (error) {
      console.error(`❌ Failed to send notification to ${user.username}:`, error);
      return { success: false, user_id: user.user_id, error: error.message };
    }
  }

  /**
   * HTML email template for better formatting
   */
  createEmailHTML(user, message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4; }
          .content { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { color: #7c3aed; font-size: 24px; margin-bottom: 20px; }
          .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .footer { text-align: center; color: #999; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">⚠️ Your OTT Account is Inactive</div>
            <p>Hi <strong>${user.username}</strong>,</p>
            <p>We noticed you haven't logged in for <strong>${user.days_inactive} days</strong> (since ${new Date(user.last_login).toLocaleDateString()}).</p>
            
            <div class="warning">
              <strong>📊 Your account is using storage space</strong><br>
              If you're no longer using OTT, please consider deleting your account to free up resources.
            </div>
            
            <p><strong>👉 Action Required:</strong></p>
            <ul>
              <li>Login to continue using OTT</li>
              <li>OR Delete your account to free storage</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" class="button">Login to OTT</a>
              <a href="http://localhost:3000/delete-account" class="button" style="background: #dc2626;">Delete Account</a>
            </div>
            
            <p style="color: #999; font-size: 13px;">If you don't take action within 30 days, your account may be automatically deleted.</p>
          </div>
          <div class="footer">
            OTT Platform | DBMS Project<br>
            This is an automated notification
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Run the notification job
   * Finds all inactive users and sends them notifications
   */
  async runNotificationJob() {
    console.log('🔄 Starting inactive user notification job...');
    const startTime = Date.now();

    try {
      const inactiveUsers = await this.findInactiveUsers(90); // 90 days = 3 months
      
      if (inactiveUsers.length === 0) {
        console.log('✅ No inactive users found. All users are active!');
        return { success: true, count: 0 };
      }

      console.log(`📋 Found ${inactiveUsers.length} inactive user(s)`);
      
      const results = [];
      for (const user of inactiveUsers) {
        const result = await this.sendInactiveNotification(user);
        results.push(result);
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      console.log(`✅ Notification job completed in ${Date.now() - startTime}ms`);
      console.log(`   Success: ${successCount} | Failed: ${failCount}`);

      return { success: true, total: inactiveUsers.length, sent: successCount, failed: failCount };
    } catch (error) {
      console.error('❌ Notification job failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete inactive user account and all related data
   */
  async deleteInactiveUser(userId) {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Delete will cascade to watch_history, user_activity, notifications due to FK
      const [result] = await connection.execute(
        'DELETE FROM users WHERE user_id = ?',
        [userId]
      );

      await connection.commit();
      
      console.log(`🗑️ User ${userId} and all related data deleted`);
      return { success: true, deletedRows: result.affectedRows };
    } catch (error) {
      await connection.rollback();
      console.error(`❌ Failed to delete user ${userId}:`, error);
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }
}

module.exports = NotificationService;
