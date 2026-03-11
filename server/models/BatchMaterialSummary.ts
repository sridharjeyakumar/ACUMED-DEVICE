import mongoose, { Schema, Document } from 'mongoose';

export interface IBatchMaterialSummary extends Document {
  batch_no: string;                  // Char(6) - composite PK
  product_id: string;                // Char(5) - composite PK
  material_id: string;               // Char(5) - composite PK
  total_consumed_qty: number;        // N(6,3)
  uom: string;                       // Char(3)
  total_no_of_rolls: number;         // N(3)
  last_modified_user_id?: string;    // Char(5)
  last_modified_date_time?: Date;
}

const BatchMaterialSummarySchema: Schema = new Schema({
  batch_no: {
    type: String,
    required: true,
    maxlength: 6,
    trim: true,
    uppercase: true
  },
  product_id: {
    type: String,
    required: true,
    maxlength: 5,
    trim: true,
    uppercase: true,
    ref: 'ProductMaster'
  },
  material_id: {
    type: String,
    required: true,
    maxlength: 5,
    trim: true,
    uppercase: true,
    ref: 'MaterialMaster'
  },
  total_consumed_qty: {
    type: Number,
    required: true,
    min: 0
  },
  uom: {
    type: String,
    required: true,
    maxlength: 3,
    trim: true,
    uppercase: true,
    ref: 'UomMaster'
  },
  total_no_of_rolls: {
    type: Number,
    required: true,
    min: 0,
    max: 999   // N(3)
  },
  last_modified_user_id: {
    type: String,
    maxlength: 5,
    trim: true
  },
  last_modified_date_time: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Composite unique key: batch_no + product_id + material_id
BatchMaterialSummarySchema.index({ batch_no: 1, product_id: 1, material_id: 1 }, { unique: true });

const BatchMaterialSummary = (mongoose.models.BatchMaterialSummary as mongoose.Model<IBatchMaterialSummary>) ||
  mongoose.model<IBatchMaterialSummary>('BatchMaterialSummary', BatchMaterialSummarySchema);

export default BatchMaterialSummary;
