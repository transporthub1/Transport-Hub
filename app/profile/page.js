"use client";

import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);

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

  const mobile =
    user?.mobile ||
    user?.phone ||
    "03455096922";

  const balance =
    user?.balance !== undefined
      ? user.balance
      : 115;

  const createdAt =
    user?.createdAt ||
    "21/09/2026";

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerIcon}>👤</div>

          <div>
            <h1 style={styles.title}>My Profile</h1>

            <p style={styles.subtitle}>
              Manage your Transport Hub account
            </p>
          </div>
        </header>

        <main style={styles.content}>

          {/* Profile Card */}
          <div style={styles.profileCard}>

            <div style={styles.profileTop}>

              <div style={styles.avatar}>
                {fullName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 style={styles.name}>
                  {fullName}
                </h2>

                <p style={styles.role}>
                  Account Holder
                </p>
              </div>

            </div>

            <div style={styles.divider}></div>

            <div style={styles.infoList}>

              {/* Full Name */}
              <div style={styles.infoRow}>
                <div style={styles.infoLeft}>

                  <div style={styles.infoIcon}>
                    👤
                  </div>

                  <div>
                    <p style={styles.label}>
                      Full Name
                    </p>

                    <strong style={styles.value}>
                      {fullName}
                    </strong>
                  </div>

                </div>
              </div>

              {/* Mobile */}
              <div style={styles.infoRow}>
                <div style={styles.infoLeft}>

                  <div style={styles.infoIcon}>
                    📱
                  </div>

                  <div>
                    <p style={styles.label}>
                      Mobile Number
                    </p>

                    <strong style={styles.value}>
                      {mobile}
                    </strong>
                  </div>

                </div>
              </div>

              {/* Balance */}
              <div style={styles.infoRow}>
                <div style={styles.infoLeft}>

                  <div style={styles.balanceIcon}>
                    💰
                  </div>

                  <div>
                    <p style={styles.label}>
                      Account Balance
                    </p>

                    <strong style={styles.balance}>
                      PKR {Number(balance).toLocaleString()}
                    </strong>
                  </div>

                </div>
              </div>

              {/* Created Date */}
              <div style={styles.infoRowLast}>
                <div style={styles.infoLeft}>

                  <div style={styles.infoIcon}>
                    📅
                  </div>

                  <div>
                    <p style={styles.label}>
                      Account Created
                    </p>

                    <strong style={styles.value}>
                      {createdAt}
                    </strong>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* Security Card */}
          <div style={styles.securityCard}>

            <div style={styles.securityIcon}>
              🔐
            </div>

            <div>
              <h3 style={styles.securityTitle}>
                Account Security
              </h3>

              <p style={styles.securityText}>
                Keep your account information secure and up to date.
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

  profileCard: {
    background: "#102A43",
    borderRadius: "20px",
    padding: "30px",
    border: "1px solid #1E3A56",
    boxShadow: "0 7px 22px rgba(16,42,67,0.13)",
    maxWidth: "850px",
    margin: "0 auto 22px",
  },

  profileTop: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #173B5A, #1E3A56)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "800",
    boxShadow: "0 6px 15px rgba(0,0,0,0.18)",
  },

  name: {
    margin: 0,
    fontSize: "25px",
    color: "#ffffff",
    fontWeight: "800",
  },

  role: {
    margin: "5px 0 0",
    color: "#9FB3C8",
    fontSize: "14px",
  },

  divider: {
    height: "1px",
    background: "#294B66",
    margin: "28px 0 5px",
  },

  infoList: {
    width: "100%",
  },

  infoRow: {
    padding: "20px 5px",
    borderBottom: "1px solid #294B66",
  },

  infoRowLast: {
    padding: "20px 5px",
  },

  infoLeft: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
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

  balanceIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "13px",
    background: "#29435A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
  },

  label: {
    margin: "0 0 5px",
    color: "#9FB3C8",
    fontSize: "13px",
    fontWeight: "600",
  },

  value: {
    color: "#ffffff",
    fontSize: "16px",
  },

  balance: {
    color: "#8FD694",
    fontSize: "18px",
  },

  securityCard: {
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

  securityIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "13px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
  },

  securityTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "17px",
  },

  securityText: {
    margin: "5px 0 0",
    color: "#9FB3C8",
    fontSize: "13px",
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