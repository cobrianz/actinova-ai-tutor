# 📧 Email Setup Guide for Actinova AI Tutor

This guide will help you set up email functionality for your Actinova AI Tutor application. You have multiple options for sending emails.

## 🚀 Quick Start (Development Mode)

**For immediate testing, no setup required!** The application will automatically log emails to the console in development mode.

### Test the Email Flow:

1. Start your development server: `npm run dev`
2. Go to `/auth/signup` and create a new account
3. Check your terminal/console for the verification email
4. Copy the verification link and test the flow

## 📬 Production Email Setup Options

### Option 1: Resend (Recommended - Easiest Setup)

Resend is a modern email API that's easy to set up and has great deliverability.

#### Setup Steps:

1. **Sign up for Resend**: Go to [resend.com](https://resend.com) and create an account
2. **Get your API key**: In your Resend dashboard, go to API Keys and create a new key
3. **Add to environment variables**: Add this to your `.env.local`:

```env
RESEND_API_KEY=re_your_api_key_here
NEXTAUTH_URL=http://localhost:3000
```

4. **Verify domain (optional)**: For production, verify your domain in Resend dashboard
5. **Update sender email**: Change the sender email in `src/app/lib/email-resend.js`:

```javascript
from: 'Actinova AI Tutor <noreply@yourdomain.com>',
```

#### Benefits:

- ✅ Easy setup (just an API key)
- ✅ Great deliverability
- ✅ Beautiful email templates
- ✅ Built-in analytics
- ✅ Free tier available

### Option 2: Gmail SMTP

If you prefer using Gmail for sending emails.

#### Setup Steps:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Add to environment variables**:

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
NEXTAUTH_URL=http://localhost:3000
```

4. **Switch email service**: Change the import in your API files:

```javascript
// In src/app/api/signup/route.js and src/app/api/forgot-password/route.js
import { sendVerificationEmail } from "@/lib/email"; // Use nodemailer version
```

#### Benefits:

- ✅ Free
- ✅ Uses your existing Gmail account
- ✅ Reliable delivery

### Option 3: Other Email Services

You can also use other services like SendGrid, Mailgun, or AWS SES by modifying the email service files.

## 🧪 Testing Email Functionality

### Test Signup Flow:

1. Start your server: `npm run dev`
2. Go to `http://localhost:3000/auth/signup`
3. Fill out the signup form
4. Check your console for the verification email
5. Click the verification link to test the flow

### Test Forgot Password:

1. Go to `http://localhost:3000/auth/forgot-password`
2. Enter an email address
3. Check your console for the reset email
4. Click the reset link to test the flow

## 📋 Email Templates

The application includes beautiful, responsive email templates for:

- **Welcome/Verification Email**: Sent when users sign up
- **Password Reset Email**: Sent when users request password reset

### Customizing Templates:

Edit the HTML templates in `src/app/lib/email-resend.js`:

- `getEmailVerificationTemplate()` - Welcome email template
- `getPasswordResetTemplate()` - Password reset template

## 🔧 Troubleshooting

### Common Issues:

1. **"Missing API key" error**:

   - Make sure you've added `RESEND_API_KEY` to your `.env.local`
   - Restart your development server after adding environment variables

2. **Emails not sending**:

   - Check your console for error messages
   - Verify your API key is correct
   - Check your domain verification status (for Resend)

3. **Emails going to spam**:

   - Verify your domain with your email service
   - Use a professional sender email address
   - Avoid spam trigger words in subject lines

4. **Development mode emails**:
   - In development, emails are logged to console instead of sent
   - This is normal behavior when no API key is configured

### Debug Mode:

To see detailed email information, check your server console. All email attempts are logged with:

- Recipient email
- Subject line
- Verification/reset links
- Success/error status

## 🚀 Production Deployment

### For Production:

1. **Set up a proper email service** (Resend recommended)
2. **Verify your domain** with the email service
3. **Update sender email** to use your domain
4. **Set up monitoring** for email delivery
5. **Test thoroughly** before going live

### Environment Variables for Production:

```env
RESEND_API_KEY=re_your_production_api_key
NEXTAUTH_URL=https://yourdomain.com
```

## 📊 Email Analytics

With Resend, you get built-in analytics:

- Delivery rates
- Open rates
- Click rates
- Bounce tracking

Access these in your Resend dashboard.

## 🔒 Security Considerations

- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Rotate API keys** regularly
- **Monitor email usage** for unusual activity
- **Set up rate limiting** on email endpoints

## 📞 Support

If you need help setting up email functionality:

1. Check the console logs for error messages
2. Verify your environment variables
3. Test with the development mode first
4. Check your email service dashboard for delivery status

---

**Happy emailing! 📧✨**
