const express = require('express');
const { body, validationResult } = require('express-validator');
const TaxReturn = require('../models/TaxReturn');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create new tax return
router.post('/returns', auth, [
  body('assessmentYear').notEmpty(),
  body('financialYear').notEmpty(),
  body('itrForm').isIn(['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assessmentYear, financialYear, itrForm, ...otherData } = req.body;

    // Check if return already exists for this year
    const existingReturns = await TaxReturn.findByUserId(req.user.userId, {
      assessment_year: assessmentYear
    });

    if (existingReturns && existingReturns.length > 0) {
      return res.status(400).json({ 
        message: 'Tax return already exists for this assessment year' 
      });
    }

    const taxReturnData = {
      userId: req.user.userId,
      assessmentYear,
      financialYear,
      itrForm,
      dueDate: new Date(`${assessmentYear}-07-31`).toISOString(), // Default due date
      ...otherData
    };

    const taxReturn = await TaxReturn.create(taxReturnData);

    res.status(201).json({
      message: 'Tax return created successfully',
      taxReturn
    });
  } catch (error) {
    console.error('Create tax return error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get all tax returns for user
router.get('/returns', auth, async (req, res) => {
  try {
    const { assessment_year, status } = req.query;
    const filters = {};
    
    if (assessment_year) filters.assessment_year = assessment_year;
    if (status) filters.status = status;

    const taxReturns = await TaxReturn.findByUserId(req.user.userId, filters);

    res.json({ taxReturns: taxReturns || [] });
  } catch (error) {
    console.error('Get tax returns error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get specific tax return
router.get('/returns/:id', auth, async (req, res) => {
  try {
    const taxReturn = await TaxReturn.findById(req.params.id);

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    // Check if user owns this tax return
    if (taxReturn.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ taxReturn });
  } catch (error) {
    console.error('Get tax return error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update entire tax return
router.put('/returns/:id', auth, async (req, res) => {
  try {
    const taxReturn = await TaxReturn.findById(req.params.id);

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    // Check if user owns this tax return
    if (taxReturn.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Don't allow updating filed returns
    if (['filed', 'acknowledged'].includes(taxReturn.status)) {
      return res.status(400).json({ message: 'Cannot modify filed tax return' });
    }

    const updatedTaxReturn = await TaxReturn.update(req.params.id, req.body);

    res.json({
      message: 'Tax return updated successfully',
      taxReturn: updatedTaxReturn
    });
  } catch (error) {
    console.error('Update tax return error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update income details
router.put('/returns/:id/income', auth, async (req, res) => {
  try {
    const taxReturn = await TaxReturn.findById(req.params.id);

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    // Check if user owns this tax return
    if (taxReturn.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { incomeDetails } = req.body;
    const updatedIncomeDetails = { ...taxReturn.income_details, ...incomeDetails };

    const updatedTaxReturn = await TaxReturn.update(req.params.id, {
      incomeDetails: updatedIncomeDetails
    });

    res.json({
      message: 'Income details updated successfully',
      taxReturn: updatedTaxReturn
    });
  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update deductions
router.put('/returns/:id/deductions', auth, async (req, res) => {
  try {
    const taxReturn = await TaxReturn.findById(req.params.id);

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    // Check if user owns this tax return
    if (taxReturn.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { deductions } = req.body;
    const updatedDeductions = { ...taxReturn.deductions, ...deductions };

    const updatedTaxReturn = await TaxReturn.update(req.params.id, {
      deductions: updatedDeductions
    });

    res.json({
      message: 'Deductions updated successfully',
      taxReturn: updatedTaxReturn
    });
  } catch (error) {
    console.error('Update deductions error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Calculate tax
router.post('/returns/:id/calculate', auth, async (req, res) => {
  try {
    let taxReturn;
    
    if (req.params.id === 'calculate') {
      // For calculation without saving (preview)
      taxReturn = { income_details: req.body.incomeDetails, deductions: req.body.deductions };
    } else {
      taxReturn = await TaxReturn.findById(req.params.id);
      
      if (!taxReturn) {
        return res.status(404).json({ message: 'Tax return not found' });
      }

      // Check if user owns this tax return
      if (taxReturn.user_id !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Calculate tax based on income and deductions
    const incomeDetails = taxReturn.income_details || {};
    const deductions = taxReturn.deductions || {};

    // Calculate gross total income
    const grossTotalIncome = (
      (incomeDetails.salaryIncome || 0) +
      (incomeDetails.housePropertyIncome || 0) +
      (incomeDetails.businessIncome || 0) +
      (incomeDetails.capitalGains?.shortTerm || 0) +
      (incomeDetails.capitalGains?.longTerm || 0) +
      (incomeDetails.otherSources || 0)
    );

    // Calculate total deductions
    const totalDeductions = (
      (deductions.section80C || 0) +
      (deductions.section80D || 0) +
      (deductions.section80G || 0) +
      (deductions.section80E || 0) +
      (deductions.section80TTA || 0) +
      (deductions.otherDeductions || 0)
    );

    // Calculate taxable income
    const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

    // Calculate tax liability (simplified calculation for demo)
    let taxLiability = 0;
    
    if (taxableIncome <= 250000) {
      taxLiability = 0;
    } else if (taxableIncome <= 500000) {
      taxLiability = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      taxLiability = 12500 + (taxableIncome - 500000) * 0.20;
    } else {
      taxLiability = 112500 + (taxableIncome - 1000000) * 0.30;
    }

    // Add cess (4%)
    taxLiability *= 1.04;

    const taxComputations = {
      grossTotalIncome,
      taxableIncome,
      taxLiability: Math.round(taxLiability),
      tdsDeducted: taxReturn.tax_computations?.tdsDeducted || 0,
      advanceTaxPaid: taxReturn.tax_computations?.advanceTaxPaid || 0,
      refundDue: 0,
      additionalTaxPayable: 0
    };

    // Calculate refund or additional tax payable
    const totalTaxPaid = taxComputations.tdsDeducted + taxComputations.advanceTaxPaid;
    if (totalTaxPaid > taxComputations.taxLiability) {
      taxComputations.refundDue = totalTaxPaid - taxComputations.taxLiability;
    } else {
      taxComputations.additionalTaxPayable = taxComputations.taxLiability - totalTaxPaid;
    }

    // Update tax return with calculations if not preview
    if (req.params.id !== 'calculate') {
      const updatedTaxReturn = await TaxReturn.update(req.params.id, {
        taxComputations,
        status: 'calculated'
      });
      
      return res.json({
        message: 'Tax calculation completed successfully',
        taxReturn: updatedTaxReturn,
        taxComputations
      });
    }

    // Return calculations for preview
    res.json({
      message: 'Tax calculation completed',
      taxComputations
    });

  } catch (error) {
    console.error('Calculate tax error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// File tax return
router.post('/returns/:id/file', auth, async (req, res) => {
  try {
    const taxReturn = await TaxReturn.findById(req.params.id);

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    // Check if user owns this tax return
    if (taxReturn.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (taxReturn.status !== 'calculated') {
      return res.status(400).json({ message: 'Tax return must be calculated before filing' });
    }

    // Generate acknowledgment number (mock)
    const acknowledgmentNumber = `ITR${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const updatedTaxReturn = await TaxReturn.update(req.params.id, {
      status: 'filed',
      acknowledgmentNumber,
      filingDate: new Date().toISOString()
    });

    res.json({
      message: 'Tax return filed successfully',
      taxReturn: updatedTaxReturn,
      acknowledgmentNumber
    });
  } catch (error) {
    console.error('File tax return error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Delete tax return
router.delete('/returns/:id', auth, async (req, res) => {
  try {
    const taxReturn = await TaxReturn.findById(req.params.id);

    if (!taxReturn) {
      return res.status(404).json({ message: 'Tax return not found' });
    }

    // Check if user owns this tax return
    if (taxReturn.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Don't allow deleting filed returns
    if (['filed', 'acknowledged'].includes(taxReturn.status)) {
      return res.status(400).json({ message: 'Cannot delete filed tax return' });
    }

    await TaxReturn.delete(req.params.id);

    res.json({ message: 'Tax return deleted successfully' });
  } catch (error) {
    console.error('Delete tax return error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;
