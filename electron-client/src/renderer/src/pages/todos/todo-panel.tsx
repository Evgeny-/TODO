import { Box, Button, Flex } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@renderer/utils/request';
import type { CollectionTodosResponse } from '@server/routes/collections';
import type { UpdateTodoRequest } from '@server/routes/todos';
import { useCallback, useEffect, useMemo, useState } from 'react';
import classes from './todos.module.css';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useDisclosure } from '@mantine/hooks';
import TimeAgo from 'react-timeago';
import { AddTodoModal, EditTodoModal } from './todo-modals';
import { User, useTodoCollaboration } from '@renderer/utils/collaboration';

export type Todo = Omit<
  CollectionTodosResponse['todos'][number],
  'createdAt' | 'updatedAt'
> & {
  createdAt: string;
  updatedAt: string;
};

export enum TodoStatus {
  TODO = 'TODO',
  ONGOING = 'ONGOING',
  DONE = 'DONE',
}

export const todoStatusNames: Record<TodoStatus, string> = {
  [TodoStatus.TODO]: 'Todo',
  [TodoStatus.ONGOING]: 'Ongoing',
  [TodoStatus.DONE]: 'Done',
};

export const allowedStatusTransitions: Record<TodoStatus, TodoStatus[]> = {
  [TodoStatus.TODO]: [TodoStatus.ONGOING],
  [TodoStatus.ONGOING]: [TodoStatus.TODO, TodoStatus.DONE],
  [TodoStatus.DONE]: [TodoStatus.ONGOING],
};

export const panelStatusOrder = [
  TodoStatus.TODO,
  TodoStatus.ONGOING,
  TodoStatus.DONE,
];

export function TodoPanel({
  collection,
  updateCollection,
}: {
  collection: CollectionTodosResponse;
  updateCollection: () => void;
}) {
  const { isConnected, lockedTodos, activeUsers, lockTodo, unlockTodo } =
    useTodoCollaboration({
      collectionKey: collection.key,
      onTodoChange: (todo, action) => {
        setTodos((current) => {
          switch (action) {
            case 'create':
              return [...current, todo];
            case 'update':
              return current.map((t) => (t.id === todo.id ? todo : t));
            case 'delete':
              return current.filter((t) => t.id !== todo.id);
          }
        });
      },
    });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const [todos, setTodos] = useState<Todo[]>(
    (collection.todos ?? []) as {} as Todo[],
  );

  const [activeEditTodo, setActiveEditTodo] = useState<Todo | null>(null);
  const [addTodoStatus, setAddTodoStatus] = useState<TodoStatus | null>(null);

  const [isAddTodoOpen, { open: openAddTodo, close: closeAddTodo }] =
    useDisclosure();

  const [isEditTodoOpen, { open: openEditTodo, close: closeEditTodo }] =
    useDisclosure();

  const statusToTodos = useMemo(() => {
    const todosMap: Record<TodoStatus, Todo[]> = {
      [TodoStatus.TODO]: [],
      [TodoStatus.ONGOING]: [],
      [TodoStatus.DONE]: [],
    };

    todos.forEach((todo) => {
      todosMap[todo.status].push(todo);
    });

    for (const status of panelStatusOrder) {
      todosMap[status].sort((a, b) => (a.updatedAt > b.updatedAt ? 1 : -1));
    }

    return todosMap;
  }, [todos]);

  const handleDragEnd = useCallback(
    async (e: DragEndEvent) => {
      const todo = todos.find((todo) => todo.id === e.active.id);
      const newStatus = e.over?.id as TodoStatus | undefined;

      if (todo) {
        unlockTodo(todo.id);
      }

      if (!todo || !newStatus || todo.status === newStatus) {
        return;
      }

      if (!allowedStatusTransitions[todo.status].includes(newStatus)) {
        notifications.show({
          message: 'Incorrect status',
          color: 'orange',
        });
        return;
      }

      const todoSnapshot = { ...todo };

      // Optimistic update
      todo.status = newStatus;
      todo.updatedAt = new Date().toISOString();
      setTodos([...todos]);

      try {
        await changeTodoStatus(todo, newStatus);
      } catch (e) {
        // Revert on error
        todo.status = todoSnapshot.status;
        todo.updatedAt = todoSnapshot.updatedAt;
        setTodos([...todos]);

        notifications.show({
          title: 'Failed to update status',
          message: (e as Error).message,
          color: 'red',
        });
      }

      updateCollection();
    },
    [todos, updateCollection],
  );

  const handleDragStart = useCallback(
    (e: DragStartEvent) => {
      const todo = todos.find((todo) => todo.id === e.active.id);
      if (!todo) return;
      lockTodo(todo.id);
    },
    [isConnected],
  );

  const handleOpenTodo = useCallback((todo: Todo) => {
    lockTodo(todo.id);
    setActiveEditTodo(todo);
    setTimeout(openEditTodo);
  }, []);

  const handleOpenAddTodo = useCallback(
    (status: TodoStatus) => {
      setAddTodoStatus(status);
      openAddTodo();
    },
    [openAddTodo],
  );

  const handleCloseEditTodo = useCallback(() => {
    if (activeEditTodo) {
      unlockTodo(activeEditTodo.id);
    }
    closeEditTodo();
    setTimeout(() => setActiveEditTodo(null), 300); // Wait for modal to close
  }, [closeEditTodo, activeEditTodo]);

  useEffect(() => {
    setTodos(collection.todos as {} as Todo[]);
  }, [collection.todos]);

  return (
    <Box className={classes.todoPanel}>
      <Flex gap={10}>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {panelStatusOrder.map((status) => (
            <TodoColumn
              key={status}
              todos={statusToTodos[status]}
              status={status}
              lockedTodos={lockedTodos}
              onOpenAddTodo={handleOpenAddTodo}
              onOpenTodo={handleOpenTodo}
            />
          ))}
        </DndContext>
      </Flex>

      <Flex>
        <Box className={classes.todoPanelFooter} fz="sm" mt={10}>
          {isConnected ? (
            <Box className={isConnected ? classes.online : classes.offline}>
              {activeUsers.join(', ')} online
            </Box>
          ) : (
            'Connecting...'
          )}
        </Box>
      </Flex>

      <AddTodoModal
        isOpen={isAddTodoOpen}
        collection={collection.key}
        status={addTodoStatus}
        onClose={closeAddTodo}
        onAdd={updateCollection}
      />

      <EditTodoModal
        key={activeEditTodo?.id}
        lockedBy={activeEditTodo ? lockedTodos[activeEditTodo.id] : undefined}
        isOpen={isEditTodoOpen}
        todo={activeEditTodo}
        onClose={handleCloseEditTodo}
        onEdit={updateCollection}
      />
    </Box>
  );
}

