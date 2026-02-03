import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuMaster extends Document {
  menu_id: string; // Char(3) - PK
  menu_desc: string; // Char(100)
  active: boolean;
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const MenuMasterSchema: Schema = new Schema({
  menu_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 3,
    trim: true,
  },
  menu_desc: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
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

// Add indexes for better query performance
MenuMasterSchema.index({ active: 1 }); // For filtering by active status
MenuMasterSchema.index({ menu_id: 1 }); // Already unique, but explicit for sorting

// Check if model already exists to prevent overwrite error in Next.js hot reloading
const MenuMaster = (mongoose.models.MenuMaster as mongoose.Model<IMenuMaster>) || mongoose.model<IMenuMaster>('MenuMaster', MenuMasterSchema);

export default MenuMaster;


