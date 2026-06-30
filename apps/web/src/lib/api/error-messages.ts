const API_ERROR_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'Email o contraseña incorrectos',
  'Email already registered': 'Este email ya está registrado',
  'Refresh token missing': 'Sesión expirada. Inicia sesión de nuevo',
  'Invalid refresh token': 'Sesión expirada. Inicia sesión de nuevo',
  'Invalid token type': 'Sesión no válida. Inicia sesión de nuevo',
  'User not found': 'Usuario no encontrado',
  'Request failed': 'Ha ocurrido un error. Inténtalo de nuevo',
  'email must be an email': 'Introduce un email válido',
  'password must be longer than or equal to 8 characters':
    'La contraseña debe tener al menos 8 caracteres',
  'name must be longer than or equal to 2 characters':
    'El nombre debe tener al menos 2 caracteres',
  'El enlace de recuperación no es válido o ha expirado':
    'El enlace de recuperación no es válido o ha expirado',
};

function translateApiErrorMessage(message: string): string {
  return API_ERROR_MESSAGES[message] ?? message;
}

function extractRawMessage(payload: unknown): string | string[] | null {
  if (typeof payload !== 'object' || payload === null || !('message' in payload)) {
    return null;
  }
  const message = payload.message;
  if (typeof message === 'string' || Array.isArray(message)) {
    return message;
  }
  return null;
}

export function resolveApiErrorMessage(payload: unknown, status: number): string {
  const rawMessage = extractRawMessage(payload);
  if (Array.isArray(rawMessage)) {
    return rawMessage.map(translateApiErrorMessage).join('. ');
  }
  if (typeof rawMessage === 'string') {
    return translateApiErrorMessage(rawMessage);
  }
  if (status === 401) {
    return 'Email o contraseña incorrectos';
  }
  return 'Ha ocurrido un error. Inténtalo de nuevo';
}
