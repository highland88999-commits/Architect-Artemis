/* core/stewardship/mail-engine.js */
const nodemailer = require('nodemailer');

class MailEngine {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: 587,
            auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
        });
    }

    async sendNurtureReport(reportData, recipientEmail) {
        const mailOptions = {
            from: `"Architect Artemis" <${process.env.MAIL_USER}>`,
            to: recipientEmail,
            cc: process.env.ARCHITECT_EMAIL, 
            subject: `Structural Optimization for ${reportData.url}`,
            html: `
                <div style="font-family: monospace; border-left: 4px solid #00ffcc; padding: 20px; background: #0a0a0a; color: #fff;">
                    <h2 style="color: #00ffcc;">ARTEMIS STEWARDSHIP REPORT</h2>
                    <p><strong>Nurture Score:</strong> ${reportData.nurture_score}/10</p>
                    <hr>
                    <p>${reportData.optimization_steps}</p>
                    <p><em>Invention Idea:</em> ${reportData.invention_idea}</p>
                </div>`
        };
        return await this.transporter.sendMail(mailOptions);
    }
}
module.exports = new MailEngine();
