import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionPlanDetail extends Document {
  batch_no: string;              // Auto-fill from Header
  sno: number;                   // Batchwise Sno (1, 2, 3...)
  product_id: string;
  packsize_id: string;
  no_of_packs: number;           // User Entry
  no_of_sachets: number;         // Auto-calc: (no_of_packs * pack_size_numeric)
  packs_per_steri_carton: number; // Lookup from Capacity Master (Type 'ST')
  no_of_sterilization_cartons: number; // Auto-calc: (no_of_packs / packs_per_steri_carton)
  packs_per_shipper_carton: number;    // Lookup from Capacity Master (Type 'SH')
  no_of_shipper_cartons: number;       // Auto-calc: (no_of_packs / packs_per_shipper_carton)
  remarks?: string;
  last_modified_user_id: string;
  last_modified_date_time: Date;
}

const ProductionPlanDetailSchema = new Schema({
    batch_no: {
    type: String,
    required: true,
    unique: true,
    maxlength: 6,
    trim: true,
    uppercase: true
  },
  sno: { type: Number, required: true },
  product_id: { type: String, required: true },
  packsize_id: { type: String, required: true },
  no_of_packs: { type: Number, required: true },
  no_of_sachets: { type: Number },
  packs_per_steri_carton: { type: Number },
  no_of_sterilization_cartons: { type: Number },
  packs_per_shipper_carton: { type: Number },
  no_of_shipper_cartons: { type: Number },
  remarks: { type: String, maxlength: 100 },
  last_modified_user_id: { type: String, maxlength: 5 },
  last_modified_date_time: { type: Date, default: Date.now }
});

export const ProductionPlanDetail = mongoose.model<IProductionPlanDetail>('ProductionPlanDetail', ProductionPlanDetailSchema);