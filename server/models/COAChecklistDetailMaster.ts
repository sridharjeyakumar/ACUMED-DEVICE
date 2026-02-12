import mongoose, { Schema, Document } from 'mongoose';

export interface ICOAChecklistDetailMaster extends Document {
  checklist_id: string; // Char(10) - FK to COAChecklistMaster
  checklist_sno: number; // N(3) - Part of composite PK
  checklist_parameter: string; // Char(200)
  expected_result: string; // Char(200)
  active: boolean; // Boolean
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
}

const COAChecklistDetailMasterSchema: Schema = new Schema({
  checklist_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    index: true,
  },
  checklist_sno: {
    type: Number,
    required: true,
    min: 1,
  },
  checklist_parameter: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },
  expected_result: {
    type: String,
    required: true,
    maxlength: 200,
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
  collection: 'coachecklistdetailmasters', // Explicitly set collection name to match existing database
});

// Create composite unique index for checklist_id + checklist_sno
COAChecklistDetailMasterSchema.index({ checklist_id: 1, checklist_sno: 1 }, { unique: true });
COAChecklistDetailMasterSchema.index({ active: 1 });

const COAChecklistDetailMaster = (mongoose.models.COAChecklistDetailMaster as mongoose.Model<ICOAChecklistDetailMaster>) || 
  mongoose.model<ICOAChecklistDetailMaster>('COAChecklistDetailMaster', COAChecklistDetailMasterSchema);

export default COAChecklistDetailMaster;

