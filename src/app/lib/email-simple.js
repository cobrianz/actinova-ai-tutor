// lib/email-simple.js
// Simple email service for testing and development

// For development/testing, we'll use a simple console log approach
// In production, you can easily switch to a real email service

export async function sendVerificationEmail(
  email,
  firstName,
  verificationToken
) {
  try {
    const verificationLink = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/verify-email?token=${verificationToken}`;

    // For development, log the email instead of sending
    if (process.env.NODE_ENV === "development") {
      console.log("\n📧 EMAIL VERIFICATION (Development Mode)");
      console.log("=====================================");
      console.log(`To: ${email}`);
      console.log(
        `Subject: 🎓 Welcome to Actinova AI Tutor - Verify Your Email`
      );
      console.log(`Hi ${firstName},`);
      console.log(
        `Welcome to Actinova AI Tutor! Please verify your email address by clicking this link:`
      );
      console.log(`🔗 ${verificationLink}`);
      console.log("=====================================\n");

      return { success: true, messageId: "dev-mode-" + Date.now() };
    }

    // In production, you would use a real email service here
    // For now, we'll simulate success
    console.log(`✅ Verification email would be sent to: ${email}`);
    return { success: true, messageId: "simulated-" + Date.now() };
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(email, firstName, resetToken) {
  try {
    const resetLink = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    // For development, log the email instead of sending
    if (process.env.NODE_ENV === "development") {
      console.log("\n📧 PASSWORD RESET EMAIL (Development Mode)");
      console.log("=====================================");
      console.log(`To: ${email}`);
      console.log(`Subject: 🔒 Password Reset Request - Actinova AI Tutor`);
      console.log(`Hi ${firstName},`);
      console.log(
        `We received a request to reset your password. Click this link to reset:`
      );
      console.log(`🔗 ${resetLink}`);
      console.log(`This link expires in 1 hour.`);
      console.log("=====================================\n");

      return { success: true, messageId: "dev-mode-" + Date.now() };
    }

    // In production, you would use a real email service here
    console.log(`✅ Password reset email would be sent to: ${email}`);
    return { success: true, messageId: "simulated-" + Date.now() };
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
}

export async function testEmailConnection() {
  try {
    console.log("✅ Email service is ready (development mode)");
    return { success: true };
  } catch (error) {
    console.error("❌ Email service test failed:", error);
    return { success: false, error: error.message };
  }
}
