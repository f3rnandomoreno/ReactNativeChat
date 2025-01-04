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
      methods: ["GET", "POST"],
    },
  });

  const rooms = new Map<string, RoomState>();

  function emitRoomUsers(roomId: string) {
    const room = rooms.get(roomId);
    if (room) {
      const usersObject = Object.fromEntries(
        Array.from(room.users.entries()).map(([id, info]) => [id, info])
      );
      io.to(roomId).emit("room_users_update", usersObject);
    }
  }

  // Check for inactive writers
  setInterval(() => {
    rooms.forEach((room, roomId) => {
      if (
        room.activeWriter &&
        Date.now() - room.lastActivity > INACTIVITY_TIMEOUT
      ) {
        room.activeWriter = null;
        io.to(roomId).emit("writer_changed", null);
        io.to(roomId).emit(
          "system_message",
          "Se liberó el turno por inactividad"
        );
      }
    });
  }, 1000);

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
          emitRoomUsers(currentRoom);
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

      // First emit room state to the joining user
      socket.emit("room_state", {
        currentMessage: room.currentMessage,
        activeWriter: room.activeWriter,
        lastActivity: room.lastActivity,
        users: usersObject,
      });

      // Then emit updated users list to all users in the room
      emitRoomUsers(roomId);

      // Notify others of new user
      socket.to(roomId).emit("system_message", `${name} se unió a la sala`);
    });

    socket.on("request_turn", () => {
      if (!currentRoom) return;

      const room = rooms.get(currentRoom)!;
      const user = room.users.get(socket.id);
      if (!user) return;

      user.requestingTurn = true;
      emitRoomUsers(currentRoom); // Emit updated users list
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
          emitRoomUsers(currentRoom); // Emit updated users list
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
      const user = room.users.get(socket.id)!;

      if (!room.activeWriter || room.activeWriter !== socket.id) {
        // Clear previous writer's state
        room.currentMessage = "";
        room.activeWriter = socket.id;
        io.to(currentRoom).emit("message_cleared");
      }

      // Always emit writer_changed to ensure the UI shows the writing state
      io.to(currentRoom).emit("writer_changed", {
        writerId: socket.id,
        color: user.color,
        name: user.name,
      });
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
        // Don't clear the writer state here, it will be cleared when another user starts writing
        room.lastActivity = Date.now(); // Update last activity to prevent timeout
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
            io.to(currentRoom).emit(
              "system_message",
              `${user.name} dejó la sala`
            );
          }
          // Emit updated users list after user disconnects
          emitRoomUsers(currentRoom);
        }
      }
    });
  });

  return io;
}
