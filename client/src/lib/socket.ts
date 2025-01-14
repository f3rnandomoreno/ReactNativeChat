import { io, Socket } from "socket.io-client";
import type { RoomState, WriterInfo, MessageUpdate } from "./types";

class SocketClient {
  private socket: Socket | null = null;
  private handlers: Map<string, Function[]> = new Map();
  public socketId: string | null = null;
  private currentRoom: string | null = null;

  constructor() {
    this.setupSocket();
  }

  private setupSocket() {
    if (this.socket) {
      return;
    }

    this.socket = io(window.location.origin, {
      transports: ["websocket"],
      autoConnect: false, // No conectar automáticamente
    });

    this.socket.on("connect", () => {
      console.log("[SocketClient] Connected to server");
      this.socketId = this.socket?.id || null;
      // @ts-ignore
      window.socketConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("[SocketClient] Disconnected from server");
      this.socketId = null;
      // @ts-ignore
      window.socketConnected = false;
    });

    this.socket.on("room_state", (state: RoomState) => {
      console.log("[SocketClient] Room state received:", state);
      this.emit("roomState", state);
    });

    this.socket.on("writer_changed", (writer: WriterInfo | null) => {
      console.log("[SocketClient] Writer changed:", writer);
      this.emit("writerChanged", writer);
    });

    this.socket.on("message_update", (update: MessageUpdate) => {
      console.log("[SocketClient] Message update:", update);
      this.emit("messageUpdate", update);
    });

    this.socket.on("message_cleared", () => {
      console.log("[SocketClient] Message cleared");
      this.emit("messageCleared");
    });

    this.socket.on("system_message", (message: string) => {
      console.log("[SocketClient] System message:", message);
      this.emit("system_message", message);
    });

    this.socket.on(
      "turn_requested",
      (data: { userId: string; userName: string }) => {
        console.log("[SocketClient] Turn requested:", data);
        this.emit("turn_requested", data);
      }
    );

    this.socket.on("room_users_update", (users: Record<string, any>) => {
      console.log("[SocketClient] Room users update:", users);
      this.emit("room_users_update", users);
    });
  }

  connect() {
    console.log("[SocketClient] Connecting...");
    this.setupSocket();
    this.socket?.connect();
  }

  disconnect() {
    console.log("[SocketClient] Disconnecting...");
    if (this.socket?.connected) {
      // Si estamos en una sala, emitir el evento de salida antes de desconectar
      if (this.currentRoom) {
        this.socket.emit("leave_room", this.currentRoom);
      }
      this.socket.disconnect();
    }
  }

  joinRoom(roomId: string, color: string, name: string) {
    console.log("[SocketClient] Joining room:", { roomId, color, name });
    if (!this.socket?.connected) {
      console.log("[SocketClient] Socket not connected, connecting first...");
      this.connect();
    }
    this.currentRoom = roomId;
    this.socket?.emit("join_room", { roomId, color, name });
  }

  startWriting() {
    console.log("[SocketClient] Starting writing");
    this.socket?.emit("start_writing");
  }

  stopWriting() {
    console.log("[SocketClient] Stopping writing");
    this.socket?.emit("stop_writing");
  }

  updateMessage(message: string) {
    console.log("[SocketClient] Updating message:", message);
    this.socket?.emit("update_message", message);
  }

  submitMessage() {
    console.log("[SocketClient] Submitting message");
    this.socket?.emit("submit");
  }

  requestTurn() {
    console.log("[SocketClient] Requesting turn");
    this.socket?.emit("request_turn");
  }

  grantTurn(userId: string) {
    console.log("[SocketClient] Granting turn to:", userId);
    this.socket?.emit("grant_turn", userId);
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
}

export const socketClient = new SocketClient();