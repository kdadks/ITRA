import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Save, Calculate, Send, ArrowBack, ArrowForward, AutoAwesome, Lightbulb } from '@mui/icons-material';
import { useAuthContext } from '../../contexts/AuthContext';

// Import our new advanced components
import TaxRegimeSelector from '../../components/TaxEngine/TaxRegimeSelector';
import DeductionOptimizer from '../../components/TaxEngine/DeductionOptimizer';
import GuidedITRWizard from '../../components/TaxEngine/GuidedITRWizard';
import OCRDocumentProcessor from '../../components/TaxEngine/OCRDocumentProcessor';
import RealTimeComplianceEngine from '../../components/TaxEngine/RealTimeComplianceEngine';
import AdvancedTaxCalculator from '../../components/TaxEngine/AdvancedTaxCalculator';

const steps = ['Basic Details', 'Income Details', 'Deductions', 'Tax Calculation', 'Bank Details', 'Review & Submit'];

const itrFormTypes = [
  { value: 'ITR-1', label: 'ITR-1 (Sahaj) - For salaried individuals' },
  { value: 'ITR-2', label: 'ITR-2 - For individuals with capital gains' },
  { value: 'ITR-3', label: 'ITR-3 - For business/profession income' },
  { value: 'ITR-4', label: 'ITR-4 (Sugam) - For presumptive income' }
];

const TaxReturnForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const isEdit = Boolean(id);

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCalculationDialog, setShowCalculationDialog] = useState(false);
  
  // Advanced features state
  const [selectedRegime, setSelectedRegime] = useState('new');
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(true);
  const [useGuidedWizard, setUseGuidedWizard] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [ocrExtractedData, setOCRExtractedData] = useState({});
  const [complianceData, setComplianceData] = useState({});

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Details
    assessmentYear: new Date().getFullYear() + 1,
    financialYear: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
    itrForm: 'ITR-1',
    selectedRegime: 'new',
    
    // Personal Details for advanced features
    personalDetails: {
      panNumber: '',
      aadharNumber: '',
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: ''
    },
    
    // Income Details
    incomeDetails: {
      salaryIncome: 0,
      housePropertyIncome: 0,
      businessIncome: 0,
      capitalGains: { shortTerm: 0, longTerm: 0 },
      otherSources: 0,
      totalIncome: 0
    },
    
    // Deductions
    deductions: {
      section80C: 0,
      section80D: 0,
      section80G: 0,
      section80E: 0,
      section80TTA: 0,
      otherDeductions: 0,
      totalDeductions: 0
    },
    
    // Tax Computations
    taxComputations: {
      grossTotalIncome: 0,
      taxableIncome: 0,
      taxLiability: 0,
      tdsDeducted: 0,
      advanceTaxPaid: 0,
      refundDue: 0,
      additionalTaxPayable: 0
    },
    
    // Bank Details
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: ''
    },
    
    status: 'draft'
  });

  // Advanced feature handlers
  const handleRegimeSelection = (regime) => {
    setSelectedRegime(regime);
    setFormData(prev => ({
      ...prev,
      selectedRegime: regime
    }));
  };

  const handleOCRDataExtraction = (documentType, extractedData) => {
    setOCRExtractedData(prev => ({
      ...prev,
      [documentType]: extractedData
    }));

    // Auto-populate form data based on extracted information
    if (documentType === 'form16' && extractedData) {
      setFormData(prev => ({
        ...prev,
        incomeDetails: {
          ...prev.incomeDetails,
          salaryIncome: extractedData.grossSalary || prev.incomeDetails.salaryIncome
        },
        personalDetails: {
          ...prev.personalDetails,
          panNumber: extractedData.employeePAN || prev.personalDetails.panNumber,
          name: extractedData.employeeName || prev.personalDetails.name
        },
        taxComputations: {
          ...prev.taxComputations,
          tdsDeducted: extractedData.tdsDeducted || prev.taxComputations.tdsDeducted
        }
      }));
    }

    if (documentType === 'form26AS' && extractedData) {
      setFormData(prev => ({
        ...prev,
        taxComputations: {
          ...prev.taxComputations,
          tdsDeducted: extractedData.totalTDS || prev.taxComputations.tdsDeducted
        }
      }));
    }

    if (documentType === 'investmentProof' && extractedData) {
      const section = extractedData.section;
      if (section === '80C') {
        setFormData(prev => ({
          ...prev,
          deductions: {
            ...prev.deductions,
            section80C: (prev.deductions.section80C || 0) + (extractedData.investmentAmount || 0)
          }
        }));
      }
    }
  };

  const handleDeductionUpdate = (updatedDeductions) => {
    setFormData(prev => ({
      ...prev,
      deductions: updatedDeductions
    }));
  };

  const handleTaxCalculationComplete = (calculationResult) => {
    const taxComputations = calculationResult[selectedRegime] || calculationResult;
    
    if (taxComputations) {
      setFormData(prev => ({
        ...prev,
        taxComputations: {
          grossTotalIncome: taxComputations.grossTotalIncome || 0,
          taxableIncome: taxComputations.taxableIncome || 0,
          taxLiability: taxComputations.netTaxLiability || 0,
          tdsDeducted: prev.taxComputations.tdsDeducted,
          advanceTaxPaid: prev.taxComputations.advanceTaxPaid,
          refundDue: Math.max(0, prev.taxComputations.tdsDeducted + prev.taxComputations.advanceTaxPaid - (taxComputations.netTaxLiability || 0)),
          additionalTaxPayable: Math.max(0, (taxComputations.netTaxLiability || 0) - prev.taxComputations.tdsDeducted - prev.taxComputations.advanceTaxPaid)
        }
      }));
    }
  };

  const handleGuidedStepComplete = (stepId, validation) => {
    // Handle guided wizard step completion
    console.log(`Step ${stepId} completed with validation:`, validation);
  };

  const handleComplianceAction = (action, ruleId) => {
    console.log(`Compliance action: ${action} for rule: ${ruleId}`);
    // Implement compliance actions (file returns, set reminders, etc.)
  };
  useEffect(() => {
    if (isEdit) {
      loadTaxReturn();
    }
  }, [id]);

  const loadTaxReturn = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tax/returns/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData(data.taxReturn);
      } else {
        setError('Failed to load tax return');
      }
    } catch (err) {
      setError('Failed to load tax return');
    }
    setLoading(false);
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleDirectInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotals = () => {
    // Calculate total income
    const totalIncome = Object.values(formData.incomeDetails).reduce((sum, val) => {
      if (typeof val === 'object') {
        return sum + (val.shortTerm || 0) + (val.longTerm || 0);
      }
      return sum + (parseFloat(val) || 0);
    }, 0) - (formData.incomeDetails.totalIncome || 0);

    // Calculate total deductions
    const totalDeductions = Object.values(formData.deductions).reduce((sum, val) => 
      sum + (parseFloat(val) || 0), 0) - (formData.deductions.totalDeductions || 0);

    // Update totals
    setFormData(prev => ({
      ...prev,
      incomeDetails: {
        ...prev.incomeDetails,
        totalIncome
      },
      deductions: {
        ...prev.deductions,
        totalDeductions
      }
    }));
  };

  const calculateTax = async () => {
    setCalculating(true);
    try {
      calculateTotals();
      
      const response = await fetch(`/api/tax/returns/${id || 'calculate'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          incomeDetails: formData.incomeDetails,
          deductions: formData.deductions
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          taxComputations: data.taxComputations
        }));
        setShowCalculationDialog(true);
        setSuccess('Tax calculation completed successfully');
      } else {
        setError('Failed to calculate tax');
      }
    } catch (err) {
      setError('Failed to calculate tax');
    }
    setCalculating(false);
  };

  const saveTaxReturn = async (isDraft = true) => {
    setSaving(true);
    setError('');
    
    try {
      calculateTotals();
      
      const url = isEdit ? `/api/tax/returns/${id}` : '/api/tax/returns';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          status: isDraft ? 'draft' : 'submitted'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(isDraft ? 'Tax return saved as draft' : 'Tax return submitted successfully');
        
        if (!isEdit && data.taxReturn) {
          navigate(`/app/tax-returns/${data.taxReturn.id}`, { replace: true });
        }
        
        if (!isDraft) {
          setTimeout(() => navigate('/app/tax-returns'), 2000);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save tax return');
      }
    } catch (err) {
      setError('Failed to save tax return');
    }
    setSaving(false);
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const renderBasicDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Assessment Year"
          type="number"
          value={formData.assessmentYear}
          onChange={(e) => handleDirectInputChange('assessmentYear', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Financial Year"
          value={formData.financialYear}
          onChange={(e) => handleDirectInputChange('financialYear', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          select
          label="ITR Form Type"
          value={formData.itrForm}
          onChange={(e) => handleDirectInputChange('itrForm', e.target.value)}
        >
          {itrFormTypes.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12}>
        <Alert severity="info">
          Select the appropriate ITR form based on your income sources. ITR-1 is suitable for salaried individuals with income up to ₹50 lakhs.
        </Alert>
      </Grid>
    </Grid>
  );

  const renderIncomeDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Income from Various Sources</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Salary Income"
          type="number"
          value={formData.incomeDetails.salaryIncome}
          onChange={(e) => handleInputChange('incomeDetails', 'salaryIncome', parseFloat(e.target.value) || 0)}
          InputProps={{ startAdornment: '₹' }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="House Property Income"
          type="number"
          value={formData.incomeDetails.housePropertyIncome}
          onChange={(e) => handleInputChange('incomeDetails', 'housePropertyIncome', parseFloat(e.target.value) || 0)}
          InputProps={{ startAdornment: '₹' }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Business/Profession Income"
          type="number"
          value={formData.incomeDetails.businessIncome}
          onChange={(e) => handleInputChange('incomeDetails', 'businessIncome', parseFloat(e.target.value) || 0)}
          InputProps={{ startAdornment: '₹' }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Income from Other Sources"
          type="number"
          value={formData.incomeDetails.otherSources}
          onChange={(e) => handleInputChange('incomeDetails', 'otherSources', parseFloat(e.target.value) || 0)}
          InputProps={{ startAdornment: '₹' }}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Capital Gains</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Short Term Capital Gains"
          type="number"
          value={formData.incomeDetails.capitalGains.shortTerm}
          onChange={(e) => {
            const newCapitalGains = {
              ...formData.incomeDetails.capitalGains,
              shortTerm: parseFloat(e.target.value) || 0
            };
            handleInputChange('incomeDetails', 'capitalGains', newCapitalGains);
          }}
          InputProps={{ startAdornment: '₹' }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Long Term Capital Gains"
          type="number"
          value={formData.incomeDetails.capitalGains.longTerm}
          onChange={(e) => {
            const newCapitalGains = {
              ...formData.incomeDetails.capitalGains,
              longTerm: parseFloat(e.target.value) || 0
            };
            handleInputChange('incomeDetails', 'capitalGains', newCapitalGains);
          }}
          InputProps={{ startAdornment: '₹' }}
        />
      </Grid>
    </Grid>
  );

  const renderDeductions = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Tax Deductions</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Section 80C (Max ₹1,50,000)"
          type="number"
          value={formData.deductions.section80C}
          onChange={(e) => handleInputChange('deductions', 'section80C', Math.min(150000, parseFloat(e.target.value) || 0))}
          InputProps={{ startAdornment: '₹' }}
          helperText="EPF, PPF, Life Insurance, ELSS, etc."
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Section 80D (Medical Insurance)"
          type="number"
          value={formData.deductions.section80D}
          onChange={(e) => handleInputChange('deductions', 'section80D', parseFloat(e.target.value) || 0)}
          InputProps={{ startAdornment: '₹' }}
          helperText="Health insurance premiums"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Section 80G (Donations)"
          type="number"
          value={formData.deductions.section80G}
          onChange={(e) => handleInputChange('deductions', 'section80G', parseFloat(e.target.value) || 0)}
          InputProps={{ startAdornment: '₹' }}
          helperText="Charitable donations"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Section 80E (Education Loan)"
          type="number"
          value={formData.deductions.section80E}
          onChange={(e) => handleInputChange('deductions', 'section80E', parseFloat(e.target.value) || 0)}
          InputProps={{ startAdornment: '₹' }}
          helperText="Interest on education loan"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Section 80TTA (Savings Interest)"
          type="number"
          value={formData.deductions.section80TTA}
          onChange={(e) => handleInputChange('deductions', 'section80TTA', Math.min(10000, parseFloat(e.target.value) || 0))}
          InputProps={{ startAdornment: '₹' }}
          helperText="Interest on savings account (Max ₹10,000)"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Other Deductions"
          type="number"
          value={formData.deductions.otherDeductions}
          onChange={(e) => handleInputChange('deductions', 'otherDeductions', parseFloat(e.target.value) || 0)}
          InputProps={{ startAdornment: '₹' }}
        />
      </Grid>
    </Grid>
  );

  const renderTaxCalculation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Tax Calculations</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={calculateTax}
            disabled={calculating}
            startIcon={calculating ? <CircularProgress size={20} /> : <Calculate />}
          >
            {calculating ? 'Calculating...' : 'Calculate Tax'}
          </Button>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Income Summary</Typography>
            <Typography>Gross Total Income: ₹{formData.taxComputations.grossTotalIncome?.toLocaleString() || 0}</Typography>
            <Typography>Taxable Income: ₹{formData.taxComputations.taxableIncome?.toLocaleString() || 0}</Typography>
            <Typography color="primary" variant="h6">
              Tax Liability: ₹{formData.taxComputations.taxLiability?.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Tax Payments</Typography>
            <TextField
              fullWidth
              label="TDS Deducted"
              type="number"
              margin="dense"
              value={formData.taxComputations.tdsDeducted}
              onChange={(e) => handleInputChange('taxComputations', 'tdsDeducted', parseFloat(e.target.value) || 0)}
              InputProps={{ startAdornment: '₹' }}
            />
            <TextField
              fullWidth
              label="Advance Tax Paid"
              type="number"
              margin="dense"
              value={formData.taxComputations.advanceTaxPaid}
              onChange={(e) => handleInputChange('taxComputations', 'advanceTaxPaid', parseFloat(e.target.value) || 0)}
              InputProps={{ startAdornment: '₹' }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Final Tax Position</Typography>
            <Divider sx={{ my: 1 }} />
            {formData.taxComputations.refundDue > 0 ? (
              <Typography color="success.main" variant="h6">
                Refund Due: ₹{formData.taxComputations.refundDue?.toLocaleString() || 0}
              </Typography>
            ) : (
              <Typography color="error.main" variant="h6">
                Additional Tax Payable: ₹{formData.taxComputations.additionalTaxPayable?.toLocaleString() || 0}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderBankDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Bank Account Details (For Refund)</Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Provide your bank account details for receiving tax refunds, if any.
        </Alert>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Account Number"
          value={formData.bankDetails.accountNumber}
          onChange={(e) => handleInputChange('bankDetails', 'accountNumber', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="IFSC Code"
          value={formData.bankDetails.ifscCode}
          onChange={(e) => handleInputChange('bankDetails', 'ifscCode', e.target.value.toUpperCase())}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Bank Name"
          value={formData.bankDetails.bankName}
          onChange={(e) => handleInputChange('bankDetails', 'bankName', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Branch Name"
          value={formData.bankDetails.branchName}
          onChange={(e) => handleInputChange('bankDetails', 'branchName', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderReviewSubmit = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Review Your Tax Return</Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Basic Information</Typography>
            <Typography>Assessment Year: {formData.assessmentYear}</Typography>
            <Typography>Financial Year: {formData.financialYear}</Typography>
            <Typography>ITR Form: {formData.itrForm}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Total Income</Typography>
            <Typography variant="h6" color="primary">
              ₹{formData.incomeDetails.totalIncome?.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Total Deductions</Typography>
            <Typography variant="h6" color="primary">
              ₹{formData.deductions.totalDeductions?.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Tax Liability</Typography>
            <Typography variant="h6" color="primary">
              ₹{formData.taxComputations.taxLiability?.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Alert severity="warning">
          Please review all the information carefully before submitting. Once submitted, you cannot modify the tax return.
        </Alert>
      </Grid>
    </Grid>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0: return renderBasicDetails();
      case 1: return renderIncomeDetails();
      case 2: return renderDeductions();
      case 3: return renderTaxCalculation();
      case 4: return renderBankDetails();
      case 5: return renderReviewSubmit();
      default: return 'Unknown step';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justify="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/app/tax-returns')}
            sx={{ mr: 2 }}
          >
            Back to Tax Returns
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            {isEdit ? 'Edit Tax Return' : 'New Tax Return'}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={showAdvancedFeatures}
                onChange={(e) => setShowAdvancedFeatures(e.target.checked)}
              />
            }
            label="Advanced Features"
          />
          <FormControlLabel
            control={
              <Switch
                checked={useGuidedWizard}
                onChange={(e) => setUseGuidedWizard(e.target.checked)}
              />
            }
            label="Guided Wizard"
          />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {showAdvancedFeatures && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Real-time Compliance Engine */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <RealTimeComplianceEngine
                  userProfile={{
                    ...formData.personalDetails,
                    entityType: 'individual',
                    gstRegistered: false,
                    hasTDSDeducted: formData.taxComputations.tdsDeducted > 0
                  }}
                  taxReturns={[formData]}
                  onComplianceAction={handleComplianceAction}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {useGuidedWizard ? (
        <Paper sx={{ p: 3 }}>
          <GuidedITRWizard
            formData={formData}
            onStepComplete={handleGuidedStepComplete}
            onFormSubmit={() => saveTaxReturn(false)}
          />
        </Paper>
      ) : (
        <Box>
          {showAdvancedFeatures && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                  <Tab icon={<AutoAwesome />} label="Smart Features" />
                  <Tab icon={<Lightbulb />} label="Tax Optimization" />
                </Tabs>
                
                {tabValue === 0 && (
                  <Box sx={{ mt: 3 }}>
                    {/* OCR Document Processor */}
                    <OCRDocumentProcessor
                      onDataExtracted={handleOCRDataExtraction}
                    />
                  </Box>
                )}
                
                {tabValue === 1 && (
                  <Box sx={{ mt: 3 }}>
                    <Grid container spacing={3}>
                      {/* Tax Regime Selector */}
                      <Grid item xs={12}>
                        <TaxRegimeSelector
                          incomeDetails={formData.incomeDetails}
                          deductions={formData.deductions}
                          onRegimeSelect={handleRegimeSelection}
                          selectedRegime={selectedRegime}
                        />
                      </Grid>
                      
                      {/* Deduction Optimizer */}
                      <Grid item xs={12}>
                        <DeductionOptimizer
                          currentDeductions={formData.deductions}
                          incomeDetails={formData.incomeDetails}
                          onDeductionsUpdate={handleDeductionUpdate}
                          selectedRegime={selectedRegime}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          <Paper sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mb: 4 }}>
              {activeStep === 3 && showAdvancedFeatures ? (
                // Advanced Tax Calculator for Tax Calculation step
                <AdvancedTaxCalculator
                  incomeDetails={formData.incomeDetails}
                  deductions={formData.deductions}
                  selectedRegime={selectedRegime}
                  onCalculationComplete={handleTaxCalculationComplete}
                  showComparison={true}
                />
              ) : (
                getStepContent(activeStep)
              )}
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>
              
              <Box>
                <Button
                  variant="outlined"
                  onClick={() => saveTaxReturn(true)}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  sx={{ mr: 2 }}
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => saveTaxReturn(false)}
                    disabled={saving}
                    startIcon={<Send />}
                  >
                    Submit Tax Return
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ArrowForward />}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Enhanced Tax Calculation Dialog */}
      <Dialog
        open={showCalculationDialog}
        onClose={() => setShowCalculationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Advanced Tax Calculation Results</DialogTitle>
        <DialogContent>
          {showAdvancedFeatures ? (
            <AdvancedTaxCalculator
              incomeDetails={formData.incomeDetails}
              deductions={formData.deductions}
              selectedRegime={selectedRegime}
              onCalculationComplete={handleTaxCalculationComplete}
              showComparison={true}
            />
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography>Gross Total Income: ₹{formData.taxComputations.grossTotalIncome?.toLocaleString()}</Typography>
              <Typography>Taxable Income: ₹{formData.taxComputations.taxableIncome?.toLocaleString()}</Typography>
              <Typography>Tax Liability: ₹{formData.taxComputations.taxLiability?.toLocaleString()}</Typography>
              <Divider sx={{ my: 2 }} />
              {formData.taxComputations.refundDue > 0 ? (
                <Typography color="success.main" variant="h6">
                  Refund Due: ₹{formData.taxComputations.refundDue?.toLocaleString()}
                </Typography>
              ) : (
                <Typography color="error.main" variant="h6">
                  Additional Tax Payable: ₹{formData.taxComputations.additionalTaxPayable?.toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCalculationDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaxReturnForm;
