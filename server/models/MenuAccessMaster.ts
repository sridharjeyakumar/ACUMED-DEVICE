import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuAccessMaster extends Document {
  rold_id: string; // Char(3) - FK to RoleMaster
  menu_id: string; // Char(3) - FK to MenuMaster
  access: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_view: boolean;
  can_cancel: boolean;
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
}, {
  timestamps: true,
});

// Create compound index for unique role-menu combination
MenuAccessMasterSchema.index({ rold_id: 1, menu_id: 1 }, { unique: true });

const MenuAccessMaster = mongoose.model<IMenuAccessMaster>('MenuAccessMaster', MenuAccessMasterSchema);

export default MenuAccessMaster;

