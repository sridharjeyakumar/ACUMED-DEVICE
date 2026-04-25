import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionPlanStatusHistory extends Document {
  batch_no: string;
  batch_status_id: 'P' | 'R' | 'W' | 'S' | 'C';
  date: Date;
  last_modified_user_id: string;
  last_modified_date_time: Date;
}

const ProductionPlanStatusHistorySchema: Schema = new Schema({
  batch_no: {
    type: String,
    required: true,
    maxlength: 6,
    trim: true,
    uppercase: true,
  },
  batch_status_id: {
    type: String,
    required: true,
    maxlength: 1,
    enum: ['P', 'R', 'W', 'S', 'C'],
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  last_modified_user_id: {
    type: String,
    required: true,
    maxlength: 5,
  },
  last_modified_date_time: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

ProductionPlanStatusHistorySchema.index({ batch_no: 1, date: 1 });

const ProductionPlanStatusHistory =
  (mongoose.models.ProductionPlanStatusHistory as mongoose.Model<IProductionPlanStatusHistory>) ||
  mongoose.model<IProductionPlanStatusHistory>(
    'ProductionPlanStatusHistory',
    ProductionPlanStatusHistorySchema
  );

export default ProductionPlanStatusHistory;
