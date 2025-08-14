// Netlify Function: User Registration
const { supabase, handleCORS, createResponse, createErrorResponse } = require('./utils');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

exports.handler = async (event, context) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    // Log environment check
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET
    });

    const requestBody = JSON.parse(event.body);
    console.log('Registration attempt for:', requestBody.email);

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      pan,
      aadhar,
      dateOfBirth,
      address
    } = requestBody;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !phone) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse(400, 'Invalid email format');
    }

    // Validate password strength
    if (password.length < 6) {
      return createErrorResponse(400, 'Password must be at least 6 characters');
    }

    // Validate PAN format
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      return createErrorResponse(400, 'Invalid PAN format');
    }

    // Validate Aadhar format
    if (aadhar && (aadhar.length !== 12 || !/^\d{12}$/.test(aadhar))) {
      return createErrorResponse(400, 'Invalid Aadhar format');
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return createErrorResponse(400, 'User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone,
      role: 'user',
      profile_completion: 60,
      personal_info: JSON.stringify({
        pan: pan || '',
        aadhar: aadhar || '',
        dateOfBirth: dateOfBirth || '',
        address: address || {}
      }),
      preferences: JSON.stringify({}),
      subscription: JSON.stringify({
        plan: 'free',
        startDate: new Date().toISOString(),
        endDate: null,
        isActive: true
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert user into database
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (insertError) {
      console.error('Database insertion error:', insertError);
      return createErrorResponse(500, 'Failed to create user account');
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return success response
    return createResponse(201, {
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        profileCompletion: newUser.profile_completion
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return createErrorResponse(500, 'Server error during registration');
  }
};
