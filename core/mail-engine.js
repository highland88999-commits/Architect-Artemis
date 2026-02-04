/* core/mail-engine.js */
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Use the 16-character App Password
  },
});

async function sendReport(subject, htmlContent) {
  const mailOptions = {
    from: `"Artemis" <${process.env.MAIL_USER}>`,
    to: process.env.ARCHITECT_EMAIL,
    subject: subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ Report transmitted:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Voice Engine Error:', error);
    return false;
  }
}

module.exports = { sendReport };
