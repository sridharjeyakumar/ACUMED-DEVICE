import mongoose, { Schema, Document } from 'mongoose';

export interface IRoleMaster extends Document {
  roll_id: string; // Char(3) - PK
  roll_description: string; // Char(50)
  remarks: string; // Char(100)
  active: boolean;
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
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

// Create index on roll_id for faster queries
RoleMasterSchema.index({ roll_id: 1 });

const RoleMaster = mongoose.model<IRoleMaster>('RoleMaster', RoleMasterSchema);

export default RoleMaster;


