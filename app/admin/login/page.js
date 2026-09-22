"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "admin" && password === "Admin@123") {
      localStorage.setItem("transportAdminLoggedIn", "true");
      window.location.href = "/admin";
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#eef3f7",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "340px",
          padding: "30px",
          background: "#102A43",
          borderRadius: "18px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ color: "#fff", textAlign: "center" }}>
          Admin Login
        </h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            boxSizing: "border-box",
          }}
        />

        {error && (
          <p style={{ color: "#FF9F96", textAlign: "center" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: "#8FD694",
            color: "#102A43",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}