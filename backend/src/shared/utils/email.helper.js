const nodemailer = require('nodemailer');

/* ── Brevo SMTP Transporter ───────────────────────────────────────────────── */
let _transporter;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_PASS,
    },
  });

  return _transporter;
}

const FROM = process.env.BREVO_SENDER || process.env.BREVO_USER;

/* ── Base HTML template ──────────────────────────────────────────────────── */
function baseTemplate({ title, preheader, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#07070f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070f;min-height:100vh;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#1DB954,#15803d);border-radius:14px;padding:10px 13px;vertical-align:middle;">
              <span style="font-size:22px;color:white;line-height:1;">♪</span>
            </td>
            <td style="padding-left:12px;vertical-align:middle;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">SoundWave</span>
            </td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">
          <div style="height:4px;background:linear-gradient(90deg,#1DB954,#0ea5e9,#818cf8);"></div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:40px 40px 36px;">${bodyHtml}</td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0;color:rgba(255,255,255,0.2);font-size:12px;line-height:1.7;">
            © ${new Date().getFullYear()} SoundWave. All rights reserved.<br/>
            This email was sent automatically — please do not reply.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── 1. Verification email ───────────────────────────────────────────────── */
async function sendVerificationEmail(toEmail, verifyUrl) {
  const bodyHtml = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(29,185,84,0.12);border:1px solid rgba(29,185,84,0.25);border-radius:50%;padding:18px;">
        <span style="font-size:32px;">✉️</span>
      </div>
    </div>

    <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:700;text-align:center;letter-spacing:-0.3px;">
      Verify your email
    </h1>
    <p style="margin:0 0 28px;color:rgba(255,255,255,0.45);font-size:14px;text-align:center;line-height:1.7;">
      Thanks for signing up for SoundWave!<br/>
      Click the button below to confirm your email and activate your account.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${verifyUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#1DB954,#0ea5e9);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 38px;border-radius:50px;letter-spacing:0.2px;">
        Verify Email Address
      </a>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.07);margin:0 0 24px;"></div>

    <p style="margin:0 0 6px;color:rgba(255,255,255,0.3);font-size:12px;text-align:center;">
      Button not working? Paste this link into your browser:
    </p>
    <p style="margin:0 0 20px;text-align:center;">
      <a href="${verifyUrl}" style="color:#1DB954;font-size:12px;word-break:break-all;text-decoration:none;">${verifyUrl}</a>
    </p>

    <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:12px 16px;">
      <p style="margin:0;color:rgba(251,191,36,0.8);font-size:12px;text-align:center;line-height:1.6;">
        ⏳ Link expires in <strong>24 hours</strong>.
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"SoundWave" <${FROM}>`,
    to: toEmail,
    subject: '🎵 Verify your SoundWave account',
    text: `Welcome to SoundWave!\n\nVerify your email:\n${verifyUrl}\n\nLink expires in 24 hours.`,
    html: baseTemplate({
      title: 'Verify your email — SoundWave',
      preheader: 'Click to verify your email and start listening.',
      bodyHtml,
    }),
  });
}

/* ── 2. Song pending review (admin) ─────────────────────────────────────── */
async function sendSongPendingEmail(adminEmail, songTitle, artistName) {
  const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin`;

  const bodyHtml = `
    <div style="text-align:center;margin-bottom:24px;"><span style="font-size:36px;">🎵</span></div>
    <h1 style="margin:0 0 8px;color:#ffffff;font-size:20px;font-weight:700;text-align:center;">
      New Song Pending Review
    </h1>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.45);font-size:14px;text-align:center;line-height:1.6;">
      A new song is waiting for your approval.
    </p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 22px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:.8px;">Song</p>
      <p style="margin:0 0 14px;color:#ffffff;font-size:16px;font-weight:600;">${songTitle}</p>
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:.8px;">Artist</p>
      <p style="margin:0;color:#1DB954;font-size:14px;font-weight:600;">${artistName}</p>
    </div>
    <div style="text-align:center;">
      <a href="${adminUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#1DB954,#0ea5e9);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 30px;border-radius:50px;">
        Review in Admin Panel
      </a>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"SoundWave" <${FROM}>`,
    to: adminEmail,
    subject: `🎵 New song pending review — ${songTitle}`,
    text: `Artist "${artistName}" uploaded "${songTitle}" and it requires your review.\n\nAdmin panel: ${adminUrl}`,
    html: baseTemplate({
      title: 'New song pending review — SoundWave',
      preheader: `${artistName} uploaded "${songTitle}" — review required.`,
      bodyHtml,
    }),
  });
}

/* ── 3. Song review result (artist) ─────────────────────────────────────── */
async function sendSongReviewEmail(artistEmail, songTitle, action, reason) {
  const approved   = action === 'approved';
  const dashUrl    = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/artist/dashboard`;
  const accentColor = approved ? '#1DB954' : '#ef4444';
  const bgColor     = approved ? 'rgba(29,185,84,0.12)'  : 'rgba(239,68,68,0.12)';
  const borderColor = approved ? 'rgba(29,185,84,0.25)'  : 'rgba(239,68,68,0.25)';

  const bodyHtml = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:${bgColor};border:1px solid ${borderColor};border-radius:50%;padding:16px;">
        <span style="font-size:30px;">${approved ? '✅' : '❌'}</span>
      </div>
    </div>
    <h1 style="margin:0 0 8px;color:#ffffff;font-size:22px;font-weight:700;text-align:center;">
      ${approved ? 'Your song is live! 🎉' : 'Song not approved'}
    </h1>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.45);font-size:14px;text-align:center;line-height:1.6;">
      ${approved
        ? 'Great news — your track has been reviewed and approved.'
        : 'Your track did not meet our content guidelines.'}
    </p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 22px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:.8px;">Track</p>
      <p style="margin:0;color:#ffffff;font-size:16px;font-weight:600;">${songTitle}</p>
      ${!approved && reason ? `
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0 0 4px;color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:.8px;">Reason</p>
          <p style="margin:0;color:rgba(239,68,68,0.85);font-size:13px;line-height:1.5;">${reason}</p>
        </div>` : ''}
    </div>
    ${approved
      ? `<div style="text-align:center;">
           <a href="${dashUrl}" style="display:inline-block;background:linear-gradient(135deg,#1DB954,#0ea5e9);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 30px;border-radius:50px;">
             View in Dashboard
           </a>
         </div>`
      : `<div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:12px 16px;">
           <p style="margin:0;color:rgba(251,191,36,0.8);font-size:12px;text-align:center;line-height:1.6;">
             You can edit and re-upload your track from your Artist Dashboard after addressing the feedback above.
           </p>
         </div>`
    }
  `;

  await getTransporter().sendMail({
    from: `"SoundWave" <${FROM}>`,
    to: artistEmail,
    subject: approved ? `✅ "${songTitle}" is now live on SoundWave!` : `❌ "${songTitle}" was not approved`,
    text: approved
      ? `Your song "${songTitle}" has been approved and is now live.`
      : `Your song "${songTitle}" was rejected.\nReason: ${reason}`,
    html: baseTemplate({
      title: approved ? 'Song approved — SoundWave' : 'Song not approved — SoundWave',
      preheader: approved ? `"${songTitle}" is now live!` : `"${songTitle}" needs changes.`,
      bodyHtml,
    }),
  });
}

module.exports = { sendVerificationEmail, sendSongPendingEmail, sendSongReviewEmail };
