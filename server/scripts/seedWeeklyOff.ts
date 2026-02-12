/**
 * Seed script to insert Weekly Off Master data
 * This script only inserts Weekly Off data without clearing other tables
 */

import connectDB from '../db/connection';
import WeeklyOffMaster from '../models/WeeklyOffMaster';

async function seedWeeklyOff() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to database');

    const currentDate = new Date();

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

    let insertedCount = 0;
    let skippedCount = 0;

    for (const weeklyOff of weeklyOffData) {
      const existing = await WeeklyOffMaster.findOne({ 
        week_off_id: weeklyOff.week_off_id
      });
      
      if (existing) {
        console.log(`⚠️  Weekly Off ID ${weeklyOff.week_off_id} already exists. Skipping...`);
        skippedCount++;
      } else {
        await WeeklyOffMaster.create(weeklyOff);
        const dayName = weeklyOff.day_of_week === 6 ? 'Saturday' : weeklyOff.day_of_week === 7 ? 'Sunday' : `Day ${weeklyOff.day_of_week}`;
        console.log(`✅ Inserted: Week Off ID ${weeklyOff.week_off_id} - ${dayName} (${weeklyOff.day_of_week})`);
        insertedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Inserted: ${insertedCount} records`);
    console.log(`   - Skipped (already exist): ${skippedCount} records`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding Weekly Off Master:', error);
    if (error.code === 11000) {
      console.error('   Duplicate key error - some records may already exist');
    }
    process.exit(1);
  }
}

// Run the seed script
seedWeeklyOff();














