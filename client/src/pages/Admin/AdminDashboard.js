import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import {
  SupervisorAccount,
  People,
  Assignment,
  TrendingUp,
  AttachMoney,
  CheckCircle,
  Warning,
  PersonAdd
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
  const { data: adminStats, isLoading } = useQuery(
    'admin-dashboard',
    () => axios.get('/admin/dashboard').then(res => res.data.stats),
    {
      retry: 1,
    }
  );

  const { data: recentUsers } = useQuery(
    'recent-users',
    () => axios.get('/admin/users?limit=5').then(res => res.data.users),
    {
      retry: 1,
    }
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  const stats = [
    {
      title: 'Total Users',
      value: adminStats?.users?.total || 0,
      change: `+${adminStats?.users?.recent || 0} this month`,
      icon: <People sx={{ fontSize: 40 }} />,
      color: 'primary.main',
      bgColor: 'primary.light'
    },
    {
      title: 'Premium Users',
      value: adminStats?.users?.premium || 0,
      change: `${((adminStats?.users?.premium || 0) / (adminStats?.users?.total || 1) * 100).toFixed(1)}% of total`,
      icon: <SupervisorAccount sx={{ fontSize: 40 }} />,
      color: 'secondary.main',
      bgColor: 'secondary.light'
    },
    {
      title: 'Tax Returns',
      value: adminStats?.taxReturns?.total || 0,
      change: `${adminStats?.taxReturns?.completionRate || 0}% filed`,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: 'info.main',
      bgColor: 'info.light'
    },
    {
      title: 'Revenue',
      value: `₹${(adminStats?.revenue?.estimated || 0).toLocaleString()}`,
      change: 'Estimated monthly',
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: 'success.main',
      bgColor: 'success.light'
    }
  ];

  // Sample data for charts
  const userGrowthData = [
    { month: 'Jan', users: 100 },
    { month: 'Feb', users: 180 },
    { month: 'Mar', users: 250 },
    { month: 'Apr', users: 320 },
    { month: 'May', users: 420 },
    { month: 'Jun', users: 480 },
  ];

  const returnStatusData = [
    { name: 'Filed', value: adminStats?.taxReturns?.filed || 0 },
    { name: 'Pending', value: adminStats?.taxReturns?.pending || 0 },
    { name: 'Draft', value: (adminStats?.taxReturns?.total || 0) - (adminStats?.taxReturns?.filed || 0) - (adminStats?.taxReturns?.pending || 0) },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Admin Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => window.open('/admin/users', '_blank')}
          sx={{ px: 3 }}
        >
          Manage Users
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
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {stat.change}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* User Growth Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                User Growth
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#1976d2" 
                      strokeWidth={3}
                      dot={{ fill: '#1976d2' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Users
              </Typography>
              <List dense>
                {recentUsers?.slice(0, 5).map((user, index) => (
                  <React.Fragment key={user._id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          {user.personalInfo?.firstName?.charAt(0)}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={`${user.personalInfo?.firstName} ${user.personalInfo?.lastName}`}
                        secondary={user.personalInfo?.email}
                      />
                      <Chip
                        label={user.subscription?.plan || 'free'}
                        size="small"
                        color={user.subscription?.plan === 'premium' ? 'secondary' : 'default'}
                      />
                    </ListItem>
                    {index < 4 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Tax Return Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Tax Return Status
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={returnStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                System Status
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Database Connection"
                    secondary="Operational"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="API Services"
                    secondary="All services running"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="File Storage"
                    secondary="87% capacity used"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <TrendingUp color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Performance"
                    secondary="Average response: 120ms"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
