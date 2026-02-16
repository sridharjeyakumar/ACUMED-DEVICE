/**
 * Script to add a dummy company with all fields filled
 */

import connectDB from '../db/connection';
import CompanyMaster from '../models/CompanyMaster';

async function seedCompany() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to database');

    // Check if company already exists
    const existingCompany = await CompanyMaster.findOne({ comp_id: 'DEMO' });
    if (existingCompany) {
      console.log('Company with ID DEMO already exists. Updating...');
      await CompanyMaster.findOneAndUpdate(
        { comp_id: 'DEMO' },
        {
          comp_id: 'DEMO',
          company_name: 'ACUMED Medical Devices Private Limited',
          company_short_name: 'ACUMED',
          address_1: '123 Industrial Park, Sector 5',
          address_2: 'Near Tech Hub, Building A',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: 400001,
          gst_no: '27AABCU1234A1Z5',
          cin_no: 'U24230MH2010PTC123456',
          pan_no: 'AABCU1234A',
          email_id: 'info@acumeddevices.com',
          website: 'www.acumeddevices.com',
          contact_person: 'Rajesh Kumar',
          contact_no: 9876543210,
          logo: 'https://via.placeholder.com/150?text=ACUMED',
          last_modified_user_id: 'ADMIN',
          last_modified_date_time: new Date(),
        },
        { new: true, upsert: true }
      );
      console.log('Company updated successfully!');
    } else {
      // Create new company with all fields
      const company = new CompanyMaster({
        comp_id: 'DEMO',
        company_name: 'ACUMED Medical Devices Private Limited',
        company_short_name: 'ACUMED',
        address_1: '123 Industrial Park, Sector 5',
        address_2: 'Near Tech Hub, Building A',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: 400001,
        gst_no: '27AABCU1234A1Z5',
        cin_no: 'U24230MH2010PTC123456',
        pan_no: 'AABCU1234A',
        email_id: 'info@acumeddevices.com',
        website: 'www.acumeddevices.com',
        contact_person: 'Rajesh Kumar',
        contact_no: 9876543210,
        logo: 'https://via.placeholder.com/150?text=ACUMED',
        last_modified_user_id: 'ADMIN',
        last_modified_date_time: new Date(),
      });

      await company.save();
      console.log('Company created successfully!');
    }

    console.log('Company data:');
    const savedCompany = await CompanyMaster.findOne({ comp_id: 'DEMO' });
    console.log(JSON.stringify(savedCompany, null, 2));

    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding company:', error);
    process.exit(1);
  }
}

seedCompany();

