"use client";

import { useEffect, useState } from "react";

const plans = [
  {
    id: 1,
    name: "Starter",
    amount: 100,
    weekly: 15,
  },
  {
    id: 2,
    name: "Basic",
    amount: 500,
    weekly: 75,
  },
  {
    id: 3,
    name: "Standard",
    amount: 1500,
    weekly: 225,
  },
  {
    id: 4,
    name: "Premium",
    amount: 3500,
    weekly: 525,
  },
  {
    id: 5,
    name: "Advanced",
    amount: 7500,
    weekly: 1125,
  },
  {
    id: 6,
    name: "Professional",
    amount: 13000,
    weekly: 1950,
  },
  {
    id: 7,
    name: "Elite",
    amount: 25000,
    weekly: 3750,
  },
  {
    id: 8,
    name: "Executive",
    amount: 50000,
    weekly: 7500,
  },
  {
    id: 9,
    name: "Platinum",
    amount: 125000,
    weekly: 18750,
  },
  {
    id: 10,
    name: "Diamond",
    amount: 175000,
    weekly: 26250,
  },
  {
    id: 11,
    name: "Royal",
    amount: 225000,
    weekly: 33750,
  },
  {
    id: 12,
    name: "Grand Royal",
    amount: 300000,
    weekly: 45000,
  },
];

