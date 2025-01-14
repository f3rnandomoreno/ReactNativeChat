import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";

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
        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 24,
          }}
        >
          <motion.div 
            className="space-y-2 text-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.3,
              }}
            >
              <UserCircle2 className="h-12 w-12 text-primary" />
            </motion.div>
            <motion.h2 
              className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Ingresa tu nombre
            </motion.h2>
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Tu nombre será visible para otros usuarios en el chat
            </motion.p>
          </motion.div>

          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
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
          </motion.div>
        </motion.form>
      </CardContent>
    </Card>
  );
}