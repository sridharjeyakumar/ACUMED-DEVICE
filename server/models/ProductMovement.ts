import mongoose, { Schema, Document } from 'mongoose';

export interface IProductMovement extends Document {
  prod_movement_id: number;          // N(7) - PK
  movement_date: Date;               // Date
  batch_no: string;                  // Char(6)
  product_id: string;                // Char(5)
  pack_size_id: string;              // Char(4)
  to_prod_status_id: string;         // Char(2)
  from_prod_status_id: string;       // Char(2)
  carton_type_id: string;            // Char(2)
  carton_capacity_id: string;        // Char(6)
  no_of_cartons: number;             // N(4)
  no_of_packs: number;               // N(6)
  no_of_sachets: number;             // N(8)
  remarks?: string;                  // Char(100)
  entered_by_user_id: string;        // Char(5)
  entered_date_time: Date;           // Date
  approval_remarks?: string;         // Char(100)
  approved_by_user_id?: string;      // Char(5)
  approved_date_time?: Date;         // Date
  status: 'E' | 'A' | 'X';           // Char(1) - E=Entered, A=Approved, X=Cancelled
  movement_type: 'NORMAL' | 'SPECIAL_A' | 'SPECIAL_R'; // Char(9) - movement origin
}

const ProductMovementSchema: Schema = new Schema({
  prod_movement_id: {
    type: Number,
    required: [true, 'Product movement ID is required'],
    unique: true,
  },
  movement_date: {
    type: Date,
    required: [true, 'Movement date is required'],
    default: Date.now,
  },
  batch_no: {
    type: String,
    required: [true, 'Batch number is required'],
    maxlength: 6,
    trim: true,
    uppercase: true,
  },
  product_id: {
    type: String,
    required: [true, 'Product ID is required'],
    maxlength: 5,
    trim: true,
    uppercase: true,
  },
  pack_size_id: {
    type: String,
    required: [true, 'Pack size ID is required'],
    maxlength: 4,
    trim: true,
  },
  to_prod_status_id: {
    type: String,
    required: [true, 'To product status ID is required'],
    maxlength: 2,
    trim: true,
  },
  from_prod_status_id: {
    type: String,
    required: [true, 'From product status ID is required'],
    maxlength: 2,
    trim: true,
  },
  carton_type_id: {
    type: String,
    maxlength: 2,
    trim: true,
    default: '',
  },
  carton_capacity_id: {
    type: String,
    maxlength: 6,
    trim: true,
    default: '',
  },
  no_of_cartons: {
    type: Number,
    max: 9999,
    default: 0,
  },
  no_of_packs: {
    type: Number,
    required: [true, 'Number of packs is required'],
    max: 999999,
  },
  no_of_sachets: {
    type: Number,
    required: [true, 'Number of sachets is required'],
    max: 99999999,
  },
  remarks: {
    type: String,
    maxlength: 100,
    default: '',
  },
  entered_by_user_id: {
    type: String,
    required: [true, 'Entered by user ID is required'],
    maxlength: 5,
    trim: true,
  },
  entered_date_time: {
    type: Date,
    required: [true, 'Entered date time is required'],
    default: Date.now,
  },
  approval_remarks: {
    type: String,
    maxlength: 100,
    default: '',
  },
  approved_by_user_id: {
    type: String,
    maxlength: 5,
    trim: true,
    default: '',
  },
  approved_date_time: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['E', 'A', 'X'],
      message: 'Status must be either E (Entered), A (Approved), or X (Cancelled)'
    },
    default: 'E',
  },
  movement_type: {
    type: String,
    enum: {
      values: ['NORMAL', 'SPECIAL_A', 'SPECIAL_R'],
      message: 'movement_type must be NORMAL, SPECIAL_A, or SPECIAL_R',
    },
    default: 'NORMAL',
  },
}, {
  timestamps: true,
});

// Indexes for performance
ProductMovementSchema.index({ prod_movement_id: 1 }, { unique: true });
ProductMovementSchema.index({ batch_no: 1, product_id: 1 });
ProductMovementSchema.index({ status: 1 });
ProductMovementSchema.index({ movement_date: -1 });

// Clean up model cache for development
if (mongoose.models.ProductMovement) {
  delete (mongoose.models as any).ProductMovement;
}

const ProductMovement = mongoose.model<IProductMovement>('ProductMovement', ProductMovementSchema);

export default ProductMovement;