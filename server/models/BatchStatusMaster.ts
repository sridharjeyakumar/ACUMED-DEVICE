import mongoose, { Schema, Document } from 'mongoose';

export interface IBatchStatusMaster extends Document {
  batch_status_id: string;            // Char(1) - PK
  batch_status_name: string;          // Char(25)
  remarks?: string;                   // Char(100)
  seq_no: number;                     // N(2)
  status_seq_no?: number;                // N(2)
  machine_event_allowed:string;          // Char(1) - 'Y' or 'N'
  last_modified_user_id?: string;     // Char(5)
  last_modified_date_time?: Date;
  active: boolean;
  production_entry_allowed?: string;          // Char(1) - 'Y' or 'N'
  packing_entry_allowed?: string;             // Char(1) - 'Y' or 'N'
}

const BatchStatusMasterSchema: Schema = new Schema({
  batch_status_id: {
    type: String,
    required: true,
    unique: true,       // PK
    maxlength: 1,
    trim: true,
    uppercase: true
  },
  batch_status_name: {
    type: String,
    required: true,
    maxlength: 25,
    trim: true
  },
  remarks: {
    type: String,
    maxlength: 100,
    trim: true
  },
  seq_no: {
    type: Number,
    required: true,
    max: 99             // N(2)
  },
  status_seq_no: {
    type: Number,
    max: 99             // N(2)
  },
  machine_event_allowed: {
    type: String,
    required: true,
    enum: ['Y', 'N'],   // Char(1) - 'Y' or 'N'
    uppercase: true,
    default: 'N'
  },
  last_modified_user_id: {
    type: String,
    maxlength: 5,
    trim: true
  },
  last_modified_date_time: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    required: true,
    default: true
  },
  production_entry_allowed: {
    type: String,
    enum: ['Y', 'N'],   // Char(1) - 'Y' or 'N'
    uppercase: true,
    default: 'N'
  },
  packing_entry_allowed: {
    type: String,
    enum: ['Y', 'N'],   // Char(1) - 'Y' or 'N'
    uppercase: true,
    default: 'N'
  }
}, {
  timestamps: true
});

BatchStatusMasterSchema.index({ seq_no: 1 });

const BatchStatusMaster = (mongoose.models.BatchStatusMaster as mongoose.Model<IBatchStatusMaster>) ||
  mongoose.model<IBatchStatusMaster>('BatchStatusMaster', BatchStatusMasterSchema);

export default BatchStatusMaster;
