import mongoose, { Schema, Document } from 'mongoose';

export interface IUserMaster extends Document {
  user_id: string; // Char(10) - PK
  employee_id: string; // Char(5) - FK
  hash_password: string;
  role_id?: string; // Char(3) - FK to RoleMaster
  Date_password_changed_date?: Date;
  Date_password_expiry_date?: Date;
  N_password_expiry_days?: number; // Number(3)
  Date_last_login_date?: Date;
  Time_last_login_time?: string;
  active: boolean;
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const UserMasterSchema: Schema = new Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
    trim: true,
  },
  employee_id: {
    type: String,
    required: true,
    maxlength: 5,
    trim: true,
  },
  hash_password: {
    type: String,
    required: true,
  },
  role_id: {
    type: String,
    required: false,
    maxlength: 3,
    trim: true,
    ref: 'RoleMaster',
  },
  Date_password_changed_date: {
    type: Date,
    required: false,
  },
  Date_password_expiry_date: {
    type: Date,
    required: false,
  },
  N_password_expiry_days: {
    type: Number,
    required: false,
    min: 0,
    max: 999,
  },
  Date_last_login_date: {
    type: Date,
    required: false,
  },
  Time_last_login_time: {
    type: String,
    required: false,
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

// Create index on user_id for faster queries
UserMasterSchema.index({ user_id: 1 });
UserMasterSchema.index({ employee_id: 1 });

const UserMaster = mongoose.model<IUserMaster>('UserMaster', UserMasterSchema);

export default UserMaster;


