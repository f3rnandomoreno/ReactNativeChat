import { Server, Socket } from "socket.io";

interface UserInfo {
  color: string;
  name: string;
  requestingTurn: boolean;
}

interface WriterInfo {
  writerId: string;
  color: string;
  name: string;
}

interface RoomState {
  currentMessage: string;
  activeWriter: string | null;
  lastActivity: number;
  users: Map<string, UserInfo>;
}

export class RoomManager {
  private rooms: Map<string, RoomState>;
  private io: Server;
  private readonly INACTIVITY_TIMEOUT = 60000; // 1 minuto

  constructor(io: Server) {
    this.rooms = new Map();
    this.io = io;
    this.startInactivityCheck();
  }

  // Métodos privados de utilidad
  private emitRoomUsers(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      const usersObject = Object.fromEntries(
        Array.from(room.users.entries()).map(([id, info]) => [id, info])
      );
      this.io.to(roomId).emit("room_users_update", usersObject);
    }
  }

  private getWriterInfo(room: RoomState, writerId: string): WriterInfo | null {
    const user = room.users.get(writerId);
    if (!user) return null;

    return {
      writerId,
      color: user.color,
      name: user.name,
    };
  }

  private startInactivityCheck() {
    setInterval(() => {
      this.rooms.forEach((room, roomId) => {
        if (
          room.activeWriter &&
          Date.now() - room.lastActivity > this.INACTIVITY_TIMEOUT
        ) {
          this.clearWriter(roomId, room.activeWriter, "inactivity");
        }
      });
    }, 1000);
  }

  private clearWriter(roomId: string, writerId: string, reason: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.activeWriter !== writerId) return;

    room.activeWriter = null;
    this.io.to(roomId).emit("writer_changed", null);
    this.io
      .to(roomId)
      .emit(
        "system_message",
        reason === "inactivity"
          ? "Se liberó el turno por inactividad"
          : `${room.users.get(writerId)?.name} dejó de escribir`
      );
  }

  // Métodos públicos para gestionar las salas
  public joinRoom(socket: Socket, roomId: string, color: string, name: string) {
    // Crear sala si no existe
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        currentMessage: "",
        activeWriter: null,
        lastActivity: Date.now(),
        users: new Map(),
      });
    }

    const room = this.rooms.get(roomId)!;
    room.users.set(socket.id, { color, name, requestingTurn: false });

    // Emitir estado inicial al usuario
    const usersObject = Object.fromEntries(
      Array.from(room.users.entries()).map(([id, info]) => [id, info])
    );

    socket.emit("room_state", {
      currentMessage: room.currentMessage,
      activeWriter: room.activeWriter,
      lastActivity: room.lastActivity,
      users: usersObject,
    });

    // Emitir estado del escritor si existe
    if (room.activeWriter) {
      const writerInfo = this.getWriterInfo(room, room.activeWriter);
      if (writerInfo) {
        socket.emit("writer_changed", writerInfo);
      }
    }

    // Notificar a todos los usuarios
    this.emitRoomUsers(roomId);
    socket.to(roomId).emit("system_message", `${name} se unió a la sala`);
  }

  public leaveRoom(socket: Socket, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    room.users.delete(socket.id);

    if (room.activeWriter === socket.id) {
      this.clearWriter(roomId, socket.id, "left");
    }

    if (user) {
      this.io.to(roomId).emit("system_message", `${user.name} dejó la sala`);
    }

    this.emitRoomUsers(roomId);
  }

  public startWriting(socket: Socket, roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    console.log(`[RoomManager.startWriting] Room ${roomId}, User ${socket.id}`);
    console.log(
      `[RoomManager.startWriting] Current active writer: ${room.activeWriter}`
    );

    // Si ya hay un escritor activo, no permitir escribir
    if (room.activeWriter !== null) {
      console.log(
        `[RoomManager.startWriting] Room already has active writer: ${room.activeWriter}`
      );
      const writerInfo = this.getWriterInfo(room, room.activeWriter);
      if (writerInfo) {
        console.log(
          `[RoomManager.startWriting] Emitting current writer info:`,
          writerInfo
        );
        this.io.to(roomId).emit("writer_changed", writerInfo);
      }
      return false;
    }

    // Establecer como escritor activo
    room.activeWriter = socket.id;
    room.currentMessage = "";
    room.lastActivity = Date.now();

    // Notificar a todos los clientes
    const writerInfo = this.getWriterInfo(room, socket.id);
    if (writerInfo) {
      console.log(`[RoomManager.startWriting] Setting new writer:`, writerInfo);
      this.io.to(roomId).emit("writer_changed", writerInfo);
      this.io.to(roomId).emit("message_cleared");
    }

    return true;
  }

  public updateMessage(
    socket: Socket,
    roomId: string,
    message: string
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.activeWriter !== socket.id) {
      console.log(
        `[RoomManager.updateMessage] Not allowed. Room: ${roomId}, User: ${socket.id}, Active writer: ${room?.activeWriter}`
      );
      return false;
    }

    room.lastActivity = Date.now();
    room.currentMessage = message;

    const user = room.users.get(socket.id)!;
    console.log(
      `[RoomManager.updateMessage] Updating message from ${user.name}: "${message}"`
    );
    this.io.to(roomId).emit("message_update", {
      message: room.currentMessage,
      color: user.color,
      writerName: user.name,
    });

    return true;
  }

  public stopWriting(socket: Socket, roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.activeWriter !== socket.id) {
      console.log(
        `[RoomManager.stopWriting] Not allowed. Room: ${roomId}, User: ${socket.id}, Active writer: ${room?.activeWriter}`
      );
      return false;
    }

    console.log(
      `[RoomManager.stopWriting] Stopping writer ${socket.id} in room ${roomId}`
    );
    this.clearWriter(roomId, socket.id, "stopped");
    return true;
  }

  public submitMessage(socket: Socket, roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.activeWriter !== socket.id) {
      console.log(
        `[RoomManager.submitMessage] Not allowed. Room: ${roomId}, User: ${socket.id}, Active writer: ${room?.activeWriter}`
      );
      return false;
    }

    const user = room.users.get(socket.id)!;
    console.log(
      `[RoomManager.submitMessage] Submitting message from ${user.name}: "${room.currentMessage}"`
    );
    this.io.to(roomId).emit("message_update", {
      message: room.currentMessage,
      color: user.color,
      writerName: user.name,
    });

    this.clearWriter(roomId, socket.id, "submitted");
    return true;
  }

  public requestTurn(socket: Socket, roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const user = room.users.get(socket.id);
    if (!user) return false;

    user.requestingTurn = true;
    this.emitRoomUsers(roomId);
    this.io.to(roomId).emit("turn_requested", {
      userId: socket.id,
      userName: user.name,
    });

    return true;
  }

  public grantTurn(
    socket: Socket,
    roomId: string,
    targetUserId: string
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.activeWriter !== socket.id) return false;

    const targetUser = room.users.get(targetUserId);
    if (!targetUser) return false;

    targetUser.requestingTurn = false;
    room.activeWriter = targetUserId;

    const writerInfo = this.getWriterInfo(room, targetUserId);
    if (writerInfo) {
      this.io.to(roomId).emit("writer_changed", writerInfo);
    }

    this.emitRoomUsers(roomId);
    return true;
  }
}
