import { Resend } from "resend";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  // For development, log the reset URL and optionally send email
  if (process.env.NODE_ENV === "development") {
    console.log(`
🔐 PASSWORD RESET REQUEST
📧 Email: ${email}
🔗 Reset URL: ${resetUrl}
⏰ Valid for 15 minutes
    `);

    // If no Resend API key in development, just log and return
    if (!process.env.RESEND_API_KEY) {
      console.log(
        "💡 To send actual emails, add RESEND_API_KEY to your .env.local file"
      );
      return Promise.resolve();
    }
  }

  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }

  // Send email using Resend
  try {
    const { data, error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL || "AMP Tracker <noreply@amptracker.com>",
      to: [email],
      subject: "Reset Your AMP Tracker Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: #4f46e5; margin: 0 0 20px 0; font-size: 28px; text-align: center;">
              🔐 Password Reset Request
            </h1>
            <p style="font-size: 16px; margin-bottom: 20px; text-align: center; color: #64748b;">
              You requested a password reset for your AMP Tracker account.
            </p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <p style="font-size: 16px; margin-bottom: 25px;">
              Hi there! 👋
            </p>
            <p style="font-size: 16px; margin-bottom: 25px;">
              We received a request to reset your password for your AMP Tracker account. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; 
                        background-color: #4f46e5; 
                        color: white; 
                        padding: 14px 28px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        font-size: 16px;
                        transition: background-color 0.2s;">
                Reset My Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #4f46e5; word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
                ⏰ <strong>This link will expire in 15 minutes</strong>
              </p>
              <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">
              Best regards,<br>
              The AMP Tracker Team
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend email error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Password reset email sent successfully:", data?.id);
    return data;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}
