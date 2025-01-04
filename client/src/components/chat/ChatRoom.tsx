import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageInput } from "./MessageInput";
import { socketClient } from "@/lib/socket";
import type { WriterInfo, MessageUpdate, UserInfo } from "@/lib/types";
import { AlertCircle, Clock } from "lucide-react";

interface ChatRoomProps {
  userColor: string;
  roomId: string;
  userName: string;
}

export function ChatRoom({ userColor, roomId, userName }: ChatRoomProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [writerName, setWriterName] = useState("");
  const [currentWriter, setCurrentWriter] = useState<WriterInfo | null>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [systemMessages, setSystemMessages] = useState<string[]>([]);
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const shareUrl = `${window.location.origin}/room/${roomId}`;

  useEffect(() => {
    socketClient.joinRoom(roomId, userColor, userName);

    const handleRoomState = (state: {
      currentMessage: string;
      activeWriter: string | null;
      lastActivity: number;
      users: Record<string, UserInfo>;
    }) => {
      console.log("[handleRoomState]", state);
      setCurrentMessage(state.currentMessage);
      setUsers(state.users);

      // Actualizar el escritor actual basado en el estado de la sala
      if (state.activeWriter) {
        const writer = {
          writerId: state.activeWriter,
          color: state.users[state.activeWriter].color,
          name: state.users[state.activeWriter].name,
        };
        setCurrentWriter(writer);
      } else {
        setCurrentWriter(null);
      }
    };

    const handleWriterChanged = (writer: WriterInfo | null) => {
      console.log("[handleWriterChanged]", writer);
      setCurrentWriter(writer);

      // Si hay un escritor activo y no soy yo, limpiar el mensaje actual
      if (writer && writer.writerId !== socketClient.getSocketId()) {
        setCurrentMessage("");
        setMessageColor("");
        setWriterName("");
      }
    };

    const handleMessageUpdate = ({
      message,
      color,
      writerName,
    }: MessageUpdate) => {
      console.log("[handleMessageUpdate]", { message, color, writerName });
      setCurrentMessage(message);
      setMessageColor(color);
      setWriterName(writerName);
      // Reset timer on activity
      if (currentWriter) setTimeLeft(60);
    };

    const handleMessageCleared = () => {
      console.log("[handleMessageCleared]");
      setCurrentMessage("");
      setCurrentWriter(null);
      setMessageColor("");
      setWriterName("");
      setTimeLeft(null);
    };

    const handleSystemMessage = (message: string) => {
      console.log("[handleSystemMessage]", message);
      setSystemMessages((prev) => [...prev, message]);
      // Remove message after 5 seconds
      setTimeout(() => {
        setSystemMessages((prev) => prev.filter((msg) => msg !== message));
      }, 5000);
    };

    const handleRoomUsersUpdate = (updatedUsers: Record<string, UserInfo>) => {
      console.log("[handleRoomUsersUpdate]", updatedUsers);
      setUsers(updatedUsers);
    };

    socketClient.on("roomState", handleRoomState);
    socketClient.on("writerChanged", handleWriterChanged);
    socketClient.on("messageUpdate", handleMessageUpdate);
    socketClient.on("messageCleared", handleMessageCleared);
    socketClient.on("system_message", handleSystemMessage);
    socketClient.on("room_users_update", handleRoomUsersUpdate);

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    }, 1000);

    // Cleanup function
    return () => {
      socketClient.off("roomState", handleRoomState);
      socketClient.off("writerChanged", handleWriterChanged);
      socketClient.off("messageUpdate", handleMessageUpdate);
      socketClient.off("messageCleared", handleMessageCleared);
      socketClient.off("system_message", handleSystemMessage);
      socketClient.off("room_users_update", handleRoomUsersUpdate);
      clearInterval(timer);
    };
  }, [userColor, roomId, userName]);

  const isBlocked =
    currentWriter !== null &&
    currentWriter.writerId !== socketClient.getSocketId();

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const requestTurn = () => {
    socketClient.requestTurn();
  };

  const grantTurn = (userId: string) => {
    socketClient.grantTurn(userId);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Input value={shareUrl} readOnly className="bg-gray-50" />
          <Button onClick={copyShareLink}>
            {showCopied ? "¡Copiado!" : "Copiar"}
          </Button>
        </div>

        {/* System Messages */}
        {systemMessages.map((message, index) => (
          <div
            key={index}
            className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            {message}
          </div>
        ))}

        {/* Current Message */}
        <div
          className="min-h-[200px] flex items-center justify-center text-2xl font-medium p-4 rounded-lg"
          style={{ color: messageColor || "inherit" }}
        >
          <div className="text-center">
            {currentMessage || "Empieza a escribir..."}
            {writerName && (
              <div className="text-sm mt-2 opacity-75">— {writerName}</div>
            )}
          </div>
        </div>

        {/* Active Writer and Timer */}
        <div className="relative">
          <MessageInput isBlocked={isBlocked} />
          <div className="text-sm py-2 flex items-center gap-4">
            {currentWriter && (
              <span
                data-testid="writing-indicator"
                className="text-base"
                style={{ color: currentWriter.color }}
              >
                {`${currentWriter.name} está escribiendo...`}
              </span>
            )}
            {timeLeft !== null && timeLeft < 30 && (
              <span className="flex items-center gap-1 text-orange-500">
                <Clock className="h-4 w-4" />
                {timeLeft}s
              </span>
            )}
          </div>
        </div>

        {/* Users List and Turn Management */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-2">Usuarios en la sala:</h3>
          <div className="space-y-2">
            {Object.entries(users).map(([userId, user]) => (
              <div
                key={userId}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span>{user.name}</span>
                  {userId === currentWriter?.writerId && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Escribiendo
                    </span>
                  )}
                </div>
                {isBlocked && userId !== socketClient.getSocketId() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestTurn()}
                    disabled={user.requestingTurn}
                  >
                    {user.requestingTurn ? "Turno solicitado" : "Pedir turno"}
                  </Button>
                )}
                {currentWriter?.writerId === socketClient.getSocketId() &&
                  user.requestingTurn &&
                  userId !== socketClient.getSocketId() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => grantTurn(userId)}
                    >
                      Dar turno
                    </Button>
                  )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
