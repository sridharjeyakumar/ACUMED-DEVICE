import mongoose, { Schema, Document } from 'mongoose';

export interface ICartonTypeMaster extends Document {
  carton_type_id: string; // Char(2) - PK (e.g., "PK", "ST", "SH")
  carton_type_name: string; // Char(100)
  carton_type_shortname: string; // Char(50)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
  active: boolean; // Boolean
}

const CartonTypeMasterSchema: Schema = new Schema({
  carton_type_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 2,
    trim: true,
    uppercase: true,
  },
  carton_type_name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  carton_type_shortname: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
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

// Add index for better query performance
CartonTypeMasterSchema.index({ carton_type_id: 1 }); // Already unique, but explicit for sorting
CartonTypeMasterSchema.index({ active: 1 }); // For filtering by active status

const CartonTypeMaster = (mongoose.models.CartonTypeMaster as mongoose.Model<ICartonTypeMaster>) || mongoose.model<ICartonTypeMaster>('CartonTypeMaster', CartonTypeMasterSchema);

export default CartonTypeMaster;














