// Health check function for ITR Assist
const { supabase, handleCORS, createResponse, createErrorResponse, logger } = require('./utils');

exports.handler = async (event, context) => {
  logger.info('=== Health Check Started ===');
  
  try {
    // Handle CORS
    const corsResponse = handleCORS(event);
    if (corsResponse) return corsResponse;

    const startTime = Date.now();
    
    // Log environment status
    const envStatus = logger.logEnvironment();

    // Test Supabase connection
    let dbStatus = { connected: false, error: null };
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        dbStatus.error = error.message;
        logger.error('Database connection test failed', error);
      } else {
        dbStatus.connected = true;
        logger.info('Database connection test successful');
      }
    } catch (dbError) {
      dbStatus.error = dbError.message;
      logger.error('Database connection exception', dbError);
    }

    // Test JWT functionality
    let jwtStatus = { working: false, error: null };
    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET;
      
      if (!secret) {
        jwtStatus.error = 'JWT_SECRET not configured';
      } else {
        const testToken = jwt.sign({ test: true }, secret, { expiresIn: '1m' });
        const decoded = jwt.verify(testToken, secret);
        jwtStatus.working = !!decoded.test;
      }
      
      logger.info('JWT test completed', jwtStatus);
    } catch (jwtError) {
      jwtStatus.error = jwtError.message;
      logger.error('JWT test failed', jwtError);
    }

    // Test bcrypt functionality
    let bcryptStatus = { working: false, error: null };
    try {
      const bcrypt = require('bcryptjs');
      const testHash = await bcrypt.hash('test', 10);
      const testVerify = await bcrypt.compare('test', testHash);
      bcryptStatus.working = testVerify;
      
      logger.info('bcrypt test completed', bcryptStatus);
    } catch (bcryptError) {
      bcryptStatus.error = bcryptError.message;
      logger.error('bcrypt test failed', bcryptError);
    }

    const executionTime = Date.now() - startTime;

    const healthData = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      executionTime: `${executionTime}ms`,
      environment: envStatus,
      services: {
        database: dbStatus,
        jwt: jwtStatus,
        bcrypt: bcryptStatus
      },
      function: {
        region: process.env.AWS_REGION || 'unknown',
        runtime: process.version,
        memory: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 'unknown'
      }
    };

    logger.info('Health check completed', { 
      executionTime: `${executionTime}ms`,
      allGreen: dbStatus.connected && jwtStatus.working && bcryptStatus.working
    });

    return createResponse(200, healthData);

  } catch (error) {
    logger.error('Health check failed', error);
    return createErrorResponse(500, 'Health check failed', error);
  }
};
