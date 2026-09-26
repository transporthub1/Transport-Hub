"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const DEFAULT_PLAN = {
  name: "Starter",
  price: 100,
  weekly: 15,
  durationWeeks: 260,
  durationYears: 5,
  totalReturn: 3900,

  // Compatibility with old data
  daily: 15,
  duration: 260,
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

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function getPlanName(plan) {
  return (
    plan?.name ||
    plan?.planName ||
    "Transport Plan"
  );
}

function getWeeklyAmountFromPlan(plan) {
  return Number(
    plan?.weekly ??
      plan?.weeklyReturn ??
      plan?.daily ??
      plan?.dailyReturn ??
      0
  );
}

function normalizeActivePlan(row) {
  const rawPlan =
    row?.plan && typeof row.plan === "object"
      ? row.plan
      : {};

  const weekly = Number(
    rawPlan.weekly ??
      rawPlan.weeklyReturn ??
      rawPlan.daily ??
      rawPlan.dailyReturn ??
      0
  );

  const price = Number(
    rawPlan.price ??
      rawPlan.amount ??
      0
  );

  const durationWeeks = Number(
    rawPlan.durationWeeks ??
      rawPlan.duration ??
      260
  );

  const durationYears = Number(
    rawPlan.durationYears ??
      5
  );

  const returnsPaid = Number(
    row?.returns_paid ??
      row?.returnsPaid ??
      0
  );

  const earnedReturns = Number(
    row?.earned_returns ??
      row?.earnedReturns ??
      row?.total_earned ??
      row?.totalEarned ??
      0
  );

  const totalEarned = Number(
    row?.total_earned ??
      row?.totalEarned ??
      row?.earned_returns ??
      row?.earnedReturns ??
      0
  );

  const activatedAt =
    row?.activated_at ||
    row?.activatedAt ||
    null;

  const approvedAt =
    row?.approved_at ||
    row?.approvedAt ||
    null;

  const lastReturnAt =
    row?.last_return_at ||
    row?.lastReturnAt ||
    null;

  const nextReturnAt =
    row?.next_return_at ||
    row?.nextReturnAt ||
    null;

  return {
    id:
      row?.id ||
      rawPlan?.id ||
      null,

    depositRequestId:
      row?.deposit_request_id ||
      row?.depositRequestId ||
      null,

    userPhone:
      row?.user_phone ||
      row?.userPhone ||
      "",

    name: getPlanName(rawPlan),

    planName: getPlanName(rawPlan),

    price,

    amount: price,

    weekly,

    weeklyReturn: weekly,

    // Compatibility with old data
    daily: weekly,
    dailyReturn: weekly,

    durationWeeks: 260,
    durationYears,

    duration: 260,

    totalReturn:
      Number(
        rawPlan.totalReturn ||
          rawPlan.total_return ||
          0
      ) ||
      weekly * 260,

    returnsPaid,

    earnedReturns,

    totalEarned,

    activatedAt,

    approvedAt,

    lastReturnAt,

    nextReturnAt,

    status:
      row?.status ||
      "Active",

    updatedAt:
      row?.updated_at ||
      row?.updatedAt ||
      null,
  };
}

