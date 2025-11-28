// Email Cron Routes
// Endpoints for running email cron jobs (call from Railway cron or external scheduler)

const express = require('express');
const router = express.Router();
const emailCronService = require('../services/emailCronService');

// Middleware to verify cron secret (prevents unauthorized access)
const verifyCronSecret = (req, res, next) => {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Run all email jobs
router.post('/run', verifyCronSecret, async (req, res) => {
  try {
    const results = await emailCronService.runAllEmailJobs();
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({
      error: 'Failed to run email jobs',
      message: error.message
    });
  }
});

// Run only trial expiring emails
router.post('/trial-expiring', verifyCronSecret, async (req, res) => {
  try {
    const result = await emailCronService.sendTrialExpiringEmails();
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Trial expiring email job error:', error);
    res.status(500).json({
      error: 'Failed to send trial expiring emails',
      message: error.message
    });
  }
});

// Run only trial expired emails
router.post('/trial-expired', verifyCronSecret, async (req, res) => {
  try {
    const result = await emailCronService.sendTrialExpiredEmails();
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Trial expired email job error:', error);
    res.status(500).json({
      error: 'Failed to send trial expired emails',
      message: error.message
    });
  }
});

module.exports = router;
