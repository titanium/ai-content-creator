// Trial Middleware
// Checks if user has active trial or subscription before allowing actions

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

/**
 * Check if user has active trial or subscription
 */
exports.checkAccess = async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId }
    });

    if (!subscription) {
      return res.status(403).json({
        error: 'No subscription found',
        needsSubscription: true
      });
    }

    // Check if subscription is active
    if (subscription.status === 'active') {
      return next();
    }

    // Check if trial is active and not expired
    if (subscription.isTrialActive) {
      const now = new Date();
      const trialEnd = new Date(subscription.trialEndDate);

      if (now <= trialEnd) {
        return next();
      } else {
        // Trial expired, update status
        await prisma.subscription.update({
          where: { userId: req.userId },
          data: {
            isTrialActive: false,
            status: 'expired'
          }
        });

        return res.status(403).json({
          error: 'Trial period has ended',
          needsSubscription: true,
          trialExpired: true
        });
      }
    }

    // No active subscription or trial
    return res.status(403).json({
      error: 'Subscription required to access this feature',
      needsSubscription: true
    });

  } catch (error) {
    console.error('Trial middleware error:', error);
    res.status(500).json({
      error: 'Failed to verify access'
    });
  }
};

/**
 * Get remaining trial days
 */
exports.getTrialInfo = async (userId) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return null;
    }

    if (!subscription.isTrialActive) {
      return {
        isTrialActive: false,
        daysRemaining: 0
      };
    }

    const now = new Date();
    const trialEnd = new Date(subscription.trialEndDate);
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

    return {
      isTrialActive: true,
      daysRemaining: Math.max(0, daysRemaining),
      trialEndDate: subscription.trialEndDate
    };

  } catch (error) {
    console.error('Get trial info error:', error);
    return null;
  }
};