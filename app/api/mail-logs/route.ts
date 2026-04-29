import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/server/db/connection';
import MailLogs from '@/server/models/MailLogs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/mail-logs - Get all mail logs
export async function GET() {
    try {
        await ensureConnection();
        const logs = await MailLogs.find().lean().sort({ mail_log_id: -1 });
        return NextResponse.json(logs);
    } catch (error: any) {
        console.error('Error fetching mail logs:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch mail logs' },
            { status: 500 }
        );
    }
}

// POST /api/mail-logs - Create new mail log (auto-generates mail_log_id)
export async function POST(request: NextRequest) {
    try {
        await ensureConnection();
        const body = await request.json();

        const lastLog = await MailLogs.findOne().sort({ mail_log_id: -1 }).lean();
        const nextId = lastLog ? (lastLog as any).mail_log_id + 1 : 1;

        const log = new MailLogs({
            mail_log_id: nextId,
            mail_template_id: body.mail_template_id || '',
            mail_to: body.mail_to,
            mail_cc: body.mail_cc || '',
            mail_subject: body.mail_subject,
            mail_sent_date_time: body.mail_sent_date_time ? new Date(body.mail_sent_date_time) : new Date(),
            mail_sent_status: body.mail_sent_status,
            log_message: body.log_message || '',
        });

        await log.save();
        return NextResponse.json(log, { status: 201 });
    } catch (error: any) {
        console.error('Error creating mail log:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create mail log' },
            { status: 500 }
        );
    }
}
