import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import Chat from "./Chat";

function App() {
  const [page, setPage] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  if (token) {
    return <Chat token={token} username={username} setToken={setToken} />;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      {page === "login" ? (
        <Login setPage={setPage} setToken={setToken} setUsername={setUsername} />
      ) : (
        <Register setPage={setPage} />
      )}
    </div>
  );
}

export default App;
