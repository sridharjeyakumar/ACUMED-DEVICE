import mongoose from 'mongoose';
import GoodsMovementUnits from '@/server/models/GoodsMovementUnits';
import MaterialStocks from '@/server/models/MaterialStocks';
import GoodsReceiptUnits from '@/server/models/GoodsReceiptUnits';
import GoodsReceiptHeader from '@/server/models/GoodsReceiptHeader';

/**
 * Called when a Goods Movement is approved (status → 'A').
 * 1. Updates MaterialStock (current_stock_qty, total_no_of_rolls)
 * 2. Marks GoodsMovementUnits → 'A'
 * 3. Marks each GoodsReceiptUnit roll → balance_qty=0, status='C'
 * 4. If all GRUnits for material_doc_no are 'C' → closes GRHeader
 */
export async function applyApprovalStockUpdates(
    gm_no: string,
    material_id: string,
    total_nett_qty: number,
    material_doc_no: string | undefined,
    session: mongoose.ClientSession
) {
    // 1. Fetch GM Units
    const gmUnits = await GoodsMovementUnits.find({ gm_no }).session(session).lean();

    // 2. Update MaterialStock
    const rollDeduction = gmUnits.length;
    await MaterialStocks.findOneAndUpdate(
        { material_id },
        {
            $inc: {
                current_stock_qty: total_nett_qty,
                ...(rollDeduction > 0 ? { total_no_of_rolls: -rollDeduction } : {}),
            },
        },
        { session, upsert: false }
    );

    // 3. Mark GM Units approved
    if (gmUnits.length > 0) {
        await GoodsMovementUnits.updateMany(
            { gm_no },
            { $set: { status: 'A' } },
            { session }
        );
    }

    // 4. Close GR Units and check GR Header
    if (material_doc_no && gmUnits.length > 0) {
        const rollNos = gmUnits.map(u => u.roll_no);
        await GoodsReceiptUnits.updateMany(
            { material_doc_no, roll_no: { $in: rollNos } },
            { $set: { balance_qty: 0, status: 'C' } },
            { session }
        );

        // If all GRUnits for this doc are 'C' → close GRHeader
        const openUnits = await GoodsReceiptUnits
            .countDocuments({ material_doc_no, status: { $ne: 'C' } })
            .session(session);
        if (openUnits === 0) {
            await GoodsReceiptHeader.findOneAndUpdate(
                { material_doc_no },
                { $set: { status: 'C' } },
                { session }
            );
        }
    }
}
