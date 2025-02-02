import { WebSocketServer, WebSocket } from 'ws';
import { validateJwtToken } from './controllers/auth-controller';
import { ensureTruthy } from './utils/asserts';
import { TodoWithUsers } from './routes/collections';

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  userName?: string;
  collectionKey?: string;
}

enum IncomingMessageType {
  JOIN_COLLECTION = 'JOIN_COLLECTION',
  UNLOCK_TODO = 'UNLOCK_TODO',
  LOCK_TODO = 'LOCK_TODO',
}

enum OutgoingMessageType {
  LOCKS_UPDATED = 'LOCKS_UPDATED',
  TODO_UPDATED = 'TODO_UPDATED',
  ACTIVE_USERS_UPDATED = 'ACTIVE_USERS_UPDATED',
}

type CollectionData = {
  locks: Record<string, string>;
};

const collections: Record<string, CollectionData> = {};
let activeWss: WebSocketServer;

export function setupWebSocket(wss: WebSocketServer) {
  activeWss = wss;

  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    console.log('New WS client connected');

    const url = new URL(req.url || '', 'http://localhost');
    const jwtToken = url.searchParams.get('token');
    const user = jwtToken && validateJwtToken(jwtToken);

    if (!user) {
      ws.close();
      return;
    }

    ws.userId = user.userId;
    ws.userName = user.name;

    ws.on('message', (data) => {
      try {
        const parsedData = JSON.parse(data.toString());
        handleMessage(ws, parsedData);
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    ws.on('close', () => {
      if (ws.collectionKey) {
        releaseTodoLocks(ws);
        updateActiveUsers(ws.collectionKey);
      }

      console.log('WS client disconnected');
    });
  });
}

function handleMessage(ws: ExtendedWebSocket, message: Record<string, any>) {
  console.log('Received message:', message);

  switch (message.type) {
    case IncomingMessageType.JOIN_COLLECTION: {
      const collectionKey = ensureTruthy(
        message.collectionKey,
        'Collection key is required',
      );
      ws.collectionKey = collectionKey;
      updateActiveUsers(collectionKey);
      break;
    }
    case IncomingMessageType.LOCK_TODO: {
      const todoId = ensureTruthy(message.todoId, 'Todo ID is required');
      const collectionKey = ensureTruthy(
        message.collectionKey,
        'Collection key is required',
      );
      const collection = getCollection(collectionKey);
      if (collection.locks[todoId]) break;
      collection.locks[todoId] = ws.userName!;
      updateLocks(collectionKey);
      break;
    }
    case IncomingMessageType.UNLOCK_TODO: {
      const todoId = ensureTruthy(message.todoId, 'Todo ID is required');
      const collectionKey = ensureTruthy(
        message.collectionKey,
        'Collection key is required',
      );
      const collection = getCollection(collectionKey);
      if (collection.locks[todoId] !== ws.userName) break;
      delete collection.locks[todoId];
      updateLocks(collectionKey);
      break;
    }
  }
}

function getCollection(collectionKey: string) {
  if (!collections[collectionKey]) {
    collections[collectionKey] = { locks: {} };
  }

  return collections[collectionKey];
}

function getCollectionWsClients(collectionKey: string) {
  const clients = Array.from(activeWss.clients) as ExtendedWebSocket[];
  return clients.filter((client) => client.collectionKey === collectionKey);
}

function updateActiveUsers(collectionKey: string) {
  const clients = getCollectionWsClients(collectionKey);
  const users = clients.map((client) => client.userName);

  clients.forEach((client) => {
    sendToClient(client, {
      type: OutgoingMessageType.ACTIVE_USERS_UPDATED,
      users,
    });
  });
}

function updateLocks(collectionKey: string) {
  const collection = getCollection(collectionKey);
  const clients = getCollectionWsClients(collectionKey);

  clients.forEach((client) => {
    const notClientLocks = Object.fromEntries(
      Object.entries(collection.locks).filter(
        ([, userName]) => userName !== client.userName,
      ),
    );

    sendToClient(client, {
      type: OutgoingMessageType.LOCKS_UPDATED,
      locks: notClientLocks,
    });
  });
}

function sendToClient(ws: ExtendedWebSocket, message: Record<string, any>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function releaseTodoLocks(ws: ExtendedWebSocket) {
  const collectionKey = ws.collectionKey;
  if (!collectionKey) return;

  const collection = getCollection(collectionKey);

  for (const todoId of Object.keys(collection.locks)) {
    if (collection.locks[todoId] === ws.userName) {
      delete collection.locks[todoId];
    }
  }
}

export function broadcastTodoUpdated(
  todo: TodoWithUsers,
  action: 'create' | 'update' | 'delete',
) {
  const collectionKey = todo.collectionKey;
  const clients = getCollectionWsClients(collectionKey);

  clients.forEach((client) => {
    sendToClient(client, {
      type: OutgoingMessageType.TODO_UPDATED,
      todo,
      action,
    });
  });
}
