import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  FilePresent,
  Calculate,
  Send,
  Visibility,
  Download
} from '@mui/icons-material';
import { useAuthContext } from '../../contexts/AuthContext';

const statusColors = {
  draft: 'default',
  calculated: 'info',
  submitted: 'success',
  filed: 'success',
  acknowledged: 'success'
};

const statusLabels = {
  draft: 'Draft',
  calculated: 'Calculated',
  submitted: 'Submitted',
  filed: 'Filed',
  acknowledged: 'Acknowledged'
};

const TaxReturns = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [taxReturns, setTaxReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, returnId: null });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  useEffect(() => {
    loadTaxReturns();
  }, []);

  const loadTaxReturns = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/tax/returns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTaxReturns(data.taxReturns || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load tax returns');
      }
    } catch (err) {
      setError('Failed to load tax returns. Please check your connection.');
    }
    setLoading(false);
  };

  const handleCreateNew = () => {
    navigate('/app/tax-returns/new');
  };

  const handleEdit = (returnId) => {
    navigate(`/app/tax-returns/${returnId}`);
  };

  const handleView = (returnId) => {
    navigate(`/app/tax-returns/${returnId}`);
  };

  const handleMenuOpen = (event, taxReturn) => {
    setMenuAnchor(event.currentTarget);
    setSelectedReturn(taxReturn);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedReturn(null);
  };

  const handleDeleteConfirm = (returnId) => {
    setDeleteDialog({ open: true, returnId });
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/tax/returns/${deleteDialog.returnId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        await loadTaxReturns();
        setDeleteDialog({ open: false, returnId: null });
      } else {
        setError('Failed to delete tax return');
      }
    } catch (err) {
      setError('Failed to delete tax return');
    }
  };

  const handleCalculate = async (returnId) => {
    try {
      const response = await fetch(`/api/tax/returns/${returnId}/calculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        await loadTaxReturns();
        handleMenuClose();
      } else {
        setError('Failed to calculate tax');
      }
    } catch (err) {
      setError('Failed to calculate tax');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Tax Returns
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleCreateNew}
        >
          New Tax Return
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {taxReturns.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <FilePresent sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Tax Returns Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first tax return to get started with ITR filing.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleCreateNew}
            >
              Create First Tax Return
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {taxReturns.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Returns
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {taxReturns.filter(tr => ['filed', 'acknowledged'].includes(tr.status)).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filed Returns
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {taxReturns.filter(tr => tr.status === 'draft').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Draft Returns
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {formatCurrency(taxReturns.reduce((sum, tr) => sum + (tr.tax_computations?.refundDue || 0), 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Refunds
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tax Returns Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Assessment Year</TableCell>
                  <TableCell>ITR Form</TableCell>
                  <TableCell align="right">Total Income</TableCell>
                  <TableCell align="right">Tax Liability</TableCell>
                  <TableCell align="right">Refund/Payable</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taxReturns.map((taxReturn) => (
                  <TableRow key={taxReturn.id} hover>
                    <TableCell>{taxReturn.assessment_year}</TableCell>
                    <TableCell>
                      <Chip size="small" label={taxReturn.itr_form} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(taxReturn.income_details?.totalIncome)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(taxReturn.tax_computations?.taxLiability)}
                    </TableCell>
                    <TableCell align="right">
                      {taxReturn.tax_computations?.refundDue > 0 ? (
                        <Typography color="success.main">
                          {formatCurrency(taxReturn.tax_computations.refundDue)} (Refund)
                        </Typography>
                      ) : (
                        <Typography color="error.main">
                          {formatCurrency(taxReturn.tax_computations?.additionalTaxPayable)} (Payable)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={statusLabels[taxReturn.status] || taxReturn.status}
                        color={statusColors[taxReturn.status] || 'default'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(taxReturn.created_at)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleView(taxReturn.id)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(taxReturn.id)}
                          disabled={['filed', 'acknowledged'].includes(taxReturn.status)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, taxReturn)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleView(selectedReturn?.id)}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem 
          onClick={() => handleEdit(selectedReturn?.id)}
          disabled={['filed', 'acknowledged'].includes(selectedReturn?.status)}
        >
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem 
          onClick={() => handleCalculate(selectedReturn?.id)}
          disabled={!selectedReturn || selectedReturn.status !== 'draft'}
        >
          <Calculate sx={{ mr: 1 }} /> Calculate Tax
        </MenuItem>
        <MenuItem onClick={() => handleDeleteConfirm(selectedReturn?.id)}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, returnId: null })}
      >
        <DialogTitle>Delete Tax Return</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this tax return? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, returnId: null })}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaxReturns;
