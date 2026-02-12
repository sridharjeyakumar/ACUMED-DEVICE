import mongoose, { Schema, Document } from 'mongoose';

export interface ICollectionBinMaster extends Document {
  bin_id: string; // Char(10) - PK
  bin_name: string; // Char(200)
  bin_short_name: string; // Char(100)
  bin_type: string; // Char(50) - Normal, etc.
  color: string; // Char(50)
  tare_weight_kg?: number; // N(10,2)
  gross_capacity_kg?: number; // N(10,2)
  active: boolean; // Boolean
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
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
  },
  color: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  tare_weight_kg: {
    type: Number,
    required: false,
    min: 0,
  },
  gross_capacity_kg: {
    type: Number,
    required: false,
    min: 0,
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
  collection: 'collectionbinmasters', // Explicitly set collection name to match existing database
});

// Create indexes
CollectionBinMasterSchema.index({ active: 1 });

const CollectionBinMaster = (mongoose.models.CollectionBinMaster as mongoose.Model<ICollectionBinMaster>) || 
  mongoose.model<ICollectionBinMaster>('CollectionBinMaster', CollectionBinMasterSchema);

export default CollectionBinMaster;

