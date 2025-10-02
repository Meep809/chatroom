import { useState } from "react";
import axios from "axios";

export default function Register({ setPage }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/register", form);
      setSuccess("Account created! You can log in now.");
      setError("");
    } catch {
      setError("Username taken or error occurred");
    }
  };

  return (
    <div className="w-96 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 border rounded"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="w-full bg-green-500 text-white py-2 rounded">Register</button>
      </form>
      <p className="mt-3 text-center text-sm">
        Already have an account?{" "}
        <button className="text-blue-500" onClick={() => setPage("login")}>
          Login
        </button>
      </p>
    </div>
  );
}
