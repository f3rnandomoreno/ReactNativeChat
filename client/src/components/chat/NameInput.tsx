import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface NameInputProps {
  onNameSubmit: (name: string) => void;
}

export function NameInput({ onNameSubmit }: NameInputProps) {
  const [name, setName] = useState(() => localStorage.getItem("userName") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem("userName", name.trim());
      onNameSubmit(name.trim());
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold">Ingresa tu nombre</h2>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            autoFocus
          />
          <Button 
            type="submit"
            className="w-full"
            disabled={!name.trim()}
          >
            Continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}