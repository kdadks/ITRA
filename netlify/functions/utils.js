// Netlify Functions utilities for ITR Assist
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

// Initialize Supabase with better error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  if (!process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY environment variable is not set');
  }
  
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  logger.info('Supabase client initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Supabase client', error.message);
  throw error;
}

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Handle CORS preflight requests
const handleCORS = (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }
  return null;
};

// JWT verification middleware
const verifyToken = (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Standard response helper
const createResponse = (statusCode, body, additionalHeaders = {}) => ({
  statusCode,
  headers: { ...corsHeaders, ...additionalHeaders },
  body: JSON.stringify(body),
});

// Error response helper with detailed logging
const createErrorResponse = (statusCode, message, error = null, additionalData = null) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  logger.error(`Error ${errorId}: ${message}`, {
    statusCode,
    error: error ? error.toString() : null,
    stack: error?.stack,
    additionalData
  });

  const response = {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      message,
      errorId,
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'production' ? undefined : error?.toString(),
      stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack
    }),
  };

  logger.debug('Error response created', response);
  return response;
};

module.exports = {
  supabase,
  corsHeaders,
  handleCORS,
  verifyToken,
  createResponse,
  createErrorResponse,
  logger,
};
