import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const LoadingSpinner = ({ size = 40, message = '' }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="200px"
      gap={2}
    >
      <CircularProgress size={size} />
      {message && (
        <Box color="text.secondary" fontSize="0.875rem">
          {message}
        </Box>
      )}
    </Box>
  );
};

export default LoadingSpinner;
