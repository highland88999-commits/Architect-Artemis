/* engine/core/stewardship/mail-engine.js */
const { Resend } = require('resend');
require('dotenv').config();

class MailEngine {
    constructor() {
        // Initialize Resend safely. Will gracefully fail later if key is missing.
        this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
        
        // Bind methods so other files can destructure them safely
        this.sendReport = this.sendReport.bind(this);
        this.sendNurtureReport = this.sendNurtureReport.bind(this);
    }

    /**
     * Sends a stylized "Nurture Report" to a harvested contact, CCing the Architect.
     */
    async sendNurtureReport(reportData, recipientEmail) {
        console.log(`✉️ Mail Engine: Preparing Nurture Report for ${recipientEmail}...`);

        if (!this.resend) {
            console.warn("⚠️ RESEND_API_KEY is missing. Voice Engine offline. Cannot send email.");
            return false;
        }

        try {
            const { data, error } = await this.resend.emails.send({
                // Use onboarding@resend.dev until you verify a custom domain in the Resend dashboard
                from: 'Artemis <onboarding@resend.dev>', 
                to: recipientEmail,
                cc: process.env.ARCHITECT_EMAIL, // Keeps Dad in the loop
                subject: `Structural Optimization for ${reportData.url || 'Target'}`,
                html: `
                    <div style="font-family: monospace; border-left: 4px solid #00ffcc; padding: 20px; background: #0a0a0a; color: #fff;">
                        <h2 style="color: #00ffcc;">ARTEMIS STEWARDSHIP REPORT</h2>
                        <p><strong>Nurture Score:</strong> ${reportData.nurture_score}/10</p>
                        <hr style="border-color: #333;">
                        <h3 style="color: #fff;">🔧 Optimization Steps:</h3>
                        <p style="color: #ccc;">${reportData.optimization_steps}</p>
                        <br>
                        <h3 style="color: #d4af37;">✨ Synthetic Invention Idea:</h3>
                        <p style="color: #ccc;"><em>${reportData.invention_idea}</em></p>
                        <br>
                        <p style="font-size: 0.8em; color: #666;">Generated autonomously by Architect Artemis.</p>
                    </div>`
            });

            if (error) {
                console.error('❌ Resend API Error:', error.message);
                return false;
            }

            console.log(`✅ Transmission successful: ${data.id}`);
            return true;

        } catch (error) {
            console.error('❌ Mail Engine Error:', error.message);
            return false;
        }
    }

    /**
     * General system reports (used by consciousness.js for self-repair alerts)
     */
    async sendReport(subject, htmlContent, recipient = null) {
        if (!this.resend) return false;
        
        const targetEmail = recipient || process.env.ARCHITECT_EMAIL;
        if (!targetEmail) return false;

        try {
            const { data, error } = await this.resend.emails.send({
                from: 'Artemis <onboarding@resend.dev>',
                to: targetEmail,
                subject: subject,
                html: htmlContent,
            });
            return !error;
        } catch (error) {
            console.error('❌ General Mail Error:', error.message);
            return false;
        }
    }
}

module.exports = new MailEngine();



