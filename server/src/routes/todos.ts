import { Router } from 'express';
import { assertFound, assertSchema } from '../utils/asserts.js';
import {
  createTodo,
  CreateTodoBody,
  createTodoSchema,
  deleteTodo,
  getTodoWithUsers,
  updateTodo,
  UpdateTodoBody,
  updateTodoSchema,
} from '../controllers/todo-controller.js';
import { Todo } from '@prisma/client';
import { broadcastTodoUpdated } from '../ws.js';

export const todosRouter = Router();

// Create a new todo

export type CreateTodoRequest = CreateTodoBody;

export type CreateTodoResponse = {
  success: true;
  todo: Todo;
};

todosRouter.post('/', async (req, res) => {
  assertSchema(req.body, createTodoSchema);

  const todo = await createTodo(req.body, res.locals.user.userId);

  res.json({
    success: true,
    todo,
  } satisfies CreateTodoResponse);

  broadcastTodoUpdated(await getTodoWithUsers(todo.id), 'create');
});

// Update

export type UpdateTodoRequest = UpdateTodoBody;

export type UpdateTodoResponse = {
  success: true;
  todo: Todo;
};

todosRouter.patch('/:id', async (req, res) => {
  assertSchema(req.body, updateTodoSchema);

  const { id } = req.params;

  const todo = await updateTodo(id, req.body);

  res.json({
    success: true,
    todo,
  } satisfies UpdateTodoResponse);

  broadcastTodoUpdated(await getTodoWithUsers(id), 'update');
});

// Delete

export type DeleteTodoResponse = {
  success: true;
};

todosRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const todo = await getTodoWithUsers(id);
  assertFound(todo, 'Todo not found');

  await deleteTodo(id);

  res.json({
    success: true,
  } satisfies DeleteTodoResponse);

  broadcastTodoUpdated(todo, 'delete');
});
