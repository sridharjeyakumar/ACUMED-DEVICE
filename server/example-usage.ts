/**
 * Example usage of the MongoDB schemas
 * This file demonstrates how to use the models to interact with the database
 */

import connectDB from './db/connection';
import {
  MenuMaster,
  RoleMaster,
  MenuAccessMaster,
  UserMaster,
  UserLoginHistory,
} from './models';

// Example: Connect to database and create records
async function exampleUsage() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Example 1: Create a Menu Master record
    const menuMaster = new MenuMaster({
      menu_id: 'M00',
      menu_desc: 'Masters',
      active: true,
    });
    await menuMaster.save();
    console.log('Menu Master created:', menuMaster);

    // Example 2: Create a Role Master record
    const roleMaster = new RoleMaster({
      roll_id: 'ADM',
      roll_description: 'Admin',
      remarks: 'All',
      active: true,
    });
    await roleMaster.save();
    console.log('Role Master created:', roleMaster);

    // Example 3: Create a Menu Access Master record
    const menuAccess = new MenuAccessMaster({
      rold_id: 'ADM',
      menu_id: 'M00',
      access: true,
      can_add: true,
      can_edit: true,
      can_view: true,
      can_cancel: true,
    });
    await menuAccess.save();
    console.log('Menu Access Master created:', menuAccess);

    // Example 4: Create a User Master record
    const userMaster = new UserMaster({
      user_id: 'AD',
      employee_id: 'E1001',
      hash_password: 'hashed_password_here',
      active: true,
    });
    await userMaster.save();
    console.log('User Master created:', userMaster);

    // Example 5: Create a User Login History record
    const loginHistory = new UserLoginHistory({
      user_id: 'AD',
      Date_login_Date: new Date(),
      Time_login_Time: '09:00:00',
    });
    await loginHistory.save();
    console.log('User Login History created:', loginHistory);

    // Example queries
    // Find all active menus
    const activeMenus = await MenuMaster.find({ active: true });
    console.log('Active menus:', activeMenus);

    // Find role by ID
    const role = await RoleMaster.findOne({ roll_id: 'ADM' });
    console.log('Role found:', role);

    // Find menu access for a specific role
    const roleAccess = await MenuAccessMaster.find({ rold_id: 'ADM' });
    console.log('Role access:', roleAccess);

  } catch (error) {
    console.error('Error in example usage:', error);
  }
}

// Uncomment to run the example
// exampleUsage();

export default exampleUsage;


