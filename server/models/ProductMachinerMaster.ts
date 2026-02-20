import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductMachinerMaster extends Document {
  machine_id: string;                  // Char(2) - PK
  machine_name: string;                // Char(25)
  machine_short_name: string;          // Char(25)
  prod_qty_per_minute: number;         // N(3)
  uom: string;                         // Char(3)
  avg_prod_hrs_per_day: number;        // N(2)
  remarks?: string;                    // Char(100)
  last_modified_user_id?: string;      // Char(5)
  last_modified_date_time?: Date;      // Date
  active: boolean;                     // Boolean
}

const ProductMachinerMasterSchema: Schema<IProductMachinerMaster> =
  new Schema(
    {
      machine_id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 2,
      },
      machine_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 25,
      },
      machine_short_name: {
        type: String,
        trim: true,
        maxlength: 25,
      },
      prod_qty_per_minute: {
        type: Number,
        required: true,
        min: 0,
      },
      uom: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5,
      },
      avg_prod_hrs_per_day: {
        type: Number,
        required: true,
        min: 0,
      },
      remarks: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      last_modified_user_id: {
        type: String,
        trim: true,
        maxlength: 5,
        default: "ADMIN",
      },
      last_modified_date_time: {
        type: Date,
        default: Date.now,
      },
      active: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: false,
      collection: "production_machinary_master",
    }
  );

// Prevent model overwrite issue in Next.js
const ProductMachinerMaster: Model<IProductMachinerMaster> =
  mongoose.models.ProductMachinerMaster ||
  mongoose.model<IProductMachinerMaster>(
    "ProductMachinerMaster",
    ProductMachinerMasterSchema
  );

export default ProductMachinerMaster;
