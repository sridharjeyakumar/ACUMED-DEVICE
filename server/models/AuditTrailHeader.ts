import mongoose, { Schema, Document } from 'mongoose';
export interface IAuditTrailHeader extends Document {
    audit_id:number;                      // N(8) - PK
    menu_id:string;                      // Char(3)
    header_table_name:string;              // Char(50)
    documnet_no:string                 // Char(10)
    change_user_id:string;                 // Char(5)
    change_date_time:Date;
}
const AuditTrailHeaderSchema: Schema = new Schema({
    audit_id:{
        type:Number,
        required:true,
        unique:true,
        min:0,
        max:99999999
    },
    menu_id:{
        type:String,
        required:true,
        maxlength:3,
        trim:true,
        uppercase:true
    },
    header_table_name:{
        type:String,
        required:true,
        maxlength:50,
        trim:true
    },
    documnet_no:{
        type:String,
        required:true,
        maxlength:10,
        trim:true
    },
    change_user_id:{
        type:String,
        required:true,
        maxlength:5,
        trim:true,
        uppercase:true
    },
    change_date_time:{
        type:Date,
        required:true
    }
});

export default mongoose.model<IAuditTrailHeader>('AuditTrailHeader', AuditTrailHeaderSchema);