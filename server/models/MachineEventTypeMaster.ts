import mongoose, { Schema, Document } from 'mongoose';

export interface IMachineEventTypeMaster extends Document {
  machine_event_type_id: string;          // Char(2) - PK
  machine_event_type_name: string;        // Char(25)
  remarks?: string;                       // Char(100)
  seq_no: number;                         // N(2)
  batch_status_id?: string;              // Char(1) - FK
  prerequisite_machine_event_type_id?: string; // Char(2)
  accept_material?: string;              // Char(1)
  accept_open_qty?: string;              // Char(1)
  accept_close_qty?: string;             // Char(1)
  accept_reason?: string;                // Char(1)
  last_modified_user_id?: string;        // Char(5)
  last_modified_date_time?: Date;
  active: boolean;
}

const MachineEventTypeMasterSchema: Schema = new Schema({
  machine_event_type_id: {
    type: String,
    required: true,
    unique: true,        // PK
    maxlength: 2,
    trim: true,
    uppercase: true
  },
  machine_event_type_name: {
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
  batch_status_id: {
    type: String,
    maxlength: 1,
    trim: true,
    uppercase: true,
    ref: 'BatchStatusMaster'  // FK
  },
  prerequisite_machine_event_type_id: {
    type: String,
    maxlength: 2,
    trim: true,
    uppercase: true,
  },
  accept_material: {
    type: String,
    maxlength: 1,
    trim: true,
    uppercase: true
  },
  accept_open_qty: {
    type: String,
    maxlength: 1,
    trim: true,
    uppercase: true
  },
  accept_close_qty: {
    type: String,
    maxlength: 1,
    trim: true,
    uppercase: true
  },
  accept_reason: {
    type: String,
    maxlength: 1,
    trim: true,
    uppercase: true
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

MachineEventTypeMasterSchema.index({ seq_no: 1 });

const MachineEventTypeMaster = (mongoose.models.MachineEventTypeMaster as mongoose.Model<IMachineEventTypeMaster>) ||
  mongoose.model<IMachineEventTypeMaster>('MachineEventTypeMaster', MachineEventTypeMasterSchema);

export default MachineEventTypeMaster;
