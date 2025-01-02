import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { socketClient } from "@/lib/socket";

interface MessageInputProps {
  isBlocked: boolean;
}

export function MessageInput({ isBlocked }: MessageInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBlocked) return;

      if (e.key === "Enter") {
        socketClient.submitMessage();
        setValue("");
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      placeholder={isBlocked ? "Wait for your turn..." : "Type your message..."}
      disabled={isBlocked}
      className="text-lg"
    />
  );
}
