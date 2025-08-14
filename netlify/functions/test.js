// Simple test function to isolate 502 issues
exports.handler = async (event, context) => {
  console.log('=== SIMPLE TEST FUNCTION STARTED ===');
  
  // Test basic functionality
  try {
    console.log('Testing basic response...');
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      console.log('Returning CORS preflight response');
      return {
        statusCode: 200,
        headers: headers,
        body: ''
      };
    }

    console.log('Environment variables test:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

    console.log('Testing require statements...');
    
    // Test each dependency individually
    let testResults = {};
    
    try {
      console.log('Testing bcryptjs...');
      const bcrypt = require('bcryptjs');
      testResults.bcrypt = 'OK';
      console.log('bcryptjs loaded successfully');
    } catch (bcryptError) {
      console.error('bcryptjs error:', bcryptError);
      testResults.bcrypt = bcryptError.message;
    }

    try {
      console.log('Testing jsonwebtoken...');
      const jwt = require('jsonwebtoken');
      testResults.jwt = 'OK';
      console.log('jsonwebtoken loaded successfully');
    } catch (jwtError) {
      console.error('jsonwebtoken error:', jwtError);
      testResults.jwt = jwtError.message;
    }

    try {
      console.log('Testing @supabase/supabase-js...');
      const { createClient } = require('@supabase/supabase-js');
      testResults.supabase = 'OK';
      console.log('@supabase/supabase-js loaded successfully');
    } catch (supabaseError) {
      console.error('@supabase/supabase-js error:', supabaseError);
      testResults.supabase = supabaseError.message;
    }

    console.log('All tests completed, sending response...');

    const response = {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        status: 'test_function_working',
        timestamp: new Date().toISOString(),
        event: {
          httpMethod: event.httpMethod,
          path: event.path,
          headers: Object.keys(event.headers || {}),
          hasBody: !!event.body
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
          hasJwtSecret: !!process.env.JWT_SECRET
        },
        dependencies: testResults,
        function: {
          region: process.env.AWS_REGION || 'unknown',
          runtime: process.version,
          memory: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 'unknown'
        }
      }, null, 2)
    };

    console.log('Response prepared, returning...');
    return response;

  } catch (error) {
    console.error('=== ERROR IN TEST FUNCTION ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Test function failed',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
};
