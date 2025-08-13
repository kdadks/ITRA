const express = require('express');
const { supabase } = require('../config/supabase');

const router = express.Router();
const { auth } = require('../middleware/auth');

// Get all compliance items for user
router.get('/', auth, async (req, res) => {
  try {
    const { status, type, year } = req.query;
    let query = supabase
      .from('compliance_deadlines')
      .select('*')
      .eq('user_id', req.user.userId);

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (year) query = query.eq('assessment_year', year);

    const { data: complianceItems, error } = await query.order('due_date');

    if (error) {
      console.error('Get compliance items error:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    // Update overdue status for items past due date
    const updatedItems = complianceItems.map(item => {
      if (item.status === 'pending' && new Date() > new Date(item.due_date)) {
        // In a real app, you'd update this in the database
        item.status = 'overdue';
      }
      return item;
    });

    res.json({ complianceItems: updatedItems });
  } catch (error) {
    console.error('Get compliance items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get compliance dashboard/summary
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentDate = new Date().toISOString();

    // Get all compliance items for the user
    const { data: allItems, error } = await supabase
      .from('compliance_deadlines')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Get compliance dashboard error:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    // Calculate counts
    const pendingCount = allItems.filter(item => item.status === 'pending').length;
    const overdueCount = allItems.filter(item => 
      item.status === 'pending' && new Date(item.due_date) < new Date()
    ).length;
    const completedCount = allItems.filter(item => item.status === 'completed').length;

    // Get upcoming items (due in next 30 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 30);
    const upcomingItems = allItems
      .filter(item => 
        item.status === 'pending' && 
        new Date(item.due_date) >= new Date() && 
        new Date(item.due_date) <= upcomingDate
      )
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);

    // Get overdue items
    const overdueItems = allItems
      .filter(item => 
        item.status === 'pending' && 
        new Date(item.due_date) < new Date()
      )
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);

    const dashboardData = {
      summary: {
        total: allItems.length,
        pending: pendingCount,
        overdue: overdueCount,
        completed: completedCount
      },
      upcomingItems,
      overdueItems
    };

    res.json({ dashboardData });
  } catch (error) {
    console.error('Get compliance dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create compliance item - simplified for demo
router.post('/', auth, async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      due_date,
      priority,
      assessment_year,
      amount
    } = req.body;

    const { data, error } = await supabase
      .from('compliance_deadlines')
      .insert([{
        user_id: req.user.userId,
        type,
        title,
        description,
        due_date: new Date(due_date).toISOString(),
        priority: priority || 'medium',
        assessment_year,
        amount,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Create compliance item error:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    res.status(201).json({
      message: 'Compliance item created successfully',
      complianceItem: data
    });
  } catch (error) {
    console.error('Create compliance item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update compliance item status
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, completedAt } = req.body;

    const { data, error } = await supabase
      .from('compliance_deadlines')
      .update({ 
        status,
        completed_at: completedAt ? new Date(completedAt).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error) {
      console.error('Update compliance item error:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Compliance item not found' });
    }

    res.json({
      message: 'Compliance item updated successfully',
      complianceItem: data
    });
  } catch (error) {
    console.error('Update compliance item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete compliance item
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('compliance_deadlines')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);

    if (error) {
      console.error('Delete compliance item error:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    res.json({ message: 'Compliance item deleted successfully' });
  } catch (error) {
    console.error('Delete compliance item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// Update compliance item
router.put('/:id', auth, async (req, res) => {
  try {
    const complianceItem = await ComplianceItem.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!complianceItem) {
      return res.status(404).json({ message: 'Compliance item not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'userId') {
        complianceItem[key] = updates[key];
      }
    });

    complianceItem.updatedAt = new Date();
    await complianceItem.save();

    res.json({
      message: 'Compliance item updated successfully',
      complianceItem
    });
  } catch (error) {
    console.error('Update compliance item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark compliance item as completed
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const complianceItem = await ComplianceItem.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!complianceItem) {
      return res.status(404).json({ message: 'Compliance item not found' });
    }

    complianceItem.status = 'completed';
    complianceItem.completedAt = new Date();
    complianceItem.updatedAt = new Date();

    await complianceItem.save();

    res.json({
      message: 'Compliance item marked as completed',
      complianceItem
    });
  } catch (error) {
    console.error('Complete compliance item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete compliance item
router.delete('/:id', auth, async (req, res) => {
  try {
    const complianceItem = await ComplianceItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!complianceItem) {
      return res.status(404).json({ message: 'Compliance item not found' });
    }

    res.json({ message: 'Compliance item deleted successfully' });
  } catch (error) {
    console.error('Delete compliance item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-generate compliance items based on tax return
router.post('/auto-generate/:returnId', auth, async (req, res) => {
  try {
    const TaxReturn = require('../models/TaxReturn');
    
    const taxReturn = await TaxReturn.findOne({
      _id: req.params.returnId,
      userId: req.user.userId
    });

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    const year = parseInt(taxReturn.assessmentYear.split('-')[0]);
    const complianceItems = [];

    // Generate ITR filing deadline
    if (taxReturn.status !== 'filed') {
      complianceItems.push({
        userId: req.user.userId,
        type: 'tax_filing',
        title: `ITR Filing - AY ${taxReturn.assessmentYear}`,
        description: `File Income Tax Return for Assessment Year ${taxReturn.assessmentYear}`,
        dueDate: new Date(`${year}-07-31`),
        priority: 'high',
        assessmentYear: taxReturn.assessmentYear
      });
    }

    // Generate advance tax payment dates if tax liability > 10,000
    if (taxReturn.taxComputations.taxLiability > 10000) {
      const advanceTaxDates = [
        { date: `${year}-06-15`, percentage: 15, quarter: 'Q1' },
        { date: `${year}-09-15`, percentage: 30, quarter: 'Q2' },
        { date: `${year}-12-15`, percentage: 30, quarter: 'Q3' },
        { date: `${year + 1}-03-15`, percentage: 25, quarter: 'Q4' }
      ];

      advanceTaxDates.forEach(({ date, percentage, quarter }) => {
        const amount = Math.round(taxReturn.taxComputations.taxLiability * (percentage / 100));
        complianceItems.push({
          userId: req.user.userId,
          type: 'advance_tax',
          title: `Advance Tax Payment ${quarter} - AY ${taxReturn.assessmentYear}`,
          description: `Pay ${percentage}% of advance tax (₹${amount})`,
          dueDate: new Date(date),
          priority: 'medium',
          assessmentYear: taxReturn.assessmentYear,
          amount
        });
      });
    }

    // Save all compliance items
    const createdItems = await ComplianceItem.insertMany(complianceItems);

    res.json({
      message: `${createdItems.length} compliance items generated successfully`,
      complianceItems: createdItems
    });
  } catch (error) {
    console.error('Auto-generate compliance items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
