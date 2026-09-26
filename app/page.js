"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const PLAN_DURATION_WEEKS = 260;
const PLAN_DURATION_YEARS = 5;

const plans = [
  { name: "Starter", price: 100, weekly: 15, durationWeeks: 260, durationYears: 5 },
  { name: "Basic", price: 500, weekly: 75, durationWeeks: 260, durationYears: 5 },
  { name: "Standard", price: 1500, weekly: 225, durationWeeks: 260, durationYears: 5 },
  { name: "Premium", price: 3500, weekly: 525, durationWeeks: 260, durationYears: 5 },
  { name: "Advanced", price: 7500, weekly: 1125, durationWeeks: 260, durationYears: 5 },
  { name: "Professional", price: 13000, weekly: 1950, durationWeeks: 260, durationYears: 5 },
  { name: "Elite", price: 25000, weekly: 3750, durationWeeks: 260, durationYears: 5 },
  { name: "Executive", price: 50000, weekly: 7500, durationWeeks: 260, durationYears: 5 },
  { name: "Platinum", price: 125000, weekly: 18750, durationWeeks: 260, durationYears: 5 },
  { name: "Diamond", price: 175000, weekly: 26250, durationWeeks: 260, durationYears: 5 },
  { name: "Royal", price: 225000, weekly: 33750, durationWeeks: 260, durationYears: 5 },
  { name: "Grand Royal", price: 300000, weekly: 45000, durationWeeks: 260, durationYears: 5 },
];

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

