// lib/email-nodemailer.js
// Email service using Nodemailer with Gmail SMTP

import nodemailer from "nodemailer";

// Create transporter with Gmail SMTP
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Beautiful HTML email templates
const getEmailVerificationTemplate = (firstName, verificationToken) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Actinova AI Tutor</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-text {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2d3748;
        }
        .verification-box {
            background: #f7fafc;
            border: 2px dashed #e2e8f0;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .verification-box h2 {
            color: #4a5568;
            margin: 0 0 15px 0;
            font-size: 20px;
        }
        .verification-box p {
            color: #718096;
            margin: 0 0 25px 0;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 0;
            color: #718096;
            font-size: 14px;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">A</div>
            <h1>Welcome to Actinova AI Tutor!</h1>
            <p>Your AI-powered learning journey starts here</p>
        </div>

        <div class="content">
            <p class="welcome-text">Hi ${firstName},</p>

            <p>Thank you for joining Actinova AI Tutor! We're excited to have you on board and help you achieve your learning goals with our advanced AI-powered tutoring system.</p>

            <div class="verification-box">
                <h2>🔐 Verify Your Email Address</h2>
                <p>To complete your registration and start learning, please enter this verification code:</p>
                <div style="background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px;">${verificationToken}</span>
                </div>
                <p style="color: #718096; font-size: 14px; margin-top: 15px;">This code will expire in 24 hours for security reasons.</p>
            </div>

            <p><strong>What's next?</strong></p>
            <ul style="color: #4a5568;">
                <li>Complete your profile setup</li>
                <li>Explore our AI-powered courses</li>
                <li>Start your personalized learning journey</li>
                <li>Track your progress with detailed analytics</li>
            </ul>

            <p>If you didn't create an account with Actinova AI Tutor, please ignore this email.</p>

            <p>Welcome aboard!</p>
            <p><strong>The Actinova AI Tutor Team</strong></p>
        </div>

        <div class="footer">
            <p>© 2024 Actinova AI Tutor. All rights reserved.</p>
            <p>This email was sent to ${firstName} because an account was created with this email address.</p>
        </div>
    </div>
</body>
</html>
`;

const getPasswordResetCodeTemplate = (firstName, resetCode) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Code - Actinova AI Tutor</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-text {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2d3748;
        }
        .reset-box {
            background: #fef5e7;
            border: 2px solid #f6ad55;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .reset-box h2 {
            color: #c05621;
            margin: 0 0 15px 0;
            font-size: 20px;
        }
        .reset-box p {
            color: #744210;
            margin: 0 0 25px 0;
            font-size: 14px;
        }
        .code-display {
            background: #f8f9fa;
            border: 2px solid #f56565;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            font-size: 32px;
            font-weight: bold;
            color: #f56565;
            letter-spacing: 4px;
        }
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 0;
            color: #718096;
            font-size: 14px;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #f56565;
        }
        .warning {
            background: #fed7d7;
            border: 1px solid #feb2b2;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #742a2a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔒</div>
            <h1>Password Reset Code</h1>
            <p>Secure your Actinova AI Tutor account</p>
        </div>

        <div class="content">
            <p class="welcome-text">Hi ${firstName},</p>

            <p>We received a request to reset your password for your Actinova AI Tutor account. If you made this request, use the code below to reset your password:</p>

            <div class="reset-box">
                <h2>🔑 Your Password Reset Code</h2>
                <p>Enter this code on the password reset page:</p>
                <div class="code-display">${resetCode}</div>
            </div>

            <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This code will expire in 15 minutes for security reasons</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Never share this code with anyone</li>
                </ul>
            </div>

            <p>If you didn't request a password reset, please contact our support team immediately.</p>

            <p>Stay secure!</p>
            <p><strong>The Actinova AI Tutor Team</strong></p>
        </div>

        <div class="footer">
            <p>© 2024 Actinova AI Tutor. All rights reserved.</p>
            <p>This email was sent to ${firstName} because a password reset was requested for this account.</p>
        </div>
    </div>
</body>
</html>
`;

const getPasswordResetTemplate = (firstName, resetLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Actinova AI Tutor</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-text {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2d3748;
        }
        .reset-box {
            background: #fef5e7;
            border: 2px solid #f6ad55;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .reset-box h2 {
            color: #c05621;
            margin: 0 0 15px 0;
            font-size: 20px;
        }
        .reset-box p {
            color: #744210;
            margin: 0 0 25px 0;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 0;
            color: #718096;
            font-size: 14px;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #f56565;
        }
        .warning {
            background: #fed7d7;
            border: 1px solid #feb2b2;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #742a2a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔒</div>
            <h1>Password Reset Request</h1>
            <p>Secure your Actinova AI Tutor account</p>
        </div>

        <div class="content">
            <p class="welcome-text">Hi ${firstName},</p>

            <p>We received a request to reset your password for your Actinova AI Tutor account. If you made this request, click the button below to reset your password:</p>

            <div class="reset-box">
                <h2>🔑 Reset Your Password</h2>
                <p>Click the button below to create a new password for your account:</p>
                <a href="${resetLink}" class="btn">Reset Password</a>
            </div>

            <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you click the link</li>
                </ul>
            </div>

            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #f56565; font-size: 14px;">${resetLink}</p>

            <p>If you didn't request a password reset, please contact our support team immediately.</p>

            <p>Stay secure!</p>
            <p><strong>The Actinova AI Tutor Team</strong></p>
        </div>

        <div class="footer">
            <p>© 2024 Actinova AI Tutor. All rights reserved.</p>
            <p>This email was sent to ${firstName} because a password reset was requested for this account.</p>
        </div>
    </div>
</body>
</html>
`;

// Email sending functions
export async function sendVerificationEmail(
  email,
  firstName,
  verificationToken
) {
  try {
    // If no SMTP config, fall back to console logging
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("\n📧 EMAIL VERIFICATION (No SMTP Config - Development Mode)");
      console.log("=====================================");
      console.log(`To: ${email}`);
      console.log(
        `Subject: 🎓 Welcome to Actinova AI Tutor - Verify Your Email`
      );
      console.log(`Hi ${firstName},`);
      console.log(
        `Welcome to Actinova AI Tutor! Please verify your email address by entering this code:`
      );
      console.log(`🔢 ${verificationToken}`);
      console.log("=====================================\n");

      return { success: true, messageId: "dev-mode-" + Date.now() };
    }

    const verificationLink = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"Actinova AI Tutor" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "🎓 Welcome to Actinova AI Tutor - Verify Your Email",
      html: getEmailVerificationTemplate(firstName, verificationToken),
      text: `Hi ${firstName},\n\nWelcome to Actinova AI Tutor! Please verify your email address by entering this code: ${verificationToken}\n\nThis code will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\nThe Actinova AI Tutor Team`,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("✅ Verification email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(email, firstName, resetToken) {
  try {
    // If no SMTP config, fall back to console logging
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("\n📧 PASSWORD RESET EMAIL (No SMTP Config - Development Mode)");
      console.log("=====================================");
      console.log(`To: ${email}`);
      console.log(`Subject: 🔒 Password Reset Request - Actinova AI Tutor`);
      console.log(`Hi ${firstName},`);
      console.log(
        `We received a request to reset your password. Click this link to reset:`
      );
      const resetLink = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/reset-password?token=${resetToken}`;
      console.log(`🔗 ${resetLink}`);
      console.log(`This link expires in 1 hour.`);
      console.log("=====================================\n");

      return { success: true, messageId: "dev-mode-" + Date.now() };
    }

    const resetLink = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Actinova AI Tutor" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "🔒 Password Reset Request - Actinova AI Tutor",
      html: getPasswordResetTemplate(firstName, resetLink),
      text: `Hi ${firstName},\n\nWe received a request to reset your password. Click this link to reset: ${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Actinova AI Tutor Team`,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("✅ Password reset email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetCodeEmail(email, firstName, resetCode) {
  try {
    // If no SMTP config, fall back to console logging
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("\n📧 PASSWORD RESET CODE EMAIL (No SMTP Config - Development Mode)");
      console.log("=====================================");
      console.log(`To: ${email}`);
      console.log(`Subject: 🔒 Password Reset Code - Actinova AI Tutor`);
      console.log(`Hi ${firstName},`);
      console.log(
        `We received a request to reset your password. Use this code to reset:`
      );
      console.log(`🔢 ${resetCode}`);
      console.log(`This code expires in 15 minutes.`);
      console.log("=====================================\n");

      return { success: true, messageId: "dev-mode-" + Date.now() };
    }

    const mailOptions = {
      from: `"Actinova AI Tutor" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "🔒 Password Reset Code - Actinova AI Tutor",
      html: getPasswordResetCodeTemplate(firstName, resetCode),
      text: `Hi ${firstName},\n\nWe received a request to reset your password. Use this code to reset: ${resetCode}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Actinova AI Tutor Team`,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("✅ Password reset code email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Failed to send password reset code email:", error);
    return { success: false, error: error.message };
  }
}

export async function testEmailConnection() {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("✅ Email service is ready (development mode - no SMTP config)");
      return { success: true };
    }

    // Test SMTP connection
    await transporter.verify();

    console.log("✅ Nodemailer email service is ready");
    return { success: true };
  } catch (error) {
    console.error("❌ Email service test failed:", error);
    return { success: false, error: error.message };
  }
}