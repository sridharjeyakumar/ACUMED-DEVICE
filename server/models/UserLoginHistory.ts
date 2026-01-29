import mongoose, { Schema, Document } from 'mongoose';

export interface IUserLoginHistory extends Document {
  user_id: string; // Char(10) - FK to UserMaster
  Date_login_Date?: Date;
  Time_login_Time?: string;
  Date_Logout_Date?: Date;
  Time_Logout_Time?: string;
}

const UserLoginHistorySchema: Schema = new Schema({
  user_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    ref: 'UserMaster',
  },
  Date_login_Date: {
    type: Date,
    required: false,
  },
  Time_login_Time: {
    type: String,
    required: false,
  },
  Date_Logout_Date: {
    type: Date,
    required: false,
  },
  Time_Logout_Time: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

// Create index on user_id for faster queries
UserLoginHistorySchema.index({ user_id: 1 });
UserLoginHistorySchema.index({ Date_login_Date: 1 });

// Check if model already exists to prevent overwrite error in Next.js hot reloading
const UserLoginHistory = mongoose.models.UserLoginHistory || mongoose.model<IUserLoginHistory>('UserLoginHistory', UserLoginHistorySchema);

export default UserLoginHistory;



