const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const TaxReturn = require('../models/TaxReturn');

const router = express.Router();

// Admin middleware for all routes
router.use(auth);
router.use(adminAuth);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReturns = await TaxReturn.countDocuments();
    const filedReturns = await TaxReturn.countDocuments({ status: 'filed' });
    const pendingReturns = await TaxReturn.countDocuments({ status: { $in: ['draft', 'calculated'] } });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    // Revenue calculation (simplified)
    const premiumUsers = await User.countDocuments({ 
      'subscription.plan': { $in: ['basic', 'premium'] }
    });

    const stats = {
      users: {
        total: totalUsers,
        recent: recentUsers,
        premium: premiumUsers,
        free: totalUsers - premiumUsers
      },
      taxReturns: {
        total: totalReturns,
        filed: filedReturns,
        pending: pendingReturns,
        completionRate: totalReturns > 0 ? Math.round((filedReturns / totalReturns) * 100) : 0
      },
      revenue: {
        estimated: premiumUsers * 1000 // Simplified calculation
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
          { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
          { 'personalInfo.email': { $regex: search, $options: 'i' } },
          { 'personalInfo.pan': { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details with tax returns
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const taxReturns = await TaxReturn.find({ userId: req.params.id })
      .sort({ createdAt: -1 });

    res.json({ user, taxReturns });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user subscription
router.put('/users/:id/subscription', async (req, res) => {
  try {
    const { plan, startDate, endDate } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.subscription = {
      plan: plan || user.subscription.plan,
      startDate: startDate ? new Date(startDate) : user.subscription.startDate,
      endDate: endDate ? new Date(endDate) : user.subscription.endDate,
      isActive: true
    };

    user.updatedAt = new Date();
    await user.save();

    res.json({
      message: 'Subscription updated successfully',
      user: {
        ...user.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tax returns with filters
router.get('/tax-returns', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const assessmentYear = req.query.assessmentYear;
    
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) query.status = status;
    if (assessmentYear) query.assessmentYear = assessmentYear;

    const taxReturns = await TaxReturn.find(query)
      .populate('userId', 'personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.pan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReturns = await TaxReturn.countDocuments(query);
    const totalPages = Math.ceil(totalReturns / limit);

    res.json({
      taxReturns,
      pagination: {
        currentPage: page,
        totalPages,
        totalReturns,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get tax returns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system health and metrics
router.get('/system', async (req, res) => {
  try {
    const { supabase } = require('../config/supabase');
    
    // Test database connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    const systemInfo = {
      database: {
        status: error ? 'disconnected' : 'connected',
        type: 'Supabase PostgreSQL'
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date()
    };

    res.json({ systemInfo });
  } catch (error) {
    console.error('Get system info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export data for reporting
router.get('/export/users', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const users = await User.find(query)
      .select('personalInfo subscription role createdAt lastLogin')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvData = users.map(user => ({
      'First Name': user.personalInfo.firstName,
      'Last Name': user.personalInfo.lastName,
      'Email': user.personalInfo.email,
      'PAN': user.personalInfo.pan,
      'Phone': user.personalInfo.phone,
      'Subscription': user.subscription.plan,
      'Role': user.role,
      'Created At': user.createdAt.toISOString().split('T')[0],
      'Last Login': user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : 'Never'
    }));

    res.json({ data: csvData });
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
