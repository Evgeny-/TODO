import { z } from 'zod';
import { db } from '../db';
import { TodoStatus } from '@prisma/client';
import { assert, assertFound } from '../utils/asserts';
import { TodoWithUsers } from '../routes/collections';

export const createTodoSchema = z.object({
  text: z.string(),
  status: z.nativeEnum(TodoStatus),
  collectionKey: z.string(),
});

export type CreateTodoBody = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = z.object({
  text: z.string(),
  status: z.nativeEnum(TodoStatus),
  assignedTo: z.string(),
});

export type UpdateTodoBody = z.infer<typeof updateTodoSchema>;

export async function createTodo(
  { text, status, collectionKey }: CreateTodoBody,
  userId: string,
) {
  const todo = await db.todo.create({
    data: {
      text,
      status,
      createdBy: {
        connect: {
          id: userId,
        },
      },
      assignedTo: {
        connect: {
          id: userId,
        },
      },
      collection: {
        connect: {
          key: collectionKey,
        },
      },
    },
  });

  return todo;
}

export async function updateTodo(
  id: string,
  { text, status, assignedTo }: UpdateTodoBody,
) {
  const todo = await getTodo(id);
  assertFound(todo, 'Todo not found');

  assert(isValidStatusChange(todo.status, status), 'Invalid status change');

  return await db.todo.update({
    where: { id },
    data: {
      text,
      status,
      assignedTo: {
        connect: {
          id: assignedTo,
        },
      },
    },
  });
}

export async function deleteTodo(id: string) {
  await db.todo.delete({
    where: { id },
  });
}

const statusChangeMap: Record<TodoStatus, TodoStatus[]> = {
  [TodoStatus.TODO]: [TodoStatus.ONGOING],
  [TodoStatus.ONGOING]: [TodoStatus.DONE, TodoStatus.TODO],
  [TodoStatus.DONE]: [TodoStatus.ONGOING],
};

function isValidStatusChange(from: TodoStatus, to: TodoStatus) {
  if (from === to) return true;
  return statusChangeMap[from].includes(to);
}

async function getTodo(id: string) {
  return await db.todo.findUnique({
    where: { id },
  });
}

export async function getTodoWithUsers(id: string): Promise<TodoWithUsers> {
  return (await db.todo.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      createdBy: true,
    },
  })) as TodoWithUsers;
}
