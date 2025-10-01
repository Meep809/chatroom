/*
GitHub-ready Chatroom (React + Firebase)
======================================

What this is
- Single-file React component (default export) that implements:
  - Email/password authentication (signup + login)
  - Username creation (displayName)
  - Real-time chat using Firestore

How to use
1. Create a Firebase project: enable Authentication (Email/Password) and Firestore.
2. Replace the firebaseConfig object below with your Firebase project's config.
3. Update Firestore rules for a simple dev setup (only allow authenticated users to read/write):

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }

   (For production, tighten rules; this is intentionally permissive for a simple chat demo.)

4. Install dependencies in a React app (this file can be used with Create React App or Vite):
   - npm install firebase react react-dom
   - Tailwind is optional — classes used here assume Tailwind, but vanilla CSS will work too.

5. Deploy to GitHub Pages:
   - If using Create React App: build and push to gh-pages branch or use GitHub Actions to deploy the build output.


---------- START OF CODE ----------
*/

import React, { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";

// ====== REPLACE THESE WITH YOUR FIREBASE CONFIG ======
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_SENDER_ID",
  appId: "REPLACE_WITH_APP_ID",
};
// =====================================================

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function ChatroomApp() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 p-4">
      <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <header className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Sam's Chatroom</h1>
          <div>
            {loadingUser ? (
              <span>Checking login...</span>
            ) : user ? (
              <UserMenu user={user} />
            ) : (
              <span className="text-sm opacity-80">Not signed in</span>
            )}
          </div>
        </header>

        <main className="p-6">
          {user ? <ChatView user={user} /> : <AuthBox />}
        </main>

        <footer className="px-6 py-3 border-t border-gray-700 text-xs text-gray-400">
          Simple demo: messages stored in Firestore. Make sure to replace firebaseConfig above. :P
        </footer>
      </div>
    </div>
  );
}

function UserMenu({ user }) {
  const handleSignOut = async () => {
    await signOut(auth);
  };
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        <div className="font-medium">{user.displayName || user.email}</div>
        <div className="text-xs opacity-75">{user.email}</div>
      </div>
      <button
        onClick={handleSignOut}
        className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
      >
        Sign out
      </button>
    </div>
  );
}

function AuthBox() {
  const [mode, setMode] = useState("login"); // or 'signup'
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-4 bg-gray-700 rounded">
        <h2 className="text-lg mb-2">{mode === "login" ? "Log in" : "Sign up"}</h2>
        {mode === "login" ? <LoginForm /> : <SignupForm />}
        <div className="mt-3 text-sm opacity-80">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="underline"
          >
            {mode === "login" ? "Create an account" : "Already have an account? Log in"}
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-700 rounded hidden md:block">
        <h3 className="font-medium">Why an account?</h3>
        <p className="mt-2 text-sm opacity-80">
          You pick a username, sign in with email, and messages are saved so the chat persists.
          Privacy? Eh—use a throwaway email if you want. :)
        </p>
      </div>
    </div>
  );
}

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) return setError("Pick a username, please.");
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });
      // also store in users collection
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        username,
        email,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="email"
        className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div className="text-sm text-red-400">{error}</div>}
      <button
        disabled={busy}
        className="mt-2 px-4 py-2 bg-green-600 rounded hover:bg-green-500"
      >
        {busy ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div className="text-sm text-red-400">{error}</div>}
      <button disabled={busy} className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">
        {busy ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}

function ChatView({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const msgs = collection(db, "messages");
    const q = query(msgs, orderBy("createdAt"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setMessages(arr);
      // scroll after tiny delay to allow UI to render
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return () => unsub();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        text: text.trim(),
        uid: user.uid,
        username: user.displayName || user.email,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      console.error(err);
      alert("Failed to send: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-auto p-4 bg-gradient-to-b from-gray-900 to-gray-800 rounded">
        <div className="space-y-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} mine={m.uid === user.uid} />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2 items-center">
        <input
          className="flex-1 p-2 rounded bg-gray-700 border border-gray-600"
          placeholder="Say something witty..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button disabled={sending} className="px-4 py-2 bg-indigo-600 rounded">
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ msg, mine }) {
  const date = msg.createdAt && msg.createdAt.toDate ? msg.createdAt.toDate() : null;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] p-3 rounded-lg ${mine ? "bg-indigo-600" : "bg-gray-700"}`}>
        <div className="text-xs opacity-80">{msg.username}</div>
        <div className="mt-1">{msg.text}</div>
        <div className="text-[10px] mt-2 opacity-60 text-right">{date ? date.toLocaleString() : ""}</div>
      </div>
    </div>
  );
}

/*
---------- END OF FILE ----------

Notes & Extras
- This demo uses Firestore serverTimestamp(); because of that, newly-sent messages may briefly appear without a timestamp until the server time resolves.
- Tailwind utility classes are used for styling; if you don't have Tailwind, either include it or replace classes with your own CSS.
- If you'd prefer a static-only chat (no Firebase), we can wire this to a small backend (Express + SQLite) and deploy with a simple hosting solution — tell me and I'll scaffold it.
*/
