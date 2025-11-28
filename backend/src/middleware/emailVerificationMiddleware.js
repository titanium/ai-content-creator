// Email Verification Middleware
// Checks if user has verified their email before allowing certain actions

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

/**
 * Require email verification
 * Use this middleware on routes that require verified email
 */
exports.requireEmailVerification = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { emailVerified: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before creating content',
        requiresVerification: true,
        email: user.email
      });
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error);
    res.status(500).json({ 
      error: 'Failed to verify email status' 
    });
  }
};
