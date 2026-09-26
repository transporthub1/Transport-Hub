"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizePhone = (value) => {
    return String(value || "").replace(/\D/g, "");
  };

  const handleLogin = async () => {
    setMessage("");

    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || !password) {
      setMessage("Please enter your mobile number and password.");
      return;
    }

    setLoading(true);

    try {
      // =========================================================
      // STEP 1: CHECK SUPABASE USERS
      // =========================================================
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", cleanPhone)
        .eq("password", password)
        .maybeSingle();

      // =========================================================
      // SUPABASE USER FOUND
      // =========================================================
      if (!error && data) {
        const user = {
          ...data,

          fullName: data.full_name,

          referralBonus: data.referral_bonus,

          totalReferralBonus: data.total_referral_bonus,

          referralCode: data.referral_code,

          referredBy: data.referred_by,

          referrerCode: data.referrer_code,

          referrerPhone: data.referrer_phone,

          createdAt: data.created_at,
        };

        localStorage.setItem(
          "transportUser",
          JSON.stringify(user)
        );

        localStorage.setItem(
          "transportCurrentUser",
          JSON.stringify(user)
        );

        localStorage.setItem(
          "transportLoggedIn",
          "true"
        );

        localStorage.setItem(
          "transportReferralCode_" + cleanPhone,
          data.referral_code || ""
        );

        setMessage("Login successful! Redirecting...");

        setTimeout(() => {
          window.location.href = "/";
        }, 700);

        return;
      }

      // =========================================================
      // STEP 2: CHECK OLD LOCALSTORAGE USERS
      // =========================================================
      let oldUsers = [];

      try {
        const savedUsers = localStorage.getItem("transportUsers");

        if (savedUsers) {
          const parsedUsers = JSON.parse(savedUsers);

          if (Array.isArray(parsedUsers)) {
            oldUsers = parsedUsers;
          }
        }
      } catch (localError) {
        console.log(
          "Old users localStorage error:",
          localError
        );
      }

      const oldUser = oldUsers.find((item) => {
        const oldPhone = normalizePhone(item.phone);

        return (
          oldPhone === cleanPhone &&
          String(item.password || "") === String(password)
        );
      });

      // =========================================================
      // OLD USER FOUND
      // =========================================================
      if (oldUser) {
        const user = {
          ...oldUser,

          fullName:
            oldUser.fullName ||
            oldUser.full_name ||
            "",

          referralBonus:
            oldUser.referralBonus ??
            oldUser.referral_bonus ??
            0,

          totalReferralBonus:
            oldUser.totalReferralBonus ??
            oldUser.total_referral_bonus ??
            0,

          referralCode:
            oldUser.referralCode ||
            oldUser.referral_code ||
            "",

          referredBy:
            oldUser.referredBy ||
            oldUser.referred_by ||
            "",

          referrerCode:
            oldUser.referrerCode ||
            oldUser.referrer_code ||
            "",

          referrerPhone:
            oldUser.referrerPhone ||
            oldUser.referrer_phone ||
            "",

          createdAt:
            oldUser.createdAt ||
            oldUser.created_at ||
            "",
        };

        localStorage.setItem(
          "transportUser",
          JSON.stringify(user)
        );

        localStorage.setItem(
          "transportCurrentUser",
          JSON.stringify(user)
        );

        localStorage.setItem(
          "transportLoggedIn",
          "true"
        );

        localStorage.setItem(
          "transportReferralCode_" + cleanPhone,
          user.referralCode || ""
        );

        setMessage("Login successful! Redirecting...");

        setTimeout(() => {
          window.location.href = "/";
        }, 700);

        return;
      }

      // =========================================================
      // NO USER FOUND
      // =========================================================
      if (error) {
        console.log(
          "Supabase login error:",
          error
        );
      }

      setLoading(false);
      setMessage(
        "Invalid mobile number or password."
      );
    } catch (error) {
      console.log("Login error:", error);

      setLoading(false);
      setMessage(
        "Something went wrong. Please try again."
      );
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px",
    border: "1px solid #294B66",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    background: "#173B5A",
    color: "#FFFFFF",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "7px",
    color: "#C9D8E6",
    fontSize: "14px",
    fontWeight: "600",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef3f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 16px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#102A43",
          borderRadius: "20px",
          padding: "34px",
          boxShadow:
            "0 15px 45px rgba(16,42,67,0.20)",
          border: "1px solid #1E3A56",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #173B5A, #1E3A56)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              margin: "0 auto 15px",
              border: "1px solid #294B66",
            }}
          >
            🚛
          </div>

          <h1
            style={{
              margin: "0",
              color: "#FFFFFF",
              fontSize: "30px",
              fontWeight: "700",
            }}
          >
            Welcome Back
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#9FB3C8",
              fontSize: "14px",
            }}
          >
            Login to your Transport Hub account
          </p>
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>
            Mobile Number
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            placeholder="Enter mobile number"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter password"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
            style={inputStyle}
          />
        </div>

        {message && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: message.includes("successful")
                ? "#173F31"
                : "#573533",
              color: message.includes("successful")
                ? "#8FD694"
                : "#FF9F96",
              fontSize: "14px",
              textAlign: "center",
              border: message.includes("successful")
                ? "1px solid #2E6B4A"
                : "1px solid #754640",
            }}
          >
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "11px",
            background: loading
              ? "#536B7D"
              : "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
            color: "#FFFFFF",
            fontSize: "16px",
            fontWeight: "700",
            cursor: loading
              ? "not-allowed"
              : "pointer",
            boxShadow: loading
              ? "none"
              : "0 6px 18px rgba(46,107,74,0.25)",
          }}
        >
          {loading
            ? "Logging In..."
            : "Login"}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "22px",
            fontSize: "14px",
            color: "#9FB3C8",
          }}
        >
          Don't have an account?{" "}
          <a
            href="/register"
            style={{
              color: "#8FD694",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
}