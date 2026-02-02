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
import CompanyMaster from '../models/CompanyMaster';
import ProductStatusMaster from '../models/ProductStatusMaster';
import MaterialStatusMaster from '../models/MaterialStatusMaster';
import DepartmentMaster from '../models/DepartmentMaster';
import EmployeeGradeMaster from '../models/EmployeeGradeMaster';
import ProductCategoryMaster from '../models/ProductCategoryMaster';
import MaterialCategoryMaster from '../models/MaterialCategoryMaster';
import HolidaysMaster from '../models/HolidaysMaster';
import WeeklyOffMaster from '../models/WeeklyOffMaster';
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
    await CompanyMaster.deleteMany({});
    await ProductStatusMaster.deleteMany({});
    await MaterialStatusMaster.deleteMany({});
    await DepartmentMaster.deleteMany({});
    await EmployeeGradeMaster.deleteMany({});
    await ProductCategoryMaster.deleteMany({});
    await MaterialCategoryMaster.deleteMany({});
    await HolidaysMaster.deleteMany({});
    await WeeklyOffMaster.deleteMany({});
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

    // Seed Company Master - Based on image data
    const companyData = [
      {
        comp_id: 'CORP',
        company_name: 'ACUMED DEVICES DISTRIBUTION LTD.',
        company_short_name: 'ACUMED DEVICES',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        pincode: 0,
        gst_no: '33AAICA9166G1',
        cin_no: 'U51397TN2010PTC077640',
        pan_no: '',
        email_id: '',
        website: '',
        contact_person: '',
        contact_no: 0,
        logo: '',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        comp_id: 'FACT',
        company_name: 'ACUMED DEVICES DISTRIBUTION LTD.',
        company_short_name: '',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        pincode: 0,
        gst_no: '',
        cin_no: '',
        pan_no: '',
        email_id: '',
        website: '',
        contact_person: '',
        contact_no: 0,
        logo: '',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await CompanyMaster.insertMany(companyData);
    console.log(`Inserted ${companyData.length} company records`);

    // Seed Product Status Master - Based on image data
    const productStatusData = [
      {
        prod_status_id: 'MFD',
        product_status: 'Manufactured',
        stock_movement: 'IN',
        effect_in_stock: '+',
        seq_no: 1,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        prod_status_id: 'IQC',
        product_status: 'in QC',
        stock_movement: '',
        effect_in_stock: '',
        seq_no: 2,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        prod_status_id: 'PST',
        product_status: 'Packed for Sterilization',
        stock_movement: '',
        effect_in_stock: '',
        seq_no: 3,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        prod_status_id: 'SST',
        product_status: 'Sent for Sterilization',
        stock_movement: 'OUT',
        effect_in_stock: '-',
        seq_no: 4,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        prod_status_id: 'RST',
        product_status: 'Received from Sterilization',
        stock_movement: 'IN',
        effect_in_stock: '+',
        seq_no: 5,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        prod_status_id: 'PDS',
        product_status: 'Packed for Dispatch',
        stock_movement: '',
        effect_in_stock: '',
        seq_no: 6,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        prod_status_id: 'DSP',
        product_status: 'Dispatched',
        stock_movement: 'OUT',
        effect_in_stock: '-',
        seq_no: 7,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        prod_status_id: 'ST+',
        product_status: 'Stock Adjustment (Add)',
        stock_movement: 'IN',
        effect_in_stock: '+',
        seq_no: 8,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        prod_status_id: 'ST-',
        product_status: 'Stock Adjustment (Reduce)',
        stock_movement: 'OUT',
        effect_in_stock: '-',
        seq_no: 9,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        prod_status_id: 'DMG',
        product_status: 'Damaged',
        stock_movement: '',
        effect_in_stock: '',
        seq_no: 10,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await ProductStatusMaster.insertMany(productStatusData);
    console.log(`Inserted ${productStatusData.length} product status records`);

    // Seed Material Status Master - Based on image data
    const materialStatusData = [
      {
        matl_status_id: 'REC',
        material_status: 'Receipt from Supplier',
        stock_movement: 'IN',
        effect_in_stock: '+',
        seq_no: 1,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        matl_status_id: 'ISS',
        material_status: 'Issued for Production',
        stock_movement: 'OUT',
        effect_in_stock: '-',
        seq_no: 2,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        matl_status_id: 'RTS',
        material_status: 'Returned to Supplier',
        stock_movement: 'OUT',
        effect_in_stock: '-',
        seq_no: 4,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        matl_status_id: 'RRS',
        material_status: 'Return Receipt from Supplier',
        stock_movement: 'IN',
        effect_in_stock: '+',
        seq_no: 5,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        matl_status_id: 'ST+',
        material_status: 'Stock Adjustment (Add)',
        stock_movement: 'IN',
        effect_in_stock: '+',
        seq_no: 6,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        matl_status_id: 'ST-',
        material_status: 'Stock Adjustment (Reduce)',
        stock_movement: 'OUT',
        effect_in_stock: '-',
        seq_no: 7,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        matl_status_id: 'DMG',
        material_status: 'Damaged',
        stock_movement: '',
        effect_in_stock: '',
        seq_no: 8,
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await MaterialStatusMaster.insertMany(materialStatusData);
    console.log(`Inserted ${materialStatusData.length} material status records`);

    // Seed Department Master - Based on image data
    const departmentData = [
      {
        dept_id: 'MGT',
        department_name: 'Management',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        dept_id: 'ADM',
        department_name: 'Administration',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        dept_id: 'PRD',
        department_name: 'Production',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        dept_id: 'PAC',
        department_name: 'Packing',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        dept_id: 'STR',
        department_name: 'Stores',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await DepartmentMaster.insertMany(departmentData);
    console.log(`Inserted ${departmentData.length} department records`);

    // Seed Employee Grade Master - Based on image data
    const employeeGradeData = [
      {
        grade_id: 'DIR',
        grade_name: 'Director',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        grade_id: 'MGR',
        grade_name: 'Manager',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        grade_id: 'SUP',
        grade_name: 'Supervisor',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        grade_id: 'OPR',
        grade_name: 'Operator',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        grade_id: 'SUB',
        grade_name: 'Sub Staff',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await EmployeeGradeMaster.insertMany(employeeGradeData);
    console.log(`Inserted ${employeeGradeData.length} employee grade records`);

    // Seed Product Category Master - Based on image data
    const productCategoryData = [
      {
        product_category_id: 'P01',
        product_category_name: 'Sterile Cleansing Wipes',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        product_category_id: 'P02',
        product_category_name: 'Wet Wipes',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await ProductCategoryMaster.insertMany(productCategoryData);
    console.log(`Inserted ${productCategoryData.length} product category records`);

    // Seed Material Category Master - Based on image data
    const materialCategoryData = [
      {
        material_category_id: 'M01',
        material_category_name: 'Fabric',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        material_category_id: 'M02',
        material_category_name: 'Laminate',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        material_category_id: 'M03',
        material_category_name: 'Packing',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await MaterialCategoryMaster.insertMany(materialCategoryData);
    console.log(`Inserted ${materialCategoryData.length} material category records`);

    // Seed Holidays Master - Based on image data
    const holidaysData = [
      {
        date: new Date('2026-01-01'),
        remarks: 'New Year',
        year: 2026,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        date: new Date('2026-01-15'),
        remarks: 'Pongal',
        year: 2026,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        date: new Date('2026-01-26'),
        remarks: 'Republic Day',
        year: 2026,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        date: new Date('2026-04-14'),
        remarks: 'Tamil New Year',
        year: 2026,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        date: new Date('2026-05-01'),
        remarks: 'May Day',
        year: 2026,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        date: new Date('2026-09-05'),
        remarks: 'Ganesh Chathurthi',
        year: 2026,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        date: new Date('2026-11-05'),
        remarks: 'Diwali',
        year: 2026,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        date: new Date('2026-12-25'),
        remarks: 'Christmas',
        year: 2026,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await HolidaysMaster.insertMany(holidaysData);
    console.log(`Inserted ${holidaysData.length} holiday records`);

    // Seed Weekly Off Master - Based on image data
    const weeklyOffData = [
      {
        week_off_id: 1,
        day_of_week: 6, // Saturday
        week_of_month: undefined,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        week_off_id: 2,
        day_of_week: 7, // Sunday
        week_of_month: undefined,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    await WeeklyOffMaster.insertMany(weeklyOffData);
    console.log(`Inserted ${weeklyOffData.length} weekly off records`);

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${menuData.length} Menu Master records`);
    console.log(`   - ${roleData.length} Role Master records`);
    console.log(`   - ${menuAccessData.length} Menu Access Master records`);
    console.log(`   - ${userData.length} User Master records`);
    console.log(`   - ${companyData.length} Company Master records`);
    console.log(`   - ${productStatusData.length} Product Status Master records`);
    console.log(`   - ${materialStatusData.length} Material Status Master records`);
    console.log(`   - ${departmentData.length} Department Master records`);
    console.log(`   - ${employeeGradeData.length} Employee Grade Master records`);
    console.log(`   - ${productCategoryData.length} Product Category Master records`);
    console.log(`   - ${materialCategoryData.length} Material Category Master records`);
    console.log(`   - ${holidaysData.length} Holidays Master records`);
    console.log(`   - ${weeklyOffData.length} Weekly Off Master records`);
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
