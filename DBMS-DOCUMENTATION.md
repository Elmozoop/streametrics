# 📊 OTT PLATFORM - COMPLETE DBMS DOCUMENTATION

**Project by:** Kunal Kumar (RA2411026010747) & Yash Raj (RA2411026010746)

---

## 🎯 PROJECT OVERVIEW

**Database Name:** `ott`  
**DBMS Used:** MySQL 8.0+  
**Purpose:** OTT (Over-The-Top) streaming platform ka complete database management system jo users, movies, watch history, subscriptions, aur storage management handle karta hai.

---

## 📋 ENTITIES (Tables)

### 1. **USERS** (Main Entity)
User account information store karta hai.

**Primary Key:** `user_id`

**Attributes:**
- `user_id` (INT, AUTO_INCREMENT, PRIMARY KEY) - Unique user identifier
- `username` (VARCHAR(100), NOT NULL) - User ka naam
- `email` (VARCHAR(150), NOT NULL, UNIQUE) - Email address
- `password_hash` (VARCHAR(255)) - Encrypted password
- `phone` (VARCHAR(15)) - Contact number
- `subscription_type` (ENUM: 'FREE', 'BASIC', 'PREMIUM') - Current plan
- `created_at` (DATETIME) - Account creation date
- `updated_at` (DATETIME) - Last update timestamp

**Constraints:**
- Email must be unique
- Email format validation: `email LIKE '%@%.%'`

**Example Data:**
```
user_id=1, username='kunal_kumar', email='kunal@ott.com', subscription_type='PREMIUM'
```

---

### 2. **MOVIES** (Main Entity)
Movie catalog aur metadata store karta hai.

**Primary Key:** `movie_id`

**Attributes:**
- `movie_id` (INT, AUTO_INCREMENT, PRIMARY KEY) - Unique movie identifier
- `movie_name` (VARCHAR(200), NOT NULL) - Movie title
- `genre` (VARCHAR(100), NOT NULL) - Category (Sci-Fi, Romance, etc.)
- `release_year` (INT) - Release year (1900-2100)
- `duration_minutes` (INT) - Movie length
- `rating` (DECIMAL(3,1)) - Rating 0.0-10.0
- `director` (VARCHAR(150)) - Director name
- `language` (VARCHAR(50)) - Language (default: English)
- `description` (TEXT) - Movie plot/summary
- `thumbnail_url` (VARCHAR(500)) - Poster image URL
- `video_url` (VARCHAR(500)) - Video file URL
- `storage_size_mb` (DECIMAL(10,2)) - File size in MB
- `created_at` (DATETIME) - Added to catalog date
- `updated_at` (DATETIME) - Last update

**Constraints:**
- `release_year` BETWEEN 1900 AND 2100
- `rating` BETWEEN 0.0 AND 10.0
- `duration_minutes` > 0

**Example Data:**
```
movie_id=101, movie_name='The Silent Sea', genre='Sci-Fi', rating=8.5, storage_size_mb=2450.50
```

---

### 3. **USER_ACTIVITY** (Dependent Entity)
User activity patterns aur inactivity tracking.

**Primary Key:** `activity_id`  
**Foreign Key:** `user_id` → REFERENCES `users(user_id)`

**Attributes:**
- `activity_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `user_id` (INT, NOT NULL, FOREIGN KEY)
- `last_login` (DATETIME, NOT NULL) - Last login timestamp
- `last_watch` (DATETIME) - Last movie watched time
- `total_watch_time_minutes` (INT) - Total viewing time
- `login_count` (INT) - Total login count
- `is_active` (BOOLEAN) - Active status flag
- `notification_sent` (BOOLEAN) - Notification status
- `notification_sent_at` (DATETIME) - Notification time

**Relationship:** 1:1 with USERS (One user has one activity record)

**Example Data:**
```
activity_id=1, user_id=1, last_login='2026-02-07 10:30:00', total_watch_time_minutes=450
```

---

### 4. **WATCH_HISTORY** (Relationship/Junction Entity)
Users aur Movies ke beech Many-to-Many relationship.

**Primary Key:** `history_id`  
**Foreign Keys:**  
- `user_id` → REFERENCES `users(user_id)`  
- `movie_id` → REFERENCES `movies(movie_id)`

**Attributes:**
- `history_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `movie_id` (INT, NOT NULL, FOREIGN KEY)
- `user_id` (INT, NOT NULL, FOREIGN KEY)
- `watched_at` (DATETIME, NOT NULL) - Watch timestamp
- `watch_duration_minutes` (INT) - How long watched
- `completed` (BOOLEAN) - Fully watched or not
- `rating_given` (DECIMAL(3,1)) - User's rating

