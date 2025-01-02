import { io, Socket } from "socket.io-client";
import type { RoomState, WriterInfo, MessageUpdate } from "./types";

class SocketClient {
  private socket: Socket;
  private handlers: Map<string, Function[]> = new Map();
  public socketId: string | null = null;

  constructor() {
    this.socket = io(window.location.origin, {
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.socketId = this.socket.id;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.socketId = null;
    });

    this.socket.on("room_state", (state: RoomState) => {
      this.emit("roomState", state);
    });

    this.socket.on("writer_changed", (writer: WriterInfo | null) => {
      this.emit("writerChanged", writer);
    });

    this.socket.on("message_update", (update: MessageUpdate) => {
      this.emit("messageUpdate", update);
    });

    this.socket.on("message_cleared", () => {
      this.emit("messageCleared");
    });

    this.socket.on("system_message", (message: string) => {
      this.emit("system_message", message);
    });

    this.socket.on("turn_requested", (data: { userId: string; userName: string }) => {
      this.emit("turn_requested", data);
    });
  }

  joinRoom(roomId: string, color: string, name: string) {
    this.socket.emit("join_room", { roomId, color, name });
  }

  startWriting() {
    this.socket.emit("start_writing");
  }

  stopWriting() {
    this.socket.emit("stop_writing");
  }

  sendLetter(letter: string) {
    this.socket.emit("letter", letter);
  }

  sendBackspace() {
    this.socket.emit("backspace");
  }

  submitMessage() {
    this.socket.emit("submit");
  }

  requestTurn() {
    this.socket.emit("request_turn");
  }

  grantTurn(userId: string) {
    this.socket.emit("grant_turn", userId);
  }

  getSocketId() {
    return this.socketId;
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