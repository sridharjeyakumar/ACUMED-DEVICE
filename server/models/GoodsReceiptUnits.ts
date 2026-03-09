import mongoose, { Schema, Document } from 'mongoose';

export interface IGoodsReceiptUnits extends Document {
  material_doc_no: string;    // PK Part 1
  material_id: string;        // PK Part 2
  sno: number;                // PK Part 3
  packet_no: string;          // Char (10)
  roll_no: string;            // Char (10)
  nett_qty: number;           // N (6,3)
  uom: string;                // Char (3)
  actual_qty: number;         // N (6,3)
  consumed_qty: number;       // N (6,3)
  rejected_qty: number;       // N (6,3)
  balance_qty: number;        // N (6,3)
  status: string;             // Char (1)
}

const GoodsReceiptUnitsSchema: Schema = new Schema({
  // --- Composite Primary Key (1st 3 fields) ---
  material_doc_no: { 
    type: String, 
    required: true, 
    maxlength: 8,
    trim: true 
  },
  material_id: { 
    type: String, 
    required: true, 
    maxlength: 5,
    ref: 'MaterialMaster' 
  },
  sno: { 
    type: Number, 
    required: true 
  },

  // --- Transactional Fields ---
  packet_no: { type: String, maxlength: 10, trim: true },
  roll_no: { type: String, maxlength: 10, trim: true },
  nett_qty: { type: Number, required: true },
  uom: { type: String, maxlength: 3, uppercase: true },
  actual_qty: { type: Number, required: true },
  consumed_qty: { type: Number, default: 0 },
  rejected_qty: { type: Number, default: 0 },
  balance_qty: { type: Number, required: true }, // Logic handled in UI
  status: { type: String, maxlength: 1, } // Logic handled in UI
}, {
  timestamps: true,
});

// Enforcing the Primary Key constraint across the first three fields
GoodsReceiptUnitsSchema.index(
  { material_doc_no: 1, material_id: 1, sno: 1 }, 
  { unique: true }
);

const GoodsReceiptUnits = (mongoose.models.GoodsReceiptUnits as mongoose.Model<IGoodsReceiptUnits>) || 
  mongoose.model<IGoodsReceiptUnits>('GoodsReceiptUnits', GoodsReceiptUnitsSchema);

export default GoodsReceiptUnits;