import { useEffect, useState } from "react";
import axios from "axios";

export default function Chat({ token, username, setToken }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const fetchMessages = async () => {
    const res = await axios.get("http://localhost:5000/messages");
    setMessages(res.data);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input) return;
    await axios.post(
      "http://localhost:5000/messages",
      { content: input },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setInput("");
    fetchMessages();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="p-4 bg-blue-600 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Chatroom</h1>
        <div>
          <span className="mr-3">Logged in as {username}</span>
          <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded max-w-lg ${
              msg.username === username
                ? "bg-blue-200 self-end ml-auto"
                : "bg-gray-200"
            }`}
          >
            <p className="text-sm font-semibold">{msg.username}</p>
            <p>{msg.content}</p>
            <p className="text-xs text-gray-500">{msg.timestamp}</p>
          </div>
        ))}
      </main>
      <form onSubmit={sendMessage} className="p-4 bg-white flex">
        <input
          className="flex-1 border p-2 rounded-l"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="bg-blue-500 text-white px-4 rounded-r">Send</button>
      </form>
    </div>
  );
}
