import {
  Alert,
  Box,
  Button,
  Flex,
  Modal,
  NativeSelect,
  Textarea,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@renderer/utils/request';
import type {
  CreateTodoRequest,
  CreateTodoResponse,
  UpdateTodoRequest,
} from '@server/routes/todos';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classes from './todos.module.css';
import {
  allowedStatusTransitions,
  panelStatusOrder,
  Todo,
  TodoStatus,
  todoStatusNames,
} from './todo-panel';
import { User } from '@renderer/utils/collaboration';
import { TodoDate } from '@renderer/utils/dates';

export function AddTodoModal({
  isOpen,
  status: defaultStatus,
  collection,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  status: TodoStatus | null;
  collection: string;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [newTodoText, setNewTodoText] = useState('');
  const [status, setStatus] = useState(defaultStatus ?? TodoStatus.TODO);
  const [isAdding, setIsAdding] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAdd = useCallback(async () => {
    if (!newTodoText || !status) {
      return;
    }

    setIsAdding(true);

    const body: CreateTodoRequest = {
      text: newTodoText,
      status,
      collectionKey: collection,
    };

    try {
      await apiRequest<CreateTodoResponse>('/todos', 'POST', body);
      onAdd();
      onClose();

      notifications.show({
        message: 'Todo added',
        color: 'green',
      });
    } catch (e) {
      notifications.show({
        title: 'Failed to add todo',
        message: (e as Error).message,
        color: 'red',
      });
    }

    setIsAdding(false);
  }, [newTodoText, status, collection, onAdd]);

  useEffect(() => {
    if (isOpen) {
      setStatus(defaultStatus ?? TodoStatus.TODO);
    }
  }, [status, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setNewTodoText('');
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return (
    <Modal title="Add todo" opened={isOpen} onClose={onClose} centered>
      <Flex direction="column" gap={4}>
        <NativeSelect
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.currentTarget.value as TodoStatus)}
        >
          {panelStatusOrder.map((status) => (
            <option key={status} value={status}>
              {todoStatusNames[status]}
            </option>
          ))}
        </NativeSelect>

        <Textarea
          label="TODO"
          ref={textareaRef}
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.currentTarget.value)}
        />
      </Flex>

      <Box mt="sm">
        <Button onClick={handleAdd} disabled={!newTodoText} loading={isAdding}>
          Add todo
        </Button>
      </Box>
    </Modal>
  );
}

export function EditTodoModal({
  isOpen,
  todo,
  lockedBy,
  onClose,
  onEdit,
}: {
  isOpen: boolean;
  todo: Todo | null;
  lockedBy: User | undefined;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const [text, setText] = useState(todo?.text);
  const [status, setStatus] = useState(todo?.status);

  const allowedStatuses = useMemo(
    () => (todo ? [...allowedStatusTransitions[todo.status], todo.status] : []),
    [todo],
  );

  const handleSave = useCallback(async () => {
    if (!todo || !text || !status) {
      return;
    }

    setIsLoading(true);

    const body: UpdateTodoRequest = {
      text,
      status,
      assignedTo: todo.assignedTo.id,
    };

    try {
      await apiRequest(`/todos/${todo.id}`, 'PATCH', body);

      onEdit();
      onClose();

      notifications.show({
        message: 'Todo updated',
        color: 'green',
      });
    } catch (e) {
      notifications.show({
        title: 'Failed to save todo',
        message: (e as Error).message,
        color: 'red',
      });
    }

    setIsLoading(false);
  }, [todo, text, status, onEdit, onClose]);

  const handleDelete = useCallback(async () => {
    if (!todo) return;

    setIsLoading(true);

    try {
      await apiRequest(`/todos/${todo.id}`, 'DELETE');

      onEdit();
      onClose();

      notifications.show({
        message: 'Todo deleted',
        color: 'green',
      });
    } catch (e) {
      notifications.show({
        title: 'Failed to delete todo',
        message: (e as Error).message,
        color: 'red',
      });
    }

    setIsLoading(false);
  }, [todo, onEdit, onClose]);

  return (
    <Modal title="Edit todo" opened={isOpen} onClose={onClose} centered>
      <Flex direction="column" gap={4}>
        <NativeSelect
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.currentTarget.value as TodoStatus)}
        >
          {panelStatusOrder.map((status) => (
            <option
              key={status}
              value={status}
              disabled={!allowedStatuses.includes(status)}
            >
              {todoStatusNames[status]}
            </option>
          ))}
        </NativeSelect>

        <Textarea
          label="TODO"
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          autosize
        />

        <TextInput label="Assigned to" value={todo?.assignedTo.name} disabled />

        <Flex
          align="flex-start"
          gap={20}
          className={classes.todoModalMeta}
          mt={4}
        >
          <Box>
            <b>Created by</b>
            <Box>{todo?.createdBy.name}</Box>
          </Box>
          <Box>
            <b>Created</b>
            <Box>
              <TodoDate date={todo?.createdAt!} />
            </Box>
          </Box>
          <Box>
            <b>Updated</b>
            <Box>
              <TodoDate date={todo?.updatedAt!} />
            </Box>
          </Box>
        </Flex>
      </Flex>

      {lockedBy && (
        <Alert color="orange" my="sm">
          This todo is currently being edited by {lockedBy}
        </Alert>
      )}

      <Flex mt="sm" align="center" justify="space-between">
        <Button
          onClick={handleSave}
          disabled={!text || !!lockedBy}
          loading={isLoading}
        >
          Save changes
        </Button>

        <Button
          variant="light"
          color="red"
          onClick={handleDelete}
          disabled={isLoading || !!lockedBy}
        >
          Delete
        </Button>
      </Flex>
    </Modal>
  );
}
