"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Register() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref) {
      setReferralCode(ref.trim());
    }
  }, []);

  const normalizePhone = (value) => {
    return String(value || "").replace(/\D/g, "");
  };

  const normalizeCode = (value) => {
    return String(value || "").trim().toLowerCase();
  };

  const generateReferralCode = (
    cleanPhone,
    cleanName,
    existingUsers
  ) => {
    const namePart = String(cleanName || "")
      .replace(/[^a-zA-Z]/g, "")
      .substring(0, 3)
      .toUpperCase();

    const phonePart = normalizePhone(cleanPhone).slice(-6);

    let baseCode = "TH" + namePart + phonePart;

    if (!baseCode || baseCode.length < 5) {
      baseCode = "TH" + Date.now().toString().slice(-6);
    }

    let finalCode = baseCode;
    let counter = 1;

    while (
      existingUsers.some(
        (user) =>
          normalizeCode(user.referral_code) ===
          normalizeCode(finalCode)
      )
    ) {
      finalCode = baseCode + counter;
      counter++;
    }

    return finalCode;
  };

  const findReferrer = (cleanReferral, users) => {
    if (!cleanReferral) {
      return null;
    }

    const normalizedReferral = normalizeCode(cleanReferral);

    return (
      users.find(
        (user) =>
          normalizeCode(user.referral_code) ===
          normalizedReferral
      ) || null
    );
  };

  const handleRegister = async () => {
    setMessage("");

    const cleanName = fullName.trim();
    const cleanPhone = normalizePhone(phone);
    const cleanReferral = referralCode.trim();

    if (
      !cleanName ||
      !cleanPhone ||
      !password ||
      !confirmPassword
    ) {
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

    setLoading(true);

    try {
      // Load existing users only for duplicate phone,
      // referral lookup and referral-code generation.
      const { data: existingUsers, error: usersError } =
        await supabase
          .from("users")
          .select(
            "id, phone, referral_code, full_name"
          );

      if (usersError) {
        console.log("Users load error:", usersError);

        setLoading(false);
        setMessage(
          "Unable to connect to the server. Please try again."
        );
        return;
      }

      const users = Array.isArray(existingUsers)
        ? existingUsers
        : [];

      // Check duplicate phone
      const existingUser = users.find(
        (user) =>
          normalizePhone(user.phone) === cleanPhone
      );

      if (existingUser) {
        setLoading(false);
        setMessage(
          "An account with this number already exists."
        );
        return;
      }

      // Find referral user
      const referrer = findReferrer(
        cleanReferral,
        users
      );

      // Generate unique referral code
      const newReferralCode =
        generateReferralCode(
          cleanPhone,
          cleanName,
          users
        );

      const created_at =
        new Date().toISOString();

      /*
       * IMPORTANT:
       * New user starts with:
       *
       * balance = 0
       * referral_bonus = 0
       * total_referral_bonus = 0
       *
       * NO PLAN IS CREATED HERE.
       *
       * This means a newly registered user will NOT
       * automatically receive an active plan.
       */

      const newUser = {
        id:
          "user-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .substring(2, 8),

        full_name: cleanName,

        phone: cleanPhone,

        password: password,

        balance: 0,

        referral_bonus: 0,

        total_referral_bonus: 0,

        referral_code: newReferralCode,

        referred_by:
          cleanReferral || null,

        referrer_code:
          cleanReferral || null,

        referrer_phone:
          referrer
            ? normalizePhone(referrer.phone)
            : null,

        created_at: created_at,
      };

      // Insert ONLY the new user into users table
      const {
        data: insertedUser,
        error: insertError,
      } = await supabase
        .from("users")
        .insert([newUser])
        .select()
        .single();

      if (insertError) {
        console.log(
          "Supabase registration error:",
          insertError
        );

        setLoading(false);

        setMessage(
          insertError.message ||
            "Registration failed. Please try again."
        );

        return;
      }

      const savedUser =
        insertedUser || newUser;

      // Prepare local user session data
      const localUser = {
        ...savedUser,

        fullName:
          savedUser.full_name,

        referralBonus:
          savedUser.referral_bonus || 0,

        totalReferralBonus:
          savedUser.total_referral_bonus || 0,

        referralCode:
          savedUser.referral_code,

        referredBy:
          savedUser.referred_by,

        referrerCode:
          savedUser.referrer_code,

        referrerPhone:
          savedUser.referrer_phone,

        createdAt:
          savedUser.created_at,

        // Explicitly make sure there is NO active plan
        activePlan: null,

        activePlans: [],

        selectedPlan: null,
      };

      localStorage.setItem(
        "transportUser",
        JSON.stringify(localUser)
      );

      localStorage.setItem(
        "transportCurrentUser",
        JSON.stringify(localUser)
      );

      // User must login after registration
      localStorage.setItem(
        "transportLoggedIn",
        "false"
      );

      // Save referral code
      localStorage.setItem(
        "transportReferralCode_" +
          cleanPhone,
        newReferralCode
      );

      // Save referral information locally
      if (cleanReferral) {
        const referralData = {
          id: savedUser.id,

          fullName: cleanName,

          phone: cleanPhone,

          referredBy: cleanReferral,

          referrerCode: cleanReferral,

          referrerPhone:
            savedUser.referrer_phone,

          createdAt:
            savedUser.created_at,
        };

        let referrals = [];

        try {
          const savedReferrals =
            localStorage.getItem(
              "transportReferrals"
            );

          if (savedReferrals) {
            const parsedReferrals =
              JSON.parse(savedReferrals);

            if (Array.isArray(parsedReferrals)) {
              referrals =
                parsedReferrals;
            }
          }
        } catch (error) {
          console.log(
            "Referral localStorage error:",
            error
          );

          referrals = [];
        }

        referrals.push(referralData);

        localStorage.setItem(
          "transportReferrals",
          JSON.stringify(referrals)
        );
      }

      setLoading(false);

      setMessage(
        "Registration successful! Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.log(
        "Registration error:",
        error
      );

      setLoading(false);

      setMessage(
        "Something went wrong. Please try again."
      );
    }
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

  const isSuccess =
    message.includes("successful");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef3f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 16px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#102A43",
          borderRadius: "20px",
          padding: "34px",
          boxShadow:
            "0 15px 45px rgba(16,42,67,0.20)",
          border:
            "1px solid #1E3A56",
        }}
      >
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
              margin:
                "0 auto 15px",
              border:
                "1px solid #294B66",
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
              margin:
                "8px 0 0",
              color: "#9FB3C8",
              fontSize: "14px",
            }}
          >
            Register your Transport Hub account
          </p>
        </div>

        <div
          style={{
            marginBottom: "17px",
          }}
        >
          <label style={labelStyle}>
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(e) =>
              setFullName(
                e.target.value
              )
            }
            placeholder="Enter your full name"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            marginBottom: "17px",
          }}
        >
          <label style={labelStyle}>
            Mobile Number
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            placeholder="Enter mobile number"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            marginBottom: "17px",
          }}
        >
          <label style={labelStyle}>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            placeholder="Create password"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            marginBottom: "17px",
          }}
        >
          <label style={labelStyle}>
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            placeholder="Confirm password"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            marginBottom: "22px",
          }}
        >
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
              setReferralCode(
                e.target.value
              )
            }
            placeholder="Enter referral code"
            style={inputStyle}
          />
        </div>

        {message && (
          <div
            style={{
              marginBottom: "18px",
              padding:
                "12px 14px",
              borderRadius: "10px",
              background:
                isSuccess
                  ? "#173F31"
                  : "#573533",
              color:
                isSuccess
                  ? "#8FD694"
                  : "#FF9F96",
              fontSize: "14px",
              textAlign: "center",
              border:
                isSuccess
                  ? "1px solid #2E6B4A"
                  : "1px solid #754640",
            }}
          >
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={
            handleRegister
          }
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "11px",
            background:
              loading
                ? "#536B7D"
                : "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
            color: "#FFFFFF",
            fontSize: "16px",
            fontWeight: "700",
            cursor:
              loading
                ? "not-allowed"
                : "pointer",
            boxShadow:
              loading
                ? "none"
                : "0 6px 18px rgba(46,107,74,0.25)",
          }}
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>

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
              textDecoration:
                "none",
            }}
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}