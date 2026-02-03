import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyMaster extends Document {
  comp_id: string; // Char(4) - PK
  company_name: string; // Char(100)
  company_short_name?: string; // Char(50)
  address_1?: string; // Char(100)
  address_2?: string; // Char(100)
  city?: string; // Char(50)
  state?: string; // Char(50)
  pincode?: number; // N(6)
  gst_no?: string; // Char(15)
  cin_no?: string; // Char(21)
  pan_no?: string; // Char(15)
  email_id?: string; // Char(50)
  website?: string; // Char(50)
  contact_person?: string; // Char(50)
  contact_no?: number; // N(10)
  logo?: string; // Image
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const CompanyMasterSchema: Schema = new Schema({
  comp_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 4,
    trim: true,
  },
  company_name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  company_short_name: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  address_1: {
    type: String,
    required: false,
    maxlength: 100,
    trim: true,
  },
  address_2: {
    type: String,
    required: false,
    maxlength: 100,
    trim: true,
  },
  city: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  state: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  pincode: {
    type: Number,
    required: false,
    min: 0,
    max: 999999,
  },
  gst_no: {
    type: String,
    required: false,
    maxlength: 15,
    trim: true,
  },
  cin_no: {
    type: String,
    required: false,
    maxlength: 21,
    trim: true,
  },
  pan_no: {
    type: String,
    required: false,
    maxlength: 15,
    trim: true,
  },
  email_id: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  website: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  contact_person: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  contact_no: {
    type: Number,
    required: false,
    min: 0,
    max: 9999999999,
  },
  logo: {
    type: String,
    required: false,
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
CompanyMasterSchema.index({ state: 1 }); // For filtering by state
CompanyMasterSchema.index({ city: 1 }); // For filtering by city
CompanyMasterSchema.index({ comp_id: 1 }); // Already unique, but explicit for sorting

const CompanyMaster = (mongoose.models.CompanyMaster as mongoose.Model<ICompanyMaster>) || mongoose.model<ICompanyMaster>('CompanyMaster', CompanyMasterSchema);

export default CompanyMaster;
