import mongoose, { Schema, Document } from 'mongoose';

export interface IWeeklyOffMaster extends Document {
  week_off_id: number; // N(1) - PK
  day_of_week: number; // N(1) - 1=Monday, 2=Tuesday, ..., 7=Sunday
  week_of_month?: number; // N(1) - Optional, week number within month (1-4)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const WeeklyOffMasterSchema: Schema = new Schema({
  week_off_id: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 9,
  },
  day_of_week: {
    type: Number,
    required: true,
    min: 1,
    max: 7,
  },
  week_of_month: {
    type: Number,
    required: false,
    min: 1,
    max: 4,
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

const WeeklyOffMaster = (mongoose.models.WeeklyOffMaster as mongoose.Model<IWeeklyOffMaster>) || mongoose.model<IWeeklyOffMaster>('WeeklyOffMaster', WeeklyOffMasterSchema);

export default WeeklyOffMaster;


