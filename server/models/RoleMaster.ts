import mongoose, { Schema, Document } from 'mongoose';

export interface IRoleMaster extends Document {
  roll_id: string; // Char(3) - PK
  roll_description: string; // Char(50)
  remarks: string; // Char(100)
  idle_session_timeout?: string; // Char(1) ('Y' or 'N')
  idle_session_in_minutes?: number; // Number (if idle_session_timeout is 'Y') N(2)
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
  idle_session_timeout: {
    type: String,
    required: false,
    enum: ['Y', 'N'],
    maxlength: 1,
    trim: true,
    default: 'N',
  },
  idle_session_in_minutes: {
    type: Number,
    required: false,
    min: 0,
    max: 99,
    default: 0,
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
RoleMasterSchema.index({ active: 1 }); // For filtering by active status
RoleMasterSchema.index({ roll_id: 1 }); // Already unique, but explicit for sorting

// Check if model already exists to prevent overwrite error in Next.js hot reloading
const RoleMaster = (mongoose.models.RoleMaster as mongoose.Model<IRoleMaster>) || mongoose.model<IRoleMaster>('RoleMaster', RoleMasterSchema);

export default RoleMaster;


