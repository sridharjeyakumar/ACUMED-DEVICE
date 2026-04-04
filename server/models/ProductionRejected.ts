import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionRejected extends Document {
  product_rejection_id: number;       // N(7) PK - YY + Running Sno (00001 per year)
  entry_date: Date;                    // Date
  machine_id: string;                  // Char(2)
  batch_no: string;                    // Char(6)
  product_id: string;                  // Char(5)
  collection_bin_no: number;           // N(2) FK
  tare_weight_kgs?: number;            // N(6,3)
  gross_weight_kgs?: number;           // N(6,3)
  net_weight_kgs?: number;             // N(6,3)
  calculated_total_qty?: number;       // N(6)
  remarks?: string;                    // Char(100)
  last_modified_user_id?: string;      // Char(5)
  last_modified_date_time?: Date;
  status: 'E' | 'C';                  // E - Entry (default), C - Closed
}

const ProductionRejectedSchema: Schema = new Schema({
  product_rejection_id: {
    type: Number,
    required: true,
    unique: true,
    max: 9999999   // N(7)
  },
  entry_date: {
    type: Date,
    required: true
  },
  machine_id: {
    type: String,
    required: true,
    maxlength: 2,
    trim: true,
    uppercase: true
  },
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
    uppercase: true
  },
  collection_bin_no: {
    type: Number,
    required: true,
    max: 99   // N(2)
  },
  tare_weight_kgs: {
    type: Number,
    min: 0
  },
  gross_weight_kgs: {
    type: Number,
    min: 0
  },
  net_weight_kgs: {
    type: Number,
    min: 0
  },
  calculated_total_qty: {
    type: Number,
    max: 999999   // N(6)
  },
  remarks: {
    type: String,
    maxlength: 100,
    trim: true
  },
  last_modified_user_id: {
    type: String,
    maxlength: 5,
    trim: true
  },
  last_modified_date_time: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['E', 'C'],
    default: 'E',
    required: true,
    maxlength: 1
  }
}, {
  timestamps: true
});

// Index for batch lookups (used when closing a batch)
ProductionRejectedSchema.index({ batch_no: 1 });
ProductionRejectedSchema.index({ batch_no: 1, status: 1 });

const ProductionRejected = (mongoose.models.ProductionRejected as mongoose.Model<IProductionRejected>) ||
  mongoose.model<IProductionRejected>('ProductionRejected', ProductionRejectedSchema);

export default ProductionRejected;
