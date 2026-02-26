import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionTable extends Document {
  batch_no: string;
  product_id: string;
  month_year: string;
  planned_start_date?: Date;
  planned_end_date?: Date;
  actual_start_date?: Date;
  actual_end_date?: Date; 
  total_sachets?: number;
  total_sterilization_cartons?: number;
  total_shipper_cartons?: number;
  total_rejected_qty_kg?: number;
  remarks?: string;               
  last_modified_user_id?: string; 
  last_modified_date_time?: Date;
  current_batch_event_type_id?: string;
  current_batch_status_id: 'P' | 'R' | 'W' | 'C';
}

const TransactionTableSchema: Schema = new Schema({
  batch_no: {
    type: String,
    required: true,
    maxlength: 6,
    trim: true,
    uppercase: true
  },
  product_id: {
    type: String,
    required: true,
    maxlength: 5,
    ref: 'ProductMaster'
  },
  month_year: {
    type: String,
    required: true,
    match: [/^\d{6}$/, 'Please fill a valid Month Year (YYYYMM)'],
  },
  planned_start_date: { type: Date },
  planned_end_date: { type: Date },
  actual_start_date: { type: Date },
  actual_end_date: { type: Date },
  total_sachets: { type: Number, max: 99999999 },
  total_sterilization_cartons: { type: Number, max: 99999 },
  total_shipper_cartons: { type: Number, max: 99999 },
  total_rejected_qty_kg: { type: Number },
  remarks: { type: String, maxlength: 100 },
  last_modified_user_id: { type: String, maxlength: 5 },
  last_modified_date_time: { type: Date, default: Date.now },
  current_batch_event_type_id: { type: String, maxlength: 2 },
  current_batch_status_id: {
    type: String,
    enum: ['P', 'R', 'W', 'C'],
    default: 'P',
    required: true
  }
}, {
  timestamps: true 
});

// Add compound unique index on batch_no and month_year
TransactionTableSchema.index({ batch_no: 1, month_year: 1 }, { unique: true });

// Keep your existing index if needed
TransactionTableSchema.index({ batch_no: 1, product_id: 1 });

const TransactionTable = (mongoose.models.TransactionTable as mongoose.Model<ITransactionTable>) || 
  mongoose.model<ITransactionTable>('TransactionTable', TransactionTableSchema);

export default TransactionTable;