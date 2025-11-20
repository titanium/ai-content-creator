// Authentication Controller
// Handles user signup, login, and profile retrieval

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Calculate trial end date (15 days from now)
const getTrialEndDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return date;
};

// SIGNUP - Create new user account
exports.signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with subscription
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        subscription: {
          create: {
            trialEndDate: getTrialEndDate(),
            isTrialActive: true,
            status: 'trial'
          }
        }
      },
      include: {
        subscription: true
      }
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Failed to create account' 
    });
  }
};

// LOGIN - Authenticate existing user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { subscription: true }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check if trial has expired
    if (user.subscription.isTrialActive && 
        new Date() > new Date(user.subscription.trialEndDate)) {
      
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { 
          isTrialActive: false,
          status: 'expired'
        }
      });

      user.subscription.isTrialActive = false;
      user.subscription.status = 'expired';
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login' 
    });
  }
};

// GET ME - Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { subscription: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        subscription: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Calculate days remaining in trial
    if (user.subscription.isTrialActive) {
      const now = new Date();
      const trialEnd = new Date(user.subscription.trialEndDate);
      const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      
      user.subscription.trialDaysRemaining = Math.max(0, daysRemaining);
    }

    res.json({ user });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user data' 
    });
  }
};