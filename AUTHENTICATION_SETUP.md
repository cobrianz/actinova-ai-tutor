# Authentication System Setup Guide

This document provides a comprehensive guide for setting up and using the authentication system in your Actinova AI Tutor application.

## Features

- ✅ JWT-based authentication with access and refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Email verification system
- ✅ Password reset functionality
- ✅ Account lockout after failed login attempts
- ✅ Role-based access control (student, instructor, admin)
- ✅ Rate limiting for API endpoints
- ✅ CORS protection
- ✅ Input validation with Zod
- ✅ MongoDB integration with Mongoose
- ✅ Secure cookie management
- ✅ Auto token refresh
- ✅ Comprehensive error handling

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/actinova-ai-tutor
# For production, use: mongodb+srv://username:password@cluster.mongodb.net/actinova-ai-tutor

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production

# Environment
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Password Reset
PASSWORD_RESET_EXPIRES_IN=1h

# Email Configuration (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Installation

1. Install required dependencies:

```bash
npm install jsonwebtoken bcryptjs mongoose zod
```

2. Make sure MongoDB is running locally or configure your MongoDB Atlas connection.

3. Copy the environment variables from `.env.example` to `.env.local` and update the values.

## API Endpoints

### Authentication Endpoints

#### POST `/api/signup`

Register a new user account.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "student",
  "acceptTerms": true
}
```

**Response:**

```json
{
  "message": "Account created successfully. Please check your email to verify your account.",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "student",
    "status": "pending"
  },
  "requiresVerification": true
}
```

#### POST `/api/login`

Authenticate user and return tokens.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "student",
    "status": "active"
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST `/api/logout`

Logout user and invalidate tokens.

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

#### GET `/api/me`

Get current user information.

**Response:**

```json
{
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "student",
    "status": "active"
  }
}
```

#### POST `/api/refresh`

Refresh access token using refresh token.

**Response:**

```json
{
  "message": "Tokens refreshed successfully",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "student",
    "status": "active"
  },
  "tokens": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

### Password Reset Endpoints

#### POST `/api/forgot-password`

Send password reset email.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### POST `/api/reset-password`

Reset password using token.

**Request Body:**

```json
{
  "token": "reset_token",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Response:**

```json
{
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

### Email Verification

#### POST `/api/verify-email`

Verify email address using token.

**Request Body:**

```json
{
  "token": "verification_token"
}
```

**Response:**

```json
{
  "message": "Email verified successfully. Your account is now active.",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "status": "active"
  }
}
```

### Protected Routes

#### GET/POST `/api/protected`

Example protected route that requires authentication.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "This is a protected route",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "role": "student",
    "status": "active"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Frontend Usage

### AuthProvider Setup

Wrap your app with the AuthProvider:

```jsx
// app/layout.js
import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Using Authentication in Components

```jsx
// components/LoginForm.jsx
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

export default function LoginForm() {
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);

    if (result.success) {
      // Redirect to dashboard or show success message
      console.log("Login successful:", result.user);
    } else {
      // Show error message
      console.error("Login failed:", result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />
      <label>
        <input
          type="checkbox"
          checked={formData.rememberMe}
          onChange={(e) =>
            setFormData({ ...formData, rememberMe: e.target.checked })
          }
        />
        Remember me
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### Protected Route Component

```jsx
// components/ProtectedRoute.jsx
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    } else if (!loading && user && requiredRole && user.role !== requiredRole) {
      router.push("/unauthorized");
    }
  }, [user, loading, router, requiredRole]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>Unauthorized</div>;
  }

  return children;
}
```

## Security Features

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Account Lockout

- Account locks after 5 failed login attempts
- Lock duration: 2 hours
- Automatic unlock after lock duration expires

### Rate Limiting

- Signup: 5 attempts per 15 minutes
- Login: 10 attempts per 15 minutes
- Password reset: 3 attempts per 15 minutes
- General API: 100 requests per 15 minutes

### Token Security

- Access tokens expire in 1 hour (or 30 days with "remember me")
- Refresh tokens expire in 30 days
- Tokens are stored in httpOnly cookies
- Automatic token refresh every 15 minutes

## Database Schema

### User Model

```javascript
{
  firstName: String (required, 2-50 chars),
  lastName: String (required, 2-50 chars),
  email: String (required, unique, validated),
  password: String (required, hashed),
  role: String (enum: student, instructor, admin),
  status: String (enum: active, inactive, suspended, pending),
  emailVerified: Boolean (default: false),
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: Date (expires: 30 days)
  }],
  lastLogin: Date,
  loginAttempts: Number (default: 0),
  lockUntil: Date,
  profile: {
    avatar: String,
    bio: String (max: 500 chars),
    preferences: {
      theme: String (enum: light, dark, auto),
      notifications: {
        email: Boolean,
        push: Boolean
      }
    }
  },
  achievements: [ObjectId],
  courses: [{
    courseId: ObjectId,
    progress: Number (0-100),
    completed: Boolean,
    enrolledAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The system provides comprehensive error handling with appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials, expired tokens)
- `403` - Forbidden (insufficient permissions, inactive account)
- `404` - Not Found (user not found)
- `409` - Conflict (email already exists)
- `423` - Locked (account temporarily locked)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Testing

To test the authentication system:

1. Start your development server:

```bash
npm run dev
```

2. Test the signup endpoint:

```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "acceptTerms": true
  }'
```

3. Test the login endpoint:

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

## Production Considerations

1. **Environment Variables**: Use strong, unique secrets for JWT_SECRET and NEXTAUTH_SECRET
2. **Database**: Use MongoDB Atlas or a secure MongoDB instance
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure CORS origins properly for your domain
5. **Rate Limiting**: Adjust rate limits based on your application needs
6. **Email Service**: Implement actual email sending for verification and password reset
7. **Monitoring**: Add logging and monitoring for security events
8. **Backup**: Regular database backups
9. **Updates**: Keep dependencies updated for security patches

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Check if MongoDB is running
   - Verify MONGODB_URI in .env.local
   - Ensure network connectivity

2. **JWT Secret Error**

   - Make sure JWT_SECRET is set in .env.local
   - Use a strong, random secret

3. **CORS Issues**

   - Check CORS_ORIGIN in .env.local
   - Ensure frontend URL matches CORS configuration

4. **Token Expired**

   - Check token expiration settings
   - Implement proper token refresh logic

5. **Rate Limit Exceeded**
   - Wait for the rate limit window to reset
   - Adjust rate limit settings if needed

For more help, check the console logs and ensure all environment variables are properly configured.
