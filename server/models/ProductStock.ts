import mongoose, { Schema, Document } from 'mongoose';

export interface IProductStock {
  batch_no: string;            // Char (6) - Primary Key
  product_id: string;          // Char (5)
  pack_size_id: string;        // Char (4)
  product_status_id: string;   // Char (2)
  total_no_of_packs: number;   // N (6)
  total_no_of_sachets: number; // N (8)
  carton_type_id: string;      // Char (2)
  total_no_of_cartons: number; // N (4)
  last_modified_user_id: string; // Char (5)
  last_modified_date_time: Date; // Date
}

export interface IProductStockDocument extends Document, IProductStock {}

const ProductStockSchema = new Schema<IProductStockDocument>({
  batch_no: { 
    type: String, 
    required: true, 
    maxlength: 6, 
    trim: true, 
    uppercase: true,
    unique: true // Primary Key behavior
  },
  product_id: { 
    type: String, 
    required: true, 
    maxlength: 5, 
    trim: true, 
    uppercase: true 
  },
  pack_size_id: { 
    type: String, 
    required: true, 
    maxlength: 4, 
    trim: true 
  },
  product_status_id: { 
    type: String, 
    required: true, 
    maxlength: 2, 
    trim: true 
  },
  total_no_of_packs: { 
    type: Number, 
    required: true,
    max: 999999 // N (6)
  },
  total_no_of_sachets: { 
    type: Number, 
    required: true,
    max: 99999999 // N (8)
  },
  carton_type_id: { 
    type: String, 
    required: true, 
    maxlength: 2, 
    trim: true 
  },
  total_no_of_cartons: { 
    type: Number, 
    required: true,
    max: 9999 // N (4)
  },
  last_modified_user_id: { 
    type: String, 
    required: true, 
    maxlength: 5, 
    trim: true 
  },
  last_modified_date_time: { 
    type: Date, 
    default: Date.now 
  }
}, {
  // Disabling _id: false if you want batch_no to be the sole identifier, 
  // but usually keeping the default _id is safer for Mongoose.
  timestamps: true 
});

// Indexing for performance on common lookups
ProductStockSchema.index({ product_id: 1, batch_no: 1 });

const ProductStock = mongoose.models.ProductStock as mongoose.Model<IProductStockDocument> ||
  mongoose.model<IProductStockDocument>('ProductStock', ProductStockSchema);

export default ProductStock;