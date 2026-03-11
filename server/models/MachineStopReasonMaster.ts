import mongoose, { Schema, Document } from 'mongoose';

export interface IMachineStopReasonMaster extends Document {
  reason_id: string;                  // Char(1) - PK
  reason_name: string;                // Char(25)
  remarks?: string;                   // Char(100)
  seq_no: number;                     // N(2)
  last_modified_user_id?: string;     // Char(5)
  last_modified_date_time?: Date;
  active: boolean;
}

const MachineStopReasonMasterSchema: Schema = new Schema({
  reason_id: {
    type: String,
    required: true,
    unique: true,       // PK
    maxlength: 1,
    trim: true,
    uppercase: true
  },
  reason_name: {
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
  }
}, {
  timestamps: true
});

MachineStopReasonMasterSchema.index({ seq_no: 1 });

const MachineStopReasonMaster = (mongoose.models.MachineStopReasonMaster as mongoose.Model<IMachineStopReasonMaster>) ||
  mongoose.model<IMachineStopReasonMaster>('MachineStopReasonMaster', MachineStopReasonMasterSchema);

export default MachineStopReasonMaster;
