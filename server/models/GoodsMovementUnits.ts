import mongoose, { Schema, Document } from 'mongoose';

// Child table of GoodsMovement header
// Created when: header's material_doc_no is not null AND unit_split = 'Y'
// Status: E - Entered (default) / A - Approved / X - Cancelled

export interface IGoodsMovementUnits extends Document {
  gm_no: string;       // Char(8) FK → GoodsMovement.gm_no
  roll_no: string;     // Char(10)
  nett_qty: number;    // N(6,3)
  uom: string;         // Char(3)
  status: string;      // Char(1) - E / A / X
}

const GoodsMovementUnitsSchema: Schema = new Schema({
  gm_no: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  roll_no: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
  },
  nett_qty: {
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
  status: {
    type: String,
    required: true,
    maxlength: 1,
    trim: true,
    uppercase: true,
    enum: ['E', 'A', 'X'],
    default: 'E',
  },
}, {
  timestamps: true,
});

GoodsMovementUnitsSchema.index({ gm_no: 1 });
GoodsMovementUnitsSchema.index({ gm_no: 1, status: 1 });

const GoodsMovementUnits = (mongoose.models.GoodsMovementUnits as mongoose.Model<IGoodsMovementUnits>) ||
  mongoose.model<IGoodsMovementUnits>('GoodsMovementUnits', GoodsMovementUnitsSchema);

export default GoodsMovementUnits;
