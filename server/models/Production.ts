import mongoose, { Schema, Document } from 'mongoose';

export interface IProduction {
  production_id: number;
  production_date: Date;
  machine_id: string;
  batch_no: string;
  product_id: string;
  collection_bin_no: number;
  tare_weight_kgs?: number;
  gross_weight_kgs?: number;
  net_weight_kgs?: number;
  calculated_total_qty?: number;
  // machine_count_qty?: number;
  remarks?: string;
  last_modified_user_id: string;
  last_modified_date_time: Date;
  status: string;
  active: boolean; // Virtual field to indicate if the record is active (status === 'A')
}

export interface IProductionDocument extends Document, IProduction {}

const ProductionSchema = new Schema<IProductionDocument>({
  production_id: { type: Number, required: true },
  production_date: { type: Date, required: true },
  machine_id: { type: String, required: true, maxlength: 2, trim: true, uppercase: true },
  batch_no: { type: String, required: true, maxlength: 6, trim: true, uppercase: true },
  product_id: { type: String, required: true, maxlength: 5, trim: true, uppercase: true },
  collection_bin_no: { type: Number, required: true },
  tare_weight_kgs: { type: Number },
  gross_weight_kgs: { type: Number },
  net_weight_kgs: { type: Number },
  calculated_total_qty: { type: Number },
  // machine_count_qty: { type: Number },
  remarks: { type: String, maxlength: 100 },
  last_modified_user_id: { type: String, maxlength: 5 },
  last_modified_date_time: { type: Date, default: Date.now },
  status: { type: String, maxlength: 1, trim: true, uppercase: true },
    active: {
    type: Boolean,
    required: false,
    default: true,
  },
}, {
  timestamps: true
});

// Composite PK on production_id and collection_bin_no
ProductionSchema.index({ production_id: 1, collection_bin_no: 1 }, { unique: true });

const Production = mongoose.models.Production as mongoose.Model<IProductionDocument> ||
  mongoose.model<IProductionDocument>('Production', ProductionSchema);

export default Production;
