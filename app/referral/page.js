"use client";

import { useEffect, useMemo, useState } from "react";

export default function Referral() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    const savedUser = localStorage.getItem("transportUser");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.log("User data error");
      }
    }
  }, []);

  const fullName =
    user?.fullName ||
    user?.name ||
    "Fakhar Abbas";

  const referralCode = useMemo(() => {
    if (!user) return "";

    const userKey =
      user.phone ||
      user.mobile ||
      user.username ||
      user.email ||
      user.name ||
      "user";

    const storageKey =
      "transportReferralCode_" + String(userKey);

    let savedCode = localStorage.getItem(storageKey);

    if (!savedCode) {
      savedCode =
        "TH" +
        Math.floor(
          100000 + Math.random() * 900000
        ).toString();

      localStorage.setItem(
        storageKey,
        savedCode
      );
    }

    return savedCode;
  }, [user]);

  const referralLink =
    typeof window !== "undefined"
      ? window.location.origin +
        "/register?ref=" +
        encodeURIComponent(referralCode)
      : "";

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.log("Copy failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerIcon}>🔗</div>

          <div>
            <h1 style={styles.title}>Referral</h1>

            <p style={styles.subtitle}>
              Invite friends and build your team
            </p>
          </div>
        </header>

        <main style={styles.content}>

          {/* Account Card */}
          <div style={styles.accountCard}>

            <div style={styles.accountTop}>

              <div style={styles.avatar}>
                {fullName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 style={styles.name}>
                  {fullName}
                </h2>

                <p style={styles.accountText}>
                  Your referral account
                </p>
              </div>

            </div>

            <div style={styles.divider}></div>

            {/* Referral Code */}
            <div style={styles.codeSection}>

              <div style={styles.codeIcon}>
                🎟️
              </div>

              <div style={styles.codeContent}>

                <p style={styles.label}>
                  Referral Code
                </p>

                <div style={styles.codeBox}>
                  <strong style={styles.code}>
                    {referralCode}
                  </strong>
                </div>

              </div>

            </div>

          </div>

          {/* Referral Link Card */}
          <div style={styles.linkCard}>

            <div style={styles.linkHeader}>

              <div style={styles.linkIcon}>
                🔗
              </div>

              <div>
                <h2 style={styles.linkTitle}>
                  Your Referral Link
                </h2>

                <p style={styles.linkSubtitle}>
                  Share this link with your friends
                </p>
              </div>

            </div>

            <div style={styles.linkBox}>
              <span style={styles.linkText}>
                {referralLink}
              </span>
            </div>

            <button
              onClick={copyReferralLink}
              style={{
                ...styles.copyButton,
                background: copied
                  ? "#2E6B4A"
                  : "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
              }}
            >
              {copied ? "✓ Link Copied" : "📋 Copy Referral Link"}
            </button>

          </div>

          {/* Info Card */}
          <div style={styles.infoCard}>

            <div style={styles.infoIcon}>
              👥
            </div>

            <div>
              <h3 style={styles.infoTitle}>
                Build Your Team
              </h3>

              <p style={styles.infoText}>
                Share your referral link with friends and invite
                them to join Transport Hub.
              </p>
            </div>

          </div>

          {/* Back Button */}
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            style={styles.backButton}
          >
            ← Back to Dashboard
          </button>

        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef3f7",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
    paddingBottom: "50px",
  },

  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  header: {
    background: "linear-gradient(135deg, #102A43, #173B5A)",
    color: "#ffffff",
    padding: "28px 30px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 5px 18px rgba(16,42,67,0.20)",
    borderBottom: "1px solid #1E3A56",
  },

  headerIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "16px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "29px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#C9D8E6",
    fontSize: "15px",
  },

  content: {
    padding: "30px 20px",
  },

  accountCard: {
    maxWidth: "850px",
    margin: "0 auto 22px",
    background: "#102A43",
    borderRadius: "20px",
    padding: "30px",
    border: "1px solid #1E3A56",
    boxShadow: "0 7px 22px rgba(16,42,67,0.13)",
  },

  accountTop: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  avatar: {
    width: "70px",
    height: "70px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #173B5A, #1E3A56)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "29px",
    fontWeight: "800",
    boxShadow: "0 6px 15px rgba(0,0,0,0.18)",
  },

  name: {
    margin: 0,
    fontSize: "24px",
    color: "#ffffff",
    fontWeight: "800",
  },

  accountText: {
    margin: "5px 0 0",
    color: "#9FB3C8",
    fontSize: "14px",
  },

  divider: {
    height: "1px",
    background: "#294B66",
    margin: "27px 0",
  },

  codeSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  codeIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "13px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  codeContent: {
    flex: 1,
  },

  label: {
    margin: "0 0 7px",
    color: "#9FB3C8",
    fontSize: "13px",
    fontWeight: "600",
  },

  codeBox: {
    background: "#173B5A",
    border: "1px dashed #52718A",
    borderRadius: "10px",
    padding: "12px 15px",
    display: "inline-block",
    minWidth: "220px",
  },

  code: {
    color: "#8FD694",
    fontSize: "19px",
    letterSpacing: "1px",
  },

  linkCard: {
    maxWidth: "850px",
    margin: "0 auto 22px",
    background: "#102A43",
    borderRadius: "20px",
    padding: "30px",
    border: "1px solid #1E3A56",
    boxShadow: "0 7px 22px rgba(16,42,67,0.13)",
  },

  linkHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },

  linkIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "13px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  linkTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "20px",
  },

  linkSubtitle: {
    margin: "5px 0 0",
    color: "#9FB3C8",
    fontSize: "13px",
  },

  linkBox: {
    background: "#173B5A",
    border: "1px solid #294B66",
    borderRadius: "11px",
    padding: "15px",
    marginBottom: "15px",
    overflow: "hidden",
  },

  linkText: {
    display: "block",
    color: "#C9D8E6",
    fontSize: "14px",
    wordBreak: "break-all",
    lineHeight: "1.5",
  },

  copyButton: {
    width: "100%",
    border: "none",
    color: "#ffffff",
    padding: "14px 20px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 5px 12px rgba(46,107,74,0.20)",
  },

  infoCard: {
    maxWidth: "850px",
    margin: "0 auto 22px",
    background: "#102A43",
    border: "1px solid #294B66",
    borderRadius: "18px",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow: "0 6px 18px rgba(16,42,67,0.10)",
  },

  infoIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "13px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
  },

  infoTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "17px",
  },

  infoText: {
    margin: "5px 0 0",
    color: "#9FB3C8",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  backButton: {
    display: "block",
    margin: "0 auto",
    border: "1px solid #1E3A56",
    background: "#102A43",
    color: "#ffffff",
    padding: "14px 25px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 5px 14px rgba(16,42,67,0.12)",
  },
};