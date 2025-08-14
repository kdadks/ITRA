// Enhanced logging utility for Netlify Functions
const logger = {
  log: (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      data
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (data) {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
    
    return logEntry;
  },

  info: (message, data = null) => logger.log('info', message, data),
  warn: (message, data = null) => logger.log('warn', message, data),
  error: (message, data = null) => logger.log('error', message, data),
  debug: (message, data = null) => logger.log('debug', message, data),

  // Log environment status
  logEnvironment: () => {
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      supabaseUrl: process.env.SUPABASE_URL ? 
        process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
      jwtSecretLength: process.env.JWT_SECRET ? 
        process.env.JWT_SECRET.length : 0
    };
    
    logger.info('Environment Status', envStatus);
    return envStatus;
  },

  // Log request details
  logRequest: (event) => {
    const requestInfo = {
      method: event.httpMethod,
      path: event.path,
      headers: {
        'content-type': event.headers['content-type'],
        'user-agent': event.headers['user-agent'],
        'origin': event.headers.origin,
        'referer': event.headers.referer
      },
      bodySize: event.body ? event.body.length : 0,
      hasBody: !!event.body
    };
    
    logger.info('Incoming Request', requestInfo);
    return requestInfo;
  }
};

module.exports = logger;
