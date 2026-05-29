/**
 * HTML Email Templates for Momentia OTP verification and password reset,
 * styled to match the login/registration page design system.
 */

const getOtpTemplate = (otp, type = "verification") => {
  const isReset = type === "reset";
  const title = isReset ? "Reset Your Password" : "Verify Your Email Address";
  const badgeText = isReset ? "Security Verification" : "Verification Code";
  const description = isReset
    ? "We received a request to reset your Momentia password. Enter the verification code below on the password reset page to choose a new password."
    : "Welcome to Momentia! To complete your registration and start capturing your moments, please enter the verification code below on the signup page.";
  const subject = isReset ? "Momentia - Reset Password OTP" : "Momentia - Email Verification OTP";

  return {
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Momentia - ${isReset ? "Reset Password" : "OTP Verification"}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(79, 70, 229, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner (Matches the login page's left panel gradient) -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <!-- Logo Container -->
              <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 20px auto;">
                <tr>
                  <td style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.1); border: 1.5px solid rgba(255, 255, 255, 0.2); border-radius: 14px; text-align: center; vertical-align: middle;">
                    <span style="font-family: 'Inter', sans-serif; font-size: 24px; font-weight: bold; color: #ffffff; line-height: 48px; display: block;">M</span>
                  </td>
                  <td style="padding-left: 12px; vertical-align: middle; text-align: left;">
                    <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; font-family: 'Inter', sans-serif;">Momentia</span>
                  </td>
                </tr>
              </table>
              
              <!-- Subtle badge -->
              <div style="display: inline-block; padding: 6px 14px; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; margin-top: 10px;">
                <span style="display: inline-block; width: 6px; height: 6px; background-color: #a78bfa; border-radius: 50%; margin-right: 6px; vertical-align: middle;"></span>
                <span style="font-size: 10px; color: #ffffff; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; vertical-align: middle; font-family: 'Inter', sans-serif;">${badgeText}</span>
              </div>
            </td>
          </tr>
          
          <!-- Email Content Body -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #0f172a; font-weight: 800; text-align: center; font-family: 'Inter', sans-serif;">${title}</h2>
              
              <p style="margin: 0 0 30px 0; font-size: 14px; color: #64748b; line-height: 1.6; text-align: center; font-family: 'Inter', sans-serif;">
                ${description}
              </p>
              
              <!-- OTP Display Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #f5f3ff; border: 1.5px solid #4f46e5; border-radius: 16px; padding: 18px 36px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.05);">
                      <span style="font-size: 32px; font-weight: 800; color: #4f46e5; letter-spacing: 6px; font-family: monospace;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; font-family: 'Inter', sans-serif;">
                This code is valid for <strong>5 minutes</strong>. If you did not request this email, you can safely ignore it.
              </p>
              
              <div style="height: 1px; background-color: #e2e8f0; margin: 30px 0;"></div>
              
              <!-- Footer info -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="font-size: 11px; color: #94a3b8; line-height: 1.5; font-family: 'Inter', sans-serif;">
                    &copy; 2026 Momentia. Share your world.<br>
                    This is an automated system message. Please do not reply.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
  };
};

module.exports = {
  getOtpTemplate
};
