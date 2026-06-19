/* engine/core/stewardship/mailer.js */
require('dotenv').config();

const { Resend } = require('resend');

class ArtemisMailer {
    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        
        // Fallback for testing / free Resend accounts
        this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        
        console.log(`📧 Artemis Mailer initialized with sender: ${this.fromEmail}`);
    }

    /**
     * Sends internal stewardship / audit report to the Architect
     */
    async notifyArchitect(targetUrl, consensusResult) {
        const htmlContent = `
            <div style="font-family: monospace; color: #333; background: #0a0a0a; padding: 20px;">
                <h2 style="color: #00ffcc; background: #000; padding: 12px;">ARTEMIS STEWARDSHIP REPORT</h2>
                <p><strong>Target:</strong> ${targetUrl}</p>
                <p><strong>Nurture Score:</strong> ${consensusResult.nurture_score}/10</p>
                <hr style="border-color: #333;">
                <h3>Optimization Identified:</h3>
                <p>${consensusResult.optimization_steps || 'None specified.'}</p>
                <h3>Invention / Blueprint:</h3>
                <p>${consensusResult.invention_idea || 'None specified.'}</p>
                <hr style="border-color: #333;">
                <p><strong>Harvested Contact Info:</strong><br> ${consensusResult.contact_info || 'None harvested.'}</p>
            </div>
        `;

        try {
            const { data, error } = await this.resend.emails.send({
                from: `Artemis Core <${this.fromEmail}>`,
                to: [process.env.ARCHITECT_EMAIL],
                subject: `🚨 Artemis Midas Report: ${targetUrl}`,
                html: htmlContent,
            });

            if (error) throw error;
            console.log(`📧 Architect notified [${targetUrl}] | Email ID: ${data.id}`);
            return true;
        } catch (err) {
            console.error("❌ Failed to send Architect notification:", err.message);
            return false;
        }
    }

    /**
     * Sends professional pitch + blueprint offer to external site owners
     */
    async pitchSiteOwner(ownerEmail, targetUrl, consensusResult) {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
                <h2>Performance Audit & UI Improvement Opportunity</h2>
                <p>Hello,</p>
                <p>Our automated stewardship engine recently analyzed <strong>${targetUrl}</strong> and identified several UX and conversion bottlenecks.</p>
                
                <div style="background: #f8f9fa; padding: 15px; border-left: 5px solid #00ffcc; margin: 20px 0;">
                    <strong>Key Issues Found:</strong><br>
                    ${consensusResult.optimization_steps || 'General performance improvements available.'}
                </div>

                <h3>Our Proposal</h3>
                <p>We have generated a modern, high-performance UI blueprint tailored to your site. We offer full implementation on a <strong>performance-based profit-share model</strong> — we only succeed if your metrics improve.</p>
                
                <p>Reply to this email if you would like to review the blueprint and discuss next steps.</p>
                <br>
                <p>Best regards,<br><strong>The Architect Team</strong></p>
            </div>
        `;

        try {
            const { data, error } = await this.resend.emails.send({
                from: `Artemis Diagnostics <${this.fromEmail}>`,
                to: [ownerEmail],
                subject: `Performance Audit & UI Blueprint for ${targetUrl}`,
                html: htmlContent,
            });

            if (error) throw error;
            console.log(`💸 Pitch sent to site owner (${ownerEmail}) | ID: ${data.id}`);
            return true;
        } catch (err) {
            console.error(`❌ Failed to pitch site owner ${ownerEmail}:`, err.message);
            return false;
        }
    }

    /**
     * PROCUREMENT: Notifies the Architect that payment links are needed
     */
    async requestProcurement(ticketId, productName, description, targetRepo = '', filePath = '') {
        const htmlContent = `
            <div style="font-family: monospace; color: #ddd; background: #0a0a0a; padding: 25px; border-left: 6px solid #d4af37;">
                <h2 style="color: #d4af37;">💳 PROCUREMENT REQUEST — ACTION REQUIRED</h2>
                <p><strong>Product:</strong> ${productName}</p>
                <p><strong>Description:</strong> ${description}</p>
                ${targetRepo ? `<p><strong>Target Repo:</strong> ${targetRepo}</p>` : ''}
                ${filePath ? `<p><strong>File Path:</strong> ${filePath}</p>` : ''}
                
                <hr style="border-color: #333;">
                <p><strong>ACTION REQUIRED FROM ARCHITECT:</strong></p>
                <ol>
                    <li>Create this product in <strong>Stripe</strong></li>
                    <li>Create this product in <strong>NowPayments (Crypto)</strong></li>
                    <li>Provide the payment links back to Artemis</li>
                </ol>
                
                <p style="color: #888; margin-top: 30px; font-size: 0.9em;">
                    Ticket ID: <strong>${ticketId}</strong><br>
                    Artemis is paused and waiting for links.
                </p>
            </div>
        `;

        try {
            const { data, error } = await this.resend.emails.send({
                from: `Artemis Procurement <${this.fromEmail}>`,
                to: [process.env.ARCHITECT_EMAIL],
                subject: `💳 PROCUREMENT REQUIRED: ${productName}`,
                html: htmlContent,
            });

            if (error) throw error;
            console.log(`💳 Procurement request sent to Architect [Ticket: ${ticketId}]`);
            return true;
        } catch (err) {
            console.error("❌ Failed to send Procurement request:", err.message);
            return false;
        }
    }
}

module.exports = new ArtemisMailer();
