import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionPlanDetail {
  batch_no: string;
  sno: number;
  product_id: string;
  packsize_id: string;
  no_of_packs: number;
  no_of_sachets?: number;
  packs_per_steri_carton?: number;
  no_of_sterilization_cartons?: number;
  packs_per_shipper_carton?: number;
  no_of_shipper_cartons?: number;
  remarks?: string;
  last_modified_user_id: string;
  last_modified_date_time: Date;
}

// Use Document from mongoose but with your interface
export interface IProductionPlanDetailDocument extends Document, IProductionPlanDetail {}

const ProductionPlanDetailSchema = new Schema<IProductionPlanDetailDocument>({
  batch_no: {
    type: String,
    required: true,
    maxlength: 6,
    trim: true,
    uppercase: true
  },
  sno: { type: Number, required: true },
  product_id: { type: String, required: true },
  packsize_id: { type: String, required: true },
  no_of_packs: { type: Number, required: true },
  no_of_sachets: { type: Number },
  packs_per_steri_carton: { type: Number },
  no_of_sterilization_cartons: { type: Number },
  packs_per_shipper_carton: { type: Number },
  no_of_shipper_cartons: { type: Number },
  remarks: { type: String, maxlength: 100 },
  last_modified_user_id: { type: String, maxlength: 5 },
  last_modified_date_time: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create compound unique index on batch_no and sno
ProductionPlanDetailSchema.index({ batch_no: 1, sno: 1 }, { unique: true });

// Check if model already exists to prevent overwrite
const ProductionPlanDetail = mongoose.models.ProductionPlanDetail as mongoose.Model<IProductionPlanDetailDocument> || 
  mongoose.model<IProductionPlanDetailDocument>('ProductionPlanDetail', ProductionPlanDetailSchema);

export default ProductionPlanDetail;