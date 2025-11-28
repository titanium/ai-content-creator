// Admin Controller
// Handles admin dashboard operations

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// GET ALL USERS - List all users with filtering and sorting
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      search, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    // Build where clause for filtering
    const where = {};
    
    // Search by email, firstName, or lastName
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by subscription status
    if (status && status !== 'all') {
      where.subscription = {
        status: status
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          subscription: true,
          _count: {
            select: { content: true }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take
      }),
      prisma.user.count({ where })
    ]);

    // Format user data
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      subscription: {
        status: user.subscription?.status || 'none',
        isTrialActive: user.subscription?.isTrialActive || false,
        trialEndDate: user.subscription?.trialEndDate,
        stripeCustomerId: user.subscription?.stripeCustomerId,
        hasStripeSubscription: !!user.subscription?.stripeSubscriptionId
      },
      contentCount: user._count.content
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users' 
    });
  }
};

// GET USER DETAILS - Get detailed information about a specific user
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        content: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Get last 10 pieces of content
        }
      }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Get content statistics
    const contentStats = await prisma.content.groupBy({
      by: ['contentType'],
      where: { userId },
      _count: true,
      _sum: {
        wordCount: true
      }
    });

    // Calculate trial days remaining
    let trialDaysRemaining = 0;
    if (user.subscription?.isTrialActive) {
      const now = new Date();
      const trialEnd = new Date(user.subscription.trialEndDate);
      trialDaysRemaining = Math.max(
        0, 
        Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
      );
    }

    // Format response
    const userDetails = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      subscription: {
        status: user.subscription?.status || 'none',
        isTrialActive: user.subscription?.isTrialActive || false,
        trialEndDate: user.subscription?.trialEndDate,
        trialDaysRemaining,
        stripeCustomerId: user.subscription?.stripeCustomerId,
        stripeSubscriptionId: user.subscription?.stripeSubscriptionId,
        stripePriceId: user.subscription?.stripePriceId,
        stripeCurrentPeriodEnd: user.subscription?.stripeCurrentPeriodEnd
      },
      contentStats: {
        total: contentStats.reduce((sum, stat) => sum + stat._count, 0),
        byType: contentStats.map(stat => ({
          type: stat.contentType,
          count: stat._count,
          totalWords: stat._sum.wordCount || 0
        }))
      },
      recentContent: user.content.map(c => ({
        id: c.id,
        contentType: c.contentType,
        topic: c.topic,
        wordCount: c.wordCount,
        createdAt: c.createdAt
      }))
    };

    res.json({ user: userDetails });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user details' 
    });
  }
};

// GET ADMIN STATS - Get overall platform statistics
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeSubscriptions,
      trialUsers,
      totalContent,
      usersLast30Days
    ] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({
        where: { status: 'active' }
      }),
      prisma.subscription.count({
        where: { 
          isTrialActive: true,
          trialEndDate: { gt: new Date() }
        }
      }),
      prisma.content.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Get content created in last 30 days
    const contentLast30Days = await prisma.content.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get revenue estimate (active subscriptions * $29)
    const monthlyRevenue = activeSubscriptions * 29; // Adjust based on your pricing

    res.json({
      totalUsers,
      activeSubscriptions,
      trialUsers,
      totalContent,
      usersLast30Days,
      contentLast30Days,
      monthlyRevenue
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin statistics' 
    });
  }
};

// GET USER CONTENT - Get all content for a specific user
exports.getUserContent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [content, totalCount] = await Promise.all([
      prisma.content.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.content.count({ where: { userId } })
    ]);

    res.json({
      content,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get user content error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user content' 
    });
  }
};
