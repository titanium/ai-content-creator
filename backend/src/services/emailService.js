// Email Service
// Handles all email sending functionality using Resend

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@notifications.postmaker.org';
const APP_URL = process.env.APP_URL || 'https://ai-content-creator-puce.vercel.app';

/**
 * Send email verification
 */
exports.sendVerificationEmail = async (email, firstName, verificationToken) => {
  const verificationUrl = `https://app.postmaker.org/verify-email?token=${verificationToken}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Post Maker AI - Verify your email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 40px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #4F46E5;
              margin-bottom: 30px;
            }
            h1 {
              color: #1F2937;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background-color: #4F46E5;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              font-size: 14px;
              color: #6B7280;
            }
            .warning {
              background: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 12px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Post Maker AI</div>
            
            <h1>Welcome, ${firstName}! 👋</h1>
            
            <p>Thanks for signing up for Post Maker AI! We're excited to have you on board.</p>
            
            <p>Before you can start creating amazing AI-powered content, please verify your email address by clicking the button below:</p>
            
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5; font-size: 14px;">${verificationUrl}</p>
            
            <div class="warning">
              <strong>⏰ This link expires in 24 hours</strong><br><br>
              If you didn't create an account with Post Maker AI, you can safely ignore this email.
            </div>
            
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Verify your email</li>
              <li>Start your 15-day free trial</li>
              <li>Generate unlimited AI content</li>
              <li>No credit card required</li>
            </ul>
            
            <div class="footer">
              <p>Need help? Reply to this email or visit our <a href="${APP_URL}/contact">support page</a>.</p>
              <p>Post Maker AI<br>
              Building the future of content creation</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error };
    }

    console.log('Verification email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send trial expiring soon email (5 days before)
 */
exports.sendTrialExpiringSoonEmail = async (email, firstName, daysRemaining) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Post Maker AI - Your trial expires in ${daysRemaining} days`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 40px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #4F46E5;
              margin-bottom: 30px;
            }
            h1 {
              color: #1F2937;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .alert {
              background: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .stats {
              background: #F3F4F6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .stat-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #E5E7EB;
            }
            .stat-item:last-child {
              border-bottom: none;
            }
            .button {
              display: inline-block;
              background-color: #4F46E5;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .price {
              text-align: center;
              margin: 30px 0;
            }
            .price-amount {
              font-size: 48px;
              font-weight: bold;
              color: #4F46E5;
            }
            .price-period {
              color: #6B7280;
              font-size: 18px;
            }
            .features {
              background: #F9FAFB;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .feature {
              padding: 8px 0;
              display: flex;
              align-items: center;
            }
            .feature:before {
              content: "✓";
              color: #10B981;
              font-weight: bold;
              margin-right: 10px;
              font-size: 18px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              font-size: 14px;
              color: #6B7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Post Maker AI</div>
            
            <h1>Hi ${firstName},</h1>
            
            <div class="alert">
              <strong>⏰ Your free trial expires in ${daysRemaining} days</strong><br><br>
              Don't lose access to unlimited AI-powered content creation!
            </div>
            
            <p>We hope you've been enjoying Post Maker AI! Your 15-day free trial will end soon, and we wanted to give you a heads up.</p>
            
            <div class="price">
              <div class="price-amount">$29</div>
              <div class="price-period">per month</div>
            </div>
            
            <div class="features">
              <strong style="display: block; margin-bottom: 12px;">Continue enjoying:</strong>
              <div class="feature">Unlimited AI-generated content</div>
              <div class="feature">Blog posts, X/Threads, LinkedIn posts</div>
              <div class="feature">SEO-optimized output</div>
              <div class="feature">Content history & analytics</div>
              <div class="feature">Priority support</div>
              <div class="feature">Cancel anytime</div>
            </div>
            
            <center>
              <a href="${APP_URL}/?upgrade=true" class="button">Upgrade to Pro Now</a>
            </center>
            
            <p style="text-align: center; color: #6B7280; margin-top: 20px;">
              Keep all the content you've created during your trial, even if you don't upgrade.
            </p>
            
            <div class="footer">
              <p>Questions? We're here to help! Reply to this email or visit our <a href="${APP_URL}/contact">support page</a>.</p>
              <p>Don't want to upgrade? You can continue using the free features after your trial ends.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending trial expiring email:', error);
      return { success: false, error };
    }

    console.log('Trial expiring email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending trial expiring email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send trial expired email
 */
exports.sendTrialExpiredEmail = async (email, firstName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your Post Maker AI trial has ended - Upgrade to continue creating',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 40px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #4F46E5;
              margin-bottom: 30px;
            }
            h1 {
              color: #1F2937;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .alert {
              background: #FEE2E2;
              border-left: 4px solid #EF4444;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              background-color: #4F46E5;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .price {
              text-align: center;
              margin: 30px 0;
            }
            .price-amount {
              font-size: 48px;
              font-weight: bold;
              color: #4F46E5;
            }
            .price-period {
              color: #6B7280;
              font-size: 18px;
            }
            .features {
              background: #F9FAFB;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .feature {
              padding: 8px 0;
              display: flex;
              align-items: center;
            }
            .feature:before {
              content: "✓";
              color: #10B981;
              font-weight: bold;
              margin-right: 10px;
              font-size: 18px;
            }
            .highlight {
              background: #FEF3C7;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              font-size: 14px;
              color: #6B7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Post Maker AI</div>
            
            <h1>Hi ${firstName},</h1>
            
            <div class="alert">
              <strong>⏰ Your free trial has ended</strong><br><br
              Upgrade now to continue creating unlimited AI-powered content.
            </div>
            
            <p>We hope you enjoyed your 15-day trial of Post Maker AI! Your trial has now ended, but you can upgrade to Pro and continue creating amazing content.</p>
            
            <div class="price">
              <div class="price-amount">$29</div>
              <div class="price-period">per month • Cancel anytime</div>
            </div>
            
            <div class="features">
              <strong style="display: block; margin-bottom: 12px;">Upgrade to Pro and get:</strong>
              <div class="feature">Unlimited AI-generated content</div>
              <div class="feature">All content types (Blog, X/Threads, LinkedIn)</div>
              <div class="feature">SEO-optimized output</div>
              <div class="feature">Content history & search</div>
              <div class="feature">Usage analytics</div>
              <div class="feature">Priority support</div>
            </div>
            
            <div class="highlight">
              <strong>🎁 Special Offer:</strong> Upgrade today and get your first month for <strong>$19</strong> (save $10)!
            </div>
            
            <center>
              <a href="${APP_URL}/?upgrade=true" class="button">Upgrade to Pro Now</a>
            </center>
            
            <p style="text-align: center; color: #6B7280; margin-top: 20px;">
              <strong>Good news!</strong> All the content you created during your trial is still yours to keep.
            </p>
            
            <div class="footer">
              <p>Have questions? We're here to help! Reply to this email or visit our <a href="${APP_URL}/contact">support page</a>.</p>
              <p><strong>Money-back guarantee:</strong> If you're not satisfied within 30 days, we'll refund you in full.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending trial expired email:', error);
      return { success: false, error };
    }

    console.log('Trial expired email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending trial expired email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Resend verification email
 */
exports.resendVerificationEmail = async (email, firstName, verificationToken) => {
  return exports.sendVerificationEmail(email, firstName, verificationToken);
};
