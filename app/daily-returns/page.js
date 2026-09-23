"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_PLAN = {
  name: "Starter",
  price: 100,
  daily: 15,
  duration: 120,
  totalReturn: 1800,
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

function readJSON(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.log("Storage read error:", error);
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function DailyReturns() {
  const [user, setUser] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [withdrawableReturns, setWithdrawableReturns] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    const loggedIn = localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    const savedUser = readJSON("transportUser", null);

    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    setUser(savedUser);

    const phone =
      savedUser.phone ||
      savedUser.mobile ||
      savedUser.number ||
      "";

    let plans = [];

    if (phone) {
      const userPlans = readJSON(
        `transportActivePlans_${phone}`,
        []
      );

      if (Array.isArray(userPlans)) {
        plans = userPlans;
      }
    }

    if (plans.length === 0) {
      const oldPlan = readJSON(
        "transportActivePlan",
        null
      );

      if (oldPlan) {
        plans = Array.isArray(oldPlan)
          ? oldPlan
          : [oldPlan];
      }
    }

    setActivePlans(plans);

    if (phone) {
      const savedWithdrawable = localStorage.getItem(
        `transportWithdrawableReturns_${phone}`
      );

      if (savedWithdrawable !== null) {
        setWithdrawableReturns(
          Number(savedWithdrawable) || 0
        );
      } else {
        let totalEarned = 0;

        plans.forEach((plan) => {
          totalEarned += Number(
            plan.earnedReturns || 0
          );
        });

        setWithdrawableReturns(totalEarned);
      }
    }

    setLoading(false);
  }, []);

  const totalInvestment = useMemo(() => {
    return activePlans.reduce(
      (total, plan) =>
        total + Number(plan.price || plan.amount || 0),
      0
    );
  }, [activePlans]);

  const totalDailyReturn = useMemo(() => {
    return activePlans.reduce(
      (total, plan) =>
        total +
        Number(
          plan.daily ||
          plan.dailyReturn ||
          0
        ),
      0
    );
  }, [activePlans]);

  const totalEarned = useMemo(() => {
    return activePlans.reduce(
      (total, plan) =>
        total + Number(plan.earnedReturns || 0),
      0
    );
  }, [activePlans]);

  const totalExpectedReturn = useMemo(() => {
    return activePlans.reduce(
      (total, plan) =>
        total +
        Number(
          plan.totalReturn ||
          plan.total ||
          (
            Number(
              plan.daily ||
              plan.dailyReturn ||
              0
            ) *
            Number(plan.duration || 120)
          )
        ),
      0
    );
  }, [activePlans]);

  const getNextReturnTime = (plan) => {
    const lastReturnAt =
      plan.lastReturnAt ||
      plan.activatedAt ||
      plan.createdAt;

    if (!lastReturnAt) {
      return null;
    }

    const lastTime = new Date(lastReturnAt).getTime();

    if (Number.isNaN(lastTime)) {
      return null;
    }

    return lastTime + 24 * 60 * 60 * 1000;
  };

  const canClaim = (plan) => {
    const nextTime = getNextReturnTime(plan);

    if (!nextTime) {
      return false;
    }

    return Date.now() >= nextTime;
  };

  const getTimeRemaining = (plan) => {
    const nextTime = getNextReturnTime(plan);

    if (!nextTime) {
      return "Waiting";
    }

    const difference = nextTime - Date.now();

    if (difference <= 0) {
      return "Return Available";
    }

    const totalMinutes = Math.ceil(
      difference / (1000 * 60)
    );

    const hours = Math.floor(
      totalMinutes / 60
    );

    const minutes =
      totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }

    return `${minutes}m remaining`;
  };

  const claimReturn = (planId, index) => {
    if (!user) {
      return;
    }

    const phone =
      user.phone ||
      user.mobile ||
      user.number ||
      "";

    if (!phone) {
      setMessage(
        "User account information is missing."
      );
      setMessageType("error");
      return;
    }

    const plans = readJSON(
      `transportActivePlans_${phone}`,
      []
    );

    if (!Array.isArray(plans)) {
      return;
    }

    const actualIndex = plans.findIndex(
      (item, itemIndex) => {
        if (
          planId &&
          item.id &&
          item.id === planId
        ) {
          return true;
        }

        return itemIndex === index;
      }
    );

    if (actualIndex === -1) {
      setMessage(
        "Active plan could not be found."
      );
      setMessageType("error");
      return;
    }

    const plan = plans[actualIndex];

    if (!canClaim(plan)) {
      setMessage(
        "Today's return is not available yet. Please wait until 24 hours are completed."
      );
      setMessageType("error");
      return;
    }

    const dailyAmount = Number(
      plan.daily ||
      plan.dailyReturn ||
      0
    );

    const duration = Number(
      plan.duration || 120
    );

    const returnsPaid = Number(
      plan.returnsPaid || 0
    );

    if (returnsPaid >= duration) {
      setMessage(
        "This transport plan has completed all daily returns."
      );
      setMessageType("error");
      return;
    }

    if (dailyAmount <= 0) {
      setMessage(
        "Daily return amount is not available for this plan."
      );
      setMessageType("error");
      return;
    }

    setClaimingId(
      planId || actualIndex
    );

    const newEarnedReturns =
      Number(plan.earnedReturns || 0) +
      dailyAmount;

    const newReturnsPaid =
      returnsPaid + 1;

    const now = new Date().toISOString();

    const updatedPlan = {
      ...plan,
      returnsPaid: newReturnsPaid,
      earnedReturns: newEarnedReturns,
      lastReturnAt: now,
      updatedAt: now,
    };

    const updatedPlans = [...plans];

    updatedPlans[actualIndex] =
      updatedPlan;

    saveJSON(
      `transportActivePlans_${phone}`,
      updatedPlans
    );

    if (updatedPlans.length === 1) {
      saveJSON(
        "transportActivePlan",
        updatedPlan
      );
    }

    const oldWithdrawable = Number(
      localStorage.getItem(
        `transportWithdrawableReturns_${phone}`
      ) || 0
    );

    const newWithdrawable =
      oldWithdrawable + dailyAmount;

    localStorage.setItem(
      `transportWithdrawableReturns_${phone}`,
      String(newWithdrawable)
    );

    const transactionKey =
      `transportTransactions_${phone}`;

    const transactions =
      readJSON(
        transactionKey,
        []
      );

    const newTransaction = {
      id:
        "daily-return-" +
        Date.now() +
        "-" +
        actualIndex,

      type: "Daily Return",

      amount: dailyAmount,

      status: "Completed",

      planName:
        updatedPlan.name ||
        updatedPlan.planName ||
        "Transport Plan",

      description:
        `Daily return from ${
          updatedPlan.name ||
          updatedPlan.planName ||
          "Transport Plan"
        }`,

      date: now,

      createdAt: now,
    };

    const transactionList =
      Array.isArray(transactions)
        ? transactions
        : [];

    transactionList.unshift(
      newTransaction
    );

    saveJSON(
      transactionKey,
      transactionList
    );

    setActivePlans(
      updatedPlans
    );

    setWithdrawableReturns(
      newWithdrawable
    );

    setMessage(
      `PKR ${formatMoney(
        dailyAmount
      )} daily return has been added to your withdrawable balance.`
    );

    setMessageType("success");

    setTimeout(() => {
      setClaimingId(null);
    }, 500);
  };

  const displayName =
    user?.fullName ||
    user?.name ||
    user?.username ||
    user?.phone ||
    "User";

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>
            ⏳
          </div>

          <h2 style={styles.loadingTitle}>
            Loading Daily Returns
          </h2>

          <p style={styles.loadingText}>
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              📈
            </div>

            <div>
              <h1 style={styles.title}>
                Daily Returns
              </h1>

              <p style={styles.subtitle}>
                Welcome, {displayName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            style={styles.dashboardButton}
          >
            ← Dashboard
          </button>
        </header>

        <main style={styles.content}>

          {/* MESSAGE */}

          {message && (
            <div
              style={
                messageType === "error"
                  ? styles.errorMessage
                  : styles.successMessage
              }
            >
              <span>
                {messageType === "error"
                  ? "⚠️"
                  : "✅"}
              </span>

              <span>{message}</span>

              <button
                onClick={() => setMessage("")}
                style={styles.closeMessage}
              >
                ×
              </button>
            </div>
          )}

          {/* WALLET */}

          <div style={styles.walletCard}>
            <div>
              <p style={styles.walletLabel}>
                Withdrawable Returns
              </p>

              <h2 style={styles.walletAmount}>
                PKR{" "}
                {formatMoney(
                  withdrawableReturns
                )}
              </h2>

              <p style={styles.walletText}>
                Available balance from completed daily returns
              </p>
            </div>

            <div style={styles.walletIcon}>
              💰
            </div>
          </div>

          {/* SUMMARY */}

          <div style={styles.statsGrid}>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                🚛
              </div>

              <div>
                <p style={styles.statLabel}>
                  Active Plans
                </p>

                <h3 style={styles.statValue}>
                  {activePlans.length}
                </h3>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                💵
              </div>

              <div>
                <p style={styles.statLabel}>
                  Total Investment
                </p>

                <h3 style={styles.statValue}>
                  PKR{" "}
                  {formatMoney(
                    totalInvestment
                  )}
                </h3>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                📅
              </div>

              <div>
                <p style={styles.statLabel}>
                  Daily Return
                </p>

                <h3 style={styles.greenValue}>
                  PKR{" "}
                  {formatMoney(
                    totalDailyReturn
                  )}
                </h3>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                💎
              </div>

              <div>
                <p style={styles.statLabel}>
                  Total Earned
                </p>

                <h3 style={styles.greenValue}>
                  PKR{" "}
                  {formatMoney(
                    totalEarned
                  )}
                </h3>
              </div>
            </div>

          </div>

          {/* NO ACTIVE PLAN */}

          {activePlans.length === 0 && (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>
                🚛
              </div>

              <h2 style={styles.emptyTitle}>
                No Active Transport Plan
              </h2>

              <p style={styles.emptyText}>
                You do not have an approved transport
                plan yet. Select a plan and submit your
                deposit to get started.
              </p>

              <button
                onClick={() => {
                  window.location.href =
                    "/transport-plans";
                }}
                style={styles.primaryButton}
              >
                View Transport Plans
              </button>
            </div>
          )}

          {/* ACTIVE PLANS */}

          {activePlans.length > 0 && (
            <div>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>
                    Active Transport Plans
                  </h2>

                  <p style={styles.sectionText}>
                    Claim your daily return after each
                    completed 24-hour cycle.
                  </p>
                </div>

                <div style={styles.expectedBadge}>
                  Expected: PKR{" "}
                  {formatMoney(
                    totalExpectedReturn
                  )}
                </div>
              </div>

              <div style={styles.plansGrid}>

                {activePlans.map(
                  (plan, index) => {
                    const dailyAmount =
                      Number(
                        plan.daily ||
                        plan.dailyReturn ||
                        0
                      );

                    const duration =
                      Number(
                        plan.duration ||
                        120
                      );

                    const returnsPaid =
                      Number(
                        plan.returnsPaid ||
                        0
                      );

                    const earned =
                      Number(
                        plan.earnedReturns ||
                        0
                      );

                    const completed =
                      returnsPaid >=
                      duration;

                    const available =
                      canClaim(plan);

                    const planId =
                      plan.id ||
                      `plan-${index}`;

                    return (
                      <div
                        key={planId}
                        style={
                          styles.planCard
                        }
                      >

                        <div style={styles.planTop}>
                          <div>
                            <span style={styles.planTag}>
                              ACTIVE PLAN
                            </span>

                            <h3 style={styles.planName}>
                              {plan.name ||
                                plan.planName ||
                                "Transport Plan"}
                            </h3>
                          </div>

                          <div style={styles.planEmoji}>
                            🚛
                          </div>
                        </div>

                        <div style={styles.planGrid}>

                          <div style={styles.planInfo}>
                            <span>
                              Investment
                            </span>

                            <strong>
                              PKR{" "}
                              {formatMoney(
                                plan.price ||
                                plan.amount ||
                                0
                              )}
                            </strong>
                          </div>

                          <div style={styles.planInfo}>
                            <span>
                              Daily Return
                            </span>

                            <strong style={styles.greenText}>
                              PKR{" "}
                              {formatMoney(
                                dailyAmount
                              )}
                            </strong>
                          </div>

                          <div style={styles.planInfo}>
                            <span>
                              Duration
                            </span>

                            <strong>
                              {duration} Days
                            </strong>
                          </div>

                          <div style={styles.planInfo}>
                            <span>
                              Returns Paid
                            </span>

                            <strong>
                              {returnsPaid} /{" "}
                              {duration}
                            </strong>
                          </div>

                        </div>

                        <div style={styles.progressArea}>
                          <div style={styles.progressHeader}>
                            <span>
                              Plan Progress
                            </span>

                            <strong>
                              {Math.min(
                                100,
                                Math.round(
                                  (returnsPaid /
                                    duration) *
                                    100
                                )
                              )}%
                            </strong>
                          </div>

                          <div style={styles.progressTrack}>
                            <div
                              style={{
                                ...styles.progressBar,
                                width: `${Math.min(
                                  100,
                                  (returnsPaid /
                                    duration) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div style={styles.earnedBox}>
                          <div>
                            <span style={styles.earnedLabel}>
                              Earned From This Plan
                            </span>

                            <strong style={styles.earnedAmount}>
                              PKR{" "}
                              {formatMoney(
                                earned
                              )}
                            </strong>
                          </div>

                          <div style={styles.clock}>
                            {completed
                              ? "✅ Completed"
                              : available
                              ? "🎉 Return Available"
                              : `⏳ ${getTimeRemaining(
                                  plan
                                )}`}
                          </div>
                        </div>

                        {!completed && (
                          <button
                            onClick={() =>
                              claimReturn(
                                plan.id,
                                index
                              )
                            }
                            disabled={
                              !available ||
                              claimingId ===
                                planId
                            }
                            style={
                              available
                                ? styles.claimButton
                                : styles.disabledButton
                            }
                          >
                            {claimingId ===
                            planId
                              ? "Processing..."
                              : available
                              ? `💰 Claim PKR ${formatMoney(
                                  dailyAmount
                                )} Return`
                              : `⏳ ${getTimeRemaining(
                                  plan
                                )}`}
                          </button>
                        )}

                        {completed && (
                          <div style={styles.completedBox}>
                            🎉 This plan has completed
                            all {duration} daily returns.
                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            </div>
          )}

          {/* SIMPLE INFORMATION LINES */}

          <div style={styles.simpleInfoSection}>

            <div style={styles.simpleInfoLine}>
              <span style={styles.infoNumber}>
                1
              </span>

              <div style={styles.simpleInfoContent}>
                <strong style={styles.simpleInfoTitle}>
                  Plan Approval
                </strong>

                <p style={styles.simpleInfoText}>
                  Your deposit must be approved by the admin before returns begin.
                </p>
              </div>
            </div>

            <div style={styles.simpleInfoLine}>
              <span style={styles.infoNumber}>
                2
              </span>

              <div style={styles.simpleInfoContent}>
                <strong style={styles.simpleInfoTitle}>
                  24-Hour Cycle
                </strong>

                <p style={styles.simpleInfoText}>
                  A daily return becomes available after each completed 24-hour cycle.
                </p>
              </div>
            </div>

            <div style={styles.simpleInfoLine}>
              <span style={styles.infoNumber}>
                3
              </span>

              <div style={styles.simpleInfoContent}>
                <strong style={styles.simpleInfoTitle}>
                  Claim Return
                </strong>

                <p style={styles.simpleInfoText}>
                  Click the claim button when your daily return becomes available.
                </p>
              </div>
            </div>

            <div style={styles.simpleInfoLine}>
              <span style={styles.infoNumber}>
                4
              </span>

              <div style={styles.simpleInfoContent}>
                <strong style={styles.simpleInfoTitle}>
                  Withdrawable Balance
                </strong>

                <p style={styles.simpleInfoText}>
                  Claimed returns are added to your withdrawable returns balance.
                </p>
              </div>
            </div>

          </div>

          {/* BUTTONS */}

          <div style={styles.buttons}>

            <button
              onClick={() => {
                window.location.href =
                  "/withdraw";
              }}
              style={styles.primaryButton}
            >
              💸 Withdraw Returns
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/transport-plans";
              }}
              style={styles.secondaryButton}
            >
              🚛 View Transport Plans
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/";
              }}
              style={styles.secondaryButton}
            >
              ← Back to Dashboard
            </button>

          </div>

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
    maxWidth: "1200px",
    margin: "0 auto",
  },

  loadingPage: {
    minHeight: "100vh",
    background: "#eef3f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },

  loadingCard: {
    background: "#102A43",
    borderRadius: "18px",
    padding: "35px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(16,42,67,0.18)",
    border: "1px solid #1E3A56",
  },

  loadingIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },

  loadingTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "22px",
  },

  loadingText: {
    margin: "8px 0 0",
    color: "#9FB3C8",
  },

  header: {
    background:
      "linear-gradient(135deg, #102A43 0%, #173B5A 100%)",
    padding: "24px 30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    borderBottom: "1px solid #1E3A56",
    boxShadow:
      "0 8px 24px rgba(16,42,67,0.18)",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  headerIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "15px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "800",
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#C9D8E6",
    fontSize: "14px",
  },

  dashboardButton: {
    border: "1px solid #45627C",
    background: "#173B5A",
    color: "#ffffff",
    padding: "11px 17px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "700",
  },

  content: {
    padding: "28px 20px",
  },

  successMessage: {
    background: "#173B5A",
    border: "1px solid #3E8E5B",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
  },

  errorMessage: {
    background: "#573533",
    border: "1px solid #A65B52",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
  },

  closeMessage: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "20px",
    cursor: "pointer",
  },

  walletCard: {
    background:
      "linear-gradient(135deg, #102A43 0%, #173B5A 100%)",
    borderRadius: "20px",
    padding: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    border: "1px solid #1E3A56",
    boxShadow:
      "0 8px 24px rgba(16,42,67,0.16)",
    marginBottom: "20px",
  },

  walletLabel: {
    margin: 0,
    color: "#9FB3C8",
    fontSize: "14px",
  },

  walletAmount: {
    margin: "7px 0",
    color: "#8FD694",
    fontSize: "32px",
  },

  walletText: {
    margin: 0,
    color: "#C9D8E6",
    fontSize: "13px",
  },

  walletIcon: {
    width: "65px",
    height: "65px",
    borderRadius: "18px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "31px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },

  statCard: {
    background: "#102A43",
    borderRadius: "16px",
    padding: "19px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    border: "1px solid #1E3A56",
    boxShadow:
      "0 5px 16px rgba(16,42,67,0.13)",
  },

  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    flexShrink: 0,
  },

  statLabel: {
    margin: 0,
    color: "#9FB3C8",
    fontSize: "12px",
  },

  statValue: {
    margin: "5px 0 0",
    color: "#ffffff",
    fontSize: "17px",
  },

  greenValue: {
    margin: "5px 0 0",
    color: "#8FD694",
    fontSize: "17px",
  },

  emptyCard: {
    background: "#102A43",
    borderRadius: "20px",
    padding: "45px 25px",
    textAlign: "center",
    border: "1px solid #1E3A56",
    boxShadow:
      "0 7px 22px rgba(16,42,67,0.14)",
    marginBottom: "25px",
  },

  emptyIcon: {
    fontSize: "50px",
    marginBottom: "12px",
  },

  emptyTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "22px",
  },

  emptyText: {
    maxWidth: "600px",
    margin: "10px auto 20px",
    color: "#9FB3C8",
    lineHeight: 1.6,
    fontSize: "14px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "17px",
  },

  sectionTitle: {
    margin: 0,
    color: "#102A43",
    fontSize: "22px",
  },

  sectionText: {
    margin: "5px 0 0",
    color: "#60758A",
    fontSize: "13px",
  },

  expectedBadge: {
    background: "#102A43",
    color: "#8FD694",
    padding: "10px 14px",
    borderRadius: "9px",
    border: "1px solid #1E3A56",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  plansGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px",
    marginBottom: "28px",
  },

  planCard: {
    background: "#102A43",
    borderRadius: "19px",
    padding: "23px",
    border: "1px solid #1E3A56",
    boxShadow:
      "0 7px 22px rgba(16,42,67,0.15)",
  },

  planTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "20px",
  },

  planTag: {
    display: "inline-block",
    background: "#173B5A",
    color: "#8FD694",
    padding: "5px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.5px",
  },

  planName: {
    margin: "8px 0 0",
    color: "#ffffff",
    fontSize: "21px",
  },

  planEmoji: {
    width: "48px",
    height: "48px",
    borderRadius: "13px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
  },

  planGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "18px",
  },

  planInfo: {
    background: "#173B5A",
    borderRadius: "10px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  planInfoSpan: {
    color: "#9FB3C8",
    fontSize: "11px",
  },

  greenText: {
    color: "#8FD694",
  },

  progressArea: {
    marginBottom: "18px",
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: "#C9D8E6",
    fontSize: "12px",
    marginBottom: "7px",
  },

  progressTrack: {
    height: "8px",
    background: "#29435A",
    borderRadius: "20px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background:
      "linear-gradient(90deg, #3E8E5B, #8FD694)",
    borderRadius: "20px",
    transition: "width 0.3s ease",
  },

  earnedBox: {
    background: "#173B5A",
    borderRadius: "11px",
    padding: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "13px",
  },

  earnedLabel: {
    display: "block",
    color: "#9FB3C8",
    fontSize: "11px",
    marginBottom: "4px",
  },

  earnedAmount: {
    display: "block",
    color: "#8FD694",
    fontSize: "17px",
  },

  clock: {
    color: "#C9D8E6",
    fontSize: "12px",
    textAlign: "right",
  },

  claimButton: {
    width: "100%",
    border: "none",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "13px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "13px",
  },

  disabledButton: {
    width: "100%",
    border: "1px solid #45627C",
    background: "#173B5A",
    color: "#9FB3C8",
    padding: "13px 16px",
    borderRadius: "9px",
    cursor: "not-allowed",
    fontWeight: "700",
    fontSize: "13px",
  },

  completedBox: {
    background: "#173B5A",
    border: "1px solid #3E8E5B",
    color: "#8FD694",
    padding: "13px",
    borderRadius: "9px",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "700",
  },

  /* SIMPLE INFORMATION LINES */

  simpleInfoSection: {
    marginBottom: "25px",
    background: "transparent",
  },

  simpleInfoLine: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #d8e1e8",
  },

  simpleInfoContent: {
    minWidth: 0,
    flex: 1,
  },

  infoNumber: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#102A43",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "12px",
    flexShrink: 0,
  },

  simpleInfoTitle: {
    display: "block",
    color: "#102A43",
    fontSize: "13px",
    fontWeight: "800",
    marginTop: "2px",
  },

  simpleInfoText: {
    margin: "3px 0 0",
    color: "#60758A",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  buttons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  primaryButton: {
    border: "none",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "13px 19px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "13px",
  },

  secondaryButton: {
    border: "1px solid #1E3A56",
    background: "#102A43",
    color: "#ffffff",
    padding: "13px 19px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
};