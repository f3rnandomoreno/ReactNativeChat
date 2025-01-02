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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBlocked) return;

      // Start writing on first keypress
      if (!isWritingRef.current) {
        socketClient.startWriting();
        isWritingRef.current = true;
      }

      if (e.key === "Enter") {
        socketClient.submitMessage();
        setValue("");
        isWritingRef.current = false;
        return;
      }

      if (e.key === "Backspace") {
        socketClient.sendBackspace();
        setValue(prev => prev.slice(0, -1));
        return;
      }

      if (e.key.length === 1) {
        socketClient.sendLetter(e.key);
        setValue(prev => prev + e.key);
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

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={() => {}} // Controlled input but changes handled by keydown
      placeholder={isBlocked ? "Espera tu turno..." : "Escribe tu mensaje..."}
      disabled={isBlocked}
      className="text-lg"
    />
  );
}