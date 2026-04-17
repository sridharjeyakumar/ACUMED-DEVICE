import mongoose, { Schema, Document } from 'mongoose';

export interface IGoodsReceiptUnits extends Document {
  material_doc_no: string;    // PK Part 1
  material_id: string;        // PK Part 2
  sno: number;                // PK Part 3
  packet_no: string;          // Char (10) - Not Null
  roll_no: string;            // Char (10) - Not Null, unique per doc+material
  gross_qty: number;          // N (6,3) - Entry > 0
  tare_qty: number;           // N (6,3) - From MaterialMaster.core_weight
  nett_qty: number;           // N (6,3) - gross - tare
  uom: string;                // Char (3) - From GoodsReceiptDetail.uom
  status: string;             // Char (1) - From GoodsReceiptHeader.status
  balance_qty?: number;       // N (6,3) - Computed: nett_qty - issued_qty
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
  packet_no:  { type: String, required: true,  maxlength: 10, trim: true },
  roll_no:    { type: String, required: true,  maxlength: 10, trim: true },
  gross_qty:  { type: Number, required: true,  min: 0, max: 999999.999 }, // N(6,3)
  tare_qty:   { type: Number, required: true,  min: 0, max: 999999.999 }, // N(6,3) - core_weight
  nett_qty:   { type: Number, required: true,  min: 0, max: 999999.999 }, // N(6,3) - gross - tare
  uom:        { type: String, required: true,  maxlength: 3, uppercase: true },
  status:     { type: String, required: true,  maxlength: 1 }   ,
  balance_qty: { type: Number, min: 0, max: 999999.999 }    // from GR Header status
}, {
  timestamps: true,
});

// Composite PK
GoodsReceiptUnitsSchema.index({ material_doc_no: 1, material_id: 1, sno: 1 }, { unique: true });
// roll_no must be unique per doc+material
GoodsReceiptUnitsSchema.index({ material_doc_no: 1, material_id: 1, roll_no: 1 }, { unique: true });

const GoodsReceiptUnits = (mongoose.models.GoodsReceiptUnits as mongoose.Model<IGoodsReceiptUnits>) || 
  mongoose.model<IGoodsReceiptUnits>('GoodsReceiptUnits', GoodsReceiptUnitsSchema);

export default GoodsReceiptUnits;