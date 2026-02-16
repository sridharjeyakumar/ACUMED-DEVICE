/**
 * Script to delete all COA Checklist Detail records from the database
 * 
 * Usage: node scripts/delete-coa-checklist-details.js
 * 
 * WARNING: This will permanently delete ALL COA Checklist Detail records!
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB URI from environment variable
const getMongoURI = () => {
  const uri = process.env.Database?.replace(/^["']|["']$/g, '') || '';
  if (!uri) {
    throw new Error('Please define the Database environment variable in your .env file');
  }
  return uri;
};

// COA Checklist Detail Schema (simplified for this script)
const COAChecklistDetailSchema = new mongoose.Schema({
  checklist_id: String,
  checklist_sno: Number,
  checklist_parameter: String,
  expected_result: String,
  active: Boolean,
  last_modified_user_id: String,
  last_modified_date_time: Date,
}, {
  collection: 'coachecklistdetailmasters',
  strict: false
});

const COAChecklistDetailMaster = mongoose.model('COAChecklistDetailMaster', COAChecklistDetailSchema);

async function deleteAllCOAChecklistDetails() {
  try {
    console.log('Connecting to MongoDB...');
    const MONGODB_URI = getMongoURI();
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get count before deletion
    const countBefore = await COAChecklistDetailMaster.countDocuments();
    console.log(`\nFound ${countBefore} COA Checklist Detail records in the database`);

    if (countBefore === 0) {
      console.log('No records to delete. Exiting...');
      await mongoose.disconnect();
      return;
    }

    // Delete all documents
    console.log('\nDeleting all COA Checklist Detail records...');
    const result = await COAChecklistDetailMaster.deleteMany({});

    console.log(`\n✅ Successfully deleted ${result.deletedCount} COA Checklist Detail records`);
    console.log(`   Collection: coachecklistdetailmasters`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
deleteAllCOAChecklistDetails();






