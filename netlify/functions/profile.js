// Netlify Function: Get User Profile
const { supabase, handleCORS, verifyToken, createResponse, createErrorResponse } = require('./utils');

exports.handler = async (event, context) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    // Verify JWT token
    const decoded = verifyToken(event);

    if (event.httpMethod === 'GET') {
      // Get user profile
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (findError || !user) {
        return createErrorResponse(404, 'User not found');
      }

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
          preferences: JSON.parse(user.preferences || '{}'),
          subscription: JSON.parse(user.subscription || '{}'),
        }
      });

    } else if (event.httpMethod === 'PUT') {
      // Update user profile
      const requestBody = JSON.parse(event.body);
      const { personalInfo, preferences } = requestBody;

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (personalInfo) {
        updateData.personal_info = JSON.stringify(personalInfo);
      }

      if (preferences) {
        updateData.preferences = JSON.stringify(preferences);
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', decoded.userId)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return createErrorResponse(500, 'Failed to update profile');
      }

      return createResponse(200, {
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          profileCompletion: updatedUser.profile_completion,
          personalInfo: JSON.parse(updatedUser.personal_info || '{}'),
          preferences: JSON.parse(updatedUser.preferences || '{}'),
        }
      });

    } else {
      return createErrorResponse(405, 'Method Not Allowed');
    }

  } catch (error) {
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return createErrorResponse(401, error.message);
    }
    console.error('Profile error:', error);
    return createErrorResponse(500, 'Server error');
  }
};
