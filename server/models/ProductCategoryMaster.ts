import mongoose, { Schema, Document } from 'mongoose';

export interface IProductCategoryMaster extends Document {
  product_category_id: string; // Char(3) - PK (e.g., "P01", "P02")
  product_category_name: string; // Char(25)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const ProductCategoryMasterSchema: Schema = new Schema({
  product_category_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 3,
    trim: true,
  },
  product_category_name: {
    type: String,
    required: true,
    maxlength: 25,
    trim: true,
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

const ProductCategoryMaster = (mongoose.models.ProductCategoryMaster as mongoose.Model<IProductCategoryMaster>) || mongoose.model<IProductCategoryMaster>('ProductCategoryMaster', ProductCategoryMasterSchema);

export default ProductCategoryMaster;

