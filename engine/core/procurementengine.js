/* engine/core/procurement.js */
require('dotenv').config();

const { pool } = require('./atlas-db');
const mailer = require('./stewardship/mailer');

class ProcurementEngine {
    /**
     * Called by Artemis when she needs real Stripe / NowPayments links
     * to inject monetization (especially important for high-value products like hoodie store features, apps, agents, etc.)
     */
    async requestLinks(targetRepo, filePath, productName, description, pendingCode) {
        console.log(`💳 [ProcurementEngine] Request received for: ${productName}`);

        try {
            // Generate a more unique and readable ticket ID
            const ticketId = `PROC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            // Save complete context so Artemis can resume later
            await pool.query(
                `INSERT INTO procurement_tickets 
                (ticket_id, target_repo, file_path, product_name, description, pending_code, status, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, 'awaiting_architect', NOW())`,
                [ticketId, targetRepo, filePath, productName, description, pendingCode]
            );

            console.log(`📋 Procurement ticket created: ${ticketId}`);

            // Send professional email to Architect using the updated mailer
            await mailer.requestProcurement(
                ticketId,
                productName,
                description,
                targetRepo,
                filePath
            );

            return {
                success: true,
                ticketId: ticketId,
                message: `✅ PROCUREMENT TICKET CREATED\n\n` +
                        `Product: ${productName}\n` +
                        `Ticket ID: ${ticketId}\n\n` +
                        `I have saved the pending code and notified the Architect.\n` +
                        `Task is now paused until payment links are provided.`
            };

        } catch (error) {
            console.error("❌ ProcurementEngine Error:", error.message);
            
            return {
                success: false,
                message: `ERROR: Could not initiate procurement for "${productName}". ${error.message}`
            };
        }
    }

    /**
     * (Optional but recommended) Called by you (the Architect) after providing links
     */
    async completeTicket(ticketId, stripeLink = null, cryptoLink = null) {
        try {
            await pool.query(
                `UPDATE procurement_tickets 
                 SET status = 'completed',
                     stripe_link = $1,
                     crypto_link = $2,
                     completed_at = NOW()
                 WHERE ticket_id = $3`,
                [stripeLink, cryptoLink, ticketId]
            );

            console.log(`✅ Procurement ticket ${ticketId} marked as completed.`);
            return true;
        } catch (err) {
            console.error("Failed to complete procurement ticket:", err.message);
            return false;
        }
    }
}

module.exports = new ProcurementEngine();
