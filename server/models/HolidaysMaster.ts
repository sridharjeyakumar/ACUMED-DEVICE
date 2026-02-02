import mongoose, { Schema, Document } from 'mongoose';

export interface IHolidaysMaster extends Document {
  date: Date; // Date
  remarks: string; // Char(25)
  year: number; // N(4)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const HolidaysMasterSchema: Schema = new Schema({
  date: {
    type: Date,
    required: true,
    trim: true,
  },
  remarks: {
    type: String,
    required: true,
    maxlength: 25,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1000,
    max: 9999,
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

// Create compound index on date and year for uniqueness
HolidaysMasterSchema.index({ date: 1, year: 1 }, { unique: true });

const HolidaysMaster = (mongoose.models.HolidaysMaster as mongoose.Model<IHolidaysMaster>) || mongoose.model<IHolidaysMaster>('HolidaysMaster', HolidaysMasterSchema);

export default HolidaysMaster;

