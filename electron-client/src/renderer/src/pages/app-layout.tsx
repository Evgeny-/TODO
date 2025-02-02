import { Anchor, Box } from '@mantine/core';
import { Outlet, useNavigate } from 'react-router';
import { useMantineColorScheme, Group } from '@mantine/core';
import { upperFirst } from '@mantine/hooks';
import { getJwtAuthToken, setJwtAuthToken } from '@renderer/utils/user-storage';
import { useCallback } from 'react';

function Footer() {
  const nav = useNavigate();
  const { setColorScheme, colorScheme } = useMantineColorScheme();

  const setNextScheme = () => {
    const newTheme =
      colorScheme === 'light'
        ? 'dark'
        : colorScheme === 'dark'
          ? 'auto'
          : 'light';

    setColorScheme(newTheme);
  };

  const hasJwtToken = !!getJwtAuthToken();

  const logout = useCallback(() => {
    setJwtAuthToken(null);
    nav('/');
  }, [nav]);

  const openNewWindow = useCallback(() => {
    window.electron.ipcRenderer.send('open-new-window');
  }, []);

  return (
    <Group mx={20} align="center">
      <Anchor onClick={setNextScheme}>{upperFirst(colorScheme)} theme</Anchor>
      {hasJwtToken && <Anchor onClick={logout}>Change user</Anchor>}
      <Anchor onClick={openNewWindow}>New window</Anchor>
    </Group>
  );
}

export function AppLayout() {
  return (
    <Box>
      <Box miw="100vw" mih="calc(100vh - 40px)" p={20}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}
