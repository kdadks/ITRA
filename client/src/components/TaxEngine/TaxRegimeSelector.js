import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
  Calculate,
  CompareArrows,
  Lightbulb
} from '@mui/icons-material';

const TaxRegimeSelector = ({ incomeDetails, deductions, onRegimeSelect, selectedRegime }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);

  // Tax slabs for both regimes (AY 2024-25)
  const oldRegimeSlabs = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 }
  ];

  const newRegimeSlabs = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 600000, rate: 5 },
    { min: 600000, max: 900000, rate: 10 },
    { min: 900000, max: 1200000, rate: 15 },
    { min: 1200000, max: 1500000, rate: 20 },
    { min: 1500000, max: Infinity, rate: 30 }
  ];

  // Calculate tax for a given regime
  const calculateTax = (grossIncome, regime, deductionsAmount = 0) => {
    const slabs = regime === 'old' ? oldRegimeSlabs : newRegimeSlabs;
    let taxableIncome = grossIncome;
    
    // Apply deductions only for old regime
    if (regime === 'old') {
      taxableIncome = Math.max(0, grossIncome - deductionsAmount);
    }
    
    let tax = 0;
    let previousMax = 0;
    
    for (const slab of slabs) {
      if (taxableIncome > slab.min) {
        const taxableAmount = Math.min(taxableIncome - previousMax, slab.max - previousMax);
        tax += (taxableAmount * slab.rate) / 100;
        previousMax = slab.max;
      }
      if (taxableIncome <= slab.max) break;
    }
    
    // Add 4% cess
    const cess = tax * 0.04;
    return Math.round(tax + cess);
  };

  // Intelligent regime analysis
  const analyzeRegimes = () => {
    setLoading(true);
    
    const grossIncome = Object.values(incomeDetails).reduce((sum, val) => 
      sum + (typeof val === 'object' ? Object.values(val).reduce((s, v) => s + v, 0) : val), 0
    );
    
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
    
    // Calculate tax for both regimes
    const oldRegimeTax = calculateTax(grossIncome, 'old', totalDeductions);
    const newRegimeTax = calculateTax(grossIncome, 'new', 0);
    
    const savings = oldRegimeTax - newRegimeTax;
    const savingsPercentage = grossIncome > 0 ? ((savings / grossIncome) * 100).toFixed(2) : 0;
    
    // Generate recommendations
    let recommendation = 'new'; // Default recommendation
    let reasons = [];
    
    if (savings > 0) {
      recommendation = 'new';
      reasons.push(`Save ₹${Math.abs(savings).toLocaleString()} annually`);
      reasons.push(`${Math.abs(savingsPercentage)}% savings on gross income`);
    } else if (savings < 0) {
      recommendation = 'old';
      reasons.push(`Old regime is better by ₹${Math.abs(savings).toLocaleString()}`);
      if (totalDeductions > 150000) {
        reasons.push('High deductions make old regime beneficial');
      }
    } else {
      reasons.push('Both regimes result in similar tax liability');
      if (totalDeductions < 50000) {
        recommendation = 'new';
        reasons.push('Minimal deductions - new regime offers simplicity');
      }
    }

    // Additional intelligent insights
    if (grossIncome > 1500000) {
      reasons.push('High income bracket - consider tax planning strategies');
    }
    
    if (totalDeductions / grossIncome > 0.2) {
      reasons.push('High deduction ratio detected');
    }

    const analysisResult = {
      grossIncome,
      totalDeductions,
      oldRegimeTax,
      newRegimeTax,
      savings,
      savingsPercentage,
      recommendation,
      reasons,
      breakdownOld: calculateDetailedBreakdown(grossIncome, 'old', totalDeductions),
      breakdownNew: calculateDetailedBreakdown(grossIncome, 'new', 0)
    };
    
    setAnalysis(analysisResult);
    setComparison(generateComparison(analysisResult));
    setLoading(false);
  };

  const calculateDetailedBreakdown = (grossIncome, regime, deductionsAmount) => {
    const slabs = regime === 'old' ? oldRegimeSlabs : newRegimeSlabs;
    const taxableIncome = regime === 'old' ? Math.max(0, grossIncome - deductionsAmount) : grossIncome;
    
    const breakdown = [];
    let remainingIncome = taxableIncome;
    let cumulativeTax = 0;
    
    for (const slab of slabs) {
      if (remainingIncome > 0 && slab.min < taxableIncome) {
        const slabIncome = Math.min(remainingIncome, slab.max - slab.min);
        const slabTax = (slabIncome * slab.rate) / 100;
        
        breakdown.push({
          range: slab.max === Infinity ? `Above ₹${slab.min.toLocaleString()}` : `₹${slab.min.toLocaleString()} - ₹${slab.max.toLocaleString()}`,
          rate: slab.rate,
          income: slabIncome,
          tax: slabTax
        });
        
        cumulativeTax += slabTax;
        remainingIncome -= slabIncome;
      }
      
      if (remainingIncome <= 0) break;
    }
    
    const cess = cumulativeTax * 0.04;
    breakdown.push({
      range: 'Health & Education Cess (4%)',
      rate: 4,
      income: cumulativeTax,
      tax: cess
    });
    
    return breakdown;
  };

  const generateComparison = (analysis) => {
    return [
      {
        aspect: 'Tax Liability',
        oldRegime: `₹${analysis.oldRegimeTax.toLocaleString()}`,
        newRegime: `₹${analysis.newRegimeTax.toLocaleString()}`,
        winner: analysis.oldRegimeTax < analysis.newRegimeTax ? 'old' : 'new'
      },
      {
        aspect: 'Deductions Available',
        oldRegime: `₹${analysis.totalDeductions.toLocaleString()}`,
        newRegime: 'Limited (Standard deduction only)',
        winner: analysis.totalDeductions > 50000 ? 'old' : 'new'
      },
      {
        aspect: 'Complexity',
        oldRegime: 'High (Multiple deductions)',
        newRegime: 'Low (Simplified structure)',
        winner: 'new'
      },
      {
        aspect: 'Tax Planning Flexibility',
        oldRegime: 'High',
        newRegime: 'Limited',
        winner: 'old'
      }
    ];
  };

  useEffect(() => {
    if (incomeDetails && deductions) {
      analyzeRegimes();
    }
  }, [incomeDetails, deductions]);

  if (!analysis) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Intelligent Tax Regime Selection
          </Typography>
          <Typography color="text.secondary">
            Enter your income and deduction details to get regime recommendations
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Recommendation Header */}
      <Alert 
        severity={analysis.recommendation === 'new' ? 'success' : 'info'}
        icon={<Lightbulb />}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" gutterBottom>
          Recommended: {analysis.recommendation === 'new' ? 'New Tax Regime' : 'Old Tax Regime'}
        </Typography>
        <Typography variant="body2">
          {analysis.reasons.map((reason, index) => (
            <div key={index}>• {reason}</div>
          ))}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Quick Comparison Cards */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              border: selectedRegime === 'old' ? 2 : 1,
              borderColor: selectedRegime === 'old' ? 'primary.main' : 'divider',
              '&:hover': { boxShadow: 3 }
            }}
            onClick={() => onRegimeSelect('old')}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Old Tax Regime</Typography>
                {analysis.recommendation === 'old' && (
                  <Chip label="Recommended" color="primary" size="small" />
                )}
              </Box>
              <Typography variant="h4" color="primary.main" gutterBottom>
                ₹{analysis.oldRegimeTax.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tax after ₹{analysis.totalDeductions.toLocaleString()} deductions
              </Typography>
              <Box mt={2}>
                <Typography variant="caption" display="block">
                  ✓ Multiple deduction options
                </Typography>
                <Typography variant="caption" display="block">
                  ✓ Traditional tax planning
                </Typography>
                <Typography variant="caption" display="block">
                  ⚠ Complex documentation required
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              border: selectedRegime === 'new' ? 2 : 1,
              borderColor: selectedRegime === 'new' ? 'primary.main' : 'divider',
              '&:hover': { boxShadow: 3 }
            }}
            onClick={() => onRegimeSelect('new')}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">New Tax Regime</Typography>
                {analysis.recommendation === 'new' && (
                  <Chip label="Recommended" color="primary" size="small" />
                )}
              </Box>
              <Typography variant="h4" color="success.main" gutterBottom>
                ₹{analysis.newRegimeTax.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lower tax rates, no deductions
              </Typography>
              {analysis.savings > 0 && (
                <Box mt={1} display="flex" alignItems="center">
                  <TrendingDown color="success" sx={{ mr: 1 }} />
                  <Typography color="success.main" variant="body2">
                    Save ₹{analysis.savings.toLocaleString()}
                  </Typography>
                </Box>
              )}
              <Box mt={2}>
                <Typography variant="caption" display="block">
                  ✓ Simplified tax structure
                </Typography>
                <Typography variant="caption" display="block">
                  ✓ Lower tax rates
                </Typography>
                <Typography variant="caption" display="block">
                  ✓ No complex documentation
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Comparison Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Comparison
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Aspect</TableCell>
                    <TableCell align="center">Old Regime</TableCell>
                    <TableCell align="center">New Regime</TableCell>
                    <TableCell align="center">Winner</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparison.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.aspect}</TableCell>
                      <TableCell align="center">{row.oldRegime}</TableCell>
                      <TableCell align="center">{row.newRegime}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={row.winner === 'old' ? 'Old' : 'New'}
                          color={row.winner === 'old' ? 'info' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Tax Breakdown */}
        {selectedRegime && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedRegime === 'old' ? 'Old' : 'New'} Regime Tax Breakdown
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Income Range</TableCell>
                      <TableCell align="center">Tax Rate</TableCell>
                      <TableCell align="right">Taxable Income</TableCell>
                      <TableCell align="right">Tax Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedRegime === 'old' ? analysis.breakdownOld : analysis.breakdownNew).map((slab, index) => (
                      <TableRow key={index}>
                        <TableCell>{slab.range}</TableCell>
                        <TableCell align="center">{slab.rate}%</TableCell>
                        <TableCell align="right">₹{slab.income.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{Math.round(slab.tax).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Action Buttons */}
      <Box mt={3} display="flex" justifyContent="center" gap={2}>
        <Button
          variant="outlined"
          startIcon={<Calculate />}
          onClick={analyzeRegimes}
          disabled={loading}
        >
          Recalculate Analysis
        </Button>
        <Button
          variant="contained"
          startIcon={<CompareArrows />}
          onClick={() => onRegimeSelect(analysis.recommendation)}
        >
          Use Recommended Regime
        </Button>
      </Box>
    </Box>
  );
};

export default TaxRegimeSelector;
