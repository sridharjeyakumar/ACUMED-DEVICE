# MongoDB Schemas

This directory contains MongoDB schemas for the ACUMED DEVICES application.

## Database Connection

The database connection is configured in `server/db/connection.ts`. It uses the `Database` environment variable from your `.env` file.

## Models

### 1. Menu Master (`MenuMaster`)
Stores menu items/pages available in the application.

**Fields:**
- `menu_id` (String, 3 chars, PK): Unique identifier (e.g., "M00", "T00", "D00", "R00")
- `menu_desc` (String, 100 chars): Menu description
- `active` (Boolean): Whether the menu is active

### 2. Role Master (`RoleMaster`)
Defines user roles in the application.

**Fields:**
- `roll_id` (String, 3 chars, PK): Unique role identifier (e.g., "OPR", "SVR", "MGR", "ADM")
- `roll_description` (String, 50 chars): Role description
- `remarks` (String, 100 chars): Additional notes about the role
- `active` (Boolean): Whether the role is active

### 3. Menu Access Master (`MenuAccessMaster`)
Specifies which roles have access to which menu items and their permissions.

**Fields:**
- `rold_id` (String, 3 chars, FK): Reference to RoleMaster
- `menu_id` (String, 3 chars, FK): Reference to MenuMaster
- `access` (Boolean): General access permission
- `can_add` (Boolean): Permission to add records
- `can_edit` (Boolean): Permission to edit records
- `can_view` (Boolean): Permission to view records
- `can_cancel` (Boolean): Permission to cancel/delete records

### 4. User Master (`UserMaster`)
Stores user account information.

**Fields:**
- `user_id` (String, 10 chars, PK): Unique user identifier
- `employee_id` (String, 5 chars, FK): Reference to employee
- `hash_password` (String): Hashed password
- `Date_password_changed_date` (Date): Last password change date
- `Date_password_expiry_date` (Date): Password expiry date
- `N_password_expiry_days` (Number): Days until password expires
- `Date_last_login_date` (Date): Last login date
- `Time_last_login_time` (String): Last login time
- `active` (Boolean): Whether the user account is active

### 5. User Login History (`UserLoginHistory`)
Records login and logout history for users.

**Fields:**
- `user_id` (String, 10 chars, FK): Reference to UserMaster
- `Date_login_Date` (Date): Login date
- `Time_login_Time` (String): Login time
- `Date_Logout_Date` (Date): Logout date
- `Time_Logout_Time` (String): Logout time

## Usage

```typescript
import connectDB from './db/connection';
import { MenuMaster, RoleMaster } from './models';

// Connect to database
await connectDB();

// Create a new menu
const menu = new MenuMaster({
  menu_id: 'M00',
  menu_desc: 'Masters',
  active: true,
});
await menu.save();

// Find menus
const menus = await MenuMaster.find({ active: true });
```

## Example

See `server/example-usage.ts` for complete usage examples.


