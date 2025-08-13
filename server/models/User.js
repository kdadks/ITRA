const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

const User = {
  // Create a new user
  create: async ({ 
    firstName, 
    lastName, 
    email, 
    password, 
    phone, 
    dateOfBirth, 
    pan, 
    aadhar,
    address = {},
    role = 'user' 
  }) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone,
          date_of_birth: dateOfBirth,
          pan: pan.toUpperCase(),
          aadhar,
          address: JSON.stringify(address),
          role,
          is_verified: false,
          profile_completion: 0,
          subscription_plan: 'free',
          subscription_is_active: true,
          preferences: JSON.stringify({
            notifications: true,
            language: 'en',
            theme: 'light'
          }),
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
      throw new Error(`Error creating user: ${error.message}`);
    }
  },

  // Find user by email
  findByEmail: async (email) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      if (error.message.includes('JSON object requested, multiple (or no) rows returned')) {
        return null;
      }
      throw new Error(`Error finding user: ${error.message}`);
    }
  },

  // Find user by ID
  findById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      if (error.message.includes('JSON object requested, multiple (or no) rows returned')) {
        return null;
      }
      throw new Error(`Error finding user: ${error.message}`);
    }
  },

  // Update user
  update: async (id, updates) => {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  },

  // Delete user
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  },

  // Get all users (admin only)
  findAll: async (filters = {}) => {
    try {
      let query = supabase.from('users').select('id, first_name, last_name, email, phone, role, is_verified, created_at, updated_at');

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.is_verified !== undefined) {
        query = query.eq('is_verified', filters.is_verified);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  },

  // Validate password
  validatePassword: async (password, hashedPassword) => {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error(`Error validating password: ${error.message}`);
    }
  }
};

module.exports = User;
