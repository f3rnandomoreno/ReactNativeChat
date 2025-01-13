import { useState } from "react";
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Switch>
        <Route path="/">
          <>
            <AppBar />
            <main className="flex-1 p-4">
              {!userName ? (
                <WelcomeScreen onNameSubmit={setUserName} />
              ) : !userColor ? (
                <div className="flex items-center justify-center">
                  <ColorPicker onColorSelected={handleColorSelected} />
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-2xl space-y-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                      <CardContent className="p-6 text-center space-y-4">
                        <h2 className="text-3xl font-bold">Nueva Conversación en RealtimeChat</h2>
                        <p className="text-gray-600">
                          Inicia una nueva conversación en tiempo real
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
                </div>
              )}
            </main>
          </>
        </Route>
        <Route path="/room/:roomId">
          {params => userColor ? (
            <>
              <AppBar showBackButton />
              <main className="flex-1 p-4">
                <div className="flex items-center justify-center">
                  <ChatRoom
                    userColor={userColor}
                    roomId={params.roomId}
                    userName={userName}
                    onColorChange={handleColorChange}
                  />
                </div>
              </main>
            </>
          ) : (
            <>
              <AppBar />
              <main className="flex-1 p-4">
                <div className="flex items-center justify-center">
                  <ColorPicker onColorSelected={handleColorSelected} />
                </div>
              </main>
            </>
          )}
        </Route>
      </Switch>
    </div>
  );
}

export default App;