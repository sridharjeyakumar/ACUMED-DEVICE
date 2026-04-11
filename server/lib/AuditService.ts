import mongoose from 'mongoose';
import AuditTrailHeader from '@/server/models/AuditTrailHeader';
import { IAuditTrailDetail } from '@/server/models/AuditTrailDetail';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditTableInput {
    table_name: string;
    pk_field_names: string;           // pipe-separated  e.g. "grn_no|line_no"
    pk_field_values: string;          // pipe-separated  e.g. "GRN-0001|1"
    old_data: Record<string, any>;    // object before update
    new_data: Record<string, any>;    // object after update
}

export interface SaveAuditParams {
    menu_id: string;
    header_table_name: string;
    documnet_no: string;
    change_user_id: string;
    tables: AuditTableInput[];
    session?: mongoose.ClientSession;
}

// ─── audit_id Generator ───────────────────────────────────────────────────────

/**
 * Generates the next audit_id for the current year.
 * Format: YY + 4-digit sequence  →  260001, 260002 ...
 * Resets every year: 270001, 270002 ...
 */
async function generateAuditId(session?: mongoose.ClientSession): Promise<number> {
    const yearPrefix = parseInt(new Date().getFullYear().toString().slice(-2)); // e.g. 26
    const rangeStart = yearPrefix * 10000;   // 260000
    const rangeEnd   = rangeStart + 9999;    // 269999

    const last = await AuditTrailHeader.findOne(
        { audit_id: { $gte: rangeStart, $lte: rangeEnd } },
        { audit_id: 1 },
        { sort: { audit_id: -1 }, session }
    ).lean();

    return last ? (last as any).audit_id + 1 : rangeStart + 1; // first → 260001
}

// ─── Field Comparator ─────────────────────────────────────────────────────────

/**
 * Compares old_data vs new_data field by field.
 * Skips internal mongoose / metadata fields.
 * Returns one detail entry per changed field.
 */
function buildDetails(
    tables: AuditTableInput[],
    startSno: number = 1
): IAuditTrailDetail[] {
    const SKIP_FIELDS = new Set([
        '_id', '__v', 'createdAt', 'updatedAt',
        'last_modified_date_time', 'last_modified_user_id'
    ]);

    const details: IAuditTrailDetail[] = [];
    let s_no = startSno;

    for (const table of tables) {
        const { table_name, pk_field_names, pk_field_values, old_data, new_data } = table;

        // Union of all field keys from both objects
        const allKeys = new Set([
            ...Object.keys(old_data),
            ...Object.keys(new_data)
        ]);

        for (const key of allKeys) {
            if (SKIP_FIELDS.has(key)) continue;

            const oldVal = old_data[key] ?? '';
            const newVal = new_data[key] ?? '';

            // Stringify for comparison (handles dates, numbers, nested)
            const oldStr = String(oldVal instanceof Date ? oldVal.toISOString() : oldVal);
            const newStr = String(newVal instanceof Date ? newVal.toISOString() : newVal);

            if (oldStr === newStr) continue;

            details.push({
                s_no,
                table_name,
                pk_field_names,
                pk_field_values,
                field_name: key,
                old_value: oldStr.slice(0, 100),
                new_value: newStr.slice(0, 100)
            } as IAuditTrailDetail);

            s_no++;
        }
    }

    return details;
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Saves an audit trail record (header + embedded details).
 *
 * Usage:
 *   await saveAudit({
 *     menu_id: 'GRN',
 *     header_table_name: 'GoodsReceiptHeader',
 *     documnet_no: 'GRN-0001',
 *     change_user_id: 'USR01',
 *     tables: [
 *       {
 *         table_name: 'GoodsReceiptHeader',
 *         pk_field_names: 'grn_no',
 *         pk_field_values: 'GRN-0001',
 *         old_data: oldHeader,
 *         new_data: newHeader
 *       },
 *       {
 *         table_name: 'GoodsReceiptDetail',
 *         pk_field_names: 'grn_no|line_no',
 *         pk_field_values: 'GRN-0001|1',
 *         old_data: oldDetail,
 *         new_data: newDetail
 *       }
 *     ],
 *     session   // optional mongoose session for transactions
 *   });
 */
export async function saveAudit(params: SaveAuditParams): Promise<void> {
    const { menu_id, header_table_name, documnet_no, change_user_id, tables, session } = params;

    const details = buildDetails(tables);

    // Nothing changed — no audit needed
    if (details.length === 0) return;

    const audit_id = await generateAuditId(session);

    await AuditTrailHeader.create(
        [
            {
                audit_id,
                menu_id,
                header_table_name,
                documnet_no,
                change_user_id,
                change_date_time: new Date(),
                details
            }
        ],
        { session }
    );
}
