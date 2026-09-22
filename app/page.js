"use client";

import { useEffect, useMemo, useState } from "react";

const PLAN_DURATION = 120;

const plans = [
  { name: "Starter", price: 100, daily: 15, duration: 120 },
  { name: "Basic", price: 500, daily: 75, duration: 120 },
  { name: "Standard", price: 1500, daily: 225, duration: 120 },
  { name: "Premium", price: 3500, daily: 525, duration: 120 },
  { name: "Advanced", price: 7500, daily: 1125, duration: 120 },
  { name: "Professional", price: 13000, daily: 1950, duration: 120 },
  { name: "Elite", price: 25000, daily: 3750, duration: 120 },
  { name: "Executive", price: 50000, daily: 7500, duration: 120 },
  { name: "Platinum", price: 125000, daily: 18750, duration: 120 },
  { name: "Diamond", price: 175000, daily: 26250, duration: 120 },
  { name: "Royal", price: 225000, daily: 33750, duration: 120 },
  { name: "Grand Royal", price: 300000, daily: 45000, duration: 120 },
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

  const combinedName = `${firstName} ${lastName}`.trim();

  return combinedName || "User";
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [withdrawableReturns, setWithdrawableReturns] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      `transportActivePlans_${phone}`
    );

    if (storedActivePlans.length > 0) {
      setActivePlans(storedActivePlans);
    } else {
      const oldPlan = getStorageObject("transportActivePlan");

      if (oldPlan) {
        setActivePlans([oldPlan]);
      }
    }

    const storedWithdrawable = Number(
      localStorage.getItem(
        `transportWithdrawableReturns_${phone}`
      ) || 0
    );

    setWithdrawableReturns(storedWithdrawable);

    setTransactions(
      getStorageArray(`transportTransactions_${phone}`)
    );

    setTeamMembers(
      getStorageArray(`transportTeam_${phone}`)
    );

    setLoading(false);
  }, []);

  const displayName = getUserName(user);

  const totalInvestment = useMemo(() => {
    return activePlans.reduce(
      (total, plan) => total + Number(plan.price || 0),
      0
    );
  }, [activePlans]);

  const dailyReturn = useMemo(() => {
    return activePlans.reduce(
      (total, plan) => total + Number(plan.daily || 0),
      0
    );
  }, [activePlans]);

  const earnedReturns = useMemo(() => {
    return activePlans.reduce((total, plan) => {
      const start = Number(plan.startTime || Date.now());
      const now = Date.now();

      const daysPassed = Math.max(
        0,
        Math.floor(
          (now - start) / (1000 * 60 * 60 * 24)
        )
      );

      const eligibleDays = Math.min(
        daysPassed,
        Number(plan.duration || PLAN_DURATION)
      );

      return (
        total +
        eligibleDays * Number(plan.daily || 0)
      );
    }, 0);
  }, [activePlans]);

  const expectedReturn = useMemo(() => {
    return activePlans.reduce(
      (total, plan) =>
        total +
        Number(plan.daily || 0) *
          Number(plan.duration || PLAN_DURATION),
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
    return transactions
      .filter(
        (item) =>
          String(item.type || "").toLowerCase() ===
            "withdraw" &&
          String(item.status || "").toLowerCase() ===
            "approved"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [transactions]);

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
    return transactions
      .filter(
        (item) =>
          String(item.type || "").toLowerCase() ===
            "withdraw" &&
          String(item.status || "").toLowerCase() ===
            "pending"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [transactions]);

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

  const walletBalance =
    Number(user?.balance || 0) +
    Number(withdrawableReturns || 0);

  const referralCode =
    user?.referralCode ||
    user?.referral ||
    (user?.phone
      ? `TH${String(user.phone).slice(-6)}`
      : "TRANSPORTHUB");

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : "";

  function navigate(path) {
    setMobileMenu(false);
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
          <div style={styles.loadingIcon}>🚛</div>
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
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
        }

        button,
        input {
          font-family: Arial, sans-serif;
        }

        @media (max-width: 900px) {
          .desktop-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }

          .desktop-sidebar.mobile-open {
            transform: translateX(0);
          }

          .dashboard-main {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 14px !important;
          }

          .mobile-menu-button {
            display: flex !important;
          }

          .desktop-top-user {
            display: none !important;
          }

          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .two-column-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 600px) {
          .dashboard-main {
            padding: 10px !important;
          }

          .mobile-header {
            display: flex !important;
          }

          .top-bar {
            margin-top: 10px !important;
          }

          .summary-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }

          .summary-card {
            padding: 13px !important;
          }

          .summary-value {
            font-size: 16px !important;
            word-break: break-word;
          }

          .welcome-card {
            padding: 17px !important;
          }

          .welcome-title {
            font-size: 20px !important;
          }

          .welcome-text {
            font-size: 10px !important;
          }

          .welcome-truck {
            width: 48px !important;
            height: 48px !important;
            font-size: 23px !important;
          }

          .section-card {
            padding: 15px !important;
          }

          .plan-grid {
            grid-template-columns: 1fr !important;
          }

          .plan-stats {
            grid-template-columns: repeat(3, 1fr) !important;
          }

          .transaction-row {
            flex-wrap: wrap !important;
          }

          .transaction-info {
            min-width: calc(100% - 50px) !important;
          }

          .transaction-amount {
            margin-left: 44px !important;
          }

          .dashboard-support {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .dashboard-support-buttons {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }

          .live-chat-button,
          .whatsapp-button {
            width: 100% !important;
            text-align: center !important;
          }

          .top-bar {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .mobile-user-box {
            display: flex !important;
          }
        }

        @media (min-width: 901px) {
          .mobile-header {
            display: none !important;
          }

          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>

      <div style={styles.dashboard}>

        {mobileMenu && (
          <div
            style={styles.overlay}
            onClick={() => setMobileMenu(false)}
          />
        )}

        <aside
          className={`desktop-sidebar ${
            mobileMenu ? "mobile-open" : ""
          }`}
          style={styles.sidebar}
        >
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>🚛</div>

            <div>
              <div style={styles.logoTitle}>
                Transport Hub
              </div>

              <div style={styles.logoSubtitle}>
                Investment Platform
              </div>
            </div>
          </div>

          <div style={styles.userMiniCard}>
            <div style={styles.avatar}>👤</div>

            <div style={{ minWidth: 0 }}>
              <div style={styles.userMiniName}>
                {displayName}
              </div>

              <div style={styles.userMiniPhone}>
                {user?.phone || ""}
              </div>
            </div>
          </div>

          <nav style={styles.navigation}>

            <button
              style={{
                ...styles.navItem,
                ...styles.activeNavItem,
              }}
              onClick={() => navigate("/")}
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                navigate("/transport-plans")
              }
            >
              <span>🚛</span>
              <span>Transport Plans</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() => navigate("/deposit")}
            >
              <span>💰</span>
              <span>Deposit</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() => navigate("/withdraw")}
            >
              <span>💸</span>
              <span>Withdraw</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                navigate("/transactions")
              }
            >
              <span>📊</span>
              <span>Transactions</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                navigate("/deposit-history")
              }
            >
              <span>📋</span>
              <span>Deposit History</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                navigate("/withdraw-history")
              }
            >
              <span>📋</span>
              <span>Withdraw History</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() =>
                navigate("/daily-returns")
              }
            >
              <span>🎁</span>
              <span>Daily Returns</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() => navigate("/my-team")}
            >
              <span>👥</span>
              <span>My Team</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() => navigate("/referral")}
            >
              <span>🔗</span>
              <span>Referral</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() => navigate("/profile")}
            >
              <span>👤</span>
              <span>Profile</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() => {
                setMobileMenu(false);
                setShowFeatures(true);
              }}
            >
              <span>🔐</span>
              <span>Security</span>
            </button>

            <button
              style={styles.navItem}
              onClick={() => navigate("/support")}
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

        <main
          className="dashboard-main"
          style={styles.mainContent}
        >

          <div
            className="mobile-header"
            style={styles.mobileHeader}
          >
            <button
              className="mobile-menu-button"
              style={styles.menuButton}
              onClick={() => setMobileMenu(true)}
            >
              ☰
            </button>

            <div style={styles.mobileBrand}>
              <div style={styles.mobileLogoIcon}>
                🚛
              </div>

              <div>
                <div style={styles.mobileBrandTitle}>
                  Transport Hub
                </div>

                <div style={styles.mobileBrandSub}>
                  Investment Platform
                </div>
              </div>
            </div>

            <div style={styles.mobileHeaderAvatar}>
              👤
            </div>
          </div>

          <div
            className="top-bar"
            style={styles.topBar}
          >
            <div>
              <div style={styles.pageTitle}>
                Dashboard
              </div>

              <div style={styles.pageSubtitle}>
                Manage your transport investment account
              </div>
            </div>

            <div
              className="desktop-top-user"
              style={styles.topUser}
            >
              <div style={styles.topAvatar}>
                👤
              </div>

              <div>
                <div style={styles.topUserName}>
                  {displayName}
                </div>

                <div style={styles.topUserBalance}>
                  Balance: {formatMoney(walletBalance)}
                </div>
              </div>
            </div>

            <div
              className="mobile-user-box"
              style={styles.mobileUserBox}
            >
              <span>Balance</span>
              <strong>
                PKR {formatMoney(walletBalance)}
              </strong>
            </div>
          </div>

          <section
            className="welcome-card"
            style={styles.welcomeCard}
          >
            <div style={{ minWidth: 0 }}>
              <div style={styles.welcomeSmall}>
                Welcome back
              </div>

              <div
                className="welcome-title"
                style={styles.welcomeTitle}
              >
                {displayName} 👋
              </div>

              <div
                className="welcome-text"
                style={styles.welcomeText}
              >
                Track your investments, daily returns
                and team activity from one place.
              </div>
            </div>

            <div
              className="welcome-truck"
              style={styles.welcomeTruck}
            >
              🚛
            </div>
          </section>

          <section
            className="summary-grid"
            style={styles.summaryGrid}
          >
            <div
              className="summary-card"
              style={styles.summaryCard}
            >
              <div style={styles.summaryIcon}>
                💼
              </div>

              <div style={styles.summaryLabel}>
                Total Investment
              </div>

              <div
                className="summary-value"
                style={styles.summaryValue}
              >
                {formatMoney(totalInvestment)}
              </div>
            </div>

            <div
              className="summary-card"
              style={styles.summaryCard}
            >
              <div style={styles.summaryIcon}>
                📈
              </div>

              <div style={styles.summaryLabel}>
                Daily Return
              </div>

              <div
                className="summary-value"
                style={styles.summaryValue}
              >
                {formatMoney(dailyReturn)}
              </div>
            </div>

            <div
              className="summary-card"
              style={styles.summaryCard}
            >
              <div style={styles.summaryIcon}>
                💰
              </div>

              <div style={styles.summaryLabel}>
                Wallet Balance
              </div>

              <div
                className="summary-value"
                style={styles.summaryValue}
              >
                {formatMoney(walletBalance)}
              </div>
            </div>

            <div
              className="summary-card"
              style={styles.summaryCard}
            >
              <div style={styles.summaryIcon}>
                🎯
              </div>

              <div style={styles.summaryLabel}>
                Expected Return
              </div>

              <div
                className="summary-value"
                style={styles.summaryValue}
              >
                {formatMoney(expectedReturn)}
              </div>
            </div>
          </section>

          <section
            className="section-card"
            style={styles.largeCard}
          >
            <div style={styles.sectionHeader}>
              <div>
                <div style={styles.sectionTitle}>
                  🚛 Active Transport Plans
                </div>

                <div style={styles.sectionSubtitle}>
                  Your currently active investment plans
                </div>
              </div>

              <button
                style={styles.greenButton}
                onClick={() =>
                  navigate("/transport-plans")
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
                  No Active Transport Plans
                </div>

                <div style={styles.emptyText}>
                  Select a transport plan to start earning
                  daily returns.
                </div>

                <button
                  style={styles.greenButtonLarge}
                  onClick={() =>
                    navigate("/transport-plans")
                  }
                >
                  View Transport Plans
                </button>
              </div>
            ) : (
              <div
                className="plan-grid"
                style={styles.planGrid}
              >
                {activePlans.map((plan, index) => {
                  const totalPlanReturn =
                    Number(plan.daily || 0) *
                    Number(
                      plan.duration || PLAN_DURATION
                    );

                  return (
                    <div
                      style={styles.planCard}
                      key={index}
                    >
                      <div style={styles.planTop}>
                        <div>
                          <div style={styles.planName}>
                            {plan.name}
                          </div>

                          <div style={styles.planPrice}>
                            {formatMoney(plan.price)}
                          </div>
                        </div>

                        <div style={styles.activeBadge}>
                          ACTIVE
                        </div>
                      </div>

                      <div
                        className="plan-stats"
                        style={styles.planStats}
                      >
                        <div>
                          <span style={styles.statLabel}>
                            Daily
                          </span>

                          <strong style={styles.statValue}>
                            {formatMoney(plan.daily)}
                          </strong>
                        </div>

                        <div>
                          <span style={styles.statLabel}>
                            Duration
                          </span>

                          <strong style={styles.statValue}>
                            {plan.duration} Days
                          </strong>
                        </div>

                        <div>
                          <span style={styles.statLabel}>
                            Total Return
                          </span>

                          <strong style={styles.statValue}>
                            {formatMoney(totalPlanReturn)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section
            className="two-column-grid"
            style={styles.twoColumnGrid}
          >
            <div style={styles.sideCard}>
              <div style={styles.sectionTitle}>
                💰 Wallet Overview
              </div>

              <div style={styles.walletRows}>
                <div style={styles.walletRow}>
                  <span>Available Balance</span>
                  <strong>
                    {formatMoney(walletBalance)}
                  </strong>
                </div>

                <div style={styles.walletRow}>
                  <span>Total Deposits</span>
                  <strong>
                    {formatMoney(depositTotal)}
                  </strong>
                </div>

                <div style={styles.walletRow}>
                  <span>Total Withdrawals</span>
                  <strong>
                    {formatMoney(withdrawalTotal)}
                  </strong>
                </div>

                <div style={styles.walletRow}>
                  <span>Pending Deposits</span>
                  <strong>
                    {formatMoney(pendingDeposits)}
                  </strong>
                </div>

                <div style={styles.walletRow}>
                  <span>Pending Withdrawals</span>
                  <strong>
                    {formatMoney(pendingWithdrawals)}
                  </strong>
                </div>
              </div>
            </div>

            <div style={styles.sideCard}>
              <div style={styles.sectionTitle}>
                📈 Return Summary
              </div>

              <div style={styles.walletRows}>
                <div style={styles.walletRow}>
                  <span>Today</span>
                  <strong>
                    {formatMoney(dailyReturn)}
                  </strong>
                </div>

                <div style={styles.walletRow}>
                  <span>Yesterday</span>
                  <strong>
                    {formatMoney(dailyReturn)}
                  </strong>
                </div>

                <div style={styles.walletRow}>
                  <span>Last 7 Days</span>
                  <strong>
                    {formatMoney(dailyReturn * 7)}
                  </strong>
                </div>

                <div style={styles.walletRow}>
                  <span>Last 30 Days</span>
                  <strong>
                    {formatMoney(dailyReturn * 30)}
                  </strong>
                </div>

                <div style={styles.walletRow}>
                  <span>Total Earned</span>
                  <strong>
                    {formatMoney(earnedReturns)}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section
            className="two-column-grid"
            style={styles.twoColumnGrid}
          >
            <div style={styles.sideCard}>
              <div style={styles.sectionTitle}>
                👥 My Team
              </div>

              <div style={styles.teamMainNumber}>
                {teamMembers.length}
              </div>

              <div style={styles.teamLabel}>
                Total Team Members
              </div>

              <div style={styles.teamStats}>
                <div style={styles.teamStat}>
                  <span>Team Investment</span>
                  <strong>
                    {formatMoney(teamInvestment)}
                  </strong>
                </div>

                <div style={styles.teamStat}>
                  <span>Paid Commission</span>
                  <strong>
                    {formatMoney(paidTeam)}
                  </strong>
                </div>

                <div style={styles.teamStat}>
                  <span>Today Commission</span>
                  <strong>
                    {formatMoney(todayTeam)}
                  </strong>
                </div>
              </div>

              <button
                style={styles.outlineButton}
                onClick={() => navigate("/my-team")}
              >
                View My Team
              </button>
            </div>

            <div style={styles.sideCard}>
              <div style={styles.sectionTitle}>
                🔗 Referral Program
              </div>

              <div style={styles.referralText}>
                Invite friends and grow your team.
              </div>

              <div style={styles.referralCodeBox}>
                <span>{referralCode}</span>

                <button
                  style={styles.copyButton}
                  onClick={copyReferral}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div style={styles.referralLinkBox}>
                {referralLink ||
                  "Referral link unavailable"}
              </div>

              <button
                style={styles.greenButton}
                onClick={() => navigate("/referral")}
              >
                Open Referral
              </button>
            </div>
          </section>

          <section
            className="section-card"
            style={styles.activityCard}
          >
            <div style={styles.sectionHeader}>
              <div>
                <div style={styles.sectionTitle}>
                  📊 Recent Transactions
                </div>

                <div style={styles.sectionSubtitle}>
                  Latest account activity
                </div>
              </div>

              <button
                style={styles.textButton}
                onClick={() =>
                  navigate("/transactions")
                }
              >
                View All →
              </button>
            </div>

            {transactions.length === 0 ? (
              <div style={styles.transactionEmpty}>
                No transactions yet.
              </div>
            ) : (
              <div style={styles.transactionList}>
                {transactions
                  .slice(0, 5)
                  .map((item, index) => {
                    const type = String(
                      item.type || ""
                    ).toLowerCase();

                    const status = String(
                      item.status || "pending"
                    ).toLowerCase();

                    return (
                      <div
                        className="transaction-row"
                        style={styles.transactionRow}
                        key={index}
                      >
                        <div
                          style={
                            styles.transactionIcon
                          }
                        >
                          {type === "withdraw"
                            ? "💸"
                            : "💰"}
                        </div>

                        <div
                          className="transaction-info"
                          style={
                            styles.transactionInfo
                          }
                        >
                          <div
                            style={
                              styles.transactionTitle
                            }
                          >
                            {type === "withdraw"
                              ? "Withdrawal"
                              : "Deposit"}
                          </div>

                          <div
                            style={
                              styles.transactionDate
                            }
                          >
                            {item.date ||
                              item.createdAt ||
                              item.submittedAt ||
                              "Recently"}
                          </div>
                        </div>

                        <div
                          className="transaction-amount"
                          style={
                            styles.transactionAmount
                          }
                        >
                          {formatMoney(item.amount)}
                        </div>

                        <div
                          style={{
                            ...styles.statusBadge,
                            ...(status === "approved"
                              ? styles.approvedStatus
                              : status === "rejected"
                              ? styles.rejectedStatus
                              : styles.pendingStatus),
                          }}
                        >
                          {status.toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          <section
            className="dashboard-support"
            style={styles.dashboardSupport}
          >
            <div style={styles.dashboardSupportIcon}>
              🎧
            </div>

            <div style={styles.dashboardSupportContent}>
              <div style={styles.dashboardSupportTitle}>
                Need Help?
              </div>

              <div style={styles.dashboardSupportText}>
                Have questions about your account,
                deposits, withdrawals, or transport
                plans? Our support team is here to help.
              </div>
            </div>

            <div
              className="dashboard-support-buttons"
              style={styles.dashboardSupportButtons}
            >
              <button
                className="live-chat-button"
                style={styles.liveChatButton}
                onClick={() => navigate("/support")}
              >
                💬 Live Chat
              </button>

              <a
                className="whatsapp-button"
                href="https://wa.me/923263159327?text=Hello%20Transport%20Hub%20Support%2C%20I%20need%20help."
                target="_blank"
                rel="noopener noreferrer"
                style={styles.whatsappButton}
              >
                📱 WhatsApp
              </a>
            </div>
          </section>
        </main>

        {showFeatures && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <div style={styles.modalIcon}>
                🚧
              </div>

              <div style={styles.modalTitle}>
                Coming Soon
              </div>

              <div style={styles.modalText}>
                This feature is currently under
                development and will be available soon.
              </div>

              <button
                style={styles.greenButtonLarge}
                onClick={() =>
                  setShowFeatures(false)
                }
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  dashboard: {
    minHeight: "100vh",
    display: "flex",
    background: "#eef3f7",
    color: "#102A43",
    fontFamily: "Arial, sans-serif",
    position: "relative",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 90,
  },

  sidebar: {
    width: "245px",
    minHeight: "100vh",
    background: "#102A43",
    color: "#ffffff",
    padding: "18px 14px",
    boxSizing: "border-box",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    overflowY: "auto",
    zIndex: 100,
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 8px 18px",
    borderBottom: "1px solid #29435A",
  },

  logoIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
  },

  logoTitle: {
    fontSize: "16px",
    fontWeight: 900,
    color: "#ffffff",
  },

  logoSubtitle: {
    fontSize: "9px",
    color: "#9FB3C8",
    marginTop: "2px",
  },

  userMiniCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 8px",
    marginBottom: "8px",
  },

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  userMiniName: {
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "12px",
  },

  userMiniPhone: {
    color: "#9FB3C8",
    fontSize: "9px",
    marginTop: "2px",
  },

  navigation: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  navItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#C9D8E6",
    padding: "10px 11px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 700,
  },

  activeNavItem: {
    background: "#1E3A56",
    color: "#ffffff",
  },

  logoutNavItem: {
    width: "100%",
    border: "1px solid #294B66",
    background: "#173B5A",
    color: "#ffffff",
    padding: "10px 11px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 800,
    marginTop: "10px",
  },

  mainContent: {
    marginLeft: "245px",
    width: "calc(100% - 245px)",
    minHeight: "100vh",
    padding: "22px",
    boxSizing: "border-box",
  },

  mobileHeader: {
    display: "none",
    width: "100%",
    minHeight: "58px",
    background: "#102A43",
    borderRadius: "14px",
    padding: "9px 10px",
    alignItems: "center",
    gap: "10px",
    color: "#ffffff",
    marginBottom: "12px",
  },

  menuButton: {
    width: "40px",
    height: "40px",
    border: "1px solid #294B66",
    borderRadius: "10px",
    background: "#173B5A",
    color: "#ffffff",
    fontSize: "21px",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
  },

  mobileBrand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    minWidth: 0,
  },

  mobileLogoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },

  mobileBrandTitle: {
    fontSize: "13px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  mobileBrandSub: {
    fontSize: "8px",
    color: "#9FB3C8",
    marginTop: "2px",
  },

  mobileHeaderAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  mobileUserBox: {
    display: "none",
    width: "100%",
    background: "#ffffff",
    border: "1px solid #dce5ec",
    borderRadius: "11px",
    padding: "9px 11px",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "10px",
    color: "#6B8297",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "18px",
  },

  pageTitle: {
    fontSize: "24px",
    fontWeight: 900,
    color: "#102A43",
  },

  pageSubtitle: {
    color: "#6B8297",
    fontSize: "11px",
    marginTop: "4px",
  },

  topUser: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    background: "#ffffff",
    padding: "8px 12px",
    borderRadius: "12px",
    border: "1px solid #dce5ec",
  },

  topAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#102A43",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  topUserName: {
    fontSize: "11px",
    fontWeight: 900,
    color: "#102A43",
  },

  topUserBalance: {
    fontSize: "9px",
    color: "#6B8297",
    marginTop: "2px",
  },

  welcomeCard: {
    background: "#102A43",
    borderRadius: "18px",
    padding: "24px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
    border: "1px solid #1E3A56",
  },

  welcomeSmall: {
    color: "#9FB3C8",
    fontSize: "10px",
    fontWeight: 700,
    marginBottom: "4px",
  },

  welcomeTitle: {
    fontSize: "24px",
    fontWeight: 900,
    marginBottom: "7px",
  },

  welcomeText: {
    color: "#C9D8E6",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  welcomeTruck: {
    width: "65px",
    height: "65px",
    borderRadius: "18px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    flexShrink: 0,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },

  summaryCard: {
    background: "#102A43",
    borderRadius: "15px",
    padding: "17px",
    border: "1px solid #1E3A56",
    minWidth: 0,
  },

  summaryIcon: {
    fontSize: "21px",
    marginBottom: "10px",
  },

  summaryLabel: {
    color: "#9FB3C8",
    fontSize: "10px",
    fontWeight: 700,
  },

  summaryValue: {
    color: "#ffffff",
    fontSize: "19px",
    fontWeight: 900,
    marginTop: "5px",
  },

  largeCard: {
    background: "#102A43",
    borderRadius: "17px",
    padding: "20px",
    border: "1px solid #1E3A56",
    marginBottom: "18px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "15px",
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 900,
  },

  sectionSubtitle: {
    color: "#9FB3C8",
    fontSize: "9px",
    marginTop: "4px",
  },

  greenButton: {
    border: "none",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "10px 14px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  greenButtonLarge: {
    border: "none",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "11px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 800,
  },

  emptyState: {
    textAlign: "center",
    padding: "35px 15px",
    background: "#173B5A",
    borderRadius: "14px",
  },

  emptyIcon: {
    fontSize: "32px",
    marginBottom: "9px",
  },

  emptyTitle: {
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 900,
  },

  emptyText: {
    color: "#9FB3C8",
    fontSize: "10px",
    margin: "6px 0 14px",
  },

  planGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  planCard: {
    background: "#173B5A",
    borderRadius: "13px",
    padding: "15px",
    border: "1px solid #294B66",
    minWidth: 0,
  },

  planTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "flex-start",
  },

  planName: {
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "14px",
  },

  planPrice: {
    color: "#8FD694",
    fontWeight: 900,
    fontSize: "17px",
    marginTop: "3px",
  },

  activeBadge: {
    background: "#29435A",
    color: "#8FD694",
    padding: "5px 8px",
    borderRadius: "7px",
    fontSize: "8px",
    fontWeight: 900,
  },

  planStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    marginTop: "15px",
    paddingTop: "12px",
    borderTop: "1px solid #294B66",
  },

  statLabel: {
    display: "block",
    color: "#9FB3C8",
    fontSize: "8px",
    marginBottom: "3px",
  },

  statValue: {
    display: "block",
    color: "#ffffff",
    fontSize: "10px",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "18px",
  },

  sideCard: {
    background: "#102A43",
    borderRadius: "17px",
    padding: "20px",
    border: "1px solid #1E3A56",
    minWidth: 0,
  },

  walletRows: {
    marginTop: "12px",
  },

  walletRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    padding: "10px 0",
    borderBottom: "1px solid #1E3A56",
    color: "#C9D8E6",
    fontSize: "10px",
  },

  teamMainNumber: {
    color: "#ffffff",
    fontSize: "30px",
    fontWeight: 900,
    marginTop: "16px",
  },

  teamLabel: {
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
    borderBottom: "1px solid #1E3A56",
    color: "#C9D8E6",
    fontSize: "10px",
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
  },

  activityCard: {
    background: "#102A43",
    borderRadius: "17px",
    padding: "20px",
    border: "1px solid #1E3A56",
    marginBottom: "20px",
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
  },

  transactionRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 0",
    borderBottom: "1px solid #1E3A56",
    minWidth: 0,
  },

  transactionIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    background: "#173B5A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },

  transactionTitle: {
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: 800,
  },

  transactionDate: {
    color: "#9FB3C8",
    fontSize: "8px",
    marginTop: "2px",
  },

  transactionAmount: {
    color: "#8FD694",
    fontSize: "10px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  statusBadge: {
    padding: "5px 7px",
    borderRadius: "6px",
    fontSize: "7px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  approvedStatus: {
    background: "#294B66",
    color: "#8FD694",
  },

  pendingStatus: {
    background: "#4C4630",
    color: "#F4D77A",
  },

  rejectedStatus: {
    background: "#573533",
    color: "#FF9F96",
  },

  dashboardSupport: {
    background: "#102A43",
    borderRadius: "18px",
    padding: "22px",
    marginTop: "20px",
    marginBottom: "20px",
    border: "1px solid #1E3A56",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow:
      "0 8px 24px rgba(16,42,67,.12)",
  },

  dashboardSupportIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "14px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    flexShrink: 0,
  },

  dashboardSupportContent: {
    flex: 1,
    minWidth: 0,
  },

  dashboardSupportTitle: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 900,
    marginBottom: "5px",
  },

  dashboardSupportText: {
    color: "#C9D8E6",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  dashboardSupportButtons: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },

  liveChatButton: {
    border: "none",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "11px 15px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  whatsappButton: {
    textDecoration: "none",
    background: "#1E3A56",
    color: "#ffffff",
    border: "1px solid #294B66",
    padding: "10px 14px",
    borderRadius: "9px",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  loadingScreen: {
    minHeight: "100vh",
    background: "#eef3f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },

  loadingCard: {
    background: "#102A43",
    color: "#ffffff",
    padding: "35px",
    borderRadius: "18px",
    textAlign: "center",
    width: "280px",
    boxSizing: "border-box",
  },

  loadingIcon: {
    fontSize: "35px",
    marginBottom: "10px",
  },

  loadingTitle: {
    fontSize: "18px",
    fontWeight: 900,
  },

  loadingText: {
    color: "#9FB3C8",
    fontSize: "10px",
    marginTop: "6px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(7, 24, 38, 0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
    boxSizing: "border-box",
  },

  modalCard: {
    width: "100%",
    maxWidth: "390px",
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "18px",
    padding: "28px",
    textAlign: "center",
    boxSizing: "border-box",
  },

  modalIcon: {
    fontSize: "35px",
    marginBottom: "10px",
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: "19px",
    fontWeight: 900,
  },

  modalText: {
    color: "#9FB3C8",
    fontSize: "11px",
    lineHeight: 1.6,
    margin: "8px 0 18px",
  },
};