import mongoose, { Schema, Document } from 'mongoose';

export interface IGoodsReceiptDetail extends Document {
  material_doc_no: string;        // Char(8) - FK to Header
  material_id: string;            // Char(5) - FK to Material Master
  invoice_total_nett_qty: number; // N(6,3) e.g., 999.999
  uom: string;                    // Char(3) (Unit of Measure)
  total_pockets: number;          // N(3)
  total_rolls: number;            // N(3)
  existing_stock_qty: number;     // N(6,3) - Autofilled from Stock Table
  existing_total_rolls: number;   // N(3)   - Autofilled from Stock Table
}

const GoodsReceiptDetailSchema: Schema = new Schema({
  // Link to the Header Table (MaterialReceipt)
  material_doc_no: { 
    type: String, 
    required: true, 
    ref: 'GoodsReceiptHeader',
    index: true 
  },
  
  // Link to the Material Master
  material_id: { 
    type: String, 
    required: true, 
    maxlength: 5,
    ref: 'MaterialMaster' 
  },
  
  invoice_total_nett_qty: { 
    type: Number, 
    required: true,
    min: 0,
    max: 999.999 // Fits N(6,3)
  },
  
  uom: { 
    type: String, 
    required: true, 
    maxlength: 3,
    uppercase: true 
  },
  
  total_pockets: { type: Number, max: 999 },
  total_rolls: { type: Number, max: 999 },
  
  // These fields are populated from the MaterialStock table during entry
  existing_stock_qty: { type: Number, default: 0 },
  existing_total_rolls: { type: Number, default: 0 }
  
}, {
  timestamps: true,
});

const GoodsReceiptDetail = (mongoose.models.GoodsReceiptDetail as mongoose.Model<IGoodsReceiptDetail>) || 
  mongoose.model<IGoodsReceiptDetail>('GoodsReceiptDetail', GoodsReceiptDetailSchema);

export default GoodsReceiptDetail;