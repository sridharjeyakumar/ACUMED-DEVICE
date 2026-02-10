import mongoose from 'mongoose';
import CollectionBinMaster from '../models/CollectionBinMaster';
import { ensureConnection } from '../db/connection';

const sampleCollectionBins = [
    {
        bin_id: "1",
        bin_name: "Product collection Bin 1",
        bin_short_name: "Bin 1",
        bin_type: "Normal",
        color: "Blue",
        tare_weight_kg: 5,
        gross_capacity_kg: 50,
        active: true,
    },
    {
        bin_id: "2",
        bin_name: "Product collection Bin 2",
        bin_short_name: "Bin 2",
        bin_type: "Normal",
        color: "Blue",
        tare_weight_kg: 5,
        gross_capacity_kg: 50,
        active: true,
    },
    {
        bin_id: "91",
        bin_name: "Rejected collection Bin 91 - Machine 1",
        bin_short_name: "Rej Bin 91",
        bin_type: "Rejected",
        color: "Red",
        tare_weight_kg: 5,
        gross_capacity_kg: 50,
        active: true,
    },
    {
        bin_id: "92",
        bin_name: "Rejected collection Bin 92 - Machine 2",
        bin_short_name: "Rej Bin 92",
        bin_type: "Rejected",
        color: "Red",
        tare_weight_kg: 5,
        gross_capacity_kg: 50,
        active: true,
    },
];

async function seedCollectionBins() {
    try {
        await ensureConnection();
        console.log('Connected to database');

        for (const binData of sampleCollectionBins) {
            const bin = await CollectionBinMaster.findOneAndUpdate(
                { bin_id: binData.bin_id },
                {
                    ...binData,
                    last_modified_user_id: 'ADMIN',
                    last_modified_date_time: new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );
            console.log(`Collection Bin ${bin.bin_id} - ${bin.bin_name} added/updated`);
        }

        console.log('All collection bins seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding collection bins:', error);
        process.exit(1);
    }
}

seedCollectionBins();



