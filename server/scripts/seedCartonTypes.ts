import mongoose from 'mongoose';
import CartonTypeMaster from '../models/CartonTypeMaster';
import { ensureConnection } from '../db/connection';

const cartonTypesToSeed = [
    {
        carton_type_id: "PK",
        carton_type_name: "Packing Carton",
        carton_type_shortname: "Packing",
        last_modified_user_id: undefined,
        last_modified_date_time: undefined,
        active: true,
    },
    {
        carton_type_id: "ST",
        carton_type_name: "Sterilization Carton",
        carton_type_shortname: "Sterilization",
        last_modified_user_id: undefined,
        last_modified_date_time: undefined,
        active: true,
    },
    {
        carton_type_id: "SH",
        carton_type_name: "Shipper Carton",
        carton_type_shortname: "Shipper",
        last_modified_user_id: undefined,
        last_modified_date_time: undefined,
        active: true,
    },
];

async function seedCartonTypes() {
    try {
        await ensureConnection();
        console.log('Connected to database');

        let addedCount = 0;
        let updatedCount = 0;

        for (const cartonTypeData of cartonTypesToSeed) {
            // Check if document exists before upsert
            const existing = await CartonTypeMaster.findOne({ 
                carton_type_id: cartonTypeData.carton_type_id 
            });
            
            const cartonType = await CartonTypeMaster.findOneAndUpdate(
                { carton_type_id: cartonTypeData.carton_type_id },
                {
                    ...cartonTypeData,
                    last_modified_user_id: cartonTypeData.last_modified_user_id || 'ADMIN',
                    last_modified_date_time: cartonTypeData.last_modified_date_time || new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );
            
            if (cartonType) {
                if (!existing) {
                    addedCount++;
                    console.log(`✅ Carton Type ${cartonType.carton_type_id} - ${cartonType.carton_type_name} added`);
                } else {
                    updatedCount++;
                    console.log(`🔄 Carton Type ${cartonType.carton_type_id} - ${cartonType.carton_type_name} updated`);
                }
            }
        }

        console.log(`\n📊 Seeding complete: ${addedCount} carton types added, ${updatedCount} carton types updated.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding carton types:', error);
        process.exit(1);
    }
}

seedCartonTypes();

