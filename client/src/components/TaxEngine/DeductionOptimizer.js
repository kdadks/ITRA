import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ExpandMore,
  Lightbulb,
  TrendingUp,
  Info,
  Calculate,
  Savings,
  Assignment,
  School,
  LocalHospital,
  Home,
  Business,
  AccountBalance,
  Percent
} from '@mui/icons-material';

const DeductionOptimizer = ({ 
  currentDeductions, 
  incomeDetails, 
  onDeductionsUpdate,
  selectedRegime = 'old'
}) => {
  const [deductions, setDeductions] = useState(currentDeductions || {});
  const [optimization, setOptimization] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Deduction categories with limits and suggestions
  const deductionCategories = {
    section80C: {
      title: '80C - ELSS, PPF, Insurance, etc.',
      limit: 150000,
      icon: <Savings />,
      color: 'primary',
      suggestions: [
        'ELSS Mutual Funds (Tax saving + Growth potential)',
        'Public Provident Fund (15-year lock-in)',
        'Employee Provident Fund',
        'Life Insurance Premium',
        'Principal repayment of Home Loan',
        'National Savings Certificate (NSC)',
        'Tax Saver Fixed Deposits',
        'Sukanya Samriddhi Yojana (for girl child)'
      ]
    },
    section80D: {
      title: '80D - Health Insurance',
      limit: 75000, // 25k self + 25k parents + 25k senior parents
      icon: <LocalHospital />,
      color: 'success',
      suggestions: [
        'Health Insurance for Self & Family (up to ₹25,000)',
        'Health Insurance for Parents (up to ₹25,000)',
        'Health Insurance for Senior Citizen Parents (up to ₹50,000)',
        'Preventive Health Check-up (up to ₹5,000)',
        'Top-up Health Insurance Plans'
      ]
    },
    section80E: {
      title: '80E - Education Loan Interest',
      limit: null, // No limit
      icon: <School />,
      color: 'info',
      suggestions: [
        'Interest on Education Loan (No upper limit)',
        'Loan for higher education in India or abroad',
        'For self, spouse, children, or student for whom you are legal guardian'
      ]
    },
    section80G: {
      title: '80G - Donations',
      limit: null, // Varies by organization
      icon: <AccountBalance />,
      color: 'warning',
      suggestions: [
        'PM CARES Fund (100% deduction)',
        'National Defence Fund (100% deduction)',
        'Donations to Government/Approved NGOs (50% deduction)',
        'Religious institutions (varies)',
        'Educational institutions (varies)'
      ]
    },
    section80TTA: {
      title: '80TTA - Savings Account Interest',
      limit: 10000,
      icon: <Percent />,
      color: 'secondary',
      suggestions: [
        'Interest from Savings Bank Account (up to ₹10,000)',
        'Does not include Fixed Deposits or Recurring Deposits'
      ]
    },
    houseProperty: {
      title: 'House Property - Home Loan Interest',
      limit: 200000,
      icon: <Home />,
      color: 'error',
      suggestions: [
        'Interest on Home Loan (up to ₹2,00,000)',
        'Self-occupied property only',
        'Additional ₹1,50,000 for first-time home buyers under 80EEA'
      ]
    },
    professionalTax: {
      title: 'Professional Tax',
      limit: null,
      icon: <Business />,
      color: 'default',
      suggestions: [
        'Professional Tax paid to State Government',
        'Usually deducted by employer',
        'Varies by state (₹200-₹2,500 annually)'
      ]
    }
  };

  // Calculate optimization suggestions
  const calculateOptimizations = () => {
    const totalIncome = Object.values(incomeDetails).reduce((sum, val) => 
      sum + (typeof val === 'object' ? Object.values(val).reduce((s, v) => s + v, 0) : val), 0
    );

    const currentTotal = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
    
    // Calculate potential savings for each category
    const optimizationSuggestions = [];
    let potentialSavings = 0;
    
    Object.entries(deductionCategories).forEach(([key, category]) => {
      const current = deductions[key] || 0;
      const limit = category.limit;
      
      if (limit && current < limit) {
        const potential = limit - current;
        const taxSaving = calculateTaxSaving(potential, totalIncome);
        
        if (taxSaving > 0) {
          optimizationSuggestions.push({
            category: key,
            title: category.title,
            current,
            potential,
            limit,
            taxSaving,
            suggestions: category.suggestions,
            priority: getPriority(key, potential, taxSaving)
          });
          
          potentialSavings += taxSaving;
        }
      }
    });

    // Sort by priority and tax savings
    optimizationSuggestions.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.taxSaving - a.taxSaving;
    });

    setOptimization({
      currentTotal,
      potentialAdditional: optimizationSuggestions.reduce((sum, s) => sum + s.potential, 0),
      potentialSavings,
      suggestions: optimizationSuggestions.slice(0, 5) // Top 5 suggestions
    });
  };

  const calculateTaxSaving = (deductionAmount, income) => {
    // Simplified tax calculation for savings estimation
    let taxRate = 0;
    
    if (income > 1500000) taxRate = 30;
    else if (income > 1000000) taxRate = 20;
    else if (income > 500000) taxRate = 20;
    else if (income > 250000) taxRate = 5;
    
    // Add 4% cess
    const effectiveRate = taxRate * 1.04;
    return Math.round((deductionAmount * effectiveRate) / 100);
  };

  const getPriority = (category, potential, taxSaving) => {
    // Priority scoring based on category importance and tax saving potential
    const categoryPriority = {
      section80C: 5,
      section80D: 4,
      houseProperty: 4,
      section80E: 3,
      section80G: 2,
      section80TTA: 1,
      professionalTax: 1
    };
    
    const basePriority = categoryPriority[category] || 1;
    const savingPriority = taxSaving > 10000 ? 2 : taxSaving > 5000 ? 1 : 0;
    
    return basePriority + savingPriority;
  };

  const handleDeductionChange = (category, value) => {
    const numValue = parseFloat(value) || 0;
    const limit = deductionCategories[category]?.limit;
    
    // Apply limit if exists
    const finalValue = limit ? Math.min(numValue, limit) : numValue;
    
    setDeductions(prev => ({
      ...prev,
      [category]: finalValue
    }));
  };

  const applyOptimization = (suggestion) => {
    handleDeductionChange(suggestion.category, suggestion.limit);
  };

  useEffect(() => {
    if (incomeDetails && Object.keys(incomeDetails).length > 0) {
      calculateOptimizations();
    }
  }, [deductions, incomeDetails]);

  useEffect(() => {
    onDeductionsUpdate(deductions);
  }, [deductions, onDeductionsUpdate]);

  if (selectedRegime === 'new') {
    return (
      <Card>
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Deduction optimization is not applicable for the New Tax Regime as most deductions are not allowed.
          </Alert>
          <Typography variant="h6">New Tax Regime Selected</Typography>
          <Typography variant="body2" color="text.secondary">
            The new tax regime offers lower tax rates but doesn't allow most deductions under the old regime.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6">
              <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
              Deduction Optimizer
            </Typography>
            {optimization && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowSuggestions(true)}
                startIcon={<TrendingUp />}
              >
                View Suggestions
              </Button>
            )}
          </Box>
          
          {optimization && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    ₹{optimization.currentTotal.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current Deductions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    ₹{optimization.potentialAdditional.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Additional Potential
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    ₹{optimization.potentialSavings.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Potential Tax Savings
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}

          {optimization && optimization.potentialSavings > 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                You can potentially save ₹{optimization.potentialSavings.toLocaleString()} 
                in taxes by optimizing your deductions!
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Deduction Categories */}
      <Grid container spacing={3}>
        {Object.entries(deductionCategories).map(([key, category]) => (
          <Grid item xs={12} key={key}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Box display="flex" alignItems="center" flex={1}>
                    {category.icon}
                    <Box ml={2}>
                      <Typography variant="subtitle1">
                        {category.title}
                      </Typography>
                      {category.limit && (
                        <Typography variant="caption" color="text.secondary">
                          Limit: ₹{category.limit.toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box mr={2}>
                    <Chip
                      label={`₹${(deductions[key] || 0).toLocaleString()}`}
                      color={category.color}
                      size="small"
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Amount"
                      value={deductions[key] || ''}
                      onChange={(e) => handleDeductionChange(key, e.target.value)}
                      InputProps={{
                        startAdornment: '₹'
                      }}
                      helperText={category.limit ? 
                        `Maximum: ₹${category.limit.toLocaleString()}` : 
                        'No limit'
                      }
                    />
                    {category.limit && (
                      <Box mt={1}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(((deductions[key] || 0) / category.limit) * 100, 100)}
                          color={category.color}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(Math.min(((deductions[key] || 0) / category.limit) * 100, 100))}% utilized
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" gutterBottom>
                      Investment Options:
                    </Typography>
                    <List dense>
                      {category.suggestions.slice(0, 4).map((suggestion, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Chip size="small" label="•" sx={{ minWidth: 8, height: 8 }} />
                          </ListItemIcon>
                          <ListItemText>
                            <Typography variant="caption">{suggestion}</Typography>
                          </ListItemText>
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* Suggestions Dialog */}
      <Dialog
        open={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
            Optimization Suggestions
          </Typography>
        </DialogTitle>
        <DialogContent>
          {optimization?.suggestions.map((suggestion, index) => (
            <Card key={suggestion.category} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box flex={1}>
                    <Typography variant="subtitle1" gutterBottom>
                      {suggestion.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Current: ₹{suggestion.current.toLocaleString()} / 
                      Potential: ₹{suggestion.potential.toLocaleString()} more
                    </Typography>
                    <Chip
                      label={`Save ₹${suggestion.taxSaving.toLocaleString()} in taxes`}
                      color="success"
                      size="small"
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => applyOptimization(suggestion)}
                  >
                    Apply Max
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuggestions(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Box mt={3} textAlign="center">
        <Button
          variant="contained"
          startIcon={<Calculate />}
          onClick={calculateOptimizations}
        >
          Recalculate Optimization
        </Button>
      </Box>
    </Box>
  );
};

export default DeductionOptimizer;
