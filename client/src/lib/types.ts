export interface RoomState {
  currentMessage: string;
  activeWriter: string | null;
}

export interface WriterInfo {
  writerId: string;
  color: string;
}

export interface MessageUpdate {
  message: string;
  color: string;
}
