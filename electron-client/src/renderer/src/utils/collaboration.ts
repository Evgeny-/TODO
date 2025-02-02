import { Todo } from '@renderer/pages/todos/todo-panel';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getJwtAuthToken } from './user-storage';

export type User = string;

enum IncomingMessageType {
  LOCKS_UPDATED = 'LOCKS_UPDATED',
  TODO_UPDATED = 'TODO_UPDATED',
  ACTIVE_USERS_UPDATED = 'ACTIVE_USERS_UPDATED',
}

enum OutgoingMessageType {
  JOIN_COLLECTION = 'JOIN_COLLECTION',
  UNLOCK_TODO = 'UNLOCK_TODO',
  LOCK_TODO = 'LOCK_TODO',
}

export function useTodoCollaboration({
  collectionKey,
  onTodoChange,
}: {
  collectionKey: string;
  onTodoChange: (todo: Todo, action: 'create' | 'update' | 'delete') => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lockedTodos, setLockedTodos] = useState<Record<string, User>>({});
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const sendEvent = (event: Record<string, any>) => {
    const isWsReady =
      wsRef.current && wsRef.current.readyState === WebSocket.OPEN;

    if (isWsReady) {
      wsRef.current?.send(JSON.stringify(event));
    }
  };

  useEffect(() => {
    const jwtToken = getJwtAuthToken();

    const ws = new WebSocket(`${window.env.WS_URL}?token=${jwtToken}`);

    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      sendEvent({ type: OutgoingMessageType.JOIN_COLLECTION, collectionKey });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WS message:', data);

        switch (data.type) {
          case IncomingMessageType.TODO_UPDATED:
            onTodoChange(data.todo, data.action);
            break;
          case IncomingMessageType.LOCKS_UPDATED:
            setLockedTodos(data.locks);
            break;
          case IncomingMessageType.ACTIVE_USERS_UPDATED:
            setActiveUsers(data.users);
            break;
          default:
            console.log('Unknown message type:', data.type);
            break;
        }
      } catch (error) {
        console.error('Failed to parse WS message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      ws.close();
    };
  }, [collectionKey]);

  const lockTodo = useCallback(
    (todoId: string) => {
      sendEvent({
        type: OutgoingMessageType.LOCK_TODO,
        todoId,
        collectionKey,
      });
    },
    [collectionKey],
  );

  const unlockTodo = useCallback(
    (todoId: string) => {
      sendEvent({
        type: OutgoingMessageType.UNLOCK_TODO,
        todoId,
        collectionKey,
      });
    },
    [collectionKey],
  );

  return {
    isConnected,
    lockedTodos,
    activeUsers,
    lockTodo,
    unlockTodo,
  };
}
