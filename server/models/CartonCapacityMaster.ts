import mongoose, { Schema, Document } from 'mongoose';

export interface ICartonCapacityMaster extends Document {
  carton_capacity_id: string; // Char(10) - PK (e.g., "SDU24", "DDU12")
  carton_capacity_name: string; // Char(200) (e.g., "DUVET Sterilization Carton - 24s")
  carton_capacity_shortname: string; // Char(50) (e.g., "Sterilization Carton")
  product_id: string; // Char(10) - FK to ProductMaster (e.g., "P0001")
  pack_size_id: string; // Char(10) - FK to PackSizeMaster (e.g., "PK24")
  pack_matl_id: string; // Char(10) - FK to MaterialMaster (e.g., "PM001")
  carton_type_id: string; // Char(2) - FK to CartonTypeMaster (e.g., "ST", "SH")
  carton_material_id: string; // Char(10) - FK to MaterialMaster (e.g., "PM004")
  packs_per_carton: number; // N(10) (e.g., 206, 412, 824)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
  active: boolean; // Boolean
}

const CartonCapacityMasterSchema: Schema = new Schema({
  carton_capacity_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
    trim: true,
    uppercase: true,
  },
  carton_capacity_name: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },
  carton_capacity_shortname: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  product_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  pack_size_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  pack_matl_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  carton_type_id: {
    type: String,
    required: true,
    maxlength: 2,
    trim: true,
    uppercase: true,
    index: true,
  },
  carton_material_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  packs_per_carton: {
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
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
CartonCapacityMasterSchema.index({ carton_capacity_id: 1 }); // Already unique, but explicit for sorting
CartonCapacityMasterSchema.index({ product_id: 1, active: 1 }); // For filtering by product
CartonCapacityMasterSchema.index({ pack_size_id: 1, active: 1 }); // For filtering by pack size
CartonCapacityMasterSchema.index({ carton_type_id: 1, active: 1 }); // For filtering by carton type
CartonCapacityMasterSchema.index({ active: 1 }); // For filtering by active status

const CartonCapacityMaster = (mongoose.models.CartonCapacityMaster as mongoose.Model<ICartonCapacityMaster>) || 
  mongoose.model<ICartonCapacityMaster>('CartonCapacityMaster', CartonCapacityMasterSchema);

export default CartonCapacityMaster;











