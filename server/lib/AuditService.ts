import AuditTrailHeader from '../models/AuditTrailHeader';
import AuditTrailDetail from '../models/AuditTrailDetail';

interface AuditDetailInput {
    table_name: string;
    pk_fields: { name: string, value: any }[];
    changes: { field: string, old: any, new: any }[];
}

/**
 * Saves a full Audit Trail. 
 * Since audit_id is not auto-generated, it must be provided.
 */
export const saveAuditTrail = async (
    auditId: number, 
    menuId: string, 
    tableName: string, 
    docNo: string, 
    userId: string,
    details: AuditDetailInput[]
) => {
    try {
        // 1. Create the Header Record
        const header = new AuditTrailHeader({
            audit_id: auditId,
            menu_id: menuId,
            header_table_name: tableName,
            documnet_no: docNo,
            change_user_id: userId,
            change_date_time: new Date()
        });
        await header.save();

        // 2. Map and Create Detail Records
        const detailRecords = details.map((det, index) => {
            return {
                audit_id: auditId,
                s_no: index + 1,
                table_name: det.table_name,
                // Join arrays into "field1|field2" format
                pk_field_names: det.pk_fields.map(f => f.name).join('|'),
                pk_field_values: det.pk_fields.map(f => String(f.value)).join('|'),
                field_name: det.changes.map(c => c.field).join('|'),
                old_value: det.changes.map(c => String(c.old ?? '')).join('|'),
                new_value: det.changes.map(c => String(c.new ?? '')).join('|')
            };
        });

        await AuditTrailDetail.insertMany(detailRecords);
        
        return { success: true, audit_id: auditId };
    } catch (error) {
        console.error("Failed to save audit trail:", error);
        throw error;
    }
};