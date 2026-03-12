import mongoose, { Schema, Document } from 'mongoose';

export interface IProductCategoryMaster extends Document {
  product_category_id: string; // Char(3) - PK (e.g., "P01", "P02")
  product_category_name: string; // Char(25)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
  unit_split: boolean; // Boolean
  active: boolean; // Boolean

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
  unit_split: {
    type: Boolean,
    required: true,
    default: false,
  },
    active: {
    type: Boolean,
    required: true,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Delete cached model to ensure schema changes (e.g. unit_split) are always applied
if (mongoose.models.ProductCategoryMaster) {
  delete (mongoose.models as any).ProductCategoryMaster;
}
const ProductCategoryMaster = mongoose.model<IProductCategoryMaster>('ProductCategoryMaster', ProductCategoryMasterSchema);

export default ProductCategoryMaster;

