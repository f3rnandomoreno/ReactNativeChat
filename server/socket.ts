import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";

interface RoomState {
  currentMessage: string;
  activeWriter: string | null;
  lastActivity: number;
  users: Map<string, { color: string; name: string; requestingTurn: boolean }>;
}

const INACTIVITY_TIMEOUT = 60000; // 1 minute in milliseconds

export function setupSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const rooms = new Map<string, RoomState>();

  // Check for inactive writers
  setInterval(() => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.activeWriter && Date.now() - room.lastActivity > INACTIVITY_TIMEOUT) {
        room.activeWriter = null;
        io.to(roomId).emit("writer_changed", null);
        io.to(roomId).emit("system_message", "Se liberó el turno por inactividad");
      }
    }
  }, 1000); // Check every second

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    let currentRoom: string | null = null;

    socket.on("join_room", ({ roomId, color, name }) => {
      // Leave previous room if any
      if (currentRoom) {
        socket.leave(currentRoom);
        const room = rooms.get(currentRoom);
        if (room) {
          room.users.delete(socket.id);
        }
      }

      // Join new room
      currentRoom = roomId;
      socket.join(roomId);

      // Initialize room if needed
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          currentMessage: "",
          activeWriter: null,
          lastActivity: Date.now(),
          users: new Map(),
        });
      }

      const room = rooms.get(roomId)!;
      room.users.set(socket.id, { color, name, requestingTurn: false });

      // Convert users Map to an object for client
      const usersObject = Object.fromEntries(
        Array.from(room.users.entries()).map(([id, info]) => [id, info])
      );

      socket.emit("room_state", {
        currentMessage: room.currentMessage,
        activeWriter: room.activeWriter,
        lastActivity: room.lastActivity,
        users: usersObject,
      });

      // Notify others of new user
      socket.to(roomId).emit("system_message", `${name} se unió a la sala`);
    });

    socket.on("request_turn", () => {
      if (!currentRoom) return;

      const room = rooms.get(currentRoom)!;
      const user = room.users.get(socket.id);
      if (!user) return;

      user.requestingTurn = true;
      io.to(currentRoom).emit("turn_requested", {
        userId: socket.id,
        userName: user.name,
      });
    });

    socket.on("grant_turn", (userId: string) => {
      if (!currentRoom) return;

      const room = rooms.get(currentRoom)!;
      if (room.activeWriter === socket.id) {
        room.activeWriter = userId;
        const user = room.users.get(userId);
        if (user) {
          user.requestingTurn = false;
          io.to(currentRoom).emit("writer_changed", {
            writerId: userId,
            color: user.color,
            name: user.name,
          });
        }
      }
    });

    socket.on("start_writing", () => {
      if (!currentRoom) return;

      const room = rooms.get(currentRoom)!;
      if (!room.activeWriter) {
        room.activeWriter = socket.id;
        const user = room.users.get(socket.id)!;
        io.to(currentRoom).emit("writer_changed", {
          writerId: socket.id,
          color: user.color,
          name: user.name,
        });
      }
    });

    socket.on("stop_writing", () => {
      if (!currentRoom) return;

      const room = rooms.get(currentRoom)!;
      if (room.activeWriter === socket.id) {
        room.activeWriter = null;
        io.to(currentRoom).emit("writer_changed", null);
      }
    });

    socket.on("update_message", (message: string) => {
      if (!currentRoom) return;

      const room = rooms.get(currentRoom)!;
      if (room.activeWriter === socket.id) {
        room.lastActivity = Date.now();
        room.currentMessage = message;
        const user = room.users.get(socket.id)!;
        io.to(currentRoom).emit("message_update", {
          message: room.currentMessage,
          color: user.color,
          writerName: user.name,
        });
      }
    });

    socket.on("submit", () => {
      if (!currentRoom) return;

      const room = rooms.get(currentRoom)!;
      if (room.activeWriter === socket.id) {
        room.currentMessage = "";
        room.activeWriter = null;
        io.to(currentRoom).emit("message_cleared");
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (currentRoom) {
        const room = rooms.get(currentRoom);
        if (room) {
          const user = room.users.get(socket.id);
          room.users.delete(socket.id);
          if (room.activeWriter === socket.id) {
            room.activeWriter = null;
            io.to(currentRoom).emit("writer_changed", null);
          }
          if (user) {
            io.to(currentRoom).emit("system_message", `${user.name} dejó la sala`);
          }
        }
      }
    });
  });

  return io;
}