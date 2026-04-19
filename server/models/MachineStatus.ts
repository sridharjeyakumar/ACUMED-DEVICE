import mongoose, { Schema, Document } from 'mongoose';

export interface IMachineStatus extends Document {
  machine_id: string;                      // Char(2) - PK
  batch_no: string;                        // Char(6)
  product_id: string;                      // Char(5)
  last_machine_event_id?: number;           // N(7) - FK → MachineEvent
  last_machine_event_type_id: string;      // Char(2) - FK → MachineEventTypeMaster
  material_id?: string;                    // Char(5)
  last_event_date: Date;
  last_event_time: string;                 // Time stored as HH:MM:SS
  last_modified_user_id?: string;          // Char(5)
  last_modified_date_time?: Date;
}

const MachineStatusSchema: Schema = new Schema({
  machine_id: {
    type: String,
    required: true,
    unique: true,
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
  last_machine_event_id: {
    type: Number,
    max: 9999999,                           // N(7)
    ref: 'MachineEvent'                     // FK
  },
  last_machine_event_type_id: {
    type: String,
    required: true,
    maxlength: 2,
    trim: true,
    uppercase: true,
    ref: 'MachineEventTypeMaster'  // FK
  },
  material_id: {
    type: String,
    maxlength: 5,
    trim: true,
    uppercase: true,
    ref: 'MaterialMaster'
  },
  last_event_date: {
    type: Date,
    required: true
  },
  last_event_time: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}:\d{2}$/, 'Please fill a valid time (HH:MM:SS)']
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

const MachineStatus = (mongoose.models.MachineStatus as mongoose.Model<IMachineStatus>) ||
  mongoose.model<IMachineStatus>('MachineStatus', MachineStatusSchema);

export default MachineStatus;
