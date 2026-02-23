import mongoose, { Schema, Document } from 'mongoose';


export interface UomMaster extends Document {
  uom_id: string; 
  uom_desc: string; 
  uom_short_name: string;
  active: boolean; 
  last_modified_user_id?: string; 
  last_modified_date_time?: Date; 
}

const UomMasterSchema:Schema = new Schema({
      uom_id: {
    type: String,
    required: true,
    maxlength: 10,
    trim: true,
  },
    uom_desc: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },
      uom_short_name: {
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
},{
  timestamps: true,
});

UomMasterSchema.index({ material_type: 1, active: 1 });
UomMasterSchema.index({ material_category_id: 1, active: 1 });

const UomMaster = (mongoose.models.UomMaster as mongoose.Model<UomMaster>) || 
  mongoose.model<UomMaster>('UomMaster', UomMasterSchema);

export default UomMaster;