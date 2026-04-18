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

async function sendSongPendingEmail(adminEmail, songTitle, artistName) {
  const t = getTransporter();
  await t.sendMail({
    from: process.env.AWS_SES_FROM || 'noreply@musicapp.dev',
    to: adminEmail,
    subject: `New song pending review — ${songTitle}`,
    text: `Artist "${artistName}" has uploaded a new song "${songTitle}" that requires your review.`,
    html: `<p>Artist <strong>${artistName}</strong> has uploaded a new song <strong>${songTitle}</strong> that requires your review.</p>`,
  });
}

async function sendSongReviewEmail(artistEmail, songTitle, action, reason) {
  const t = getTransporter();
  const approved = action === 'approved';
  await t.sendMail({
    from: process.env.AWS_SES_FROM || 'noreply@musicapp.dev',
    to: artistEmail,
    subject: `Your song "${songTitle}" has been ${approved ? 'approved' : 'rejected'}`,
    text: approved
      ? `Congratulations! Your song "${songTitle}" has been approved and is now live.`
      : `Your song "${songTitle}" was rejected. Reason: ${reason}`,
    html: approved
      ? `<p>Congratulations! Your song <strong>${songTitle}</strong> has been approved and is now live.</p>`
      : `<p>Your song <strong>${songTitle}</strong> was rejected.</p><p>Reason: ${reason}</p>`,
  });
}

module.exports = { sendVerificationEmail, sendSongPendingEmail, sendSongReviewEmail };
