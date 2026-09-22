"use client";

import { useEffect, useState } from "react";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const handleRegister = () => {
    setMessage("");

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanReferral = referralCode.trim();

    if (!cleanName || !cleanPhone || !password || !confirmPassword) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (!/^[0-9]+$/.test(cleanPhone)) {
      setMessage("Please enter a valid mobile number.");
      return;
    }

    if (cleanPhone.length < 10) {
      setMessage("Please enter a valid mobile number.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    let users = [];

    try {
      const savedUsers = localStorage.getItem("transportUsers");

      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);

        if (Array.isArray(parsedUsers)) {
          users = parsedUsers;
        }
      }
    } catch (error) {
      users = [];
    }

    const existingUser = users.find(
      (user) => user.phone === cleanPhone
    );

    if (existingUser) {
      setMessage("An account with this number already exists.");
      return;
    }

    const newUser = {
      id:
        "user-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 8),

      fullName: cleanName,
      phone: cleanPhone,
      password: password,
      balance: 0,
      createdAt: new Date().toISOString(),
      referredBy: cleanReferral || null,
    };

    users.push(newUser);

    localStorage.setItem(
      "transportUsers",
      JSON.stringify(users)
    );

    localStorage.setItem(
      "transportUser",
      JSON.stringify(newUser)
    );

    localStorage.setItem(
      "transportLoggedIn",
      "false"
    );

    if (cleanReferral) {
      let referrals = [];

      try {
        const savedReferrals =
          localStorage.getItem("transportReferrals");

        if (savedReferrals) {
          const parsedReferrals = JSON.parse(savedReferrals);

          if (Array.isArray(parsedReferrals)) {
            referrals = parsedReferrals;
          }
        }
      } catch (error) {
        referrals = [];
      }

      referrals.push({
        id: newUser.id,
        fullName: newUser.fullName,
        phone: newUser.phone,
        referredBy: cleanReferral,
        createdAt: newUser.createdAt,
      });

      localStorage.setItem(
        "transportReferrals",
        JSON.stringify(referrals)
      );
    }

    setMessage(
      "Registration successful! Redirecting to login..."
    );

    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 14px",
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
          maxWidth: "460px",
          background: "#102A43",
          borderRadius: "20px",
          padding: "34px",
          boxShadow: "0 15px 45px rgba(16,42,67,0.20)",
          border: "1px solid #1E3A56",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
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
            Create Account
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#9FB3C8",
              fontSize: "14px",
            }}
          >
            Register your Transport Hub account
          </p>
        </div>

        {/* Full Name */}
        <div style={{ marginBottom: "17px" }}>
          <label style={labelStyle}>
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            style={inputStyle}
          />
        </div>

        {/* Mobile Number */}
        <div style={{ marginBottom: "17px" }}>
          <label style={labelStyle}>
            Mobile Number
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter mobile number"
            style={inputStyle}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "17px" }}>
          <label style={labelStyle}>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
            style={inputStyle}
          />
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: "17px" }}>
          <label style={labelStyle}>
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Confirm password"
            style={inputStyle}
          />
        </div>

        {/* Referral Code */}
        <div style={{ marginBottom: "22px" }}>
          <label style={labelStyle}>
            Referral Code{" "}
            <span
              style={{
                color: "#9FB3C8",
                fontWeight: "400",
              }}
            >
              (Optional)
            </span>
          </label>

          <input
            type="text"
            value={referralCode}
            onChange={(e) =>
              setReferralCode(e.target.value)
            }
            placeholder="Enter referral code"
            style={inputStyle}
          />
        </div>

        {/* Message */}
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

        {/* Register Button */}
        <button
          type="button"
          onClick={handleRegister}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "11px",
            background:
              "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
            color: "#FFFFFF",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(46,107,74,0.25)",
          }}
        >
          Create Account
        </button>

        {/* Login */}
        <div
          style={{
            textAlign: "center",
            marginTop: "22px",
            fontSize: "14px",
            color: "#9FB3C8",
          }}
        >
          Already have an account?{" "}
          <a
            href="/login"
            style={{
              color: "#8FD694",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}