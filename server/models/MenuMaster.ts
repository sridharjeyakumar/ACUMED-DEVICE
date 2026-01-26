import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuMaster extends Document {
  menu_id: string; // Char(3) - PK
  menu_desc: string; // Char(100)
  active: boolean;
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
}, {
  timestamps: true,
});

// Create index on menu_id for faster queries
MenuMasterSchema.index({ menu_id: 1 });

const MenuMaster = mongoose.model<IMenuMaster>('MenuMaster', MenuMasterSchema);

export default MenuMaster;

