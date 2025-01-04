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

  constructor(io: Server) {
    this.rooms = new Map();
    this.io = io;
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

  private clearWriter(roomId: string, writerId: string, reason: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.activeWriter !== writerId) return;

    const user = room.users.get(writerId);
    if (!user) return;

    // Guardar el nombre antes de limpiar el estado
    const userName = user.name;

    // Solo limpiar el mensaje si es por envío o inactividad
    if (reason === "submitted" || reason === "inactivity") {
      room.currentMessage = "";
    }

    room.activeWriter = null;
    this.io.to(roomId).emit("writer_changed", null);

    // Emitir el estado actualizado de la sala a todos
    const usersObject = Object.fromEntries(
      Array.from(room.users.entries()).map(([id, info]) => [id, info])
    );
    this.io.to(roomId).emit("room_state", {
      currentMessage: room.currentMessage,
      activeWriter: null,
      lastActivity: room.lastActivity,
      users: usersObject,
    });

    // Solo emitir el mensaje de "dejó de escribir" si no fue por envío
    if (reason !== "submitted") {
      this.io
        .to(roomId)
        .emit(
          "system_message",
          reason === "inactivity"
            ? "Se liberó el turno por inactividad"
            : `${userName} dejó de escribir`
        );
    }
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
        this.io.to(roomId).emit("writer_changed", writerInfo);
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

    // Si ya hay un escritor activo y no es el mismo usuario, no permitir escribir
    if (room.activeWriter !== null && room.activeWriter !== socket.id) {
      console.log(
        `[RoomManager.startWriting] Room already has active writer: ${room.activeWriter}`
      );
      const writerInfo = this.getWriterInfo(room, room.activeWriter);
      if (writerInfo) {
        console.log(
          `[RoomManager.startWriting] Emitting current writer info:`,
          writerInfo
        );
        // Notificar a todos los clientes sobre el escritor actual
        this.io.to(roomId).emit("writer_changed", writerInfo);
        // Emitir el estado actualizado de la sala a todos
        const usersObject = Object.fromEntries(
          Array.from(room.users.entries()).map(([id, info]) => [id, info])
        );
        this.io.to(roomId).emit("room_state", {
          currentMessage: room.currentMessage,
          activeWriter: room.activeWriter,
          lastActivity: room.lastActivity,
          users: usersObject,
        });
      }
      return false;
    }

    // Si el escritor actual es el mismo usuario, solo actualizar la actividad
    if (room.activeWriter === socket.id) {
      room.lastActivity = Date.now();
      return true;
    }

    // Establecer como escritor activo
    room.activeWriter = socket.id;
    room.lastActivity = Date.now();

    // Notificar a todos los clientes
    const writerInfo = this.getWriterInfo(room, socket.id);
    if (writerInfo) {
      console.log(`[RoomManager.startWriting] Setting new writer:`, writerInfo);
      // Asegurar que todos los clientes reciban la notificación
      this.io.to(roomId).emit("writer_changed", writerInfo);

      // Emitir el estado actualizado de la sala a todos
      const usersObject = Object.fromEntries(
        Array.from(room.users.entries()).map(([id, info]) => [id, info])
      );
      this.io.to(roomId).emit("room_state", {
        currentMessage: room.currentMessage,
        activeWriter: room.activeWriter,
        lastActivity: room.lastActivity,
        users: usersObject,
      });
    }

    return true;
  }

  public updateMessage(
    socket: Socket,
    roomId: string,
    message: string
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Verificar si el usuario es el escritor activo
    if (room.activeWriter !== socket.id) {
      console.log(
        `[RoomManager.updateMessage] Not allowed. Room: ${roomId}, User: ${socket.id}, Active writer: ${room.activeWriter}`
      );

      // Notificar a todos los clientes sobre el escritor actual
      if (room.activeWriter) {
        const writerInfo = this.getWriterInfo(room, room.activeWriter);
        if (writerInfo) {
          this.io.to(roomId).emit("writer_changed", writerInfo);
        }
      }
      return false;
    }

    room.lastActivity = Date.now();
    room.currentMessage = message;

    const user = room.users.get(socket.id)!;
    console.log(
      `[RoomManager.updateMessage] Updating message from ${user.name}: "${message}"`
    );

    // Emitir la actualización del mensaje a todos los clientes
    this.io.to(roomId).emit("message_update", {
      message,
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

  public submitMessage(socket: Socket, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Verificar si el usuario es el escritor activo
    if (room.activeWriter !== socket.id) {
      return;
    }

    // Limpiar el estado del escritor
    this.clearWriter(roomId, socket.id, "submitted");

    // Emitir el mensaje limpio a todos los clientes
    this.io.to(roomId).emit("message_cleared");

    // Emitir el estado actualizado de la sala a todos
    const usersObject = Object.fromEntries(
      Array.from(room.users.entries()).map(([id, info]) => [id, info])
    );
    this.io.to(roomId).emit("room_state", {
      currentMessage: "",
      activeWriter: null,
      lastActivity: room.lastActivity,
      users: usersObject,
    });
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
