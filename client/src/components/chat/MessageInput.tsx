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
  const previousLengthRef = useRef(0);

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

    // Detectar si es un borrado o nueva letra
    if (newValue.length < previousLengthRef.current) {
      socketClient.sendBackspace();
    } else if (newValue.length > previousLengthRef.current) {
      // Obtener la última letra añadida
      const newLetter = newValue[newValue.length - 1];
      socketClient.sendLetter(newLetter);
    }

    previousLengthRef.current = newValue.length;
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