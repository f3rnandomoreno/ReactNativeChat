export interface RoomState {
  currentMessage: string;
  activeWriter: string | null;
  lastActivity: number;
  users: Record<string, UserInfo>;
}

export interface UserInfo {
  color: string;
  name: string;
  requestingTurn: boolean;
}

export interface WriterInfo {
  writerId: string;
  color: string;
  name: string;
}

export interface MessageUpdate {
  message: string;
  color: string;
  writerName: string;
}