function getStorageArray(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function getStorageObject(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUserName(user) {
  if (!user) return "User";

  const directName =
    user.name ||
    user.fullName ||
    user.username ||
    user.displayName;

  if (directName && String(directName).trim()) {
    return String(directName).trim();
  }

  const firstName = String(user.firstName || "").trim();
  const lastName = String(user.lastName || "").trim();
  const combinedName = (firstName + " " + lastName).trim();

  return combinedName || "User";
}

function getWeeklyReturn(plan) {
  return Number(
    plan?.weekly ??
      plan?.weeklyReturn ??
      plan?.daily ??
      plan?.dailyReturn ??
      0
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [withdrawableReturns, setWithdrawableReturns] = useState(0);

  const [showFeatures, setShowFeatures] = useState(false);

  /* ===== PRIZE POPUP ===== */
  const [showPrizePopup, setShowPrizePopup] = useState(true);

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      const loggedIn = localStorage.getItem("transportLoggedIn");

      if (loggedIn !== "true") {
        window.location.href = "/login";
        return;
      }

      let storedUser = getStorageObject("transportUser");

      if (!storedUser) {
        storedUser = getStorageObject("transportCurrentUser");
      }

      if (!storedUser) {
        window.location.href = "/login";
        return;
      }

      const displayName = getUserName(storedUser);

      const normalizedUser = {
        ...storedUser,
        name: displayName,
      };

      saveStorage("transportUser", normalizedUser);
      setUser(normalizedUser);

      const phone = normalizedUser.phone || "unknown";

      const storedActivePlans = getStorageArray(
        "transportActivePlans_" + phone
      );

      if (storedActivePlans.length > 0) {
        const normalizedPlans = storedActivePlans.map((plan) => ({
          ...plan,

          weekly: Number(
            plan.weekly ??
              plan.weeklyReturn ??
              plan.daily ??
              plan.dailyReturn ??
              0
          ),

          durationWeeks: PLAN_DURATION_WEEKS,
          durationYears: PLAN_DURATION_YEARS,
          duration: PLAN_DURATION_WEEKS,
        }));

        setActivePlans(normalizedPlans);

        saveStorage(
          "transportActivePlans_" + phone,
          normalizedPlans
        );
      } else {
        const oldPlan = getStorageObject("transportActivePlan");

        if (oldPlan) {
          const normalizedOldPlan = {
            ...oldPlan,

            weekly: Number(
              oldPlan.weekly ??
                oldPlan.weeklyReturn ??
                oldPlan.daily ??
                oldPlan.dailyReturn ??
                0
            ),

            durationWeeks: PLAN_DURATION_WEEKS,
            durationYears: PLAN_DURATION_YEARS,
            duration: PLAN_DURATION_WEEKS,
          };

          setActivePlans([normalizedOldPlan]);
        }
      }

      const storedWithdrawable = Number(
        localStorage.getItem(
          "transportWithdrawableReturns_" + phone
        ) || 0
      );

      setWithdrawableReturns(storedWithdrawable);

      const storedTransactions = getStorageArray(
        "transportTransactions_" + phone
      );

      setTransactions(storedTransactions);

      try {
        const { data: withdrawalRows, error: withdrawalError } =
          await supabase
            .from("withdraw_requests")
            .select("*")
            .eq("user_phone", phone)
            .order("created_at", { ascending: false });

        if (!withdrawalError && Array.isArray(withdrawalRows)) {
          setWithdrawRequests(withdrawalRows);
        } else {
          setWithdrawRequests([]);
        }
      } catch (error) {
        setWithdrawRequests([]);
      }

      setTeamMembers(
        getStorageArray(
          "transportTeam_" + phone
        )
      );

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const displayName = getUserName(user);

  const totalInvestment = useMemo(() => {
    return activePlans.reduce(
      (total, plan) =>
        total + Number(plan.price || 0),
      0
    );
  }, [activePlans]);

  const weeklyReturn = useMemo(() => {
    return activePlans.reduce(
      (total, plan) =>
        total + getWeeklyReturn(plan),
      0
    );
  }, [activePlans]);

  const earnedReturns = useMemo(() => {
    return activePlans.reduce((total, plan) => {
      const storedEarned = Number(
        plan.earnedReturns ??
          plan.totalEarned ??
          0
      );

      if (storedEarned > 0) {
        return total + storedEarned;
      }

      return total;
    }, 0);
  }, [activePlans]);

  const expectedReturn = useMemo(() => {
    return activePlans.reduce(
      (total, plan) =>
        total +
        getWeeklyReturn(plan) *
          PLAN_DURATION_WEEKS,
      0
    );
  }, [activePlans]);

  const depositTotal = useMemo(() => {
    return transactions
      .filter(
        (item) =>
          String(item.type || "").toLowerCase() ===
            "deposit" &&
          String(item.status || "").toLowerCase() ===
            "approved"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [transactions]);

  const withdrawalTotal = useMemo(() => {
    return withdrawRequests
      .filter(
        (item) =>
          String(item.status || "").toLowerCase() ===
          "approved"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [withdrawRequests]);

  const pendingDeposits = useMemo(() => {
    return transactions
      .filter(
        (item) =>
          String(item.type || "").toLowerCase() ===
            "deposit" &&
          String(item.status || "").toLowerCase() ===
            "pending"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [transactions]);

  const pendingWithdrawals = useMemo(() => {
    return withdrawRequests
      .filter(
        (item) =>
          String(item.status || "").toLowerCase() ===
          "pending"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [withdrawRequests]);

  const teamInvestment = useMemo(() => {
    return teamMembers.reduce(
      (total, member) =>
        total + Number(member.investment || 0),
      0
    );
  }, [teamMembers]);

  const paidTeam = useMemo(() => {
    return teamMembers.reduce(
      (total, member) =>
        total + Number(member.commission || 0),
      0
    );
  }, [teamMembers]);

  const todayTeam = useMemo(() => {
    return teamMembers.reduce((total, member) => {
      if (!member.joinedAt) return total;

      const joined = new Date(member.joinedAt);
      const now = new Date();

      const sameDay =
        joined.getDate() === now.getDate() &&
        joined.getMonth() === now.getMonth() &&
        joined.getFullYear() === now.getFullYear();

      return sameDay
        ? total + Number(member.commission || 0)
        : total;
    }, 0);
  }, [teamMembers]);

  const todayProfit = weeklyReturn;
  const yesterdayProfit = weeklyReturn;
  const weekProfit = weeklyReturn;
  const monthProfit = weeklyReturn * 4;

  /* ===== WALLET BALANCE FIX ===== */
  const walletBalance =
    Number(withdrawableReturns || 0);

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
        referralCode
      : "";

  const recentTransactions = useMemo(() => {
    const withdrawalRecords = withdrawRequests.map((item) => ({
      id: item.id,
      type: "withdraw",
      status: item.status || "Pending",
      amount: Number(item.amount || 0),
      date: item.submitted_at || item.created_at || "Recently",
      createdAt: item.submitted_at || item.created_at || "",
      returnType: "",
      withdrawalRequestId: item.id,
    }));

    const withdrawalAmounts = withdrawalRecords.map((item) =>
      Number(item.amount || 0)
    );

    const isLocalWithdrawalDuplicate = (item) => {
      const type = String(item.type || "").toLowerCase();
      const title = String(
        item.title ||
          item.name ||
          item.description ||
          ""
      ).toLowerCase();

      const itemAmount = Number(item.amount || 0);

      if (
        type === "withdraw" ||
        type === "withdrawal"
      ) {
        return true;
      }

      if (title.includes("withdraw")) {
        return true;
      }

      if (
        !withdrawalAmounts.includes(itemAmount) ||
        itemAmount <= 0
      ) {
        return false;
      }

      const itemDateValue =
        item.createdAt ||
        item.created_at ||
        item.submittedAt ||
        item.submitted_at ||
        item.date;

      if (!itemDateValue) return false;

      const itemTime = new Date(itemDateValue).getTime();

      if (!Number.isFinite(itemTime)) {
        return false;
      }

      return withdrawalRecords.some((withdrawal) => {
        if (
          Number(withdrawal.amount || 0) !==
          itemAmount
        ) {
          return false;
        }

        const withdrawalTime = new Date(
          withdrawal.createdAt ||
            withdrawal.created_at ||
            0
        ).getTime();

        if (!Number.isFinite(withdrawalTime)) {
          return false;
        }

        return (
          Math.abs(
            itemTime - withdrawalTime
          ) <=
          2 * 60 * 1000
        );
      });
    };

    const nonWithdrawalTransactions =
      transactions.filter(
        (item) =>
          !isLocalWithdrawalDuplicate(item)
      );

    const centralWithdrawalTransactions =
      withdrawalRecords;

    return [
      ...nonWithdrawalTransactions,
      ...centralWithdrawalTransactions,
    ].sort((a, b) => {
      const aTime = new Date(
        a.createdAt ||
          a.created_at ||
          a.submittedAt ||
          a.submitted_at ||
          a.date ||
          0
      ).getTime();

      const bTime = new Date(
        b.createdAt ||
          b.created_at ||
          b.submittedAt ||
          b.submitted_at ||
          b.date ||
          0
      ).getTime();

      return bTime - aTime;
    });
  }, [transactions, withdrawRequests]);

  function goTo(path) {
    setMenuOpen(false);
    window.location.href = path;
  }

  function copyReferral() {
    if (!referralLink) return;

    navigator.clipboard.writeText(referralLink);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function logout() {
    localStorage.removeItem("transportLoggedIn");
    localStorage.removeItem("transportUser");
    localStorage.removeItem("transportCurrentUser");

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>
            🚛
          </div>

          <div style={styles.loadingTitle}>
            Transport Hub
          </div>

          <div style={styles.loadingText}>
            Loading your dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.dashboard,
        overflowX: "hidden",
      }}
    >
      <style jsx global>{`
        @keyframes transportCardFloat {
          0%,
          100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes welcomeTextMove {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(100%);
          }
        }

        @keyframes prizePopupIn {
          0% {
            opacity: 0;
            transform: scale(0.92)
              translateY(20px);
          }

          100% {
            opacity: 1;
            transform: scale(1)
              translateY(0);
          }
        }

        @keyframes prizeGlow {
          0%,
          100% {
            box-shadow:
              0 0 15px
                rgba(247, 201, 72, 0.12),
              0 0 35px
                rgba(44, 130, 201, 0.08);
          }

          50% {
            box-shadow:
              0 0 28px
                rgba(247, 201, 72, 0.25),
              0 0 55px
                rgba(44, 130, 201, 0.14);
          }
        }

        @keyframes prizeIconFloat {
          0%,
          100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        .transport-animated-card {
          animation:
            transportCardFloat 5s ease-in-out
            infinite;
        }

        .transport-animated-card:hover {
          animation-play-state: paused;
          transform: translateY(-8px);
          box-shadow:
            0 12px 28px
              rgba(16, 42, 67, 0.2);
        }

        .welcome-scroll-wrapper {
          overflow: hidden;
          flex: 1;
          min-width: 0;
        }

        .welcome-scroll-content {
          width: max-content;
          animation:
            welcomeTextMove 10s linear
            infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .transport-animated-card {
            animation: none !important;
          }

          .welcome-scroll-content {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {isMobile && (
        <div style={styles.mobileHeader}>
          <button
            style={styles.menuButton}
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
          >
            ☰
          </button>

          <div
            style={styles.mobileHeaderTitle}
          >
            Transport Hub
          </div>
        </div>
      )}

      {(!isMobile || menuOpen) && (
        <aside
          style={{
            ...styles.sidebar,
            ...(isMobile
              ? styles.mobileSidebar
              : {}),
          }}
        >
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>
              🚛
            </div>

            <div>
              <div style={styles.logoTitle}>
                Transport Hub
              </div>

              <div
                style={styles.logoSubtitle}
              >
                Investment Platform
              </div>
            </div>
          </div>

          <nav style={styles.navigation}>
            <button
              style={{
                ...styles.navItem,
                ...styles.activeNavItem,
              }}
              onClick={() => goTo("/")}
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                goTo("/transport-plans")
              }
            >
              <span>🚛</span>
              <span>Transport Plans</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                goTo("/deposit")
              }
            >
              <span>💰</span>
              <span>Deposit</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                goTo("/withdraw")
              }
            >
              <span>💸</span>
              <span>Withdraw</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                goTo("/transactions")
              }
            >
              <span>📊</span>
              <span>Transactions</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                goTo("/deposit-history")
              }
            >
              <span>📋</span>
              <span>Deposit History</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                goTo("/withdraw-history")
              }
            >
              <span>📋</span>
              <span>Withdraw History</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                goTo("/weekly-returns")
              }
            >
              <span>🎁</span>
              <span>Weekly Returns</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                goTo("/my-team")
              }
            >
              <span>👥</span>
              <span>My Team</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                goTo("/referral")
              }
            >
              <span>🔗</span>
              <span>Referral</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                setShowFeatures(true)
              }
            >
              <span>🔐</span>
              <span>Security</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                goTo("/support")
              }
            >
              <span>🎧</span>
              <span>Support</span>
            </button>

            <button
              style={styles.logoutNavItem}
              onClick={logout}
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </nav>
        </aside>
      )}

      {isMobile && menuOpen && (
        <div
          style={styles.mobileOverlay}
          onClick={() =>
            setMenuOpen(false)
          }
        />
      )}

      <main
        style={{
          ...styles.mainContent,
          ...(isMobile
            ? styles.mobileMainContent
            : {}),
        }}
      >
        <div
          style={{
            ...styles.topBar,
            ...(isMobile
              ? styles.mobileTopBar
              : {}),
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={styles.pageTitle}>
              Dashboard
            </div>

            <div style={styles.pageSubtitle}>
              Manage your transport investment
              account
            </div>
          </div>
        </div>

        <section
          className="transport-animated-card"
          style={{
            ...styles.welcomeCard,
            ...(isMobile
              ? styles.mobileWelcomeCard
              : {}),
          }}
        >
          <div className="welcome-scroll-wrapper">
            <div className="welcome-scroll-content">
              <div style={styles.welcomeSmall}>
                Welcome back
              </div>

              <div style={styles.welcomeTitle}>
                {displayName} 👋
              </div>

              <div style={styles.welcomeText}>
                Track your investments, weekly
                returns and team activity from
                one place.
              </div>
            </div>
          </div>

          <div style={styles.welcomeTruck}>
            🚛
          </div>
        </section>

        <section
          style={{
            ...styles.summaryGrid,
            ...(isMobile
              ? styles.mobileSummaryGrid
              : {}),
          }}
        >
          <div
            className="transport-animated-card"
            style={styles.summaryCard}
          >
            <div style={styles.summaryIcon}>
              💼
            </div>

            <div style={styles.summaryLabel}>
              Total Investment
            </div>

            <div style={styles.summaryValue}>
              {formatMoney(totalInvestment)}
            </div>
          </div>

          <div
            className="transport-animated-card"
            style={{
              ...styles.summaryCard,
              animationDelay: "0.5s",
            }}
          >
            <div style={styles.summaryIcon}>
              📈
            </div>

            <div style={styles.summaryLabel}>
              Weekly Return
            </div>

            <div style={styles.summaryValue}>
              {formatMoney(weeklyReturn)}
            </div>
          </div>

          <div
            className="transport-animated-card"
            style={{
              ...styles.summaryCard,
              animationDelay: "1s",
            }}
          >
            <div style={styles.summaryIcon}>
              💰
            </div>

            <div style={styles.summaryLabel}>
              Wallet Balance
            </div>

            <div style={styles.summaryValue}>
              {formatMoney(walletBalance)}
            </div>
          </div>

          <div
            className="transport-animated-card"
            style={{
              ...styles.summaryCard,
              animationDelay: "1.5s",
            }}
          >
            <div style={styles.summaryIcon}>
              🎯
            </div>

            <div style={styles.summaryLabel}>
              Expected Return
            </div>

            <div style={styles.summaryValue}>
              {formatMoney(expectedReturn)}
            </div>
          </div>
        </section>

        <section
          className="transport-animated-card"
          style={styles.largeCard}
        >
          <div
            style={{
              ...styles.sectionHeader,
              ...(isMobile
                ? styles.mobileSectionHeader
                : {}),
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={styles.sectionIcon}>
                🚛
              </div>

              <div>
                <div style={styles.sectionTitle}>
                  Active Transport Plans
                </div>

                <div style={styles.sectionSubtitle}>
                  Your currently active investment
                  plans
                </div>
              </div>
            </div>

            <button
              style={styles.addPlanButton}
              onClick={() =>
                goTo("/transport-plans")
              }
            >
              + Add Plan
            </button>
          </div>

          {activePlans.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                🚛
              </div>

              <div style={styles.emptyTitle}>
                No Active Plans
              </div>

              <div style={styles.emptyText}>
                Choose a transport plan to start
                your investment journey.
              </div>

              <button
                style={styles.emptyButton}
                onClick={() =>
                  goTo("/transport-plans")
                }
              >
                View Transport Plans
              </button>
            </div>
          ) : (
            <div
              style={{
                ...styles.planGrid,
                ...(isMobile
                  ? styles.mobilePlanGrid
                  : {}),
              }}
            >
              {activePlans.map(
                (plan, index) => {
                  const weekly =
                    getWeeklyReturn(plan);

                  const price = Number(
                    plan.price || 0
                  );

                  const totalReturn =
                    Number(
                      plan.totalReturn || 0
                    ) ||
                    weekly *
                      PLAN_DURATION_WEEKS;

                  return (
                    <div
                      key={
                        plan.id ||
                        `${plan.name}-${index}`
                      }
                      className="transport-animated-card"
                      style={{
                        ...styles.planCard,
                        animationDelay:
                          `${index * 0.15}s`,
                      }}
                    >
                      <div
                        style={
                          styles.planCardTop
                        }
                      >
                        <div>
                          <div
                            style={
                              styles.planName
                            }
                          >
                            {plan.name ||
                              "Transport Plan"}{" "}
                            Transport Plan
                          </div>

                          <div
                            style={
                              styles.planPrice
                            }
                          >
                            {formatMoney(
                              price
                            )}
                          </div>
                        </div>

                        <div
                          style={
                            styles.activeBadge
                          }
                        >
                          ACTIVE
                        </div>
                      </div>

                      <div
                        style={
                          styles.planDivider
                        }
                      />

                      <div
                        style={
                          styles.planStats
                        }
                      >
                        <div
                          style={
                            styles.planStat
                          }
                        >
                          <span>
                            Weekly
                          </span>

                          <strong>
                            {formatMoney(
                              weekly
                            )}
                          </strong>
                        </div>

                        <div
                          style={
                            styles.planStat
                          }
                        >
                          <span>
                            Duration
                          </span>

                          <strong>
                            {PLAN_DURATION_WEEKS}{" "}
                            Weeks
                          </strong>
                        </div>

                        <div
                          style={
                            styles.planStat
                          }
                        >
                          <span>
                            Total Return
                          </span>

                          <strong>
                            {formatMoney(
                              totalReturn
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section
          style={{
            ...styles.twoColumnGrid,
            ...(isMobile
              ? styles.mobileTwoColumnGrid
              : {}),
          }}
        >
          <div
            className="transport-animated-card"
            style={styles.largeCard}
          >
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>
                  💰 Wallet Overview
                </div>

                <div
                  style={
                    styles.cardSubtitle
                  }
                >
                  Your current account balance
                </div>
              </div>
            </div>

            <div style={styles.walletMain}>
              <div
                style={styles.walletLabel}
              >
                Available Balance
              </div>

              <div
                style={styles.walletValue}
              >
                {formatMoney(
                  walletBalance
                )}
              </div>
            </div>

            <div style={styles.walletStats}>
              <div
                style={styles.walletStatBox}
              >
                <span>
                  Total Deposits
                </span>

                <strong>
                  {formatMoney(
                    totalInvestment ||
                      depositTotal
                  )}
                </strong>
              </div>

              <div
                style={styles.walletStatBox}
              >
                <span>
                  Total Withdrawals
                </span>

                <strong>
                  {formatMoney(
                    withdrawalTotal
                  )}
                </strong>
              </div>

              <div
                style={styles.walletStatBox}
              >
                <span>
                  Pending Deposits
                </span>

                <strong>
                  {formatMoney(
                    pendingDeposits
                  )}
                </strong>
              </div>

              <div
                style={styles.walletStatBox}
              >
                <span>
                  Pending Withdrawals
                </span>

                <strong>
                  {formatMoney(
                    pendingWithdrawals
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div
            className="transport-animated-card"
            style={styles.largeCard}
          >
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>
                  📈 Return Summary
                </div>

                <div
                  style={
                    styles.cardSubtitle
                  }
                >
                  Your weekly return performance
                </div>
              </div>
            </div>

            <div style={styles.returnStats}>
              <div
                style={styles.returnStat}
              >
                <span>
                  Current Weekly Return
                </span>

                <strong>
                  {formatMoney(
                    todayProfit
                  )}
                </strong>
              </div>

              <div
                style={styles.returnStat}
              >
                <span>
                  Previous Weekly Return
                </span>

                <strong>
                  {formatMoney(
                    yesterdayProfit
                  )}
                </strong>
              </div>

              <div
                style={styles.returnStat}
              >
                <span>
                  Weekly Total
                </span>

                <strong>
                  {formatMoney(
                    weekProfit
                  )}
                </strong>
              </div>

              <div
                style={styles.returnStat}
              >
                <span>
                  Approx. 4 Weeks
                </span>

                <strong>
                  {formatMoney(
                    monthProfit
                  )}
                </strong>
              </div>

              <div
                style={styles.returnStat}
              >
                <span>
                  Total Earned
                </span>

                <strong>
                  {formatMoney(
                    earnedReturns
                  )}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            ...styles.twoColumnGrid,
            ...(isMobile
              ? styles.mobileTwoColumnGrid
              : {}),
          }}
        >
          <div
            className="transport-animated-card"
            style={styles.largeCard}
          >
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>
                  👥 My Team
                </div>

                <div
                  style={
                    styles.cardSubtitle
                  }
                >
                  Your referral team overview
                </div>
              </div>

              <button
                style={styles.textButton}
                onClick={() =>
                  goTo("/my-team")
                }
              >
                View My Team
              </button>
            </div>

            <div
              style={styles.teamMainNumber}
            >
              {teamMembers.length}
            </div>

            <div
              style={styles.teamMainLabel}
            >
              Total Team Members
            </div>

            <div style={styles.teamStats}>
              <div
                style={styles.teamStat}
              >
                <span>
                  Team Investment
                </span>

                <strong>
                  {formatMoney(
                    teamInvestment
                  )}
                </strong>
              </div>

              <div
                style={styles.teamStat}
              >
                <span>
                  Paid Commission
                </span>

                <strong>
                  {formatMoney(
                    paidTeam
                  )}
                </strong>
              </div>

              <div
                style={styles.teamStat}
              >
                <span>
                  Today Commission
                </span>

                <strong>
                  {formatMoney(
                    todayTeam
                  )}
                </strong>
              </div>
            </div>

            <button
              style={
                styles.outlineButton
              }
              onClick={() =>
                goTo("/my-team")
              }
            >
              View My Team
            </button>
          </div>

          <div
            className="transport-animated-card"
            style={styles.largeCard}
          >
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>
                  🔗 Referral Program
                </div>

                <div
                  style={
                    styles.cardSubtitle
                  }
                >
                  Invite friends and grow your
                  team.
                </div>
              </div>
            </div>

            <div
              style={
                styles.referralText
              }
            >
              Your referral code
            </div>

            <div
              style={
                styles.referralCodeBox
              }
            >
              <span>
                {referralCode}
              </span>

              <button
                style={styles.copyButton}
                onClick={copyReferral}
              >
                {copied
                  ? "✓ Copied"
                  : "Copy"}
              </button>
            </div>

            <div
              style={
                styles.referralLinkBox
              }
            >
              {referralLink}
            </div>

            <button
              style={
                styles.outlineButton
              }
              onClick={() =>
                goTo("/referral")
              }
            >
              Open Referral
            </button>
          </div>
        </section>

        <section
          className="transport-animated-card"
          style={styles.activityCard}
        >
          <div
            style={{
              ...styles.sectionHeader,
              ...(isMobile
                ? styles.mobileSectionHeader
                : {}),
            }}
          >
            <div>
              <div
                style={styles.cardTitle}
              >
                📊 Recent Transactions
              </div>

              <div
                style={
                  styles.cardSubtitle
                }
              >
                Latest account activity
              </div>
            </div>

            <button
              style={styles.textButton}
              onClick={() =>
                goTo("/transactions")
              }
            >
              View All →
            </button>
          </div>

          {recentTransactions.length ===
          0 ? (
            <div
              style={
                styles.transactionEmpty
              }
            >
              No recent transactions yet.
            </div>
          ) : (
            <div
              style={
                styles.transactionList
              }
            >
              {recentTransactions
                .slice(0, 5)
                .map((item, index) => {
                  const type =
                    String(
                      item.type ||
                        ""
                    ).toLowerCase();

                  const isWithdraw =
                    type ===
                      "withdraw" ||
                    type ===
                      "withdrawal";

                  const isReturn =
                    type === "return" ||
                    type ===
                      "weekly return";

                  const icon =
                    isWithdraw
                      ? "💸"
                      : isReturn
                      ? "🎁"
                      : "💰";

                  const label =
                    isWithdraw
                      ? "Withdraw"
                      : isReturn
                      ? "Return"
                      : "Deposit";

                  const transactionDate =
                    item.date ||
                    item.createdAt ||
                    item.created_at ||
                    "";

                  let displayDate =
                    "Recently";

                  try {
                    displayDate =
                      transactionDate
                        ? new Date(
                            transactionDate
                          ).toLocaleString()
                        : "Recently";
                  } catch {
                    displayDate =
                      "Recently";
                  }

                  return (
                    <div
                      key={
                        item.id ||
                        `${label}-${index}`
                      }
                      style={{
                        ...styles.transactionRow,
                        ...(isMobile
                          ? styles.mobileTransactionRow
                          : {}),
                      }}
                    >
                      <div
                        style={
                          styles.transactionIcon
                        }
                      >
                        {icon}
                      </div>

                      <div
                        style={
                          styles.transactionInfo
                        }
                      >
                        <div
                          style={
                            styles.transactionTitle
                          }
                        >
                          {label}
                        </div>

                        <div
                          style={
                            styles.transactionDate
                          }
                        >
                          {displayDate}
                        </div>
                      </div>

                      <div
                        style={
                          styles.transactionAmountArea
                        }
                      >
                        <div
                          style={
                            styles.transactionAmount
                          }
                        >
                          {formatMoney(
                            item.amount
                          )}
                        </div>

                        <div
                          style={{
                            ...styles.transactionStatus,
                            ...(String(
                              item.status ||
                                ""
                            ).toLowerCase() ===
                            "approved"
                              ? styles.approvedStatus
                              : String(
                                  item.status ||
                                    ""
                                ).toLowerCase() ===
                                "completed"
                              ? styles.completedStatus
                              : styles.pendingStatus),
                          }}
                        >
                          {String(
                            item.status ||
                              "Pending"
                          ).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        <section
          style={{
            ...styles.supportCard,
            ...(isMobile
              ? styles.mobileSupportCard
              : {}),
          }}
        >
          <div
            style={styles.supportIcon}
          >
            🎧
          </div>

          <div
            style={styles.supportContent}
          >
            <div
              style={styles.supportTitle}
            >
              Need Help?
            </div>

            <div
              style={styles.supportText}
            >
              Have questions about your account,
              deposits, withdrawals, or transport
              plans? Our support team is here to
              help.
            </div>

            <div
              style={styles.supportActions}
            >
              <button
                style={
                  styles.supportButton
                }
                onClick={() =>
                  goTo("/support")
                }
              >
                💬 Live Chat
              </button>

              <a
                href="https://wa.me/923263159327?text=Hello%20Transport%20Hub%20Support%2C%20I%20need%20help."
                target="_blank"
                rel="noreferrer"
                style={
                  styles.whatsappButton
                }
              >
                📱 WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section
          style={{
            ...styles.appCard,
            ...(isMobile
              ? styles.mobileAppCard
              : {}),
          }}
        >
          <div
            style={styles.appIcon}
          >
            📱
          </div>

          <div style={styles.appContent}>
            <div
              style={styles.appTitle}
            >
              Transport Hub Mobile App
            </div>

            <div
              style={styles.appText}
            >
              Download the Transport Hub app
              for a faster, smoother, and more
              convenient experience.
            </div>

            <a
              href="/transport-hub.apk"
              style={styles.appButton}
            >
              📥 Download App
            </a>
          </div>
        </section>
      </main>

      {showFeatures && (
        <div
          style={
            styles.modalBackdrop
          }
          onClick={() =>
            setShowFeatures(false)
          }
        >
          <div
            style={
              styles.featureModal
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              style={
                styles.modalClose
              }
              onClick={() =>
                setShowFeatures(false)
              }
            >
              ✕
            </button>

            <div
              style={
                styles.modalIcon
              }
            >
              🔐
            </div>

            <div
              style={
                styles.modalTitle
              }
            >
              Security
            </div>

            <div
              style={
                styles.modalText
              }
            >
              Your Transport Hub account
              information is protected and
              managed securely.
            </div>
          </div>
        </div>
      )}

      {showPrizePopup && (
        <div
          style={
            styles.prizeBackdrop
          }
          onClick={() =>
            setShowPrizePopup(false)
          }
        >
          <div
            style={
              styles.prizePopup
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              style={
                styles.prizeClose
              }
              onClick={() =>
                setShowPrizePopup(false)
              }
            >
              ✕
            </button>

            <div
              style={
                styles.prizeIcon
              }
            >
              🎁
            </div>

            <div
              style={
                styles.prizeTitle
              }
            >
              Special Reward
            </div>

            <div
              style={
                styles.prizeText
              }
            >
              Keep growing your Transport Hub
              journey and explore your available
              rewards.
            </div>

            <button
              style={
                styles.prizeButton
              }
              onClick={() =>
                setShowPrizePopup(false)
              }
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  dashboard: {
    minHeight: "100vh",
    display: "flex",
    background:
      "radial-gradient(circle at 10% 0%, rgba(111, 226, 91, 0.08), transparent 28%), #f3f7f1",
    color: "#173b2b",
    fontFamily: "Arial, sans-serif",
  },

  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background: "#102A43",
    color: "#ffffff",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    overflowY: "auto",
    boxShadow:
      "7px 0 25px rgba(16,42,67,0.16)",
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "22px 20px",
    borderBottom:
      "1px solid #1E3A56",
  },

  logoIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #2f7d53, #173B5A)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
  },

  logoTitle: {
    fontSize: "17px",
    fontWeight: 900,
    color: "#ffffff",
  },

  logoSubtitle: {
    fontSize: "10px",
    color: "#9FB3C8",
    marginTop: "3px",
  },

  navigation: {
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px 20px",
    gap: "5px",
  },

  navItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    border: "1px solid transparent",
    background: "transparent",
    color: "#C9D8E6",
    padding: "11px 13px",
    borderRadius: "9px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: 700,
  },

  activeNavItem: {
    background:
      "linear-gradient(135deg, #173B5A, #1E3A56)",
    color: "#ffffff",
    border:
      "1px solid #2F5874",
    boxShadow:
      "0 5px 12px rgba(0,0,0,0.10)",
  },

  logoutNavItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    border: "1px solid #5B2B2B",
    background: "#3B1D1D",
    color: "#FFD7D7",
    padding: "11px 13px",
    borderRadius: "9px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: 700,
    marginTop: "8px",
  },

  mainContent: {
    marginLeft: "260px",
    width: "calc(100% - 260px)",
    minHeight: "100vh",
    padding: "30px",
    boxSizing: "border-box",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  pageTitle: {
    fontSize: "26px",
    fontWeight: 900,
    color: "#102A43",
  },

  pageSubtitle: {
    fontSize: "12px",
    color: "#6B8197",
    marginTop: "5px",
  },

  welcomeCard: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background:
      "linear-gradient(135deg, #102A43, #173B5A)",
    color: "#ffffff",
    borderRadius: "18px",
    padding: "22px 24px",
    marginBottom: "20px",
    border:
      "1px solid #1E3A56",
    boxShadow:
      "0 8px 25px rgba(16,42,67,0.14)",
    overflow: "hidden",
  },

  mobileWelcomeCard: {
    borderRadius: "15px",
    padding: "18px",
  },

  welcomeSmall: {
    fontSize: "11px",
    color: "#9FB3C8",
    marginBottom: "4px",
  },

  welcomeTitle: {
    fontSize: "24px",
    fontWeight: 900,
    color: "#ffffff",
  },

  welcomeText: {
    fontSize: "12px",
    color: "#C9D8E6",
    marginTop: "5px",
  },

  welcomeTruck: {
    fontSize: "46px",
    flexShrink: 0,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },

  mobileSummaryGrid: {
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  summaryCard: {
    background: "#102A43",
    borderRadius: "16px",
    padding: "17px",
    border:
      "1px solid #1E3A56",
    boxShadow:
      "0 7px 20px rgba(16,42,67,0.12)",
    minWidth: 0,
  },

  summaryIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    background: "#173B5A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    marginBottom: "11px",
  },

  summaryLabel: {
    color: "#9FB3C8",
    fontSize: "10px",
    marginBottom: "5px",
  },

  summaryValue: {
    color: "#ffffff",
    fontSize: "21px",
    fontWeight: 900,
    overflowWrap: "anywhere",
  },

  largeCard: {
    background: "#102A43",
    borderRadius: "17px",
    padding: "20px",
    border:
      "1px solid #1E3A56",
    marginBottom: "20px",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
    boxShadow:
      "0 7px 22px rgba(16,42,67,0.12)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "18px",
    minWidth: 0,
  },

  mobileSectionHeader: {
    alignItems: "flex-start",
  },

  sectionIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "11px",
    background: "#173B5A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 900,
  },

  sectionSubtitle: {
    color: "#9FB3C8",
    fontSize: "11px",
    marginTop: "4px",
  },

  addPlanButton: {
    border: "1px solid #3E8E5B",
    background: "#204A34",
    color: "#8FD694",
    padding: "10px 14px",
    borderRadius: "9px",
    fontWeight: 800,
    fontSize: "11px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  planGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },

  mobilePlanGrid: {
    gridTemplateColumns:
      "1fr",
  },

  planCard: {
    background: "#173B5A",
    borderRadius: "14px",
    padding: "15px",
    border:
      "1px solid #294B66",
    minWidth: 0,
  },

  planCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "flex-start",
  },

  planName: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
  },

  planPrice: {
    color: "#8FD694",
    fontSize: "21px",
    fontWeight: 900,
    marginTop: "5px",
  },

  activeBadge: {
    padding: "5px 8px",
    borderRadius: "7px",
    background: "#2F6F45",
    color: "#DDF5E1",
    fontSize: "8px",
    fontWeight: 900,
    flexShrink: 0,
  },

  planDivider: {
    height: "1px",
    background: "#294B66",
    margin: "13px 0",
  },

  planStats: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  planStat: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "10px",
  },

  emptyState: {
    textAlign: "center",
    background: "#173B5A",
    borderRadius: "14px",
    padding: "28px 18px",
    border: "1px solid #294B66",
  },

  emptyIcon: {
    fontSize: "36px",
    marginBottom: "8px",
  },

  emptyTitle: {
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "17px",
  },

  emptyText: {
    color: "#9FB3C8",
    fontSize: "11px",
    marginTop: "6px",
    marginBottom: "14px",
  },

  emptyButton: {
    border: "none",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "10px 15px",
    borderRadius: "9px",
    fontWeight: 800,
    fontSize: "11px",
    cursor: "pointer",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "15px",
  },

  mobileTwoColumnGrid: {
    gridTemplateColumns: "1fr",
    gap: "12px",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "15px",
  },

  cardTitle: {
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 900,
  },

  cardSubtitle: {
    color: "#9FB3C8",
    fontSize: "10px",
    marginTop: "4px",
  },

  walletMain: {
    background: "#173B5A",
    borderRadius: "12px",
    padding: "15px",
    border: "1px solid #294B66",
    marginBottom: "12px",
  },

  walletLabel: {
    color: "#9FB3C8",
    fontSize: "10px",
  },

  walletValue: {
    color: "#8FD694",
    fontSize: "28px",
    fontWeight: 900,
    marginTop: "5px",
    overflowWrap: "anywhere",
  },

  walletStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "9px",
  },

  walletStatBox: {
    background: "#173B5A",
    borderRadius: "10px",
    padding: "10px",
    border: "1px solid #294B66",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    minWidth: 0,
  },

  returnStats: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  returnStat: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "10px 0",
    borderBottom:
      "1px solid #1E3A56",
    color: "#C9D8E6",
    fontSize: "10px",
  },

  teamMainNumber: {
    color: "#8FD694",
    fontSize: "36px",
    fontWeight: 900,
  },

  teamMainLabel: {
    color: "#9FB3C8",
    fontSize: "10px",
    marginTop: "2px",
  },

  teamStats: {
    marginTop: "15px",
  },

  teamStat: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "8px 0",
    borderBottom:
      "1px solid #1E3A56",
    color: "#C9D8E6",
    fontSize: "10px",
    overflowWrap: "anywhere",
  },

  outlineButton: {
    marginTop: "15px",
    border: "1px solid #3E8E5B",
    background: "transparent",
    color: "#8FD694",
    padding: "9px 13px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 800,
  },

  referralText: {
    color: "#9FB3C8",
    fontSize: "10px",
    marginTop: "10px",
    marginBottom: "10px",
    overflowWrap: "anywhere",
  },

  referralCodeBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    background: "#173B5A",
    borderRadius: "9px",
    padding: "10px",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 900,
    minWidth: 0,
    boxSizing: "border-box",
  },

  copyButton: {
    border: "none",
    background: "#29435A",
    color: "#ffffff",
    padding: "6px 9px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "9px",
    fontWeight: 800,
    flexShrink: 0,
  },

  referralLinkBox: {
    marginTop: "9px",
    padding: "9px",
    borderRadius: "8px",
    background: "#173B5A",
    color: "#9FB3C8",
    fontSize: "8px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginBottom: "12px",
    boxSizing: "border-box",
  },

  activityCard: {
    background: "#102A43",
    borderRadius: "17px",
    padding: "20px",
    border: "1px solid #1E3A56",
    marginBottom: "20px",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
    boxShadow:
      "0 7px 22px rgba(16,42,67,0.12)",
  },

  textButton: {
    border: "none",
    background: "transparent",
    color: "#8FD694",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  transactionEmpty: {
    textAlign: "center",
    color: "#9FB3C8",
    fontSize: "10px",
    padding: "25px",
    background: "#173B5A",
    borderRadius: "12px",
  },

  transactionList: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  transactionRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 0",
    borderBottom:
      "1px solid #1E3A56",
    minWidth: 0,
  },

  mobileTransactionRow: {
    gap: "7px",
  },

  transactionIcon: {
    width: "35px",
    height: "35px",
    borderRadius: "9px",
    background: "#173B5A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
  },

  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },

  transactionTitle: {
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 800,
  },

  transactionDate: {
    color: "#9FB3C8",
    fontSize: "8px",
    marginTop: "3px",
    overflowWrap: "anywhere",
  },

  transactionAmountArea: {
    textAlign: "right",
    flexShrink: 0,
  },

  transactionAmount: {
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 900,
  },

  transactionStatus: {
    display: "inline-block",
    marginTop: "3px",
    fontSize: "7px",
    fontWeight: 900,
    padding: "3px 5px",
    borderRadius: "5px",
  },

  approvedStatus: {
    background: "#2F6F45",
    color: "#DDF5E1",
  },

  completedStatus: {
    background: "#2F5874",
    color: "#D8ECFA",
  },

  pendingStatus: {
    background: "#705C2F",
    color: "#FFE8A3",
  },

  supportCard: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background:
      "linear-gradient(135deg, #102A43, #173B5A)",
    borderRadius: "17px",
    padding: "20px",
    border: "1px solid #1E3A56",
    marginBottom: "20px",
    boxShadow:
      "0 7px 22px rgba(16,42,67,0.12)",
  },

  mobileSupportCard: {
    alignItems: "flex-start",
  },

  supportIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },

  supportContent: {
    flex: 1,
    minWidth: 0,
  },

  supportTitle: {
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: 900,
  },

  supportText: {
    color: "#9FB3C8",
    fontSize: "10px",
    lineHeight: 1.5,
    marginTop: "5px",
  },

  supportActions: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
    flexWrap: "wrap",
  },

  supportButton: {
    border: "1px solid #3E8E5B",
    background: "#204A34",
    color: "#8FD694",
    padding: "9px 12px",
    borderRadius: "8px",
    fontWeight: 800,
    fontSize: "9px",
    cursor: "pointer",
  },

  whatsappButton: {
    border: "1px solid #3E8E5B",
    background: "transparent",
    color: "#8FD694",
    padding: "9px 12px",
    borderRadius: "8px",
    fontWeight: 800,
    fontSize: "9px",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
  },

  appCard: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "#102A43",
    borderRadius: "17px",
    padding: "20px",
    border: "1px solid #1E3A56",
    boxShadow:
      "0 7px 22px rgba(16,42,67,0.12)",
  },

  mobileAppCard: {
    alignItems: "flex-start",
  },

  appIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "#173B5A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },

  appContent: {
    flex: 1,
    minWidth: 0,
  },

  appTitle: {
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: 900,
  },

  appText: {
    color: "#9FB3C8",
    fontSize: "10px",
    lineHeight: 1.5,
    marginTop: "5px",
    marginBottom: "12px",
  },

  appButton: {
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    border: "1px solid #3E8E5B",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "9px 13px",
    borderRadius: "8px",
    fontSize: "9px",
    fontWeight: 900,
  },

  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef3f7",
    fontFamily: "Arial, sans-serif",
  },

  loadingCard: {
    width: "min(92vw, 360px)",
    background: "#102A43",
    color: "#ffffff",
    borderRadius: "18px",
    padding: "30px",
    textAlign: "center",
    boxShadow:
      "0 12px 35px rgba(16,42,67,0.18)",
  },

  loadingIcon: {
    fontSize: "44px",
    marginBottom: "10px",
  },

  loadingTitle: {
    fontSize: "21px",
    fontWeight: 900,
  },

  loadingText: {
    fontSize: "11px",
    color: "#9FB3C8",
    marginTop: "6px",
  },

  mobileHeader: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "58px",
    background: "#102A43",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    zIndex: 1200,
    boxShadow:
      "0 4px 16px rgba(16,42,67,0.18)",
  },

  menuButton: {
    width: "58px",
    height: "58px",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "24px",
    cursor: "pointer",
  },

  mobileHeaderTitle: {
    fontSize: "16px",
    fontWeight: 900,
  },

  mobileSidebar: {
    width: "270px",
    zIndex: 1250,
    top: 0,
    left: 0,
  },

  mobileOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "rgba(5, 20, 33, 0.55)",
    zIndex: 1240,
  },

  mobileMainContent: {
    marginLeft: 0,
    width: "100%",
    padding: "76px 12px 20px",
  },

  mobileTopBar: {
    marginBottom: "14px",
  },

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(8,20,32,0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "18px",
  },

  featureModal: {
    width: "min(92vw, 420px)",
    background: "#102A43",
    borderRadius: "18px",
    padding: "30px",
    position: "relative",
    textAlign: "center",
    border:
      "1px solid #1E3A56",
    boxShadow:
      "0 18px 45px rgba(0,0,0,0.28)",
  },

  modalClose: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "32px",
    height: "32px",
    border: "none",
    borderRadius: "8px",
    background: "#173B5A",
    color: "#ffffff",
    cursor: "pointer",
  },

  modalIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 900,
  },

  modalText: {
    color: "#9FB3C8",
    fontSize: "11px",
    lineHeight: 1.6,
    marginTop: "8px",
  },

  prizeBackdrop: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(8,20,32,0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2100,
    padding: "18px",
  },

  prizePopup: {
    width: "min(92vw, 400px)",
    background:
      "linear-gradient(135deg, #102A43, #173B5A)",
    borderRadius: "20px",
    padding: "32px 25px 25px",
    position: "relative",
    textAlign: "center",
    border:
      "1px solid #294B66",
    boxShadow:
      "0 0 28px rgba(247,201,72,0.16), 0 18px 45px rgba(0,0,0,0.30)",
    animation:
      "prizePopupIn 0.35s ease-out",
  },

  prizeClose: {
    position: "absolute",
    top: "11px",
    right: "11px",
    width: "33px",
    height: "33px",
    border: "none",
    borderRadius: "8px",
    background: "#1E3A56",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 900,
  },

  prizeIcon: {
    width: "68px",
    height: "68px",
    borderRadius: "19px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "35px",
    margin: "0 auto 15px",
    animation:
      "prizeIconFloat 2.5s ease-in-out infinite",
  },

  prizeTitle: {
    color: "#ffffff",
    fontSize: "23px",
    fontWeight: 900,
  },

  prizeText: {
    color: "#C9D8E6",
    fontSize: "11px",
    lineHeight: 1.6,
    marginTop: "8px",
  },

  prizeButton: {
    marginTop: "18px",
    border: "none",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "12px 22px",
    borderRadius: "10px",
    fontWeight: 900,
    fontSize: "11px",
    cursor: "pointer",
  },
};