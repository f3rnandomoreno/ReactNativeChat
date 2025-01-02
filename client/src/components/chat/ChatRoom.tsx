import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageInput } from "./MessageInput";
import { socketClient } from "@/lib/socket";
import type { WriterInfo, MessageUpdate } from "@/lib/types";

interface ChatRoomProps {
  userColor: string;
}

export function ChatRoom({ userColor }: ChatRoomProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [currentWriter, setCurrentWriter] = useState<WriterInfo | null>(null);

  useEffect(() => {
    const roomId = "main"; // For simplicity, using a single room
    socketClient.joinRoom(roomId, userColor);

    const handleRoomState = (state: { currentMessage: string; activeWriter: string | null }) => {
      setCurrentMessage(state.currentMessage);
      setCurrentWriter(
        state.activeWriter
          ? { writerId: state.activeWriter, color: userColor }
          : null
      );
    };

    const handleWriterChanged = (writer: WriterInfo | null) => {
      setCurrentWriter(writer);
    };

    const handleMessageUpdate = ({ message, color }: MessageUpdate) => {
      setCurrentMessage(message);
      setMessageColor(color);
    };

    const handleMessageCleared = () => {
      setCurrentMessage("");
      setCurrentWriter(null);
      setMessageColor("");
    };

    socketClient.on("roomState", handleRoomState);
    socketClient.on("writerChanged", handleWriterChanged);
    socketClient.on("messageUpdate", handleMessageUpdate);
    socketClient.on("messageCleared", handleMessageCleared);

    return () => {
      socketClient.off("roomState", handleRoomState);
      socketClient.off("writerChanged", handleWriterChanged);
      socketClient.off("messageUpdate", handleMessageUpdate);
      socketClient.off("messageCleared", handleMessageCleared);
    };
  }, [userColor]);

  const isBlocked = currentWriter !== null && currentWriter.writerId !== socketClient.getSocketId();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <div 
          className="min-h-[200px] flex items-center justify-center text-2xl font-medium p-4 rounded-lg"
          style={{ color: messageColor || "inherit" }}
        >
          {currentMessage || "Empieza a escribir..."}
        </div>

        <div className="relative">
          <MessageInput isBlocked={isBlocked} />
          <div 
            className="absolute -top-6 left-2 text-sm"
            style={{ color: currentWriter?.color }}
          >
            {currentWriter ? "Alguien está escribiendo..." : ""}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}