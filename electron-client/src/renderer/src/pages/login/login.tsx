import { Box, Button, TextInput } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@renderer/utils/request';
import { getJwtAuthToken, setJwtAuthToken } from '@renderer/utils/user-storage';
import type { AuthRequest, AuthResponse } from '@server/routes/auth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

export function Login() {
  const nav = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [name, setName] = useState('');

  const login = async () => {
    if (!name) return;

    setIsLoggingIn(true);

    try {
      const body: AuthRequest = { name };

      const res = await apiRequest<AuthResponse>('/auth', 'POST', body);

      setJwtAuthToken(res.token);

      nav('/collections');
    } catch (e) {
      notifications.show({
        title: 'Failed to login',
        message: (e as Error).message,
        color: 'red',
      });
    }

    setIsLoggingIn(false);
  };

  useEffect(() => {
    if (getJwtAuthToken()) {
      nav('/collections');
    }
  }, []);

  return (
    <Box>
      <h1>Login</h1>

      <Box w={300}>
        <TextInput
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          onKeyDown={getHotkeyHandler([['Enter', login]])}
          autoFocus
        />

        <Button
          onClick={login}
          disabled={!name}
          w="100%"
          mt={8}
          loading={isLoggingIn}
        >
          Login
        </Button>
      </Box>
    </Box>
  );
}
