import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const { isAuthenticated } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar 
        isAuthenticated={isAuthenticated} 
        onSidebarToggle={handleSidebarToggle}
      />
      
      {isAuthenticated && (
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
        />
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: isAuthenticated ? { xs: 0, sm: '240px' } : 0,
          mt: '64px',
          p: { xs: 2, sm: 3 },
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'background.default'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