export default function DailyReturns() {
  const [user, setUser] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [withdrawableReturns, setWithdrawableReturns] =
    useState(0);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("success");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const loggedIn =
        localStorage.getItem(
          "transportLoggedIn"
        );

      if (loggedIn !== "true") {
        window.location.href = "/login";
        return;
      }

      const savedUser = readJSON(
        "transportUser",
        null
      );

      if (!savedUser) {
        window.location.href = "/login";
        return;
      }

      if (cancelled) return;

      setUser(savedUser);

      const phone =
        savedUser.phone ||
        savedUser.mobile ||
        savedUser.number ||
        "";

      const cleanPhone =
        normalizePhone(phone);

      let supabasePlans = [];
      let supabaseUser = null;

      /* =========================================================
         LOAD USER + ACTIVE PLANS FROM SUPABASE
      ========================================================= */

      try {
        const [
          activePlansResult,
          userResult,
        ] = await Promise.all([
          supabase
            .from("active_plans")
            .select("*")
            .order("created_at", {
              ascending: true,
            }),

          supabase
            .from("users")
            .select(
              "id, full_name, phone, balance, withdrawable_returns, referral_bonus, total_referral_bonus"
            )
            .eq("phone", phone)
            .maybeSingle(),
        ]);

        if (
          activePlansResult.error
        ) {
          console.log(
            "Supabase active plans error:",
            activePlansResult.error
          );
        } else {
          const allRows =
            Array.isArray(
              activePlansResult.data
            )
              ? activePlansResult.data
              : [];

          supabasePlans =
            allRows
              .filter((row) => {
                const rowPhone =
                  normalizePhone(
                    row.user_phone
                  );

                return (
                  rowPhone === cleanPhone &&
                  String(
                    row.status || "Active"
                  ).toLowerCase() ===
                    "active"
                );
              })
              .map(
                normalizeActivePlan
              );
        }

        if (
          userResult.error
        ) {
          console.log(
            "Supabase user load error:",
            userResult.error
          );
        } else {
          supabaseUser =
            userResult.data || null;
        }
      } catch (error) {
        console.log(
          "Supabase weekly returns load error:",
          error
        );
      }

      /* =========================================================
         SUPABASE IS AUTHORITATIVE
         LOCAL STORAGE IS FALLBACK / COMPATIBILITY ONLY
      ========================================================= */

      let plans = [];

      if (
        supabasePlans.length > 0
      ) {
        plans = supabasePlans;

        saveJSON(
          `transportActivePlans_${phone}`,
          plans
        );
      } else {
        const localPlans =
          readJSON(
            `transportActivePlans_${phone}`,
            []
          );

        if (
          Array.isArray(localPlans) &&
          localPlans.length > 0
        ) {
          plans = localPlans;
        }
      }

      if (plans.length === 0) {
        const oldPlan =
          readJSON(
            "transportActivePlan",
            null
          );

        if (oldPlan) {
          plans = Array.isArray(
            oldPlan
          )
            ? oldPlan
            : [oldPlan];
        }
      }

      const normalizedPlans =
        plans.map((plan) => {
          return {
            ...plan,

            price: Number(
              plan.price ??
                plan.amount ??
                0
            ),

            amount: Number(
              plan.amount ??
                plan.price ??
                0
            ),

            weekly: Number(
              plan.weekly ??
                plan.weeklyReturn ??
                plan.daily ??
                plan.dailyReturn ??
                0
            ),

            weeklyReturn: Number(
              plan.weeklyReturn ??
                plan.weekly ??
                plan.daily ??
                plan.dailyReturn ??
                0
            ),

            daily: Number(
              plan.daily ??
                plan.weekly ??
                plan.weeklyReturn ??
                plan.dailyReturn ??
                0
            ),

            dailyReturn: Number(
              plan.dailyReturn ??
                plan.weekly ??
                plan.weeklyReturn ??
                plan.daily ??
                0
            ),

            durationWeeks: 260,

            durationYears: Number(
              plan.durationYears || 5
            ),

            duration: 260,

            returnsPaid: Number(
              plan.returnsPaid || 0
            ),

            earnedReturns: Number(
              plan.earnedReturns ||
                plan.totalEarned ||
                0
            ),

            totalEarned: Number(
              plan.totalEarned ||
                plan.earnedReturns ||
                0
            ),

            nextReturnAt:
              plan.nextReturnAt ||
              plan.next_return_at ||
              null,

            lastReturnAt:
              plan.lastReturnAt ||
              plan.last_return_at ||
              null,
          };
        });

      if (
        cancelled
      ) {
        return;
      }

      setActivePlans(
        normalizedPlans
      );

      saveJSON(
        `transportActivePlans_${phone}`,
        normalizedPlans
      );

      /* =========================================================
         LOAD WITHDRAWABLE RETURNS FROM SUPABASE
      ========================================================= */

      if (supabaseUser) {
        const centralWithdrawable =
          Number(
            supabaseUser.withdrawable_returns ||
              0
          );

        setWithdrawableReturns(
          centralWithdrawable
        );

        localStorage.setItem(
          `transportWithdrawableReturns_${phone}`,
          String(
            centralWithdrawable
          )
        );

        const updatedLocalUser =
          {
            ...savedUser,

            balance: Number(
              supabaseUser.balance ||
                savedUser.balance ||
                0
            ),

            withdrawableReturns:
              centralWithdrawable,

            referralBonus:
              Number(
                supabaseUser.referral_bonus ||
                  savedUser.referralBonus ||
                  0
              ),

            totalReferralBonus:
              Number(
                supabaseUser.total_referral_bonus ||
                  savedUser.totalReferralBonus ||
                  0
              ),
          };

        saveJSON(
          "transportUser",
          updatedLocalUser
        );

        setUser(
          updatedLocalUser
        );
      } else {
        const savedWithdrawable =
          localStorage.getItem(
            `transportWithdrawableReturns_${phone}`
          );

        if (
          savedWithdrawable !==
          null
        ) {
          setWithdrawableReturns(
            Number(
              savedWithdrawable
            ) || 0
          );
        } else {
          const earnedFromPlans =
            normalizedPlans.reduce(
              (total, plan) =>
                total +
                Number(
                  plan.earnedReturns ||
                    plan.totalEarned ||
                    0
                ),
              0
            );

          setWithdrawableReturns(
            earnedFromPlans
          );
        }
      }

      setLoading(false);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalInvestment =
    useMemo(() => {
      return activePlans.reduce(
        (total, plan) =>
          total +
          Number(
            plan.price ||
              plan.amount ||
              0
          ),
        0
      );
    }, [activePlans]);

  const totalWeeklyReturn =
    useMemo(() => {
      return activePlans.reduce(
        (total, plan) =>
          total +
          Number(
            plan.weekly ||
              plan.weeklyReturn ||
              plan.daily ||
              plan.dailyReturn ||
              0
          ),
        0
      );
    }, [activePlans]);

  const totalEarned =
    useMemo(() => {
      return activePlans.reduce(
        (total, plan) =>
          total +
          Number(
            plan.earnedReturns ||
              plan.totalEarned ||
              0
          ),
        0
      );
    }, [activePlans]);

  const totalExpectedReturn =
    useMemo(() => {
      return activePlans.reduce(
        (total, plan) => {
          const weekly =
            Number(
              plan.weekly ||
                plan.weeklyReturn ||
                plan.daily ||
                plan.dailyReturn ||
                0
            );

          const durationWeeks =
            Number(
              plan.durationWeeks ||
                260
            );

          const totalReturn =
            Number(
              plan.totalReturn ||
                0
            ) ||
            weekly *
              durationWeeks;

          return (
            total +
            totalReturn
          );
        },
        0
      );
    }, [activePlans]);

  const getWeeklyAmount =
    (plan) => {
      return Number(
        plan.weekly ||
          plan.weeklyReturn ||
          plan.daily ||
          plan.dailyReturn ||
          0
      );
    };

  const getDurationWeeks =
    (plan) => {
      return Number(
        plan.durationWeeks ||
          260
      );
    };

  const getDurationYears =
    (plan) => {
      return Number(
        plan.durationYears ||
          5
      );
    };

  const getNextReturnTime =
    (plan) => {
      /*
        Supabase fields:
        next_return_at
        last_return_at

        Normalized frontend fields:
        nextReturnAt
        lastReturnAt
      */

      if (
        plan.nextReturnAt
      ) {
        const nextTime =
          new Date(
            plan.nextReturnAt
          ).getTime();

        if (
          !Number.isNaN(
            nextTime
          )
        ) {
          return nextTime;
        }
      }

      const lastReturnAt =
        plan.lastReturnAt ||
        plan.activatedAt ||
        plan.approvedAt;

      if (
        !lastReturnAt
      ) {
        return null;
      }

      const lastTime =
        new Date(
          lastReturnAt
        ).getTime();

      if (
        Number.isNaN(
          lastTime
        )
      ) {
        return null;
      }

      return (
        lastTime +
        7 *
          24 *
          60 *
          60 *
          1000
      );
    };

  const canClaim =
    (plan) => {
      const nextTime =
        getNextReturnTime(
          plan
        );

      if (
        !nextTime
      ) {
        return false;
      }

      return (
        Date.now() >=
        nextTime
      );
    };

  const getTimeRemaining =
    (plan) => {
      const nextTime =
        getNextReturnTime(
          plan
        );

      if (
        !nextTime
      ) {
        return "Waiting";
      }

      const difference =
        nextTime -
        Date.now();

      if (
        difference <= 0
      ) {
        return "Return Available";
      }

      const totalMinutes =
        Math.ceil(
          difference /
            (1000 * 60)
        );

      const days =
        Math.floor(
          totalMinutes /
            (60 * 24)
        );

      const remainingAfterDays =
        totalMinutes -
        days *
          24 *
          60;

      const hours =
        Math.floor(
          remainingAfterDays /
            60
        );

      const minutes =
        remainingAfterDays %
        60;

      if (
        days > 0
      ) {
        return `${days}d ${hours}h ${minutes}m remaining`;
      }

      if (
        hours > 0
      ) {
        return `${hours}h ${minutes}m remaining`;
      }

      return `${minutes}m remaining`;
    };

  const claimReturn =
    async (
      planId,
      index
    ) => {
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
        setMessageType(
          "error"
        );
        return;
      }

      if (
        !planId
      ) {
        setMessage(
          "Active plan ID is missing."
        );
        setMessageType(
          "error"
        );
        return;
      }

      setClaimingId(
        planId
      );

      setMessage("");

      try {
        /* =======================================================
           GET THE LATEST PLAN DIRECTLY FROM SUPABASE
        ======================================================= */

        const {
          data: dbPlan,
          error: dbPlanError,
        } = await supabase
          .from(
            "active_plans"
          )
          .select("*")
          .eq(
            "id",
            planId
          )
          .maybeSingle();

        if (
          dbPlanError
        ) {
          console.log(
            "Plan load before claim error:",
            dbPlanError
          );

          setMessage(
            "Could not load this active plan. Please try again."
          );
          setMessageType(
            "error"
          );
          return;
        }

        if (
          !dbPlan
        ) {
          setMessage(
            "This active plan could not be found in the system."
          );
          setMessageType(
            "error"
          );
          return;
        }

        const latestPlan =
          normalizeActivePlan(
            dbPlan
          );

        const weeklyAmount =
          getWeeklyAmount(
            latestPlan
          );

        const durationWeeks =
          getDurationWeeks(
            latestPlan
          );

        const returnsPaid =
          Number(
            latestPlan.returnsPaid ||
              0
          );

        /* =======================================================
           VERIFY PLAN BELONGS TO THIS USER
        ======================================================= */

        const planPhone =
          normalizePhone(
            dbPlan.user_phone
          );

        const userPhone =
          normalizePhone(
            phone
          );

        if (
          planPhone !==
          userPhone
        ) {
          setMessage(
            "This active plan does not belong to the logged-in account."
          );
          setMessageType(
            "error"
          );
          return;
        }

        /* =======================================================
           CHECK 7-DAY CYCLE
        ======================================================= */

        if (
          !canClaim(
            latestPlan
          )
        ) {
          setMessage(
            "Weekly return is not available yet. Please wait until 7 days are completed."
          );
          setMessageType(
            "error"
          );
          return;
        }

        /* =======================================================
           CHECK PLAN COMPLETION
        ======================================================= */

        if (
          returnsPaid >=
          durationWeeks
        ) {
          setMessage(
            "This transport plan has completed all weekly returns."
          );
          setMessageType(
            "error"
          );
          return;
        }

        if (
          weeklyAmount <=
          0
        ) {
          setMessage(
            "Weekly return amount is not available for this plan."
          );
          setMessageType(
            "error"
          );
          return;
        }

        /* =======================================================
           CALCULATE NEW PLAN VALUES
        ======================================================= */

        const newReturnsPaid =
          returnsPaid +
          1;

        const newEarnedReturns =
          Number(
            latestPlan.earnedReturns ||
              0
          ) +
          weeklyAmount;

        const now =
          new Date().toISOString();

        const nextReturnAt =
          new Date(
            Date.now() +
              7 *
                24 *
                60 *
                60 *
                1000
          ).toISOString();

        /* =======================================================
           UPDATE ACTIVE PLAN IN SUPABASE
        ======================================================= */

        const {
          data: updatedDbPlan,
          error: updatePlanError,
        } = await supabase
          .from(
            "active_plans"
          )
          .update({
            returns_paid:
              newReturnsPaid,

            earned_returns:
              newEarnedReturns,

            total_earned:
              newEarnedReturns,

            last_return_at:
              now,

            next_return_at:
              nextReturnAt,

            remaining_weeks:
              Math.max(
                0,
                durationWeeks -
                  newReturnsPaid
              ),

            updated_at:
              now,
          })
          .eq(
            "id",
            planId
          )
          .select("*")
          .maybeSingle();

        if (
          updatePlanError
        ) {
          console.log(
            "Active plan update error:",
            updatePlanError
          );

          setMessage(
            "Weekly return could not be saved. Please try again."
          );
          setMessageType(
            "error"
          );
          return;
        }

        if (
          !updatedDbPlan
        ) {
          setMessage(
            "The weekly return update was not confirmed by the system."
          );
          setMessageType(
            "error"
          );
          return;
        }

        /* =======================================================
           GET CURRENT USER WITHDRAWABLE BALANCE
        ======================================================= */

        const {
          data: currentUser,
          error: currentUserError,
        } = await supabase
          .from(
            "users"
          )
          .select(
            "id, phone, balance, withdrawable_returns"
          )
          .eq(
            "phone",
            phone
          )
          .maybeSingle();

        if (
          currentUserError
        ) {
          console.log(
            "Current user load error:",
            currentUserError
          );

          setMessage(
            "Plan was updated, but the withdrawable balance could not be loaded."
          );
          setMessageType(
            "error"
          );
          return;
        }

        if (
          !currentUser
        ) {
          setMessage(
            "Your user account could not be found."
          );
          setMessageType(
            "error"
          );
          return;
        }

        const currentWithdrawable =
          Number(
            currentUser.withdrawable_returns ||
              0
          );

        const newWithdrawable =
          currentWithdrawable +
          weeklyAmount;

        /* =======================================================
           UPDATE WITHDRAWABLE RETURNS IN SUPABASE
        ======================================================= */

        const {
          data: updatedUser,
          error: updateUserError,
        } = await supabase
          .from(
            "users"
          )
          .update({
            withdrawable_returns:
              newWithdrawable,
          })
          .eq(
            "id",
            currentUser.id
          )
          .select(
            "id, phone, balance, withdrawable_returns, referral_bonus, total_referral_bonus, full_name"
          )
          .maybeSingle();

        if (
          updateUserError
        ) {
          console.log(
            "Withdrawable balance update error:",
            updateUserError
          );

          setMessage(
            "The plan return was updated, but the withdrawable balance could not be saved."
          );
          setMessageType(
            "error"
          );
          return;
        }

        /* =======================================================
           UPDATE LOCAL STORAGE
        ======================================================= */

        const updatedFrontendPlan =
          normalizeActivePlan(
            updatedDbPlan
          );

        let localPlans =
          readJSON(
            `transportActivePlans_${phone}`,
            []
          );

        if (
          !Array.isArray(
            localPlans
          )
        ) {
          localPlans = [];
        }

        const localIndex =
          localPlans.findIndex(
            (item) =>
              String(
                item.id || ""
              ) ===
              String(
                planId
              )
          );

        if (
          localIndex !==
          -1
        ) {
          localPlans[
            localIndex
          ] = {
            ...localPlans[
              localIndex
            ],

            ...updatedFrontendPlan,
          };
        } else {
          localPlans.push(
            updatedFrontendPlan
          );
        }

        saveJSON(
          `transportActivePlans_${phone}`,
          localPlans
        );

        if (
          localPlans.length ===
          1
        ) {
          saveJSON(
            "transportActivePlan",
            localPlans[0]
          );
        }

        localStorage.setItem(
          `transportWithdrawableReturns_${phone}`,
          String(
            Number(
              updatedUser?.withdrawable_returns ??
                newWithdrawable
            )
          )
        );

        const updatedLocalUser =
          {
            ...user,

            balance: Number(
              updatedUser?.balance ??
                user.balance ??
                0
            ),

            withdrawableReturns:
              Number(
                updatedUser?.withdrawable_returns ??
                  newWithdrawable
              ),

            referralBonus:
              Number(
                updatedUser?.referral_bonus ??
                  user.referralBonus ??
                  0
              ),

            totalReferralBonus:
              Number(
                updatedUser?.total_referral_bonus ??
                  user.totalReferralBonus ??
                  0
              ),
          };

        saveJSON(
          "transportUser",
          updatedLocalUser
        );

        setUser(
          updatedLocalUser
        );

        /* =======================================================
           SAVE TRANSACTION LOCALLY
        ======================================================= */

        const transactionKey =
          `transportTransactions_${phone}`;

        const storedTransactions =
          readJSON(
            transactionKey,
            []
          );

        const transactionList =
          Array.isArray(
            storedTransactions
          )
            ? storedTransactions
            : [];

        const alreadySaved =
          transactionList.some(
            (item) =>
              item.id ===
              `weekly-return-${planId}-${newReturnsPaid}`
          );

        if (
          !alreadySaved
        ) {
          const newTransaction =
            {
              id:
                `weekly-return-${planId}-${newReturnsPaid}`,

              type:
                "Return",

              returnType:
                "Weekly",

              amount:
                weeklyAmount,

              status:
                "Completed",

              planName:
                updatedFrontendPlan.name,

              description:
                `Weekly return from ${updatedFrontendPlan.name}`,

              date:
                now,

              createdAt:
                now,
            };

          transactionList.unshift(
            newTransaction
          );

          saveJSON(
            transactionKey,
            transactionList
          );
        }

        /* =======================================================
           UPDATE SCREEN
        ======================================================= */

        const nextPlans =
          activePlans.map(
            (item) =>
              String(
                item.id || ""
              ) ===
              String(
                planId
              )
                ? updatedFrontendPlan
                : item
          );

        setActivePlans(
          nextPlans
        );

        setWithdrawableReturns(
          Number(
            updatedUser?.withdrawable_returns ??
              newWithdrawable
          )
        );

        setMessage(
          `PKR ${formatMoney(
            weeklyAmount
          )} weekly return has been added to your withdrawable balance.`
        );

        setMessageType(
          "success"
        );
      } catch (error) {
        console.log(
          "Weekly return claim error:",
          error
        );

        setMessage(
          "Something went wrong while claiming the weekly return."
        );
        setMessageType(
          "error"
        );
      } finally {
        setTimeout(() => {
          setClaimingId(
            null
          );
        }, 500);
      }
    };

  const displayName =
    user?.fullName ||
    user?.name ||
    user?.username ||
    user?.phone ||
    "User";

  if (loading) {
    return (
      <div
        style={
          styles.loadingPage
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
            ⏳
          </div>

          <h2
            style={
              styles.loadingTitle
            }
          >
            Loading Weekly Returns
          </h2>

          <p
            style={
              styles.loadingText
            }
          >
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={
        styles.page
      }
    >
      <div
        style={
          styles.container
        }
      >

        {/* HEADER */}

        <header
          style={
            styles.header
          }
        >
          <div
            style={
              styles.headerLeft
            }
          >
            <div
              style={
                styles.headerIcon
              }
            >
              📈
            </div>

            <div>
              <h1
                style={
                  styles.title
                }
              >
                Weekly Returns
              </h1>

              <p
                style={
                  styles.subtitle
                }
              >
                Welcome, {displayName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              window.location.href =
                "/";
            }}
            style={
              styles.dashboardButton
            }
          >
            ← Dashboard
          </button>
        </header>

        <main
          style={
            styles.content
          }
        >

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
                {messageType ===
                "error"
                  ? "⚠️"
                  : "✅"}
              </span>

              <span>
                {message}
              </span>

              <button
                onClick={() =>
                  setMessage("")
                }
                style={
                  styles.closeMessage
                }
              >
                ×
              </button>
            </div>
          )}

          {/* WALLET */}

          <div
            style={
              styles.walletCard
            }
          >
            <div>
              <p
                style={
                  styles.walletLabel
                }
              >
                Withdrawable Returns
              </p>

              <h2
                style={
                  styles.walletAmount
                }
              >
                PKR{" "}
                {formatMoney(
                  withdrawableReturns
                )}
              </h2>

              <p
                style={
                  styles.walletText
                }
              >
                Available balance from completed weekly returns
              </p>
            </div>

            <div
              style={
                styles.walletIcon
              }
            >
              💰
            </div>
          </div>

          {/* SUMMARY */}

          <div className="statsGrid">

            <div
              style={
                styles.statCard
              }
            >
              <div
                style={
                  styles.statIcon
                }
              >
                🚛
              </div>

              <div
                style={
                  styles.statContent
                }
              >
                <p
                  style={
                    styles.statLabel
                  }
                >
                  Active Plans
                </p>

                <h3
                  style={
                    styles.statValue
                  }
                >
                  {activePlans.length}
                </h3>
              </div>
            </div>

            <div
              style={
                styles.statCard
              }
            >
              <div
                style={
                  styles.statIcon
                }
              >
                💵
              </div>

              <div
                style={
                  styles.statContent
                }
              >
                <p
                  style={
                    styles.statLabel
                  }
                >
                  Total Investment
                </p>

                <h3
                  style={
                    styles.statValue
                  }
                >
                  PKR{" "}
                  {formatMoney(
                    totalInvestment
                  )}
                </h3>
              </div>
            </div>

            <div
              style={
                styles.statCard
              }
            >
              <div
                style={
                  styles.statIcon
                }
              >
                📅
              </div>

              <div
                style={
                  styles.statContent
                }
              >
                <p
                  style={
                    styles.statLabel
                  }
                >
                  Weekly Return
                </p>

                <h3
                  style={
                    styles.greenValue
                  }
                >
                  PKR{" "}
                  {formatMoney(
                    totalWeeklyReturn
                  )}
                </h3>
              </div>
            </div>

            <div
              style={
                styles.statCard
              }
            >
              <div
                style={
                  styles.statIcon
                }
              >
                💎
              </div>

              <div
                style={
                  styles.statContent
                }
              >
                <p
                  style={
                    styles.statLabel
                  }
                >
                  Total Earned
                </p>

                <h3
                  style={
                    styles.greenValue
                  }
                >
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
            <div
              style={
                styles.emptyCard
              }
            >
              <div
                style={
                  styles.emptyIcon
                }
              >
                🚛
              </div>

              <h2
                style={
                  styles.emptyTitle
                }
              >
                No Active Transport Plan
              </h2>

              <p
                style={
                  styles.emptyText
                }
              >
                You do not have an approved
                transport plan yet. Select a
                plan and submit your deposit
                to get started.
              </p>

              <button
                onClick={() => {
                  window.location.href =
                    "/transport-plans";
                }}
                style={
                  styles.primaryButton
                }
              >
                View Transport Plans
              </button>
            </div>
          )}

          {/* ACTIVE PLANS */}

          {activePlans.length > 0 && (
            <div>

              <div
                style={
                  styles.sectionHeader
                }
              >
                <div>
                  <h2
                    style={
                      styles.sectionTitle
                    }
                  >
                    Active Transport Plans
                  </h2>

                  <p
                    style={
                      styles.sectionText
                    }
                  >
                    Your first weekly return is
                    credited upon plan approval.
                    The next return becomes available
                    after each completed 7-day cycle.
                  </p>
                </div>

                <div
                  style={
                    styles.expectedBadge
                  }
                >
                  Expected: PKR{" "}
                  {formatMoney(
                    totalExpectedReturn
                  )}
                </div>
              </div>

              <div
                style={
                  styles.plansGrid
                }
              >

                {activePlans.map(
                  (plan, index) => {

                    const weeklyAmount =
                      getWeeklyAmount(
                        plan
                      );

                    const durationWeeks =
                      getDurationWeeks(
                        plan
                      );

                    const durationYears =
                      getDurationYears(
                        plan
                      );

                    const returnsPaid =
                      Number(
                        plan.returnsPaid ||
                        0
                      );

                    const earned =
                      Number(
                        plan.earnedReturns ||
                        plan.totalEarned ||
                        0
                      );

                    const completed =
                      returnsPaid >=
                      durationWeeks;

                    const available =
                      canClaim(
                        plan
                      );

                    const planId =
                      plan.id ||
                      `plan-${index}`;

                    return (
                      <div
                        key={
                          planId
                        }
                        style={
                          styles.planCard
                        }
                      >

                        <div
                          style={
                            styles.planTop
                          }
                        >
                          <div>

                            <span
                              style={
                                styles.planTag
                              }
                            >
                              ACTIVE PLAN
                            </span>

                            <h3
                              style={
                                styles.planName
                              }
                            >
                              {getPlanName(
                                plan
                              )}
                            </h3>

                          </div>

                          <div
                            style={
                              styles.planEmoji
                            }
                          >
                            🚛
                          </div>
                        </div>

                        <div
                          style={
                            styles.planGrid
                          }
                        >

                          <div
                            style={
                              styles.planInfo
                            }
                          >
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

                          <div
                            style={
                              styles.planInfo
                            }
                          >
                            <span>
                              Weekly Return
                            </span>

                            <strong
                              style={
                                styles.greenText
                              }
                            >
                              PKR{" "}
                              {formatMoney(
                                weeklyAmount
                              )}
                            </strong>
                          </div>

                          <div
                            style={
                              styles.planInfo
                            }
                          >
                            <span>
                              Duration
                            </span>

                            <strong>
                              {durationYears} Years
                            </strong>
                          </div>

                          <div
                            style={
                              styles.planInfo
                            }
                          >
                            <span>
                              Returns Paid
                            </span>

                            <strong>
                              {returnsPaid} /{" "}
                              {durationWeeks}
                            </strong>
                          </div>

                        </div>

                        <div
                          style={
                            styles.progressArea
                          }
                        >
                          <div
                            style={
                              styles.progressHeader
                            }
                          >
                            <span>
                              Plan Progress
                            </span>

                            <strong>
                              {Math.min(
                                100,
                                Math.round(
                                  (returnsPaid /
                                    durationWeeks) *
                                    100
                                )
                              )}%
                            </strong>
                          </div>

                          <div
                            style={
                              styles.progressTrack
                            }
                          >
                            <div
                              style={{
                                ...styles.progressBar,
                                width: `${Math.min(
                                  100,
                                  (returnsPaid /
                                    durationWeeks) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={
                            styles.earnedBox
                          }
                        >
                          <div>
                            <span
                              style={
                                styles.earnedLabel
                              }
                            >
                              Earned From This Plan
                            </span>

                            <strong
                              style={
                                styles.earnedAmount
                              }
                            >
                              PKR{" "}
                              {formatMoney(
                                earned
                              )}
                            </strong>
                          </div>

                          <div
                            style={
                              styles.clock
                            }
                          >
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
                                  weeklyAmount
                                )} Weekly Return`
                              : `⏳ ${getTimeRemaining(
                                  plan
                                )}`}
                          </button>
                        )}

                        {completed && (
                          <div
                            style={
                              styles.completedBox
                            }
                          >
                            🎉 This plan has completed
                            all {durationWeeks} weekly
                            returns.
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

          <div
            style={
              styles.simpleInfoSection
            }
          >

            <div
              style={
                styles.simpleInfoLine
              }
            >
              <span
                style={
                  styles.infoNumber
                }
              >
                1
              </span>

              <div
                style={
                  styles.simpleInfoContent
                }
              >
                <strong
                  style={
                    styles.simpleInfoTitle
                  }
                >
                  Plan Approval
                </strong>

                <p
                  style={
                    styles.simpleInfoText
                  }
                >
                  Your deposit must be approved
                  by the admin. The first weekly
                  return is credited immediately
                  after approval.
                </p>
              </div>
            </div>

            <div
              style={
                styles.simpleInfoLine
              }
            >
              <span
                style={
                  styles.infoNumber
                }
              >
                2
              </span>

              <div
                style={
                  styles.simpleInfoContent
                }
              >
                <strong
                  style={
                    styles.simpleInfoTitle
                  }
                >
                  7-Day Cycle
                </strong>

                <p
                  style={
                    styles.simpleInfoText
                  }
                >
                  After the first return, a new
                  weekly return becomes available
                  after each completed 7-day cycle.
                </p>
              </div>
            </div>

            <div
              style={
                styles.simpleInfoLine
              }
            >
              <span
                style={
                  styles.infoNumber
                }
              >
                3
              </span>

              <div
                style={
                  styles.simpleInfoContent
                }
              >
                <strong
                  style={
                    styles.simpleInfoTitle
                  }
                >
                  Claim Weekly Return
                </strong>

                <p
                  style={
                    styles.simpleInfoText
                  }
                >
                  Click the claim button when your
                  weekly return becomes available.
                </p>
              </div>
            </div>

            <div
              style={
                styles.simpleInfoLine
              }
            >
              <span
                style={
                  styles.infoNumber
                }
              >
                4
              </span>

              <div
                style={
                  styles.simpleInfoContent
                }
              >
                <strong
                  style={
                    styles.simpleInfoTitle
                  }
                >
                  Withdrawable Balance
                </strong>

                <p
                  style={
                    styles.simpleInfoText
                  }
                >
                  Claimed returns are added to your
                  withdrawable returns balance.
                </p>
              </div>
            </div>

          </div>

          {/* BUTTONS */}

          <div
            style={
              styles.buttons
            }
          >

            <button
              onClick={() => {
                window.location.href =
                  "/withdraw";
              }}
              style={
                styles.primaryButton
              }
            >
              💸 Withdraw Returns
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/transport-plans";
              }}
              style={
                styles.secondaryButton
              }
            >
              🚛 View Transport Plans
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/";
              }}
              style={
                styles.secondaryButton
              }
            >
              ← Back to Dashboard
            </button>

          </div>

        </main>
      </div>

      {/* MOBILE RESPONSIVE FIX */}

      <style jsx>{`
        .statsGrid {
          display: grid;
          grid-template-columns: repeat(
            4,
            minmax(0, 1fr)
          );
          gap: 16px;
          margin-bottom: 28px;
        }

        .statsGrid > * {
          min-width: 0;
        }

        .statContent {
          min-width: 0;
          flex: 1;
        }

        @media (max-width: 900px) {
          .statsGrid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
          }
        }

        @media (max-width: 600px) {
          .statsGrid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .statsGrid > * {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef3f7",
    color: "#ffffff",
    fontFamily:
      "Arial, sans-serif",
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
    fontFamily:
      "Arial, sans-serif",
  },

  loadingCard: {
    background: "#102A43",
    borderRadius: "18px",
    padding: "35px",
    textAlign: "center",
    boxShadow:
      "0 10px 30px rgba(16,42,67,0.18)",
    border:
      "1px solid #1E3A56",
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
    margin:
      "8px 0 0",
    color: "#9FB3C8",
  },

  header: {
    background:
      "linear-gradient(135deg, #102A43 0%, #173B5A 100%)",
    padding:
      "24px 30px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "20px",
    borderBottom:
      "1px solid #1E3A56",
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
    margin:
      "5px 0 0",
    color: "#C9D8E6",
    fontSize: "14px",
  },

  dashboardButton: {
    border:
      "1px solid #45627C",
    background: "#173B5A",
    color: "#ffffff",
    padding:
      "11px 17px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "700",
  },

  content: {
    padding:
      "28px 20px",
  },

  successMessage: {
    background: "#173B5A",
    border:
      "1px solid #3E8E5B",
    color: "#ffffff",
    borderRadius: "12px",
    padding:
      "14px 16px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
  },

  errorMessage: {
    background: "#573533",
    border:
      "1px solid #A65B52",
    color: "#ffffff",
    borderRadius: "12px",
    padding:
      "14px 16px",
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
    justifyContent:
      "space-between",
    gap: "20px",
    border:
      "1px solid #1E3A56",
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
    margin:
      "7px 0",
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
    border:
      "1px solid #1E3A56",
    boxShadow:
      "0 5px 16px rgba(16,42,67,0.13)",
    boxSizing: "border-box",
    minWidth: 0,
    width: "100%",
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

  statContent: {
    minWidth: 0,
    flex: 1,
  },

  statLabel: {
    margin: 0,
    color: "#9FB3C8",
    fontSize: "12px",
  },

  statValue: {
    margin:
      "5px 0 0",
    color: "#ffffff",
    fontSize: "17px",
    whiteSpace:
      "nowrap",
  },

  greenValue: {
    margin:
      "5px 0 0",
    color: "#8FD694",
    fontSize: "17px",
    whiteSpace:
      "nowrap",
  },

  emptyCard: {
    background: "#102A43",
    borderRadius: "20px",
    padding:
      "45px 25px",
    textAlign: "center",
    border:
      "1px solid #1E3A56",
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
    margin:
      "10px auto 20px",
    color: "#9FB3C8",
    lineHeight: 1.6,
    fontSize: "14px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "20px",
    marginBottom: "17px",
  },

  sectionTitle: {
    margin: 0,
    color: "#102A43",
    fontSize: "22px",
  },

  sectionText: {
    margin:
      "5px 0 0",
    color: "#60758A",
    fontSize: "13px",
  },

  expectedBadge: {
    background: "#102A43",
    color: "#8FD694",
    padding:
      "10px 14px",
    borderRadius: "9px",
    border:
      "1px solid #1E3A56",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace:
      "nowrap",
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
    border:
      "1px solid #1E3A56",
    boxShadow:
      "0 7px 22px rgba(16,42,67,0.15)",
  },

  planTop: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "15px",
    marginBottom: "20px",
  },

  planTag: {
    display: "inline-block",
    background: "#173B5A",
    color: "#8FD694",
    padding:
      "5px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing:
      "0.5px",
  },

  planName: {
    margin:
      "8px 0 0",
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

  greenText: {
    color: "#8FD694",
  },

  progressArea: {
    marginBottom: "18px",
  },

  progressHeader: {
    display: "flex",
    justifyContent:
      "space-between",
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
    transition:
      "width 0.3s ease",
  },

  earnedBox: {
    background: "#173B5A",
    borderRadius: "11px",
    padding: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
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
    padding:
      "13px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "13px",
  },

  disabledButton: {
    width: "100%",
    border:
      "1px solid #45627C",
    background: "#173B5A",
    color: "#9FB3C8",
    padding:
      "13px 16px",
    borderRadius: "9px",
    cursor: "not-allowed",
    fontWeight: "700",
    fontSize: "13px",
  },

  completedBox: {
    background: "#173B5A",
    border:
      "1px solid #3E8E5B",
    color: "#8FD694",
    padding: "13px",
    borderRadius: "9px",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "700",
  },

  simpleInfoSection: {
    marginBottom: "25px",
    background:
      "transparent",
  },

  simpleInfoLine: {
    display: "flex",
    alignItems:
      "flex-start",
    gap: "12px",
    padding:
      "12px 0",
    borderBottom:
      "1px solid #d8e1e8",
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
    justifyContent:
      "center",
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
    margin:
      "3px 0 0",
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
    padding:
      "13px 19px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "13px",
  },

  secondaryButton: {
    border:
      "1px solid #1E3A56",
    background: "#102A43",
    color: "#ffffff",
    padding:
      "13px 19px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
};