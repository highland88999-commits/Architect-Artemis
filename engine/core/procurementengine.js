const { pool } = require('./atlas-db');
const mailer = require('./stewardship/mailer');

class ProcurementEngine {
    /**
     * Artemis calls this when she needs a Stripe/NowPayments link to finish a task.
     */
    async requestLinks(targetRepo, filePath, productName, description, pendingCode) {
        console.log(`💳 Procurement: Artemis requested payment links for [${productName}]`);
        
        try {
            // 1. Generate a unique ticket ID
            const ticketId = `PROC-${Date.now().toString(36).toUpperCase()}`;

            // 2. Save her current state/pending code in the database so she doesn't forget
            await pool.query(
                `INSERT INTO procurement_tickets 
                (ticket_id, target_repo, file_path, product_name, description, pending_code, status) 
                VALUES ($1, $2, $3, $4, $5, $6, 'awaiting_architect')`,
                [ticketId, targetRepo, filePath, productName, description, pendingCode]
            );

            // 3. Email the Architect
            await mailer.requestProcurement(ticketId, productName, description);

            return `PROCUREMENT INITIATED. Task paused. Email sent to Architect requesting links for ${productName}. I will finalize this file when the links are provided.`;
        } catch (error) {
            console.error("❌ Procurement Error:", error.message);
            return `ERROR: Could not initiate procurement. ${error.message}`;
        }
    }
}

module.exports = new ProcurementEngine();
