import mongoose, { Schema, Document } from 'mongoose';

export interface IPacking extends Document {
    packing_id: number;           
    packing_date: Date;             
    batch_no: string;              
    product_id: string;
    input_product_id: string;
    packsize_id: string;            
    no_of_packs: number;
    no_of_sachets: number;
    total_machine_time_in_min: number;
    product_status_id: string;
    carton_type_id: string;
    packing_material_id: string;
    remarks: string;
    entered_by_user_id: string;
    entered_date_time: Date;
    approval_remarks: string;
    approved_by_user_id: string;
    approved_date_time: Date;
    status: string;
}

const PackingSchema: Schema = new Schema({
    packing_id: { 
        type: Number, 
        required: true, 
        unique: true,
        max: 9999999 // N (7) - Max 7 digits
    },
    packing_date: { 
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
    input_product_id: {
        type: String,
        maxlength: 5 // Char (5) - FK
    },
    packsize_id: { 
        type: String, 
        required: true,
        maxlength: 4 // Char (4)
    },
    no_of_packs: { 
        type: Number, 
        max: 999999 // N (6)
    },
    no_of_sachets: { 
        type: Number, 
        max: 99999999 // N (8)
    },
    total_machine_time_in_min: { 
        type: Number, 
        max: 9999 // N (4)
    },
    product_status_id: { 
        type: String, 
        required: true,
        maxlength: 2 // Char (2)
    },
    carton_type_id: { 
        type: String, 
        required: true,
        maxlength: 2 // Char (2)
    },
    packing_material_id: { 
        type: String, 
        required: true,
        maxlength: 5 // Char (5)
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
        default: Date.now 
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
    status: { 
        type: String, 
        required: true,
        maxlength: 1 // Char (1)
    }
}, {
    timestamps: false 
});

// Check if the model exists in the models object, otherwise create it
const Packing = mongoose.models.Packing || mongoose.model<IPacking>('Packing', PackingSchema);

export default Packing;