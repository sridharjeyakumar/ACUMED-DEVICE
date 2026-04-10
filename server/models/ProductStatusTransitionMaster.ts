import mongoose, { Schema, Document } from 'mongoose';

export interface IProductStatusTransitionMaster extends Document {
  product_status_id: string;      // Char(2) - FK
  from_product_status_id: string;    // Char(2) - FK
  sterilization_required: string;    // Char(1) - Y/N
  approval_required: string;         // Char(1) - Y/N
  seq_no: number;                    // N(2)
  lock_qty_change?: string;          // Char(1) - Y/N
  no_of_days_min?: number;           // N(2)
  no_of_days_max?: number;           // N(2)
  last_modified_user_id?: string;    // Char(5)
  last_modified_date_time?: Date;    // Date
  active: boolean;                   // Boolean
}

const ProductStatusTransitionMasterSchema: Schema = new Schema({
  product_status_id: {
    type: String,
    required: true,
    maxlength: 2,
    trim: true,
  },
  from_product_status_id: {
    type: String,
    required: true,
    maxlength: 2,
    trim: true,
  },
  sterilization_required: {
    type: String,
    required: true,
    maxlength: 1,
    enum: ['Y', 'N' ,"B"],
    default: 'N',
  },
  lock_qty_change:{
    type: String,
    required: false,
    maxlength: 1,
    enum: ['Y', 'N'],
    default: 'N',
  },
  approval_required: {
    type: String,
    required: true,
    maxlength: 1,
    enum: ['Y', 'N'],
    default: 'N',
  },
  seq_no: {
    type: Number,
    required: true,
    min: 0,
    max: 99,
  },
  no_of_days_min: {
    type: Number,
    required: false,
    min: 0,
    max: 99,
  },
  no_of_days_max: {
    type: Number,
    required: false,
    min: 0,
    max: 99,
  },
  last_modified_user_id: {
    type: String,
    required: false,
    maxlength: 5,
    trim: true,
  },
  last_modified_date_time: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
}, {
  timestamps: true,
});

// Composite Index to ensure unique transitions (From -> To)
ProductStatusTransitionMasterSchema.index(
  { from_product_status_id: 1, product_status_id: 1 }, 
  { unique: true }
);

// Clean up model cache for development
if (mongoose.models.ProductStatusTransitionMaster) {
  delete (mongoose.models as any).ProductStatusTransitionMaster;
}

const ProductStatusTransitionMaster = mongoose.model<IProductStatusTransitionMaster>(
  'ProductStatusTransitionMaster', 
  ProductStatusTransitionMasterSchema
);

export default ProductStatusTransitionMaster;