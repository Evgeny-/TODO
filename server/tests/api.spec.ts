import { test, expect, APIRequestContext } from '@playwright/test';
import { AuthRequest, AuthResponse } from '../src/routes/auth';
import { CollectionCreateResponse } from '../src/routes/collections';
import {
  CreateTodoRequest,
  CreateTodoResponse,
  UpdateTodoRequest,
  UpdateTodoResponse,
} from '../src/routes/todos';
import { ErrorResponse } from '../src/utils/error-handler';

const E2E_USERNAME = 'E2E_USERNAME';

test.describe('API', () => {
  test('authorizes', async ({ request }) => {
    const { token, user } = await login(request, E2E_USERNAME);
    expect(token).toBeTruthy();
    expect(user.name).toBe(E2E_USERNAME);
  });

  test('creates a collection', async ({ request }) => {
    const { token } = await login(request, E2E_USERNAME);
    const data = await createCollection(request, token);

    expect(data.success).toBeTruthy();
    expect(data.collection.key).toBeTruthy();
  });

  test('creates and updates TODO', async ({ request }) => {
    const { token } = await login(request, E2E_USERNAME);
    const { collection } = await createCollection(request, token);

    const createPayload: CreateTodoRequest = {
      text: 'Test TODO',
      status: 'TODO',
      collectionKey: collection.key,
    };

    const response = await request.post(`/todos`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: createPayload,
    });

    expect(response.ok()).toBeTruthy();

    const data = (await response.json()) as CreateTodoResponse;

    expect(data.success).toBeTruthy();
    expect(data.todo.id).toBeTruthy();
    expect(data.todo.text).toBe('Test TODO');

    const updatePayload: UpdateTodoRequest = {
      text: 'Updated text',
      status: 'ONGOING',
      assignedTo: data.todo.assignedToId,
    };

    const updateResponse = await request.patch(`/todos/${data.todo.id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: updatePayload,
    });

    expect(updateResponse.ok()).toBeTruthy();

    const updateData = (await updateResponse.json()) as UpdateTodoResponse;

    expect(updateData.success).toBeTruthy();
    expect(updateData.todo.text).toBe('Updated text');
  });

  test('fails to change TODO status', async ({ request }) => {
    const { token } = await login(request, E2E_USERNAME);
    const { collection } = await createCollection(request, token);

    const createPayload: CreateTodoRequest = {
      text: 'Test TODO',
      status: 'TODO',
      collectionKey: collection.key,
    };

    const response = await request.post(`/todos`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: createPayload,
    });

    expect(response.ok()).toBeTruthy();

    const data = (await response.json()) as CreateTodoResponse;

    expect(data.success).toBeTruthy();
    expect(data.todo.text).toBe('Test TODO');

    const updatePayload: UpdateTodoRequest = {
      text: 'Updated text',
      status: 'DONE',
      assignedTo: data.todo.assignedToId,
    };

    const updateResponse = await request.patch(`/todos/${data.todo.id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: updatePayload,
    });

    expect(updateResponse.ok()).toBeFalsy();

    const updateData = (await updateResponse.json()) as ErrorResponse;

    expect(updateData.error).toBe('Invalid status change');
  });
});

export async function login(
  request: APIRequestContext,
  username: string,
): Promise<AuthResponse> {
  const authPayload: AuthRequest = { name: username };

  const response = await request.post(`/auth`, {
    headers: { 'Content-Type': 'application/json' },
    data: authPayload,
  });

  if (!response.ok()) {
    throw new Error(`Auth failed with status ${response.status()}`);
  }

  const data: AuthResponse = await response.json();
  return data;
}

export async function createCollection(
  request: APIRequestContext,
  token: string,
): Promise<CollectionCreateResponse> {
  const response = await request.post(`/collections`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Collection creation failed with status ${response.status()}`,
    );
  }

  const data: CollectionCreateResponse = await response.json();
  return data;
}
