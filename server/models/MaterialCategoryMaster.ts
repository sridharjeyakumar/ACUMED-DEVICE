import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialCategoryMaster extends Document {
  material_category_id: string; // Char(3) - PK (e.g., "M01", "M02", "M03")
  material_category_name: string; // Char(25)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const MaterialCategoryMasterSchema: Schema = new Schema({
  material_category_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 3,
    trim: true,
  },
  material_category_name: {
    type: String,
    required: true,
    maxlength: 25,
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
}, {
  timestamps: true,
});

const MaterialCategoryMaster = (mongoose.models.MaterialCategoryMaster as mongoose.Model<IMaterialCategoryMaster>) || mongoose.model<IMaterialCategoryMaster>('MaterialCategoryMaster', MaterialCategoryMasterSchema);

export default MaterialCategoryMaster;













