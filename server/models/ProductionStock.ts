import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionStock extends Document {
  batch_no: string;
  product_id: string;
  net_weight_kgs: number;
  calculated_total_qty: number;
  last_modified_user_id: string;
  last_modified_date_time: Date;
  status: string;
}

const ProductionStockSchema: Schema = new Schema({
  batch_no: {
    type: String,
    required: true,
    maxlength: 6,
    trim: true,
    uppercase: true,
  },
  product_id: {
    type: String,
    required: true,
    maxlength: 5,
    trim: true,
    uppercase: true,
  },
  net_weight_kgs: {
    type: Number,
    required: true,
  },
  calculated_total_qty: {
    type: Number,
    required: true,
  },
  last_modified_user_id: {
    type: String,
    required: true,
    maxlength: 5,
    trim: true,
  },
  last_modified_date_time: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    required: true,
    maxlength: 1,
    trim: true,
    uppercase: true,
  },
}, {
  timestamps: true,
});

ProductionStockSchema.index({ batch_no: 1 });

const ProductionStock =
  (mongoose.models.ProductionStock as mongoose.Model<IProductionStock>) ||
  mongoose.model<IProductionStock>('ProductionStock', ProductionStockSchema);

export default ProductionStock;
