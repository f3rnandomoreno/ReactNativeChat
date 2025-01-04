import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import { RoomManager } from "./RoomManager";

export function setupSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const roomManager = new RoomManager(io);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    let currentRoom: string | null = null;

    socket.on("join_room", ({ roomId, color, name }) => {
      // Leave previous room if any
      if (currentRoom) {
        socket.leave(currentRoom);
        roomManager.leaveRoom(socket, currentRoom);
      }

      // Join new room
      currentRoom = roomId;
      socket.join(roomId);
      roomManager.joinRoom(socket, roomId, color, name);
    });

    socket.on("request_turn", () => {
      if (!currentRoom) {
        console.log("[request_turn] No current room");
        return;
      }
      console.log(
        `[request_turn] User ${socket.id} requesting turn in room ${currentRoom}`
      );
      roomManager.requestTurn(socket, currentRoom);
    });

    socket.on("grant_turn", (userId: string) => {
      if (!currentRoom) {
        console.log("[grant_turn] No current room");
        return;
      }
      console.log(
        `[grant_turn] User ${socket.id} granting turn to ${userId} in room ${currentRoom}`
      );
      roomManager.grantTurn(socket, currentRoom, userId);
    });

    socket.on("start_writing", () => {
      if (!currentRoom) {
        console.log("[start_writing] No current room");
        return;
      }
      console.log(
        `[start_writing] User ${socket.id} attempting to write in room ${currentRoom}`
      );
      const success = roomManager.startWriting(socket, currentRoom);
      console.log(`[start_writing] Result: ${success ? "allowed" : "blocked"}`);
    });

    socket.on("update_message", (message: string) => {
      if (!currentRoom) {
        console.log("[update_message] No current room");
        return;
      }
      console.log(
        `[update_message] User ${socket.id} updating message in room ${currentRoom}`
      );
      const success = roomManager.updateMessage(socket, currentRoom, message);
      console.log(
        `[update_message] Result: ${success ? "allowed" : "blocked"}`
      );
    });

    socket.on("stop_writing", () => {
      if (!currentRoom) {
        console.log("[stop_writing] No current room");
        return;
      }
      console.log(
        `[stop_writing] User ${socket.id} stopping writing in room ${currentRoom}`
      );
      const success = roomManager.stopWriting(socket, currentRoom);
      console.log(`[stop_writing] Result: ${success ? "allowed" : "blocked"}`);
    });

    socket.on("submit", () => {
      if (!currentRoom) {
        console.log("[submit] No current room");
        return;
      }
      console.log(
        `[submit] User ${socket.id} submitting message in room ${currentRoom}`
      );
      roomManager.submitMessage(socket, currentRoom);
      console.log(`[submit] Message submitted`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (currentRoom) {
        roomManager.leaveRoom(socket, currentRoom);
      }
    });
  });

  return io;
}
