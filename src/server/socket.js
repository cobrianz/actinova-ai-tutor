const { Server } = require("socket.io");
const mongoose = require("mongoose");

let ClassroomMessage;

function getModel() {
  if (!ClassroomMessage) {
    ClassroomMessage = require("../app/models/ClassroomMessage").default;
  }
  return ClassroomMessage;
}

function verifySocketToken(token) {
  const jwt = require("jsonwebtoken");
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.verify(token, secret, {
    issuer: "actirova-ai-tutor",
    audience: "actirova-ai-tutor-users",
  });
}

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST"],
    },
    // Allow both polling and websocket so the HTTP handshake auth cookie
    // is always present regardless of the initial transport
    transports: ["polling", "websocket"],
  });

  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.cookie?.match(/token=([^;]+)/)?.[1];

    if (!token) {
      return next(
        Object.assign(new Error("Authentication required"), {
          data: { code: 401 },
        })
      );
    }
    try {
      const decoded = verifySocketToken(token);
      const { connectToDatabase } = require("../app/lib/mongodb");
      const { db } = await connectToDatabase();
      const user = await db
        .collection("users")
        .findOne(
          { _id: new mongoose.Types.ObjectId(decoded.id) },
          { projection: { _id: 1, name: 1, email: 1, role: 1, status: 1 } }
        );
      if (!user || user.status !== "active") {
        return next(
          Object.assign(new Error("Unauthorized"), { data: { code: 401 } })
        );
      }
      socket.user = {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      };
      next();
    } catch {
      next(
        Object.assign(new Error("Invalid token"), { data: { code: 401 } })
      );
    }
  });

  io.on("connection", (socket) => {
    console.log(`[chat] connected: ${socket.user.id}`);

    socket.on("join_room", async ({ classroomId, recipientId }) => {
      if (!classroomId) return;
      try {
        const { connectToDatabase } = require("../app/lib/mongodb");
        const { db } = await connectToDatabase();
        const classroom = await db
          .collection("classrooms")
          .findOne(
            { _id: new mongoose.Types.ObjectId(classroomId) },
            { projection: { instructorId: 1 } }
          );
        if (!classroom) {
          return socket.emit("authorization_error", {
            message: "Classroom not found",
          });
        }
        const isInstructor =
          classroom.instructorId?.toString() === socket.user.id;
        if (!isInstructor) {
          const enrollment = await db.collection("enrollments").findOne({
            classroomId: new mongoose.Types.ObjectId(classroomId),
            studentId: new mongoose.Types.ObjectId(socket.user.id),
            status: "active",
          });
          if (!enrollment) {
            return socket.emit("authorization_error", {
              message: "Not enrolled in this classroom",
            });
          }
        }

        // DM room: deterministic room ID from sorted pair of user IDs
        const roomId = recipientId
          ? `dm_${classroomId}_${[socket.user.id, recipientId].sort().join("_")}`
          : classroomId;

        socket.join(roomId);

        const Model = getModel();
        // Group chat: only messages with NO recipientId (exclude all DMs)
        // DM chat: messages between this exact pair only
        const query = recipientId
          ? {
              classroomId,
              $or: [
                { senderId: socket.user.id, recipientId: recipientId },
                { senderId: recipientId, recipientId: socket.user.id },
              ],
            }
          : {
              classroomId,
              recipientId: null,  // only group messages (recipientId not set)
            };

        const history = await Model.find(query)
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        socket.emit("message_history", history.reverse());
      } catch (err) {
        console.error("[chat] join_room error:", err);
        socket.emit("authorization_error", {
          message: "Failed to join room",
        });
      }
    });

    socket.on("send_message", async ({ classroomId, content, recipientId }) => {
      if (!content || typeof content !== "string") return;
      const trimmed = content.trim();
      if (!trimmed || trimmed.length > 2000) return;

      try {
        const Model = getModel();
        const doc = {
          classroomId,
          senderId: socket.user.id,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          content: trimmed,
          // Explicitly null for group messages so queries on recipientId: null work
          recipientId: recipientId || null,
          createdAt: new Date(),
        };

        const message = await Model.create(doc);
        const payload = {
          _id: message._id.toString(),
          classroomId,
          senderId: socket.user.id,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          content: trimmed,
          createdAt: message.createdAt.toISOString(),
          ...(recipientId && { recipientId }),
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
      if (classroomId) {
        const roomId = recipientId
          ? `dm_${classroomId}_${[socket.user.id, recipientId].sort().join("_")}`
          : classroomId;
        socket.to(roomId).emit("user_typing", {
          userId: socket.user.id,
          userName: socket.user.name,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[chat] disconnected: ${socket.user.id}`);
    });
  });

  return io;
}

module.exports = { initSocketServer };
