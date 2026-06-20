export const REFRESH_COOKIE_NAME = 'pm_refresh_token';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const BCRYPT_ROUNDS = 12;
export const WORKSPACE_HEADER = 'x-workspace-id';
export const PASSWORD_RESET_SUCCESS_MESSAGE =
  'Si el email existe, recibirás instrucciones para restablecer tu contraseña.';
