// Email Cron Service
// Handles scheduled email tasks (trial reminders)

const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

/**
 * Send trial expiring soon emails (5 days before expiry)
 * Run this daily
 */
exports.sendTrialExpiringEmails = async () => {
  try {
    console.log('Running trial expiring email job...');

    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

    // Find users whose trial ends in 5 days and haven't received reminder
    const subscriptions = await prisma.subscription.findMany({
      where: {
        isTrialActive: true,
        status: 'trial',
        trialReminderSent: false,
        trialEndDate: {
          gte: fiveDaysFromNow,
          lte: sixDaysFromNow
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            emailVerified: true
          }
        }
      }
    });

    console.log(`Found ${subscriptions.length} users to send trial expiring emails`);

    let sentCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions) {
      // Only send to verified users
      if (!subscription.user.emailVerified) {
        continue;
      }

      const daysRemaining = Math.ceil(
        (new Date(subscription.trialEndDate) - now) / (1000 * 60 * 60 * 24)
      );

      // Send email
      const result = await emailService.sendTrialExpiringSoonEmail(
        subscription.user.email,
        subscription.user.firstName,
        daysRemaining
      );

      if (result.success) {
        // Mark as sent
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { trialReminderSent: true }
        });
        sentCount++;
        console.log(`✓ Sent trial expiring email to ${subscription.user.email}`);
      } else {
        errorCount++;
        console.error(`✗ Failed to send email to ${subscription.user.email}:`, result.error);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Trial expiring email job complete: ${sentCount} sent, ${errorCount} errors`);
    return { sent: sentCount, errors: errorCount };

  } catch (error) {
    console.error('Error in trial expiring email job:', error);
    throw error;
  }
};

/**
 * Send trial expired emails (on expiry day)
 * Run this daily
 */
exports.sendTrialExpiredEmails = async () => {
  try {
    console.log('Running trial expired email job...');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find users whose trial ended in the last 24 hours and haven't received expired email
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'trial',
        trialExpiredEmailSent: false,
        trialEndDate: {
          lte: now,
          gte: yesterday
        },
        // Don't have active paid subscription
        stripeSubscriptionId: null
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            emailVerified: true
          }
        }
      }
    });

    console.log(`Found ${subscriptions.length} users to send trial expired emails`);

    let sentCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions) {
      // Only send to verified users
      if (!subscription.user.emailVerified) {
        continue;
      }

      // Send email
      const result = await emailService.sendTrialExpiredEmail(
        subscription.user.email,
        subscription.user.firstName
      );

      if (result.success) {
        // Mark as sent and update subscription status
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { 
            trialExpiredEmailSent: true,
            isTrialActive: false,
            status: 'expired'
          }
        });
        sentCount++;
        console.log(`✓ Sent trial expired email to ${subscription.user.email}`);
      } else {
        errorCount++;
        console.error(`✗ Failed to send email to ${subscription.user.email}:`, result.error);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Trial expired email job complete: ${sentCount} sent, ${errorCount} errors`);
    return { sent: sentCount, errors: errorCount };

  } catch (error) {
    console.error('Error in trial expired email job:', error);
    throw error;
  }
};

/**
 * Run all email jobs
 * Call this from your cron scheduler
 */
exports.runAllEmailJobs = async () => {
  console.log('=== Starting Email Cron Jobs ===');
  
  try {
    const results = await Promise.all([
      exports.sendTrialExpiringEmails(),
      exports.sendTrialExpiredEmails()
    ]);

    console.log('=== Email Cron Jobs Complete ===');
    return {
      trialExpiring: results[0],
      trialExpired: results[1]
    };
  } catch (error) {
    console.error('Error running email jobs:', error);
    throw error;
  }
};
