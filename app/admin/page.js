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

export default function Admin() {
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    const savedUsers = localStorage.getItem("transportUsers");

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

    /*
      Support old single deposit request.
    */

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

    /*
      New multiple withdrawal requests.
    */

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

    /*
      Support old single withdrawal request.
    */

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
     UPDATE DEPOSIT LIST
  ========================= */

  const saveDepositRequests = (requests) => {
    localStorage.setItem(
      "transportDepositRequests",
      JSON.stringify(requests)
    );

    setDepositRequests(requests);
  };

  /* =========================
     UPDATE WITHDRAW LIST
  ========================= */

  const saveWithdrawRequests = (requests) => {
    localStorage.setItem(
      "transportWithdrawRequests",
      JSON.stringify(requests)
    );

    /*
      Keep old key synchronized with
      latest request for compatibility.
    */

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

    /*
      Do not activate the plan if
      user's phone is missing.
    */

    if (
      newStatus === "Approved" &&
      !request.phone
    ) {
      setMessage(
        "User mobile number is missing from this request."
      );
      return;
    }

    const updatedRequest = {
      ...request,
      status: newStatus,
      updatedAt:
        new Date().toISOString(),
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

    /* =========================
       APPROVED DEPOSIT
    ========================= */

    if (newStatus === "Approved") {
      const phone = request.phone;

      const activatedAt =
        new Date().toISOString();

      const activePlan = {
        id:
          "active-plan-" +
          request.id,

        depositRequestId:
          request.id,

        userPhone:
          phone,

        name:
          request.planName,

        price:
          Number(
            request.amount || 0
          ),

        daily:
          Number(
            request.dailyReturn || 0
          ),

        duration:
          Number(
            request.duration || 0
          ),

        totalReturn:
          Number(
            request.totalReturn || 0
          ),

        activatedAt:
          activatedAt,

        lastReturnAt:
          activatedAt,

        returnsPaid: 0,

        earnedReturns: 0,
      };

      updateActivePlans(
        activePlan,
        phone
      );

      /*
        Save approved deposit
        transaction for this user.
      */

      saveTransaction(
        {
          id:
            "deposit-" +
            request.id,

          type:
            "Deposit",

          amount:
            Number(
              request.amount || 0
            ),

          planName:
            request.planName,

          status:
            "Approved",

          phone:
            phone,

          date:
            request.submittedAt
              ? new Date(
                  request.submittedAt
                ).toLocaleString()
              : new Date().toLocaleString(),
        },
        phone
      );

      setMessage(
        `${request.planName || "Plan"} for ${
          request.fullName || "user"
        } approved and activated. The first daily return will be available after 24 hours.`
      );

      return;
    }

    setMessage(
      `${request.planName || "Plan"} deposit request rejected.`
    );
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

    const phone = request.phone;

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

    /*
      Check available earned returns.
    */

    if (
      newStatus === "Approved" &&
      withdrawAmount > availableReturns
    ) {
      setMessage(
        `Insufficient earned returns. Available: PKR ${availableReturns.toLocaleString()}`
      );
      return;
    }

    /*
      Approved withdrawal.
    */

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
        `Withdrawal of PKR ${withdrawAmount.toLocaleString()} for ${
          request.fullName || "user"
        } approved successfully.`
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
          Number(item.amount || 0),
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
            Number(item.amount || 0),
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
     STATUS HELPERS
  ========================= */

  const getStatusStyle = (status) => {
    if (status === "Approved") {
      return {
        background:
          "rgba(143, 214, 148, 0.14)",
        color: GREEN,
        border:
          "1px solid rgba(143, 214, 148, 0.25)",
      };
    }

    if (status === "Rejected") {
      return {
        background:
          "rgba(255, 159, 150, 0.14)",
        color: RED,
        border:
          "1px solid rgba(255, 159, 150, 0.25)",
      };
    }

    return {
      background:
        "rgba(244, 215, 122, 0.14)",
      color: GOLD,
      border:
        "1px solid rgba(244, 215, 122, 0.25)",
    };
  };

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
            value={`PKR ${stats.approvedDeposits.toLocaleString()}`}
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
            value={`PKR ${stats.approvedWithdrawals.toLocaleString()}`}
          />
        </div>

        {/* =========================
            TABS
        ========================= */}

        <div
          style={{
            background: NAVY,
            border:
              `1px solid ${BORDER}`,
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
              "deposits"
            }
            onClick={() =>
              setActiveTab(
                "deposits"
              )
            }
          >
            💰 Deposits
            {stats.pendingDeposits >
              0 && (
              <Badge>
                {
                  stats.pendingDeposits
                }
              </Badge>
            )}
          </TabButton>

          <TabButton
            active={
              activeTab ===
              "withdrawals"
            }
            onClick={() =>
              setActiveTab(
                "withdrawals"
              )
            }
          >
            💸 Withdrawals
            {stats.pendingWithdrawals >
              0 && (
              <Badge>
                {
                  stats.pendingWithdrawals
                }
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
              icon="💰"
              title="Deposit Management"
              text={`Total ${stats.totalRequests} deposit request(s), including ${stats.pendingDeposits} pending request(s).`}
              buttonText="View Deposits"
              onClick={() =>
                setActiveTab(
                  "deposits"
                )
              }
            />

            <AdminCard
              icon="💸"
              title="Withdrawal Management"
              text={`Total ${stats.totalWithdrawRequests} withdrawal request(s), including ${stats.pendingWithdrawals} pending request(s).`}
              buttonText="View Withdrawals"
              onClick={() =>
                setActiveTab(
                  "withdrawals"
                )
              }
            />

            <AdminCard
              icon="👥"
              title="Registered Users"
              text={`There are ${stats.users} registered account(s) in Transport Hub.`}
              buttonText="View Users"
              onClick={() =>
                setActiveTab(
                  "users"
                )
              }
            />

            <AdminCard
              icon="📈"
              title="Approved Investment"
              text={`Approved deposit volume is PKR ${stats.approvedDeposits.toLocaleString()}.`}
              buttonText="View Deposits"
              onClick={() =>
                setActiveTab(
                  "deposits"
                )
              }
            />
          </div>
        )}

        {/* =========================
            DEPOSITS
        ========================= */}

        {activeTab ===
          "deposits" && (
          <div>
            <SectionHeader
              title="Deposit Requests"
              subtitle="Review and manage submitted plan deposits."
              icon="💰"
            />

            {depositRequests.length >
            0 ? (
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                {depositRequests.map(
                  (request) => (
                    <div
                      key={
                        request.id
                      }
                      style={{
                        background:
                          NAVY,
                        border:
                          `1px solid ${BORDER}`,
                        borderRadius:
                          "18px",
                        padding:
                          "21px",
                        boxShadow:
                          "0 9px 25px rgba(16,42,67,0.12)",
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
                          gap: "12px",
                          marginBottom:
                            "17px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <h2
                            style={{
                              margin: 0,
                              fontSize:
                                "20px",
                              color:
                                "#ffffff",
                            }}
                          >
                            {request.planName ||
                              "Deposit"}
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
                          label="Full Name"
                          value={
                            request.fullName ||
                            "N/A"
                          }
                        />

                        <Detail
                          label="Mobile Number"
                          value={
                            request.phone ||
                            "N/A"
                          }
                        />

                        <Detail
                          label="Bank Name"
                          value={
                            request.bankName ||
                            "N/A"
                          }
                        />

                        <Detail
                          label="Amount"
                          value={`PKR ${Number(
                            request.amount ||
                              0
                          ).toLocaleString()}`}
                          highlight
                        />

                        <Detail
                          label="Daily Return"
                          value={`PKR ${Number(
                            request.dailyReturn ||
                              0
                          ).toLocaleString()}`}
                        />

                        <Detail
                          label="Duration"
                          value={`${Number(
                            request.duration ||
                              0
                          )} Days`}
                        />

                        <Detail
                          label="Total Return"
                          value={`PKR ${Number(
                            request.totalReturn ||
                              0
                          ).toLocaleString()}`}
                          highlight
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

                      {request.status ===
                        "Pending" && (
                        <div
                          style={{
                            display:
                              "flex",
                            gap: "10px",
                            marginTop:
                              "18px",
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
                              "14px",
                            color:
                              GREEN,
                            fontSize:
                              "13px",
                            fontWeight:
                              "700",
                          }}
                        >
                          ✅ Plan Activated
                        </div>
                      )}

                      {request.status ===
                        "Rejected" && (
                        <div
                          style={{
                            marginTop:
                              "14px",
                            color:
                              RED,
                            fontSize:
                              "13px",
                            fontWeight:
                              "700",
                          }}
                        >
                          ❌ Deposit Rejected
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                icon="📭"
                title="No Deposit Requests"
                text="There are currently no deposit requests."
              />
            )}
          </div>
        )}

        {/* =========================
            WITHDRAWALS
        ========================= */}

        {activeTab ===
          "withdrawals" && (
          <div>
            <SectionHeader
              title="Withdrawal Requests"
              subtitle="Review and manage submitted withdrawal requests."
              icon="💸"
            />

            {withdrawRequests.length >
            0 ? (
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                {withdrawRequests.map(
                  (request) => (
                    <div
                      key={
                        request.id
                      }
                      style={{
                        background:
                          NAVY,
                        border:
                          `1px solid ${BORDER}`,
                        borderRadius:
                          "18px",
                        padding:
                          "21px",
                        boxShadow:
                          "0 9px 25px rgba(16,42,67,0.12)",
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
                          gap: "12px",
                          marginBottom:
                            "17px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <h2
                            style={{
                              margin: 0,
                              fontSize:
                                "20px",
                              color:
                                "#ffffff",
                            }}
                          >
                            Withdrawal Request
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
                          label="Full Name"
                          value={
                            request.fullName ||
                            "N/A"
                          }
                        />

                        <Detail
                          label="Mobile Number"
                          value={
                            request.phone ||
                            "N/A"
                          }
                        />

                        <Detail
                          label="Bank Name"
                          value={
                            request.bankName ||
                            "N/A"
                          }
                        />

                        <Detail
                          label="Account Number"
                          value={
                            request.accountNumber ||
                            "N/A"
                          }
                        />

                        <Detail
                          label="Withdrawal Amount"
                          value={`PKR ${Number(
                            request.amount ||
                              0
                          ).toLocaleString()}`}
                          highlight
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

                      {request.status ===
                        "Pending" && (
                        <div
                          style={{
                            display:
                              "flex",
                            gap: "10px",
                            marginTop:
                              "18px",
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
                              "14px",
                            color:
                              GREEN,
                            fontSize:
                              "13px",
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
                              "14px",
                            color:
                              RED,
                            fontSize:
                              "13px",
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
            ) : (
              <EmptyState
                icon="📭"
                title="No Withdraw Requests"
                text="There are currently no withdrawal requests."
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
                  gap: "14px",
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
                          `1px solid ${BORDER}`,
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
                          gap: "14px",
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
                              `1px solid ${BORDER}`,
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
                          value={`PKR ${Number(
                            user.balance ||
                              0
                          ).toLocaleString()}`}
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
          `1px solid ${BORDER}`,
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
              `1px solid ${BORDER}`,
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
          `1px solid ${BORDER}`,
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
          `1px solid ${BORDER}`,
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
            `1px solid ${BORDER}`,
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
          `1px solid ${BORDER}`,
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
            `1px solid ${BORDER}`,
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
            `1px solid ${BORDER}`,
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
          `1px solid ${BORDER}`,
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
            `1px solid ${BORDER}`,
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