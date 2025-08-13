const supabase = require('../config/supabase');

const TaxReturn = {
  // Create a new tax return
  create: async (taxReturnData) => {
    try {
      const { data, error } = await supabase
        .from('tax_returns')
        .insert({
          user_id: taxReturnData.userId,
          assessment_year: taxReturnData.assessmentYear,
          financial_year: taxReturnData.financialYear,
          itr_form: taxReturnData.itrForm,
          
          // Income details - store as JSON
          income_details: JSON.stringify(taxReturnData.incomeDetails || {
            salaryIncome: 0,
            housePropertyIncome: 0,
            businessIncome: 0,
            capitalGains: { shortTerm: 0, longTerm: 0 },
            otherSources: 0,
            totalIncome: 0
          }),
          
          // Deductions - store as JSON
          deductions: JSON.stringify(taxReturnData.deductions || {
            section80C: 0,
            section80D: 0,
            section80G: 0,
            section80E: 0,
            section80TTA: 0,
            otherDeductions: 0,
            totalDeductions: 0
          }),
          
          // Tax computations - store as JSON
          tax_computations: JSON.stringify(taxReturnData.taxComputations || {
            grossTotalIncome: 0,
            taxableIncome: 0,
            taxLiability: 0,
            tdsDeducted: 0,
            advanceTaxPaid: 0,
            refundDue: 0,
            additionalTaxPayable: 0
          }),
          
          // Bank details - store as JSON
          bank_details: JSON.stringify(taxReturnData.bankDetails || {}),
          
          status: taxReturnData.status || 'draft',
          acknowledgment_number: taxReturnData.acknowledgmentNumber || null,
          filing_date: taxReturnData.filingDate || null,
          due_date: taxReturnData.dueDate || null,
          
          // Documents - store as JSON array
          documents: JSON.stringify(taxReturnData.documents || []),
          
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(`Error creating tax return: ${error.message}`);
    }
  },

  // Find tax return by ID
  findById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('tax_returns')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      // Parse JSON fields
      if (data) {
        data.income_details = JSON.parse(data.income_details || '{}');
        data.deductions = JSON.parse(data.deductions || '{}');
        data.tax_computations = JSON.parse(data.tax_computations || '{}');
        data.bank_details = JSON.parse(data.bank_details || '{}');
        data.documents = JSON.parse(data.documents || '[]');
      }

      return data;
    } catch (error) {
      if (error.message.includes('JSON object requested, multiple (or no) rows returned')) {
        return null;
      }
      throw new Error(`Error finding tax return: ${error.message}`);
    }
  },

  // Find all tax returns for a user
  findByUserId: async (userId, filters = {}) => {
    try {
      let query = supabase
        .from('tax_returns')
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (filters.assessment_year) {
        query = query.eq('assessment_year', filters.assessment_year);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Parse JSON fields for each tax return
      if (data && data.length > 0) {
        data.forEach(taxReturn => {
          taxReturn.income_details = JSON.parse(taxReturn.income_details || '{}');
          taxReturn.deductions = JSON.parse(taxReturn.deductions || '{}');
          taxReturn.tax_computations = JSON.parse(taxReturn.tax_computations || '{}');
          taxReturn.bank_details = JSON.parse(taxReturn.bank_details || '{}');
          taxReturn.documents = JSON.parse(taxReturn.documents || '[]');
        });
      }

      return data;
    } catch (error) {
      throw new Error(`Error fetching tax returns: ${error.message}`);
    }
  },

  // Update tax return
  update: async (id, updates) => {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Handle JSON fields
      if (updates.incomeDetails) {
        updateData.income_details = JSON.stringify(updates.incomeDetails);
      }
      if (updates.deductions) {
        updateData.deductions = JSON.stringify(updates.deductions);
      }
      if (updates.taxComputations) {
        updateData.tax_computations = JSON.stringify(updates.taxComputations);
      }
      if (updates.bankDetails) {
        updateData.bank_details = JSON.stringify(updates.bankDetails);
      }
      if (updates.documents) {
        updateData.documents = JSON.stringify(updates.documents);
      }

      // Handle other fields
      if (updates.status) updateData.status = updates.status;
      if (updates.acknowledgmentNumber) updateData.acknowledgment_number = updates.acknowledgmentNumber;
      if (updates.filingDate) updateData.filing_date = updates.filingDate;
      if (updates.dueDate) updateData.due_date = updates.dueDate;

      const { data, error } = await supabase
        .from('tax_returns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Parse JSON fields
      if (data) {
        data.income_details = JSON.parse(data.income_details || '{}');
        data.deductions = JSON.parse(data.deductions || '{}');
        data.tax_computations = JSON.parse(data.tax_computations || '{}');
        data.bank_details = JSON.parse(data.bank_details || '{}');
        data.documents = JSON.parse(data.documents || '[]');
      }

      return data;
    } catch (error) {
      throw new Error(`Error updating tax return: ${error.message}`);
    }
  },

  // Delete tax return
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('tax_returns')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Tax return deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting tax return: ${error.message}`);
    }
  },

  // Get all tax returns (admin only)
  findAll: async (filters = {}) => {
    try {
      let query = supabase.from('tax_returns').select(`
        *,
        users!inner(first_name, last_name, email)
      `);

      // Apply filters
      if (filters.assessment_year) {
        query = query.eq('assessment_year', filters.assessment_year);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Parse JSON fields for each tax return
      if (data && data.length > 0) {
        data.forEach(taxReturn => {
          taxReturn.income_details = JSON.parse(taxReturn.income_details || '{}');
          taxReturn.deductions = JSON.parse(taxReturn.deductions || '{}');
          taxReturn.tax_computations = JSON.parse(taxReturn.tax_computations || '{}');
          taxReturn.bank_details = JSON.parse(taxReturn.bank_details || '{}');
          taxReturn.documents = JSON.parse(taxReturn.documents || '[]');
        });
      }

      return data;
    } catch (error) {
      throw new Error(`Error fetching all tax returns: ${error.message}`);
    }
  },

  // Calculate tax liability (utility method)
  calculateTaxLiability: (incomeDetails, deductions) => {
    const totalIncome = 
      incomeDetails.salaryIncome + 
      incomeDetails.housePropertyIncome + 
      incomeDetails.businessIncome + 
      (incomeDetails.capitalGains?.shortTerm || 0) + 
      (incomeDetails.capitalGains?.longTerm || 0) + 
      incomeDetails.otherSources;

    const totalDeductions = 
      deductions.section80C + 
      deductions.section80D + 
      deductions.section80G + 
      deductions.section80E + 
      deductions.section80TTA + 
      deductions.otherDeductions;

    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    
    // Simplified tax calculation (old regime)
    let tax = 0;
    if (taxableIncome > 250000) {
      if (taxableIncome <= 500000) {
        tax = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        tax = 12500 + (taxableIncome - 500000) * 0.20;
      } else {
        tax = 112500 + (taxableIncome - 1000000) * 0.30;
      }
    }
    
    // Add cess (4%)
    tax = tax + (tax * 0.04);
    
    return {
      grossTotalIncome: totalIncome,
      taxableIncome: taxableIncome,
      taxLiability: Math.round(tax),
      totalDeductions: totalDeductions
    };
  },

  // Delete tax return
  delete: async (id) => {
    try {
      const { data, error } = await supabase
        .from('tax_returns')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Tax return deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting tax return: ${error.message}`);
    }
  }
};

module.exports = TaxReturn;
