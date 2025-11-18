// Content Controller
// Handles AI content generation and content history management

const { PrismaClient } = require('@prisma/client');
const { generateContent } = require('../services/anthropicService');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Map content types to database format
const CONTENT_TYPE_MAP = {
  'Blog Post': 'blog',
  'X/Threads Post': 'x_threads',
  'LinkedIn Post': 'linkedin'
};

// GENERATE CONTENT - Create AI-generated content
exports.generateContent = async (req, res) => {
  try {
    const { contentType, topic, keywords } = req.body;

    // Validation
    if (!contentType || !topic) {
      return res.status(400).json({ 
        error: 'Content type and topic are required' 
      });
    }

    // Check if user has active subscription or trial
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId }
    });

    if (!subscription) {
      return res.status(403).json({ 
        error: 'No subscription found' 
      });
    }

    // Check if trial has expired and no active subscription
    const now = new Date();
    const trialExpired = subscription.isTrialActive && 
                         now > new Date(subscription.trialEndDate);
    
    if (trialExpired && subscription.status !== 'active') {
      return res.status(403).json({ 
        error: 'Trial expired. Please subscribe to continue.',
        needsSubscription: true
      });
    }

    // Generate content using AI
    const generatedText = await generateContent({
      contentType,
      topic,
      keywords
    });

    // Count words
    const wordCount = generatedText.trim().split(/\s+/).length;

    // Save to database
    const content = await prisma.content.create({
      data: {
        userId: req.userId,
        contentType: CONTENT_TYPE_MAP[contentType] || 'blog',
        topic,
        keywords: keywords || null,
        generatedContent: generatedText,
        wordCount
      }
    });

    res.json({
      message: 'Content generated successfully',
      content: {
        id: content.id,
        contentType: contentType,
        generatedContent: generatedText,
        wordCount,
        createdAt: content.createdAt
      }
    });

  } catch (error) {
    console.error('Generate content error:', error);
    
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        error: 'AI service configuration error' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate content' 
    });
  }
};

// GET CONTENT HISTORY - Retrieve user's generated content
exports.getContentHistory = async (req, res) => {
  try {
    const { limit = 20, offset = 0, contentType } = req.query;

    const where = {
      userId: req.userId,
      ...(contentType && { contentType })
    };

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
          id: true,
          contentType: true,
          topic: true,
          keywords: true,
          wordCount: true,
          createdAt: true
        }
      }),
      prisma.content.count({ where })
    ]);

    res.json({
      content,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get content history error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content history' 
    });
  }
};

// GET SINGLE CONTENT - Retrieve specific content by ID
exports.getContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findFirst({
      where: {
        id,
        userId: req.userId // Ensure user owns this content
      }
    });

    if (!content) {
      return res.status(404).json({ 
        error: 'Content not found' 
      });
    }

    res.json({ content });

  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content' 
    });
  }
};

// DELETE CONTENT - Remove content by ID
exports.deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if content exists and belongs to user
    const content = await prisma.content.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!content) {
      return res.status(404).json({ 
        error: 'Content not found' 
      });
    }

    // Delete content
    await prisma.content.delete({
      where: { id }
    });

    res.json({ 
      message: 'Content deleted successfully' 
    });

  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ 
      error: 'Failed to delete content' 
    });
  }
};

// GET CONTENT STATS - Get user's content statistics
exports.getContentStats = async (req, res) => {
  try {
    const stats = await prisma.content.groupBy({
      by: ['contentType'],
      where: { userId: req.userId },
      _count: true,
      _sum: {
        wordCount: true
      }
    });

    const totalContent = await prisma.content.count({
      where: { userId: req.userId }
    });

    res.json({
      totalContent,
      byType: stats.map(stat => ({
        type: stat.contentType,
        count: stat._count,
        totalWords: stat._sum.wordCount || 0
      }))
    });

  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content statistics' 
    });
  }
};