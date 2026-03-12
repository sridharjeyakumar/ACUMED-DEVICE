import mongoose, { Schema, Document } from 'mongoose';

export interface IProductStatusMaster extends Document {
  prod_status_id: string; // Char(3) - PK
  product_status: string; // Char(30)
  stock_movement?: string; // Char(3) - IN/OUT dropdown
  // effect_in_stock?: string; // Char(1) - + or - dropdown
  movement_type?: string; // Char(1) - N (Normal) / S (Special)
  stock_origin?: string; // Char(1) - Y / N
  from_prod_status_id?: string; // Char(2) - FK to prod_status_id
  prod_status_icon?: string; // image (base64 or URL)
  seq_no: number; // N(2)
  active: boolean;
  location_id?: string; // Char(2)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const ProductStatusMasterSchema: Schema = new Schema({
  prod_status_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 3,
    trim: true,
  },
  product_status: {
    type: String,
    required: true,
    maxlength: 30,
    trim: true,
  },
  stock_movement: {
    type: String,
    required: false,
    maxlength: 3,
    trim: true,
    enum: ['IN', 'OUT', ''],
  },
  // effect_in_stock: {
  //   type: String,
  //   required: false,
  //   maxlength: 1,
  //   trim: true,
  //   enum: ['+', '-', ''],
  // },
  movement_type: {
    type: String,
    required: false,
    maxlength: 1,
    trim: true,
    enum: ['N', 'S', ''],
  },
  stock_origin: {
    type: String,
    required: false,
    maxlength: 1,
    trim: true,
    enum: ['Y', 'N', ''],
  },
  from_prod_status_id: {
    type: String,
    required: false,
    maxlength: 2,
    trim: true,
  },
  prod_status_icon: {
    type: String,
    required: false,
  },
  seq_no: {
    type: Number,
    required: true,
    min: 1,
    max: 99,
  },
  location_id: {
    type: String,
    required: false,
    maxlength: 2,
    trim: true,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
  last_modified_user_id: {
    type: String,
    required: false,
    maxlength: 5,
    trim: true,
  },
  last_modified_date_time: {
    type: Date,
    required: false,
  },
}, {
  timestamps: true,
});

// Delete cached model to ensure schema changes are always applied
if (mongoose.models.ProductStatusMaster) {
  delete (mongoose.models as any).ProductStatusMaster;
}
const ProductStatusMaster = mongoose.model<IProductStatusMaster>('ProductStatusMaster', ProductStatusMasterSchema);

export default ProductStatusMaster;
