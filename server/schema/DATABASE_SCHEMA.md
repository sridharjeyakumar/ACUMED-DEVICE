# Database Schema Documentation

## Overview
This document describes the complete database schema for the ACUMED DEVICES Production & Inventory Management System.

---

## 1. Menu Master

**Collection Name:** `menumasters`

**Purpose:** Defines all menu items available in the system.

### Schema Definition

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `menu_id` | String | Char(3), PK, Required, Unique, MaxLength: 3 | Primary key - Unique identifier for menu item |
| `menu_desc` | String | Char(100), Required, MaxLength: 100 | Menu description/name |
| `active` | Boolean | Required, Default: true | Whether the menu item is active |
| `last_modified_user_id` | String | Char(5), Optional, MaxLength: 5 | ID of user who last modified this record |
| `last_modified_date_time` | Date | Optional | Date and time of last modification |
| `createdAt` | Date | Auto-generated | Timestamp when record was created |
| `updatedAt` | Date | Auto-generated | Timestamp when record was last updated |

### Indexes
- `menu_id` (unique index)

### Example Data
```json
{
  "menu_id": "M01",
  "menu_desc": "Product Master",
  "active": true,
  "last_modified_user_id": "ADMIN",
  "last_modified_date_time": "2026-01-27T15:00:00.000Z"
}
```

---

## 2. Role Master

**Collection Name:** `rolemasters`

**Purpose:** Defines user roles within the system.

### Schema Definition

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `roll_id` | String | Char(3), PK, Required, Unique, MaxLength: 3 | Primary key - Unique identifier for role |
| `roll_description` | String | Char(50), Required, MaxLength: 50 | Role description/name |
| `remarks` | String | Char(100), Optional, MaxLength: 100 | Additional notes about the role |
| `active` | Boolean | Required, Default: true | Whether the role is active |
| `last_modified_user_id` | String | Char(5), Optional, MaxLength: 5 | ID of user who last modified this record |
| `last_modified_date_time` | Date | Optional | Date and time of last modification |
| `createdAt` | Date | Auto-generated | Timestamp when record was created |
| `updatedAt` | Date | Auto-generated | Timestamp when record was last updated |

### Indexes
- `roll_id` (unique index)

### Example Data
```json
{
  "roll_id": "ADM",
  "roll_description": "Admin",
  "remarks": "All",
  "active": true,
  "last_modified_user_id": "ADMIN",
  "last_modified_date_time": "2026-01-27T15:00:00.000Z"
}
```

---

## 3. Menu Access Master

**Collection Name:** `menuaccessmasters`

**Purpose:** Defines which roles have access to which menu items and what actions they can perform.

### Schema Definition

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `rold_id` | String | Char(3), FK, Required, MaxLength: 3 | Foreign key to RoleMaster.roll_id |
| `menu_id` | String | Char(3), FK, Required, MaxLength: 3 | Foreign key to MenuMaster.menu_id |
| `access` | Boolean | Required, Default: true | General access permission |
| `can_add` | Boolean | Required, Default: true | Permission to add records |
| `can_edit` | Boolean | Required, Default: true | Permission to edit records |
| `can_view` | Boolean | Required, Default: true | Permission to view records |
| `can_cancel` | Boolean | Required, Default: true | Permission to cancel operations |
| `last_modified_user_id` | String | Char(5), Optional, MaxLength: 5 | ID of user who last modified this record |
| `last_modified_date_time` | Date | Optional | Date and time of last modification |
| `createdAt` | Date | Auto-generated | Timestamp when record was created |
| `updatedAt` | Date | Auto-generated | Timestamp when record was last updated |

### Indexes
- Compound unique index on `{ rold_id: 1, menu_id: 1 }`

### Example Data
```json
{
  "rold_id": "ADM",
  "menu_id": "M01",
  "access": true,
  "can_add": true,
  "can_edit": true,
  "can_view": true,
  "can_cancel": true,
  "last_modified_user_id": "ADMIN",
  "last_modified_date_time": "2026-01-27T15:00:00.000Z"
}
```

---

## 4. User Master

**Collection Name:** `usermasters`

**Purpose:** Stores user account information and credentials.

