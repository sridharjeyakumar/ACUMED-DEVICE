import mongoose, { Schema, Document } from 'mongoose';

export interface ICOAChecklistDetail extends Document {
  checklist_id: string; // Char(10) - FK to COAChecklistMaster (e.g., "CL01", "CL02")
  checklist_sno: number; // N(3) - Serial number within a checklist (e.g., 1, 2, 3)
  checklist_parameter: string; // Char(200) (e.g., "Perforation", "Color", "Weight")
  expected_result: string; // Char(200) (e.g., "Ok", "Pass", etc.)
  last_modified_user_id?: string; // Char(5)
  last_modified_date_time?: Date; // Date
  active: boolean; // Boolean
}

const COAChecklistDetailSchema: Schema = new Schema({
  checklist_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
    uppercase: true,
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
COAChecklistDetailSchema.index({ checklist_id: 1, checklist_sno: 1 }, { unique: true }); // Composite unique index
COAChecklistDetailSchema.index({ checklist_id: 1, active: 1 }); // For filtering by checklist and active status

const COAChecklistDetail = (mongoose.models.COAChecklistDetail as mongoose.Model<ICOAChecklistDetail>) || 
  mongoose.model<ICOAChecklistDetail>('COAChecklistDetail', COAChecklistDetailSchema);

export default COAChecklistDetail;



