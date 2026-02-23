import mongoose, { Schema, Document } from 'mongoose';

export interface IPackSizeMaster extends Document {
  pack_size_id: string; // Char(10) - PK
  pack_size_name: string; // Char(100)
  pack_size_short_name: string; // Char(50)
  qty_per_carton: number; // N(5)
  uom: string; // Char(10) - NOS, KG, etc.
  last_modified_user_id?: string; // Char(5) - FK to UserMaster
  last_modified_date_time?: Date; // Date
  active: boolean; // Boolean
}

const PackSizeMasterSchema: Schema = new Schema({
  pack_size_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
    trim: true,
  },
  pack_size_name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  pack_size_short_name: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  qty_per_carton: {
    type: Number,
    required: true,
    min: 0,
  },
  uom: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
  },
  last_modified_user_id: {
    type: String,
    required: false,
    maxlength: 5,
    trim: true,
    ref: 'UserMaster', // Reference to UserMaster
  },
  last_modified_date_time: {
    type: Date,
    required: false,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
}, {
  timestamps: true,
});

// Create indexes for common queries
PackSizeMasterSchema.index({ pack_size_id: 1 }, { unique: true });
PackSizeMasterSchema.index({ active: 1 });

const PackSizeMaster = (mongoose.models.PackSizeMaster as mongoose.Model<IPackSizeMaster>) || 
  mongoose.model<IPackSizeMaster>('PackSizeMaster', PackSizeMasterSchema);

export default PackSizeMaster;