### Schema Definition

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `user_id` | String | Char(10), PK, Required, Unique, MaxLength: 10 | Primary key - Unique identifier for user |
| `employee_id` | String | Char(5), FK, Required, MaxLength: 5 | Foreign key to Employee Master (default: same as user_id) |
| `hash_password` | String | Required | Hashed password using bcrypt |
| `role_id` | String | Char(3), FK, Optional, MaxLength: 3 | Foreign key to RoleMaster.roll_id |
| `Date_password_changed_date` | Date | Optional | Date when password was last changed |
| `Date_password_expiry_date` | Date | Optional | Date when password expires |
| `N_password_expiry_days` | Number | Optional, Min: 0, Max: 999 | Number of days until password expires |
| `Date_last_login_date` | Date | Optional | Date of last successful login |
| `Time_last_login_time` | String | Optional | Time of last successful login |
| `active` | Boolean | Required, Default: true | Whether the user account is active |
| `last_modified_user_id` | String | Char(5), Optional, MaxLength: 5 | ID of user who last modified this record |
| `last_modified_date_time` | Date | Optional | Date and time of last modification |
| `createdAt` | Date | Auto-generated | Timestamp when record was created |
| `updatedAt` | Date | Auto-generated | Timestamp when record was last updated |

### Indexes
- `user_id` (unique index)
- `employee_id` (index)

### Example Data
```json
{
  "user_id": "E1001",
  "employee_id": "E1001",
  "hash_password": "$2b$10$...",
  "role_id": "ADM",
  "Date_password_changed_date": "2026-01-27T00:00:00.000Z",
  "Date_password_expiry_date": "2026-04-27T00:00:00.000Z",
  "N_password_expiry_days": 90,
  "Date_last_login_date": "2026-01-27T00:00:00.000Z",
  "Time_last_login_time": "09:30:00",
  "active": true,
  "last_modified_user_id": "ADMIN",
  "last_modified_date_time": "2026-01-27T15:00:00.000Z"
}
```

---

## 5. User Login History

**Collection Name:** `userloginhistories`

**Purpose:** Records user login and logout events. An entry is created whenever a user logs in or logs out.

### Schema Definition

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `user_id` | String | Char(10), FK, Required, MaxLength: 10 | Foreign key to UserMaster.user_id |
| `Date_login_Date` | Date | Optional | Date of login |
| `Time_login_Time` | String | Optional | Time of login |
| `Date_Logout_Date` | Date | Optional | Date of logout |
| `Time_Logout_Time` | String | Optional | Time of logout |
| `createdAt` | Date | Auto-generated | Timestamp when record was created |
| `updatedAt` | Date | Auto-generated | Timestamp when record was last updated |

### Indexes
- `user_id` (index)
- `Date_login_Date` (index)

### Example Data
```json
{
  "user_id": "E1001",
  "Date_login_Date": "2026-01-27T00:00:00.000Z",
  "Time_login_Time": "09:30:00",
  "Date_Logout_Date": "2026-01-27T00:00:00.000Z",
  "Time_Logout_Time": "18:00:00"
}
```

---

## Relationships

### Foreign Key Relationships

1. **Menu Access Master → Role Master**
   - `MenuAccessMaster.rold_id` → `RoleMaster.roll_id`

2. **Menu Access Master → Menu Master**
   - `MenuAccessMaster.menu_id` → `MenuMaster.menu_id`

3. **User Master → Role Master**
   - `UserMaster.role_id` → `RoleMaster.roll_id`

4. **User Login History → User Master**
   - `UserLoginHistory.user_id` → `UserMaster.user_id`

---

## Common Fields

All master tables include the following audit fields:
- `last_modified_user_id` (Char 5) - ID of user who last modified the record
- `last_modified_date_time` (Date) - Date and time of last modification
- `createdAt` (Date) - Auto-generated creation timestamp
- `updatedAt` (Date) - Auto-generated update timestamp

---

## Data Types Reference

- **Char(n)**: String with maximum length of n characters
- **PK**: Primary Key (unique identifier)
- **FK**: Foreign Key (reference to another table)
- **Date**: JavaScript Date object stored as MongoDB Date
- **Time**: String in format "HH:MM:SS"
- **Boolean**: true/false value
- **Number(n)**: Numeric value with constraints (min/max)

---

## Notes

1. All timestamps are automatically managed by Mongoose using the `timestamps: true` option.
2. Password hashing is done using bcryptjs with salt rounds of 10.
3. The `last_modified_user_id` and `last_modified_date_time` fields are automatically set by the API handlers on create/update operations.
4. Default password for seeded users: `password123`


