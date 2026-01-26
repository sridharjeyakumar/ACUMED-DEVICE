/**
 * Seed script to initialize the database with initial data
 * Based on the schema design from the database model
 */

import connectDB from '../db/connection';
import {
  MenuMaster,
  RoleMaster,
  MenuAccessMaster,
  UserMaster,
  UserLoginHistory,
} from '../models';

async function seedData() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to database');

    // Clear existing data (optional - comment out if you want to keep existing data)
    await MenuMaster.deleteMany({});
    await RoleMaster.deleteMany({});
    await MenuAccessMaster.deleteMany({});
    await UserMaster.deleteMany({});
    await UserLoginHistory.deleteMany({});
    console.log('Cleared existing data');

    // Seed Menu Master
    const menuData = [
      // Masters Section
      { menu_id: 'M00', menu_desc: 'Masters', active: true },
      { menu_id: 'M01', menu_desc: 'Product Master', active: true },
      { menu_id: 'M02', menu_desc: 'Material Master', active: true },
      { menu_id: 'M03', menu_desc: 'Production Capacity Master', active: true },
      { menu_id: 'M04', menu_desc: 'Pack size Master', active: true },
      { menu_id: 'M05', menu_desc: 'Carton Type Master', active: true },
      { menu_id: 'M06', menu_desc: 'Carton capacity Master', active: true },
      { menu_id: 'M07', menu_desc: 'Product BOM', active: true },
      { menu_id: 'M08', menu_desc: 'Packing BOM', active: true },
      { menu_id: 'M09', menu_desc: 'Collection Bin Master', active: true },
      { menu_id: 'M10', menu_desc: 'Product Status Master', active: true },
      { menu_id: 'M11', menu_desc: 'Material Status Master', active: true },
      { menu_id: 'M12', menu_desc: 'Employee Master', active: true },
      
      // Transactions Section
      { menu_id: 'T00', menu_desc: 'Production Plan', active: true },
      { menu_id: 'T01', menu_desc: 'Production Update', active: true },
      { menu_id: 'T02', menu_desc: 'Packing Update', active: true },
      { menu_id: 'T03', menu_desc: 'Daily Production Record', active: true },
      
      // Dashboard Section
      { menu_id: 'D00', menu_desc: 'Dashboard', active: true },
      { menu_id: 'D01', menu_desc: 'Product movement', active: true },
      { menu_id: 'D02', menu_desc: 'Material movement', active: true },
      
      // Reports Section
      { menu_id: 'R00', menu_desc: 'Reports', active: true },
      { menu_id: 'R01', menu_desc: 'Production Report', active: true },
      { menu_id: 'R02', menu_desc: 'Stock Report', active: true },
    ];

    await MenuMaster.insertMany(menuData);
    console.log(`Inserted ${menuData.length} menu records`);

    // Seed Role Master
    const roleData = [
      {
        roll_id: 'OPR',
        roll_description: 'Operator',
        remarks: 'Data entry only',
        active: true,
      },
      {
        roll_id: 'SVR',
        roll_description: 'Supervisor',
        remarks: 'Posting',
        active: true,
      },
      {
        roll_id: 'MGR',
        roll_description: 'Manager',
        remarks: 'PO, COA, Dashboard Reports',
        active: true,
      },
      {
        roll_id: 'ADM',
        roll_description: 'Admin',
        remarks: 'All',
        active: true,
      },
    ];

    await RoleMaster.insertMany(roleData);
    console.log(`Inserted ${roleData.length} role records`);

    // Seed Menu Access Master
    const menuAccessData = [
      // Admin has access to ALL menus
      ...menuData.map(menu => ({
        rold_id: 'ADM',
        menu_id: menu.menu_id,
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
      })),
      
      // Operator has access to Production Update and Packing Update
      {
        rold_id: 'OPR',
        menu_id: 'T01',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
      },
      {
        rold_id: 'OPR',
        menu_id: 'T02',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
      },
      
      // Supervisor has access to Daily Production Record
      {
        rold_id: 'SVR',
        menu_id: 'T03',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
      },
      
      // Manager has access to Reports and Dashboard
      {
        rold_id: 'MGR',
        menu_id: 'R01',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
      },
      {
        rold_id: 'MGR',
        menu_id: 'R02',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
      },
      {
        rold_id: 'MGR',
        menu_id: 'D01',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
      },
      {
        rold_id: 'MGR',
        menu_id: 'D02',
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
      },
    ];

    await MenuAccessMaster.insertMany(menuAccessData);
    console.log(`Inserted ${menuAccessData.length} menu access records`);

    // Seed User Master
    const currentDate = new Date();
    const passwordExpiryDate = new Date(currentDate);
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 90); // 90 days from now

    const userData = [
      {
        user_id: 'AD',
        employee_id: 'E1001',
        hash_password: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // Dummy hash for "admin123"
        Date_password_changed_date: new Date('2024-01-15'),
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        Date_last_login_date: new Date('2024-01-25'),
        Time_last_login_time: '09:30:00',
        active: true,
      },
      {
        user_id: 'OP1',
        employee_id: 'E1002',
        hash_password: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // Dummy hash for "operator123"
        Date_password_changed_date: new Date('2024-01-10'),
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        Date_last_login_date: new Date('2024-01-25'),
        Time_last_login_time: '08:15:00',
        active: true,
      },
      {
        user_id: 'OP2',
        employee_id: 'E1003',
        hash_password: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // Dummy hash
        Date_password_changed_date: new Date('2024-01-12'),
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        Date_last_login_date: new Date('2024-01-24'),
        Time_last_login_time: '08:00:00',
        active: true,
      },
      {
        user_id: 'SV1',
        employee_id: 'E1004',
        hash_password: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // Dummy hash
        Date_password_changed_date: new Date('2024-01-08'),
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        Date_last_login_date: new Date('2024-01-25'),
        Time_last_login_time: '09:00:00',
        active: true,
      },
      {
        user_id: 'SV2',
        employee_id: 'E1005',
        hash_password: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // Dummy hash
        Date_password_changed_date: new Date('2024-01-14'),
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        Date_last_login_date: new Date('2024-01-24'),
        Time_last_login_time: '10:30:00',
        active: true,
      },
      {
        user_id: 'MG1',
        employee_id: 'E1006',
        hash_password: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // Dummy hash
        Date_password_changed_date: new Date('2024-01-05'),
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        Date_last_login_date: new Date('2024-01-25'),
        Time_last_login_time: '08:45:00',
        active: true,
      },
      {
        user_id: 'MG2',
        employee_id: 'E1007',
        hash_password: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // Dummy hash
        Date_password_changed_date: new Date('2024-01-18'),
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        Date_last_login_date: new Date('2024-01-23'),
        Time_last_login_time: '11:00:00',
        active: true,
      },
      {
        user_id: 'OP3',
        employee_id: 'E1008',
        hash_password: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // Dummy hash
        Date_password_changed_date: new Date('2024-01-20'),
        Date_password_expiry_date: passwordExpiryDate,
        N_password_expiry_days: 90,
        Date_last_login_date: new Date('2024-01-22'),
        Time_last_login_time: '07:30:00',
        active: false, // Inactive user
      },
    ];

    await UserMaster.insertMany(userData);
    console.log(`Inserted ${userData.length} user records`);

    // Seed User Login History
    const loginHistoryData = [
      // Admin login history
      {
        user_id: 'AD',
        Date_login_Date: new Date('2024-01-25'),
        Time_login_Time: '09:30:00',
        Date_Logout_Date: new Date('2024-01-25'),
        Time_Logout_Time: '18:00:00',
      },
      {
        user_id: 'AD',
        Date_login_Date: new Date('2024-01-24'),
        Time_login_Time: '09:15:00',
        Date_Logout_Date: new Date('2024-01-24'),
        Time_Logout_Time: '17:45:00',
      },
      {
        user_id: 'AD',
        Date_login_Date: new Date('2024-01-23'),
        Time_login_Time: '09:00:00',
        Date_Logout_Date: new Date('2024-01-23'),
        Time_Logout_Time: '18:30:00',
      },
      // Operator 1 login history
      {
        user_id: 'OP1',
        Date_login_Date: new Date('2024-01-25'),
        Time_login_Time: '08:15:00',
        Date_Logout_Date: new Date('2024-01-25'),
        Time_Logout_Time: '17:00:00',
      },
      {
        user_id: 'OP1',
        Date_login_Date: new Date('2024-01-24'),
        Time_login_Time: '08:00:00',
        Date_Logout_Date: new Date('2024-01-24'),
        Time_Logout_Time: '16:45:00',
      },
      {
        user_id: 'OP1',
        Date_login_Date: new Date('2024-01-23'),
        Time_login_Time: '08:30:00',
        Date_Logout_Date: new Date('2024-01-23'),
        Time_Logout_Time: '17:15:00',
      },
      // Operator 2 login history
      {
        user_id: 'OP2',
        Date_login_Date: new Date('2024-01-24'),
        Time_login_Time: '08:00:00',
        Date_Logout_Date: new Date('2024-01-24'),
        Time_Logout_Time: '17:00:00',
      },
      {
        user_id: 'OP2',
        Date_login_Date: new Date('2024-01-23'),
        Time_login_Time: '07:45:00',
        Date_Logout_Date: new Date('2024-01-23'),
        Time_Logout_Time: '16:30:00',
      },
      // Supervisor 1 login history
      {
        user_id: 'SV1',
        Date_login_Date: new Date('2024-01-25'),
        Time_login_Time: '09:00:00',
        Date_Logout_Date: new Date('2024-01-25'),
        Time_Logout_Time: '18:15:00',
      },
      {
        user_id: 'SV1',
        Date_login_Date: new Date('2024-01-24'),
        Time_login_Time: '09:15:00',
        Date_Logout_Date: new Date('2024-01-24'),
        Time_Logout_Time: '18:00:00',
      },
      // Supervisor 2 login history
      {
        user_id: 'SV2',
        Date_login_Date: new Date('2024-01-24'),
        Time_login_Time: '10:30:00',
        Date_Logout_Date: new Date('2024-01-24'),
        Time_Logout_Time: '19:00:00',
      },
      {
        user_id: 'SV2',
        Date_login_Date: new Date('2024-01-23'),
        Time_login_Time: '10:00:00',
        Date_Logout_Date: new Date('2024-01-23'),
        Time_Logout_Time: '18:30:00',
      },
      // Manager 1 login history
      {
        user_id: 'MG1',
        Date_login_Date: new Date('2024-01-25'),
        Time_login_Time: '08:45:00',
        Date_Logout_Date: new Date('2024-01-25'),
        Time_Logout_Time: '18:45:00',
      },
      {
        user_id: 'MG1',
        Date_login_Date: new Date('2024-01-24'),
        Time_login_Time: '08:30:00',
        Date_Logout_Date: new Date('2024-01-24'),
        Time_Logout_Time: '18:15:00',
      },
      // Manager 2 login history
      {
        user_id: 'MG2',
        Date_login_Date: new Date('2024-01-23'),
        Time_login_Time: '11:00:00',
        Date_Logout_Date: new Date('2024-01-23'),
        Time_Logout_Time: '19:30:00',
      },
      {
        user_id: 'MG2',
        Date_login_Date: new Date('2024-01-22'),
        Time_login_Time: '10:45:00',
        Date_Logout_Date: new Date('2024-01-22'),
        Time_Logout_Time: '19:00:00',
      },
      // Some users with only login (no logout yet)
      {
        user_id: 'AD',
        Date_login_Date: new Date('2024-01-22'),
        Time_login_Time: '09:20:00',
      },
      {
        user_id: 'OP1',
        Date_login_Date: new Date('2024-01-22'),
        Time_login_Time: '08:10:00',
      },
    ];

    await UserLoginHistory.insertMany(loginHistoryData);
    console.log(`Inserted ${loginHistoryData.length} login history records`);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed script
seedData();

