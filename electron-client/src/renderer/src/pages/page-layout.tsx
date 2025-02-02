import { Box } from '@mantine/core';
import { Outlet } from 'react-router';

export function PageLayout() {
  return (
    <Box>
      <Outlet />
    </Box>
  );
}
