import React from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper
} from '@mui/material';
import {
  Assignment,
  Security,
  Speed,
  Support
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const features = [
    {
      icon: <Assignment sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Easy Tax Filing',
      description: 'Simplified ITR forms with step-by-step guidance and automatic calculations.'
    },
    {
      icon: <Security sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Secure & Compliant',
      description: 'Bank-grade security with government compliance and data protection.'
    },
    {
      icon: <Speed sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Fast Processing',
      description: 'Quick tax calculations and instant form generation with error checking.'
    },
    {
      icon: <Support sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: '24/7 Support',
      description: 'Expert tax professionals available to help you with your queries.'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ fontWeight: 700, mb: 2 }}
          >
            ITR Assist
          </Typography>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ mb: 4, opacity: 0.9 }}
          >
            Your Complete Income Tax Return Filing Solution
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ mb: 4, fontSize: '1.2rem', opacity: 0.8 }}
          >
            Simplify your tax filing with our comprehensive platform. 
            Calculate taxes, manage documents, track compliance, and file returns with ease.
          </Typography>
          
          {isAuthenticated ? (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/app')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Sign In
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          textAlign="center" 
          gutterBottom
          sx={{ mb: 6, fontWeight: 600 }}
        >
          Why Choose ITR Assist?
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center', 
                  p: 2,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Paper sx={{ bgcolor: 'grey.50', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} textAlign="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                10K+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Returns Filed
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                98%
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Accuracy Rate
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                5K+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Happy Users
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* CTA Section */}
      {!isAuthenticated && (
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6, textAlign: 'center' }}>
          <Container maxWidth="md">
            <Typography variant="h4" component="h2" gutterBottom>
              Ready to File Your ITR?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of users who trust ITR Assist for their tax filing needs.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              Start Filing Now
            </Button>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default Home;
