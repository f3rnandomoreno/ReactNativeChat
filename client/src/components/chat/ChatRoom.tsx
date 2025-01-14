import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageInput } from "./MessageInput";
import { SettingsMenu } from "./SettingsMenu";
import { socketClient } from "@/lib/socket";
import type { WriterInfo, MessageUpdate, UserInfo } from "@/lib/types";
import { Share2, Copy, AlertCircle, Clock } from "lucide-react";

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
  const [showShared, setShowShared] = useState(false);
  const [systemMessages, setSystemMessages] = useState<string[]>([]);
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [lastMessage, setLastMessage] = useState<{
    text: string;
    color: string;
    author: string;
  } | null>(null);
  const [currentUserName, setCurrentUserName] = useState(userName);

  const shareUrl = `${window.location.origin}/room/${roomId}`;
  const canShare = typeof window !== 'undefined' &&
                  'navigator' in window &&
                  'share' in navigator &&
                  typeof navigator.share === 'function';

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

      if (
        !writer ||
        (currentWriter && writer && currentWriter.writerId !== writer.writerId)
      ) {
        console.log(
          "[handleWriterChanged] Limpiando mensaje por cambio de escritor"
        );
        setCurrentMessage("");
        setMessageColor("");
        setWriterName("");
      }

      setCurrentWriter(writer);
      setIsBlocked(
        writer !== null && writer.writerId !== socketClient.getSocketId()
      );
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

      // Actualizamos lastMessage solo cuando se completa un mensaje
      if (message.trim()) {
        setLastMessage({
          text: message,
          color: color,
          author: writerName,
        });
      }
    };

    const handleMessageCleared = () => {
      console.log("[handleMessageCleared]");
      setCurrentMessage("");
      setCurrentWriter(null);
      setMessageColor("");
      setWriterName("");
      setTimeLeft(null);
      // No limpiamos lastMessage aquí para mantener el último mensaje visible
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
    socketClient.on("messageCleared", handleMessageCleared);
    socketClient.on("system_message", handleSystemMessage);
    socketClient.on("room_users_update", handleRoomUsersUpdate);

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    }, 1000);

    return () => {
      socketClient.off("roomState", handleRoomState);
      socketClient.off("writerChanged", handleWriterChanged);
      socketClient.off("messageUpdate", handleMessageUpdate);
      socketClient.off("messageCleared", handleMessageCleared);
      socketClient.off("system_message", handleSystemMessage);
      socketClient.off("room_users_update", handleRoomUsersUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(timer);
    };
  }, [userColor, roomId, currentUserName]);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleShare = async () => {
    if (!canShare) {
      await copyShareLink();
      return;
    }

    try {
      await navigator.share({
        title: 'RealtimeChat: Únete a mi sala',
        text: `${currentUserName} te invita a unirte a una conversación en RealtimeChat`,
        url: shareUrl
      });
      setShowShared(true);
      setTimeout(() => setShowShared(false), 2000);
    } catch (error) {
      console.error('Error sharing:', error);
      // Si falla el compartir, intentamos copiar al portapapeles como fallback
      await copyShareLink();
    }
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

  const requestTurn = () => {
    socketClient.requestTurn();
  };

  const grantTurn = (userId: string) => {
    socketClient.grantTurn(userId);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Input value={shareUrl} readOnly className="bg-gray-50" />
            {canShare ? (
              <Button onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                {showShared ? "¡Compartido!" : "Compartir"}
              </Button>
            ) : (
              <Button onClick={copyShareLink} className="gap-2">
                <Copy className="h-4 w-4" />
                {showCopied ? "¡Copiado!" : "Copiar"}
              </Button>
            )}
          </div>
          <SettingsMenu
            currentName={currentUserName}
            currentColor={userColor}
            onNameChange={handleNameChange}
            onColorChange={handleColorChange}
          />
        </div>

        {systemMessages.map((message, index) => (
          <div
            key={index}
            className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            {message}
          </div>
        ))}

        <div
          className="min-h-[200px] flex items-center justify-center text-2xl font-medium p-4 rounded-lg"
          style={{ color: messageColor || "inherit" }}
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