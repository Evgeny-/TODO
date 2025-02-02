import { Router } from 'express';
import { db } from '../db.js';
import { createCollection } from '../controllers/collection-controller.js';
import { Todo, TodoCollection, User } from '@prisma/client';
import { assertFound } from '../utils/asserts.js';

export const collectionsRouter = Router();

// Get user's collections

export type CollectionGetResponse = {
  collections: TodoCollection[];
};

collectionsRouter.get('/', async (_req, res) => {
  const collections = await db.todoCollection.findMany({
    where: {
      createdBy: {
        id: res.locals.user.userId,
      },
    },
  });

  res.json({
    collections,
  } satisfies CollectionGetResponse);
});

// Create a new collection

export type CollectionCreateResponse = {
  success: true;
  collection: TodoCollection;
};

collectionsRouter.post('/', async (_req, res) => {
  const collection = await createCollection({
    userId: res.locals.user.userId,
  });

  res.json({
    success: true,
    collection,
  } satisfies CollectionCreateResponse);
});

// Get collection

export type TodoWithUsers = Todo & {
  assignedTo: User;
  createdBy: User;
};

export type CollectionTodosResponse = TodoCollection & {
  todos: TodoWithUsers[];
};

collectionsRouter.get('/:key', async (req, res) => {
  const collection = await db.todoCollection.findFirst({
    where: {
      key: req.params.key,
    },
    include: {
      todos: {
        include: {
          assignedTo: true,
          createdBy: true,
        },
      },
    },
  });

  assertFound(collection, 'Collection not found');

  res.json({
    ...collection,
  } satisfies CollectionTodosResponse);
});
