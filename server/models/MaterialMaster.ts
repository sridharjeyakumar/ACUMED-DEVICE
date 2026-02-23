import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialMaster extends Document {
  material_id: string; // Char(10) - PK
  material_name: string; // Char(200)
  material_short_name: string; // Char(100)
  uom: string; // Char(10) - KGS, NOS, etc.
  material_category_id?: string; // Char(3)
  material_type: string; // Char(2) - RM or PM
  material_spec?: string; // Char(500)
  safety_stock_qty?: number; // N(10)
  re_order_qty?: number; // N(10)
  min_order_qty?: number; // N(10)
  lead_time_days_min?: number; // N(3) - can be null for "??"
  lead_time_days_max?: number; // N(3) - can be null for "??"
  shelf_life_in_months?: number; // N(3)
  qc_required?: boolean; // Boolean
  coa_checklist_id?: string; // Char(10)
  material_image?: string; // Image URL or base64
  material_image_icon?: string; // Image URL or base64
  active: boolean; // Boolean
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const MaterialMasterSchema: Schema = new Schema({
  material_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  material_name: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },
  material_short_name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  uom: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
  },
  material_category_id: {
    type: String,
    required: false,
    maxlength: 3,
    trim: true,
    index: true,
  },
  material_type: {
    type: String,
    required: true,
    maxlength: 2,
    trim: true,
    enum: ['RM', 'PM'],
    index: true,
  },
  material_spec: {
    type: String,
    required: false,
    maxlength: 500,
    trim: true,
  },
  safety_stock_qty: {
    type: Number,
    required: false,
    min: 0,
  },
  re_order_qty: {
    type: Number,
    required: false,
    min: 0,
  },
  min_order_qty: {
    type: Number,
    required: false,
    min: 0,
  },
  lead_time_days_min: {
    type: Number,
    required: false,
    min: 0,
    max: 999,
  },
  lead_time_days_max: {
    type: Number,
    required: false,
    min: 0,
    max: 999,
  },
  shelf_life_in_months: {
    type: Number,
    required: false,
    min: 0,
    max: 999,
  },
  qc_required: {
    type: Boolean,
    required: false,
    default: false,
  },
  coa_checklist_id: {
    type: String,
    required: false,
    maxlength: 10,
    trim: true,
  },
  material_image: {
    type: String,
    required: false,
  },
  material_image_icon: {
    type: String,
    required: false,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
    index: true,
  },
  last_modified_user_id: {
    type: String,
    required: false,
    maxlength: 5,
    trim: true,
  },
  last_modified_date_time: {
    type: Date,
    required: false,
  },
}, {
  timestamps: true,
});

// Create indexes for common queries
MaterialMasterSchema.index({ material_type: 1, active: 1 });
MaterialMasterSchema.index({ material_category_id: 1, active: 1 });

const MaterialMaster = (mongoose.models.MaterialMaster as mongoose.Model<IMaterialMaster>) || 
  mongoose.model<IMaterialMaster>('MaterialMaster', MaterialMasterSchema);

export default MaterialMaster;















