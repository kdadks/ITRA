import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Schedule,
  Warning,
  Error,
  CheckCircle,
  Info,
  Alarm,
  MonetizationOn,
  Assignment,
  Gavel,
  ExpandMore,
  Refresh,
  Notifications,
  TrendingDown,
  TrendingUp
} from '@mui/icons-material';

const RealTimeComplianceEngine = ({
  userProfile,
  taxReturns = [],
  onComplianceAction,
  currentDate = new Date()
}) => {
  const [complianceStatus, setComplianceStatus] = useState({});
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [penaltyCalculations, setPenaltyCalculations] = useState({});
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState(null);
  const [complianceScore, setComplianceScore] = useState(0);

  // Compliance rules and deadlines
  const complianceRules = {
    itr_filing: {
      name: 'ITR Filing',
      description: 'Annual Income Tax Return filing',
      dueDate: (assessmentYear) => new Date(`${assessmentYear - 1}-07-31`),
      applicableIf: (profile, taxReturn) => taxReturn && taxReturn.grossTotalIncome > 250000,
      penalty: (daysLate) => Math.min(daysLate > 0 ? (daysLate <= 90 ? 5000 : 10000) : 0, 10000),
      priority: 'high',
      icon: <Assignment />,
      color: 'error'
    },
    advance_tax_q1: {
      name: 'Advance Tax Q1',
      description: 'First quarter advance tax payment (15% of total tax)',
      dueDate: () => new Date(currentDate.getFullYear(), 5, 15), // June 15
      applicableIf: (profile, taxReturn) => taxReturn && taxReturn.estimatedTax > 10000,
      penalty: (daysLate, taxAmount) => daysLate > 0 ? Math.round(taxAmount * 0.01 * (daysLate / 30)) : 0,
      priority: 'medium',
      icon: <MonetizationOn />,
      color: 'warning'
    },
    advance_tax_q2: {
      name: 'Advance Tax Q2',
      description: 'Second quarter advance tax payment (45% cumulative)',
      dueDate: () => new Date(currentDate.getFullYear(), 8, 15), // September 15
      applicableIf: (profile, taxReturn) => taxReturn && taxReturn.estimatedTax > 10000,
      penalty: (daysLate, taxAmount) => daysLate > 0 ? Math.round(taxAmount * 0.01 * (daysLate / 30)) : 0,
      priority: 'medium',
      icon: <MonetizationOn />,
      color: 'warning'
    },
    advance_tax_q3: {
      name: 'Advance Tax Q3',
      description: 'Third quarter advance tax payment (75% cumulative)',
      dueDate: () => new Date(currentDate.getFullYear(), 11, 15), // December 15
      applicableIf: (profile, taxReturn) => taxReturn && taxReturn.estimatedTax > 10000,
      penalty: (daysLate, taxAmount) => daysLate > 0 ? Math.round(taxAmount * 0.01 * (daysLate / 30)) : 0,
      priority: 'medium',
      icon: <MonetizationOn />,
      color: 'warning'
    },
    advance_tax_q4: {
      name: 'Advance Tax Q4',
      description: 'Final quarter advance tax payment (100%)',
      dueDate: () => new Date(currentDate.getFullYear() + 1, 2, 15), // March 15
      applicableIf: (profile, taxReturn) => taxReturn && taxReturn.estimatedTax > 10000,
      penalty: (daysLate, taxAmount) => daysLate > 0 ? Math.round(taxAmount * 0.01 * (daysLate / 30)) : 0,
      priority: 'high',
      icon: <MonetizationOn />,
      color: 'error'
    },
    tds_filing_q1: {
      name: 'TDS Return Q1',
      description: 'Quarterly TDS return filing',
      dueDate: () => new Date(currentDate.getFullYear(), 6, 31), // July 31
      applicableIf: (profile) => profile.entityType === 'business' || profile.hasTDSDeducted,
      penalty: (daysLate) => daysLate > 0 ? Math.min(daysLate * 200, 20000) : 0,
      priority: 'medium',
      icon: <Gavel />,
      color: 'info'
    },
    gst_filing: {
      name: 'GST Return Filing',
      description: 'Monthly GST return filing',
      dueDate: () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 20),
      applicableIf: (profile) => profile.gstRegistered,
      penalty: (daysLate, turnover) => daysLate > 0 ? Math.min(daysLate * 50, turnover * 0.001) : 0,
      priority: 'high',
      icon: <Assignment />,
      color: 'error'
    },
    audit_requirement: {
      name: 'Tax Audit',
      description: 'Mandatory tax audit for eligible taxpayers',
      dueDate: (assessmentYear) => new Date(`${assessmentYear - 1}-09-30`),
      applicableIf: (profile, taxReturn) => {
        return taxReturn && (
          (taxReturn.businessIncome > 0 && taxReturn.grossReceipts > 10000000) ||
          (taxReturn.businessIncome > 0 && taxReturn.businessIncome < taxReturn.grossReceipts * 0.08)
        );
      },
      penalty: () => 0, // Audit is mandatory, no direct penalty but consequences
      priority: 'high',
      icon: <Gavel />,
      color: 'error'
    }
  };

  // Calculate compliance status for all rules
  const calculateComplianceStatus = () => {
    const status = {};
    const alerts = [];
    const deadlines = [];
    const penalties = {};

    Object.entries(complianceRules).forEach(([ruleId, rule]) => {
      const currentTaxReturn = taxReturns.find(tr => tr.assessmentYear === currentDate.getFullYear() + 1) || {};
      
      // Check if rule is applicable
      if (!rule.applicableIf(userProfile, currentTaxReturn)) {
        status[ruleId] = { applicable: false };
        return;
      }

      const dueDate = rule.dueDate(currentTaxReturn.assessmentYear || currentDate.getFullYear() + 1);
      const daysUntilDue = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));
      const daysOverdue = daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0;
      
      // Calculate penalty if applicable
      const penaltyAmount = rule.penalty(
        daysOverdue,
        currentTaxReturn.estimatedTax || currentTaxReturn.taxLiability || 0,
        currentTaxReturn.grossReceipts || 0
      );

      const complianceItem = {
        ruleId,
        rule,
        dueDate,
        daysUntilDue,
        daysOverdue,
        isOverdue: daysOverdue > 0,
        penaltyAmount,
        status: daysOverdue > 0 ? 'overdue' : daysUntilDue <= 30 ? 'due_soon' : 'compliant',
        applicable: true
      };

      status[ruleId] = complianceItem;

      // Generate alerts
      if (complianceItem.isOverdue) {
        alerts.push({
          ...complianceItem,
          severity: 'error',
          message: `${rule.name} is overdue by ${daysOverdue} days. Penalty: ₹${penaltyAmount.toLocaleString()}`
        });
      } else if (daysUntilDue <= 7) {
        alerts.push({
          ...complianceItem,
          severity: 'warning',
          message: `${rule.name} is due in ${daysUntilDue} days`
        });
      } else if (daysUntilDue <= 30) {
        alerts.push({
          ...complianceItem,
          severity: 'info',
          message: `${rule.name} is due in ${daysUntilDue} days`
        });
      }

      // Add to upcoming deadlines
      if (daysUntilDue > 0 && daysUntilDue <= 60) {
        deadlines.push(complianceItem);
      }

      // Store penalty calculations
      if (penaltyAmount > 0) {
        penalties[ruleId] = penaltyAmount;
      }
    });

    // Sort alerts by priority and due date
    alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (a.rule.priority !== b.rule.priority) {
        return priorityOrder[b.rule.priority] - priorityOrder[a.rule.priority];
      }
      return a.daysUntilDue - b.daysUntilDue;
    });

    // Sort deadlines by due date
    deadlines.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    setComplianceStatus(status);
    setActiveAlerts(alerts);
    setUpcomingDeadlines(deadlines);
    setPenaltyCalculations(penalties);
  };

  // Calculate overall compliance score
  const calculateComplianceScore = () => {
    const applicableRules = Object.values(complianceStatus).filter(item => item.applicable);
    if (applicableRules.length === 0) return 100;

    const totalScore = applicableRules.reduce((score, item) => {
      if (item.status === 'compliant') return score + 100;
      if (item.status === 'due_soon') return score + 70;
      if (item.status === 'overdue' && item.daysOverdue <= 30) return score + 30;
      return score + 0; // Severely overdue
    }, 0);

    return Math.round(totalScore / applicableRules.length);
  };

  // Get compliance recommendations
  const getRecommendations = () => {
    const recommendations = [];
    
    Object.values(complianceStatus).forEach(item => {
      if (!item.applicable) return;

      if (item.status === 'overdue') {
        recommendations.push({
          type: 'urgent',
          title: `File ${item.rule.name} immediately`,
          description: `You are ${item.daysOverdue} days overdue. Current penalty: ₹${item.penaltyAmount.toLocaleString()}`,
          action: 'file_now',
          priority: 1
        });
      } else if (item.status === 'due_soon') {
        recommendations.push({
          type: 'warning',
          title: `Prepare ${item.rule.name}`,
          description: `Due in ${item.daysUntilDue} days. Start preparation now to avoid penalties.`,
          action: 'prepare',
          priority: 2
        });
      }
    });

    // Add general recommendations
    if (complianceScore < 80) {
      recommendations.push({
        type: 'improvement',
        title: 'Improve Compliance Score',
        description: 'Set up automated reminders and calendar alerts for better compliance management.',
        action: 'setup_alerts',
        priority: 3
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  };

  const showComplianceDetail = (complianceItem) => {
    setSelectedCompliance(complianceItem);
    setShowDetailDialog(true);
  };

  const handleComplianceAction = (action, ruleId) => {
    if (onComplianceAction) {
      onComplianceAction(action, ruleId);
    }
  };

  // Refresh compliance status
  const refreshCompliance = () => {
    calculateComplianceStatus();
  };

  useEffect(() => {
    calculateComplianceStatus();
  }, [userProfile, taxReturns, currentDate]);

  useEffect(() => {
    setComplianceScore(calculateComplianceScore());
  }, [complianceStatus]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Real-time Compliance Monitor
        </Typography>
        <Box display="flex" gap={1}>
          <Chip
            label={`Score: ${complianceScore}%`}
            color={complianceScore >= 80 ? 'success' : complianceScore >= 60 ? 'warning' : 'error'}
            icon={complianceScore >= 80 ? <TrendingUp /> : <TrendingDown />}
          />
          <IconButton onClick={refreshCompliance} size="small">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Compliance Score Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Compliance Health Score
          </Typography>
          <Box display="flex" alignItems="center" mb={2}>
            <Box flex={1} mr={2}>
              <LinearProgress
                variant="determinate"
                value={complianceScore}
                sx={{ height: 10, borderRadius: 5 }}
                color={complianceScore >= 80 ? 'success' : complianceScore >= 60 ? 'warning' : 'error'}
              />
            </Box>
            <Typography variant="h4" color={complianceScore >= 80 ? 'success.main' : complianceScore >= 60 ? 'warning.main' : 'error.main'}>
              {complianceScore}%
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={4} textAlign="center">
              <Typography variant="h6" color="success.main">
                {Object.values(complianceStatus).filter(item => item.applicable && item.status === 'compliant').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compliant
              </Typography>
            </Grid>
            <Grid item xs={4} textAlign="center">
              <Typography variant="h6" color="warning.main">
                {Object.values(complianceStatus).filter(item => item.applicable && item.status === 'due_soon').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Due Soon
              </Typography>
            </Grid>
            <Grid item xs={4} textAlign="center">
              <Typography variant="h6" color="error.main">
                {Object.values(complianceStatus).filter(item => item.applicable && item.status === 'overdue').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overdue
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              <Badge badgeContent={activeAlerts.length} color="error">
                <Notifications />
              </Badge>
              <Box component="span" ml={1}>Active Alerts</Box>
            </Typography>
            
            {activeAlerts.slice(0, 5).map((alert, index) => (
              <Alert
                key={`${alert.ruleId}-${index}`}
                severity={alert.severity}
                sx={{ mb: 1 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => showComplianceDetail(alert)}
                  >
                    Details
                  </Button>
                }
              >
                {alert.message}
              </Alert>
            ))}
            
            {activeAlerts.length > 5 && (
              <Typography variant="caption" color="text.secondary">
                +{activeAlerts.length - 5} more alerts
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
              Upcoming Deadlines
            </Typography>
            
            <List dense>
              {upcomingDeadlines.slice(0, 5).map((deadline, index) => (
                <ListItem
                  key={`${deadline.ruleId}-${index}`}
                  button
                  onClick={() => showComplianceDetail(deadline)}
                >
                  <ListItemIcon>
                    {deadline.rule.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={deadline.rule.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Due: {deadline.dueDate.toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color={deadline.daysUntilDue <= 7 ? 'error' : 'text.secondary'}>
                          {deadline.daysUntilDue} days remaining
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip
                    label={deadline.rule.priority}
                    size="small"
                    color={deadline.rule.priority === 'high' ? 'error' : deadline.rule.priority === 'medium' ? 'warning' : 'default'}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Penalty Tracker */}
      {Object.keys(penaltyCalculations).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom color="error">
              <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
              Penalty Tracker
            </Typography>
            
            <Typography variant="h4" color="error.main" gutterBottom>
              ₹{Object.values(penaltyCalculations).reduce((sum, penalty) => sum + penalty, 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Potential Penalties
            </Typography>
            
            <Box mt={2}>
              {Object.entries(penaltyCalculations).map(([ruleId, penalty]) => (
                <Box key={ruleId} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    {complianceRules[ruleId].name}
                  </Typography>
                  <Typography variant="body2" color="error">
                    ₹{penalty.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recommendations
          </Typography>
          
          {getRecommendations().map((rec, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Box flex={1}>
                    <Typography variant="subtitle2">{rec.title}</Typography>
                  </Box>
                  <Chip
                    label={rec.type}
                    size="small"
                    color={rec.type === 'urgent' ? 'error' : rec.type === 'warning' ? 'warning' : 'info'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {rec.description}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleComplianceAction(rec.action, null)}
                >
                  Take Action
                </Button>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCompliance?.rule.name} - Compliance Details
        </DialogTitle>
        <DialogContent>
          {selectedCompliance && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {selectedCompliance.rule.description}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body2">
                    {selectedCompliance.dueDate.toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body2">
                    <Chip
                      label={selectedCompliance.status.replace('_', ' ')}
                      size="small"
                      color={selectedCompliance.status === 'compliant' ? 'success' : selectedCompliance.status === 'due_soon' ? 'warning' : 'error'}
                    />
                  </Typography>
                </Grid>
                {selectedCompliance.isOverdue && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Days Overdue
                      </Typography>
                      <Typography variant="body2" color="error">
                        {selectedCompliance.daysOverdue} days
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Penalty Amount
                      </Typography>
                      <Typography variant="body2" color="error">
                        ₹{selectedCompliance.penaltyAmount.toLocaleString()}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
          {selectedCompliance && (
            <Button
              variant="contained"
              onClick={() => {
                handleComplianceAction('resolve', selectedCompliance.ruleId);
                setShowDetailDialog(false);
              }}
            >
              Take Action
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RealTimeComplianceEngine;
