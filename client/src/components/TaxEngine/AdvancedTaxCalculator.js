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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Calculate,
  CompareArrows,
  TrendingUp,
  TrendingDown,
  Info,
  ExpandMore,
  Save,
  Print,
  Share,
  Timeline,
  PieChart,
  BarChart
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';

const AdvancedTaxCalculator = ({
  incomeDetails,
  deductions,
  selectedRegime = 'new',
  onCalculationComplete,
  showComparison = true
}) => {
  const [calculations, setCalculations] = useState({});
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [comparisonData, setComparisonData] = useState(null);
  const [scenarioAnalysis, setScenarioAnalysis] = useState(null);
  const [showScenarioDialog, setShowScenarioDialog] = useState(false);

  // Tax slabs and rates for different assessment years
  const taxSlabs = {
    old: {
      '2024-25': [
        { min: 0, max: 250000, rate: 0, cess: 0 },
        { min: 250000, max: 500000, rate: 5, cess: 4 },
        { min: 500000, max: 1000000, rate: 20, cess: 4 },
        { min: 1000000, max: Infinity, rate: 30, cess: 4 }
      ],
      standardDeduction: 50000,
      maxDeductions: {
        '80C': 150000,
        '80D': 75000,
        '80E': null,
        '80G': null,
        '80TTA': 10000
      }
    },
    new: {
      '2024-25': [
        { min: 0, max: 300000, rate: 0, cess: 0 },
        { min: 300000, max: 600000, rate: 5, cess: 4 },
        { min: 600000, max: 900000, rate: 10, cess: 4 },
        { min: 900000, max: 1200000, rate: 15, cess: 4 },
        { min: 1200000, max: 1500000, rate: 20, cess: 4 },
        { min: 1500000, max: Infinity, rate: 30, cess: 4 }
      ],
      standardDeduction: 75000, // Higher in new regime
      maxDeductions: {} // Very limited deductions allowed
    }
  };

  // Advanced tax calculation with detailed breakdown
  const calculateTaxAdvanced = (regime = 'new') => {
    setLoading(true);
    
    const slabs = taxSlabs[regime]['2024-25'];
    const standardDeduction = taxSlabs[regime].standardDeduction;
    
    // Calculate gross total income
    const salaryIncome = incomeDetails?.salaryIncome || 0;
    const housePropertyIncome = incomeDetails?.housePropertyIncome || 0;
    const businessIncome = incomeDetails?.businessIncome || 0;
    const capitalGains = (incomeDetails?.capitalGains?.shortTerm || 0) + (incomeDetails?.capitalGains?.longTerm || 0);
    const otherSources = incomeDetails?.otherSources || 0;
    
    const grossTotalIncome = salaryIncome + housePropertyIncome + businessIncome + capitalGains + otherSources;
    
    // Apply standard deduction
    let incomeAfterStandardDeduction = Math.max(0, grossTotalIncome - standardDeduction);
    
    // Apply deductions (only for old regime)
    let totalDeductions = 0;
    const applicableDeductions = {};
    
    if (regime === 'old' && deductions) {
      Object.entries(deductions).forEach(([section, amount]) => {
        const maxLimit = taxSlabs.old.maxDeductions[section];
        const deductibleAmount = maxLimit ? Math.min(amount || 0, maxLimit) : (amount || 0);
        applicableDeductions[section] = deductibleAmount;
        totalDeductions += deductibleAmount;
      });
    }
    
    const taxableIncome = Math.max(0, incomeAfterStandardDeduction - totalDeductions);
    
    // Calculate tax slab-wise
    let taxBeforeCess = 0;
    const slabBreakdown = [];
    let remainingIncome = taxableIncome;
    
    slabs.forEach((slab, index) => {
      if (remainingIncome > 0 && taxableIncome > slab.min) {
        const slabIncome = Math.min(remainingIncome, slab.max - slab.min);
        const slabTax = (slabIncome * slab.rate) / 100;
        
        slabBreakdown.push({
          slabNo: index + 1,
          range: slab.max === Infinity ? `Above ₹${slab.min.toLocaleString()}` : `₹${slab.min.toLocaleString()} - ₹${slab.max.toLocaleString()}`,
          rate: slab.rate,
          taxableAmount: slabIncome,
          taxAmount: slabTax
        });
        
        taxBeforeCess += slabTax;
        remainingIncome -= slabIncome;
      }
    });
    
    // Calculate cess (4% on tax)
    const healthEducationCess = taxBeforeCess * 0.04;
    const totalTaxLiability = taxBeforeCess + healthEducationCess;
    
    // Calculate rebate (if applicable)
    let rebate = 0;
    if (regime === 'new' && taxableIncome <= 700000) {
      rebate = Math.min(totalTaxLiability, 25000);
    } else if (regime === 'old' && taxableIncome <= 500000) {
      rebate = Math.min(totalTaxLiability, 12500);
    }
    
    const netTaxLiability = Math.max(0, totalTaxLiability - rebate);
    
    // Calculate effective tax rate
    const effectiveTaxRate = grossTotalIncome > 0 ? (netTaxLiability / grossTotalIncome) * 100 : 0;
    const averageTaxRate = taxableIncome > 0 ? (netTaxLiability / taxableIncome) * 100 : 0;
    
    // Marginal tax rate calculation
    const marginalTaxRate = getMarginalTaxRate(taxableIncome, slabs);
    
    const calculationResult = {
      regime,
      grossTotalIncome,
      standardDeduction,
      incomeAfterStandardDeduction,
      totalDeductions,
      applicableDeductions,
      taxableIncome,
      slabBreakdown,
      taxBeforeCess,
      healthEducationCess,
      totalTaxLiability,
      rebate,
      netTaxLiability,
      effectiveTaxRate,
      averageTaxRate,
      marginalTaxRate,
      taxSavings: 0 // Will be calculated in comparison
    };
    
    setLoading(false);
    return calculationResult;
  };

  const getMarginalTaxRate = (income, slabs) => {
    for (const slab of slabs) {
      if (income >= slab.min && income < slab.max) {
        return slab.rate + (slab.rate * slab.cess / 100);
      }
    }
    return slabs[slabs.length - 1].rate + (slabs[slabs.length - 1].rate * slabs[slabs.length - 1].cess / 100);
  };

  // Compare both regimes
  const performComparison = () => {
    const oldRegimeCalc = calculateTaxAdvanced('old');
    const newRegimeCalc = calculateTaxAdvanced('new');
    
    const savings = oldRegimeCalc.netTaxLiability - newRegimeCalc.netTaxLiability;
    const savingsPercentage = oldRegimeCalc.netTaxLiability > 0 ? 
      (savings / oldRegimeCalc.netTaxLiability) * 100 : 0;
    
    const comparison = {
      oldRegime: { ...oldRegimeCalc, taxSavings: savings < 0 ? Math.abs(savings) : 0 },
      newRegime: { ...newRegimeCalc, taxSavings: savings > 0 ? savings : 0 },
      absoluteSavings: Math.abs(savings),
      savingsPercentage: Math.abs(savingsPercentage),
      recommendedRegime: savings > 0 ? 'new' : 'old',
      breakEvenPoint: calculateBreakEvenPoint()
    };
    
    setComparisonData(comparison);
    return comparison;
  };

  // Calculate break-even point for regime selection
  const calculateBreakEvenPoint = () => {
    // This is a simplified calculation - in reality, it would be more complex
    const baseIncome = 500000;
    const stepSize = 100000;
    let income = baseIncome;
    
    for (let i = 0; i < 50; i++) {
      const testIncomeDetails = { ...incomeDetails, salaryIncome: income };
      // Simplified calculation for break-even
      const oldTax = calculateTaxForIncome(income, 'old');
      const newTax = calculateTaxForIncome(income, 'new');
      
      if (Math.abs(oldTax - newTax) < 1000) {
        return income;
      }
      
      income += stepSize;
    }
    
    return null;
  };

  const calculateTaxForIncome = (income, regime) => {
    const slabs = taxSlabs[regime]['2024-25'];
    const standardDed = taxSlabs[regime].standardDeduction;
    const totalDeductions = regime === 'old' ? Object.values(deductions || {}).reduce((sum, val) => sum + (val || 0), 0) : 0;
    
    const taxableIncome = Math.max(0, income - standardDed - totalDeductions);
    
    let tax = 0;
    let remainingIncome = taxableIncome;
    
    slabs.forEach(slab => {
      if (remainingIncome > 0 && taxableIncome > slab.min) {
        const slabIncome = Math.min(remainingIncome, slab.max - slab.min);
        tax += (slabIncome * slab.rate) / 100;
        remainingIncome -= slabIncome;
      }
    });
    
    const cess = tax * 0.04;
    return tax + cess;
  };

  // Generate scenario analysis
  const generateScenarioAnalysis = () => {
    const baseIncome = incomeDetails?.salaryIncome || 1000000;
    const scenarios = [];
    
    // Different income scenarios
    for (let multiplier of [0.5, 0.75, 1, 1.25, 1.5, 2, 3]) {
      const scenarioIncome = Math.round(baseIncome * multiplier);
      const scenarioIncomeDetails = { ...incomeDetails, salaryIncome: scenarioIncome };
      
      // Calculate for both regimes
      const oldTax = calculateTaxForIncome(scenarioIncome, 'old');
      const newTax = calculateTaxForIncome(scenarioIncome, 'new');
      
      scenarios.push({
        income: scenarioIncome,
        oldRegimeTax: oldTax,
        newRegimeTax: newTax,
        savings: oldTax - newTax,
        bestRegime: oldTax < newTax ? 'old' : 'new'
      });
    }
    
    setScenarioAnalysis(scenarios);
  };

  // Generate charts data
  const getChartData = () => {
    if (!comparisonData) return null;
    
    const { oldRegime, newRegime } = comparisonData;
    
    // Pie chart data for tax breakdown
    const pieData = [
      { name: 'Tax Liability', value: newRegime.netTaxLiability, fill: '#ff6b6b' },
      { name: 'Take Home', value: newRegime.grossTotalIncome - newRegime.netTaxLiability, fill: '#4ecdc4' }
    ];
    
    // Bar chart data for regime comparison
    const barData = [
      {
        category: 'Gross Income',
        oldRegime: oldRegime.grossTotalIncome,
        newRegime: newRegime.grossTotalIncome
      },
      {
        category: 'Deductions',
        oldRegime: oldRegime.totalDeductions,
        newRegime: newRegime.totalDeductions
      },
      {
        category: 'Taxable Income',
        oldRegime: oldRegime.taxableIncome,
        newRegime: newRegime.taxableIncome
      },
      {
        category: 'Tax Liability',
        oldRegime: oldRegime.netTaxLiability,
        newRegime: newRegime.netTaxLiability
      }
    ];
    
    return { pieData, barData };
  };

  const handleCalculate = () => {
    if (showComparison) {
      const comparison = performComparison();
      setCalculations(comparison);
      onCalculationComplete && onCalculationComplete(comparison);
    } else {
      const result = calculateTaxAdvanced(selectedRegime);
      setCalculations({ [selectedRegime]: result });
      onCalculationComplete && onCalculationComplete(result);
    }
  };

  useEffect(() => {
    if (incomeDetails && Object.keys(incomeDetails).length > 0) {
      handleCalculate();
    }
  }, [incomeDetails, deductions, selectedRegime]);

  useEffect(() => {
    if (comparisonData) {
      generateScenarioAnalysis();
    }
  }, [comparisonData]);

  const formatCurrency = (amount) => `₹${amount.toLocaleString()}`;
  const formatPercentage = (rate) => `${rate.toFixed(2)}%`;

  if (!calculations || Object.keys(calculations).length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Calculate sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Advanced Tax Calculator
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter your income details to perform advanced tax calculations
          </Typography>
          <Button
            variant="contained"
            startIcon={<Calculate />}
            onClick={handleCalculate}
            disabled={loading}
          >
            Calculate Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const chartData = getChartData();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Advanced Tax Calculator & Analysis
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Calculate />}
            onClick={handleCalculate}
            disabled={loading}
          >
            Recalculate
          </Button>
          <Button
            variant="outlined"
            startIcon={<Timeline />}
            onClick={() => setShowScenarioDialog(true)}
          >
            Scenarios
          </Button>
        </Box>
      </Box>

      {/* Quick Summary Cards */}
      {comparisonData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {formatCurrency(comparisonData.oldRegime.netTaxLiability)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Old Regime Tax
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(comparisonData.newRegime.netTaxLiability)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  New Regime Tax
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={comparisonData.absoluteSavings > 0 ? "success.main" : "error.main"}>
                  {formatCurrency(comparisonData.absoluteSavings)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Potential Savings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Chip
                  label={`${comparisonData.recommendedRegime.toUpperCase()} REGIME`}
                  color={comparisonData.recommendedRegime === 'new' ? 'success' : 'primary'}
                  sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                />
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                  Recommended
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Detailed Analysis Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Tax Breakdown" icon={<BarChart />} />
            <Tab label="Visual Analysis" icon={<PieChart />} />
            <Tab label="Regime Comparison" icon={<CompareArrows />} />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {/* Tax Breakdown Tab */}
            {activeTab === 0 && comparisonData && (
              <Grid container spacing={3}>
                {[comparisonData.oldRegime, comparisonData.newRegime].map((calc, index) => (
                  <Grid item xs={12} md={6} key={calc.regime}>
                    <Typography variant="h6" gutterBottom>
                      {calc.regime === 'old' ? 'Old Tax Regime' : 'New Tax Regime'}
                    </Typography>
                    
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Component</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Gross Total Income</TableCell>
                          <TableCell align="right">{formatCurrency(calc.grossTotalIncome)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Standard Deduction</TableCell>
                          <TableCell align="right">-{formatCurrency(calc.standardDeduction)}</TableCell>
                        </TableRow>
                        {calc.totalDeductions > 0 && (
                          <TableRow>
                            <TableCell>Total Deductions</TableCell>
                            <TableCell align="right">-{formatCurrency(calc.totalDeductions)}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell><strong>Taxable Income</strong></TableCell>
                          <TableCell align="right"><strong>{formatCurrency(calc.taxableIncome)}</strong></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Tax Before Cess</TableCell>
                          <TableCell align="right">{formatCurrency(calc.taxBeforeCess)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Health & Education Cess</TableCell>
                          <TableCell align="right">{formatCurrency(calc.healthEducationCess)}</TableCell>
                        </TableRow>
                        {calc.rebate > 0 && (
                          <TableRow>
                            <TableCell>Rebate u/s 87A</TableCell>
                            <TableCell align="right">-{formatCurrency(calc.rebate)}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell><strong>Net Tax Liability</strong></TableCell>
                          <TableCell align="right"><strong>{formatCurrency(calc.netTaxLiability)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <Box mt={2}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Effective Tax Rate:</strong> {formatPercentage(calc.effectiveTaxRate)}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Average Tax Rate:</strong> {formatPercentage(calc.averageTaxRate)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Marginal Tax Rate:</strong> {formatPercentage(calc.marginalTaxRate)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Visual Analysis Tab */}
            {activeTab === 1 && chartData && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom textAlign="center">
                    Tax vs Take Home (New Regime)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      <RechartsPieChart data={chartData.pieData} dataKey="value">
                        {chartData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </RechartsPieChart>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom textAlign="center">
                    Regime Comparison
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={chartData.barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="oldRegime" fill="#ff6b6b" name="Old Regime" />
                      <Bar dataKey="newRegime" fill="#4ecdc4" name="New Regime" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            )}

            {/* Regime Comparison Tab */}
            {activeTab === 2 && comparisonData && (
              <Box>
                <Alert 
                  severity={comparisonData.recommendedRegime === 'new' ? 'success' : 'info'}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="body1" gutterBottom>
                    <strong>Recommendation:</strong> Choose the {comparisonData.recommendedRegime.toUpperCase()} Tax Regime
                  </Typography>
                  <Typography variant="body2">
                    You can save {formatCurrency(comparisonData.absoluteSavings)} annually 
                    ({formatPercentage(comparisonData.savingsPercentage)} savings)
                  </Typography>
                </Alert>

                <Typography variant="h6" gutterBottom>
                  Detailed Slab-wise Breakdown
                </Typography>
                
                {[comparisonData.oldRegime, comparisonData.newRegime].map((calc) => (
                  <Accordion key={calc.regime} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">
                        {calc.regime === 'old' ? 'Old Tax Regime' : 'New Tax Regime'} - 
                        Tax Slabs Breakdown
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Income Range</TableCell>
                            <TableCell align="center">Tax Rate</TableCell>
                            <TableCell align="right">Taxable Amount</TableCell>
                            <TableCell align="right">Tax Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {calc.slabBreakdown.map((slab, index) => (
                            <TableRow key={index}>
                              <TableCell>{slab.range}</TableCell>
                              <TableCell align="center">{slab.rate}%</TableCell>
                              <TableCell align="right">{formatCurrency(slab.taxableAmount)}</TableCell>
                              <TableCell align="right">{formatCurrency(slab.taxAmount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Scenario Analysis Dialog */}
      <Dialog
        open={showScenarioDialog}
        onClose={() => setShowScenarioDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Income Scenario Analysis</DialogTitle>
        <DialogContent>
          {scenarioAnalysis && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Analysis across different income levels to help you understand regime benefits
              </Typography>
              
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={scenarioAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="income" 
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                  />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                  <RechartsTooltip 
                    formatter={(value, name) => [formatCurrency(value), name]}
                    labelFormatter={(value) => `Income: ${formatCurrency(value)}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="oldRegimeTax" 
                    stroke="#ff6b6b" 
                    name="Old Regime Tax"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="newRegimeTax" 
                    stroke="#4ecdc4" 
                    name="New Regime Tax"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Annual Income</TableCell>
                    <TableCell align="right">Old Regime Tax</TableCell>
                    <TableCell align="right">New Regime Tax</TableCell>
                    <TableCell align="right">Savings</TableCell>
                    <TableCell align="center">Best Regime</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scenarioAnalysis.map((scenario, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatCurrency(scenario.income)}</TableCell>
                      <TableCell align="right">{formatCurrency(scenario.oldRegimeTax)}</TableCell>
                      <TableCell align="right">{formatCurrency(scenario.newRegimeTax)}</TableCell>
                      <TableCell align="right" sx={{ color: scenario.savings > 0 ? 'success.main' : 'error.main' }}>
                        {scenario.savings > 0 ? '+' : ''}{formatCurrency(scenario.savings)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={scenario.bestRegime.toUpperCase()}
                          color={scenario.bestRegime === 'new' ? 'success' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScenarioDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedTaxCalculator;