export default function PlanConfirmation() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    /* =========================
       GET USER
    ========================= */

    let savedUser = null;

    try {
      savedUser = JSON.parse(
        localStorage.getItem("transportUser") || "null"
      );
    } catch (error) {
      savedUser = null;
    }

    const phone =
      savedUser?.phone ||
      savedUser?.mobile ||
      savedUser?.phoneNumber ||
      "";

    /* =========================
       GET URL PARAMETERS
    ========================= */

    const params = new URLSearchParams(
      window.location.search
    );

    const nameParam = params.get("name");
    const priceParam = params.get("price");
    const amountParam = params.get("amount");

    const weeklyParam = params.get("weekly");

    /* Old compatibility */
    const dailyParam = params.get("daily");

    const planIdParam = params.get("id");

    const selectedAmount = Number(
      amountParam ||
        priceParam ||
        0
    );

    const weekly = weeklyParam
      ? Number(weeklyParam)
      : dailyParam
      ? Number(dailyParam)
      : 0;

    /* =========================
       FIND EXACT PLAN
    ========================= */

    let matchingPlan = null;

    if (planIdParam) {
      matchingPlan = plans.find(
        (item) =>
          Number(item.id) ===
          Number(planIdParam)
      );
    }

    if (!matchingPlan && nameParam) {
      matchingPlan = plans.find(
        (item) =>
          item.name.toLowerCase() ===
          String(nameParam)
            .trim()
            .toLowerCase()
      );
    }

    if (
      !matchingPlan &&
      selectedAmount > 0
    ) {
      matchingPlan = plans.find(
        (item) =>
          Number(item.amount) ===
          selectedAmount
      );
    }

    /* =========================
       BUILD SELECTED PLAN
    ========================= */

    if (
      matchingPlan &&
      Number(matchingPlan.weekly) > 0
    ) {
      const finalPlan = {
        id: Number(matchingPlan.id),

        name: matchingPlan.name,

        amount: Number(
          matchingPlan.amount
        ),

        /* Compatibility */
        price: Number(
          matchingPlan.amount
        ),

        weekly: Number(
          matchingPlan.weekly
        ),

        weeklyReturn: Number(
          matchingPlan.weekly
        ),

        /* Old compatibility */
        daily: Number(
          matchingPlan.weekly
        ),

        dailyReturn: Number(
          matchingPlan.weekly
        ),

        durationYears: 5,

        durationWeeks: 260,

        duration: 260,

        total:
          Number(matchingPlan.weekly) *
          260,

        totalReturn:
          Number(matchingPlan.weekly) *
          260,
      };

      setPlan(finalPlan);

      /* =========================
         SAVE COMMON PLAN
      ========================= */

      localStorage.setItem(
        "transportSelectedPlan",
        JSON.stringify(finalPlan)
      );

      /* =========================
         SAVE USER-SPECIFIC PLAN
      ========================= */

      if (phone) {
        localStorage.setItem(
          "transportSelectedPlan_" +
            phone,
          JSON.stringify(finalPlan)
        );
      }

      return;
    }

    /* =========================
       FALLBACK: SAVED PLAN
    ========================= */

    const savedPlan =
      localStorage.getItem(
        "transportSelectedPlan"
      );

    if (savedPlan) {
      try {
        const saved = JSON.parse(
          savedPlan
        );

        const savedName = String(
          saved?.name || ""
        )
          .trim()
          .toLowerCase();

        const savedAmount = Number(
          saved?.amount ||
            saved?.price ||
            0
        );

        const savedId = Number(
          saved?.id || 0
        );

        let savedMatchingPlan = null;

        if (savedId > 0) {
          savedMatchingPlan =
            plans.find(
              (item) =>
                Number(item.id) ===
                savedId
            );
        }

        if (
          !savedMatchingPlan &&
          savedName
        ) {
          savedMatchingPlan =
            plans.find(
              (item) =>
                item.name.toLowerCase() ===
                savedName
            );
        }

        if (
          !savedMatchingPlan &&
          savedAmount > 0
        ) {
          savedMatchingPlan =
            plans.find(
              (item) =>
                Number(item.amount) ===
                savedAmount
            );
        }

        if (savedMatchingPlan) {
          const savedWeekly = Number(
            savedMatchingPlan.weekly
          );

          const convertedPlan = {
            id: Number(
              savedMatchingPlan.id
            ),

            name:
              savedMatchingPlan.name,

            amount: Number(
              savedMatchingPlan.amount
            ),

            price: Number(
              savedMatchingPlan.amount
            ),

            weekly: savedWeekly,

            weeklyReturn: savedWeekly,

            daily: savedWeekly,

            dailyReturn: savedWeekly,

            durationYears: 5,

            durationWeeks: 260,

            duration: 260,

            total:
              savedWeekly * 260,

            totalReturn:
              savedWeekly * 260,
          };

          setPlan(convertedPlan);

          localStorage.setItem(
            "transportSelectedPlan",
            JSON.stringify(
              convertedPlan
            )
          );

          if (phone) {
            localStorage.setItem(
              "transportSelectedPlan_" +
                phone,
              JSON.stringify(
                convertedPlan
              )
            );
          }
        } else {
          setPlan(saved);
        }
      } catch (error) {
        console.log(
          "Plan data error"
        );
      }
    }
  }, []);

  /* =========================
     DEFAULT PLAN
  ========================= */

  const currentPlan = plan || {
    id: 1,

    name: "Starter",

    amount: 100,

    price: 100,

    weekly: 15,

    weeklyReturn: 15,

    durationYears: 5,

    durationWeeks: 260,

    daily: 15,

    dailyReturn: 15,

    duration: 260,

    total: 3900,

    totalReturn: 3900,
  };

  /* =========================
     CONFIRM PLAN
  ========================= */

  const confirmPlan = () => {
    const savedUser =
      (() => {
        try {
          return JSON.parse(
            localStorage.getItem(
              "transportUser"
            ) || "null"
          );
        } catch {
          return null;
        }
      })();

    const phone =
      savedUser?.phone ||
      savedUser?.mobile ||
      savedUser?.phoneNumber ||
      "";

    const amount = Number(
      currentPlan.amount ||
        currentPlan.price ||
        0
    );

    const weekly = Number(
      currentPlan.weekly ||
        currentPlan.weeklyReturn ||
        currentPlan.daily ||
        currentPlan.dailyReturn ||
        0
    );

    const finalPlan = {
      ...currentPlan,

      id: Number(
        currentPlan.id || 1
      ),

      name:
        currentPlan.name ||
        "Starter",

      amount: amount,

      /* Keep price for old compatibility */
      price: amount,

      weekly: weekly,

      weeklyReturn: weekly,

      daily: weekly,

      dailyReturn: weekly,

      durationYears: 5,

      durationWeeks: 260,

      duration: 260,

      total:
        weekly * 260,

      totalReturn:
        weekly * 260,
    };

    /* =========================
       SAVE COMMON PLAN
    ========================= */

    localStorage.setItem(
      "transportSelectedPlan",
      JSON.stringify(finalPlan)
    );

    /* =========================
       SAVE USER-SPECIFIC PLAN
    ========================= */

    if (phone) {
      localStorage.setItem(
        "transportSelectedPlan_" +
          phone,
        JSON.stringify(finalPlan)
      );
    }

    /* =========================
       GO TO DEPOSIT
    ========================= */

    window.location.href =
      "/deposit";
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

            <div
              className="details-grid"
              style={styles.details}
            >

              {/* Investment */}

              <div
                className="detail-card"
                style={styles.detailCard}
              >

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
                      currentPlan.amount ||
                        currentPlan.price ||
                        0
                    ).toLocaleString()}
                  </strong>

                </div>

              </div>

              {/* Weekly Return */}

              <div
                className="detail-card"
                style={styles.detailCard}
              >

                <div style={styles.detailIcon}>
                  📈
                </div>

                <div style={styles.detailContent}>

                  <p style={styles.label}>
                    Weekly Return
                  </p>

                  <strong style={styles.value}>
                    PKR{" "}
                    {Number(
                      currentPlan.weekly ||
                        0
                    ).toLocaleString()}
                  </strong>

                </div>

              </div>

              {/* Duration */}

              <div
                className="detail-card"
                style={styles.detailCard}
              >

                <div style={styles.detailIcon}>
                  📅
                </div>

                <div style={styles.detailContent}>

                  <p style={styles.label}>
                    Duration
                  </p>

                  <strong style={styles.value}>
                    5 Years
                  </strong>

                </div>

              </div>

              {/* Total Return */}

              <div
                className="total-card"
                style={styles.totalCard}
              >

                <div style={styles.totalIcon}>
                  💎
                </div>

                <div style={styles.detailContent}>

                  <p style={styles.label}>
                    Total Return
                  </p>

                  <strong style={styles.total}>
                    PKR{" "}
                    {(
                      Number(
                        currentPlan.weekly ||
                          0
                      ) * 260
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

      {/* Responsive Mobile CSS */}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(html),
        :global(body) {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        @media (max-width: 600px) {
          .details-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .detail-card,
          .total-card {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 88px !important;
            padding: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .detail-card,
          .total-card {
            min-height: 92px !important;
            padding: 20px 18px !important;
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
    overflowWrap: "break-word",
    wordBreak: "break-word",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#C9D8E6",
    fontSize: "15px",
    overflowWrap: "break-word",
    wordBreak: "break-word",
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
    overflowWrap: "break-word",
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
  },

  investment: {
    color: "#8FD694",
    fontSize: "19px",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  },

  value: {
    color: "#C9D8E6",
    fontSize: "17px",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  },

  total: {
    color: "#F4D77A",
    fontSize: "19px",
    overflowWrap: "break-word",
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
  },

  noticeText: {
    margin: "5px 0 0",
    color: "#C9D8E6",
    fontSize: "13px",
    lineHeight: "1.5",
    overflowWrap: "break-word",
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
    whiteSpace: "normal",
    overflowWrap: "break-word",
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