const nodemailer = require('nodemailer');

// Use AWS SES SMTP in production; fall back to Ethereal/console in development
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport({
      host: `email-smtp.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com`,
      port: 587,
      secure: false,
      auth: {
        user: process.env.AWS_SES_SMTP_USER,
        pass: process.env.AWS_SES_SMTP_PASS,
      },
    });
  } else {
    // Development: log to console, no real send
    transporter = {
      sendMail: async (opts) => {
        console.log('📧 [DEV EMAIL]', { to: opts.to, subject: opts.subject });
        console.log('   Verification URL:', opts.text || opts.html);
        return { messageId: 'dev-' + Date.now() };
      },
    };
  }

  return transporter;
}

async function sendVerificationEmail(toEmail, verifyUrl) {
  const t = getTransporter();
  await t.sendMail({
    from: process.env.AWS_SES_FROM || 'noreply@musicapp.dev',
    to: toEmail,
    subject: 'Verify your email — Music App',
    text: `Click the link to verify your email: ${verifyUrl}`,
    html: `<p>Click the link to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

module.exports = { sendVerificationEmail };
