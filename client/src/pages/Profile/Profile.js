import React from 'react';
import { Typography, Box } from '@mui/material';

const Profile = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 4 }}>
        Profile
      </Typography>
      <Typography variant="body1">
        Profile management coming soon...
      </Typography>
    </Box>
  );
};

export default Profile;
