import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { ColorPicker } from "@/components/chat/ColorPicker";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureIcons } from "@/components/chat/FeatureIcons";
import { AppBar } from "@/components/AppBar";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

function App() {
  const [userColor, setUserColor] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [, setLocation] = useLocation();

  const handleNameSubmit = (name: string) => {
    setUserName(name);
  };

  const handleColorSelected = (color: string) => {
    setUserColor(color);
    setLocation(`/room/${generateRoomId()}`);
  };

  const handleColorChange = (newColor: string) => {
    setUserColor(newColor);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Switch>
        <Route path="/">
          <>
            <AppBar />
            <div className="flex-1 p-4 flex items-center justify-center">
              {!userName ? (
                <WelcomeScreen onNameSubmit={handleNameSubmit} />
              ) : !userColor ? (
                <ColorPicker onColorSelected={handleColorSelected} />
              ) : (
                <div className="w-full max-w-2xl space-y-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardContent className="p-6 text-center space-y-4">
                      <h2 className="text-3xl font-bold">Nueva Conversación</h2>
                      <p className="text-gray-600">
                        Inicia una nueva conversación en tiempo real como {userName}
                      </p>
                    </CardContent>
                  </Card>

                  <FeatureIcons />

                  <Card>
                    <CardContent className="p-6">
                      <Button 
                        className="w-full"
                        onClick={() => setLocation(`/room/${generateRoomId()}`)}
                      >
                        Crear Sala
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </>
        </Route>
        <Route path="/room/:roomId">
          {params => {
            if (!userName) {
              setLocation("/");
              return null;
            }

            if (!userColor) {
              return (
                <>
                  <AppBar />
                  <div className="flex-1 p-4 flex items-center justify-center">
                    <ColorPicker onColorSelected={handleColorSelected} />
                  </div>
                </>
              );
            }

            return (
              <>
                <AppBar showBackButton />
                <div className="flex-1 p-4 flex items-center justify-center">
                  <ChatRoom 
                    userColor={userColor} 
                    roomId={params.roomId} 
                    userName={userName}
                    onColorChange={handleColorChange}
                  />
                </div>
              </>
            );
          }}
        </Route>
      </Switch>
    </div>
  );
}

export default App;