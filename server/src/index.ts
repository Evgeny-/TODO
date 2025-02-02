import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { setupWebSocket } from './ws';

import { PORT } from './env';
import { expressErrorHandler } from './utils/error-handler';
import { collectionsRouter } from './routes/collections';
import { todosRouter } from './routes/todos';
import { authRouter } from './routes/auth';
import { authMiddleware } from './controllers/auth-controller';
// import listsRouter from './routes/lists';

dotenv.config();

const app = express();
const port = PORT ?? 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/auth', authRouter);
app.use('/collections', authMiddleware, collectionsRouter);
app.use('/todos', authMiddleware, todosRouter);

const server = http.createServer(app);

const wss = new WebSocketServer({ server });
setupWebSocket(wss);

app.use(expressErrorHandler);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
