import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialStatusMaster extends Document {
  matl_status_id: string; // Char(3) - PK
  material_status: string; // Char(30)
  stock_movement?: string; // Char(3) - IN/OUT dropdown
  effect_in_stock?: string; // Char(1) - + or - dropdown
  seq_no: number; // N(2)
  active: boolean;
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const MaterialStatusMasterSchema: Schema = new Schema({
  matl_status_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 3,
    trim: true,
  },
  material_status: {
    type: String,
    required: true,
    maxlength: 30,
    trim: true,
  },
  stock_movement: {
    type: String,
    required: false,
    maxlength: 3,
    trim: true,
    enum: ['IN', 'OUT', ''],
  },
  effect_in_stock: {
    type: String,
    required: false,
    maxlength: 1,
    trim: true,
    enum: ['+', '-', ''],
  },
  seq_no: {
    type: Number,
    required: true,
    min: 1,
    max: 99,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
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

const MaterialStatusMaster = (mongoose.models.MaterialStatusMaster as mongoose.Model<IMaterialStatusMaster>) || mongoose.model<IMaterialStatusMaster>('MaterialStatusMaster', MaterialStatusMasterSchema);

export default MaterialStatusMaster;









