import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditTrailDetail extends Document {
    audit_id:number;                      // N(8) 
    s_no:number;                          // N(2) 
    table_name:string;                   // Char(50)
    pk_field_names:string;              // Varchar(10)
    pk_field_values:string;              // Varchar(50)
    field_name:string                  //Varchar(100)
    old_value:string;                   // Varchar(100)
    new_value:string;                   // Varchar(100)
}
 const AuditTrailDetailSchema: Schema = new Schema({
    audit_id:{
        type:Number,
        required:true,
        min:0,
        max:99999999,
        ref:'AuditTrailHeader'
    },
    s_no:{
        type:Number,
        required:true,
        min:1,
        max:99
    },
    table_name:{
        type:String,
        required:true,
        maxlength:50,
        trim:true
    },
    pk_field_names:{
        type:String,
        required:true,
        maxlength:10,
        trim:true
    },
    pk_field_values:{
        type:String,
        required:true,
        maxlength:50,
        trim:true
    },
    field_name:{
        type:String,
        required:true,
        maxlength:100,
        trim:true
    },
    old_value:{
        type:String,
        maxlength:100,
        trim:true
    },
    new_value:{
        type:String,
        maxlength:100,
        trim:true
    }
 });

 export default mongoose.model<IAuditTrailDetail>('AuditTrailDetail', AuditTrailDetailSchema);
