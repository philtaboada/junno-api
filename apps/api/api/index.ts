import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../dist/src/vercel.js';

export default function apiHandler(
  request: VercelRequest,
  response: VercelResponse,
): ReturnType<typeof handler> {
  return handler(request, response);
}

export const config = {
  maxDuration: 30,
};
