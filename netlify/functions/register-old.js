// Netlify Function: User Registration
const { supabase, handleCORS, createResponse, createErrorResponse, logger } = require('./utils');

let bcrypt, jwt;

// Initialize dependencies with error handling
try {
  bcrypt = require('bcryptjs');
  jwt = require('jsonwebtoken');
  logger.info('Dependencies loaded successfully');
} catch (error) {
  logger.error('Failed to load dependencies', error);
  throw error;
}

exports.handler = async (event, context) => {
  const startTime = Date.now();
  logger.info('=== Registration Function Started ===');
  
  try {
    // Log environment and request
    logger.logEnvironment();
    logger.logRequest(event);

    // Handle CORS
    const corsResponse = handleCORS(event);
    if (corsResponse) {
      logger.info('Returning CORS preflight response');
      return corsResponse;
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      logger.warn('Invalid HTTP method', { method: event.httpMethod });
      return createErrorResponse(405, 'Method Not Allowed');
    }

    // Parse request body
    let requestBody;
    try {
      if (!event.body) {
        logger.error('No request body provided');
        return createErrorResponse(400, 'Request body is required');
      }
      
      requestBody = JSON.parse(event.body);
      logger.info('Request body parsed successfully', { 
        hasEmail: !!requestBody.email,
        hasPassword: !!requestBody.password,
        hasFirstName: !!requestBody.firstName
      });
    } catch (parseError) {
      logger.error('Failed to parse request body', parseError);
      return createErrorResponse(400, 'Invalid JSON in request body', parseError);
    }

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

    // Comprehensive validation
    const validationErrors = [];
    
    if (!firstName?.trim()) validationErrors.push('firstName is required');
    if (!lastName?.trim()) validationErrors.push('lastName is required');
    if (!email?.trim()) validationErrors.push('email is required');
    if (!password) validationErrors.push('password is required');
    if (!phone?.trim()) validationErrors.push('phone is required');

    if (validationErrors.length > 0) {
      logger.warn('Validation failed', { errors: validationErrors });
      return createErrorResponse(400, 'Validation failed', null, { validationErrors });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Invalid email format', { email });
      return createErrorResponse(400, 'Invalid email format');
    }

    // Validate password strength
    if (password.length < 6) {
      logger.warn('Password too short', { length: password.length });
      return createErrorResponse(400, 'Password must be at least 6 characters');
    }

    // Validate PAN format if provided
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      logger.warn('Invalid PAN format', { pan });
      return createErrorResponse(400, 'Invalid PAN format');
    }

    // Validate Aadhar format if provided
    if (aadhar && (aadhar.length !== 12 || !/^\d{12}$/.test(aadhar))) {
      logger.warn('Invalid Aadhar format', { aadharLength: aadhar?.length });
      return createErrorResponse(400, 'Invalid Aadhar format');
    }

    logger.info('Validation passed, checking for existing user', { email });

    // Check if user already exists
    let existingUserCheck;
    try {
      existingUserCheck = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      
      logger.debug('User existence check completed', { 
        found: !!existingUserCheck.data,
        error: existingUserCheck.error?.message 
      });
    } catch (dbError) {
      logger.error('Database error during user check', dbError);
      return createErrorResponse(500, 'Database connection error', dbError);
    }

    if (existingUserCheck.data) {
      logger.warn('User already exists', { email });
      return createErrorResponse(400, 'User with this email already exists');
    }

    logger.info('User does not exist, proceeding with registration');

    // Hash password
    let hashedPassword;
    try {
      const saltRounds = 12;
      hashedPassword = await bcrypt.hash(password, saltRounds);
      logger.info('Password hashed successfully');
    } catch (hashError) {
      logger.error('Password hashing failed', hashError);
      return createErrorResponse(500, 'Failed to process password', hashError);
    }

    // Prepare user data
    const userData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
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

    logger.info('Inserting user into database', { email: userData.email });

    // Insert user into database
    let insertResult;
    try {
      insertResult = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      logger.debug('Database insert result', { 
        success: !!insertResult.data,
        error: insertResult.error?.message 
      });
    } catch (insertError) {
      logger.error('Database insertion failed', insertError);
      return createErrorResponse(500, 'Failed to create user account', insertError);
    }

    if (insertResult.error) {
      logger.error('Database insertion error', insertResult.error);
      return createErrorResponse(500, 'Failed to create user account', insertResult.error);
    }

    const newUser = insertResult.data;
    logger.info('User created successfully', { userId: newUser.id });

    // Create JWT token
    let token;
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET not configured');
        return createErrorResponse(500, 'Authentication configuration error');
      }

      token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        jwtSecret,
        { expiresIn: '7d' }
      );
      
      logger.info('JWT token created successfully');
    } catch (jwtError) {
      logger.error('JWT token creation failed', jwtError);
      return createErrorResponse(500, 'Authentication token creation failed', jwtError);
    }

    // Success response
    const responseData = {
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
    };

    const executionTime = Date.now() - startTime;
    logger.info('Registration completed successfully', { 
      userId: newUser.id, 
      executionTime: `${executionTime}ms` 
    });

    return createResponse(201, responseData);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Registration function failed', {
      error: error.message,
      stack: error.stack,
      executionTime: `${executionTime}ms`
    });
    
    return createErrorResponse(500, 'Server error during registration', error);
  }
};
