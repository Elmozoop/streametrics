# 🎬 OTT Inactive User Notification System - Demo Guide

## Quick Demo Steps

### 1. Setup Database (One-time)

```bash
mysql -u root -p
```

Then run:
```sql
source database-setup.sql;
-- OR copy-paste the SQL from database-setup.sql
```

This creates:
- `users` table with demo users
- `user_activity` table (tracks last login/watch)
- `watch_history` table (existing)
- `notifications` table (stores notifications)

### 2. Start the Server

```bash
npm run dev
```

Server will start on:
- Local: `http://localhost:3000`
- Network: `http://10.106.141.197:3000`

### 3. Test the Feature

#### Option A: View Notifications (Frontend)

1. Open browser: `http://localhost:3000`
2. Click 🔔 bell icon in top right
3. You'll see notifications page with any inactive user alerts

#### Option B: Manual API Testing

**Check who is inactive:**
```bash
curl http://localhost:3000/api/check-inactive-users
```

**Send notifications to inactive users:**
```bash
curl -X POST http://localhost:3000/api/send-notifications
```

**View user's notifications:**
```bash
curl http://localhost:3000/api/notifications/2
```

(User ID 2 is pre-configured as inactive in demo data)

### 4. Run Automated Scheduler

In a **separate terminal**:

```bash
npm run scheduler
```

This will:
- ✅ Run immediately on start (test mode)
- 📋 Find all users inactive for 90+ days
- 📧 Send notifications to them
- ⏰ Schedule to run every 24 hours automatically

Output will look like:
```
🚀 Notification Scheduler Started
📅 Will check for inactive users daily at midnight
🧪 Running initial check...
🔄 Starting inactive user notification job...
📋 Found 1 inactive user(s)
✅ Notification sent to inactive_user (inactive@example.com)
✅ Job completed: 1/1 notifications sent
⏰ Scheduler is running. Press Ctrl+C to stop.
```

### 5. Test User Actions

#### As an Inactive User:

1. Open notifications page: `http://localhost:3000/notifications.html`
2. You'll see warning notification with options:
   - **Login & Continue Using** → Takes you to main page
   - **Delete My Account** → Removes all user data
   - **Dismiss** → Hides notification (demo only)

#### Delete Account Flow:

When user clicks "Delete My Account":
- Shows confirmation dialog
- Sends DELETE request to `/api/user/:userId`
- Removes user from `users` table
- Cascades to delete all related:
  - Watch history
  - User activity
  - Notifications

## Demo Scenario

### Scenario: College Project Demo

**Story:**
"Imagine a user named 'inactive_user' who subscribed to our OTT platform but stopped using it 95 days ago. Our system automatically detected this inactivity and sent them a notification."

**Show:**
1. Open notifications page for user 2
2. Point out the warning message
3. Explain the 90-day threshold
4. Show the delete account option
5. (Optional) Trigger the scheduler to demonstrate automation

### Testing Tips

**Create your own test inactive user:**

```sql
-- Add a new inactive user
INSERT INTO users (username, email, created_at) VALUES
('test_user', 'test@example.com', DATE_SUB(NOW(), INTERVAL 5 MONTH));

-- Set last login to 100 days ago
INSERT INTO user_activity (user_id, last_login, last_watch, is_active) VALUES
(LAST_INSERT_ID(), DATE_SUB(NOW(), INTERVAL 100 DAY), DATE_SUB(NOW(), INTERVAL 100 DAY), TRUE);
```

Then run the notification job:
```bash
curl -X POST http://localhost:3000/api/send-notifications
```

**Check database directly:**

```sql
-- See all notifications
SELECT * FROM notifications;

-- Check user activity status
SELECT 
  u.username, 
  ua.last_login, 
  DATEDIFF(NOW(), ua.last_login) as days_inactive,
  ua.notification_sent
FROM users u
JOIN user_activity ua ON u.user_id = ua.user_id;
```

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │ → Click movies → Update watch_history + user_activity
│  (index.html)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Notifications  │ → View warnings → Delete account option
│    Page         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │ → /api/notifications, /api/send-notifications
│  (server.js)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Notification    │ → Find inactive users (90+ days)
│   Service       │ → Send notifications (DB + optional email)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    MySQL DB     │ → users, user_activity, notifications, watch_history
└─────────────────┘

         ▲
         │
┌────────┴────────┐
│   Scheduler     │ → Runs every 24 hours automatically
│ (scheduler.js)  │
└─────────────────┘
```

## Troubleshooting

**No inactive users found?**
- Check if demo data was inserted: `SELECT * FROM user_activity;`
- Verify dates: `SELECT DATEDIFF(NOW(), last_login) FROM user_activity;`

**Scheduler not sending notifications?**
- Check if `notification_sent` is already TRUE
- Reset: `UPDATE user_activity SET notification_sent = FALSE;`

**Email not working?**
- Email is optional (commented out by default)
- To enable: configure SMTP in environment variables
- See `notification-service.js` line 54

## Production Recommendations

1. **Email Configuration**: Set up proper SMTP credentials
2. **Cron Jobs**: Use `node-cron` or system cron instead of setInterval
3. **Logging**: Add winston or similar logger
4. **Monitoring**: Track notification success/failure rates
5. **Testing**: Add unit tests for notification logic
6. **Rate Limiting**: Add delays between email sends
7. **User Preferences**: Allow users to opt-out of notifications

## Team Members

- **Kunal Kumar** - RA2411026010747
- **Yash Raj** - RA2411026010746

---

**Note**: This is a college DBMS project demonstrating practical database operations, prepared statements, and real-world feature implementation (inactive user management).
