import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { socketClient } from "@/lib/socket";

interface MessageInputProps {
  isBlocked: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ isBlocked }) => {
  const [message, setMessage] = useState("");
  const isWritingRef = useRef(false);

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
      e.preventDefault(); // Prevenir comportamiento por defecto
      const currentMessage = message; // Capturar el mensaje actual
      socketClient.updateMessage(currentMessage); // Asegurar que el último mensaje esté sincronizado
      await new Promise(resolve => setTimeout(resolve, 50)); // Pequeña pausa para asegurar sincronización
      stopWriting();
      socketClient.submitMessage();
      setMessage(""); // Limpiar el input después de enviar
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

    // Asegurar que el mensaje se envía después de actualizar el estado local
    setTimeout(() => {
      socketClient.updateMessage(newMessage);
    }, 0);
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
      stopWriting();
    };
  }, []);

  useEffect(() => {
    if (isBlocked) {
      setMessage("");
      stopWriting();
    }
  }, [isBlocked]);

  return (
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
  );
};