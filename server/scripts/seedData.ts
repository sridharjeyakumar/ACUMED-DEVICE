/**
 * Seed script to initialize the database with initial data
 * Based on the Excel spreadsheet data
 */

import connectDB from '../db/connection';
import MenuMaster from '../models/MenuMaster';
import RoleMaster from '../models/RoleMaster';
import MenuAccessMaster from '../models/MenuAccessMaster';
import UserMaster from '../models/UserMaster';
import UserLoginHistory from '../models/UserLoginHistory';
import bcrypt from 'bcryptjs';

async function seedData() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    await MenuMaster.deleteMany({});
    await RoleMaster.deleteMany({});
    await MenuAccessMaster.deleteMany({});
    await UserMaster.deleteMany({});
    await UserLoginHistory.deleteMany({});
    console.log('Cleared existing data');

    const currentDate = new Date();
    const defaultPassword = await bcrypt.hash('password123', 10);

    // Seed Menu Master - Based on Excel data
    const menuData = [
      // Masters Section
      { menu_id: 'M00', menu_desc: 'Masters', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M01', menu_desc: 'Product Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M02', menu_desc: 'Material Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M03', menu_desc: 'Production Capacity Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M04', menu_desc: 'Pack size Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M05', menu_desc: 'Carton Type Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M06', menu_desc: 'Carton capacity Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M07', menu_desc: 'Product BOM', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M08', menu_desc: 'Packing BOM', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M09', menu_desc: 'Collection Bin Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M10', menu_desc: 'Product Status Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M11', menu_desc: 'Material Status Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M12', menu_desc: 'Employee Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      
      // Transactions Section
      { menu_id: 'T00', menu_desc: 'Production Plan', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'T01', menu_desc: 'Production Update', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'T02', menu_desc: 'Packing Update', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'T03', menu_desc: 'Daily Production Record', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      
      // Dashboard Section
      { menu_id: 'D00', menu_desc: 'Dashboard', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'D01', menu_desc: 'Product movement', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'D02', menu_desc: 'Material movement', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      
      // Reports Section
      { menu_id: 'R00', menu_desc: 'Reports', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'R01', menu_desc: 'Production Report', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'R02', menu_desc: 'Stock Report', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
    ];

    await MenuMaster.insertMany(menuData);
    console.log(`Inserted ${menuData.length} menu records`);

    // Seed Role Master - Based on Excel data
    const roleData = [
      {
        roll_id: 'OPR',
        roll_description: 'Operator',
        remarks: 'Data entry only',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        roll_id: 'SVR',
        roll_description: 'Supervisor',
        remarks: 'Posting',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        roll_id: 'MGR',
        roll_description: 'Manager',
        remarks: 'PO, COA, Dashboard Reports',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        roll_id: 'ADM',
        roll_description: 'Admin',
        remarks: 'All',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await RoleMaster.insertMany(roleData);
    console.log(`Inserted ${roleData.length} role records`);

    // Seed Menu Access Master - Based on Excel data
    // Note: Admin has access to "ALL" - we'll create a special entry for this
    const menuAccessData = [
      // Admin has access to ALL menus - create entries for all menu IDs
      ...menuData.map(menu => ({
        rold_id: 'ADM',
        menu_id: menu.menu_id,
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      })),
      
      // Operator has access to Production Update (T01) and Packing Update (T02)
      {
        rold_id: 'OPR',
        menu_id: 'T01',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        rold_id: 'OPR',
        menu_id: 'T02',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      
      // Supervisor has access to Daily Production Record (T03)
      {
        rold_id: 'SVR',
        menu_id: 'T03',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      
      // Manager has access to Production Report (R01), Stock Report (R02), Product movement (D01), Material movement (D02)
      {
        rold_id: 'MGR',
        menu_id: 'R01',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        rold_id: 'MGR',
        menu_id: 'R02',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        rold_id: 'MGR',
        menu_id: 'D01',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        rold_id: 'MGR',
        menu_id: 'D02',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await MenuAccessMaster.insertMany(menuAccessData);
    console.log(`Inserted ${menuAccessData.length} menu access records`);

    // Seed User Master - Based on Excel data (E1001, E1002, E1003, E1004)
    const passwordExpiryDate = new Date(currentDate);
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 90);

    const userData = [
      {
        user_id: 'E1001',
        employee_id: 'E1001',
        hash_password: defaultPassword,
        role_id: 'ADM',
        Date_password_changed_date: currentDate,
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        user_id: 'E1002',
        employee_id: 'E1002',
        hash_password: defaultPassword,
        role_id: 'ADM',
        Date_password_changed_date: currentDate,
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        user_id: 'E1003',
        employee_id: 'E1003',
        hash_password: defaultPassword,
        role_id: 'MGR',
        Date_password_changed_date: currentDate,
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        user_id: 'E1004',
        employee_id: 'E1004',
        hash_password: defaultPassword,
        role_id: 'OPR',
        Date_password_changed_date: currentDate,
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await UserMaster.insertMany(userData);
    console.log(`Inserted ${userData.length} user records`);

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${menuData.length} Menu Master records`);
    console.log(`   - ${roleData.length} Role Master records`);
    console.log(`   - ${menuAccessData.length} Menu Access Master records`);
    console.log(`   - ${userData.length} User Master records`);
    console.log('\n🔑 Default password for all users: password123');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    if (error.code === 11000) {
      console.error('   Duplicate key error - some records may already exist');
    }
    process.exit(1);
  }
}

// Run the seed script
seedData();
