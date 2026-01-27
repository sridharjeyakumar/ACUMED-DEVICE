-- ACUMED DEVICES Production & Inventory Management System
-- Database Schema Documentation (SQL-like representation)

-- ============================================
-- 1. MENU MASTER
-- ============================================
-- Collection: menumasters
-- Purpose: Defines all menu items available in the system

CREATE TABLE MenuMaster (
    menu_id VARCHAR(3) PRIMARY KEY,              -- Char(3) - PK
    menu_desc VARCHAR(100) NOT NULL,             -- Char(100)
    active BOOLEAN NOT NULL DEFAULT TRUE,        -- Boolean
    last_modified_user_id VARCHAR(5),             -- Char(5)
    last_modified_date_time DATETIME,            -- Date
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_menu_id (menu_id)
);

-- ============================================
-- 2. ROLE MASTER
-- ============================================
-- Collection: rolemasters
-- Purpose: Defines user roles within the system

CREATE TABLE RoleMaster (
    roll_id VARCHAR(3) PRIMARY KEY,              -- Char(3) - PK
    roll_description VARCHAR(50) NOT NULL,       -- Char(50)
    remarks VARCHAR(100),                        -- Char(100)
    active BOOLEAN NOT NULL DEFAULT TRUE,        -- Boolean
    last_modified_user_id VARCHAR(5),            -- Char(5)
    last_modified_date_time DATETIME,           -- Date
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_roll_id (roll_id)
);

-- ============================================
-- 3. MENU ACCESS MASTER
-- ============================================
-- Collection: menuaccessmasters
-- Purpose: Defines which roles have access to which menu items and what actions they can perform

CREATE TABLE MenuAccessMaster (
    rold_id VARCHAR(3) NOT NULL,                 -- Char(3) - FK to RoleMaster.roll_id
    menu_id VARCHAR(3) NOT NULL,                 -- Char(3) - FK to MenuMaster.menu_id
    access BOOLEAN NOT NULL DEFAULT TRUE,        -- Boolean
    can_add BOOLEAN NOT NULL DEFAULT TRUE,       -- Boolean
    can_edit BOOLEAN NOT NULL DEFAULT TRUE,      -- Boolean
    can_view BOOLEAN NOT NULL DEFAULT TRUE,      -- Boolean
    can_cancel BOOLEAN NOT NULL DEFAULT TRUE,    -- Boolean
    last_modified_user_id VARCHAR(5),            -- Char(5)
    last_modified_date_time DATETIME,           -- Date
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (rold_id, menu_id),
    FOREIGN KEY (rold_id) REFERENCES RoleMaster(roll_id),
    FOREIGN KEY (menu_id) REFERENCES MenuMaster(menu_id),
    INDEX idx_rold_menu (rold_id, menu_id)
);

-- ============================================
-- 4. USER MASTER
-- ============================================
-- Collection: usermasters
-- Purpose: Stores user account information and credentials

CREATE TABLE UserMaster (
    user_id VARCHAR(10) PRIMARY KEY,             -- Char(10) - PK
    employee_id VARCHAR(5) NOT NULL,             -- Char(5) - FK (default: same as user_id)
    hash_password VARCHAR(255) NOT NULL,         -- Hash (bcrypt)
    role_id VARCHAR(3),                          -- Char(3) - FK to RoleMaster.roll_id
    Date_password_changed_date DATE,             -- Date
    Date_password_expiry_date DATE,              -- Date
    N_password_expiry_days INT CHECK (N_password_expiry_days >= 0 AND N_password_expiry_days <= 999), -- N(3)
    Date_last_login_date DATE,                   -- Date
    Time_last_login_time TIME,                   -- Time
    active BOOLEAN NOT NULL DEFAULT TRUE,         -- Boolean
    last_modified_user_id VARCHAR(5),            -- Char(5)
    last_modified_date_time DATETIME,           -- Date
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_employee_id (employee_id),
    FOREIGN KEY (role_id) REFERENCES RoleMaster(roll_id)
);

-- ============================================
-- 5. USER LOGIN HISTORY
-- ============================================
-- Collection: userloginhistories
-- Purpose: Records user login and logout events
-- Note: An entry is created whenever a user logs in or logs out

CREATE TABLE UserLoginHistory (
    _id VARCHAR(24) PRIMARY KEY,                  -- MongoDB ObjectId (auto-generated)
    user_id VARCHAR(10) NOT NULL,                -- Char(10) - FK to UserMaster.user_id
    Date_login_Date DATE,                        -- Date
    Time_login_Time TIME,                        -- Time
    Date_Logout_Date DATE,                       -- Date
    Time_Logout_Time TIME,                       -- Time
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_login_date (Date_login_Date),
    FOREIGN KEY (user_id) REFERENCES UserMaster(user_id)
);

-- ============================================
-- RELATIONSHIPS SUMMARY
-- ============================================
-- 1. MenuAccessMaster.rold_id → RoleMaster.roll_id
-- 2. MenuAccessMaster.menu_id → MenuMaster.menu_id
-- 3. UserMaster.role_id → RoleMaster.roll_id
-- 4. UserLoginHistory.user_id → UserMaster.user_id

-- ============================================
-- COMMON AUDIT FIELDS
-- ============================================
-- All master tables include:
-- - last_modified_user_id (VARCHAR(5))
-- - last_modified_date_time (DATETIME)
-- - createdAt (DATETIME) - Auto-generated
-- - updatedAt (DATETIME) - Auto-generated

