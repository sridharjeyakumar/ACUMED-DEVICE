import mongoose, { Schema, Document } from 'mongoose';

export interface IMachineEvent extends Document {
  machine_event_id: number;   // PK - N(7)
  machine_id: string;         // Char(2)
  batch_no: string;           // Char(6)
  product_id: string;         // Char(5)
  machine_event_type_id: string; // Char(2) - FK
  event_date: Date;
  event_time: string;         // Time stored as HH:MM:SS
  batch_status_id?: string;      // Char(1) - FK
  machine_stop_reason_id?: string; // Char(1) - FK
  remarks?: string;           // Char(100)
  done_by_emp_id?: string;    // Char(5)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date;
}

const MachineEventSchema: Schema = new Schema({
  machine_event_id: {
    type: Number,
    required: true,
    unique: true,
    max: 9999999  // N(7) PK
  },
  machine_id: {
    type: String,
    required: true,
    maxlength: 2,
    trim: true,
    uppercase: true
  },
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
    trim: true,
    uppercase: true,
    ref: 'ProductMaster'
  },
  machine_event_type_id: {
    type: String,
    required: true,
    maxlength: 2,
    trim: true,
    uppercase: true,
    ref: 'MachineEventTypeMaster'  // FK
  },
  event_date: {
    type: Date,
    required: true
  },
  event_time: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}:\d{2}$/, 'Please fill a valid time (HH:MM:SS)']
  },
  batch_status_id: {
    type: String,
    maxlength: 1,
    trim: true,
    uppercase: true,
    ref: 'MachineEventTypeMaster'  // FK
  },
  machine_stop_reason_id: {
    type: String,
    maxlength: 1,
    trim: true,
    uppercase: true,
    ref: 'MachineStopReasonMaster'  // FK
  },
  remarks: {
    type: String,
    maxlength: 100
  },
  done_by_emp_id: {
    type: String,
    maxlength: 5,
    trim: true,
    ref: 'EmployeeMaster'
  },
  last_modified_user_id: {
    type: String,
    maxlength: 5,
    trim: true
  },
  last_modified_date_time: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

MachineEventSchema.index({ machine_id: 1, batch_no: 1, event_date: 1 });

const MachineEvent = (mongoose.models.MachineEvent as mongoose.Model<IMachineEvent>) ||
  mongoose.model<IMachineEvent>('MachineEvent', MachineEventSchema);

export default MachineEvent;
