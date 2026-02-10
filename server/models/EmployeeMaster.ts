import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeMaster extends Document {
  emp_id: string; // Char(10) - PK (e.g., "E1001", "E1002")
  emp_name: string; // Char(200) (e.g., "KATHIR", "NIKIL")
  location: string; // Char(50) (e.g., "Corporate", "Factory")
  dept_id: string; // Char(10) - FK to DepartmentMaster (e.g., "MGT", "ADM", "PR1", "PR2")
  gender: string; // Char(1) (e.g., "M", "F")
  grade_id: string; // Char(10) - FK to EmployeeGradeMaster (e.g., "DIR", "MGR", "OPR")
  team: string; // Char(10) (e.g., "EX", "T2", "T1")
  category: string; // Char(20) (e.g., "Regular", "Contract")
  pf_no?: string; // Char(50) - Optional
  esi_no?: string; // Char(50) - Optional
  doj?: Date; // Date - Date of Joining
  dol?: Date; // Date - Date of Leaving
  remarks?: string; // Char(500) - Optional
  address?: string; // Char(500) - Optional
  mobile_no?: string; // Char(15) - Optional
  dob?: Date; // Date - Date of Birth
  age?: number; // N(3) - Optional
  married?: boolean; // Boolean
  blood_group?: string; // Char(10) - Optional
  education?: string; // Char(200) - Optional
  emp_photo?: string; // String - Optional (URL/path)
  status: string; // Char(20) (e.g., "Active", "Exited")
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
  active: boolean; // Boolean
}

const EmployeeMasterSchema: Schema = new Schema({
  emp_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
    trim: true,
    uppercase: true,
    index: true,
  },
  emp_name: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
    index: true,
  },
  dept_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  gender: {
    type: String,
    required: true,
    maxlength: 1,
    trim: true,
    enum: ['M', 'F'],
    uppercase: true,
  },
  grade_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  team: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    maxlength: 20,
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
    required: true,
    maxlength: 20,
    trim: true,
    enum: ['Active', 'Exited', 'Resigned'],
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
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
EmployeeMasterSchema.index({ dept_id: 1, active: 1 }); // For filtering by department
EmployeeMasterSchema.index({ grade_id: 1, active: 1 }); // For filtering by grade
EmployeeMasterSchema.index({ location: 1, active: 1 }); // For filtering by location
EmployeeMasterSchema.index({ status: 1, active: 1 }); // For filtering by status

const EmployeeMaster = (mongoose.models.EmployeeMaster as mongoose.Model<IEmployeeMaster>) || 
  mongoose.model<IEmployeeMaster>('EmployeeMaster', EmployeeMasterSchema);

export default EmployeeMaster;



