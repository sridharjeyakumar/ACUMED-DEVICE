/**
 * Script to add Master section pages to Menu Master database
 * Run with: tsx server/scripts/addMasterMenus.ts
 */

import connectDB from '../db/connection';
import MenuMaster from '../models/MenuMaster';

async function addMasterMenus() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to database');

    const currentDate = new Date();

    // Master section menu items
    const masterMenus = [
      { menu_id: 'M01', menu_desc: 'Product Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M02', menu_desc: 'Material Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M03', menu_desc: 'Production Capacity', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M04', menu_desc: 'Pack Size Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M05', menu_desc: 'Carton Type Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M06', menu_desc: 'Carton Capacity Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M07', menu_desc: 'Product BOM', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M08', menu_desc: 'Packing BOM', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M09', menu_desc: 'Collection Bin Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M10', menu_desc: 'Product Status Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M11', menu_desc: 'Material Status Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
      { menu_id: 'M12', menu_desc: 'Employee Master', active: true, last_modified_user_id: 'ADMIN', last_modified_date_time: currentDate },
    ];

    let addedCount = 0;
    let updatedCount = 0;

    for (const menu of masterMenus) {
      try {
        // Try to find existing menu
        const existingMenu = await MenuMaster.findOne({ menu_id: menu.menu_id });
        
        if (existingMenu) {
          // Update existing menu
          existingMenu.menu_desc = menu.menu_desc;
          existingMenu.active = menu.active;
          existingMenu.last_modified_user_id = menu.last_modified_user_id;
          existingMenu.last_modified_date_time = menu.last_modified_date_time;
          await existingMenu.save();
          updatedCount++;
          console.log(`Updated menu: ${menu.menu_id} - ${menu.menu_desc}`);
        } else {
          // Create new menu
          const newMenu = new MenuMaster(menu);
          await newMenu.save();
          addedCount++;
          console.log(`Added menu: ${menu.menu_id} - ${menu.menu_desc}`);
        }
      } catch (error: any) {
        console.error(`Error processing menu ${menu.menu_id}:`, error.message);
      }
    }

    console.log(`\nSummary:`);
    console.log(`- Added: ${addedCount} menus`);
    console.log(`- Updated: ${updatedCount} menus`);
    console.log(`- Total processed: ${masterMenus.length} menus`);
    console.log('\nMaster section menus have been stored in the database!');

    process.exit(0);
  } catch (error: any) {
    console.error('Error adding master menus:', error);
    process.exit(1);
  }
}

// Run the script
addMasterMenus();