function TodoColumn({
  todos,
  status,
  lockedTodos,
  onOpenAddTodo,
  onOpenTodo,
}: {
  todos: Todo[];
  status: TodoStatus;
  lockedTodos: Record<string, User>;
  onOpenAddTodo: (status: TodoStatus) => void;
  onOpenTodo: (todo: Todo) => void;
}) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: status,
  });

  const draggableTodoStatus = active?.data.current?.status;

  const shouldHighlightColumn =
    isOver &&
    draggableTodoStatus &&
    allowedStatusTransitions[draggableTodoStatus].includes(status);

  return (
    <Box
      className={classes.todoColumn}
      ref={setNodeRef}
      data-highlight={shouldHighlightColumn}
    >
      <Box className={classes.todoColumnHeader}>
        {todoStatusNames[status]}
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={() => onOpenAddTodo(status)}
        >
          + Add
        </Button>
      </Box>
      <Box className={classes.todoColumnContent}>
        {todos.map((todo) => (
          <Todo
            key={todo.id}
            todo={todo}
            onOpenTodo={onOpenTodo}
            isLocked={todo.id in lockedTodos}
          />
        ))}
      </Box>
    </Box>
  );
}

function Todo({
  todo,
  isLocked,
  onOpenTodo,
}: {
  todo: Todo;
  isLocked: boolean;
  onOpenTodo: (todo: Todo) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: todo.id,
      data: todo,
      disabled: isLocked,
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const isMoved = isDragging && transform?.x !== 0 && transform?.y !== 0;

  return (
    <Box
      className={classes.todo}
      ref={setNodeRef}
      style={style}
      data-e2e-id="todo"
      data-dragging={isMoved}
      data-locked={isLocked}
      onClick={() => onOpenTodo(todo)}
      {...attributes}
      {...listeners}
    >
      <Box className={classes.todoText}>{todo.text}</Box>
      <Box className={classes.todoMeta}>
        <TodoDate date={todo.updatedAt} />
        <Box>{todo.assignedTo.name}</Box>
      </Box>
    </Box>
  );
}

export function TodoDate({ date }: { date: string | Date }) {
  const parsedDate = useMemo(() => new Date(date), [date]);

  return <TimeAgo date={parsedDate} minPeriod={10} />;
}

async function changeTodoStatus(todo: Todo, newStatus: TodoStatus) {
  const body: UpdateTodoRequest = {
    text: todo.text,
    status: newStatus,
    assignedTo: todo.assignedTo.id,
  };

  await apiRequest(`/todos/${todo.id}`, 'PATCH', body);
}
