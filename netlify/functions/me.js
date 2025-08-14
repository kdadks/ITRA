// Netlify Function: Get Current User
const { supabase, handleCORS, verifyToken, createResponse, createErrorResponse } = require('./utils');

exports.handler = async (event, context) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    // Verify JWT token
    const decoded = verifyToken(event);

    // Get user from database
    const { data: user, error: findError } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        role,
        profile_completion,
        personal_info,
        preferences,
        subscription,
        is_verified,
        last_login,
        created_at
      `)
      .eq('id', decoded.userId)
      .single();

    if (findError || !user) {
      return createErrorResponse(404, 'User not found');
    }

    // Return user data
    return createResponse(200, {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileCompletion: user.profile_completion,
        personalInfo: JSON.parse(user.personal_info || '{}'),
        isVerified: user.is_verified,
        preferences: JSON.parse(user.preferences || '{}'),
        subscription: JSON.parse(user.subscription || '{}'),
        lastLogin: user.last_login,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return createErrorResponse(401, error.message);
    }
    console.error('Get user error:', error);
    return createErrorResponse(500, 'Server error');
  }
};
