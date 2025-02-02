# TODO app with collaboration

Simple TODO app with collaborations and locks. Uses restful API and websockets for collaboration.

<video src="https://github.com/user-attachments/assets/09b5818e-4027-4fc2-9dd2-9459bd846dd5" controls></video>

# Server

- Nodejs (ts) with express stack
- Postgres database ([db schema](./server/prisma/schema.prisma))
- Tests with vitest and playwright
- WS for collaboration
- ESBuild for speed

## Start server

```bash
$ cd server
$ docker compose up
```

## Run tests

```bash
$ npm install
$ npm run test
$ npm run test:e2e # make sure server is running
```

# Electron client

- Build with help of [electron-vite](https://electron-vite.org/)
- Main code is in [/electron-client/src/renderer/src](./electron-client/src/renderer/src)
- React with TypeScript
- [Mantine](https://mantine.dev/) for UI components
- Vitest and playwright for tests

## Start application

```bash
$ cd electron-client
$ npm install
$ npm run start
```

## Run tests

```bash
$ npm install
$ npm run test
$ npm run test:e2e # make sure server is running
```

## Build binaries

```bash
$ npm run build # or build:mac, build:win, build:linux
```

> Note however, that the build will not work with localhost server on macos
