"use client";

import { useState } from "react";
import { LoginScreen } from "./screens/login-screen";
import { RegisterScreen } from "./screens/register-screen";

export function AuthGate() {
  const [mode, setMode] = useState<"login" | "register">("login");
  return mode === "login" ? (
    <LoginScreen onSwitch={() => setMode("register")} />
  ) : (
    <RegisterScreen onSwitch={() => setMode("login")} />
  );
}
