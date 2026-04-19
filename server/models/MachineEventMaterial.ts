import mongoose, { Schema, Document } from 'mongoose';

export interface IMachineEventMaterial extends Document {
  machine_event_id: number;       // N(7) - FK → MachineEvent
  machine_id: string;             // Char(2)
  material_id: string;            // Char(10)
  roll_no: string;                // Char(10)
  actual_open_qty?: number;       // N(6,3)
  actual_close_qty?: number;      // N(6,3)
  actual_consumed_qty?: number;   // N(6,3)
  actual_gross_qty?: number;      // N(6,3)
  actual_tare_qty?: number;       // N(6,3)
  uom?: string;                   // Char(3)
}

const MachineEventMaterialSchema: Schema = new Schema({
  machine_event_id: {
    type: Number,
    required: true,
    max: 9999999,                  // N(7)
    ref: 'MachineEvent'            // FK
  },
  machine_id: {
    type: String,
    required: true,
    maxlength: 2,
    trim: true,
    uppercase: true
  },
  material_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    uppercase: true,
    ref: 'MaterialMaster'          // FK
  },
  roll_no: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true
  },
  actual_open_qty: {
    type: Number,
    min: 0,
    max: 999999.999                // N(6,3)
  },
  actual_close_qty: {
    type: Number,
    min: 0,
    max: 999999.999                // N(6,3)
  },
  actual_consumed_qty: {
    type: Number,
    min: 0,
    max: 999999.999                // N(6,3)
  },
  actual_gross_qty: {
    type: Number,
    min: 0,
    max: 999999.999                // N(6,3)
  },
  actual_tare_qty: {
    type: Number,
    min: 0,
    max: 999999.999                // N(6,3)
  },
  uom: {
    type: String,
    maxlength: 3,
    trim: true,
    uppercase: true
  }
}, {
  timestamps: true
});

// Composite index: one machine event can have multiple materials/rolls
MachineEventMaterialSchema.index({ machine_event_id: 1, material_id: 1, roll_no: 1 }, { unique: true });

const MachineEventMaterial = (mongoose.models.MachineEventMaterial as mongoose.Model<IMachineEventMaterial>) ||
  mongoose.model<IMachineEventMaterial>('MachineEventMaterial', MachineEventMaterialSchema);

export default MachineEventMaterial;
