import mongoose from 'mongoose';
import COAChecklistDetail from '../models/COAChecklistDetail';
import { ensureConnection } from '../db/connection';

const sampleCOAChecklistDetails = [
    // CL01 parameters
    {
        checklist_id: "CL01",
        checklist_sno: 1,
        checklist_parameter: "Perforation",
        expected_result: "Ok",
        active: true,
    },
    {
        checklist_id: "CL01",
        checklist_sno: 2,
        checklist_parameter: "Both Side Open Cut",
        expected_result: "Ok",
        active: true,
    },
    {
        checklist_id: "CL01",
        checklist_sno: 3,
        checklist_parameter: "Weight",
        expected_result: "Ok",
        active: true,
    },
    // CL02 parameters
    {
        checklist_id: "CL02",
        checklist_sno: 1,
        checklist_parameter: "Color",
        expected_result: "Ok",
        active: true,
    },
    {
        checklist_id: "CL02",
        checklist_sno: 2,
        checklist_parameter: "No Damage",
        expected_result: "Ok",
        active: true,
    },
    {
        checklist_id: "CL02",
        checklist_sno: 3,
        checklist_parameter: "Correct Weight",
        expected_result: "Ok",
        active: true,
    },
];

async function seedCOAChecklistDetails() {
    try {
        await ensureConnection();
        console.log('Connected to database');

        for (const detailData of sampleCOAChecklistDetails) {
            const detail = await COAChecklistDetail.findOneAndUpdate(
                { 
                    checklist_id: detailData.checklist_id,
                    checklist_sno: detailData.checklist_sno 
                },
                {
                    ...detailData,
                    last_modified_user_id: 'ADMIN',
                    last_modified_date_time: new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );
            console.log(`COA Checklist Detail ${detail.checklist_id} - Sno ${detail.checklist_sno} - ${detail.checklist_parameter} added/updated`);
        }

        console.log('All COA checklist details seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding COA checklist details:', error);
        process.exit(1);
    }
}

seedCOAChecklistDetails();



