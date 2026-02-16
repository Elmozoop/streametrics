# OTT DBMS Mini Project (Frontend → Backend → MySQL)

This is a minimal demo showing how a frontend can POST a `movie_id` to a Node/Express backend which records the action in a MySQL `watch_history` table.

**✨ NEW FEATURE: Inactive User Notification System**
- Automatically detects users inactive for 90+ days (3 months)
- Sends notifications reminding them to login or delete account
- Helps free up storage space by removing inactive accounts
- Admin dashboard to manually trigger notifications

Files added:
- `index.html` — frontend UI with 5 clickable movie cards + notification bell
- `style.css` — styles for cards and notifications
- `script.js` — sends POST requests to backend and shows a small success message
- `server.js` — Express backend that inserts into MySQL using prepared statements
- `notification-service.js` — handles inactive user detection and notification sending
- `notifications.html` — user-facing notification page
- `scheduler.js` — automated daily job to check and notify inactive users
- `database-setup.sql` — complete SQL schema for all tables

Prerequisites
- Node.js (v14+ recommended) and `npm`
- MySQL server

Quick setup

1. Clone / copy the project folder and open it in a terminal.

2. Create the database and tables in MySQL:

```bash
mysql -u root -p < database-setup.sql
```

Or run this SQL manually:

```sql
CREATE DATABASE IF NOT EXISTS ott;
USE ott;

-- See database-setup.sql for complete schema
```

3. Install dependencies:

```bash
cd /path/to/ott-dbms-project
npm init -y
npm install express mysql2 nodemailer
```

4. Configure DB credentials (optional):

By default `server.js` uses:

- host: `localhost`
- user: `root`
- password: `` (empty)
- database: `ott`

To override, set environment variables before running the server (zsh):

```bash
export DB_HOST=your_host
export DB_USER=your_user
export DB_PASS=your_password
export DB_NAME=ott
```

5. Run the server:

```bash
npm run dev
```

6. Open the frontend in your browser:

Visit `http://localhost:3000` and click any movie's "Watch / Save" button. The frontend will POST `{ movie_id }` to `/api/movie` and show a brief "Saved ✓" message on success.

## 🔔 Notification System Usage

### View Notifications
- Click the 🔔 bell icon in the navigation bar
- Or visit: `http://localhost:3000/notifications.html`

### Manual Triggers (Admin)

**Check inactive users:**
```bash
curl http://localhost:3000/api/check-inactive-users
```

**Send notifications to all inactive users:**
```bash
curl -X POST http://localhost:3000/api/send-notifications
```

**Get user notifications:**
```bash
curl http://localhost:3000/api/notifications/1
```

### Automated Scheduler

Run the scheduler as a separate process to automatically check daily:

```bash
node scheduler.js
```

The scheduler will:
1. Run immediately on start (for testing)
2. Check for inactive users every 24 hours
3. Send notifications to users inactive for 90+ days
4. Log all activity to console

### How It Works

1. **User Activity Tracking**: Every time a user watches a movie, `user_activity.last_watch` is updated
2. **Inactive Detection**: Scheduler queries users where `DATEDIFF(NOW(), last_login) >= 90`
3. **Notification Sent**: Creates entry in `notifications` table and marks `notification_sent = TRUE`
4. **User Action**: User can login to continue or delete their account
5. **Account Deletion**: All related data (watch history, activity, notifications) is deleted via CASCADE

### Database Tables

- `users` - basic user info
- `user_activity` - tracks login/watch activity and notification status
- `watch_history` - movie watch records
- `notifications` - all user notifications

Notes
- The backend uses a prepared statement with `NOW()` to set the timestamp.
- Notifications are stored in DB even without email configuration
- Email sending is optional (commented out in `notification-service.js`)
- To enable emails, configure SMTP in environment variables
- For production, use a proper cron job instead of setInterval

## Network Access (Other Devices)

To access from other laptops on the same WiFi:
1. Find your IP: Already configured to `10.106.141.197`
2. Server listens on `0.0.0.0` (all interfaces)
3. Access from other device: `http://10.106.141.197:3000`

## API Endpoints

- `POST /api/movie` - Save watch history
- `GET /api/notifications/:userId` - Get user notifications
- `GET /api/check-inactive-users` - Check inactive users (admin)
- `POST /api/send-notifications` - Send notifications (admin)
- `DELETE /api/user/:userId` - Delete user account

If you'd like, I can also:
- add a `.env` example and `dotenv` support, or
- make the server serve files from a dedicated `public/` folder.
- add email template customization
