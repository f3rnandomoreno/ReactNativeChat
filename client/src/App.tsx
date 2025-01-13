import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { ColorPicker } from "@/components/chat/ColorPicker";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

function App() {
  const [userColor, setUserColor] = useState<string>(() => 
    localStorage.getItem("userColor") || ""
  );
  const [userName, setUserName] = useState<string>(() => 
    localStorage.getItem("userName") || ""
  );
  const [, setLocation] = useLocation();

  const handleColorSelected = (color: string) => {
    setUserColor(color);
    localStorage.setItem("userColor", color);
    setLocation(`/room/${generateRoomId()}`);
  };

  const handleColorChange = (newColor: string) => {
    setUserColor(newColor);
    localStorage.setItem("userColor", newColor);
  };

  if (!userName) {
    return <WelcomeScreen onNameSubmit={setUserName} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 flex items-center justify-center">
      <Switch>
        <Route path="/">
          {userColor ? (
            <Card className="w-full max-w-md">
              <CardContent className="p-6 space-y-4">
                <h1 className="text-2xl font-bold">Crear una sala nueva</h1>
                <Button 
                  className="w-full"
                  onClick={() => setLocation(`/room/${generateRoomId()}`)}
                >
                  Crear Sala
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ColorPicker onColorSelected={handleColorSelected} />
          )}
        </Route>
        <Route path="/room/:roomId">
          {params => userColor ? (
            <ChatRoom 
              userColor={userColor} 
              roomId={params.roomId} 
              userName={userName}
              onColorChange={handleColorChange}
            />
          ) : (
            <ColorPicker onColorSelected={setUserColor} />
          )}
        </Route>
      </Switch>
    </div>
  );
}

export default App;