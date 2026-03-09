import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialStock extends Document {
  material_id: string;              // Char(5) - PK
  current_stock_qty: number;        // N(6,3)
  uom: string;                      // Char(3)
  total_no_of_rolls: number;        // N(3)
  last_modified_user_id: string;    // Char(5)
  last_modified_date_time: Date;    // Date
}

const MaterialStockSchema: Schema = new Schema({
  material_id: { 
    type: String, 
    required: true, 
    unique: true, 
    maxlength: 5, 
    trim: true,
    ref: 'MaterialMaster' 
  },
  current_stock_qty: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  uom: { 
    type: String, 
    required: true, 
    maxlength: 3, 
    trim: true 
  },
  total_no_of_rolls: { 
    type: Number, 
    required: true, 
    default: 0,
    max: 999 
  },
  last_modified_user_id: { 
    type: String, 
    required: true, 
    maxlength: 5 
  },
  last_modified_date_time: { 
    type: Date, 
    required: true, 
    default: Date.now 
  }
}, {
  // Disabling automatic timestamps because you have a manual last_modified_date_time
  timestamps: false 
});

// Explicit index for the Primary Key
MaterialStockSchema.index({ material_id: 1 });

const MaterialStocks = (mongoose.models.MaterialStocks as mongoose.Model<IMaterialStock>) || 
  mongoose.model<IMaterialStock>('MaterialStocks', MaterialStockSchema);

export default MaterialStocks;