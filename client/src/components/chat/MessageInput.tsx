import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { socketClient } from "@/lib/socket";

interface MessageInputProps {
  isBlocked: boolean;
}

export function MessageInput({ isBlocked }: MessageInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isWritingRef = useRef(false);
  const previousValueRef = useRef("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBlocked) return;

      if (e.key === "Enter") {
        socketClient.submitMessage();
        setValue("");
        isWritingRef.current = false;
        return;
      }
    };

    const handleBlur = () => {
      if (isWritingRef.current) {
        socketClient.stopWriting();
        isWritingRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isBlocked]);

  useEffect(() => {
    if (!isBlocked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isBlocked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isBlocked) return;

    const newValue = e.target.value;

    // Iniciar escritura si no está escribiendo
    if (!isWritingRef.current) {
      socketClient.startWriting();
      isWritingRef.current = true;
    }

    // Actualizar el mensaje y la última actividad
    socketClient.updateMessage(newValue, Date.now());
    previousValueRef.current = newValue;
    setValue(newValue);
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleChange}
      placeholder={isBlocked ? "Espera tu turno..." : "Escribe tu mensaje..."}
      disabled={isBlocked}
      className="text-lg"
    />
  );
}