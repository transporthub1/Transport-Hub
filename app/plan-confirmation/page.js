"use client";

import { useEffect, useState } from "react";

export default function PlanConfirmation() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    const params = new URLSearchParams(window.location.search);

    const name = params.get("name");
    const price = params.get("price");
    const daily = params.get("daily");
    const duration = params.get("duration");

    if (name && price && daily && duration) {
      const selectedPlan = {
        name: name,
        price: Number(price),
        daily: Number(daily),
        duration: Number(duration),
        total: Number(daily) * Number(duration),
      };

      setPlan(selectedPlan);

      localStorage.setItem(
        "transportSelectedPlan",
        JSON.stringify(selectedPlan)
      );
    } else {
      const savedPlan = localStorage.getItem(
        "transportSelectedPlan"
      );

      if (savedPlan) {
        try {
          setPlan(JSON.parse(savedPlan));
        } catch (error) {
          console.log("Plan data error");
        }
      }
    }
  }, []);

  const currentPlan = plan || {
    name: "Starter Transport Plan",
    price: 100,
    daily: 15,
    duration: 120,
    total: 1800,
  };

  const confirmPlan = () => {
    localStorage.setItem(
      "transportSelectedPlan",
      JSON.stringify(currentPlan)
    );

    window.location.href = "/deposit";
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerIcon}>
            🚛
          </div>

          <div style={styles.headerText}>
            <h1 style={styles.title}>
              Confirm Your Plan
            </h1>

            <p style={styles.subtitle}>
              Review your selected transport plan
            </p>
          </div>
        </header>

        <main style={styles.content}>

          {/* Plan Card */}
          <div style={styles.planCard}>

            <div style={styles.planHeader}>
              <div style={styles.planIcon}>
                🚛
              </div>

              <div style={styles.planHeaderText}>
                <h2 style={styles.planName}>
                  {currentPlan.name}
                </h2>

                <p style={styles.selectedText}>
                  Selected Plan
                </p>
              </div>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.details}>

              {/* Investment */}
              <div style={styles.detailCard}>

                <div style={styles.detailIcon}>
                  💰
                </div>

                <div style={styles.detailContent}>
                  <p style={styles.label}>
                    Investment
                  </p>

                  <strong style={styles.investment}>
                    PKR{" "}
                    {Number(
                      currentPlan.price
                    ).toLocaleString()}
                  </strong>
                </div>

              </div>

              {/* Daily Return */}
              <div style={styles.detailCard}>

                <div style={styles.detailIcon}>
                  📈
                </div>

                <div style={styles.detailContent}>
                  <p style={styles.label}>
                    Daily Return
                  </p>

                  <strong style={styles.value}>
                    PKR{" "}
                    {Number(
                      currentPlan.daily
                    ).toLocaleString()}
                  </strong>
                </div>

              </div>

              {/* Duration */}
              <div style={styles.detailCard}>

                <div style={styles.detailIcon}>
                  📅
                </div>

                <div style={styles.detailContent}>
                  <p style={styles.label}>
                    Duration
                  </p>

                  <strong style={styles.value}>
                    {currentPlan.duration} Days
                  </strong>
                </div>

              </div>

              {/* Total Return */}
              <div style={styles.totalCard}>

                <div style={styles.totalIcon}>
                  💎
                </div>

                <div style={styles.detailContent}>
                  <p style={styles.label}>
                    Total Return
                  </p>

                  <strong style={styles.total}>
                    PKR{" "}
                    {Number(
                      currentPlan.total ||
                      currentPlan.daily *
                        currentPlan.duration
                    ).toLocaleString()}
                  </strong>
                </div>

              </div>

            </div>
          </div>

          {/* Notice */}
          <div style={styles.noticeCard}>

            <div style={styles.noticeIcon}>
              ℹ️
            </div>

            <div style={styles.noticeContent}>
              <h3 style={styles.noticeTitle}>
                Plan Review
              </h3>

              <p style={styles.noticeText}>
                Please review your investment amount and
                expected returns before continuing to the
                deposit page.
              </p>
            </div>

          </div>

          {/* Actions */}
          <div style={styles.actions}>

            <button
              onClick={confirmPlan}
              style={styles.confirmButton}
            >
              ✓ Confirm Plan & Continue to Deposit
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/transport-plans";
              }}
              style={styles.backButton}
            >
              ← Back to Plans
            </button>

          </div>

        </main>
      </div>

      {/* Mobile Responsive Fix */}
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        @media (max-width: 600px) {
          .mobile-page {
            width: 100%;
            overflow-x: hidden;
          }
        }

        @media (max-width: 600px) {
          :global(body) {
            margin: 0;
            overflow-x: hidden;
          }
        }

        @media (max-width: 600px) {
          .mobile-content {
            width: 100%;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    overflowX: "hidden",
    background: "#eef3f7",
    color: "#FFFFFF",
    fontFamily: "Arial, sans-serif",
    paddingBottom: "50px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
    boxSizing: "border-box",
  },

  header: {
    background:
      "linear-gradient(135deg, #102A43, #173B5A)",
    color: "#FFFFFF",
    padding: "28px 30px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 5px 18px rgba(16,42,67,0.18)",
    boxSizing: "border-box",
    width: "100%",
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
    border: "1px solid #294B66",
    flexShrink: 0,
  },

  headerText: {
    minWidth: 0,
    flex: 1,
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
    overflowWrap: "anywhere",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#C9D8E6",
    fontSize: "15px",
    overflowWrap: "anywhere",
  },

  content: {
    padding: "30px 20px",
    boxSizing: "border-box",
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
  },

  planCard: {
    width: "100%",
    maxWidth: "850px",
    margin: "0 auto 22px",
    background: "#102A43",
    borderRadius: "20px",
    padding: "30px",
    border: "1px solid #1E3A56",
    boxShadow:
      "0 7px 22px rgba(16,42,67,0.15)",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  planHeader: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    width: "100%",
    minWidth: 0,
  },

  planIcon: {
    width: "65px",
    height: "65px",
    borderRadius: "18px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    border: "1px solid #294B66",
    flexShrink: 0,
  },

  planHeaderText: {
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
  },

  planName: {
    margin: 0,
    fontSize: "24px",
    color: "#FFFFFF",
    fontWeight: "800",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  selectedText: {
    margin: "5px 0 0",
    color: "#9FB3C8",
    fontSize: "14px",
  },

  divider: {
    height: "1px",
    background: "#294B66",
    margin: "28px 0",
    width: "100%",
  },

  details: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    width: "100%",
    minWidth: 0,
  },

  detailCard: {
    background: "#173B5A",
    border: "1px solid #294B66",
    borderRadius: "14px",
    padding: "19px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  totalCard: {
    background: "#173B5A",
    border: "1px solid #6D5D2D",
    borderRadius: "14px",
    padding: "19px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  detailContent: {
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
  },

  detailIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },

  totalIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    background: "#4C4528",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },

  label: {
    margin: "0 0 5px",
    color: "#9FB3C8",
    fontSize: "13px",
    fontWeight: "600",
    overflowWrap: "anywhere",
  },

  investment: {
    color: "#8FD694",
    fontSize: "19px",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  value: {
    color: "#C9D8E6",
    fontSize: "17px",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  total: {
    color: "#F4D77A",
    fontSize: "19px",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  noticeCard: {
    width: "100%",
    maxWidth: "850px",
    margin: "0 auto 24px",
    background: "#102A43",
    border: "1px solid #6D5D2D",
    borderRadius: "18px",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  noticeIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "13px",
    background: "#4C4528",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    flexShrink: 0,
  },

  noticeContent: {
    minWidth: 0,
    flex: 1,
  },

  noticeTitle: {
    margin: 0,
    color: "#F4D77A",
    fontSize: "17px",
    overflowWrap: "anywhere",
  },

  noticeText: {
    margin: "5px 0 0",
    color: "#C9D8E6",
    fontSize: "13px",
    lineHeight: "1.5",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  actions: {
    width: "100%",
    maxWidth: "850px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxSizing: "border-box",
  },

  confirmButton: {
    width: "100%",
    maxWidth: "100%",
    border: "none",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#FFFFFF",
    padding: "16px 20px",
    borderRadius: "11px",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow:
      "0 6px 15px rgba(46,107,74,0.25)",
    boxSizing: "border-box",
    overflowWrap: "anywhere",
    whiteSpace: "normal",
  },

  backButton: {
    width: "100%",
    maxWidth: "100%",
    border: "1px solid #294B66",
    background: "#102A43",
    color: "#C9D8E6",
    padding: "14px 20px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxSizing: "border-box",
  },
};