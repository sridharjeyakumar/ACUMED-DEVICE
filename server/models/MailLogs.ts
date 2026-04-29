import mongoose, { Schema, Document } from 'mongoose';

export interface IMailLogs extends Document {
    mail_log_id: number;          // N(5) - PK, auto-generated starting from 1
    mail_template_id: string;     // Char(5) FK
    mail_to: string;              // Char(100)
    mail_cc: string;              // Char(100)
    mail_subject: string;         // Char(100)
    mail_sent_date_time: Date;
    mail_sent_status: string;     // Char(1) - P=Pending, S=Sent, F=Failed
    log_message: string;          // Char(100)
}

const MailLogsSchema: Schema = new Schema({
    mail_log_id: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
        max: 99999
    },
    mail_template_id: {
        type: String,
        required: false,
        maxlength: 5,
        trim: true,
        uppercase: true
    },
    mail_to: {
        type: String,
        required: true,
        maxlength: 100,
        trim: true
    },
    mail_cc: {
        type: String,
        required: false,
        maxlength: 100,
        trim: true,
        default: ''
    },
    mail_subject: {
        type: String,
        required: true,
        maxlength: 100,
        trim: true
    },
    mail_sent_date_time: {
        type: Date,
        required: true,
        default: Date.now
    },
    mail_sent_status: {
        type: String,
        required: true,
        maxlength: 1,
        trim: true,
        uppercase: true,
    },
    log_message: {
        type: String,
        required: false,
        maxlength: 100,
        trim: true,
        default: ''
    }
});

MailLogsSchema.index({ mail_log_id: 1 });
MailLogsSchema.index({ mail_sent_status: 1 });
MailLogsSchema.index({ mail_sent_date_time: -1 });

const MailLogs =
    (mongoose.models.MailLogs as mongoose.Model<IMailLogs>) ||
    mongoose.model<IMailLogs>('MailLogs', MailLogsSchema);

export default MailLogs;
