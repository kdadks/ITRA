import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Assignment,
  TrendingUp,
  CheckCircle,
  Warning,
  Add,
  AccountBalance,
  Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    () => axios.get('/tax/dashboard').then(res => res.data.dashboardData),
    {
      retry: 1,
    }
  );

  const { data: complianceData } = useQuery(
    'compliance-dashboard',
    () => axios.get('/compliance/dashboard').then(res => res.data.dashboardData),
    {
      retry: 1,
    }
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const stats = [
    {
      title: 'Total Returns',
      value: dashboardData?.totalReturns || 0,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: 'primary.main',
      bgColor: 'primary.light'
    },
    {
      title: 'Filed Returns',
      value: dashboardData?.filedReturns || 0,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: 'success.main',
      bgColor: 'success.light'
    },
    {
      title: 'Total Refunds',
      value: `₹${(dashboardData?.totalRefunds || 0).toLocaleString()}`,
      icon: <AccountBalance sx={{ fontSize: 40 }} />,
      color: 'info.main',
      bgColor: 'info.light'
    },
    {
      title: 'Compliance Items',
      value: complianceData?.summary?.pending || 0,
      icon: <Warning sx={{ fontSize: 40 }} />,
      color: 'warning.main',
      bgColor: 'warning.light'
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/app/tax-returns/new')}
          sx={{ px: 3 }}
        >
          New Tax Return
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${stat.bgColor}20 0%, ${stat.bgColor}10 100%)`,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    backgroundColor: stat.bgColor,
                    borderRadius: '12px',
                    p: 1,
                    mr: 2,
                    color: stat.color
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Current Assessment Year */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1 }} />
                Assessment Year {dashboardData?.currentAssessmentYear}
              </Typography>
              
              {dashboardData?.currentReturn ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1">
                      ITR Form: <strong>{dashboardData.currentReturn.itrForm}</strong>
                    </Typography>
                    <Chip 
                      label={dashboardData.currentReturn.status.toUpperCase()}
                      color={
                        dashboardData.currentReturn.status === 'filed' ? 'success' :
                        dashboardData.currentReturn.status === 'calculated' ? 'info' : 'default'
                      }
                      size="small"
                    />
                  </Box>
                  
                  {dashboardData.currentReturn.taxComputations && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Income
                        </Typography>
                        <Typography variant="h6">
                          ₹{dashboardData.currentReturn.incomeDetails?.totalIncome?.toLocaleString() || '0'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Tax Liability
                        </Typography>
                        <Typography variant="h6">
                          ₹{dashboardData.currentReturn.taxComputations?.taxLiability?.toLocaleString() || '0'}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/app/tax-returns/${dashboardData.currentReturn._id}`)}
                    >
                      Continue Filing
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    No tax return found for current assessment year
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/app/tax-returns/new')}
                  >
                    Start New Return
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & Compliance */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <List dense>
                    <ListItem 
                      button 
                      onClick={() => navigate('/app/documents')}
                      sx={{ borderRadius: 1, mb: 1 }}
                    >
                      <ListItemIcon>
                        <Assignment />
                      </ListItemIcon>
                      <ListItemText primary="Upload Documents" />
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => navigate('/app/compliance')}
                      sx={{ borderRadius: 1, mb: 1 }}
                    >
                      <ListItemIcon>
                        <CheckCircle />
                      </ListItemIcon>
                      <ListItemText primary="View Compliance" />
                    </ListItem>
                    <ListItem 
                      button 
                      onClick={() => navigate('/app/profile')}
                      sx={{ borderRadius: 1 }}
                    >
                      <ListItemIcon>
                        <TrendingUp />
                      </ListItemIcon>
                      <ListItemText primary="Update Profile" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Compliance Overview */}
            {complianceData && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Compliance Status
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Completed
                        </Typography>
                        <Typography variant="body2">
                          {complianceData.summary?.completed || 0}/{complianceData.summary?.total || 0}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={
                          complianceData.summary?.total > 0 
                            ? (complianceData.summary.completed / complianceData.summary.total) * 100 
                            : 0
                        }
                        sx={{ borderRadius: 2 }}
                      />
                    </Box>

                    {complianceData.summary?.overdue > 0 && (
                      <Box sx={{ 
                        bgcolor: 'error.light', 
                        color: 'error.contrastText',
                        p: 1, 
                        borderRadius: 1,
                        mb: 2
                      }}>
                        <Typography variant="body2">
                          <strong>{complianceData.summary.overdue}</strong> overdue items
                        </Typography>
                      </Box>
                    )}

                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={() => navigate('/app/compliance')}
                    >
                      View All
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
