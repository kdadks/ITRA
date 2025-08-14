// Minimal register function for testing
exports.handler = async (event, context) => {
  console.log('=== MINIMAL REGISTER TEST ===');
  
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      console.log('CORS preflight for register-test');
      return {
        statusCode: 200,
        headers: headers,
        body: ''
      };
    }

    console.log('Method:', event.httpMethod);
    console.log('Has body:', !!event.body);
    console.log('Environment check:');
    console.log('- SUPABASE_URL:', !!process.env.SUPABASE_URL ? 'SET' : 'MISSING');
    console.log('- SUPABASE_SERVICE_KEY:', !!process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING');
    console.log('- JWT_SECRET:', !!process.env.JWT_SECRET ? 'SET' : 'MISSING');

    if (event.httpMethod !== 'POST') {
      console.log('Invalid method, returning 405');
      return {
        statusCode: 405,
        headers: headers,
        body: JSON.stringify({ message: 'Method not allowed' })
      };
    }

    if (!event.body) {
      console.log('No body provided');
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ message: 'Request body required' })
      };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body);
      console.log('Request data parsed, email:', requestData.email);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ message: 'Invalid JSON' })
      };
    }

    // Check if environment variables are missing
    const missingEnvVars = [];
    if (!process.env.SUPABASE_URL) missingEnvVars.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_KEY) missingEnvVars.push('SUPABASE_SERVICE_KEY');
    if (!process.env.JWT_SECRET) missingEnvVars.push('JWT_SECRET');

    if (missingEnvVars.length > 0) {
      console.error('Missing environment variables:', missingEnvVars);
      return {
        statusCode: 500,
        headers: headers,
        body: JSON.stringify({ 
          message: 'Server configuration error',
          missingEnvVars: missingEnvVars,
          timestamp: new Date().toISOString()
        })
      };
    }

    console.log('Basic validation passed, would proceed with registration...');

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        message: 'Minimal register test passed',
        received: {
          email: requestData.email,
          hasPassword: !!requestData.password,
          hasFirstName: !!requestData.firstName
        },
        environment: {
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
          hasJwtSecret: !!process.env.JWT_SECRET
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('=== ERROR IN MINIMAL REGISTER ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Minimal register failed',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
