import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageInput } from "./MessageInput";
import { SettingsMenu } from "./SettingsMenu";
import { socketClient } from "@/lib/socket";
import type { WriterInfo, MessageUpdate, UserInfo } from "@/lib/types";
import { AlertCircle, Clock } from "lucide-react";

interface ChatRoomProps {
  userColor: string;
  roomId: string;
  userName: string;
  onColorChange?: (color: string) => void;
}

export function ChatRoom({ userColor, roomId, userName, onColorChange }: ChatRoomProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [writerName, setWriterName] = useState("");
  const [currentWriter, setCurrentWriter] = useState<WriterInfo | null>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [systemMessages, setSystemMessages] = useState<string[]>([]);
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [isBlocked, setIsBlocked] = useState(false);
  const [lastMessage, setLastMessage] = useState<{
    text: string;
    color: string;
    author: string;
  } | null>(null);
  const [currentUserName, setCurrentUserName] = useState(userName);

  const shareUrl = `${window.location.origin}/room/${roomId}`;

  useEffect(() => {
    const connectAndJoin = () => {
      console.log("[ChatRoom] Connecting and joining room...");
      socketClient.connect();
      socketClient.joinRoom(roomId, userColor, currentUserName);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[ChatRoom] Window became visible, reconnecting...");
        connectAndJoin();
      }
    };

    connectAndJoin();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleRoomState = (state: {
      currentMessage: string;
      activeWriter: string | null;
      lastActivity: number;
      users: Record<string, UserInfo>;
    }) => {
      console.log("[handleRoomState]", state);
      setCurrentMessage(state.currentMessage);
      setUsers(state.users);

      if (state.activeWriter) {
        const writer = {
          writerId: state.activeWriter,
          color: state.users[state.activeWriter].color,
          name: state.users[state.activeWriter].name,
        };
        setCurrentWriter(writer);
        if (writer.writerId !== socketClient.getSocketId()) {
          setIsBlocked(true);
        }
      } else {
        setCurrentWriter(null);
        setIsBlocked(false);
      }
    };

    const handleWriterChanged = (writer: WriterInfo | null) => {
      console.log("[handleWriterChanged]", writer);
      if (!writer || (currentWriter && writer && currentWriter.writerId !== writer.writerId)) {
        setCurrentMessage("");
        setMessageColor("");
        setWriterName("");
      }

      setCurrentWriter(writer);
      setIsBlocked(writer !== null && writer.writerId !== socketClient.getSocketId());
    };

    const handleMessageUpdate = ({ message, color, writerName }: MessageUpdate) => {
      console.log("[handleMessageUpdate]", { message, color, writerName });
      setCurrentMessage(message);
      setMessageColor(color);
      setWriterName(writerName);

      if (!currentWriter) {
        setLastMessage({
          text: message,
          color: color,
          author: writerName,
        });
      }
    };

    const handleSystemMessage = (message: string) => {
      console.log("[handleSystemMessage]", message);
      setSystemMessages((prev) => [...prev, message]);
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
    socketClient.on("system_message", handleSystemMessage);
    socketClient.on("room_users_update", handleRoomUsersUpdate);

    return () => {
      socketClient.off("roomState", handleRoomState);
      socketClient.off("writerChanged", handleWriterChanged);
      socketClient.off("messageUpdate", handleMessageUpdate);
      socketClient.off("system_message", handleSystemMessage);
      socketClient.off("room_users_update", handleRoomUsersUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userColor, roomId, currentUserName]);

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleNameChange = (newName: string) => {
    setCurrentUserName(newName);
    socketClient.joinRoom(roomId, userColor, newName);
  };

  const handleColorChange = (newColor: string) => {
    if (onColorChange) {
      onColorChange(newColor);
    }
    socketClient.joinRoom(roomId, newColor, currentUserName);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-6">
        {/* Header con compartir enlace y configuración */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Input value={shareUrl} readOnly className="bg-gray-50" />
            <Button onClick={copyShareLink}>
              {showCopied ? "¡Copiado!" : "Copiar"}
            </Button>
          </div>
          <SettingsMenu
            currentName={currentUserName}
            currentColor={userColor}
            onNameChange={handleNameChange}
            onColorChange={handleColorChange}
          />
        </div>

        {/* Mensajes del sistema */}
        {systemMessages.map((message, index) => (
          <div
            key={index}
            className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            {message}
          </div>
        ))}

        {/* Área de mensajes */}
        <div
          className="min-h-[200px] flex items-center justify-center text-2xl font-medium p-4 rounded-lg transition-colors duration-200"
          style={{
            backgroundColor: messageColor ? `${messageColor}15` : "transparent",
            borderColor: messageColor,
            borderWidth: currentWriter ? "1px" : "0",
            color: messageColor || "inherit",
          }}
        >
          <div className="text-center">
            {currentWriter ? (
              <>
                {currentMessage}
                {writerName && (
                  <div className="text-sm mt-2 opacity-75">— {writerName}</div>
                )}
              </>
            ) : lastMessage ? (
              <>
                {lastMessage.text}
                <div className="text-sm mt-2 opacity-75">
                  — {lastMessage.author}
                </div>
              </>
            ) : (
              "Empieza a escribir..."
            )}
          </div>
        </div>

        {/* Input de mensaje y indicador de escritura */}
        <div className="relative">
          <MessageInput isBlocked={isBlocked} />
          {currentWriter && (
            <span
              className="text-sm py-2"
              style={{ color: currentWriter.color }}
            >
              {`${currentWriter.name} está escribiendo...`}
            </span>
          )}
        </div>

        {/* Lista de usuarios */}
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
                    onClick={() => socketClient.requestTurn()}
                  >
                    Pedir turno
                  </Button>
                )}
                {currentWriter?.writerId === socketClient.getSocketId() &&
                  user.requestingTurn &&
                  userId !== socketClient.getSocketId() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => socketClient.grantTurn(userId)}
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