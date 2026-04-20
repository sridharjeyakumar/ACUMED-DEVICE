import mongoose, { Schema, Document } from 'mongoose';

export interface IProductMaster extends Document {
  product_id: string; // Char(10) - PK
  product_name: string; // Char(200)
  product_shortname: string; // Char(100)
  uom: string; // Char(10) - NOS, KG, etc.
  product_category_id?: string; // Char(3)
  product_spec?: string; // Char(500)
  weight_per_piece?: number; // N(5,2)
  weight_uom?: string; // Char(10) - GMS, KG, etc.
  wipes_per_kg?: number; // N(5)
  shelf_life_in_months?: number; // N(3)
  storage_condition?: string; // Char(50)
  safety_stock_qty?: number; // N(10)
  default_pack_size_id?: string; // Char(10)
  batch_no_pattern?: string; // Char(50)
  batch_prefix?:string; //Char(3)
  running_batch_sno?:number; //N(3)
  product_image?: string; // Image URL or base64
  product_image_icon?: string; // Image URL or base64
  qc_required?: 'Y' | 'N';
  coa_checklist_id?: string; // Char(10)
  sterilization_required?: 'Y' | 'N';
  active: boolean; // Boolean
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
  product_type?: string; // Char(3) 
}

const ProductMasterSchema: Schema = new Schema({
  product_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 5,
    trim: true,
    index: true,
  },
  product_name: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  product_shortname: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  uom: {
    type: String,
    required: true,
    maxlength: 3,
    trim: true,
  },
  product_category_id: {
    type: String,
    required: false,
    maxlength: 3,
    trim: true,
    index: true,
  },
  product_spec: {
    type: String,
    required: false,
    maxlength: 500,
    trim: true,
  },
  weight_per_piece: {
    type: Number,
    required: false,
    min: 0,
    max: 999.99,
  },
  weight_uom: {
    type: String,
    required: false,
    maxlength: 3,
    trim: true,
  },
  wipes_per_kg: {
    type: Number,
    required: false,
    min: 0,
  },
  shelf_life_in_months: {
    type: Number,
    required: false,
    min: 0,
    max: 99,
  },
  storage_condition: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
  safety_stock_qty: {
    type: Number,
    required: false,
    min: 0,
    max: 9999999,
  },
  default_pack_size_id: {
    type: String,
    required: false,
    maxlength: 4,
    trim: true,
  },
  batch_no_pattern: {
    type: String,
    required: false,
    maxlength: 50,
    trim: true,
  },
    batch_prefix:{
        type: String,
    required: false,
    maxlength: 3,
    trim: true,
    },
  running_batch_sno:{
   type: Number,
    required: false,
    min:0,
    max: 999, 
  },
  product_image: {
    type: String,
    required: false,
  },
  product_image_icon: {
    type: String,
    required: false,
  },
qc_required: {
  type: String,
  required: false,
  maxlength: 1,
  enum: ['Y', 'N'],
  default: 'N',
},
  coa_checklist_id: {
    type: String,
    required: false,
    maxlength: 4,
    trim: true,
  },
  sterilization_required: {
  type: String,
  required: false,
  maxlength: 1,
  enum: ['Y', 'N'],
  default: 'N',
},
  active: {
    type: Boolean,
    required: true,
    default: true,
    index: true,
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
  product_type: {
    type: String,
    required: false,
    maxlength: 3,
    trim: true,
  },
}, {
  timestamps: true,
});

// Create indexes for common queries
ProductMasterSchema.index({ product_category_id: 1, active: 1 });
ProductMasterSchema.index({ default_pack_size_id: 1 });

const ProductMaster = (mongoose.models.ProductMaster as mongoose.Model<IProductMaster>) || 
  mongoose.model<IProductMaster>('ProductMaster', ProductMasterSchema);

export default ProductMaster;















