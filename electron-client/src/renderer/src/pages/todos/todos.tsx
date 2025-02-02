import { Alert, Button, Flex, Loader } from '@mantine/core';
import { useApiRequest } from '@renderer/utils/request';
import type { CollectionTodosResponse } from '@server/routes/collections';
import { useNavigate, useParams } from 'react-router';
import { TodoPanel } from './todo-panel';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';

export function Todos() {
  const { key } = useParams();

  const {
    data: collectionData,
    error,
    isLoading: isGettingCollection,
    fetchData: updateCollection,
  } = useApiRequest<CollectionTodosResponse>(`/collections/${key}`);

  const nav = useNavigate();

  const copyCollectionKey = () => {
    navigator.clipboard.writeText(key!);

    notifications.show({
      message: 'Key copied to clipboard',
      color: 'blue',
    });
  };

  return (
    <>
      <Flex align="center" gap={10} mb={10}>
        <Button
          onClick={() => nav('/collections')}
          size="sm"
          variant="subtle"
          px={8}
        >
          <ArrowLeftIcon width={20} height={20} />
        </Button>

        <h1>{key}</h1>

        <Button
          onClick={copyCollectionKey}
          size="xs"
          variant="light"
          px={8}
          leftSection={<ClipboardIcon width={15} height={15} />}
        >
          Copy key
        </Button>
      </Flex>

      {error && (
        <Alert title="Error" color="red">
          {error.message || 'Failed to get todos'}
        </Alert>
      )}

      {collectionData && (
        <TodoPanel
          collection={collectionData}
          updateCollection={updateCollection}
        />
      )}

      {isGettingCollection && (
        <Flex align="center" mt={20} gap={10}>
          <Loader size="xs" />
          Loading...
        </Flex>
      )}
    </>
  );
}
