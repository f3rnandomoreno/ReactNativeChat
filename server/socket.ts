import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";

interface RoomState {
  currentMessage: string;
  activeWriter: string | null;
  users: Map<string, string>; // socketId -> color
}

export function setupSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const rooms = new Map<string, RoomState>();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    let currentRoom: string | null = null;

    socket.on("join_room", ({ roomId, color }) => {
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
          users: new Map(),
        });
      }

      const room = rooms.get(roomId)!;
      room.users.set(socket.id, color);

      socket.emit("room_state", {
        currentMessage: room.currentMessage,
        activeWriter: room.activeWriter,
      });
    });

    socket.on("start_writing", () => {
      if (!currentRoom) return;

      const room = rooms.get(currentRoom)!;
      if (!room.activeWriter) {
        room.activeWriter = socket.id;
        io.to(currentRoom).emit("writer_changed", {
          writerId: socket.id,
          color: room.users.get(socket.id),
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

    socket.on("letter", (letter: string) => {
      if (!currentRoom) return;

      const room = rooms.get(currentRoom)!;
      if (room.activeWriter === socket.id) {
        room.currentMessage += letter;
        io.to(currentRoom).emit("message_update", {
          message: room.currentMessage,
          color: room.users.get(socket.id),
        });
      }
    });

    socket.on("backspace", () => {
      if (!currentRoom) return;

      const room = rooms.get(currentRoom)!;
      if (room.activeWriter === socket.id && room.currentMessage.length > 0) {
        room.currentMessage = room.currentMessage.slice(0, -1);
        io.to(currentRoom).emit("message_update", {
          message: room.currentMessage,
          color: room.users.get(socket.id),
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
          room.users.delete(socket.id);
          if (room.activeWriter === socket.id) {
            room.activeWriter = null;
            io.to(currentRoom).emit("writer_changed", null);
          }
        }
      }
    });
  });

  return io;
}