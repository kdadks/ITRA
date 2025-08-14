// Netlify Function: Get Current User
const { supabase, handleCORS, verifyToken, createResponse, createErrorResponse, logger } = require('./utils');

exports.handler = async (event, context) => {
  logger.info('=== Get Current User Function Started ===');
  
  try {
    // Handle CORS
    const corsResponse = handleCORS(event);
    if (corsResponse) return corsResponse;

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
      return createErrorResponse(405, 'Method Not Allowed');
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = verifyToken(event);
      logger.info('Token verified successfully', { userId: decoded.userId });
    } catch (tokenError) {
      logger.warn('Token verification failed', tokenError.message);
      return createErrorResponse(401, tokenError.message);
    }

    // Get user from database with updated schema fields
    const { data: user, error: findError } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        pan,
        aadhar,
        address,
        role,
        is_verified,
        profile_completion,
        subscription_plan,
        subscription_start_date,
        subscription_end_date,
        subscription_is_active,
        preferences,
        last_login,
        created_at,
        updated_at
      `)
      .eq('id', decoded.userId)
      .single();

    if (findError) {
      logger.error('Database error finding user', findError);
      return createErrorResponse(404, 'User not found', findError);
    }

    if (!user) {
      logger.warn('User not found in database', { userId: decoded.userId });
      return createErrorResponse(404, 'User not found');
    }

    logger.info('User found successfully', { userId: user.id });

    // Update last_login timestamp
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);
      logger.debug('Last login updated');
    } catch (updateError) {
      logger.warn('Failed to update last login', updateError);
      // Don't fail the request for this
    }

    // Return user data with proper schema mapping
    const responseData = {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        pan: user.pan,
        aadhar: user.aadhar ? 'XXXX-XXXX-' + user.aadhar.slice(-4) : null, // Masked for security
        address: user.address || {},
        role: user.role,
        isVerified: user.is_verified,
        profileCompletion: user.profile_completion,
        subscription: {
          plan: user.subscription_plan,
          startDate: user.subscription_start_date,
          endDate: user.subscription_end_date,
          isActive: user.subscription_is_active
        },
        preferences: user.preferences || {
          notifications: true,
          language: 'en',
          theme: 'light'
        },
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    };

    logger.info('User data prepared successfully');
    return createResponse(200, responseData);

  } catch (error) {
    logger.error('Get user function failed', error);
    return createErrorResponse(500, 'Server error', error);
  }
};
