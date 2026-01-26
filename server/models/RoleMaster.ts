import mongoose, { Schema, Document } from 'mongoose';

export interface IRoleMaster extends Document {
  roll_id: string; // Char(3) - PK
  roll_description: string; // Char(50)
  remarks: string; // Char(100)
  active: boolean;
}

const RoleMasterSchema: Schema = new Schema({
  roll_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 3,
    trim: true,
  },
  roll_description: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  remarks: {
    type: String,
    required: false,
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

// Create index on roll_id for faster queries
RoleMasterSchema.index({ roll_id: 1 });

const RoleMaster = mongoose.model<IRoleMaster>('RoleMaster', RoleMasterSchema);

export default RoleMaster;

