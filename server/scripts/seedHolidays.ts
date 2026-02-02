/**
 * Seed script to insert Holidays Master data
 * This script only inserts Holidays data without clearing other tables
 */

import connectDB from '../db/connection';
import HolidaysMaster from '../models/HolidaysMaster';

async function seedHolidays() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to database');

    const currentDate = new Date();

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

    let insertedCount = 0;
    let skippedCount = 0;

    for (const holiday of holidaysData) {
      const existing = await HolidaysMaster.findOne({ 
        date: holiday.date,
        year: holiday.year
      });
      
      if (existing) {
        console.log(`⚠️  Holiday on ${holiday.date.toISOString().split('T')[0]} (${holiday.year}) already exists. Skipping...`);
        skippedCount++;
      } else {
        await HolidaysMaster.create(holiday);
        console.log(`✅ Inserted: ${holiday.date.toISOString().split('T')[0]} - ${holiday.remarks} (${holiday.year})`);
        insertedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Inserted: ${insertedCount} records`);
    console.log(`   - Skipped (already exist): ${skippedCount} records`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding Holidays Master:', error);
    if (error.code === 11000) {
      console.error('   Duplicate key error - some records may already exist');
    }
    process.exit(1);
  }
}

// Run the seed script
seedHolidays();

