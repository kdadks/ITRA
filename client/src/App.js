import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthContext } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import TaxReturns from './pages/TaxReturns/TaxReturns';
import TaxReturnForm from './pages/TaxReturns/TaxReturnForm';
import Documents from './pages/Documents/Documents';
import Compliance from './pages/Compliance/Compliance';
import AdminDashboard from './pages/Admin/AdminDashboard';
import NotFound from './pages/NotFound/NotFound';

function App() {
  const { loading } = useAuthContext();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Protected Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="tax-returns" element={<TaxReturns />} />
          <Route path="tax-returns/new" element={<TaxReturnForm />} />
          <Route path="tax-returns/:id" element={<TaxReturnForm />} />
          <Route path="documents" element={<Documents />} />
          <Route path="compliance" element={<Compliance />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
