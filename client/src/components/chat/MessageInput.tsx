import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SquareCheck } from "lucide-react";
import { socketClient } from "@/lib/socket";

interface MessageInputProps {
  isBlocked: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ isBlocked }) => {
  const [message, setMessage] = useState("");
  const isWritingRef = useRef(false);
  const messageUpdateTimeoutRef = useRef<NodeJS.Timeout>();

  const stopWriting = () => {
    if (isWritingRef.current) {
      socketClient.stopWriting();
      isWritingRef.current = false;
    }
  };

  const startWriting = () => {
    if (!isWritingRef.current && !isBlocked) {
      console.log("[MessageInput] Starting writing");
      socketClient.startWriting();
      isWritingRef.current = true;
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && message.trim()) {
      e.preventDefault();

      // Limpiar cualquier actualización pendiente
      if (messageUpdateTimeoutRef.current) {
        clearTimeout(messageUpdateTimeoutRef.current);
      }

      // Asegurar que el último mensaje se envía
      socketClient.updateMessage(message.trim());

      // Pequeña pausa para asegurar que el mensaje se actualizó
      await new Promise(resolve => setTimeout(resolve, 100));

      // Detener la escritura y enviar el mensaje
      stopWriting();
      socketClient.submitMessage();

      // Limpiar el input después de confirmar el envío
      setMessage("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isBlocked) {
      e.preventDefault();
      return;
    }

    const newMessage = e.target.value;
    setMessage(newMessage);

    if (!isWritingRef.current) {
      startWriting();
    }

    // Cancelar cualquier actualización pendiente anterior
    if (messageUpdateTimeoutRef.current) {
      clearTimeout(messageUpdateTimeoutRef.current);
    }

    // Programar la nueva actualización con un pequeño retraso
    messageUpdateTimeoutRef.current = setTimeout(() => {
      socketClient.updateMessage(newMessage);
    }, 50);
  };

  const handleBlur = () => {
    if (isWritingRef.current) {
      stopWriting();
    }
  };

  useEffect(() => {
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
      if (messageUpdateTimeoutRef.current) {
        clearTimeout(messageUpdateTimeoutRef.current);
      }
      stopWriting();
    };
  }, []);

  useEffect(() => {
    if (isBlocked) {
      setMessage("");
      if (messageUpdateTimeoutRef.current) {
        clearTimeout(messageUpdateTimeoutRef.current);
      }
      stopWriting();
    }
  }, [isBlocked]);

  const handleSendMessage = async () => {
    if (message.trim()) {
      // Limpiar cualquier actualización pendiente
      if (messageUpdateTimeoutRef.current) {
        clearTimeout(messageUpdateTimeoutRef.current);
      }

      // Asegurar que el último mensaje se envía
      socketClient.updateMessage(message.trim());

      // Pequeña pausa para asegurar que el mensaje se actualizó
      await new Promise(resolve => setTimeout(resolve, 100));

      // Detener la escritura y enviar el mensaje
      stopWriting();
      socketClient.submitMessage();

      // Limpiar el input después de confirmar el envío
      setMessage("");
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder={isBlocked ? "Espera tu turno..." : "Escribe tu mensaje..."}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isBlocked}
        className="text-lg"
        data-testid="message-input"
      />
      <Button 
        onClick={handleSendMessage} 
        disabled={isBlocked || !message.trim()}
        size="icon"
        className="shrink-0"
      >
        <SquareCheck className="h-5 w-5" />
      </Button>
    </div>
  );
};