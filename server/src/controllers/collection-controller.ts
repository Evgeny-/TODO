import { humanId } from 'human-id';
import { db } from '../db';

export async function createCollection({ userId }: { userId: string }) {
  const id = humanId({ separator: '-' });

  const newCollection = await db.todoCollection.create({
    data: {
      key: id,
      createdBy: {
        connect: {
          id: userId,
        },
      },
    },
  });

  return newCollection;
}
