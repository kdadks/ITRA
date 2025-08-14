// Debug function to check environment variables
const { handleCORS, createResponse, createErrorResponse } = require('./utils');

exports.handler = async (event, context) => {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const envCheck = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      supabaseUrl: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'not set'
    };

    return createResponse(200, {
      message: 'Debug info',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug error:', error);
    return createErrorResponse(500, 'Debug function error', error.message);
  }
};
