import mongoose, { Schema, Document } from 'mongoose';

export interface ICOAChecklistMaster extends Document {
  checklist_id: string; // Char(10) - PK (e.g., "CL01", "CL02")
  checklist_description: string; // Char(200) (e.g., "DUVET - QC - Checklist")
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
  active: boolean; // Boolean
}

const COAChecklistMasterSchema: Schema = new Schema({
  checklist_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
    trim: true,
    uppercase: true,
    index: true,
  },
  checklist_description: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
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
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
COAChecklistMasterSchema.index({ active: 1 }); // For filtering by active status

const COAChecklistMaster = (mongoose.models.COAChecklistMaster as mongoose.Model<ICOAChecklistMaster>) || 
  mongoose.model<ICOAChecklistMaster>('COAChecklistMaster', COAChecklistMasterSchema);

export default COAChecklistMaster;

