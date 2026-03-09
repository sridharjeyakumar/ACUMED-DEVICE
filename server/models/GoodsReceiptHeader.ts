import mongoose, { Schema, Document } from 'mongoose';

export interface IGoodsReceiptHeader extends Document {
  material_doc_no: string;            // Char(8) - Primary Key (Manual ID)
  material_doc_date: Date;           // Date
  material_doc_time: string;           // Time (stored as string "HH:mm")
  material_status_id: string;        // Char(2) - Foreign Key
  invoice_no: string;                // Char(10)
  invoice_date: Date;                // Date
  po_no: string;                     // Char(10)
  po_date: Date;                     // Date
  received_by_emp_id: string;        // Char(5) - Foreign Key
  checked_by_emp_id: string;         // Char(5) - Foreign Key
  remarks?: string;                  // Char(100)
  last_modified_user_id: string;     // Char(5)
  last_modified_date_time: Date;     // Date
  status: string;                    // Char(1) (e.g., 'A' for Active, 'P' for Pending)
}

const GoodsReceiptHeaderSchema: Schema = new Schema({
  material_doc_no: { 
    type: String, 
    required: true, 
    unique: true, 
    maxlength: 8, 
    trim: true 
  },
  material_doc_date: { type: Date, required: true },
  material_doc_time: { type: String, required: true }, // Format "HH:mm"
  
  // Foreign Key Reference to a hypothetical MaterialStatusMaster collection
  material_status_id: { 
    type: String, 
    required: true, 
    maxlength: 2,
    ref: 'MaterialStatusMaster' 
  },
  
  invoice_no: { type: String, maxlength: 10, trim: true },
  invoice_date: { type: Date },
  po_no: { type: String, maxlength: 10, trim: true },
  po_date: { type: Date },
  
  // Foreign Key References to EmployeeMaster collection
  received_by_emp_id: { 
    type: String, 
    required: true, 
    maxlength: 5, 
    ref: 'EmployeeMaster' 
  },
  checked_by_emp_id: { 
    type: String, 
    required: true, 
    maxlength: 5, 
    ref: 'EmployeeMaster' 
  },
  
  remarks: { type: String, maxlength: 100, trim: true },
  last_modified_user_id: { type: String, maxlength: 5 },
  last_modified_date_time: { type: Date, default: Date.now },
  status: { type: String, maxlength: 1, default: '1' }
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt
});

// Indices for performance
GoodsReceiptHeaderSchema.index({ material_doc_no: 1 });
GoodsReceiptHeaderSchema.index({ po_no: 1 });
GoodsReceiptHeaderSchema.index({ invoice_no: 1 });

const GoodsReceiptHeader = (mongoose.models.GoodsReceiptHeader as mongoose.Model<IGoodsReceiptHeader>) || 
  mongoose.model<IGoodsReceiptHeader>('GoodsReceiptHeader', GoodsReceiptHeaderSchema);

export default GoodsReceiptHeader;