import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography,
  Toolbar
} from '@mui/material';
import {
  Dashboard,
  Assignment,
  CloudUpload,
  CheckCircle,
  Person,
  AdminPanelSettings,
  BarChart,
  Help
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/app',
    roles: ['user', 'admin', 'tax_professional']
  },
  {
    text: 'Tax Returns',
    icon: <Assignment />,
    path: '/app/tax-returns',
    roles: ['user', 'admin', 'tax_professional']
  },
  {
    text: 'Documents',
    icon: <CloudUpload />,
    path: '/app/documents',
    roles: ['user', 'admin', 'tax_professional']
  },
  {
    text: 'Compliance',
    icon: <CheckCircle />,
    path: '/app/compliance',
    roles: ['user', 'admin', 'tax_professional']
  },
  {
    text: 'Profile',
    icon: <Person />,
    path: '/app/profile',
    roles: ['user', 'admin', 'tax_professional']
  },
];

const adminMenuItems = [
  {
    text: 'Admin Dashboard',
    icon: <AdminPanelSettings />,
    path: '/admin',
    roles: ['admin']
  },
  {
    text: 'Analytics',
    icon: <BarChart />,
    path: '/admin/analytics',
    roles: ['admin']
  },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const isActive = (path) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  };

  const canAccess = (roles) => {
    return roles.includes(user?.role);
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Menu
        </Typography>
      </Toolbar>
      
      <Divider />
      
      <List>
        {menuItems
          .filter(item => canAccess(item.roles))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    opacity: 0.8,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? 'white' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
      
      {user?.role === 'admin' && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography 
            variant="subtitle2" 
            sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}
          >
            Administration
          </Typography>
          <List>
            {adminMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'secondary.main',
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'secondary.light',
                      opacity: 0.8,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? 'white' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
      
      <Divider sx={{ mt: 'auto' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/help')}>
            <ListItemIcon>
              <Help />
            </ListItemIcon>
            <ListItemText primary="Help & Support" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth 
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
