import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { Toaster } from "react-hot-toast";

import App from "./App";
import "./index.css";

import AuthProvider from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const isGoogleConfigured =
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE" &&
  GOOGLE_CLIENT_ID.length > 20;

function AppRoot() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster position="top-right" />
      </ChatProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isGoogleConfigured ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppRoot />
      </GoogleOAuthProvider>
    ) : (
      <AppRoot />
    )}
  </React.StrictMode>
);
