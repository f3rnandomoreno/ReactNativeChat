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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && message.trim()) {
      stopWriting();
      socketClient.submitMessage();
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

    socketClient.updateMessage(newMessage);
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
