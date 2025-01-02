import { useState } from "react";
import { ColorPicker } from "@/components/chat/ColorPicker";
import { ChatRoom } from "@/components/chat/ChatRoom";

function App() {
  const [userColor, setUserColor] = useState<string>();

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      {userColor ? (
        <ChatRoom userColor={userColor} />
      ) : (
        <ColorPicker onColorSelected={setUserColor} />
      )}
    </div>
  );
}

export default App;
