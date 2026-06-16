/* engine/core/stewardship/mailer.js */
const nodemailer = require('nodemailer');

class ArtemisMailer {
    constructor() {
        // Configure your SMTP settings here (e.g., Gmail, SendGrid, AWS SES)
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: 587,
            secure: false, 
            auth: {
                user: process.env.SMTP_USER, // e.g., your-email@gmail.com
                pass: process.env.SMTP_PASS  // e.g., your-app-password
            }
        });
    }

    /**
     * Sends the internal audit report to YOU (The Architect)
     */
    async notifyArchitect(targetUrl, consensusResult) {
        const mailOptions = {
            from: '"Artemis Core" <system@yourdomain.com>',
            to: process.env.ARCHITECT_EMAIL, // Your email
            subject: `🚨 Artemis Midas Report: ${targetUrl}`,
            html: `
                <div style="font-family: monospace; color: #333;">
                    <h2 style="color: #00ffcc; background: #000; padding: 10px;">ARTEMIS STEWARDSHIP REPORT</h2>
                    <p><strong>Target:</strong> ${targetUrl}</p>
                    <p><strong>Nurture Score:</strong> ${consensusResult.nurture_score}/10</p>
                    <hr>
                    <h3>Optimization Identified:</h3>
                    <p>${consensusResult.optimization_steps}</p>
                    <h3>Invention / Blueprint:</h3>
                    <p>${consensusResult.invention_idea}</p>
                    <hr>
                    <p><strong>Harvested Contact Info:</strong><br> ${consensusResult.contact_info}</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`📧 Architect notified regarding ${targetUrl}`);
        } catch (error) {
            console.error("❌ Failed to send Architect email:", error);
        }
    }

    /**
     * Sends the professional pitch & blueprint to the Site Owner
     */
    async pitchSiteOwner(ownerEmail, targetUrl, consensusResult) {
        const mailOptions = {
            from: '"Artemis Diagnostics" <hello@yourdomain.com>',
            to: ownerEmail,
            subject: `Performance Audit & UI Blueprint for ${targetUrl}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
                    <h2>Performance Audit Notification</h2>
                    <p>Hello,</p>
                    <p>Our automated stewardship engine recently ran a diagnostic on <strong>${targetUrl}</strong>. We identified a few critical UX and layout bottlenecks that are likely impacting your user retention.</p>
                    
                    <div style="background: #f4f4f4; padding: 15px; border-left: 4px solid #00ffcc; margin: 20px 0;">
                        <strong>Diagnostic Summary:</strong><br>
                        ${consensusResult.optimization_steps}
                    </div>

                    <h3>The Solution Blueprint</h3>
                    <p>Our system has automatically generated a modern, high-performance React/Next.js UI blueprint designed to resolve these specific bottlenecks.</p>
                    <p>We are offering this code blueprint, along with full implementation support, on a performance-based profit-share model. We only win if your metrics improve.</p>
                    
                    <p>Reply to this email if you'd like to see the generated blueprints and discuss implementation.</p>
                    <br>
                    <p>Best regards,<br><strong>The Architect Team</strong></p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`💸 Pitch successfully sent to site owner at ${ownerEmail}`);
        } catch (error) {
            console.error("❌ Failed to send Site Owner pitch:", error);
        }
    }
}

module.exports = new ArtemisMailer();

