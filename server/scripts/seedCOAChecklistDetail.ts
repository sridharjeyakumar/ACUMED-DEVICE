/**
 * Seed script to populate COA Checklist Detail data
 * Based on the sample data from the image
 * 
 * Usage: tsx server/scripts/seedCOAChecklistDetail.ts
 */

import connectDB from '../db/connection';
import COAChecklistDetailMaster from '../models/COAChecklistDetailMaster';
import COAChecklistMaster from '../models/COAChecklistMaster';

async function seedCOAChecklistDetail() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to database');

    // First, ensure COA Checklist Master records exist
    const checklistCL01 = await COAChecklistMaster.findOne({ checklist_id: 'CL01' });
    const checklistCL02 = await COAChecklistMaster.findOne({ checklist_id: 'CL02' });

    if (!checklistCL01) {
      console.log('Creating COA Checklist Master CL01...');
      const newCL01 = new COAChecklistMaster({
        checklist_id: 'CL01',
        checklist_description: 'DUVET - QC - Checklist',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      });
      await newCL01.save();
      console.log('Created CL01');
    }

    if (!checklistCL02) {
      console.log('Creating COA Checklist Master CL02...');
      const newCL02 = new COAChecklistMaster({
        checklist_id: 'CL02',
        checklist_description: 'QC - Checklist 02',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      });
      await newCL02.save();
      console.log('Created CL02');
    }

    // Check if data already exists
    const existingCount = await COAChecklistDetailMaster.countDocuments();
    if (existingCount > 0) {
      console.log(`\nFound ${existingCount} existing COA Checklist Detail records.`);
      console.log('To avoid duplicates, please delete existing records first or modify this script.');
      console.log('You can delete all records using: DELETE /api/coa-checklist-details');
      return;
    }

    const currentDate = new Date();

    // Seed COA Checklist Detail data based on the image
    const checklistDetailData = [
      // CL01 parameters
      {
        checklist_id: 'CL01',
        checklist_sno: 1,
        checklist_parameter: 'Perforation',
        expected_result: 'Ok',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        checklist_id: 'CL01',
        checklist_sno: 2,
        checklist_parameter: 'Both Side Open Cut',
        expected_result: 'Ok',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        checklist_id: 'CL01',
        checklist_sno: 3,
        checklist_parameter: 'Weight',
        expected_result: 'Ok',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      // CL02 parameters
      {
        checklist_id: 'CL02',
        checklist_sno: 1,
        checklist_parameter: 'Color',
        expected_result: 'Ok',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        checklist_id: 'CL02',
        checklist_sno: 2,
        checklist_parameter: 'No Damage',
        expected_result: 'Ok',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
      {
        checklist_id: 'CL02',
        checklist_sno: 3,
        checklist_parameter: 'Correct Weight',
        expected_result: 'Ok',
        active: true,
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: currentDate,
      },
    ];

    // Insert the data
    await COAChecklistDetailMaster.insertMany(checklistDetailData);
    console.log(`\n✅ Successfully inserted ${checklistDetailData.length} COA Checklist Detail records`);

    // Display summary
    console.log('\n📊 Summary:');
    console.log('CL01 - 3 parameters:');
    console.log('  1. Perforation - Ok');
    console.log('  2. Both Side Open Cut - Ok');
    console.log('  3. Weight - Ok');
    console.log('\nCL02 - 3 parameters:');
    console.log('  1. Color - Ok');
    console.log('  2. No Damage - Ok');
    console.log('  3. Correct Weight - Ok');

    console.log('\n✅ COA Checklist Detail data has been seeded successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding COA Checklist Detail data:', error);
    if (error.code === 11000) {
      console.error('Duplicate key error - some records may already exist');
    }
    process.exit(1);
  }
}

// Run the script
seedCOAChecklistDetail();

