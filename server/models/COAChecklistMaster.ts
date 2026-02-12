import mongoose, { Schema, Document } from 'mongoose';

export interface ICOAChecklistMaster extends Document {
  checklist_id: string; // Char(10) - PK
  checklist_description: string; // Char(500)
  active: boolean; // Boolean
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const COAChecklistMasterSchema: Schema = new Schema({
  checklist_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  checklist_description: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
    index: true,
  },
  last_modified_user_id: {
    type: String,
    required: false,
    maxlength: 5,
    trim: true,
  },
  last_modified_date_time: {
    type: Date,
    required: false,
  },
}, {
  timestamps: true,
  collection: 'coachecklistmasters', // Explicitly set collection name to match existing database
});

// Create indexes
COAChecklistMasterSchema.index({ active: 1 });

const COAChecklistMaster = (mongoose.models.COAChecklistMaster as mongoose.Model<ICOAChecklistMaster>) || 
  mongoose.model<ICOAChecklistMaster>('COAChecklistMaster', COAChecklistMasterSchema);

export default COAChecklistMaster;

