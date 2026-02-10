import mongoose, { Schema, Document } from 'mongoose';

export interface IProductBOMMaster extends Document {
  bom_id: string; // Char(10) - PK (e.g., "BM01", "BM02")
  bom_description: string; // Char(200) (e.g., "DUVET", "DUVET XL")
  product_id: string; // Char(10) - FK to ProductMaster (e.g., "P0001")
  output_qty: number | null; // N(10) - can be null (e.g., 3000, 1200, null)
  output_uom: string; // Char(10) (e.g., "NOS")
  material_id: string; // Char(10) - FK to MaterialMaster (e.g., "RM001")
  input_qty: number; // N(10) (e.g., 1)
  input_uom: string; // Char(10) (e.g., "KGS")
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
  active: boolean; // Boolean
}

const ProductBOMMasterSchema: Schema = new Schema({
  bom_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    uppercase: true,
    index: true,
  },
  bom_description: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },
  product_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  output_qty: {
    type: Number,
    required: false,
    default: null,
    min: 0,
  },
  output_uom: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    uppercase: true,
  },
  material_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  input_qty: {
    type: Number,
    required: true,
    min: 0,
  },
  input_uom: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    uppercase: true,
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
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
ProductBOMMasterSchema.index({ bom_id: 1, material_id: 1 }); // Composite index for BOM and material
ProductBOMMasterSchema.index({ product_id: 1, active: 1 }); // For filtering by product
ProductBOMMasterSchema.index({ material_id: 1, active: 1 }); // For filtering by material
ProductBOMMasterSchema.index({ active: 1 }); // For filtering by active status

const ProductBOMMaster = (mongoose.models.ProductBOMMaster as mongoose.Model<IProductBOMMaster>) || 
  mongoose.model<IProductBOMMaster>('ProductBOMMaster', ProductBOMMasterSchema);

export default ProductBOMMaster;


