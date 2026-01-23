// lib/email.js
import nodemailer from "nodemailer";

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_NAME = "Actirova AI Tutor";
const PRIMARY_COLOR = "#6366f1";
const ACCENT_COLOR = "#8b5cf6";

/**
 * Professional Base Email Template
 * @param {Object} options
 * @param {string} options.title - Email title
 * @param {string} options.preheader - Preview text
 * @param {string} options.content - HTML content
 * @returns {string} HTML email string
 */
const getBaseTemplate = ({ title, preheader, content }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f3f4f6; padding-bottom: 40px; }
    .main { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: ${PRIMARY_COLOR}; padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
    .content { padding: 40px; }
    .footer { padding: 32px; text-align: center; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background-color: ${PRIMARY_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 24px 0; }
    .code-box { background-color: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
    .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: ${PRIMARY_COLOR}; margin: 0; }
    .divider { border-top: 1px solid #e5e7eb; margin: 32px 0; }
    .preheader { display: none; max-height: 0px; overflow: hidden; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    p { margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="preheader">${preheader || title}</div>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <h1>${APP_NAME}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        <p>You received this email because you're a registered user of ${APP_NAME}.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export async function sendVerificationEmail({ to, name, token, code }) {
  const verificationLink = `${process.env.CORS_ORIGIN || process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify-email?token=${token}`;
  const fromAddress = process.env.SMTP_FROM || `"${APP_NAME}" <noreply@actirova.com>`;

  const html = getBaseTemplate({
    title: "Verify Your Email",
    preheader: "Verify your email address to get started with Actirova AI Tutor.",
    content: `
      <h2>Hello ${name || "there"},</h2>
      <p>Welcome to <strong>${APP_NAME}</strong>! We're excited to have you join our community of lifelong learners.</p>
      <p>To complete your registration and start your personalized learning journey, please verify your email address.</p>
      
      <div class="code-box">
        <p style="margin-top: 0; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Verification Code</p>
        <h3 class="code">${code}</h3>
        <p style="margin-bottom: 0; font-size: 13px; color: #9ca3af;">This code expires in 24 hours.</p>
      </div>

      <p>Alternatively, you can verify your account by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify My Email</a>
      </div>

      <div class="divider"></div>
      <p><strong>What's next?</strong></p>
      <ul>
        <li>Set up your learning profile</li>
        <li>Generate your first AI-powered course</li>
        <li>Practice with interactive flashcards and quizzes</li>
      </ul>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `
  });

  const text = `Hello ${name},\n\nWelcome to ${APP_NAME}! Use the code below to verify your email:\n\nVerification Code: ${code}\n\nAlternatively, visit this link: ${verificationLink}\n\nThis code expires in 24 hours.\n\nBest regards,\nThe ${APP_NAME} Team`;

  return transporter.sendMail({ from: fromAddress, to, subject: `Verify your ${APP_NAME} account`, html, text });
}

export async function sendWelcomeEmail({ to, name }) {
  const fromAddress = process.env.SMTP_FROM || `"${APP_NAME}" <noreply@actirova.com>`;

  const html = getBaseTemplate({
    title: "Welcome to Actirova!",
    preheader: "Your account is verified and ready to go.",
    content: `
      <h2>Welcome aboard, ${name || "Learner"}!</h2>
      <p>Your email has been successfully verified. You now have full access to your <strong>${APP_NAME}</strong> account.</p>
      <p>Our AI is ready to help you master any subject with personalized courses, interactive study tools, and real-time tutoring.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.CORS_ORIGIN || process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" class="button">Go to My Dashboard</a>
      </div>

      <div class="divider"></div>
      <p><strong>Quick Start Guide:</strong></p>
      <ul>
        <li><strong>Courses:</strong> Go to 'Explore' to find trending topics or generate a custom course.</li>
        <li><strong>AI Tutor:</strong> Chat with our tutor anytime you hit a roadblock.</li>
        <li><strong>Study Tools:</strong> Use flashcards and quizzes to reinforce what you've learned.</li>
      </ul>
      <p>We're thrilled to be part of your educational journey!</p>
    `
  });

  const text = `Welcome to ${APP_NAME}, ${name}!\n\nYour account is now active. Start learning today at ${process.env.NEXTAUTH_URL}/dashboard\n\nBest regards,\nThe ${APP_NAME} Team`;

  return transporter.sendMail({ from: fromAddress, to, subject: `Welcome to ${APP_NAME}!`, html, text });
}

export async function sendPasswordResetCodeEmail({ to, name, code }) {
  const fromAddress = process.env.SMTP_FROM || `"${APP_NAME}" <noreply@actirova.com>`;

  const html = getBaseTemplate({
    title: "Reset Your Password",
    preheader: "Use this code to reset your account password.",
    content: `
      <h2>Password Reset Request</h2>
      <p>Hi ${name || "there"},</p>
      <p>We received a request to reset your <strong>${APP_NAME}</strong> password. Use the 6-digit code below to proceed:</p>
      
      <div class="code-box">
        <h3 class="code">${code}</h3>
        <p style="margin-bottom: 0; font-size: 13px; color: #9ca3af;">This code expires in 15 minutes.</p>
      </div>

      <p><strong>Security Tip:</strong> If you didn't request this reset, please ignore this email and ensure your account has a strong password.</p>
      <div class="divider"></div>
      <p>Best regards,<br/>The ${APP_NAME} Security Team</p>
    `
  });

  const text = `Hi ${name},\n\nYour password reset code is: ${code}\n\nThis code expires in 15 minutes. If you didn't request this, ignore this email.\n\n${APP_NAME}`;

  return transporter.sendMail({ from: fromAddress, to, subject: "Password Reset Code", html, text });
}

export async function sendPasswordResetEmail({ to, name, token }) {
  const resetLink = `${process.env.CORS_ORIGIN || process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;
  const fromAddress = process.env.SMTP_FROM || `"${APP_NAME}" <noreply@actirova.com>`;

  const html = getBaseTemplate({
    title: "Reset Your Password",
    preheader: "Click the link to reset your account password.",
    content: `
      <h2>Password Reset</h2>
      <p>Hi ${name || "there"},</p>
      <p>Follow the link below to create a new password for your <strong>${APP_NAME}</strong> account:</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset My Password</a>
      </div>

      <p style="font-size: 13px; color: #6b7280;">This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, you can safely ignore this email.</p>
      <div class="divider"></div>
      <p>Best regards,<br/>The ${APP_NAME} Team</p>
    `
  });

  const text = `Hi ${name},\n\nUse this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`;

  return transporter.sendMail({ from: fromAddress, to, subject: "Password Reset Request", html, text });
}

export async function sendPasswordChangeNotificationEmail({ to, name }) {
  const fromAddress = process.env.SMTP_FROM || `"${APP_NAME}" <noreply@actirova.com>`;

  const html = getBaseTemplate({
    title: "Password Changed",
    preheader: "Your account password was recently updated.",
    content: `
      <h2>Security Alert</h2>
      <p>Hi ${name || "there"},</p>
      <p>The password for your <strong>${APP_NAME}</strong> account was successfully changed on ${new Date().toLocaleString()}.</p>
      
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Didn't do this?</strong> If you didn't change your password, please contact our support team immediately or reset your password to secure your account.</p>
      </div>

      <p>If you made this change, you can ignore this email.</p>
      <div class="divider"></div>
      <p>Stay safe,<br/>The ${APP_NAME} Security Team</p>
    `
  });

  const text = `Hi ${name},\n\nYour ${APP_NAME} password was changed successfully. If you didn't do this, contact support immediately.`;

  return transporter.sendMail({ from: fromAddress, to, subject: "Your password has been updated", html, text });
}

export async function sendContactMessageEmail({ fromEmail, name, subject, message, category = "general" }) {
  const toAddress = "briankipkemoi808@gmail.com";
  const fromAddress = process.env.SMTP_FROM || `"${APP_NAME} Support" <noreply@actirova.com>`;

  const html = getBaseTemplate({
    title: "New Contact Message",
    content: `
      <h2>New Contact Form Submission</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; font-weight: 600; width: 100px;">From:</td><td style="padding: 8px 0;">${name} (${fromEmail})</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Category:</td><td style="padding: 8px 0;">${category}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Subject:</td><td style="padding: 8px 0;">${subject}</td></tr>
      </table>
      <div class="divider"></div>
      <p><strong>Message:</strong></p>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; white-space: pre-wrap;">${message}</div>
    `
  });

  return transporter.sendMail({
    from: fromAddress,
    to: toAddress,
    subject: `[Contact Form] ${category}: ${subject}`,
    html,
    text: `From: ${name} (${fromEmail})\nCategory: ${category}\nSubject: ${subject}\n\nMessage:\n${message}`,
    replyTo: fromEmail
  });
}

export async function sendUpgradeEmail({ to, name, plan, billingCycle, amount, currency, expiresAt, reference }) {
  const fromAddress = process.env.SMTP_FROM || `"${APP_NAME}" <noreply@actirova.com>`;
  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);
  const cycleDisplay = billingCycle === "yearly" ? "Annual" : "Monthly";

  const html = getBaseTemplate({
    title: "Upgrade Confirmed!",
    preheader: `Welcome to ${planDisplay}! Your premium features are now active.`,
    content: `
      <h2>You're now a ${planDisplay} member!</h2>
      <p>Hi ${name || "Learner"},</p>
      <p>Great news! Your upgrade to the <strong>${planDisplay} Plan</strong> was successful. You now have unlimited access to our most powerful features.</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h4 style="margin-top: 0; color: #166534;">Subscription Summary</h4>
        <p style="margin: 4px 0;"><strong>Plan:</strong> ${planDisplay} (${cycleDisplay})</p>
        <p style="margin: 4px 0;"><strong>Amount:</strong> ${currency} ${amount.toFixed(2)}</p>
        <p style="margin: 4px 0;"><strong>Next Renewal:</strong> ${new Date(expiresAt).toLocaleDateString()}</p>
        <p style="margin: 4px 0; font-size: 12px; color: #166534; opacity: 0.8;">Reference: ${reference}</p>
      </div>

      <p><strong>What's unlocked:</strong></p>
      <ul>
        <li>Higher limits for AI course generation</li>
        <li>Advanced AI tutoring and chat history</li>
        <li>Exclusive premium courses and study tools</li>
        <li>Priority support</li>
      </ul>

      <div style="text-align: center;">
        <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" class="button">Start Learning Premium</a>
      </div>

      <div class="divider"></div>
      <p>Thank you for supporting us. Happy learning!</p>
    `
  });

  const text = `Hi ${name},\n\nYour upgrade to ${planDisplay} (${cycleDisplay}) was successful! Amount: ${currency} ${amount}. Next renewal: ${new Date(expiresAt).toLocaleDateString()}.\n\nStart learning premium at ${process.env.NEXTAUTH_URL}/dashboard`;

  return transporter.sendMail({ from: fromAddress, to, subject: `Upgrade Confirmed: Welcome to ${planDisplay}!`, html, text });
}
