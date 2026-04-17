import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrderDetail extends Document {
  po_no: string;             // Char(8) FK → PurchaseOrder
  material_id: string;       // Char(5) FK → MaterialMaster
  sno: number;               // N(2) - Serial number within PO
  po_qty: number;            // N(6,3) - Ordered quantity
  uom: string;               // Char(3) FK → UomMaster
  material_spec?: string;    // Char(500) - Material specification
  remarks?: string;          // Char(100)
  gr_qty: number;            // N(6,3) - Goods receipt qty (autofilled)
  balance_qty: number;       // N(6,3) - Balance qty = po_qty - gr_qty (autofilled)
  unit_price?: number;         // N(5,2) 
  basic_amount?: number;       // N(8,2) 
  gst_percentage?: number;     // N(2,2)
  gst_amount?: number;         // N(8,2)
  total_amount?: number;       // N(8,2)
  expected_delivery_date?: Date; // Date
}

const PurchaseOrderDetailSchema: Schema = new Schema({
  po_no: {
    type: String,
    required: true,
    maxlength: 8,
    trim: true,
    uppercase: true,
    ref: 'PurchaseOrder',
    index: true,
  },
  material_id: {
    type: String,
    required: true,
    maxlength: 5,
    trim: true,
    uppercase: true,
    ref: 'MaterialMaster',
  },
  sno: {
    type: Number,
    required: true,
    min: 1,
    max: 99, // N(2)
  },
  po_qty: {
    type: Number,
    required: true,
    min: 0,
    max: 999999.999, // N(6,3)
  },
  uom: {
    type: String,
    required: true,
    maxlength: 3,
    trim: true,
    uppercase: true,
    ref: 'UomMaster',
  },
  material_spec: {
    type: String,
    required: false,
    maxlength: 500,
    trim: true,
  },
  remarks: {
    type: String,
    required: false,
    maxlength: 100,
    trim: true,
  },
  gr_qty: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
    max: 999999.999, // N(6,3)
  },
  balance_qty: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
    max: 999999.999, // N(6,3)
  },
  unit_price: {
    type: Number,
    required: false,
    min: 0,
    max: 99999.99, // N(5,2)
  },
  basic_amount: {
    type: Number,
    required: false,
    min: 0,
    max: 99999999.99, // N(8,2)
  },
  gst_percentage: {
    type: Number,
    required: false,
    min: 0,
    max: 99.99, // N(2,2)
  },
  gst_amount: {
    type: Number,
    required: false,
    min: 0,
    max: 99999999.99, // N(8,2)
  },
  total_amount: {
    type: Number,
    required: false,
    min: 0,
    max: 99999999.99, // N(8,2)
  },
  expected_delivery_date: {
    type: Date,
    required: false,
  },
}, {
  timestamps: true,
});

PurchaseOrderDetailSchema.index({ po_no: 1, sno: 1 }, { unique: true });
PurchaseOrderDetailSchema.index({ po_no: 1, material_id: 1 });

const PurchaseOrderDetail = (mongoose.models.PurchaseOrderDetail as mongoose.Model<IPurchaseOrderDetail>) ||
  mongoose.model<IPurchaseOrderDetail>('PurchaseOrderDetail', PurchaseOrderDetailSchema);

export default PurchaseOrderDetail;
