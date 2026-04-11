import { Schema } from 'mongoose';

export interface IAuditTrailDetail {
    s_no: number;           // N(2)
    table_name: string;     // Char(50)
    pk_field_names: string; // pipe-separated field names e.g. grn_no|line_no
    pk_field_values: string;// pipe-separated field values e.g. GRN-0001|1
    field_name: string;     // Varchar(100)
    old_value: string;      // Varchar(100)
    new_value: string;      // Varchar(100)
}

export const AuditTrailDetailSchema: Schema = new Schema(
    {
        s_no: {
            type: Number,
            required: true,
            min: 1,
            max: 99
        },
        table_name: {
            type: String,
            required: true,
            maxlength: 50,
            trim: true
        },
        pk_field_names: {
            type: String,
            required: true,
            maxlength: 200,
            trim: true
        },
        pk_field_values: {
            type: String,
            required: true,
            maxlength: 200,
            trim: true
        },
        field_name: {
            type: String,
            required: true,
            maxlength: 100,
            trim: true
        },
        old_value: {
            type: String,
            maxlength: 100,
            trim: true,
            default: ''
        },
        new_value: {
            type: String,
            maxlength: 100,
            trim: true,
            default: ''
        }
    },
    { _id: false }
);
