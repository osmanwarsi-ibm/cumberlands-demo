/**
 * Test configuration helper - provides backend URL from environment
 */

const BACKEND_PORT = process.env.BACKEND_PORT || '8000';
const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1';

export const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
