import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeGradeMaster extends Document {
  grade_id: string; // Char(3) - PK
  grade_name: string; // Char(25)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const EmployeeGradeMasterSchema: Schema = new Schema({
  grade_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 3,
    trim: true,
  },
  grade_name: {
    type: String,
    required: true,
    maxlength: 25,
    trim: true,
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

const EmployeeGradeMaster = (mongoose.models.EmployeeGradeMaster as mongoose.Model<IEmployeeGradeMaster>) || mongoose.model<IEmployeeGradeMaster>('EmployeeGradeMaster', EmployeeGradeMasterSchema);

export default EmployeeGradeMaster;



