import {
  Alert,
  Anchor,
  Box,
  Button,
  Flex,
  Loader,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiRequest, useApiRequest } from '@renderer/utils/request';
import type {
  CollectionCreateResponse,
  CollectionGetResponse,
} from '@server/routes/collections';
import { useCallback, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import classes from './collections.module.css';
import { getHotkeyHandler } from '@mantine/hooks';

export function Collections() {
  const nav = useNavigate();

  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isOpeningCollection, setIsOpeningCollection] = useState(false);

  const [collectionKey, setCollectionKey] = useState('');

  const {
    data: collectionData,
    error,
    isLoading: isGettingCollections,
  } = useApiRequest<CollectionGetResponse>('/collections');

  const createCollection = useCallback(async () => {
    setIsCreatingCollection(true);

    try {
      const res = await apiRequest<CollectionCreateResponse>(
        '/collections',
        'POST',
      );

      nav(`/collections/${res.collection.key}`);
    } catch (e) {
      notifications.show({
        title: 'Failed to create collection',
        message: (e as Error).message,
        color: 'red',
      });
    }

    setIsCreatingCollection(false);
  }, []);

  const handleOpenCollection = useCallback(async () => {
    setIsOpeningCollection(true);

    try {
      await apiRequest(`/collections/${collectionKey}`, 'GET');

      setCollectionKey('');

      nav(`/collections/${collectionKey}`);
    } catch (e) {
      notifications.show({
        message: 'Collection not found',
        color: 'red',
      });
    }

    setIsOpeningCollection(false);
  }, [collectionKey]);

  return (
    <>
      <h1>Collections</h1>
      {error && (
        <Alert title="Failed to load collections" color="red">
          {error.message}
        </Alert>
      )}

      <Flex w={300} direction="column">
        <TextInput
          label="Open existing collection"
          value={collectionKey}
          onChange={(e) => setCollectionKey(e.currentTarget.value)}
          placeholder="Enter key"
          onKeyDown={getHotkeyHandler([['Enter', handleOpenCollection]])}
        />

        <Button
          onClick={handleOpenCollection}
          disabled={!collectionKey}
          loading={isOpeningCollection}
          w="100%"
          mt={8}
        >
          Open
        </Button>

        <Box className={classes.separator}>Or create</Box>

        <Box>
          <Button
            onClick={createCollection}
            loading={isCreatingCollection}
            w="100%"
          >
            Create new collection
          </Button>
        </Box>

        {!!collectionData?.collections.length && (
          <Box className={classes.separator}>My collections</Box>
        )}
      </Flex>

      {isGettingCollections && (
        <Flex align="center" mt={10} gap={10}>
          <Loader size="xs" />
          Loading collections...
        </Flex>
      )}

      {!isGettingCollections &&
        collectionData?.collections.map((collection) => (
          <Box key={collection.key}>
            <Anchor component={NavLink} to={`/collections/${collection.key}`}>
              {collection.key}
            </Anchor>
          </Box>
        ))}
    </>
  );
}
