import mongoose, { Schema, Document } from 'mongoose';

export interface ICOAHeader extends Document {
    coa_no:string;
    coa_date: Date;
    batch_no: string;
    product_id: string;
    manufactured_date: Date;
    expiry_date: Date;
    coa_checklist_id: string;
    coa_overall_result: string;
    remarks:string;
    entered_by_user_id: string;
    entered_date_time: Date;
    approval_remarks: string;
    approved_by_user_id: string;
    approved_date_time: Date;
    review_by_user_id: string;
    review_date_time: Date;
    status: string;
}
const COAHeaderSchema: Schema = new Schema({
    coa_no: { 
        type: String, 
        required: true,
        unique: true,
        maxlength: 10 // Char (10)
    },
    coa_date: { 
        type: Date, 
        required: true 
    },
    batch_no: { 
        type: String, 
        required: true,
        maxlength: 6 // Char (6)
    },
    product_id: { 
        type: String, 
        required: true,
        maxlength: 5 // Char (5)
    },
    manufactured_date: { 
        type: Date, 
        required: true 
    },
    expiry_date: { 
        type: Date, 
        required: true 
    },
    coa_checklist_id: { 
        type: String, 
        required: true,
        maxlength: 4 // Char (4)
    },
    coa_overall_result: { 
        type: String,
        required: true,
        enum: ['P', 'F'], // Enum for Pass/Fail
        maxlength: 1 // Char (1)
    },
    remarks: { 
        type: String, 
        maxlength: 100 // Char (100)
    },
    entered_by_user_id: { 
        type: String, 
        required: true,
        maxlength: 5 // Char (5)
    },
    entered_date_time: { 
        type: Date, 
        required: true 
    },
    approval_remarks: { 
        type: String, 
        maxlength: 100 // Char (100)
    },
    approved_by_user_id: { 
        type: String,
        maxlength: 5 // Char (5)
    },
    approved_date_time: { 
        type: Date 
    },
    review_by_user_id: { 
        type: String,
        maxlength: 5 // Char (5)
    },
    review_date_time: { 
        type: Date 
    },
    status: { 
        type: String, 
        required: true,
        enum: ['E', 'A', 'X'], // Enum for Active/Inactive
        maxlength: 1 // Char (1)
    }
},
{
    timestamps: false 
});

const COAHeader = mongoose.models.COAHeader || mongoose.model<ICOAHeader>('COAHeader', COAHeaderSchema);

export default COAHeader;