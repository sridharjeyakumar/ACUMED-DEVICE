import mongoose from 'mongoose';
import COAChecklistMaster from '../models/COAChecklistMaster';
import { ensureConnection } from '../db/connection';

const sampleCOAChecklists = [
    {
        checklist_id: "CL01",
        checklist_description: "DUVET - QC - Checklist",
        active: true,
    },
    {
        checklist_id: "CL02",
        checklist_description: "Fabric - QC - Checklist",
        active: true,
    },
];

async function seedCOAChecklists() {
    try {
        await ensureConnection();
        console.log('Connected to database');

        for (const checklistData of sampleCOAChecklists) {
            const checklist = await COAChecklistMaster.findOneAndUpdate(
                { checklist_id: checklistData.checklist_id },
                {
                    ...checklistData,
                    last_modified_user_id: 'ADMIN',
                    last_modified_date_time: new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );
            console.log(`COA Checklist ${checklist.checklist_id} - ${checklist.checklist_description} added/updated`);
        }

        console.log('All COA checklists seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding COA checklists:', error);
        process.exit(1);
    }
}

seedCOAChecklists();




