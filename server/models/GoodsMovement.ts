import mongoose, { Schema, Document } from 'mongoose';

// Status: E - Entered (default) / A - Approved / X - Cancelled
// GM No format: 'G' + YY + 5-digit serial (reset every year), e.g. G2600001

export interface IGoodsMovement extends Document {
  gm_no: string;                    // Char(8) PK - e.g. "G2600001"
  gm_date: Date;                    // Date - goods movement date
  material_status_id: string;       // Char(2) FK → MaterialStatusMaster (Goods Movement = 'Y')
  material_doc_no?: string;         // Char(8) FK → GoodsReceiptHeader (required if Against GR = 'Y')
  material_doc_date?: Date;         // Date - referenced GR document date
  material_id: string;              // Char(5) FK → MaterialMaster
  total_nett_qty: number;           // N(6,3)
  uom: string;                      // Char(3)
  remarks?: string;                 // Char(100)
  entered_by_user_id: string;       // Char(5)
  entered_date_time: Date;          // Date & Time
  approval_remarks?: string;        // Char(100)
  approved_by_user_id?: string;     // Char(5)
  approved_date_time?: Date;        // Date & Time
  status: string;                   // Char(1) - E / A / X
}

const GoodsMovementSchema: Schema = new Schema({
  gm_no: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  gm_date: {
    type: Date,
    required: true,
  },
  material_status_id: {
    type: String,
    required: true,
    maxlength: 2,
    trim: true,
    index: true,
  },
  material_doc_no: {
    type: String,
    required: false,
    maxlength: 8,
    trim: true,
    uppercase: true,
    index: true,
  },
  material_doc_date: {
    type: Date,
    required: false,
  },
  material_id: {
    type: String,
    required: true,
    maxlength: 5,
    trim: true,
    index: true,
  },
  total_nett_qty: {
    type: Number,
    required: true,
    min: 0,
  },
  uom: {
    type: String,
    required: true,
    maxlength: 3,
    trim: true,
    uppercase: true,
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
    enum: ['E', 'A', 'X'], // Entered / Approved / Cancelled
    default: 'E',
  },
}, {
  timestamps: true,
});

GoodsMovementSchema.index({ gm_no: 1 });
GoodsMovementSchema.index({ gm_date: 1, status: 1 });
GoodsMovementSchema.index({ material_status_id: 1, status: 1 });
GoodsMovementSchema.index({ material_id: 1, status: 1 });
GoodsMovementSchema.index({ material_doc_no: 1 });
GoodsMovementSchema.index({ status: 1 });

const GoodsMovement = (mongoose.models.GoodsMovement as mongoose.Model<IGoodsMovement>) ||
  mongoose.model<IGoodsMovement>('GoodsMovement', GoodsMovementSchema);

export default GoodsMovement;
