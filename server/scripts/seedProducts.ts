import mongoose from 'mongoose';
import ProductMaster from '../models/ProductMaster';
import { ensureConnection } from '../db/connection';

const sampleProducts = [
    {
        product_id: "P0001",
        product_name: "DUVET Wipes",
        product_shortname: "DUVET Wipes",
        uom: "NOS",
        product_category_id: "P01",
        product_spec: "",
        weight_per_piece: 2.7,
        weight_uom: "GMS",
        wipes_per_kg: 370,
        shelf_life_in_months: 12,
        storage_condition: "Room Temp.",
        safety_stock_qty: undefined,
        default_pack_size_id: "PK24",
        batch_no_pattern: "<MMYYYY><NN>",
        product_image: "",
        product_image_icon: "",
        qc_required: true,
        coa_checklist_id: "CL01",
        sterilization_required: true,
        active: true,
    },
    {
        product_id: "P0002",
        product_name: "DUVET XL Wipes",
        product_shortname: "DUVET XL Wipes",
        uom: "NOS",
        product_category_id: "P01",
        product_spec: "",
        weight_per_piece: 3.2,
        weight_uom: "GMS",
        wipes_per_kg: 313,
        shelf_life_in_months: 12,
        storage_condition: "Room Temp.",
        safety_stock_qty: undefined,
        default_pack_size_id: "PK24",
        batch_no_pattern: "",
        product_image: "",
        product_image_icon: "",
        qc_required: true,
        coa_checklist_id: "CL01",
        sterilization_required: true,
        active: true,
    },
    {
        product_id: "P0003",
        product_name: "DUVET Ultra Wipes",
        product_shortname: "DUVET Ultra Wipes",
        uom: "NOS",
        product_category_id: "P01",
        product_spec: "",
        weight_per_piece: 3.5,
        weight_uom: "GMS",
        wipes_per_kg: 286,
        shelf_life_in_months: 12,
        storage_condition: "Room Temp.",
        safety_stock_qty: undefined,
        default_pack_size_id: "PK24",
        batch_no_pattern: "",
        product_image: "",
        product_image_icon: "",
        qc_required: true,
        coa_checklist_id: "CL01",
        sterilization_required: true,
        active: true,
    },
    {
        product_id: "P0004",
        product_name: "Nanai Wet wipes",
        product_shortname: "Nanai Wet wipes",
        uom: "NOS",
        product_category_id: "P02",
        product_spec: "",
        weight_per_piece: 4.2,
        weight_uom: "GMS",
        wipes_per_kg: 238,
        shelf_life_in_months: 12,
        storage_condition: "Room Temp.",
        safety_stock_qty: undefined,
        default_pack_size_id: "PK24",
        batch_no_pattern: "",
        product_image: "",
        product_image_icon: "",
        qc_required: false,
        coa_checklist_id: "",
        sterilization_required: false,
        active: true,
    },
];

async function seedProducts() {
    try {
        await ensureConnection();
        console.log('Connected to database');

        for (const productData of sampleProducts) {
            const product = await ProductMaster.findOneAndUpdate(
                { product_id: productData.product_id },
                {
                    ...productData,
                    last_modified_user_id: 'ADMIN',
                    last_modified_date_time: new Date(),
                },
                { upsert: true, new: true, runValidators: true }
            );
            console.log(`Product ${product.product_id} - ${product.product_name} added/updated`);
        }

        console.log('All products seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts();








