import mongoose, { Schema, Document } from 'mongoose';

// Status: E - Entered / A - Active / X - Cancelled / C - Closed
// PO No format: 'M' + YY + Running Sno (000001 reset every year), e.g. M26000001

export interface IPurchaseOrder extends Document {
  po_no: string;                    // Char(8) PK - e.g. "M26000001"
  po_date: Date;                    // Date
  po_time: string;                  // Time - stored as "HH:MM:SS"
  vendor_id: string;                // Char(2) FK → VendorMaster
  vendor_ref_doc_no?: string;       // Char(10)
  vendor_ref_doc_date?: Date;       // Date
  delivery_text?: string;           // Char(10)
  shipping_instruction?: String;      // Date
  terms_of_payment?: string;        // Char(5) FK
  remarks?: string;                 // Char(5) FK
  entered_by_user_id: string;       // Char(5)
  entered_date_time: Date;          // Date & Time
  approval_remarks?: string;        // Char(100)
  approved_by_user_id?: string;     // Char(5)
  approved_date_time?: Date;        // Date & Time
  status: string;                   // Char(1) - E / A / X / C
  po_basic_amount?: number;             // N(8,2) 
  po_gst_amount?: number;               // N(8,2)
  po_total_amount?: number;             // N(8,2)
  mail_sent_status?: string;              // Char(1) 
}

const PurchaseOrderSchema: Schema = new Schema({
  po_no: {
    type: String,
    required: true,
    unique: true,
    maxlength: 8,
    trim: true,
    uppercase: true,
  },
  po_date: {
    type: Date,
    required: true,
  },
  po_time: {
    type: String,
    required: true,
    maxlength: 8, // "HH:MM:SS"
    trim: true,
  },
  vendor_id: {
    type: String,
    required: true,
    maxlength: 5,
    trim: true,
    index: true,
  },
  vendor_ref_doc_no: {
    type: String,
    required: false,
    maxlength: 10,
    trim: true,
  },
  vendor_ref_doc_date: {
    type: Date,
    required: false,
  },
  delivery_text: {
    type: String,
    required: false,
    maxlength: 100,
    trim: true,
  },
  shipping_instruction: {
    type: String,
    required: false,
    maxlength: 100,
  },
  terms_of_payment: {
    type: String,
    required: false,
    maxlength: 100,
    trim: true,
  },
  remarks: {
    type: String,
    required: false,
    maxlength: 100,
    trim: true,
  },
  entered_by_user_id: {
    type: String,
    required: true,
    maxlength: 5,
    trim: true,
  },
  entered_date_time: {
    type: Date,
    required: true,
  },
  approval_remarks: {
    type: String,
    required: false,
    maxlength: 100,
    trim: true,
  },
  approved_by_user_id: {
    type: String,
    required: false,
    maxlength: 5,
    trim: true,
  },
  approved_date_time: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    required: true,
    maxlength: 1,
    trim: true,
    uppercase: true,
    enum: ['E', 'A', 'X', 'C'], // Entered / Active / Cancelled / Closed
    default: 'E',
  },
  po_basic_amount: {
    type: Number,
    required: false,
    min: 0,
  },
  po_gst_amount: {
    type: Number,
    required: false,
    min: 0,
  },
  po_total_amount: {
    type: Number,
    required: false,
    min: 0,
  },
  mail_sent_status: {
    type: String,
    required: false,
    maxlength: 1,
    trim: true,
    uppercase: true,
  },
}, {
  timestamps: true,
});

PurchaseOrderSchema.index({ po_no: 1 });
PurchaseOrderSchema.index({ po_date: 1, status: 1 });
PurchaseOrderSchema.index({ vendor_id: 1, status: 1 });
PurchaseOrderSchema.index({ status: 1 });

const PurchaseOrder = (mongoose.models.PurchaseOrder as mongoose.Model<IPurchaseOrder>) ||
  mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);

export default PurchaseOrder;
