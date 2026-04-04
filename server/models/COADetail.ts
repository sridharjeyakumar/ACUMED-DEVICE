import mongoose, { Schema, Document } from 'mongoose';

export interface ICOADetail extends Document {
    coa_no: string;          // Char(10), PK
    checklist_sno: number;   // N(2), PK
    actual_value?: number;   // N(6,3), optional
    actual_text?: string;    // Char(25), optional
    actual_result: string;   // Char(1), P/F
}

const COADetailSchema: Schema = new Schema({
    coa_no: {
        type: String,
        required: true,
        maxlength: 10   // Char(10)
    },
    checklist_sno: {
        type: Number,
        required: true  // N(2) - 2-digit number
    },
    actual_value: {
        type: Number,
        required: false // optional - N(6,3)
    },
    actual_text: {
        type: String,
        required: false,
        maxlength: 25   // Char(25)
    },
    actual_result: {
        type: String,
        required: true,
        enum: ['P', 'F'],
        maxlength: 1    // Char(1)
    }
},
{
    timestamps: false
});

// Compound unique index on both PKs
COADetailSchema.index({ coa_no: 1, checklist_sno: 1 }, { unique: true });

const COADetail = mongoose.models.COADetail || mongoose.model<ICOADetail>('COADetail', COADetailSchema);

export default COADetail;
