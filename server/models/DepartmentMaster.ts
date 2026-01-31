import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartmentMaster extends Document {
  dept_id: string; // Char(3) - PK
  department_name: string; // Char(25)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const DepartmentMasterSchema: Schema = new Schema({
  dept_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 3,
    trim: true,
  },
  department_name: {
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

const DepartmentMaster = (mongoose.models.DepartmentMaster as mongoose.Model<IDepartmentMaster>) || mongoose.model<IDepartmentMaster>('DepartmentMaster', DepartmentMasterSchema);

export default DepartmentMaster;

