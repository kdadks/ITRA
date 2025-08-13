const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').isLength({ min: 10, max: 15 }).isNumeric(),
  body('pan').matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  body('aadhar').isLength({ min: 12, max: 12 }).isNumeric()
], async (req, res) => {
  try {
    // Debug: Log the incoming request data
    console.log('Registration request data:', JSON.stringify(req.body, null, 2));
    
    // Test Supabase connection
    const { error: connectionError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (connectionError && connectionError.code !== 'PGRST116') {
      console.log('Database connection error:', connectionError);
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please ensure Supabase is properly configured.' 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      dateOfBirth, 
      pan, 
      aadhar,
      address 
    } = req.body;

    // Check if user exists with email
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Check for existing PAN
    const { data: panCheck } = await supabase
      .from('users')
      .select('id')
      .eq('pan', pan.toUpperCase())
      .single();

    if (panCheck) {
      return res.status(400).json({ 
        message: 'User with this PAN already exists' 
      });
    }

    // Check for existing Aadhar
    const { data: aadharCheck } = await supabase
      .from('users')
      .select('id')
      .eq('aadhar', aadhar)
      .single();

    if (aadharCheck) {
      return res.status(400).json({ 
        message: 'User with this Aadhar already exists' 
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      pan: pan.toUpperCase(),
      aadhar,
      address: address || {}
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        profileCompletion: user.profile_completion
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    // Test Supabase connection
    const { error: connectionError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (connectionError && connectionError.code !== 'PGRST116') {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please ensure Supabase is properly configured.' 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await User.validatePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await User.update(user.id, { last_login: new Date().toISOString() });

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        profileCompletion: user.profile_completion
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileCompletion: user.profile_completion,
        isVerified: user.is_verified,
        preferences: JSON.parse(user.preferences || '{}'),
        lastLogin: user.last_login,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
