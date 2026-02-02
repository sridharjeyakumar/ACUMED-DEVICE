/**
 * Seed script to insert Product Category Master data
 * This script only inserts Product Category data without clearing other tables
 */

import connectDB from '../db/connection';
import ProductCategoryMaster from '../models/ProductCategoryMaster';

async function seedProductCategories() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to database');

    const currentDate = new Date();

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

    let insertedCount = 0;
    let skippedCount = 0;

    for (const category of productCategoryData) {
      const existing = await ProductCategoryMaster.findOne({ 
        product_category_id: category.product_category_id 
      });
      
      if (existing) {
        console.log(`⚠️  ${category.product_category_id} already exists. Skipping...`);
        skippedCount++;
      } else {
        await ProductCategoryMaster.create(category);
        console.log(`✅ Inserted: ${category.product_category_id} - ${category.product_category_name}`);
        insertedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Inserted: ${insertedCount} records`);
    console.log(`   - Skipped (already exist): ${skippedCount} records`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding Product Category Master:', error);
    if (error.code === 11000) {
      console.error('   Duplicate key error - some records may already exist');
    }
    process.exit(1);
  }
}

// Run the seed script
seedProductCategories();

