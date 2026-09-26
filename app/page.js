"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const PLAN_DURATION_WEEKS = 260;
const PLAN_DURATION_YEARS = 5;

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

function formatDateTime(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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
    user.full_name ||
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
      plan?.weekly_return ??
      plan?.daily ??
      plan?.dailyReturn ??
      0
  );
}

function normalizePlan(plan) {
  return {
    ...plan,

    name:
      plan?.name ||
      plan?.planName ||
      plan?.plan_name ||
      "Transport Plan",

    price: Number(
      plan?.price ??
        plan?.amount ??
        plan?.depositAmount ??
        plan?.deposit_amount ??
        0
    ),

    weekly: Number(
      plan?.weekly ??
        plan?.weeklyReturn ??
        plan?.weekly_return ??
        plan?.daily ??
        plan?.dailyReturn ??
        0
    ),

    durationWeeks: PLAN_DURATION_WEEKS,
    durationYears: PLAN_DURATION_YEARS,
    duration: PLAN_DURATION_WEEKS,
  };
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [withdrawableReturns, setWithdrawableReturns] = useState(0);

  const [showFeatures, setShowFeatures] = useState(false);
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
    async function loadDashboard() {
      const loggedIn =
        localStorage.getItem("transportLoggedIn");

      if (loggedIn !== "true") {
        window.location.href = "/login";
        return;
      }

      let storedUser =
        getStorageObject("transportUser");

      if (!storedUser) {
        storedUser =
          getStorageObject("transportCurrentUser");
      }

      if (!storedUser) {
        window.location.href = "/login";
        return;
      }

      const displayName =
        getUserName(storedUser);

      const normalizedUser = {
        ...storedUser,
        name: displayName,
      };

      saveStorage(
        "transportUser",
        normalizedUser
      );

      setUser(normalizedUser);

      const phone =
        normalizedUser.phone ||
        normalizedUser.mobile ||
        normalizedUser.username ||
        "unknown";

      const storedActivePlans =
        getStorageArray(
          "transportActivePlans_" + phone
        );

      if (storedActivePlans.length > 0) {
        const normalizedPlans =
          storedActivePlans.map(normalizePlan);

        setActivePlans(normalizedPlans);

        saveStorage(
          "transportActivePlans_" + phone,
          normalizedPlans
        );
      } else {
        const oldPlan =
          getStorageObject(
            "transportActivePlan"
          );

        if (oldPlan) {
          setActivePlans([
            normalizePlan(oldPlan),
          ]);
        }
      }

      const storedWithdrawable =
        Number(
          localStorage.getItem(
            "transportWithdrawableReturns_" +
              phone
          ) || 0
        );

      setWithdrawableReturns(
        storedWithdrawable
      );

      const storedTransactions =
        getStorageArray(
          "transportTransactions_" + phone
        );

      setTransactions(
        storedTransactions
      );

      try {
        const {
          data: userRow,
          error: userError,
        } = await supabase
          .from("users")
          .select("withdrawable_returns")
          .eq("phone", phone)
          .maybeSingle();

        if (
          !userError &&
          userRow
        ) {
          const centralReturns =
            Number(
              userRow.withdrawable_returns || 0
            );

          setWithdrawableReturns(
            centralReturns
          );

          localStorage.setItem(
            "transportWithdrawableReturns_" +
              phone,
            String(centralReturns)
          );
        }
      } catch (error) {
        console.log(
          "User balance load error:",
          error
        );
      }

      try {
        const {
          data: withdrawalRows,
          error: withdrawalError,
        } = await supabase
          .from("withdraw_requests")
          .select("*")
          .eq("user_phone", phone)
          .order("created_at", {
            ascending: false,
          });

        if (
          !withdrawalError &&
          Array.isArray(withdrawalRows)
        ) {
          setWithdrawRequests(
            withdrawalRows
          );
        } else {
          setWithdrawRequests([]);
        }
      } catch (error) {
        console.log(
          "Withdrawal request load error:",
          error
        );

        setWithdrawRequests([]);
      }

      setTeamMembers(
        getStorageArray(
          "transportTeam_" + phone
        )
      );

      setLoading(false);
    }

    loadDashboard();
  }, []);

  const displayName =
    getUserName(user);

  const totalInvestment = useMemo(() => {
    return activePlans.reduce(
      (total, plan) =>
        total +
        Number(plan.price || 0),
      0
    );
  }, [activePlans]);

  const weeklyReturn = useMemo(() => {
    return activePlans.reduce(
      (total, plan) =>
        total +
        getWeeklyReturn(plan),
      0
    );
  }, [activePlans]);

  const earnedReturns = useMemo(() => {
    return activePlans.reduce(
      (total, plan) => {
        const earned =
          Number(
            plan.earnedReturns ??
              plan.totalEarned ??
              plan.total_earned ??
              0
          );

        return total + earned;
      },
      0
    );
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
      .filter((item) => {
        const type =
          String(
            item.type || ""
          ).toLowerCase();

        const status =
          String(
            item.status || ""
          ).toLowerCase();

        return (
          type === "deposit" &&
          status === "approved" &&
          !String(
            item.returnType ||
              item.return_type ||
              ""
          )
            .toLowerCase()
            .includes("weekly")
        );
      })
      .reduce(
        (total, item) =>
          total +
          Number(item.amount || 0),
        0
      );
  }, [transactions]);

  const withdrawalTotal = useMemo(() => {
    return withdrawRequests
      .filter(
        (item) =>
          String(
            item.status || ""
          ).toLowerCase() ===
          "approved"
      )
      .reduce(
        (total, item) =>
          total +
          Number(item.amount || 0),
        0
      );
  }, [withdrawRequests]);

  const pendingDeposits = useMemo(() => {
    return transactions
      .filter((item) => {
        const type =
          String(
            item.type || ""
          ).toLowerCase();

        const status =
          String(
            item.status || ""
          ).toLowerCase();

        return (
          type === "deposit" &&
          status === "pending" &&
          !String(
            item.returnType ||
              item.return_type ||
              ""
          )
            .toLowerCase()
            .includes("weekly")
        );
      })
      .reduce(
        (total, item) =>
          total +
          Number(item.amount || 0),
        0
      );
  }, [transactions]);

  const pendingWithdrawals = useMemo(() => {
    return withdrawRequests
      .filter(
        (item) =>
          String(
            item.status || ""
          ).toLowerCase() ===
          "pending"
      )
      .reduce(
        (total, item) =>
          total +
          Number(item.amount || 0),
        0
      );
  }, [withdrawRequests]);

  const teamInvestment = useMemo(() => {
    return teamMembers.reduce(
      (total, member) =>
        total +
        Number(member.investment || 0),
      0
    );
  }, [teamMembers]);

  const paidTeam = useMemo(() => {
    return teamMembers.reduce(
      (total, member) =>
        total +
        Number(member.commission || 0),
      0
    );
  }, [teamMembers]);

  const todayTeam = useMemo(() => {
    return teamMembers.reduce(
      (total, member) => {
        if (!member.joinedAt) {
          return total;
        }

        const joined =
          new Date(
            member.joinedAt
          );

        const now = new Date();

        const sameDay =
          joined.getDate() ===
            now.getDate() &&
          joined.getMonth() ===
            now.getMonth() &&
          joined.getFullYear() ===
            now.getFullYear();

        return sameDay
          ? total +
              Number(
                member.commission || 0
              )
          : total;
      },
      0
    );
  }, [teamMembers]);

  const todayProfit =
    weeklyReturn;

  const yesterdayProfit =
    weeklyReturn;

  const weekProfit =
    weeklyReturn;

  const monthProfit =
    weeklyReturn * 4;

  const walletBalance =
    Number(withdrawableReturns || 0);

  const referralCode = useMemo(() => {
    if (!user) {
      return "";
    }

    const userKey =
      user.phone ||
      user.mobile ||
      user.username ||
      user.email ||
      user.name ||
      "user";

    const storageKey =
      "transportReferralCode_" +
      String(userKey);

    let savedCode =
      localStorage.getItem(
        storageKey
      );

    if (!savedCode) {
      savedCode =
        "TH" +
        Math.floor(
          100000 +
            Math.random() *
              900000
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

  const recentTransactions =
    useMemo(() => {
      const localItems =
        transactions
          .filter((item) => {
            const type =
              String(
                item.type || ""
              ).toLowerCase();

            return (
              type !== "withdraw" &&
              type !== "withdrawal"
            );
          })
          .map((item) => ({
            ...item,
            sortDate:
              item.createdAt ||
              item.created_at ||
              item.submittedAt ||
              item.submitted_at ||
              item.date ||
              "",
          }));

      const withdrawalItems =
        withdrawRequests.map(
          (item) => ({
            id: item.id,
            type: "withdraw",
            status:
              item.status ||
              "Pending",
            amount:
              Number(
                item.amount || 0
              ),
            date:
              item.submitted_at ||
              item.created_at ||
              "Recently",
            createdAt:
              item.submitted_at ||
              item.created_at ||
              "",
            sortDate:
              item.submitted_at ||
              item.created_at ||
              "",
            withdrawalRequestId:
              item.id,
          })
        );

      return [
        ...localItems,
        ...withdrawalItems,
      ].sort((a, b) => {
        const aTime =
          new Date(
            a.sortDate || 0
          ).getTime();

        const bTime =
          new Date(
            b.sortDate || 0
          ).getTime();

        return bTime - aTime;
      });
    }, [
      transactions,
      withdrawRequests,
    ]);

  function goTo(path) {
    setMenuOpen(false);
    window.location.href =
      path;
  }

  function copyReferral() {
    if (!referralLink) {
      return;
    }

    navigator.clipboard
      .writeText(referralLink)
      .then(() => {
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch(() => {});
  }

  function logout() {
    localStorage.removeItem(
      "transportLoggedIn"
    );

    localStorage.removeItem(
      "transportUser"
    );

    localStorage.removeItem(
      "transportCurrentUser"
    );

    window.location.href =
      "/login";
  }

  if (loading) {
    return (
      <div
        style={
          styles.loadingScreen
        }
      >
        <div
          style={
            styles.loadingCard
          }
        >
          <div
            style={
              styles.loadingIcon
            }
          >
            🚛
          </div>

          <div
            style={
              styles.loadingTitle
            }
          >
            Transport Hub
          </div>

          <div
            style={
              styles.loadingText
            }
          >
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
                rgba(
                  247,
                  201,
                  72,
                  0.12
                ),
              0 0 35px
                rgba(
                  44,
                  130,
                  201,
                  0.08
                );
          }

          50% {
            box-shadow:
              0 0 28px
                rgba(
                  247,
                  201,
                  72,
                  0.25
                ),
              0 0 55px
                rgba(
                  44,
                  130,
                  201,
                  0.14
                );
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
            transportCardFloat 5s
            ease-in-out infinite;
        }

        .transport-animated-card:hover {
          animation-play-state: paused;
          transform: translateY(-8px);
          box-shadow:
            0 12px 28px
              rgba(
                16,
                42,
                67,
                0.2
              );
        }

        .welcome-scroll-wrapper {
          overflow: hidden;
          flex: 1;
          min-width: 0;
        }

        .welcome-scroll-content {
          width: max-content;
          animation:
            welcomeTextMove 10s
            linear infinite;
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
        <div
          style={
            styles.mobileHeader
          }
        >
          <button
            style={
              styles.menuButton
            }
            onClick={() =>
              setMenuOpen(
                !menuOpen
              )
            }
          >
            ☰
          </button>

          <div
            style={
              styles.mobileHeaderTitle
            }
          >
            Transport Hub
          </div>
        </div>
      )}

      {(!isMobile ||
        menuOpen) && (
        <aside
          style={{
            ...styles.sidebar,
            ...(isMobile
              ? styles.mobileSidebar
              : {}),
          }}
        >
          <div
            style={
              styles.logoArea
            }
          >
            <div
              style={
                styles.logoIcon
              }
            >
              🚛
            </div>

            <div>
              <div
                style={
                  styles.logoTitle
                }
              >
                Transport Hub
              </div>

              <div
                style={
                  styles.logoSubtitle
                }
              >
                Investment Platform
              </div>
            </div>
          </div>

          <nav
            style={
              styles.navigation
            }
          >
            <button
              style={{
                ...styles.navItem,
                ...styles.activeNavItem,
              }}
              onClick={() =>
                goTo("/")
              }
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                goTo(
                  "/transport-plans"
                )
              }
            >
              <span>🚛</span>
              <span>
                Transport Plans
              </span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                goTo("/deposit")
              }
            >
              <span>💰</span>
              <span>Deposit</span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                goTo("/withdraw")
              }
            >
              <span>💸</span>
              <span>Withdraw</span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                goTo(
                  "/transactions"
                )
              }
            >
              <span>📊</span>
              <span>
                Transactions
              </span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                goTo(
                  "/deposit-history"
                )
              }
            >
              <span>📋</span>
              <span>
                Deposit History
              </span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                goTo(
                  "/withdraw-history"
                )
              }
            >
              <span>📋</span>
              <span>
                Withdraw History
              </span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                goTo(
                  "/weekly-returns"
                )
              }
            >
              <span>🎁</span>
              <span>
                Weekly Returns
              </span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                goTo("/my-team")
              }
            >
              <span>👥</span>
              <span>My Team</span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                goTo("/referral")
              }
            >
              <span>🔗</span>
              <span>Referral</span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                setShowFeatures(
                  true
                )
              }
            >
              <span>🔐</span>
              <span>Security</span>
            </button>

            <button
              style={
                styles.navItem
              }
              onClick={() =>
                goTo("/support")
              }
            >
              <span>🎧</span>
              <span>Support</span>
            </button>

            <button
              style={
                styles.logoutNavItem
              }
              onClick={logout}
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </nav>
        </aside>
      )}

      {isMobile &&
        menuOpen && (
          <div
            style={
              styles.mobileOverlay
            }
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
          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={
                styles.pageTitle
              }
            >
              Dashboard
            </div>

            <div
              style={
                styles.pageSubtitle
              }
            >
              Manage your transport
              investment account
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
              <div
                style={
                  styles.welcomeSmall
                }
              >
                Welcome back
              </div>

              <div
                style={
                  styles.welcomeTitle
                }
              >
                {displayName} 👋
              </div>

              <div
                style={
                  styles.welcomeText
                }
              >
                Track your investments,
                weekly returns and team
                activity from one place.
              </div>
            </div>
          </div>

          <div
            style={
              styles.welcomeTruck
            }
          >
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
            style={
              styles.summaryCard
            }
          >
            <div
              style={
                styles.summaryIcon
              }
            >
              💼
            </div>

            <div
              style={
                styles.summaryLabel
              }
            >
              Total Investment
            </div>

            <div
              style={
                styles.summaryValue
              }
            >
              {formatMoney(
                totalInvestment
              )}
            </div>
          </div>

          <div
            className="transport-animated-card"
            style={{
              ...styles.summaryCard,
              animationDelay:
                "0.5s",
            }}
          >
            <div
              style={
                styles.summaryIcon
              }
            >
              📈
            </div>

            <div
              style={
                styles.summaryLabel
              }
            >
              Weekly Return
            </div>

            <div
              style={
                styles.summaryValue
              }
            >
              {formatMoney(
                weeklyReturn
              )}
            </div>
          </div>

          <div
            className="transport-animated-card"
            style={{
              ...styles.summaryCard,
              animationDelay:
                "1s",
            }}
          >
            <div
              style={
                styles.summaryIcon
              }
            >
              💰
            </div>

            <div
              style={
                styles.summaryLabel
              }
            >
              Wallet Balance
            </div>

            <div
              style={
                styles.summaryValue
              }
            >
              {formatMoney(
                walletBalance
              )}
            </div>
          </div>

          <div
            className="transport-animated-card"
            style={{
              ...styles.summaryCard,
              animationDelay:
                "1.5s",
            }}
          >
            <div
              style={
                styles.summaryIcon
              }
            >
              🎯
            </div>

            <div
              style={
                styles.summaryLabel
              }
            >
              Expected Return
            </div>

            <div
              style={
                styles.summaryValue
              }
            >
              {formatMoney(
                expectedReturn
              )}
            </div>
          </div>
        </section>

        <section
          className="transport-animated-card"
          style={
            styles.largeCard
          }
        >
          <div
            style={{
              ...styles.sectionHeader,
              ...(isMobile
                ? styles.mobileSectionHeader
                : {}),
            }}
          >
            <div
              style={{
                minWidth: 0,
              }}
            >
              <div
                style={
                  styles.sectionTitle
                }
              >
                🚛 Active Transport
                Plans
              </div>

              <div
                style={
                  styles.sectionSubtitle
                }
              >
                Your currently active
                investment plans
              </div>
            </div>

            <button
              style={
                styles.greenButton
              }
              onClick={() =>
                goTo(
                  "/transport-plans"
                )
              }
            >
              + Add Plan
            </button>
          </div>

          {activePlans.length ===
          0 ? (
            <div
              style={
                styles.emptyState
              }
            >
              <div
                style={
                  styles.emptyIcon
                }
              >
                🚛
              </div>

              <div
                style={
                  styles.emptyTitle
                }
              >
                No Active
                Transport Plans
              </div>

              <div
                style={
                  styles.emptyText
                }
              >
                Select a transport
                plan to start earning
                weekly returns.
              </div>

              <button
                style={
                  styles.greenButtonLarge
                }
                onClick={() =>
                  goTo(
                    "/transport-plans"
                  )
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
                    getWeeklyReturn(
                      plan
                    );

                  const totalPlanReturn =
                    weekly *
                    PLAN_DURATION_WEEKS;

                  return (
                    <div
                      className="transport-animated-card"
                      style={{
                        ...styles.planCard,
                        animationDelay:
                          index *
                            0.35 +
                          "s",
                      }}
                      key={
                        plan.id ||
                        index
                      }
                    >
                      <div
                        style={
                          styles.planTop
                        }
                      >
                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={
                              styles.planName
                            }
                          >
                            {plan.name}
                          </div>

                          <div
                            style={
                              styles.planPrice
                            }
                          >
                            {formatMoney(
                              plan.price
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
                          styles.planStats
                        }
                      >
                        <div>
                          <span
                            style={
                              styles.statLabel
                            }
                          >
                            Weekly
                          </span>

                          <strong
                            style={
                              styles.statValue
                            }
                          >
                            {formatMoney(
                              weekly
                            )}
                          </strong>
                        </div>

                        <div>
                          <span
                            style={
                              styles.statLabel
                            }
                          >
                            Duration
                          </span>

                          <strong
                            style={
                              styles.statValue
                            }
                          >
                            260 Weeks
                          </strong>
                        </div>

                        <div>
                          <span
                            style={
                              styles.statLabel
                            }
                          >
                            Total Return
                          </span>

                          <strong
                            style={
                              styles.statValue
                            }
                          >
                            {formatMoney(
                              totalPlanReturn
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
            style={{
              ...styles.sideCard,
              animationDelay:
                "0.4s",
            }}
          >
            <div
              style={
                styles.sectionTitle
              }
            >
              💰 Wallet Overview
            </div>

            <div
              style={
                styles.walletRows
              }
            >
              <div
                style={
                  styles.walletRow
                }
              >
                <span>
                  Available Balance
                </span>

                <strong>
                  {formatMoney(
                    walletBalance
                  )}
                </strong>
              </div>

              <div
                style={
                  styles.walletRow
                }
              >
                <span>
                  Total Deposits
                </span>

                <strong>
                  {formatMoney(
                    depositTotal
                  )}
                </strong>
              </div>

              <div
                style={
                  styles.walletRow
                }
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
                style={
                  styles.walletRow
                }
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
                style={
                  styles.walletRow
                }
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
            style={{
              ...styles.sideCard,
              animationDelay:
                "0.9s",
            }}
          >
            <div
              style={
                styles.sectionTitle
              }
            >
              📈 Return Summary
            </div>

            <div
              style={
                styles.walletRows
              }
            >
              <div
                style={
                  styles.walletRow
                }
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
                style={
                  styles.walletRow
                }
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
                style={
                  styles.walletRow
                }
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
                style={
                  styles.walletRow
                }
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
                style={
                  styles.walletRow
                }
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
            style={{
              ...styles.sideCard,
              animationDelay:
                "0.6s",
            }}
          >
            <div
              style={
                styles.sectionTitle
              }
            >
              👥 My Team
            </div>

            <div
              style={
                styles.teamMainNumber
              }
            >
              {teamMembers.length}
            </div>

            <div
              style={
                styles.teamLabel
              }
            >
              Total Team Members
            </div>

            <div
              style={
                styles.teamStats
              }
            >
              <div
                style={
                  styles.teamStat
                }
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
                style={
                  styles.teamStat
                }
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
                style={
                  styles.teamStat
                }
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
                goTo(
                  "/my-team"
                )
              }
            >
              View My Team
            </button>
          </div>

          <div
            className="transport-animated-card"
            style={{
              ...styles.sideCard,
              animationDelay:
                "1.1s",
            }}
          >
            <div
              style={
                styles.sectionTitle
              }
            >
              🔗 Referral Program
            </div>

            <div
              style={
                styles.referralText
              }
            >
              Invite friends and grow
              your team.
            </div>

            <div
              style={
                styles.referralCodeBox
              }
            >
              <span
                style={{
                  overflow:
                    "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace:
                    "nowrap",
                }}
              >
                {referralCode}
              </span>

              <button
                style={
                  styles.copyButton
                }
                onClick={
                  copyReferral
                }
              >
                {copied
                  ? "Copied"
                  : "Copy"}
              </button>
            </div>

            <div
              style={
                styles.referralLinkBox
              }
            >
              {referralLink ||
                "Referral link unavailable"}
            </div>

            <button
              style={
                styles.greenButton
              }
              onClick={() =>
                goTo(
                  "/referral"
                )
              }
            >
              Open Referral
            </button>
          </div>
        </section>

        <section
          className="transport-animated-card"
          style={
            styles.activityCard
          }
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
                style={
                  styles.sectionTitle
                }
              >
                📊 Recent Transactions
              </div>

              <div
                style={
                  styles.sectionSubtitle
                }
              >
                Latest account activity
              </div>
            </div>

            <button
              style={
                styles.textButton
              }
              onClick={() =>
                goTo(
                  "/transactions"
                )
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
              No transactions yet.
            </div>
          ) : (
            <div
              style={
                styles.transactionList
              }
            >
              {recentTransactions
                .slice(0, 5)
                .map(
                  (
                    item,
                    index
                  ) => {
                    const type =
                      String(
                        item.type ||
                          ""
                      ).toLowerCase();

                    const returnType =
                      String(
                        item.returnType ||
                          item.return_type ||
                          item.transactionType ||
                          item.transaction_type ||
                          ""
                      ).toLowerCase();

                    const status =
                      String(
                        item.status ||
                          "pending"
                      ).toLowerCase();

                    const isReturn =
                      type ===
                        "return" ||
                      type.includes(
                        "return"
                      ) ||
                      returnType.includes(
                        "return"
                      ) ||
                      returnType.includes(
                        "weekly"
                      );

                    const isWithdraw =
                      type ===
                        "withdraw" ||
                      type ===
                        "withdrawal";

                    let transactionTitle =
                      "Deposit";

                    let transactionIcon =
                      "💰";

                    if (isReturn) {
                      transactionTitle =
                        "Return";

                      transactionIcon =
                        "🎁";
                    } else if (
                      isWithdraw
                    ) {
                      transactionTitle =
                        "Withdraw";

                      transactionIcon =
                        "💸";
                    }

                    const transactionDate =
                      item.date ||
                      item.createdAt ||
                      item.created_at ||
                      item.submittedAt ||
                      item.submitted_at ||
                      "";

                    return (
                      <div
                        style={{
                          ...styles.transactionRow,
                          ...(isMobile
                            ? styles.mobileTransactionRow
                            : {}),
                        }}
                        key={
                          item.id ||
                          item.withdrawalRequestId ||
                          index
                        }
                      >
                        <div
                          style={
                            styles.transactionIcon
                          }
                        >
                          {
                            transactionIcon
                          }
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
                            {
                              transactionTitle
                            }
                          </div>

                          <div
                            style={
                              styles.transactionDate
                            }
                          >
                            {formatDateTime(
                              transactionDate
                            )}
                          </div>
                        </div>

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
                            ...styles.statusBadge,
                            ...(status ===
                              "approved" ||
                            status ===
                              "completed"
                              ? styles.approvedStatus
                              : status ===
                                "rejected"
                              ? styles.rejectedStatus
                              : styles.pendingStatus),
                          }}
                        >
                          {status.toUpperCase()}
                        </div>
                      </div>
                    );
                  }
                )}
            </div>
          )}
        </section>

        <section
          className="transport-animated-card"
          style={{
            ...styles.dashboardSupport,
            ...(isMobile
              ? styles.mobileDashboardSupport
              : {}),
          }}
        >
          <div
            style={
              styles.dashboardSupportIcon
            }
          >
            🎧
          </div>

          <div
            style={
              styles.dashboardSupportContent
            }
          >
            <div
              style={
                styles.dashboardSupportTitle
              }
            >
              Need Help?
            </div>

            <div
              style={
                styles.dashboardSupportText
              }
            >
              Have questions about
              your account, deposits,
              withdrawals, or transport
              plans? Our support team is
              here to help.
            </div>
          </div>

          <div
            style={{
              ...styles.dashboardSupportButtons,
              ...(isMobile
                ? styles.mobileSupportButtons
                : {}),
            }}
          >
            <button
              style={
                styles.liveChatButton
              }
              onClick={() =>
                goTo(
                  "/support"
                )
              }
            >
              💬 Live Chat
            </button>

            <a
              href="https://wa.me/923263159327?text=Hello%20Transport%20Hub%20Support%2C%20I%20need%20help."
              target="_blank"
              rel="noopener noreferrer"
              style={
                styles.whatsappButton
              }
            >
              📱 WhatsApp
            </a>
          </div>
        </section>

        <section
          className="transport-animated-card"
          style={{
            ...styles.appDownloadCard,
            ...(isMobile
              ? styles.mobileAppDownloadCard
              : {}),
          }}
        >
          <div
            style={
              styles.appDownloadIcon
            }
          >
            📱
          </div>

          <div
            style={
              styles.appDownloadContent
            }
          >
            <div
              style={
                styles.appDownloadTitle
              }
            >
              Transport Hub Mobile App
            </div>

            <div
              style={
                styles.appDownloadText
              }
            >
              Download the Transport Hub
              app for a faster, smoother,
              and more convenient
              experience.
            </div>
          </div>

          <a
            href="/transport-hub.apk"
            download="Transport-Hub.apk"
            style={
              styles.appDownloadButton
            }
          >
            📥 Download App
          </a>
        </section>
      </main>

      {showPrizePopup && (
        <div
          style={
            styles.prizePopupOverlay
          }
        >
          <div
            style={{
              ...styles.prizePopupCard,
              animation:
                "prizePopupIn .35s ease-out forwards",
            }}
          >
            <div
              style={
                styles.prizePopupTop
              }
            >
              <div
                style={
                  styles.prizeBrandPill
                }
              >
                🚛 TRANSPORT HUB
              </div>

              <button
                style={
                  styles.prizeCloseTop
                }
                onClick={() =>
                  setShowPrizePopup(
                    false
                  )
                }
                aria-label="Close popup"
              >
                ×
              </button>
            </div>

            <div
              style={
                styles.prizeHero
              }
            >
              <div
                style={{
                  ...styles.prizeGlowIcon,
                  animation:
                    "prizeIconFloat 2.8s ease-in-out infinite",
                }}
              >
                🏆
              </div>

              <div
                style={
                  styles.prizeSmallTitle
                }
              >
                SPECIAL TEAM REWARD
              </div>

              <div
                style={
                  styles.prizeMainTitle
                }
              >
                WIN 5 LAKH PRIZE
              </div>

              <div
                style={
                  styles.prizeSubtitle
                }
              >
                Build Your Team •
                Unlock Your Reward
              </div>

              <div
                style={
                  styles.prizeDivider
                }
              />

              <div
                style={
                  styles.prizeMessage
                }
              >
                When your team crosses
              </div>

              <div
                style={
                  styles.prizeTarget
                }
              >
                50 LAKH
              </div>

              <div
                style={
                  styles.prizeMessage
                }
              >
                you will WIN
              </div>

              <div
                style={
                  styles.prizeAmount
                }
              >
                5 LAKH
              </div>

              <div
                style={
                  styles.prizeBottomGlow
                }
              >
                🏆
              </div>
            </div>

            <div
              style={
                styles.channelPrizeCard
              }
            >
              <div
                style={
                  styles.channelIcon
                }
              >
                📢
              </div>

              <div
                style={
                  styles.channelInfo
                }
              >
                <div
                  style={
                    styles.channelTitle
                  }
                >
                  JOIN OUR OFFICIAL
                  CHANNEL
                </div>

                <div
                  style={
                    styles.channelSubtitle
                  }
                >
                  News • Updates &
                  Announcements
                </div>
              </div>

              <a
                href="https://whatsapp.com/channel/0029VbDUOmH6xCSQ4ejQlS0R"
                target="_blank"
                rel="noopener noreferrer"
                style={
                  styles.channelButton
                }
              >
                JOIN CHANNEL →
              </a>
            </div>

            <div
              style={
                styles.prizeBottomButtons
              }
            >
              <button
                style={
                  styles.prizeCloseButton
                }
                onClick={() =>
                  setShowPrizePopup(
                    false
                  )
                }
              >
                CLOSE ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {showFeatures && (
        <div
          style={
            styles.modalOverlay
          }
        >
          <div
            style={
              styles.modalCard
            }
          >
            <div
              style={
                styles.modalIcon
              }
            >
              🚧
            </div>

            <div
              style={
                styles.modalTitle
              }
            >
              Coming Soon
            </div>

            <div
              style={
                styles.modalText
              }
            >
              This feature is currently
              under development and will
              be available soon.
            </div>

            <button
              style={
                styles.greenButtonLarge
              }
              onClick={() =>
                setShowFeatures(
                  false
                )
              }
            >
              Close
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
    background: "#eef3f7",
    color: "#102A43",
    fontFamily: "Arial, sans-serif",
  },

  mobileHeader: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height:
      "calc(58px + env(safe-area-inset-top, 0px))",
    paddingTop:
      "env(safe-area-inset-top, 0px)",
    background: "#102A43",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: "14px",
    paddingRight: "14px",
    boxSizing: "border-box",
    zIndex: 1100,
    boxShadow:
      "0 3px 15px rgba(0,0,0,.15)",
  },

  menuButton: {
    width: "38px",
    height: "38px",
    border:
      "1px solid #294B66",
    borderRadius: "9px",
    background: "#173B5A",
    color: "#ffffff",
    fontSize: "20px",
    cursor: "pointer",
  },

  mobileHeaderTitle: {
    fontSize: "15px",
    fontWeight: 900,
  },

  mobileOverlay: {
    position: "fixed",
    top:
      "calc(58px + env(safe-area-inset-top, 0px))",
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "rgba(0,0,0,.55)",
    zIndex: 1150,
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
    zIndex: 1000,
  },

  mobileSidebar: {
    width: "270px",
    maxWidth: "82vw",
    top:
      "calc(58px + env(safe-area-inset-top, 0px))",
    bottom: 0,
    height:
      "calc(100vh - 58px - env(safe-area-inset-top, 0px))",
    boxShadow:
      "8px 0 25px rgba(0,0,0,.25)",
    zIndex: 1200,
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 8px 18px",
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
    flexShrink: 0,
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
    border:
      "1px solid #294B66",
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
    width:
      "calc(100% - 245px)",
    minHeight: "100vh",
    padding: "22px",
    boxSizing: "border-box",
    minWidth: 0,
  },

  mobileMainContent: {
    marginLeft: 0,
    width: "100%",
    paddingTop:
      "calc(76px + env(safe-area-inset-top, 0px))",
    paddingRight: "12px",
    paddingBottom: "20px",
    paddingLeft: "12px",
    boxSizing: "border-box",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "18px",
  },

  mobileTopBar: {
    alignItems: "flex-start",
    gap: "8px",
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

  welcomeCard: {
    background: "#102A43",
    borderRadius: "18px",
    padding: "24px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "18px",
    border:
      "1px solid #1E3A56",
    minWidth: 0,
    boxSizing: "border-box",
  },

  mobileWelcomeCard: {
    padding: "18px",
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
    overflowWrap: "anywhere",
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

  mobileSummaryGrid: {
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  summaryCard: {
    background: "#102A43",
    borderRadius: "15px",
    padding: "17px",
    border:
      "1px solid #1E3A56",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
    transition:
      "transform 0.3s ease, box-shadow 0.3s ease",
  },

  summaryIcon: {
    fontSize: "21px",
    marginBottom: "10px",
  },

  summaryLabel: {
    color: "#9FB3C8",
    fontSize: "10px",
    fontWeight: 700,
    overflowWrap: "anywhere",
  },

  summaryValue: {
    color: "#ffffff",
    fontSize: "19px",
    fontWeight: 900,
    marginTop: "5px",
    overflowWrap: "anywhere",
  },

  largeCard: {
    background: "#102A43",
    borderRadius: "17px",
    padding: "20px",
    border:
      "1px solid #1E3A56",
    marginBottom: "18px",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "15px",
  },

  mobileSectionHeader: {
    alignItems: "flex-start",
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 900,
    overflowWrap: "anywhere",
  },

  sectionSubtitle: {
    color: "#9FB3C8",
    fontSize: "9px",
    marginTop: "4px",
    overflowWrap: "anywhere",
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
    flexShrink: 0,
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
    maxWidth: "100%",
  },

  emptyState: {
    textAlign: "center",
    padding: "35px 15px",
    background: "#173B5A",
    borderRadius: "14px",
    boxSizing: "border-box",
  },

  emptyIcon: {
    fontSize: "32px",
    marginBottom: "9px",
  },

  emptyTitle: {
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 900,
    overflowWrap: "anywhere",
  },

  emptyText: {
    color: "#9FB3C8",
    fontSize: "10px",
    margin:
      "6px 0 14px",
    overflowWrap: "anywhere",
  },

  planGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    minWidth: 0,
  },

  mobilePlanGrid: {
    gridTemplateColumns:
      "minmax(0, 1fr)",
  },

  planCard: {
    background: "#173B5A",
    borderRadius: "13px",
    padding: "15px",
    border:
      "1px solid #294B66",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
  },

  planTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "flex-start",
    minWidth: 0,
  },

  planName: {
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "14px",
    overflowWrap: "anywhere",
  },

  planPrice: {
    color: "#8FD694",
    fontWeight: 900,
    fontSize: "17px",
    marginTop: "3px",
    overflowWrap: "anywhere",
  },

  activeBadge: {
    background: "#29435A",
    color: "#8FD694",
    padding: "5px 8px",
    borderRadius: "7px",
    fontSize: "8px",
    fontWeight: 900,
    flexShrink: 0,
  },

  planStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    marginTop: "15px",
    paddingTop: "12px",
    borderTop:
      "1px solid #294B66",
    minWidth: 0,
  },

  statLabel: {
    display: "block",
    color: "#9FB3C8",
    fontSize: "8px",
    marginBottom: "3px",
    overflowWrap: "anywhere",
  },

  statValue: {
    display: "block",
    color: "#ffffff",
    fontSize: "10px",
    overflowWrap: "anywhere",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "18px",
    minWidth: 0,
  },

  mobileTwoColumnGrid: {
    gridTemplateColumns:
      "minmax(0, 1fr)",
    gap: "12px",
  },

  sideCard: {
    background: "#102A43",
    borderRadius: "17px",
    padding: "20px",
    border:
      "1px solid #1E3A56",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
  },

  walletRows: {
    marginTop: "12px",
  },

  walletRow: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "10px",
    padding: "10px 0",
    borderBottom:
      "1px solid #1E3A56",
    color: "#C9D8E6",
    fontSize: "10px",
    minWidth: 0,
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
    justifyContent:
      "space-between",
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
    border:
      "1px solid #3E8E5B",
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
    justifyContent:
      "space-between",
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
    background: "#173B5B",
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
    border:
      "1px solid #1E3A56",
    marginBottom: "20px",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
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
    width: "100%",
  },

  transactionRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 0",
    borderBottom:
      "1px solid #1E3A56",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  mobileTransactionRow: {
    gap: "7px",
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
    overflow: "hidden",
  },

  transactionTitle: {
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: 800,
    overflowWrap: "anywhere",
  },

  transactionDate: {
    color: "#9FB3C8",
    fontSize: "8px",
    marginTop: "2px",
    lineHeight: 1.4,
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  transactionAmount: {
    color: "#8FD694",
    fontSize: "10px",
    fontWeight: 900,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },

  statusBadge: {
    padding: "5px 7px",
    borderRadius: "6px",
    fontSize: "7px",
    fontWeight: 900,
    flexShrink: 0,
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
    border:
      "1px solid #1E3A56",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow:
      "0 8px 24px rgba(16,42,67,.12)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  mobileDashboardSupport: {
    flexDirection: "column",
    alignItems: "stretch",
    textAlign: "center",
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
    alignSelf: "center",
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
    overflowWrap: "anywhere",
  },

  dashboardSupportButtons: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },

  mobileSupportButtons: {
    justifyContent: "center",
    width: "100%",
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
    border:
      "1px solid #294B66",
    padding: "10px 14px",
    borderRadius: "9px",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  appDownloadCard: {
    background:
      "linear-gradient(135deg, #102A43, #173B5A)",
    borderRadius: "18px",
    padding: "22px",
    marginTop: "20px",
    marginBottom: "20px",
    border:
      "1px solid #294B66",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow:
      "0 8px 24px rgba(16,42,67,.12)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  mobileAppDownloadCard: {
    flexDirection: "column",
    alignItems: "stretch",
    textAlign: "center",
    padding: "20px 16px",
  },

  appDownloadIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "15px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    flexShrink: 0,
    alignSelf: "center",
  },

  appDownloadContent: {
    flex: 1,
    minWidth: 0,
  },

  appDownloadTitle: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 900,
    marginBottom: "6px",
  },

  appDownloadText: {
    color: "#C9D8E6",
    fontSize: "11px",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },

  appDownloadButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    textDecoration: "none",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: "9px",
    border:
      "1px solid #4FA66A",
    fontSize: "10px",
    fontWeight: 900,
    whiteSpace: "nowrap",
    cursor: "pointer",
    boxShadow:
      "0 5px 14px rgba(46,107,74,.18)",
    flexShrink: 0,
  },

  loadingScreen: {
    minHeight: "100vh",
    background: "#eef3f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },

  loadingCard: {
    background: "#102A43",
    color: "#ffffff",
    padding: "35px",
    borderRadius: "18px",
    textAlign: "center",
    width: "280px",
    maxWidth: "100%",
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

  prizePopupOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(3, 12, 24, 0.82)",
    backdropFilter: "blur(7px)",
    WebkitBackdropFilter:
      "blur(7px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5000,
    padding: "18px",
    boxSizing: "border-box",
  },

  prizePopupCard: {
    width: "100%",
    maxWidth: "445px",
    maxHeight: "92vh",
    overflowY: "auto",
    background:
      "linear-gradient(145deg, #071d32 0%, #102A43 55%, #081a2d 100%)",
    borderRadius: "24px",
    border:
      "1px solid rgba(66, 150, 211, 0.55)",
    padding: "16px",
    boxSizing: "border-box",
    position: "relative",
    boxShadow:
      "0 25px 70px rgba(0,0,0,.55), 0 0 45px rgba(30,120,190,.12)",
  },

  prizePopupTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "12px",
  },

  prizeBrandPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 12px",
    borderRadius: "999px",
    background:
      "linear-gradient(135deg, #173B5A, #1E4C70)",
    border:
      "1px solid rgba(103, 180, 235, .35)",
    color: "#ffffff",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: ".5px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,.18)",
  },

  prizeCloseTop: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border:
      "1px solid rgba(154, 190, 214, .3)",
    background:
      "rgba(255,255,255,.08)",
    color: "#ffffff",
    fontSize: "22px",
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  prizeHero: {
    position: "relative",
    textAlign: "center",
    borderRadius: "20px",
    padding: "22px 15px 20px",
    background:
      "linear-gradient(160deg, rgba(18,58,88,.96), rgba(7,29,49,.98))",
    border:
      "1px solid rgba(68, 142, 193, .42)",
    overflow: "hidden",
    animation:
      "prizeGlow 3.5s ease-in-out infinite",
  },

  prizeGlowIcon: {
    width: "66px",
    height: "66px",
    margin: "0 auto 10px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "35px",
    background:
      "linear-gradient(145deg, #263F5A, #162D45)",
    border:
      "1px solid rgba(247,201,72,.42)",
    boxShadow:
      "0 8px 28px rgba(247,201,72,.12)",
  },

  prizeSmallTitle: {
    color: "#8FB4CE",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "1.5px",
    marginBottom: "6px",
  },

  prizeMainTitle: {
    color: "#F7C948",
    fontSize: "28px",
    lineHeight: 1.1,
    fontWeight: 1000,
    letterSpacing: ".3px",
    textShadow:
      "0 3px 18px rgba(247,201,72,.2)",
  },

  prizeSubtitle: {
    color: "#D7E6F0",
    fontSize: "10px",
    fontWeight: 700,
    marginTop: "8px",
  },

  prizeDivider: {
    width: "70%",
    height: "1px",
    margin: "16px auto",
    background:
      "linear-gradient(90deg, transparent, rgba(247,201,72,.6), transparent)",
  },

  prizeMessage: {
    color: "#AFC5D5",
    fontSize: "10px",
    fontWeight: 700,
    lineHeight: 1.5,
  },

  prizeTarget: {
    display: "inline-block",
    margin: "7px 0",
    padding: "7px 15px",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #193C59, #102A43)",
    border:
      "1px solid rgba(78,160,215,.4)",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: 1000,
    letterSpacing: ".5px",
    boxShadow:
      "0 6px 20px rgba(0,0,0,.18)",
  },

  prizeAmount: {
    color: "#F7C948",
    fontSize: "36px",
    lineHeight: 1,
    fontWeight: 1000,
    marginTop: "7px",
    letterSpacing: ".5px",
    textShadow:
      "0 4px 25px rgba(247,201,72,.24)",
  },

  prizeBottomGlow: {
    color: "#F7C948",
    fontSize: "20px",
    marginTop: "12px",
    opacity: 0.8,
  },

  channelPrizeCard: {
    marginTop: "12px",
    padding: "13px",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, rgba(24,58,83,.96), rgba(11,35,55,.98))",
    border:
      "1px solid rgba(79,157,207,.38)",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    boxShadow:
      "0 8px 24px rgba(0,0,0,.16)",
  },

  channelIcon: {
    width: "45px",
    height: "45px",
    flexShrink: 0,
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    background:
      "linear-gradient(145deg, #274D6C, #173B5A)",
    border:
      "1px solid rgba(247,201,72,.3)",
  },

  channelInfo: {
    flex: 1,
    minWidth: 0,
  },

  channelTitle: {
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: 1000,
    letterSpacing: ".3px",
    overflowWrap: "anywhere",
  },

  channelSubtitle: {
    color: "#8FAFC4",
    fontSize: "8px",
    marginTop: "4px",
    lineHeight: 1.4,
  },

  channelButton: {
    flexShrink: 0,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 11px",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #F7C948, #DDAE32)",
    color: "#102A43",
    fontSize: "8px",
    fontWeight: 1000,
    whiteSpace: "nowrap",
    boxShadow:
      "0 5px 16px rgba(247,201,72,.16)",
  },

  prizeBottomButtons: {
    marginTop: "12px",
    display: "flex",
    gap: "8px",
  },

  prizeCloseButton: {
    width: "100%",
    border:
      "1px solid rgba(111,153,181,.35)",
    background:
      "linear-gradient(135deg, #173B5A, #102A43)",
    color: "#D8E7F0",
    padding: "12px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: ".4px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(7, 24, 38, 0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 6000,
    padding: "20px",
    boxSizing: "border-box",
  },

  modalCard: {
    width: "100%",
    maxWidth: "390px",
    background: "#102A43",
    border:
      "1px solid #1E3A56",
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