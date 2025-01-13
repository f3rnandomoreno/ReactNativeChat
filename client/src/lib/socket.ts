import { io, Socket } from "socket.io-client";
import type { RoomState, WriterInfo, MessageUpdate } from "./types";

class SocketClient {
  private socket: Socket | null = null;
  private handlers: Map<string, Function[]> = new Map();
  public socketId: string | null = null;
  private isConnecting: boolean = false;
  private roomId: string | null = null;
  private userInfo: { color: string; name: string } | null = null;

  constructor() {
    this.setupSocket();
  }

  private setupSocket() {
    if (this.socket || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    console.log("[SocketClient] Setting up socket connection");

    this.socket = io(window.location.origin, {
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => {
      console.log("[SocketClient] Connected to server");
      this.socketId = this.socket?.id || null;
      this.isConnecting = false;

      // Reconectar a la sala si estábamos en una
      if (this.roomId && this.userInfo) {
        this.joinRoom(this.roomId, this.userInfo.color, this.userInfo.name);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("[SocketClient] Disconnected from server");
      this.socketId = null;
      this.isConnecting = false;
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

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

    this.socket.on("turn_requested", (data: { userId: string; userName: string }) => {
      console.log("[SocketClient] Turn requested:", data);
      this.emit("turn_requested", data);
    });

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
    if (this.roomId) {
      this.leaveRoom();
    }
    this.socket?.disconnect();
  }

  joinRoom(roomId: string, color: string, name: string) {
    console.log("[SocketClient] Joining room:", { roomId, color, name });

    this.roomId = roomId;
    this.userInfo = { color, name };

    if (!this.socket?.connected) {
      console.log("[SocketClient] Socket not connected, connecting first...");
      this.connect();
      return;
    }

    this.socket?.emit("join_room", { roomId, color, name });
  }

  leaveRoom() {
    if (this.roomId && this.socket?.connected) {
      console.log("[SocketClient] Leaving room:", this.roomId);
      this.socket.emit("leave_room", this.roomId);
    }
    this.roomId = null;
    this.userInfo = null;
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