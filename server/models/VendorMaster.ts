import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorMaster extends Document {
  vendor_id: string; // Char(5) - PK
  vendor_name: string; // Char(100)
  vendor_short_name: string; // Char(50)
  vendor_type: string; // Char(1) - M: Material Supply, S: Service
  address1: string; // Char(100)
  address2?: string; // Char(100)
  city: string; // Char(50)
  district: string; // Char(50)
  state: string; // Char(50)
  pincode: number; // N(6)
  gst_no?: string; // Char(15)
  cin_no?: string; // Char(15)
  pan_no?: string; // Char(15)
  tan_no?: string; // Char(15)
  contact_person?: string; // Char(50)
  contact_no?: number; // N(10)
  contact_email_id?: string; // Char(50)
  website?: string; // Char(50)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
  active: boolean; // Boolean
  default_shipping_instruction?: string; // Char(500)
  default_terms_of_payment?: string; // Char(500)
  default_material_type?:string; //Chart(2)
}

const VendorMasterSchema: Schema = new Schema({
  vendor_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 5,
    trim: true,
    index: true,
  },
  vendor_name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  vendor_short_name: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  vendor_type: {
    type: String,
    required: true,
    maxlength: 1,
    trim: true,
    enum: ['M', 'S'],
    index: true,
  },
  address1: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  address2: {
    type: String,
    required: false,
    maxlength: 100,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  district: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  pincode: {
    type: Number,
    required: true,
    min: 100000,
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
    maxlength: 15,
    trim: true,
  },
  pan_no: {
    type: String,
    required: false,
    maxlength: 15,
    trim: true,
  },
  tan_no: {
    type: String,
    required: false,
    maxlength: 15,
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
  contact_email_id: {
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
    index: true,
  },
  default_shipping_instruction: {
    type: String,
    required: false,
    maxlength: 500,
    trim: true,
  },
  default_terms_of_payment: {
    type: String,
    required: false,
    maxlength: 500,
    trim: true,
  },
  default_material_type: {
    type: String,
    required: false,
    maxlength: 2,
    trim: true,
  },
}, {
  timestamps: true,
});

// Create indexes for common queries
VendorMasterSchema.index({ vendor_type: 1, active: 1 });

const VendorMaster = (mongoose.models.VendorMaster as mongoose.Model<IVendorMaster>) ||
  mongoose.model<IVendorMaster>('VendorMaster', VendorMasterSchema);

export default VendorMaster;
