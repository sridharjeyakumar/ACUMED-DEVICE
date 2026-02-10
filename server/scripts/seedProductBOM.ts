import mongoose from 'mongoose';
import ProductBOMMaster from '../models/ProductBOMMaster';
import { ensureConnection } from '../db/connection';

const sampleProductBOMs = [
    {
        bom_id: "BM01",
        bom_description: "DUVET",
        product_id: "P0001",
        output_qty: 3000,
        output_uom: "NOS",
        material_id: "RM001",
        input_qty: 1,
        input_uom: "KGS",
        active: true,
    },
    {
        bom_id: "BM01",
        bom_description: "DUVET",
        product_id: "P0001",
        output_qty: 1200,
        output_uom: "NOS",
        material_id: "RM002",
        input_qty: 1,
        input_uom: "KGS",
        active: true,
    },
    {
        bom_id: "BM02",
        bom_description: "DUVET XL",
        product_id: "P0002",
        output_qty: null,
        output_uom: "NOS",
        material_id: "RM003",
        input_qty: 1,
        input_uom: "KGS",
        active: true,
    },
    {
        bom_id: "BM02",
        bom_description: "DUVET XL",
        product_id: "P0002",
        output_qty: null,
        output_uom: "NOS",
        material_id: "RM004",
        input_qty: 1,
        input_uom: "KGS",
        active: true,
    },
    {
        bom_id: "BM03",
        bom_description: "DUVET Ultra",
        product_id: "P0003",
        output_qty: null,
        output_uom: "NOS",
        material_id: "RM005",
        input_qty: 1,
        input_uom: "KGS",
        active: true,
    },
    {
        bom_id: "BM03",
        bom_description: "DUVET Ultra",
        product_id: "P0003",
        output_qty: null,
        output_uom: "NOS",
        material_id: "RM006",
        input_qty: 1,
        input_uom: "KGS",
        active: true,
    },
];

async function seedProductBOM() {
    try {
        await ensureConnection();
        console.log('Connected to database');

        for (const bomData of sampleProductBOMs) {
            const bom = await ProductBOMMaster.findOneAndUpdate(
                { 
                    bom_id: bomData.bom_id,
                    material_id: bomData.material_id 
                },
                {
                    ...bomData,
                    last_modified_user_id: 'ADMIN',
                    last_modified_date_time: new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );
            console.log(`Product BOM ${bom.bom_id} - ${bom.bom_description} (Material: ${bom.material_id}) added/updated`);
        }

        console.log('All product BOMs seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding product BOMs:', error);
        process.exit(1);
    }
}

seedProductBOM();

