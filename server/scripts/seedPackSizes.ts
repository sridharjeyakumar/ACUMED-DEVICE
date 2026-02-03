import mongoose from 'mongoose';
import PackSizeMaster from '../models/PackSizeMaster';
import { ensureConnection } from '../db/connection';

const packSizesToSeed = [
    {
        pack_size_id: "PK06",
        pack_size_name: "6s pack",
        pack_size_short_name: "6s pack",
        qty_per_carton: 6,
        uom: "NOS",
        last_modified_user_id: undefined,
        last_modified_date_time: undefined,
        active: true,
    },
    {
        pack_size_id: "PK12",
        pack_size_name: "12s pack",
        pack_size_short_name: "12s pack",
        qty_per_carton: 12,
        uom: "NOS",
        last_modified_user_id: undefined,
        last_modified_date_time: undefined,
        active: true,
    },
    {
        pack_size_id: "PK24",
        pack_size_name: "24s pack",
        pack_size_short_name: "24s pack",
        qty_per_carton: 24,
        uom: "NOS",
        last_modified_user_id: undefined,
        last_modified_date_time: undefined,
        active: true,
    },
];

async function seedPackSizes() {
    try {
        await ensureConnection();
        console.log('Connected to database');

        let addedCount = 0;
        let updatedCount = 0;

        for (const packSizeData of packSizesToSeed) {
            // Check if document exists before upsert
            const existing = await PackSizeMaster.findOne({ 
                pack_size_id: packSizeData.pack_size_id 
            });
            
            const packSize = await PackSizeMaster.findOneAndUpdate(
                { pack_size_id: packSizeData.pack_size_id },
                {
                    ...packSizeData,
                    last_modified_user_id: packSizeData.last_modified_user_id || 'ADMIN',
                    last_modified_date_time: packSizeData.last_modified_date_time || new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );
            
            if (packSize) {
                if (!existing) {
                    addedCount++;
                    console.log(`Pack Size ${packSize.pack_size_id} - ${packSize.pack_size_name} added`);
                } else {
                    updatedCount++;
                    console.log(`Pack Size ${packSize.pack_size_id} - ${packSize.pack_size_name} updated`);
                }
            }
        }

        console.log(`\nSeeding complete: ${addedCount} pack sizes added, ${updatedCount} pack sizes updated.`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding pack sizes:', error);
        process.exit(1);
    }
}

seedPackSizes();

