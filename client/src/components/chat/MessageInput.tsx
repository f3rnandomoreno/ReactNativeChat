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
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (isBlocked) return;

      if (e.key === "Enter") {
        stopWriting();
        socketClient.submitMessage();
        setValue("");
        return;
      }
    };

    const handleBlur = () => {
      if (isWritingRef.current) {
        stopWriting();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      stopWriting();
    };
  }, [isBlocked]);

  useEffect(() => {
    console.log("[MessageInput] isBlocked changed:", isBlocked);
    if (isBlocked) {
      setValue("");
      stopWriting();
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isBlocked]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isBlocked) {
      console.log("[MessageInput] Change blocked");
      e.preventDefault();
      return;
    }

    const newValue = e.target.value;
    console.log("[MessageInput] New value:", newValue);

    if (!isWritingRef.current) {
      startWriting();
    }

    socketClient.updateMessage(newValue);
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
      data-testid="message-input"
    />
  );
}
