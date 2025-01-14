import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle2 } from "lucide-react";

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
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center">
              <UserCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Ingresa tu nombre
            </h2>
            <p className="text-sm text-muted-foreground">
              Tu nombre será visible para otros usuarios en el chat
            </p>
          </div>

          <div className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="h-12 text-lg bg-secondary/30 border-2 focus:border-primary/50"
              autoFocus
            />
            <Button 
              type="submit"
              className="w-full h-12 text-lg font-semibold transition-all
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:scale-100"
              disabled={!name.trim()}
            >
              Continuar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}