**Relationship Type:** Many-to-Many  
- One user can watch many movies
- One movie can be watched by many users

**Constraints:**
- `rating_given` BETWEEN 0.0 AND 10.0 (or NULL)
- `watch_duration_minutes` >= 0

**Example Data:**
```
history_id=1, user_id=1, movie_id=101, watched_at='2026-02-07 14:00:00', completed=TRUE, rating_given=9.0
```

---

### 5. **NOTIFICATIONS** (Dependent Entity)
System notifications to users.

**Primary Key:** `notification_id`  
**Foreign Key:** `user_id` → REFERENCES `users(user_id)`

**Attributes:**
- `notification_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `user_id` (INT, NOT NULL, FOREIGN KEY)
- `notification_type` (ENUM: 'INACTIVE_WARNING', 'ACCOUNT_DELETION', 'NEW_CONTENT', 'SUBSCRIPTION', 'GENERAL')
- `title` (VARCHAR(200), NOT NULL) - Notification heading
- `message` (TEXT, NOT NULL) - Full message
- `sent_at` (DATETIME) - Sent timestamp
- `is_read` (BOOLEAN) - Read status
- `action_taken` (BOOLEAN) - Action status
- `action_taken_at` (DATETIME) - Action timestamp

**Relationship:** Many:1 with USERS (One user can have many notifications)

**Example Data:**
```
notification_id=1, user_id=2, notification_type='INACTIVE_WARNING', title='Account Inactive', is_read=FALSE
```

---

### 6. **SUBSCRIPTIONS** (Dependent Entity)
Subscription plans aur payment history.

**Primary Key:** `subscription_id`  
**Foreign Key:** `user_id` → REFERENCES `users(user_id)`

**Attributes:**
- `subscription_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `user_id` (INT, NOT NULL, FOREIGN KEY)
- `plan_type` (ENUM: 'FREE', 'BASIC', 'PREMIUM')
- `start_date` (DATE, NOT NULL) - Subscription start
- `end_date` (DATE, NOT NULL) - Subscription end
- `amount_paid` (DECIMAL(10,2)) - Payment amount
- `payment_status` (ENUM: 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')
- `auto_renew` (BOOLEAN) - Auto renewal flag
- `created_at` (DATETIME) - Record creation

**Constraints:**
- `end_date` >= `start_date`
- `amount_paid` >= 0

**Relationship:** Many:1 with USERS (One user can have multiple subscription records)

**Example Data:**
```
subscription_id=1, user_id=1, plan_type='PREMIUM', amount_paid=1499.00, payment_status='COMPLETED'
```

---

### 7. **STORAGE_ANALYTICS** (Dependent Entity)
Per-user storage usage tracking for cleanup recommendations.

**Primary Key:** `analytics_id`  
**Foreign Key:** `user_id` → REFERENCES `users(user_id)`  
**Unique Constraint:** One record per user

**Attributes:**
- `analytics_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `user_id` (INT, NOT NULL, FOREIGN KEY, UNIQUE)
- `total_movies_watched` (INT) - Movie count
- `total_storage_used_mb` (DECIMAL(10,2)) - Total storage
- `cache_size_mb` (DECIMAL(10,2)) - Cache size
- `last_calculated` (DATETIME) - Last calculation time

**Relationship:** 1:1 with USERS (One user has one analytics record)

**Example Data:**
```
analytics_id=1, user_id=1, total_storage_used_mb=7751.75, total_movies_watched=3
```

---

## 🔗 RELATIONSHIPS (ER Diagram)

### 1. **USERS ↔ USER_ACTIVITY** (1:1)
- One user has **exactly one** activity record
- **Cardinality:** 1:1
- **Delete Rule:** CASCADE (User delete hone par activity bhi delete)

### 2. **USERS ↔ WATCH_HISTORY ↔ MOVIES** (Many:Many)
- One user can watch **many movies**
- One movie can be watched by **many users**
- **Junction Table:** `watch_history`
- **Cardinality:** M:N
- **Delete Rule:** CASCADE (User/Movie delete par history delete)

### 3. **USERS ↔ NOTIFICATIONS** (1:Many)
- One user can have **many notifications**
- One notification belongs to **one user**
- **Cardinality:** 1:N
- **Delete Rule:** CASCADE

### 4. **USERS ↔ SUBSCRIPTIONS** (1:Many)
- One user can have **many subscription records** (history)
- One subscription belongs to **one user**
- **Cardinality:** 1:N
- **Delete Rule:** CASCADE

### 5. **USERS ↔ STORAGE_ANALYTICS** (1:1)
- One user has **exactly one** analytics record
- **Cardinality:** 1:1
- **Delete Rule:** CASCADE

---

## 📐 ER DIAGRAM (Text Format)

```
┌─────────────────┐
│     USERS       │ (Main Entity)
├─────────────────┤
│ PK: user_id     │
│ username        │
│ email (UNIQUE)  │
│ subscription    │
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         │ 1:1                              │ 1:1
         ▼                                  ▼
┌─────────────────┐              ┌──────────────────┐
│ USER_ACTIVITY   │              │ STORAGE_ANALYTICS│
├─────────────────┤              ├──────────────────┤
│ PK: activity_id │              │ PK: analytics_id │
│ FK: user_id     │              │ FK: user_id(UNQ) │
│ last_login      │              │ storage_used_mb  │
│ notification    │              │ total_movies     │
└─────────────────┘              └──────────────────┘

         │
         │ 1:N
         ▼
┌─────────────────┐              ┌─────────────────┐
│ NOTIFICATIONS   │              │  SUBSCRIPTIONS  │
├─────────────────┤              ├─────────────────┤
│PK:notification_id│             │PK:subscription_id│
│ FK: user_id     │              │ FK: user_id     │
│ type            │              │ plan_type       │
│ message         │              │ payment_status  │
└─────────────────┘              └─────────────────┘
         ▲                                  ▲
         │ 1:N                              │ 1:N
         │                                  │
         └──────────────────────────────────┘


         ┌─────────────────┐
         │     USERS       │
         └────────┬────────┘
                  │
                  │ M:N
                  ▼
         ┌─────────────────┐        ┌─────────────────┐
         │ WATCH_HISTORY   │────────│    MOVIES       │
         │ (Junction)      │   N:1  │                 │
         ├─────────────────┤        ├─────────────────┤
         │ PK: history_id  │        │ PK: movie_id    │
         │ FK: user_id     │        │ movie_name      │
         │ FK: movie_id    │        │ genre           │
         │ watched_at      │        │ rating          │
         │ rating_given    │        │ storage_size_mb │
         └─────────────────┘        └─────────────────┘
```

---

## 🎓 DBMS CONCEPTS APPLIED

### 1. **Schema (स्कीमा)**
Schema = Database ka structure/blueprint

**Humara OTT Schema:**
```sql
DATABASE: ott
  ├── users (7 attributes)
  ├── movies (14 attributes)
  ├── user_activity (9 attributes)
  ├── watch_history (7 attributes)
  ├── notifications (10 attributes)
  ├── subscriptions (9 attributes)
  └── storage_analytics (6 attributes)
```

### 2. **Entity (एंटिटी)**
Entity = Real-world object jo database mein store hota hai

**Humari Entities:**
1. **Strong Entities** (Independent):
   - `USERS` - Self-sufficient
   - `MOVIES` - Self-sufficient

2. **Weak Entities** (Dependent):
   - `USER_ACTIVITY` - Depends on USERS
   - `NOTIFICATIONS` - Depends on USERS
   - `SUBSCRIPTIONS` - Depends on USERS
   - `STORAGE_ANALYTICS` - Depends on USERS

3. **Junction Entity** (Relationship):
   - `WATCH_HISTORY` - USERS aur MOVIES ko connect karta hai

### 3. **Attributes (विशेषताएँ)**
Attributes = Entity ki properties/characteristics

**Types in our project:**

**Simple Attributes:**
- `username` (single value)
- `email` (single value)
- `genre` (single value)

**Composite Attributes:**
- User full details = `username` + `email` + `phone`
- Movie metadata = `movie_name` + `genre` + `director`

**Derived Attributes:**
- `days_inactive` = `DATEDIFF(NOW(), last_login)` (calculated)
- `total_storage_gb` = `total_storage_used_mb / 1024` (calculated)

**Multi-valued Attributes:**
- Movie can have multiple genres (currently simplified to one)
- User can have multiple subscriptions over time

**Key Attributes:**
- `user_id` - Primary Key (unique identifier)
- `movie_id` - Primary Key
- `email` - Candidate Key (unique, can be primary key)

### 4. **Relationships (संबंध)**

**Types used:**

**One-to-One (1:1):**
- `USERS` ↔ `USER_ACTIVITY`
- `USERS` ↔ `STORAGE_ANALYTICS`

**One-to-Many (1:N):**
- `USERS` ↔ `NOTIFICATIONS` (One user, many notifications)
- `USERS` ↔ `SUBSCRIPTIONS` (One user, many subscription records)

**Many-to-Many (M:N):**
- `USERS` ↔ `MOVIES` via `WATCH_HISTORY`
  - One user watches many movies
  - One movie watched by many users

### 5. **Integrity Constraints (अखंडता बाधाएं)**

**Entity Integrity:**
- Every table has PRIMARY KEY (NOT NULL + UNIQUE)
- Example: `user_id`, `movie_id`

**Referential Integrity:**
- FOREIGN KEYs maintain relationships
- Example: `watch_history.user_id` REFERENCES `users.user_id`
- **ON DELETE CASCADE** - Parent delete par child bhi delete

**Domain Integrity:**
- Data type constraints
- `rating` BETWEEN 0.0 AND 10.0
- `email` LIKE '%@%.%'
- `release_year` BETWEEN 1900 AND 2100

**Key Constraints:**
- PRIMARY KEY (unique, not null)
- UNIQUE constraint on `email`
- FOREIGN KEY constraints

### 6. **Normalization (सामान्यीकरण)**

**Our database is in 3NF (Third Normal Form):**

**1NF:** ✅ No multivalued attributes, atomic values only
**2NF:** ✅ No partial dependencies (all non-key attributes fully depend on primary key)
**3NF:** ✅ No transitive dependencies

**Example:**
- `user_id` → `username`, `email` (direct dependency)
- NOT: `user_id` → `subscription_id` → `plan_type` (transitive)

### 7. **Indexes (सूचकांक)**
Performance improvement ke liye:
```sql
INDEX idx_email ON users(email);
INDEX idx_genre ON movies(genre);
INDEX idx_user_movie ON watch_history(user_id, movie_id);
```

---

## 🔍 IMPORTANT SQL QUERIES

### Query 1: Find Inactive Users (90+ days)
```sql
SELECT 
    u.username, 
    u.email, 
    ua.last_login,
    DATEDIFF(NOW(), ua.last_login) as days_inactive,
    sa.total_storage_used_mb
FROM users u
INNER JOIN user_activity ua ON u.user_id = ua.user_id
INNER JOIN storage_analytics sa ON u.user_id = sa.user_id
WHERE DATEDIFF(NOW(), ua.last_login) >= 90
ORDER BY days_inactive DESC;
```

### Query 2: Most Watched Movies
```sql
SELECT 
    m.movie_name, 
    m.genre,
    COUNT(wh.history_id) as watch_count,
    AVG(wh.rating_given) as avg_rating
FROM movies m
LEFT JOIN watch_history wh ON m.movie_id = wh.movie_id
GROUP BY m.movie_id
ORDER BY watch_count DESC;
```

### Query 3: User Watch History with Details
```sql
SELECT 
    u.username,
    m.movie_name,
    m.genre,
    wh.watched_at,
    wh.watch_duration_minutes,
    wh.completed,
    wh.rating_given
FROM watch_history wh
INNER JOIN users u ON wh.user_id = u.user_id
INNER JOIN movies m ON wh.movie_id = m.movie_id
ORDER BY wh.watched_at DESC;
```

### Query 4: Storage Cleanup Recommendations
```sql
SELECT 
    u.username,
    sa.total_storage_used_mb,
    DATEDIFF(NOW(), ua.last_login) as days_inactive,
    CASE 
        WHEN DATEDIFF(NOW(), ua.last_login) >= 90 THEN 'DELETE RECOMMENDED'
        ELSE 'KEEP'
    END as recommendation
FROM users u
INNER JOIN user_activity ua ON u.user_id = ua.user_id
INNER JOIN storage_analytics sa ON u.user_id = sa.user_id
ORDER BY sa.total_storage_used_mb DESC;
```

---

## 📊 PROJECT STATISTICS

- **Total Entities:** 7
- **Relationships:** 5
- **Attributes:** 62 (total across all tables)
- **Constraints:** 15+ (CHECK, UNIQUE, FOREIGN KEY, NOT NULL)
- **Indexes:** 20+
- **Sample Records:** 20+ (for demo)

---

## ✅ CONCLUSION

Yeh ek **complete enterprise-level DBMS design** hai jo:
- ✅ Proper normalization (3NF)
- ✅ All relationship types (1:1, 1:N, M:N)
- ✅ Integrity constraints
- ✅ Referential integrity with CASCADE
- ✅ Real-world use case (inactive user management)
- ✅ Performance optimization (indexes)
- ✅ Scalable schema design

**Perfect for college DBMS project submission!** 🎓

---

**Developed by:**  
Kunal Kumar - RA2411026010747  
Yash Raj - RA2411026010746
