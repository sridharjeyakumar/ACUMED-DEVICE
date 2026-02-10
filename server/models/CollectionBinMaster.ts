import mongoose, { Schema, Document } from 'mongoose';

export interface ICollectionBinMaster extends Document {
  bin_id: string; // Char(10) - PK (e.g., "1", "2", "91", "92")
  bin_name: string; // Char(200) (e.g., "Product collection Bin 1")
  bin_short_name: string; // Char(100) (e.g., "Bin 1")
  bin_type: string; // Char(50) - Normal, Rejected, etc.
  color: string; // Char(50) (e.g., "Blue", "Red")
  tare_weight_kg: number; // N(10,2) - Weight of empty bin in kg
  gross_capacity_kg: number; // N(10,2) - Maximum total weight including tare weight
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
  active: boolean; // Boolean
}

const CollectionBinMasterSchema: Schema = new Schema({
  bin_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  bin_name: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },
  bin_short_name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  bin_type: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
    enum: ['Normal', 'Rejected', 'GENERAL', 'HAZARDOUS', 'RECYCLABLE', 'SCRAP', 'REWORK'],
  },
  color: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  tare_weight_kg: {
    type: Number,
    required: true,
    min: 0,
  },
  gross_capacity_kg: {
    type: Number,
    required: true,
    min: 0,
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
  active: {
    type: Boolean,
    required: true,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
CollectionBinMasterSchema.index({ bin_type: 1, active: 1 }); // For filtering by bin type
CollectionBinMasterSchema.index({ color: 1 }); // For filtering by color

const CollectionBinMaster = (mongoose.models.CollectionBinMaster as mongoose.Model<ICollectionBinMaster>) || 
  mongoose.model<ICollectionBinMaster>('CollectionBinMaster', CollectionBinMasterSchema);

export default CollectionBinMaster;



