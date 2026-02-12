import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeMaster extends Document {
  emp_id: string; // Char(5) - PK
  emp_name: string; // Char(100)
  location?: string; // Char(50)
  dept_id?: string; // Char(3) - FK to DepartmentMaster
  gender: string; // Char(1) - M/F
  grade_id?: string; // Char(3) - FK to EmployeeGradeMaster
  team?: string; // Char(50)
  category?: string; // Char(50)
  pf_no?: string; // Char(50)
  esi_no?: string; // Char(50)
  doj?: Date; // Date - Date of Joining
  dol?: Date; // Date - Date of Leaving
  remarks?: string; // Char(500)
  address?: string; // Char(500)
  mobile_no?: string; // Char(15)
  dob?: Date; // Date - Date of Birth
  age?: number; // Number
  married?: boolean; // Boolean
  blood_group?: string; // Char(10)
  education?: string; // Char(200)
  emp_photo?: string; // String - Photo URL or path
  status?: string; // Char(20) - Active/Exited
  active: boolean; // Boolean
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const EmployeeMasterSchema: Schema = new Schema({
  emp_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 5,
    trim: true,
    index: true,
  },
  emp_name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  location: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  dept_id: {
    type: String,
    required: false,
    maxlength: 3,
    trim: true,
    ref: 'DepartmentMaster',
  },
  gender: {
    type: String,
    required: true,
    maxlength: 1,
    enum: ['M', 'F'],
    default: 'M',
  },
  grade_id: {
    type: String,
    required: false,
    maxlength: 3,
    trim: true,
    ref: 'EmployeeGradeMaster',
  },
  team: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  category: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  pf_no: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  esi_no: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  doj: {
    type: Date,
    required: false,
  },
  dol: {
    type: Date,
    required: false,
  },
  remarks: {
    type: String,
    required: false,
    maxlength: 500,
    trim: true,
  },
  address: {
    type: String,
    required: false,
    maxlength: 500,
    trim: true,
  },
  mobile_no: {
    type: String,
    required: false,
    maxlength: 15,
    trim: true,
  },
  dob: {
    type: Date,
    required: false,
  },
  age: {
    type: Number,
    required: false,
    min: 0,
    max: 150,
  },
  married: {
    type: Boolean,
    required: false,
    default: false,
  },
  blood_group: {
    type: String,
    required: false,
    maxlength: 10,
    trim: true,
  },
  education: {
    type: String,
    required: false,
    maxlength: 200,
    trim: true,
  },
  emp_photo: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: false,
    maxlength: 20,
    enum: ['Active', 'Exited'],
    default: 'Active',
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
    index: true,
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
  collection: 'employeemasters', // Explicitly set collection name
});

// Create indexes for better query performance
EmployeeMasterSchema.index({ dept_id: 1 });
EmployeeMasterSchema.index({ grade_id: 1 });
EmployeeMasterSchema.index({ active: 1 });
EmployeeMasterSchema.index({ status: 1 });

// Check if model already exists to prevent overwrite error in Next.js hot reloading
const EmployeeMaster = (mongoose.models.EmployeeMaster as mongoose.Model<IEmployeeMaster>) || 
  mongoose.model<IEmployeeMaster>('EmployeeMaster', EmployeeMasterSchema);

export default EmployeeMaster;




