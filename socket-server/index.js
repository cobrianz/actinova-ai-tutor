/**
 * Standalone Socket.IO server — deploy this separately on Railway, Render, or Fly.io.
 *
 * Environment variables required:
 *   PORT              — port to listen on (default 4000)
 *   MONGODB_URI       — MongoDB connection string
 *   JWT_SECRET        — same secret used by the Next.js app
 *   ALLOWED_ORIGINS   — comma-separated list of allowed origins, e.g.
 *                       https://your-app.vercel.app,http://localhost:3000
 *
 * In the Next.js app set:
 *   NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
 */

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const PORT = parseInt(process.env.PORT || "4000", 10);
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

// ── MongoDB connection ────────────────────────────────────────────────────────

let dbReady = false;

async function connectDB() {
  if (dbReady) return;
  await mongoose.connect(MONGODB_URI);
  dbReady = true;
  console.log("[db] connected");
}

// ── Mongoose models ───────────────────────────────────────────────────────────

const ClassroomMessageSchema = new mongoose.Schema(
  {
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    senderId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderName:  { type: String, required: true, trim: true, maxlength: 200 },
    senderRole:  { type: String, enum: ["instructor", "admin", "student"], required: true },
    content:     { type: String, required: true, trim: true, maxlength: 2000 },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    createdAt:   { type: Date, default: Date.now, index: true },
  },
  { timestamps: false, versionKey: false }
);
ClassroomMessageSchema.index({ classroomId: 1, createdAt: -1 });

const ClassroomMessage =
  mongoose.models.ClassroomMessage ||
  mongoose.model("ClassroomMessage", ClassroomMessageSchema);

// ── HTTP + Socket.IO setup ────────────────────────────────────────────────────

const app = express();
app.get("/health", (_, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["polling", "websocket"],
});

// ── Auth middleware ───────────────────────────────────────────────────────────

io.use(async (socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.cookie?.match(/token=([^;]+)/)?.[1];

  if (!token) {
    return next(Object.assign(new Error("Authentication required"), { data: { code: 401 } }));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "actirova-ai-tutor",
      audience: "actirova-ai-tutor-users",
    });

    await connectDB();
    const user = await mongoose.connection.db
      .collection("users")
      .findOne(
        { _id: new mongoose.Types.ObjectId(decoded.id) },
        { projection: { _id: 1, name: 1, role: 1, status: 1 } }
      );

    if (!user || user.status !== "active") {
      return next(Object.assign(new Error("Unauthorized"), { data: { code: 401 } }));
    }

    socket.user = { id: user._id.toString(), name: user.name, role: user.role };
    next();
  } catch {
    next(Object.assign(new Error("Invalid token"), { data: { code: 401 } }));
  }
});

// ── Socket events ─────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log(`[chat] connected: ${socket.user.id}`);

  socket.on("join_room", async ({ classroomId, recipientId }) => {
    if (!classroomId) return;
    try {
      await connectDB();
      const db = mongoose.connection.db;

      const classroom = await db.collection("classrooms").findOne(
        { _id: new mongoose.Types.ObjectId(classroomId) },
        { projection: { instructorId: 1 } }
      );
      if (!classroom) {
        return socket.emit("authorization_error", { message: "Classroom not found" });
      }

      const isInstructor = classroom.instructorId?.toString() === socket.user.id;
      if (!isInstructor) {
        const enrollment = await db.collection("enrollments").findOne({
          classroomId: new mongoose.Types.ObjectId(classroomId),
          studentId: new mongoose.Types.ObjectId(socket.user.id),
          status: "active",
        });
        if (!enrollment) {
          return socket.emit("authorization_error", { message: "Not enrolled in this classroom" });
        }
      }

      const roomId = recipientId
        ? `dm_${classroomId}_${[socket.user.id, recipientId].sort().join("_")}`
        : classroomId;

      socket.join(roomId);

      const query = recipientId
        ? {
            classroomId: new mongoose.Types.ObjectId(classroomId),
            $or: [
              { senderId: new mongoose.Types.ObjectId(socket.user.id), recipientId: new mongoose.Types.ObjectId(recipientId) },
              { senderId: new mongoose.Types.ObjectId(recipientId), recipientId: new mongoose.Types.ObjectId(socket.user.id) },
            ],
          }
        : {
            classroomId: new mongoose.Types.ObjectId(classroomId),
            recipientId: null,
          };

      const history = await ClassroomMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      socket.emit("message_history", history.reverse());
    } catch (err) {
      console.error("[chat] join_room error:", err);
      socket.emit("authorization_error", { message: "Failed to join room" });
    }
  });

  socket.on("send_message", async ({ classroomId, content, recipientId }) => {
    if (!content || typeof content !== "string") return;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 2000) return;

    try {
      await connectDB();
      const message = await ClassroomMessage.create({
        classroomId,
        senderId: socket.user.id,
        senderName: socket.user.name,
        senderRole: socket.user.role,
        content: trimmed,
        recipientId: recipientId || null,
        createdAt: new Date(),
      });

      const payload = {
        _id: message._id.toString(),
        classroomId,
        senderId: socket.user.id,
        senderName: socket.user.name,
        senderRole: socket.user.role,
        content: trimmed,
        createdAt: message.createdAt.toISOString(),
        recipientId: recipientId || null,
      };

      const roomId = recipientId
        ? `dm_${classroomId}_${[socket.user.id, recipientId].sort().join("_")}`
        : classroomId;

      io.to(roomId).emit("new_message", payload);
    } catch (err) {
      console.error("[chat] send_message error:", err);
    }
  });

  socket.on("typing", ({ classroomId, recipientId }) => {
    if (!classroomId) return;
    const roomId = recipientId
      ? `dm_${classroomId}_${[socket.user.id, recipientId].sort().join("_")}`
      : classroomId;
    socket.to(roomId).emit("user_typing", {
      userId: socket.user.id,
      userName: socket.user.name,
    });
  });

  socket.on("disconnect", () => {
    console.log(`[chat] disconnected: ${socket.user.id}`);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[socket] listening on :${PORT}`);
});
