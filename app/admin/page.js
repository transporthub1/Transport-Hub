"use client";

import { useEffect, useMemo, useState } from "react";

const NAVY = "#102A43";
const NAVY_2 = "#173B5A";
const BORDER = "#29435A";
const LIGHT = "#C9D8E6";
const MUTED = "#9FB3C8";
const GREEN = "#8FD694";
const RED = "#FF9F96";
const GOLD = "#F4D77A";
const PAGE_BG = "#eef3f7";

const DURATION_YEARS = 5;
const DURATION_WEEKS = 260;

/* =========================
   REFERRAL BONUS LEVELS
========================= */

const REFERRAL_LEVELS = [
  { level: 1, percent: 10 },
  { level: 2, percent: 5 },
  { level: 3, percent: 3 },
  { level: 4, percent: 2 },
  { level: 5, percent: 1 },
  { level: 6, percent: 0.5 },
];

export default function Admin() {
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem(
      "transportAdminLoggedIn"
    );

    if (loggedIn !== "true") {
      window.location.href = "/admin/login";
      return;
    }

    loadAllData();
  }, []);

  const loadAllData = () => {
    loadUsers();
    loadDepositRequests();
    loadWithdrawRequests();
    setLoading(false);
  };

  /* =========================
     LOAD USERS
  ========================= */

  const loadUsers = () => {
    const savedUsers = localStorage.getItem(
      "transportUsers"
    );

    if (!savedUsers) {
      setUsers([]);
      return;
    }

    try {
      const parsed = JSON.parse(savedUsers);

      if (Array.isArray(parsed)) {
        setUsers(parsed);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.log("Could not load users");
      setUsers([]);
    }
  };

  /* =========================
     LOAD DEPOSITS
  ========================= */

  const loadDepositRequests = () => {
    let requests = [];

    const savedRequests = localStorage.getItem(
      "transportDepositRequests"
    );

    if (savedRequests) {
      try {
        const parsed = JSON.parse(savedRequests);

        if (Array.isArray(parsed)) {
          requests = parsed;
        }
      } catch (error) {
        console.log("Could not load deposit requests");
      }
    }

    if (requests.length === 0) {
      const oldRequest = localStorage.getItem(
        "transportDepositRequest"
      );

      if (oldRequest) {
        try {
          const parsed = JSON.parse(oldRequest);

          if (parsed) {
            const migrated = {
              ...parsed,
              id:
                parsed.id ||
                "deposit-" + Date.now(),
            };

            requests = [migrated];

            localStorage.setItem(
              "transportDepositRequests",
              JSON.stringify(requests)
            );
          }
        } catch (error) {
          console.log(
            "Could not migrate old deposit request"
          );
        }
      }
    }

    setDepositRequests(requests);
  };

  /* =========================
     LOAD WITHDRAWALS
  ========================= */

  const loadWithdrawRequests = () => {
    let requests = [];

    const savedRequests = localStorage.getItem(
      "transportWithdrawRequests"
    );

    if (savedRequests) {
      try {
        const parsed = JSON.parse(savedRequests);

        if (Array.isArray(parsed)) {
          requests = parsed;
        }
      } catch (error) {
        console.log(
          "Could not load withdrawal requests"
        );
      }
    }

    if (requests.length === 0) {
      const oldRequest = localStorage.getItem(
        "transportWithdrawRequest"
      );

      if (oldRequest) {
        try {
          const parsed = JSON.parse(oldRequest);

          if (parsed) {
            requests = [
              {
                ...parsed,
                id:
                  parsed.id ||
                  "withdraw-" + Date.now(),
              },
            ];

            localStorage.setItem(
              "transportWithdrawRequests",
              JSON.stringify(requests)
            );
          }
        } catch (error) {
          console.log(
            "Could not migrate old withdrawal request"
          );
        }
      }
    }

    setWithdrawRequests(requests);
  };

  /* =========================
     SAVE TRANSACTION
  ========================= */

  const saveTransaction = (
    transaction,
    phone
  ) => {
    if (!phone) {
      return;
    }

    const transactionsKey =
      "transportTransactions_" + phone;

    let transactions = [];

    const savedTransactions =
      localStorage.getItem(transactionsKey);

    if (savedTransactions) {
      try {
        const parsed =
          JSON.parse(savedTransactions);

        if (Array.isArray(parsed)) {
          transactions = parsed;
        }
      } catch (error) {
        transactions = [];
      }
    }

    const alreadyExists = transactions.some(
      (item) => item.id === transaction.id
    );

    if (!alreadyExists) {
      transactions.unshift(transaction);

      localStorage.setItem(
        transactionsKey,
        JSON.stringify(transactions)
      );
    }
  };

  /* =========================
     SAVE DEPOSIT LIST
  ========================= */

  const saveDepositRequests = (requests) => {
    localStorage.setItem(
      "transportDepositRequests",
      JSON.stringify(requests)
    );

    setDepositRequests(requests);
  };

  /* =========================
     SAVE WITHDRAW LIST
  ========================= */

  const saveWithdrawRequests = (requests) => {
    localStorage.setItem(
      "transportWithdrawRequests",
      JSON.stringify(requests)
    );

    if (requests.length > 0) {
      localStorage.setItem(
        "transportWithdrawRequest",
        JSON.stringify(
          requests[requests.length - 1]
        )
      );
    }

    setWithdrawRequests(requests);
  };

  /* =========================
     ADD ACTIVE PLAN
  ========================= */

  const updateActivePlans = (
    newPlan,
    phone
  ) => {
    if (!phone) {
      return;
    }

    const plansKey =
      "transportActivePlans_" + phone;

    let plans = [];

    const savedPlans =
      localStorage.getItem(plansKey);

    if (savedPlans) {
      try {
        const parsed =
          JSON.parse(savedPlans);

        if (Array.isArray(parsed)) {
          plans = parsed;
        }
      } catch (error) {
        plans = [];
      }
    }

    const alreadyActive = plans.some(
      (plan) =>
        plan.depositRequestId ===
        newPlan.depositRequestId
    );

    if (!alreadyActive) {
      plans.push(newPlan);
    }

    localStorage.setItem(
      plansKey,
      JSON.stringify(plans)
    );
  };

  /* =========================
     PHONE NORMALIZER
  ========================= */

  const normalizePhone = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .trim();
  };

  /* =========================
     FIND USER BY PHONE
  ========================= */

  const findUserByPhone = (phone) => {
    const normalized =
      normalizePhone(phone);

    if (!normalized) {
      return null;
    }

    return (
      users.find((user) => {
        const userPhone =
          normalizePhone(
            user.phone ||
              user.mobile ||
              user.mobileNumber ||
              user.phoneNumber
          );

        return (
          userPhone === normalized
        );
      }) || null
    );
  };

  /* =========================
     GET USER PHONE
  ========================= */

  const getUserPhone = (user) => {
    if (!user) {
      return "";
    }

    return normalizePhone(
      user.phone ||
        user.mobile ||
        user.mobileNumber ||
        user.phoneNumber
    );
  };

  /* =========================
     GET REFERRER VALUE
  ========================= */

  const getReferrerValue = (user) => {
    if (!user) {
      return "";
    }

    return (
      user.referrerPhone ||
      user.referrerMobile ||
      user.referrerNumber ||
      user.parentPhone ||
      user.uplinePhone ||
      user.referredByPhone ||
      user.referredByMobile ||
      user.sponsorPhone ||
      user.sponsorMobile ||
      user.referrerCode ||
      user.referredBy ||
      user.referralBy ||
      user.parent ||
      user.upline ||
      user.sponsor ||
      user.referralCodeUsed ||
      user.usedReferralCode ||
      user.usedReferral ||
      user.joinedWithReferral ||
      user.referredByCode ||
      ""
    );
  };

  /* =========================
     FIND REFERRER
  ========================= */

  const findReferrer = (user) => {
    if (!user) {
      return null;
    }

    const referrerValue =
      getReferrerValue(user);

    if (!referrerValue) {
      return null;
    }

    const value = String(
      referrerValue
    ).trim();

    if (!value) {
      return null;
    }

    const byPhone =
      findUserByPhone(value);

    if (byPhone) {
      return byPhone;
    }

    const lowerValue =
      value.toLowerCase();

    const byCode =
      users.find((item) => {
        const code =
          item.referralCode ||
          item.referral ||
          item.referralId ||
          item.myReferralCode ||
          "";

        return (
          String(code)
            .trim()
            .toLowerCase() ===
          lowerValue
        );
      });

    return byCode || null;
  };

  /* =========================
     GET REFERRAL CHAIN
  ========================= */

  const getReferralChain = (
    startingUser
  ) => {
    const chain = [];
    const visited = {};

    let currentUser =
      startingUser;

    for (
      let level = 1;
      level <= REFERRAL_LEVELS.length;
      level++
    ) {
      if (!currentUser) {
        break;
      }

      const currentPhone =
        getUserPhone(currentUser);

      if (
        !currentPhone ||
        visited[currentPhone]
      ) {
        break;
      }

      visited[currentPhone] = true;

      const referrer =
        findReferrer(currentUser);

      if (!referrer) {
        break;
      }

      const referrerPhone =
        getUserPhone(referrer);

      if (
        !referrerPhone ||
        visited[referrerPhone]
      ) {
        break;
      }

      chain.push({
        level: level,
        user: referrer,
        phone: referrerPhone,
        percent:
          REFERRAL_LEVELS[
            level - 1
          ].percent,
      });

      currentUser = referrer;
    }

    return chain;
  };

  /* =========================
     UPDATE USER BALANCE
  ========================= */

  const updateUserBalance = (
    phone,
    bonusAmount
  ) => {
    const normalizedPhone =
      normalizePhone(phone);

    if (
      !normalizedPhone ||
      !bonusAmount ||
      bonusAmount <= 0
    ) {
      return null;
    }

    const savedUsers =
      localStorage.getItem(
        "transportUsers"
      );

    if (!savedUsers) {
      return null;
    }

    let allUsers = [];

    try {
      const parsed =
        JSON.parse(savedUsers);

      if (Array.isArray(parsed)) {
        allUsers = parsed;
      }
    } catch (error) {
      return null;
    }

    let updatedUser = null;

    const updatedUsers =
      allUsers.map((user) => {
        const userPhone =
          getUserPhone(user);

        if (
          userPhone !==
          normalizedPhone
        ) {
          return user;
        }

        const currentBalance =
          Number(
            user.balance || 0
          );

        const newBalance =
          currentBalance +
          bonusAmount;

        updatedUser = {
          ...user,
          balance:
            newBalance,
          referralBonus:
            Number(
              user.referralBonus ||
                0
            ) + bonusAmount,
          totalReferralBonus:
            Number(
              user.totalReferralBonus ||
                0
            ) + bonusAmount,
        };

        return updatedUser;
      });

    if (updatedUser) {
      localStorage.setItem(
        "transportUsers",
        JSON.stringify(
          updatedUsers
        )
      );

      const withdrawableKey =
        "transportWithdrawableReturns_" +
        normalizedPhone;

      const savedWithdrawable =
        localStorage.getItem(
          withdrawableKey
        );

      const currentWithdrawable =
        savedWithdrawable !== null
          ? Number(
              savedWithdrawable
            ) || 0
          : 0;

      const newWithdrawable =
        currentWithdrawable +
        bonusAmount;

      localStorage.setItem(
        withdrawableKey,
        String(
          newWithdrawable
        )
      );
    }

    return updatedUser;
  };

  /* =========================
     UPDATE TEAM MEMBER BONUS
  ========================= */

  const updateTeamMemberBonus = (
    referrerPhone,
    referredPhone,
    bonusAmount,
    level
  ) => {
    if (
      !referrerPhone ||
      !referredPhone ||
      !bonusAmount
    ) {
      return;
    }

    const teamKey =
      "transportTeam_" +
      referrerPhone;

    const savedTeam =
      localStorage.getItem(
        teamKey
      );

    if (!savedTeam) {
      return;
    }

    let team = [];

    try {
      const parsed =
        JSON.parse(savedTeam);

      if (Array.isArray(parsed)) {
        team = parsed;
      }
    } catch (error) {
      return;
    }

    let changed = false;

    const updatedTeam =
      team.map((member) => {
        const memberPhone =
          normalizePhone(
            member.phone ||
              member.mobile ||
              member.mobileNumber ||
              member.userPhone
          );

        const ownerPhone =
          normalizePhone(
            member.ownerPhone ||
              member.referrerPhone ||
              member.parentPhone ||
              member.uplinePhone
          );

        if (
          memberPhone ===
            normalizePhone(
              referredPhone
            ) &&
          (
            !ownerPhone ||
            ownerPhone ===
              normalizePhone(
                referrerPhone
              )
          )
        ) {
          changed = true;

          return {
            ...member,
            bonusEarned:
              Number(
                member.bonusEarned ||
                  member.bonus ||
                  0
              ) + bonusAmount,
            referralBonus:
              Number(
                member.referralBonus ||
                  0
              ) + bonusAmount,
            lastReferralBonus:
              bonusAmount,
            lastReferralBonusLevel:
              level,
          };
        }

        return member;
      });

    if (changed) {
      localStorage.setItem(
        teamKey,
        JSON.stringify(
          updatedTeam
        )
      );
    }
  };

  /* =========================
     CHECK DUPLICATE REFERRAL
  ========================= */

  const referralBonusAlreadyCredited = (
    request,
    referrerPhone
  ) => {
    if (!request || !referrerPhone) {
      return false;
    }

    const marker =
      "referral-bonus-" +
      request.id +
      "-L";

    const transactionsKey =
      "transportTransactions_" +
      referrerPhone;

    const saved =
      localStorage.getItem(
        transactionsKey
      );

    if (!saved) {
      return false;
    }

    try {
      const transactions =
        JSON.parse(saved);

      if (!Array.isArray(transactions)) {
        return false;
      }

      return transactions.some(
        (item) =>
          item.id &&
          String(item.id).indexOf(
            marker
          ) === 0
      );
    } catch (error) {
      return false;
    }
  };

  /* =========================
     CREDIT REFERRAL BONUSES
  ========================= */

  const creditReferralBonuses = (
    request,
    referredUser,
    depositAmount
  ) => {
    if (
      !request ||
      !referredUser ||
      !depositAmount ||
      depositAmount <= 0
    ) {
      return {
        credited: false,
        totalBonus: 0,
        details: [],
      };
    }

    const chain =
      getReferralChain(
        referredUser
      );

    if (chain.length === 0) {
      return {
        credited: false,
        totalBonus: 0,
        details: [],
      };
    }

    let totalBonus = 0;
    const details = [];

    chain.forEach((item) => {
      const referrerPhone =
        item.phone;

      const percent =
        Number(item.percent || 0);

      if (
        !referrerPhone ||
        percent <= 0
      ) {
        return;
      }

      const alreadyCredited =
        referralBonusAlreadyCredited(
          request,
          referrerPhone
        );

      if (alreadyCredited) {
        return;
      }

      const bonusAmount =
        Number(
          (
            depositAmount *
            percent /
            100
          ).toFixed(2)
        );

      if (
        !bonusAmount ||
        bonusAmount <= 0
      ) {
        return;
      }

      const referrerUser =
        updateUserBalance(
          referrerPhone,
          bonusAmount
        );

      if (!referrerUser) {
        return;
      }

      const transactionId =
        "referral-bonus-" +
        request.id +
        "-L" +
        item.level;

      saveTransaction(
        {
          id:
            transactionId,
          type:
            "Referral Bonus",
          amount:
            bonusAmount,
          depositAmount:
            depositAmount,
          percentage:
            percent,
          level:
            item.level,
          referredPhone:
            getUserPhone(
              referredUser
            ),
          referredName:
            referredUser.fullName ||
            referredUser.name ||
            referredUser.username ||
            "User",
          status:
            "Completed",
          phone:
            referrerPhone,
          transactionId:
            transactionId,
          number:
            referrerPhone,
          date:
            new Date().toLocaleString(),
        },
        referrerPhone
      );

      updateTeamMemberBonus(
        referrerPhone,
        getUserPhone(
          referredUser
        ),
        bonusAmount,
        item.level
      );

      totalBonus +=
        bonusAmount;

      details.push({
        level:
          item.level,
        percent:
          percent,
        amount:
          bonusAmount,
        phone:
          referrerPhone,
      });
    });

    return {
      credited:
        details.length > 0,
      totalBonus:
        totalBonus,
      details:
        details,
    };
  };

  /* =========================
     UPDATE DEPOSIT STATUS
  ========================= */

  const updateDepositStatus = (
    requestId,
    newStatus
  ) => {
    const request =
      depositRequests.find(
        (item) => item.id === requestId
      );

    if (!request) {
      setMessage(
        "Deposit request not found."
      );
      return;
    }

    if (
      newStatus === "Approved" &&
      request.status === "Approved"
    ) {
      setMessage(
        "This deposit has already been approved."
      );
      return;
    }

    if (
      newStatus === "Rejected" &&
      request.status === "Rejected"
    ) {
      setMessage(
        "This deposit has already been rejected."
      );
      return;
    }

    const phone =
      request.phone ||
      request.mobile ||
      request.mobileNumber ||
      request.user?.phone ||
      request.user?.mobile ||
      "";

    if (
      newStatus === "Approved" &&
      !phone
    ) {
      setMessage(
        "User mobile number is missing from this request."
      );
      return;
    }

    const requestPlan =
      request.plan || {};

    const planName =
      requestPlan.name ||
      request.planName ||
      "Transport Plan";

    const planAmount =
      Number(
        requestPlan.amount ||
        request.amount ||
        request.depositAmount ||
        0
      );

    const weeklyReturn =
      Number(
        requestPlan.weekly ||
        request.weeklyReturn ||
        request.dailyReturn ||
        requestPlan.daily ||
        request.daily ||
        0
      );

    const totalReturn =
      weeklyReturn *
      DURATION_WEEKS;

    const updatedRequest = {
      ...request,
      status:
        newStatus,
      updatedAt:
        new Date().toISOString(),
      plan: {
        ...requestPlan,
        id:
          requestPlan.id ||
          request.planId ||
          "",
        name:
          planName,
        amount:
          planAmount,
        weekly:
          weeklyReturn,
        daily:
          weeklyReturn,
        durationYears:
          DURATION_YEARS,
        durationWeeks:
          DURATION_WEEKS,
        duration:
          DURATION_WEEKS,
        totalReturn:
          totalReturn,
      },
      planName:
        planName,
      amount:
        planAmount,
      weeklyReturn:
        weeklyReturn,
      dailyReturn:
        weeklyReturn,
      durationYears:
        DURATION_YEARS,
      durationWeeks:
        DURATION_WEEKS,
      duration:
        DURATION_WEEKS,
      totalReturn:
        totalReturn,
    };

    const updatedRequests =
      depositRequests.map(
        (item) =>
          item.id === requestId
            ? updatedRequest
            : item
      );

    saveDepositRequests(
      updatedRequests
    );

    if (
      newStatus === "Rejected"
    ) {
      setMessage(
        planName +
          " deposit request rejected."
      );

      return;
    }

    const approvedAt =
      new Date().toISOString();

    const returnsKey =
      "transportWithdrawableReturns_" +
      phone;

    const savedReturns =
      localStorage.getItem(
        returnsKey
      );

    const currentWithdrawableReturns =
      savedReturns !== null
        ? Number(savedReturns) || 0
        : 0;

    const newWithdrawableReturns =
      currentWithdrawableReturns +
      weeklyReturn;

    localStorage.setItem(
      returnsKey,
      String(
        newWithdrawableReturns
      )
    );

    const nextReturnDate =
      new Date(
        Date.now() +
          7 *
            24 *
            60 *
            60 *
            1000
      ).toISOString();

    const activePlan = {
      id:
        "active-plan-" +
        request.id,

      depositRequestId:
        request.id,

      userPhone:
        phone,

      name:
        planName,

      price:
        planAmount,

      weekly:
        weeklyReturn,

      daily:
        weeklyReturn,

      durationYears:
        DURATION_YEARS,

      durationWeeks:
        DURATION_WEEKS,

      duration:
        DURATION_WEEKS,

      totalReturn:
        totalReturn,

      activatedAt:
        approvedAt,

      approvedAt:
        approvedAt,

      lastReturnAt:
        approvedAt,

      nextReturnAt:
        nextReturnDate,

      returnsPaid:
        1,

      earnedReturns:
        weeklyReturn,

      totalEarned:
        weeklyReturn,

      remainingWeeks:
        DURATION_WEEKS - 1,

      status:
        "Active",
    };

    updateActivePlans(
      activePlan,
      phone
    );

    saveTransaction(
      {
        id:
          "deposit-" +
          request.id,

        type:
          "Deposit",

        amount:
          planAmount,

        planName:
          planName,

        status:
          "Approved",

        phone:
          phone,

        transactionId:
          request.transactionId ||
          request.txId ||
          request.transectionId ||
          request.transactionID ||
          "",

        number:
          request.number ||
          request.depositNumber ||
          request.mobileNumber ||
          request.depositPhone ||
          phone ||
          "",

        screenshot:
          request.screenshot ||
          request.paymentScreenshot ||
          request.receipt ||
          "",

        date:
          request.submittedAt
            ? new Date(
                request.submittedAt
              ).toLocaleString()
            : new Date().toLocaleString(),
      },
      phone
    );

    if (weeklyReturn > 0) {
      saveTransaction(
        {
          id:
            "weekly-return-" +
            request.id,

          type:
            "Weekly Return",

          amount:
            weeklyReturn,

          planName:
            planName,

          status:
            "Completed",

          phone:
            phone,

          transactionId:
            "",

          number:
            phone,

          date:
            new Date().toLocaleString(),
        },
        phone
      );
    }

    let referralResult = {
      credited: false,
      totalBonus: 0,
      details: [],
    };

    const referredUser =
      findUserByPhone(phone);

    if (
      referredUser &&
      planAmount > 0
    ) {
      referralResult =
        creditReferralBonuses(
          request,
          referredUser,
          planAmount
        );
    }

    let referralMessage = "";

    if (
      referralResult.credited
    ) {
      referralMessage =
        " Referral bonus of PKR " +
        referralResult.totalBonus.toLocaleString() +
        " credited to eligible referrer(s).";
    } else {
      referralMessage =
        " No eligible referral bonus was found for this user.";
    }

    setMessage(
      planName +
        " for " +
        (
          request.fullName ||
          request.user?.fullName ||
          request.user?.name ||
          "user"
        ) +
        " approved successfully. First weekly return of PKR " +
        weeklyReturn.toLocaleString() +
        " has been credited immediately. Next return will be available in 7 days." +
        referralMessage
    );

    loadUsers();
  };

  /* =========================
     UPDATE WITHDRAW STATUS
  ========================= */

  const updateWithdrawStatus = (
    requestId,
    newStatus
  ) => {
    const request =
      withdrawRequests.find(
        (item) => item.id === requestId
      );

    if (!request) {
      setMessage(
        "Withdrawal request not found."
      );
      return;
    }

    if (
      newStatus === "Approved" &&
      request.status === "Approved"
    ) {
      setMessage(
        "This withdrawal has already been approved."
      );
      return;
    }

    if (
      newStatus === "Rejected" &&
      request.status === "Rejected"
    ) {
      setMessage(
        "This withdrawal has already been rejected."
      );
      return;
    }

    const phone =
      request.phone ||
      request.mobile ||
      request.mobileNumber ||
      "";

    if (!phone) {
      setMessage(
        "User mobile number is missing from this withdrawal request."
      );
      return;
    }

    const returnsKey =
      "transportWithdrawableReturns_" +
      phone;

    const savedReturns =
      localStorage.getItem(
        returnsKey
      );

    const availableReturns =
      savedReturns !== null
        ? Number(savedReturns) || 0
        : 0;

    const withdrawAmount =
      Number(request.amount || 0);

    if (
      newStatus === "Approved" &&
      withdrawAmount > availableReturns
    ) {
      setMessage(
        "Insufficient earned returns. Available: PKR " +
          availableReturns.toLocaleString()
      );
      return;
    }

    if (newStatus === "Approved") {
      const newBalance =
        availableReturns -
        withdrawAmount;

      localStorage.setItem(
        returnsKey,
        String(newBalance)
      );

      saveTransaction(
        {
          id:
            "withdraw-" +
            request.id,

          type:
            "Withdrawal",

          amount:
            withdrawAmount,

          status:
            "Approved",

          phone:
            phone,

          transactionId:
            request.transactionId ||
            request.txId ||
            request.transectionId ||
            request.transactionID ||
            "",

          number:
            request.number ||
            request.withdrawNumber ||
            request.mobileNumber ||
            request.withdrawPhone ||
            "",

          screenshot:
            request.screenshot ||
            request.paymentScreenshot ||
            request.receipt ||
            "",

          date:
            request.submittedAt
              ? new Date(
                  request.submittedAt
                ).toLocaleString()
              : new Date().toLocaleString(),
        },
        phone
      );
    }

    const updatedRequest = {
      ...request,

      status:
        newStatus,

      updatedAt:
        new Date().toISOString(),
    };

    const updatedRequests =
      withdrawRequests.map(
        (item) =>
          item.id === requestId
            ? updatedRequest
            : item
      );

    saveWithdrawRequests(
      updatedRequests
    );

    if (newStatus === "Approved") {
      setMessage(
        "Withdrawal of PKR " +
          withdrawAmount.toLocaleString() +
          " for " +
          (request.fullName ||
            "user") +
          " approved successfully."
      );
    } else {
      setMessage(
        "Withdrawal request rejected."
      );
    }
  };

  /* =========================
     DASHBOARD STATISTICS
  ========================= */

  const stats = useMemo(() => {
    const totalDeposits =
      depositRequests.reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount ||
            item.depositAmount ||
            item.plan?.amount ||
            0
          ),
        0
      );

    const approvedDeposits =
      depositRequests
        .filter(
          (item) =>
            item.status === "Approved"
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(
              item.amount ||
              item.depositAmount ||
              item.plan?.amount ||
              0
            ),
          0
        );

    const pendingDeposits =
      depositRequests.filter(
        (item) =>
          item.status === "Pending"
      ).length;

    const pendingWithdrawals =
      withdrawRequests.filter(
        (item) =>
          item.status === "Pending"
      ).length;

    const approvedWithdrawals =
      withdrawRequests
        .filter(
          (item) =>
            item.status === "Approved"
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(item.amount || 0),
          0
        );

    return {
      users: users.length,
      totalDeposits,
      approvedDeposits,
      pendingDeposits,
      pendingWithdrawals,
      approvedWithdrawals,
      totalRequests:
        depositRequests.length,
      totalWithdrawRequests:
        withdrawRequests.length,
    };
  }, [
    users,
    depositRequests,
    withdrawRequests,
  ]);

  /* =========================
     GROUP ALL USER REQUESTS
  ========================= */

  const groupedUsers = useMemo(() => {
    const groups = {};

    depositRequests.forEach(
      (request, index) => {
        const phone =
          request.phone ||
          request.mobile ||
          request.mobileNumber ||
          request.user?.phone ||
          "deposit-unknown-" +
            index;

        if (!groups[phone]) {
          groups[phone] = {
            key: phone,
            fullName:
              request.fullName ||
              request.name ||
              request.user?.fullName ||
              request.user?.name ||
              "User",
            phone:
              request.phone ||
              request.mobile ||
              request.mobileNumber ||
              request.user?.phone ||
              "N/A",
            bankName:
              request.bankName ||
              "N/A",
            accountNumber:
              request.accountNumber ||
              "N/A",
            deposits: [],
            withdrawals: [],
          };
        }

        groups[phone].deposits.push(
          request
        );

        if (
          groups[phone].fullName ===
            "User" &&
          (
            request.fullName ||
            request.name ||
            request.user?.fullName ||
            request.user?.name
          )
        ) {
          groups[phone].fullName =
            request.fullName ||
            request.name ||
            request.user?.fullName ||
            request.user?.name;
        }

        if (
          groups[phone].bankName ===
            "N/A" &&
          request.bankName
        ) {
          groups[phone].bankName =
            request.bankName;
        }

        if (
          groups[phone]
            .accountNumber ===
            "N/A" &&
          request.accountNumber
        ) {
          groups[phone].accountNumber =
            request.accountNumber;
        }
      }
    );

    withdrawRequests.forEach(
      (request, index) => {
        const phone =
          request.phone ||
          request.mobile ||
          request.mobileNumber ||
          "withdraw-unknown-" +
            index;

        if (!groups[phone]) {
          groups[phone] = {
            key: phone,
            fullName:
              request.fullName ||
              request.name ||
              "User",
            phone:
              request.phone ||
              request.mobile ||
              request.mobileNumber ||
              "N/A",
            bankName:
              request.bankName ||
              "N/A",
            accountNumber:
              request.accountNumber ||
              "N/A",
            deposits: [],
            withdrawals: [],
          };
        }

        groups[phone].withdrawals.push(
          request
        );

        if (
          groups[phone].fullName ===
            "User" &&
          (
            request.fullName ||
            request.name
          )
        ) {
          groups[phone].fullName =
            request.fullName ||
            request.name;
        }

        if (
          groups[phone].bankName ===
            "N/A" &&
          request.bankName
        ) {
          groups[phone].bankName =
            request.bankName;
        }

        if (
          groups[phone]
            .accountNumber ===
            "N/A" &&
          request.accountNumber
        ) {
          groups[phone].accountNumber =
            request.accountNumber;
        }
      }
    );

    return Object.values(groups);
  }, [
    depositRequests,
    withdrawRequests,
  ]);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: PAGE_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: NAVY,
          fontFamily:
            "Arial, sans-serif",
          fontSize: "18px",
          fontWeight: "700",
        }}
      >
        Loading Admin Panel...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAGE_BG,
        color: "#ffffff",
        fontFamily:
          "Arial, sans-serif",
        padding: "25px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
        }}
      >
        {/* =========================
            HEADER
        ========================= */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #102A43 0%, #173B5A 100%)",
            borderRadius: "22px",
            padding:
              "25px 28px",
            boxShadow:
              "0 14px 35px rgba(16, 42, 67, 0.18)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "18px",
                background:
                  "rgba(255,255,255,0.10)",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                fontSize: "29px",
              }}
            >
              🛠️
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "29px",
                  fontWeight: "800",
                }}
              >
                Admin Panel
              </h1>

              <p
                style={{
                  margin:
                    "6px 0 0",
                  color: LIGHT,
                  fontSize: "14px",
                }}
              >
                Manage Transport Hub
                accounts and requests
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              window.location.href =
                "/";
            }}
            style={{
              border:
                "1px solid #36536D",
              background:
                "#173B5A",
              color: "#ffffff",
              borderRadius: "11px",
              padding:
                "11px 17px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            ← Dashboard
          </button>
        </div>

        {/* =========================
            STAT CARDS
        ========================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <StatCard
            icon="👥"
            title="Total Users"
            value={stats.users}
          />

          <StatCard
            icon="💰"
            title="Approved Deposits"
            value={
              "PKR " +
              stats.approvedDeposits.toLocaleString()
            }
          />

          <StatCard
            icon="⏳"
            title="Pending Deposits"
            value={stats.pendingDeposits}
          />

          <StatCard
            icon="💸"
            title="Pending Withdrawals"
            value={stats.pendingWithdrawals}
          />

          <StatCard
            icon="📤"
            title="Approved Withdrawals"
            value={
              "PKR " +
              stats.approvedWithdrawals.toLocaleString()
            }
          />
        </div>

        {/* =========================
            TABS
        ========================= */}

        <div
          style={{
            background: NAVY,
            border:
              "1px solid " +
              BORDER,
            borderRadius: "16px",
            padding: "8px",
            display: "flex",
            gap: "7px",
            marginBottom: "20px",
            overflowX: "auto",
          }}
        >
          <TabButton
            active={
              activeTab ===
              "overview"
            }
            onClick={() =>
              setActiveTab(
                "overview"
              )
            }
          >
            📊 Overview
          </TabButton>

          <TabButton
            active={
              activeTab ===
              "transactions"
            }
            onClick={() =>
              setActiveTab(
                "transactions"
              )
            }
          >
            💳 Transactions

            {(stats.pendingDeposits +
              stats.pendingWithdrawals) >
              0 && (
              <Badge>
                {stats.pendingDeposits +
                  stats.pendingWithdrawals}
              </Badge>
            )}
          </TabButton>

          <TabButton
            active={
              activeTab ===
              "users"
            }
            onClick={() =>
              setActiveTab(
                "users"
              )
            }
          >
            👥 Users
          </TabButton>
        </div>

        {/* =========================
            MESSAGE
        ========================= */}

        {message && (
          <div
            style={{
              background:
                "rgba(143, 214, 148, 0.10)",
              border:
                "1px solid rgba(143, 214, 148, 0.25)",
              color: GREEN,
              borderRadius: "13px",
              padding:
                "13px 15px",
              marginBottom: "18px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            ✅ {message}

            <button
              onClick={() =>
                setMessage("")
              }
              style={{
                float: "right",
                border: "none",
                background:
                  "transparent",
                color: GREEN,
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* =========================
            OVERVIEW
        ========================= */}

        {activeTab ===
          "overview" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            <AdminCard
              icon="💳"
              title="User Transactions"
              text={
                "There are " +
                groupedUsers.length +
                " user card(s) containing deposit and withdrawal requests."
              }
              buttonText="View Transactions"
              onClick={() =>
                setActiveTab(
                  "transactions"
                )
              }
            />

            <AdminCard
              icon="💰"
              title="Deposit Management"
              text={
                "Total " +
                stats.totalRequests +
                " deposit request(s), including " +
                stats.pendingDeposits +
                " pending request(s)."
              }
              buttonText="View Transactions"
              onClick={() =>
                setActiveTab(
                  "transactions"
                )
              }
            />

            <AdminCard
              icon="💸"
              title="Withdrawal Management"
              text={
                "Total " +
                stats.totalWithdrawRequests +
                " withdrawal request(s), including " +
                stats.pendingWithdrawals +
                " pending request(s)."
              }
              buttonText="View Transactions"
              onClick={() =>
                setActiveTab(
                  "transactions"
                )
              }
            />

            <AdminCard
              icon="👥"
              title="Registered Users"
              text={
                "There are " +
                stats.users +
                " registered account(s) in Transport Hub."
              }
              buttonText="View Users"
              onClick={() =>
                setActiveTab(
                  "users"
                )
              }
            />

            {/* =========================
                SUPPORT CHAT CARD
            ========================= */}

            <AdminCard
              icon="💬"
              title="Support Chats"
              text="View customer support messages and reply to users in real time."
              buttonText="Open Support Chats"
              onClick={() => {
                window.location.href =
                  "/admin-support";
              }}
            />
          </div>
        )}

        {/* =========================
            COMBINED USER TRANSACTIONS
        ========================= */}

        {activeTab ===
          "transactions" && (
          <div>
            <SectionHeader
              title="User Transactions"
              subtitle="Each user has one card containing all deposits and withdrawals."
              icon="💳"
            />

            {groupedUsers.length >
            0 ? (
              <div
                style={{
                  display: "grid",
                  gap: "18px",
                }}
              >
                {groupedUsers.map(
                  (user) => (
                    <div
                      key={
                        user.key
                      }
                      style={{
                        background:
                          NAVY,
                        border:
                          "1px solid " +
                          BORDER,
                        borderRadius:
                          "20px",
                        padding:
                          "21px",
                        boxShadow:
                          "0 10px 28px rgba(16,42,67,0.13)",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          gap: "15px",
                          marginBottom:
                            "18px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "13px",
                          }}
                        >
                          <div
                            style={{
                              width:
                                "50px",
                              height:
                                "50px",
                              borderRadius:
                                "15px",
                              background:
                                NAVY_2,
                              border:
                                "1px solid " +
                                BORDER,
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              fontSize:
                                "23px",
                            }}
                          >
                            👤
                          </div>

                          <div>
                            <h2
                              style={{
                                margin: 0,
                                color:
                                  "#ffffff",
                                fontSize:
                                  "20px",
                              }}
                            >
                              {user.fullName}
                            </h2>

                            <p
                              style={{
                                margin:
                                  "5px 0 0",
                                color:
                                  MUTED,
                                fontSize:
                                  "12px",
                              }}
                            >
                              📱{" "}
                              {user.phone}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <span
                            style={{
                              background:
                                "rgba(143,214,148,0.12)",
                              color:
                                GREEN,
                              border:
                                "1px solid rgba(143,214,148,0.22)",
                              borderRadius:
                                "20px",
                              padding:
                                "7px 11px",
                              fontSize:
                                "11px",
                              fontWeight:
                                "700",
                            }}
                          >
                            💰{" "}
                            {
                              user
                                .deposits
                                .length
                            }{" "}
                            Deposits
                          </span>

                          <span
                            style={{
                              background:
                                "rgba(244,215,122,0.12)",
                              color:
                                GOLD,
                              border:
                                "1px solid rgba(244,215,122,0.22)",
                              borderRadius:
                                "20px",
                              padding:
                                "7px 11px",
                              fontSize:
                                "11px",
                              fontWeight:
                                "700",
                            }}
                          >
                            💸{" "}
                            {
                              user
                                .withdrawals
                                .length
                            }{" "}
                            Withdrawals
                          </span>
                        </div>
                      </div>

                      <DetailsGrid>
                        <Detail
                          label="Full Name"
                          value={
                            user.fullName
                          }
                        />

                        <Detail
                          label="Mobile Number"
                          value={
                            user.phone
                          }
                        />

                        <Detail
                          label="Bank Name"
                          value={
                            user.bankName
                          }
                        />

                        <Detail
                          label="Account Number"
                          value={
                            user.accountNumber
                          }
                        />
                      </DetailsGrid>

                      {/* DEPOSITS */}

                      {user.deposits
                        .length >
                        0 && (
                        <div
                          style={{
                            marginTop:
                              "20px",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              gap:
                                "10px",
                              marginBottom:
                                "10px",
                            }}
                          >
                            <h3
                              style={{
                                margin:
                                  0,
                                color:
                                  "#ffffff",
                                fontSize:
                                  "16px",
                              }}
                            >
                              💰 Deposits
                            </h3>

                            <span
                              style={{
                                color:
                                  MUTED,
                                fontSize:
                                  "11px",
                              }}
                            >
                              {
                                user
                                  .deposits
                                  .length
                              }{" "}
                              request(s)
                            </span>
                          </div>

                          <div
                            style={{
                              display:
                                "grid",
                              gap:
                                "10px",
                            }}
                          >
                            {user.deposits.map(
                              (
                                request
                              ) => {
                                const requestPlan =
                                  request.plan ||
                                  {};

                                const displayPlanName =
                                  requestPlan.name ||
                                  request.planName ||
                                  "Deposit";

                                const displayAmount =
                                  Number(
                                    requestPlan.amount ||
                                    request.amount ||
                                    request.depositAmount ||
                                    0
                                  );

                                const displayWeekly =
                                  Number(
                                    requestPlan.weekly ||
                                    request.weeklyReturn ||
                                    request.dailyReturn ||
                                    requestPlan.daily ||
                                    0
                                  );

                                return (
                                  <div
                                    key={
                                      request.id
                                    }
                                    style={{
                                      background:
                                        NAVY_2,
                                      border:
                                        "1px solid " +
                                        BORDER,
                                      borderRadius:
                                        "14px",
                                      padding:
                                        "15px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        justifyContent:
                                          "space-between",
                                        alignItems:
                                          "center",
                                        gap:
                                          "10px",
                                        marginBottom:
                                          "12px",
                                        flexWrap:
                                          "wrap",
                                      }}
                                    >
                                      <div>
                                        <strong
                                          style={{
                                            color:
                                              "#ffffff",
                                            fontSize:
                                              "14px",
                                          }}
                                        >
                                          {
                                            displayPlanName
                                          }
                                        </strong>

                                        <p
                                          style={{
                                            margin:
                                              "4px 0 0",
                                            color:
                                              MUTED,
                                            fontSize:
                                              "10px",
                                          }}
                                        >
                                          ID:{" "}
                                          {request.id ||
                                            "N/A"}
                                        </p>
                                      </div>

                                      <StatusBadge
                                        status={
                                          request.status ||
                                          "Pending"
                                        }
                                      />
                                    </div>

                                    <DetailsGrid>
                                      <Detail
                                        label="Amount"
                                        value={
                                          "PKR " +
                                          displayAmount.toLocaleString()
                                        }
                                        highlight
                                      />

                                      <Detail
                                        label="Weekly Return"
                                        value={
                                          "PKR " +
                                          displayWeekly.toLocaleString()
                                        }
                                      />

                                      <Detail
                                        label="Duration"
                                        value="5 Years"
                                      />

                                      <Detail
                                        label="Transaction ID"
                                        value={
                                          request.transactionId ||
                                          request.txId ||
                                          request.transectionId ||
                                          request.transactionID ||
                                          "N/A"
                                        }
                                      />

                                      <Detail
                                        label="Deposit Number"
                                        value={
                                          request.number ||
                                          request.depositNumber ||
                                          request.mobileNumber ||
                                          request.depositPhone ||
                                          "N/A"
                                        }
                                      />

                                      <Detail
                                        label="Submitted"
                                        value={
                                          request.submittedAt
                                            ? new Date(
                                                request.submittedAt
                                              ).toLocaleString()
                                            : request.createdAt
                                            ? new Date(
                                                request.createdAt
                                              ).toLocaleString()
                                            : "N/A"
                                        }
                                      />
                                    </DetailsGrid>

                                    {(request.screenshot ||
                                      request.paymentScreenshot ||
                                      request.receipt) && (
                                      <div
                                        style={{
                                          marginTop:
                                            "12px",
                                          background:
                                            "#102A43",
                                          border:
                                            "1px solid " +
                                            BORDER,
                                          borderRadius:
                                            "12px",
                                          padding:
                                            "12px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            color:
                                              MUTED,
                                            fontSize:
                                              "10px",
                                            textTransform:
                                              "uppercase",
                                            marginBottom:
                                              "8px",
                                            fontWeight:
                                              "700",
                                          }}
                                        >
                                          📷 Deposit Screenshot
                                        </div>

                                        <img
                                          src={
                                            request.screenshot ||
                                            request.paymentScreenshot ||
                                            request.receipt
                                          }
                                          alt="Deposit Screenshot"
                                          style={{
                                            width:
                                              "100%",
                                            maxWidth:
                                              "420px",
                                            maxHeight:
                                              "500px",
                                            objectFit:
                                              "contain",
                                            display:
                                              "block",
                                            borderRadius:
                                              "9px",
                                            background:
                                              "#ffffff",
                                          }}
                                        />
                                      </div>
                                    )}

                                    {request.status ===
                                      "Pending" && (
                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          gap:
                                            "10px",
                                          marginTop:
                                            "14px",
                                          flexWrap:
                                            "wrap",
                                        }}
                                      >
                                        <ActionButton
                                          type="approve"
                                          onClick={() =>
                                            updateDepositStatus(
                                              request.id,
                                              "Approved"
                                            )
                                          }
                                        >
                                          ✅ Approve Deposit
                                        </ActionButton>

                                        <ActionButton
                                          type="reject"
                                          onClick={() =>
                                            updateDepositStatus(
                                              request.id,
                                              "Rejected"
                                            )
                                          }
                                        >
                                          ❌ Reject Deposit
                                        </ActionButton>
                                      </div>
                                    )}

                                    {request.status ===
                                      "Approved" && (
                                      <div
                                        style={{
                                          marginTop:
                                            "12px",
                                          color:
                                            GREEN,
                                          fontSize:
                                            "12px",
                                          fontWeight:
                                            "700",
                                        }}
                                      >
                                        ✅ Plan Activated • First Weekly Return Credited • Referral Bonus Processed
                                      </div>
                                    )}

                                    {request.status ===
                                      "Rejected" && (
                                      <div
                                        style={{
                                          marginTop:
                                            "12px",
                                          color:
                                            RED,
                                          fontSize:
                                            "12px",
                                          fontWeight:
                                            "700",
                                        }}
                                      >
                                        ❌ Deposit Rejected
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                      {/* WITHDRAWALS */}

                      {user.withdrawals
                        .length >
                        0 && (
                        <div
                          style={{
                            marginTop:
                              "22px",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              gap:
                                "10px",
                              marginBottom:
                                "10px",
                            }}
                          >
                            <h3
                              style={{
                                margin:
                                  0,
                                color:
                                  "#ffffff",
                                fontSize:
                                  "16px",
                              }}
                            >
                              💸 Withdrawals
                            </h3>

                            <span
                              style={{
                                color:
                                  MUTED,
                                fontSize:
                                  "11px",
                              }}
                            >
                              {
                                user
                                  .withdrawals
                                  .length
                              }{" "}
                              request(s)
                            </span>
                          </div>

                          <div
                            style={{
                              display:
                                "grid",
                              gap:
                                "10px",
                            }}
                          >
                            {user.withdrawals.map(
                              (
                                request
                              ) => (
                                <div
                                  key={
                                    request.id
                                  }
                                  style={{
                                    background:
                                      NAVY_2,
                                    border:
                                      "1px solid " +
                                      BORDER,
                                    borderRadius:
                                      "14px",
                                    padding:
                                      "15px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      justifyContent:
                                        "space-between",
                                      alignItems:
                                        "center",
                                      gap:
                                        "10px",
                                      marginBottom:
                                        "12px",
                                      flexWrap:
                                        "wrap",
                                    }}
                                  >
                                    <div>
                                      <strong
                                        style={{
                                          color:
                                            "#ffffff",
                                          fontSize:
                                            "14px",
                                        }}
                                      >
                                        Withdrawal Request
                                      </strong>

                                      <p
                                        style={{
                                          margin:
                                            "4px 0 0",
                                          color:
                                            MUTED,
                                          fontSize:
                                            "10px",
                                        }}
                                      >
                                        ID:{" "}
                                        {request.id ||
                                          "N/A"}
                                      </p>
                                    </div>

                                    <StatusBadge
                                      status={
                                        request.status ||
                                        "Pending"
                                      }
                                    />
                                  </div>

                                  <DetailsGrid>
                                    <Detail
                                      label="Withdrawal Amount"
                                      value={
                                        "PKR " +
                                        Number(
                                          request.amount ||
                                            0
                                        ).toLocaleString()
                                      }
                                      highlight
                                    />

                                    <Detail
                                      label="Transaction ID"
                                      value={
                                        request.transactionId ||
                                        request.txId ||
                                        request.transectionId ||
                                        request.transactionID ||
                                        "N/A"
                                      }
                                    />

                                    <Detail
                                      label="Withdrawal Number"
                                      value={
                                        request.number ||
                                        request.withdrawNumber ||
                                        request.mobileNumber ||
                                        request.withdrawPhone ||
                                        "N/A"
                                      }
                                    />

                                    <Detail
                                      label="Bank Name"
                                      value={
                                        request.bankName ||
                                        user.bankName ||
                                        "N/A"
                                      }
                                    />

                                    <Detail
                                      label="Account Number"
                                      value={
                                        request.accountNumber ||
                                        user.accountNumber ||
                                        "N/A"
                                      }
                                    />

                                    <Detail
                                      label="Submitted"
                                      value={
                                        request.submittedAt
                                          ? new Date(
                                              request.submittedAt
                                            ).toLocaleString()
                                          : "N/A"
                                      }
                                    />
                                  </DetailsGrid>

                                  {(request.screenshot ||
                                    request.paymentScreenshot ||
                                    request.receipt) && (
                                    <div
                                      style={{
                                        marginTop:
                                          "12px",
                                        background:
                                          "#102A43",
                                        border:
                                          "1px solid " +
                                          BORDER,
                                        borderRadius:
                                          "12px",
                                        padding:
                                          "12px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          color:
                                            MUTED,
                                          fontSize:
                                            "10px",
                                          textTransform:
                                            "uppercase",
                                          marginBottom:
                                            "8px",
                                          fontWeight:
                                            "700",
                                        }}
                                      >
                                        📷 Withdrawal Screenshot
                                      </div>

                                      <img
                                        src={
                                          request.screenshot ||
                                          request.paymentScreenshot ||
                                          request.receipt
                                        }
                                        alt="Withdrawal Screenshot"
                                        style={{
                                          width:
                                            "100%",
                                          maxWidth:
                                            "420px",
                                          maxHeight:
                                            "500px",
                                          objectFit:
                                            "contain",
                                          display:
                                            "block",
                                          borderRadius:
                                            "9px",
                                          background:
                                            "#ffffff",
                                        }}
                                      />
                                    </div>
                                  )}

                                  {request.status ===
                                    "Pending" && (
                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        gap:
                                          "10px",
                                        marginTop:
                                          "14px",
                                        flexWrap:
                                          "wrap",
                                      }}
                                    >
                                      <ActionButton
                                        type="approve"
                                        onClick={() =>
                                          updateWithdrawStatus(
                                            request.id,
                                            "Approved"
                                          )
                                        }
                                      >
                                        ✅ Approve Withdrawal
                                      </ActionButton>

                                      <ActionButton
                                        type="reject"
                                        onClick={() =>
                                          updateWithdrawStatus(
                                            request.id,
                                            "Rejected"
                                          )
                                        }
                                      >
                                        ❌ Reject Withdrawal
                                      </ActionButton>
                                    </div>
                                  )}

                                  {request.status ===
                                    "Approved" && (
                                    <div
                                      style={{
                                        marginTop:
                                          "12px",
                                        color:
                                          GREEN,
                                        fontSize:
                                          "12px",
                                        fontWeight:
                                          "700",
                                      }}
                                    >
                                      ✅ Withdrawal Approved
                                    </div>
                                  )}

                                  {request.status ===
                                    "Rejected" && (
                                    <div
                                      style={{
                                        marginTop:
                                          "12px",
                                        color:
                                          RED,
                                        fontSize:
                                          "12px",
                                        fontWeight:
                                          "700",
                                      }}
                                    >
                                      ❌ Withdrawal Rejected
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                icon="📭"
                title="No Transactions"
                text="There are currently no deposit or withdrawal requests."
              />
            )}
          </div>
        )}

        {/* =========================
            USERS
        ========================= */}

        {activeTab ===
          "users" && (
          <div>
            <SectionHeader
              title="Registered Users"
              subtitle="View registered Transport Hub accounts."
              icon="👥"
            />

            {users.length > 0 ? (
              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "14px",
                }}
              >
                {users.map(
                  (user, index) => (
                    <div
                      key={
                        user.phone ||
                        user.id ||
                        index
                      }
                      style={{
                        background:
                          NAVY,
                        border:
                          "1px solid " +
                          BORDER,
                        borderRadius:
                          "17px",
                        padding:
                          "18px",
                        boxShadow:
                          "0 8px 22px rgba(16,42,67,0.10)",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "14px",
                          marginBottom:
                            "15px",
                        }}
                      >
                        <div
                          style={{
                            width:
                              "48px",
                            height:
                              "48px",
                            borderRadius:
                              "15px",
                            background:
                              NAVY_2,
                            border:
                              "1px solid " +
                              BORDER,
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontSize:
                              "22px",
                          }}
                        >
                          👤
                        </div>

                        <div>
                          <h3
                            style={{
                              margin:
                                0,
                              color:
                                "#ffffff",
                              fontSize:
                                "17px",
                            }}
                          >
                            {user.fullName ||
                              user.name ||
                              user.username ||
                              "User"}
                          </h3>

                          <p
                            style={{
                              margin:
                                "4px 0 0",
                              color:
                                MUTED,
                              fontSize:
                                "12px",
                            }}
                          >
                            {user.phone ||
                              "No mobile number"}
                          </p>
                        </div>
                      </div>

                      <DetailsGrid>
                        <Detail
                          label="Full Name"
                          value={
                            user.fullName ||
                            user.name ||
                            user.username ||
                            "N/A"
                          }
                        />

                        <Detail
                          label="Mobile Number"
                          value={
                            user.phone ||
                            "N/A"
                          }
                        />

                        <Detail
                          label="Balance"
                          value={
                            "PKR " +
                            Number(
                              user.balance ||
                                0
                            ).toLocaleString()
                          }
                          highlight
                        />

                        <Detail
                          label="Referral Code"
                          value={
                            user.referralCode ||
                            user.referral ||
                            "N/A"
                          }
                        />
                      </DetailsGrid>
                    </div>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                icon="👥"
                title="No Registered Users"
                text="No Transport Hub users were found."
              />
            )}
          </div>
        )}

        {/* =========================
            FOOTER
        ========================= */}

        <div
          style={{
            marginTop: "25px",
            textAlign: "center",
            color: "#71869A",
            fontSize: "12px",
          }}
        >
          Transport Hub Admin Panel
        </div>
      </div>
    </div>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        background: NAVY,
        border:
          "1px solid " +
          BORDER,
        borderRadius: "17px",
        padding: "18px",
        boxShadow:
          "0 8px 22px rgba(16,42,67,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "43px",
            height: "43px",
            borderRadius: "13px",
            background: NAVY_2,
            border:
              "1px solid " +
              BORDER,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>

        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              color: MUTED,
              fontSize: "11px",
              marginBottom: "5px",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.4px",
            }}
          >
            {title}
          </div>

          <strong
            style={{
              color: "#ffffff",
              fontSize: "18px",
              wordBreak:
                "break-word",
            }}
          >
            {value}
          </strong>
        </div>
      </div>
    </div>
  );
}

/* =========================
   TAB BUTTON
========================= */

function TabButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: "10px",
        padding:
          "10px 14px",
        background: active
          ? "#29435A"
          : "transparent",
        color: active
          ? "#ffffff"
          : MUTED,
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        whiteSpace:
          "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "7px",
      }}
    >
      {children}
    </button>
  );
}

/* =========================
   BADGE
========================= */

function Badge({ children }) {
  return (
    <span
      style={{
        minWidth: "19px",
        height: "19px",
        padding: "0 5px",
        borderRadius: "10px",
        background: "#8FD694",
        color: "#102A43",
        fontSize: "10px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent:
          "center",
        fontWeight: "800",
      }}
    >
      {children}
    </span>
  );
}

/* =========================
   STATUS BADGE
========================= */

function StatusBadge({
  status,
}) {
  const style =
    status === "Approved"
      ? {
          background:
            "rgba(143,214,148,0.14)",
          color: GREEN,
          border:
            "1px solid rgba(143,214,148,0.25)",
        }
      : status ===
        "Rejected"
      ? {
          background:
            "rgba(255,159,150,0.14)",
          color: RED,
          border:
            "1px solid rgba(255,159,150,0.25)",
        }
      : {
          background:
            "rgba(244,215,122,0.14)",
          color: GOLD,
          border:
            "1px solid rgba(244,215,122,0.25)",
        };

  return (
    <span
      style={{
        ...style,
        borderRadius:
          "20px",
        padding:
          "7px 12px",
        fontSize:
          "12px",
        fontWeight:
          "700",
        whiteSpace:
          "nowrap",
      }}
    >
      {status || "Pending"}
    </span>
  );
}

/* =========================
   DETAILS GRID
========================= */

function DetailsGrid({
  children,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "10px",
      }}
    >
      {children}
    </div>
  );
}

/* =========================
   DETAIL
========================= */

function Detail({
  label,
  value,
  highlight,
}) {
  return (
    <div
      style={{
        background: NAVY_2,
        border:
          "1px solid " +
          BORDER,
        borderRadius:
          "11px",
        padding:
          "12px",
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: "block",
          color: MUTED,
          fontSize: "10px",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.35px",
          marginBottom:
            "5px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          color: highlight
            ? GREEN
            : "#ffffff",
          fontSize: "13px",
          wordBreak:
            "break-word",
          lineHeight: "1.4",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

/* =========================
   ACTION BUTTON
========================= */

function ActionButton({
  type,
  onClick,
  children,
}) {
  const isApprove =
    type === "approve";

  return (
    <button
      onClick={onClick}
      style={{
        border: isApprove
          ? "1px solid rgba(143,214,148,0.35)"
          : "1px solid rgba(255,159,150,0.30)",
        borderRadius:
          "10px",
        padding:
          "11px 15px",
        background:
          isApprove
            ? "linear-gradient(135deg, #3E8E5B, #2E6B4A)"
            : "rgba(255,159,150,0.10)",
        color:
          isApprove
            ? "#ffffff"
            : RED,
        fontSize:
          "13px",
        fontWeight:
          "700",
        cursor:
          "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* =========================
   SECTION HEADER
========================= */

function SectionHeader({
  icon,
  title,
  subtitle,
}) {
  return (
    <div
      style={{
        background: NAVY,
        border:
          "1px solid " +
          BORDER,
        borderRadius:
          "17px",
        padding:
          "18px 20px",
        marginBottom:
          "16px",
        display:
          "flex",
        alignItems:
          "center",
        gap: "13px",
      }}
    >
      <div
        style={{
          width: "45px",
          height: "45px",
          borderRadius:
            "13px",
          background:
            NAVY_2,
          border:
            "1px solid " +
            BORDER,
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          fontSize:
            "21px",
        }}
      >
        {icon}
      </div>

      <div>
        <h2
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize:
              "20px",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin:
              "4px 0 0",
            color: MUTED,
            fontSize:
              "12px",
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* =========================
   ADMIN CARD
========================= */

function AdminCard({
  icon,
  title,
  text,
  buttonText,
  onClick,
}) {
  return (
    <div
      style={{
        background: NAVY,
        border:
          "1px solid " +
          BORDER,
        borderRadius:
          "18px",
        padding:
          "22px",
        boxShadow:
          "0 9px 25px rgba(16,42,67,0.12)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius:
            "14px",
          background:
            NAVY_2,
          border:
            "1px solid " +
            BORDER,
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          fontSize:
            "22px",
          marginBottom:
            "14px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin:
            "0 0 7px",
          color:
            "#ffffff",
          fontSize:
            "18px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin:
            "0 0 16px",
          color:
            MUTED,
          fontSize:
            "13px",
          lineHeight:
            "1.55",
        }}
      >
        {text}
      </p>

      <button
        onClick={onClick}
        style={{
          border:
            "1px solid " +
            BORDER,
          background:
            NAVY_2,
          color:
            "#ffffff",
          borderRadius:
            "10px",
          padding:
            "10px 14px",
          fontSize:
            "12px",
          fontWeight:
            "700",
          cursor:
            "pointer",
        }}
      >
        {buttonText} →
      </button>
    </div>
  );
}

/* =========================
   EMPTY STATE
========================= */

function EmptyState({
  icon,
  title,
  text,
}) {
  return (
    <div
      style={{
        background: NAVY,
        border:
          "1px solid " +
          BORDER,
        borderRadius:
          "18px",
        padding:
          "45px 25px",
        textAlign:
          "center",
        boxShadow:
          "0 9px 25px rgba(16,42,67,0.10)",
      }}
    >
      <div
        style={{
          width: "65px",
          height: "65px",
          borderRadius:
            "18px",
          background:
            NAVY_2,
          border:
            "1px solid " +
            BORDER,
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          margin:
            "0 auto 15px",
          fontSize:
            "29px",
        }}
      >
        {icon}
      </div>

      <h2
        style={{
          margin:
            "0 0 7px",
          color:
            "#ffffff",
          fontSize:
            "19px",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: 0,
          color:
            MUTED,
          fontSize:
            "13px",
        }}
      >
        {text}
      </p>
    </div>
  );
}