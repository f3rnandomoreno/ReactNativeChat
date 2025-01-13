import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsMenuProps {
  currentName: string;
  currentColor: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
}

export function SettingsMenu({
  currentName,
  currentColor,
  onNameChange,
  onColorChange,
}: SettingsMenuProps) {
  const [name, setName] = useState(currentName);
  const [color, setColor] = useState(currentColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem("userName", name.trim());
      onNameChange(name.trim());
    }
    if (color) {
      localStorage.setItem("userColor", color);
      onColorChange(color);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Abrir configuración</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-8 p-0 border rounded cursor-pointer"
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Guardar cambios
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
