import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Paper
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Info,
  Assignment,
  Calculate,
  Send,
  Lightbulb,
  TrendingUp,
  Security,
  Speed,
  Description
} from '@mui/icons-material';

const GuidedITRWizard = ({
  formData,
  onStepComplete,
  onFormSubmit,
  currentStep = 0
}) => {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [stepStatus, setStepStatus] = useState({});
  const [showGuidance, setShowGuidance] = useState(false);
  const [currentGuidance, setCurrentGuidance] = useState(null);
  const [completionScore, setCompletionScore] = useState(0);

  // Intelligent step definitions with guidance
  const steps = [
    {
      id: 'profile',
      label: 'Profile Verification',
      description: 'Verify your personal details',
      icon: <Assignment />,
      required: true,
      guidance: {
        title: 'Profile Information Guidelines',
        tips: [
          'Ensure PAN card details match exactly with government records',
          'Aadhar linking is mandatory for ITR filing',
          'Bank account details should be active and verified',
          'Address should match with your PAN card or Aadhar'
        ],
        warnings: [
          'Mismatched details can cause processing delays',
          'Invalid bank details will delay refund processing'
        ],
        documents: ['PAN Card', 'Aadhar Card', 'Bank Account Statement'],
        timeEstimate: '5-10 minutes'
      }
    },
    {
      id: 'income',
      label: 'Income Details',
      description: 'Enter all sources of income',
      icon: <TrendingUp />,
      required: true,
      guidance: {
        title: 'Income Declaration Guidelines',
        tips: [
          'Include ALL sources of income - salary, business, capital gains, etc.',
          'Use Form 16 for accurate salary income details',
          'Capital gains calculations should include indexation benefits',
          'Interest income from all bank accounts must be declared'
        ],
        warnings: [
          'Under-reporting income can lead to penalties',
          'TDS certificates help ensure accurate reporting',
          'Cryptocurrency gains are taxable and must be reported'
        ],
        documents: ['Form 16/16A', 'Bank Interest Certificates', 'Capital Gains Statements'],
        timeEstimate: '15-20 minutes'
      }
    },
    {
      id: 'deductions',
      label: 'Deductions & Investments',
      description: 'Optimize your tax savings',
      icon: <Calculate />,
      required: false,
      guidance: {
        title: 'Deduction Optimization Guidelines',
        tips: [
          'Section 80C limit is ₹1.5 lakh - ensure maximum utilization',
          'Health insurance premiums qualify under 80D',
          'Keep all investment proofs ready for verification',
          'Home loan interest and principal have separate limits'
        ],
        warnings: [
          'Claims without valid proofs may be disallowed',
          'Investment dates should be within the financial year',
          'Some deductions require specific documentation'
        ],
        documents: ['Investment Certificates', 'Insurance Receipts', 'Loan Statements'],
        timeEstimate: '10-15 minutes'
      }
    },
    {
      id: 'calculation',
      label: 'Tax Calculation',
      description: 'Review computed tax liability',
      icon: <Speed />,
      required: true,
      guidance: {
        title: 'Tax Calculation Review',
        tips: [
          'Verify tax calculations against your expectations',
          'Check if advance tax payments are correctly reflected',
          'Ensure TDS details match with Form 26AS',
          'Interest and penalty calculations should be reviewed'
        ],
        warnings: [
          'Incorrect calculations can trigger scrutiny',
          'Missing TDS entries can cause refund delays',
          'Advance tax shortfall may attract interest'
        ],
        documents: ['Form 26AS', 'Advance Tax Receipts', 'TDS Certificates'],
        timeEstimate: '5-10 minutes'
      }
    },
    {
      id: 'review',
      label: 'Final Review',
      description: 'Comprehensive review before filing',
      icon: <Security />,
      required: true,
      guidance: {
        title: 'Final Review Checklist',
        tips: [
          'Double-check all numerical entries for accuracy',
          'Ensure all mandatory schedules are filled',
          'Verify computation of total income and tax',
          'Review bank account details for refund processing'
        ],
        warnings: [
          'Changes after e-filing require revised returns',
          'Incomplete returns may be processed defectively',
          'Wrong classification of income can cause issues'
        ],
        documents: ['Complete ITR Draft', 'Supporting Documents', 'Bank Details'],
        timeEstimate: '10-15 minutes'
      }
    },
    {
      id: 'filing',
      label: 'E-Filing',
      description: 'Submit your return to IT Department',
      icon: <Send />,
      required: true,
      guidance: {
        title: 'E-Filing Process',
        tips: [
          'Use valid digital signature or Aadhar OTP for verification',
          'Save acknowledgment receipt immediately after filing',
          'Verify return within 30 days of filing',
          'Keep track of processing status on IT portal'
        ],
        warnings: [
          'Late filing attracts penalty of ₹5,000',
          'Unverified returns are considered invalid',
          'Technical issues during filing should be reported immediately'
        ],
        documents: ['Digital Signature', 'Aadhar OTP Access'],
        timeEstimate: '5-10 minutes'
      }
    }
  ];

  // Calculate completion score and step status
  const calculateCompletionScore = () => {
    const totalSteps = steps.length;
    const completedSteps = Object.values(stepStatus).filter(status => status === 'completed').length;
    const warningSteps = Object.values(stepStatus).filter(status => status === 'warning').length;
    
    let score = (completedSteps / totalSteps) * 100;
    
    // Reduce score for warnings
    score -= (warningSteps / totalSteps) * 10;
    
    return Math.max(0, Math.round(score));
  };

  // Intelligent step validation
  const validateStep = (stepId) => {
    switch (stepId) {
      case 'profile':
        return validateProfileData();
      case 'income':
        return validateIncomeData();
      case 'deductions':
        return validateDeductionData();
      case 'calculation':
        return validateTaxCalculation();
      case 'review':
        return validateFinalReview();
      default:
        return { status: 'completed', issues: [] };
    }
  };

  const validateProfileData = () => {
    const issues = [];
    
    if (!formData.personalDetails?.panNumber) {
      issues.push({ type: 'error', message: 'PAN number is mandatory' });
    }
    
    if (!formData.personalDetails?.aadharNumber) {
      issues.push({ type: 'warning', message: 'Aadhar linking recommended' });
    }
    
    if (!formData.bankDetails?.accountNumber) {
      issues.push({ type: 'error', message: 'Bank details required for refund processing' });
    }
    
    const status = issues.some(i => i.type === 'error') ? 'error' : 
                  issues.some(i => i.type === 'warning') ? 'warning' : 'completed';
    
    return { status, issues };
  };

  const validateIncomeData = () => {
    const issues = [];
    const income = formData.incomeDetails || {};
    
    const totalIncome = Object.values(income).reduce((sum, val) => 
      sum + (typeof val === 'object' ? Object.values(val).reduce((s, v) => s + v, 0) : val), 0
    );
    
    if (totalIncome === 0) {
      issues.push({ type: 'error', message: 'At least one income source must be declared' });
    }
    
    if (totalIncome > 250000 && !income.salaryIncome && !income.businessIncome) {
      issues.push({ type: 'warning', message: 'High income without salary/business - please verify' });
    }
    
    if (income.capitalGains?.shortTerm > 0 || income.capitalGains?.longTerm > 0) {
      issues.push({ type: 'info', message: 'Capital gains detected - ensure proper documentation' });
    }
    
    const status = issues.some(i => i.type === 'error') ? 'error' : 
                  issues.some(i => i.type === 'warning') ? 'warning' : 'completed';
    
    return { status, issues };
  };

  const validateDeductionData = () => {
    const issues = [];
    const deductions = formData.deductions || {};
    const income = formData.incomeDetails || {};
    
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
    const totalIncome = Object.values(income).reduce((sum, val) => 
      sum + (typeof val === 'object' ? Object.values(val).reduce((s, v) => s + v, 0) : val), 0
    );
    
    if (totalIncome > 500000 && totalDeductions < 50000) {
      issues.push({ type: 'warning', message: 'Consider maximizing tax-saving investments' });
    }
    
    if (deductions.section80C && deductions.section80C > 150000) {
      issues.push({ type: 'error', message: 'Section 80C limit exceeded (₹1.5 lakh)' });
    }
    
    if (deductions.section80D && deductions.section80D > 75000) {
      issues.push({ type: 'warning', message: 'Section 80D limit may be exceeded - verify eligibility' });
    }
    
    const status = issues.some(i => i.type === 'error') ? 'error' : 
                  issues.some(i => i.type === 'warning') ? 'warning' : 'completed';
    
    return { status, issues };
  };

  const validateTaxCalculation = () => {
    const issues = [];
    const taxComputations = formData.taxComputations || {};
    
    if (!taxComputations.taxLiability && taxComputations.taxLiability !== 0) {
      issues.push({ type: 'error', message: 'Tax calculation not performed' });
    }
    
    if (taxComputations.refundDue > 200000) {
      issues.push({ type: 'warning', message: 'High refund amount - verify TDS entries' });
    }
    
    if (taxComputations.additionalTaxPayable > 100000) {
      issues.push({ type: 'warning', message: 'High additional tax - consider advance tax planning' });
    }
    
    const status = issues.some(i => i.type === 'error') ? 'error' : 
                  issues.some(i => i.type === 'warning') ? 'warning' : 'completed';
    
    return { status, issues };
  };

  const validateFinalReview = () => {
    const issues = [];
    
    // Check if all required steps are completed
    const requiredSteps = steps.filter(step => step.required).slice(0, -2); // Exclude review and filing
    
    requiredSteps.forEach(step => {
      const validation = validateStep(step.id);
      if (validation.status === 'error') {
        issues.push({ type: 'error', message: `${step.label}: Has errors that need fixing` });
      }
    });
    
    if (!formData.status || formData.status === 'draft') {
      issues.push({ type: 'info', message: 'Return is ready for filing' });
    }
    
    const status = issues.some(i => i.type === 'error') ? 'error' : 'completed';
    
    return { status, issues };
  };

  // Update step status when formData changes
  useEffect(() => {
    const newStatus = {};
    steps.forEach(step => {
      if (step.id !== 'filing') { // Don't auto-validate filing step
        const validation = validateStep(step.id);
        newStatus[step.id] = validation.status;
      }
    });
    setStepStatus(newStatus);
    setCompletionScore(calculateCompletionScore());
  }, [formData]);

  const handleNext = () => {
    const validation = validateStep(steps[activeStep].id);
    onStepComplete(steps[activeStep].id, validation);
    
    if (validation.status !== 'error' && activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const showStepGuidance = (step) => {
    setCurrentGuidance(step.guidance);
    setShowGuidance(true);
  };

  const getStepIcon = (stepId) => {
    const status = stepStatus[stepId];
    const step = steps.find(s => s.id === stepId);
    
    if (status === 'completed') {
      return <CheckCircle color="success" />;
    } else if (status === 'warning') {
      return <Warning color="warning" />;
    } else if (status === 'error') {
      return <Warning color="error" />;
    }
    
    return step.icon;
  };

  return (
    <Box>
      {/* Progress Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">ITR Filing Progress</Typography>
            <Chip 
              label={`${completionScore}% Complete`}
              color={completionScore >= 80 ? 'success' : completionScore >= 60 ? 'warning' : 'default'}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionScore}
            sx={{ height: 8, borderRadius: 4, mb: 2 }}
            color={completionScore >= 80 ? 'success' : completionScore >= 60 ? 'warning' : 'primary'}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" display="block" color="text.secondary">
                Completed Steps
              </Typography>
              <Typography variant="h6">
                {Object.values(stepStatus).filter(s => s === 'completed').length}/{steps.length - 1}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" display="block" color="text.secondary">
                Issues Found
              </Typography>
              <Typography variant="h6" color="warning.main">
                {Object.values(stepStatus).filter(s => s === 'warning' || s === 'error').length}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" display="block" color="text.secondary">
                Estimated Time
              </Typography>
              <Typography variant="h6">
                {Math.max(0, 60 - (completionScore * 0.6))} min left
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Wizard */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.id}>
            <StepLabel
              icon={getStepIcon(step.id)}
              optional={
                !step.required && (
                  <Typography variant="caption">Optional</Typography>
                )
              }
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Typography>{step.label}</Typography>
                <Button
                  size="small"
                  startIcon={<Lightbulb />}
                  onClick={() => showStepGuidance(step)}
                >
                  Guide
                </Button>
              </Box>
            </StepLabel>
            <StepContent>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {step.description}
                </Typography>
                
                {/* Step-specific content */}
                <Box my={2}>
                  {/* Step validation results */}
                  {stepStatus[step.id] && (
                    <Box mb={2}>
                      {(() => {
                        const validation = validateStep(step.id);
                        return validation.issues.map((issue, idx) => (
                          <Alert
                            key={idx}
                            severity={issue.type}
                            size="small"
                            sx={{ mb: 1 }}
                          >
                            {issue.message}
                          </Alert>
                        ));
                      })()}
                    </Box>
                  )}
                  
                  {/* Quick actions for current step */}
                  {activeStep === index && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Quick Actions:
                      </Typography>
                      <Grid container spacing={1}>
                        {step.id === 'income' && (
                          <Grid item>
                            <Button size="small" variant="outlined">
                              Import Form 16
                            </Button>
                          </Grid>
                        )}
                        {step.id === 'deductions' && (
                          <Grid item>
                            <Button size="small" variant="outlined">
                              Optimize Deductions
                            </Button>
                          </Grid>
                        )}
                        {step.id === 'calculation' && (
                          <Grid item>
                            <Button size="small" variant="outlined">
                              Recalculate Tax
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}
                </Box>

                <Box display="flex" gap={1}>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={index === steps.length - 1 ? onFormSubmit : handleNext}
                    disabled={stepStatus[step.id] === 'error'}
                  >
                    {index === steps.length - 1 ? 'File Return' : 'Continue'}
                  </Button>
                </Box>
              </Paper>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Guidance Dialog */}
      <Dialog
        open={showGuidance}
        onClose={() => setShowGuidance(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Lightbulb sx={{ mr: 1 }} />
            {currentGuidance?.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentGuidance && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom color="success.main">
                  <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Helpful Tips
                </Typography>
                <List dense>
                  {currentGuidance.tips.map((tip, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={tip} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom color="warning.main">
                  <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Important Warnings
                </Typography>
                <List dense>
                  {currentGuidance.warnings.map((warning, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Warning color="warning" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={warning} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Required Documents
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {currentGuidance.documents.map((doc, index) => (
                    <Chip key={index} label={doc} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Estimated Time:</strong> {currentGuidance.timeEstimate}
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGuidance(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GuidedITRWizard;
