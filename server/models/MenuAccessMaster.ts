import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuAccessMaster extends Document {
  rold_id: string; // Char(3) - FK to RoleMaster
  menu_id: string; // Char(3) - FK to MenuMaster
  access: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_view: boolean;
  can_cancel: boolean;
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const MenuAccessMasterSchema: Schema = new Schema({
  rold_id: {
    type: String,
    required: true,
    maxlength: 3,
    trim: true,
    ref: 'RoleMaster',
  },
  menu_id: {
    type: String,
    required: true,
    maxlength: 3,
    trim: true,
    ref: 'MenuMaster',
  },
  access: {
    type: Boolean,
    required: true,
    default: true,
  },
  can_add: {
    type: Boolean,
    required: true,
    default: true,
  },
  can_edit: {
    type: Boolean,
    required: true,
    default: true,
  },
  can_view: {
    type: Boolean,
    required: true,
    default: true,
  },
  can_cancel: {
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

// Create compound index for unique role-menu combination
MenuAccessMasterSchema.index({ rold_id: 1, menu_id: 1 }, { unique: true });
// Add additional indexes for better query performance
MenuAccessMasterSchema.index({ rold_id: 1 }); // For filtering by role
MenuAccessMasterSchema.index({ menu_id: 1 }); // For filtering by menu
MenuAccessMasterSchema.index({ access: 1 }); // For filtering by access status

// Check if model already exists to prevent overwrite error in Next.js hot reloading
const MenuAccessMaster = (mongoose.models.MenuAccessMaster as mongoose.Model<IMenuAccessMaster>) || mongoose.model<IMenuAccessMaster>('MenuAccessMaster', MenuAccessMasterSchema);

export default MenuAccessMaster;


