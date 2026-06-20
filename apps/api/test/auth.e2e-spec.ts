import request from 'supertest';
import type { App } from 'supertest/types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://127.0.0.1:3000';

describe('Auth (e2e)', () => {
  const testEmail = `user-${Date.now()}@example.com`;
  let refreshCookie: string;
  let resetToken: string;
  const newPassword = 'newpassword123';

  beforeAll(async () => {
    await request(API_BASE_URL as App)
      .get('/api/v1/health')
      .expect(200);
  });

  it('registers a user with personal workspace', async () => {
    const response = await request(API_BASE_URL as App)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'password123',
        name: 'Test User',
      })
      .expect(201);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.workspaces).toHaveLength(1);
    expect(response.body.workspaces[0].role).toBe('admin');
    const cookies = response.headers['set-cookie'];
    expect(cookies?.some((cookie) => cookie.startsWith('pm_refresh_token='))).toBe(true);
    refreshCookie = cookies?.find((cookie) => cookie.startsWith('pm_refresh_token=')) ?? '';
  });

  it('logs in with valid credentials', async () => {
    const response = await request(API_BASE_URL as App)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      })
      .expect(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe(testEmail);
  });

  it('refreshes session using httpOnly cookie', async () => {
    const response = await request(API_BASE_URL as App)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.workspaces).toHaveLength(1);
  });

  it('returns current user profile', async () => {
    const loginResponse = await request(API_BASE_URL as App)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      })
      .expect(200);
    const response = await request(API_BASE_URL as App)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.workspaces).toHaveLength(1);
  });

  it('requests password reset', async () => {
    const response = await request(API_BASE_URL as App)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testEmail })
      .expect(200);
    expect(response.body.message).toContain('Si el email existe');
    if (response.body.resetUrl) {
      const resetUrl = response.body.resetUrl as string;
      resetToken = new URL(resetUrl).searchParams.get('token') ?? '';
      expect(resetToken.length).toBeGreaterThan(0);
    }
  });

  it('resets password with valid token', async () => {
    if (!resetToken) {
      return;
    }
    const response = await request(API_BASE_URL as App)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        password: newPassword,
      })
      .expect(200);
    expect(response.body.message).toContain('Contraseña actualizada');
  });

  it('logs in with the new password', async () => {
    if (!resetToken) {
      return;
    }
    const response = await request(API_BASE_URL as App)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: newPassword,
      })
      .expect(200);
    expect(response.body.accessToken).toBeDefined();
  });

  it('rejects login with old password', async () => {
    if (!resetToken) {
      return;
    }
    await request(API_BASE_URL as App)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      })
      .expect(401);
  });
});
