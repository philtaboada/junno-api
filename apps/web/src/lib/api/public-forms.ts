import type {
  PublicFormDto,
  SubmitFormRequestDto,
  SubmitFormResponseDto,
} from '@pm/contracts';
import { API_BASE_URL } from '@/lib/api/config';
import { resolveApiErrorMessage } from '@/lib/api/error-messages';
import { ApiError } from '@/lib/api/client';

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return null;
  }
  return response.json();
}

export async function fetchPublicForm(publicSlug: string): Promise<PublicFormDto> {
  const response = await fetch(`${API_BASE_URL}/public/forms/${publicSlug}`, {
    method: 'GET',
  });
  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new ApiError(
      resolveApiErrorMessage(payload, response.status),
      response.status,
      payload,
    );
  }
  return payload as PublicFormDto;
}

export async function submitPublicForm(
  publicSlug: string,
  input: SubmitFormRequestDto,
): Promise<SubmitFormResponseDto> {
  const response = await fetch(`${API_BASE_URL}/public/forms/${publicSlug}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new ApiError(
      resolveApiErrorMessage(payload, response.status),
      response.status,
      payload,
    );
  }
  return payload as SubmitFormResponseDto;
}
