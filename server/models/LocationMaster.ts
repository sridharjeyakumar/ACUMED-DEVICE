import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationMaster extends Document {
  location_id: string; // Char(2) - PK (e.g., "PP", "QC", "QR")
  location_name: string; // Char(25)
  last_modified_user_id?: string; // Char(5)
  location_icon?: string; // image
  last_modified_date_time?: Date; // Date
  active: boolean; // Boolean
}

const LocationMasterSchema: Schema = new Schema({
  location_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 2,
    trim: true,
  },
  location_name: {
    type: String,
    required: true,
    maxlength: 25,
    trim: true,
  },
  last_modified_user_id: {
    type: String,
    required: false,
    maxlength: 5,
    trim: true,
  },
  location_icon: {
    type: String,
    required: false,
  },
  last_modified_date_time: {
    type: Date,
    required: false,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Delete cached model to ensure schema changes are always applied
if (mongoose.models.LocationMaster) {
  delete (mongoose.models as any).LocationMaster;
}
const LocationMaster = mongoose.model<ILocationMaster>('LocationMaster', LocationMasterSchema);

export default LocationMaster;
