# Actinova Socket Server

Standalone Socket.IO server for classroom real-time chat. Deploy this separately since Vercel serverless functions don't support persistent WebSocket connections.

## Deploy to Railway (recommended)

1. Create a new project on [Railway](https://railway.app)
2. Connect this folder (or push `socket-server/` as its own repo)
3. Set environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — same value as in your Next.js app
   - `ALLOWED_ORIGINS` — your Vercel app URL, e.g. `https://actinova.vercel.app`
4. Railway auto-detects `package.json` and runs `npm start`
5. Copy the Railway-assigned URL (e.g. `https://actinova-socket.up.railway.app`)

## Deploy to Render

1. New Web Service → connect repo → set Root Directory to `socket-server`
2. Build command: `npm install`
3. Start command: `npm start`
4. Add the same env vars as above

## After deploying

In your Vercel project settings add:
```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
```

The Next.js app reads this env var in `ClassroomChat.jsx`:
```js
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";
```

When `NEXT_PUBLIC_SOCKET_URL` is set, the client connects to that server.
When it's empty (local dev), it falls back to `window.location.origin` which hits `server.js`.

## Local development

```bash
cd socket-server
cp .env.example .env
# fill in .env values
npm install
npm run dev
```

Then in the Next.js `.env.local`:
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```
