import 'dotenv/config';
// Override DB URL for test environment
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
