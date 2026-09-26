"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const MIN_WITHDRAWAL = 50;
const MAX_WITHDRAWAL = 50000;

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

function getStorageArray(key) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getStorageObject(key) {
  try {
    const saved = localStorage.getItem(key);

    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage errors.
  }
}

export default function Withdraw() {
  const [user, setUser] = useState(null);

  const [withdrawableReturns, setWithdrawableReturns] =
    useState(0);

  const [withdrawRequests, setWithdrawRequests] =
    useState([]);

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] =
    useState("");

  const [withdrawAmount, setWithdrawAmount] =
    useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [isMobile, setIsMobile] =
    useState(false);

  /* =========================
     MOBILE
  ========================= */

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();

    window.addEventListener(
      "resize",
      checkMobile
    );

    return () => {
      window.removeEventListener(
        "resize",
        checkMobile
      );
    };
  }, []);

  /* =========================
     LOAD USER + DATA
  ========================= */

  useEffect(() => {
    const loadWithdrawData = async () => {
      try {
        const loggedIn =
          localStorage.getItem(
            "transportLoggedIn"
          );

        if (loggedIn !== "true") {
          window.location.href = "/login";
          return;
        }

        let storedUser =
          getStorageObject("transportUser");

        if (!storedUser) {
          storedUser =
            getStorageObject(
              "transportCurrentUser"
            );
        }

        if (!storedUser) {
          window.location.href = "/login";
          return;
        }

        const phone = normalizePhone(
          storedUser.phone
        );

        const displayName =
          storedUser.fullName ||
          storedUser.name ||
          storedUser.username ||
          "User";

        const normalizedUser = {
          ...storedUser,
          fullName: displayName,
          name: displayName,
          phone,
        };

        setUser(normalizedUser);

        saveStorage(
          "transportUser",
          normalizedUser
        );

        /* =========================
           SUPABASE USER BALANCE
        ========================= */

        const {
          data: userData,
          error: userError,
        } = await supabase
          .from("users")
          .select(
            "id, full_name, phone, withdrawable_returns, balance"
          )
          .eq("phone", phone)
          .maybeSingle();

        let availableReturns = Number(
          localStorage.getItem(
            "transportWithdrawableReturns_" +
              phone
          ) || 0
        );

        if (!userError && userData) {
          availableReturns = Number(
            userData.withdrawable_returns || 0
          );

          const updatedUser = {
            ...normalizedUser,
            fullName:
              userData.full_name ||
              normalizedUser.fullName,
            name:
              userData.full_name ||
              normalizedUser.name,
            phone:
              userData.phone || phone,
            balance: Number(
              userData.balance || 0
            ),
            withdrawableReturns:
              availableReturns,
          };

          setUser(updatedUser);

          saveStorage(
            "transportUser",
            updatedUser
          );

          localStorage.setItem(
            "transportWithdrawableReturns_" +
              phone,
            String(availableReturns)
          );
        }

        setWithdrawableReturns(
          availableReturns
        );

        /* =========================
           SUPABASE WITHDRAW REQUESTS
        ========================= */

        const {
          data: dbRequests,
          error: requestError,
        } = await supabase
          .from("withdraw_requests")
          .select("*")
          .eq("user_phone", phone)
          .order("created_at", {
            ascending: false,
          });

        if (!requestError) {
          const normalizedRequests =
            (dbRequests || []).map((item) => ({
              id: item.id,
              fullName:
                item.full_name ||
                item.user_data?.fullName ||
                item.user_data?.name ||
                displayName,
              phone:
                item.user_phone ||
                phone,
              bankName:
                item.bank_name || "",
              accountNumber:
                item.account_number || "",
              amount: Number(
                item.amount || 0
              ),
              returnType:
                item.return_type || "Weekly",
              withdrawableBalance:
                Number(
                  item.withdrawable_balance || 0
                ),
              availableBalanceAtRequest:
                Number(
                  item.available_balance_at_request ||
                    0
                ),
              status:
                item.status || "Pending",
              submittedAt:
                item.submitted_at ||
                item.created_at,
              createdAt:
                item.created_at ||
                item.submitted_at,
              updatedAt:
                item.updated_at ||
                item.created_at,
            }));

          setWithdrawRequests(
            normalizedRequests
          );

          /* Keep local compatibility */
          saveStorage(
            "transportWithdrawRequests",
            normalizedRequests
          );

          saveStorage(
            "transportWithdrawRequests_" +
              phone,
            normalizedRequests
          );
        } else {
          /* =========================
             LOCAL FALLBACK
          ========================= */

          const localRequests =
            getStorageArray(
              "transportWithdrawRequests_" +
                phone
            );

          const globalRequests =
            getStorageArray(
              "transportWithdrawRequests"
            );

          const matchingGlobal =
            globalRequests.filter(
              (item) =>
                normalizePhone(
                  item.phone
                ) === phone
            );

          const fallbackRequests =
            localRequests.length >
            0
              ? localRequests
              : matchingGlobal;

          setWithdrawRequests(
            fallbackRequests
          );
        }

        setLoading(false);
      } catch (error) {
        console.error(
          "Withdraw load error:",
          error
        );

        setLoading(false);
      }
    };

    loadWithdrawData();
  }, []);

  /* =========================
     PENDING AMOUNT
  ========================= */

  const pendingAmount = useMemo(() => {
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

  /* =========================
     AVAILABLE FOR NEW
  ========================= */

  const availableForNewWithdrawal =
    Math.max(
      0,
      Number(withdrawableReturns || 0) -
        Number(pendingAmount || 0)
    );

  /* =========================
     SUBMIT WITHDRAWAL
  ========================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!user) {
      setMessage(
        "User information could not be loaded."
      );

      setMessageType("error");

      return;
    }

    const cleanBankName =
      bankName.trim();

    const cleanAccountNumber =
      accountNumber.trim();

    const amount = Number(
      withdrawAmount
    );

    const phone = normalizePhone(
      user.phone
    );

    const fullName =
      user.fullName ||
      user.name ||
      "User";

    /* =========================
       VALIDATION
    ========================= */

    if (!cleanBankName) {
      setMessage(
        "Please enter your bank name."
      );

      setMessageType("error");

      return;
    }

    if (!cleanAccountNumber) {
      setMessage(
        "Please enter your account number."
      );

      setMessageType("error");

      return;
    }

    if (
      !amount ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setMessage(
        "Please enter a valid withdrawal amount."
      );

      setMessageType("error");

      return;
    }

    if (amount < MIN_WITHDRAWAL) {
      setMessage(
        `Minimum withdrawal amount is PKR ${formatMoney(
          MIN_WITHDRAWAL
        )}.`
      );

      setMessageType("error");

      return;
    }

    if (amount > MAX_WITHDRAWAL) {
      setMessage(
        `Maximum withdrawal amount is PKR ${formatMoney(
          MAX_WITHDRAWAL
        )}.`
      );

      setMessageType("error");

      return;
    }

    setSubmitting(true);

    try {
      /* =========================
         GET LATEST BALANCE
      ========================= */

      const {
        data: latestUser,
        error: latestUserError,
      } = await supabase
        .from("users")
        .select(
          "id, full_name, phone, withdrawable_returns"
        )
        .eq("phone", phone)
        .maybeSingle();

      if (
        latestUserError ||
        !latestUser
      ) {
        setMessage(
          "Your account balance could not be verified. Please try again."
        );

        setMessageType("error");

        setSubmitting(false);

        return;
      }

      const latestWithdrawable =
        Number(
          latestUser.withdrawable_returns ||
            0
        );

      /* =========================
         GET LATEST PENDING REQUESTS
      ========================= */

      const {
        data: latestRequests,
        error: latestRequestsError,
      } = await supabase
        .from("withdraw_requests")
        .select(
          "id, amount, status, user_phone"
        )
        .eq("user_phone", phone)
        .eq("status", "Pending");

      if (latestRequestsError) {
        setMessage(
          "Withdrawal requests could not be checked. Please try again."
        );

        setMessageType("error");

        setSubmitting(false);

        return;
      }

      const latestPendingAmount =
        (latestRequests || []).reduce(
          (total, item) =>
            total +
            Number(item.amount || 0),
          0
        );

      const latestAvailable =
        Math.max(
          0,
          latestWithdrawable -
            latestPendingAmount
        );

      /* =========================
         FINAL BALANCE CHECK
      ========================= */

      if (amount > latestAvailable) {
        setMessage(
          `Insufficient available balance. You can request up to PKR ${formatMoney(
            latestAvailable
          )}.`
        );

        setMessageType("error");

        setSubmitting(false);

        setWithdrawableReturns(
          latestWithdrawable
        );

        return;
      }

      /* =========================
         REQUEST OBJECT
      ========================= */

      const requestId =
        "withdraw-" +
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 8);

      const now =
        new Date().toISOString();

      const request = {
        id: requestId,

        userData: {
          ...user,
          fullName,
          phone,
        },

        fullName,

        phone,

        userPhone: phone,

        bankName:
          cleanBankName,

        accountNumber:
          cleanAccountNumber,

        amount,

        returnType: "Weekly",

        withdrawableBalance:
          latestWithdrawable,

        availableBalanceAtRequest:
          latestAvailable,

        status: "Pending",

        submittedAt: now,

        createdAt: now,

        updatedAt: now,
      };

      /* =========================
         INSERT INTO SUPABASE
      ========================= */

      const { error: insertError } =
        await supabase
          .from("withdraw_requests")
          .insert([
            {
              id: requestId,

              user_data:
                request.userData,

              user_phone: phone,

              full_name: fullName,

              bank_name:
                cleanBankName,

              account_number:
                cleanAccountNumber,

              amount,

              return_type: "Weekly",

              withdrawable_balance:
                latestWithdrawable,

              available_balance_at_request:
                latestAvailable,

              status: "Pending",

              submitted_at: now,

              created_at: now,

              updated_at: now,
            },
          ]);

      if (insertError) {
        console.error(
          "Withdraw insert error:",
          insertError
        );

        setMessage(
          "Withdrawal request could not be submitted. Please try again."
        );

        setMessageType("error");

        setSubmitting(false);

        return;
      }

      /* =========================
         UPDATE UI REQUESTS
      ========================= */

      const updatedRequests = [
        request,
        ...withdrawRequests,
      ];

      setWithdrawRequests(
        updatedRequests
      );

      saveStorage(
        "transportWithdrawRequests",
        updatedRequests
      );

      saveStorage(
        "transportWithdrawRequests_" +
          phone,
        updatedRequests
      );

      saveStorage(
        "transportWithdrawRequest_" +
          phone,
        request
      );

      saveStorage(
        "transportWithdrawRequest",
        request
      );

      /* =========================
         TRANSACTION COMPATIBILITY
      ========================= */

      const transactionKey =
        "transportTransactions_" +
        phone;

      const transactions =
        getStorageArray(
          transactionKey
        );

      const transaction = {
        id: requestId,

        type: "withdraw",

        title: "Withdrawal",

        amount,

        bankName:
          cleanBankName,

        accountNumber:
          cleanAccountNumber,

        returnType: "Weekly",

        status: "Pending",

        date: now,

        createdAt: now,

        submittedAt: now,
      };

      transactions.unshift(
        transaction
      );

      saveStorage(
        transactionKey,
        transactions
      );

      /* Global compatibility */
      const globalTransactions =
        getStorageArray(
          "transportTransactions"
        );

      globalTransactions.unshift(
        transaction
      );

      saveStorage(
        "transportTransactions",
        globalTransactions
      );

      /* =========================
         SUCCESS
      ========================= */

      setMessage(
        "Withdrawal request submitted successfully. Your request is now pending approval."
      );

      setMessageType("success");

      setBankName("");
      setAccountNumber("");
      setWithdrawAmount("");

      /* Pending amount changed,
         withdrawable balance itself
         stays unchanged until approval. */
    } catch (error) {
      console.error(
        "Withdrawal submit error:",
        error
      );

      setMessage(
        "Something went wrong while submitting your withdrawal request."
      );

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>
            💸
          </div>

          <div style={styles.loadingTitle}>
            Transport Hub
          </div>

          <div style={styles.loadingText}>
            Loading withdrawal details...
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     PAGE
  ========================= */

  return (
    <div
      style={{
        ...styles.page,
        ...(isMobile
          ? styles.mobilePage
          : {}),
      }}
    >
      <div
        style={{
          ...styles.container,
          ...(isMobile
            ? styles.mobileContainer
            : {}),
        }}
      >
        {/* =========================
            HEADER
        ========================= */}

        <div
          style={{
            ...styles.header,
            ...(isMobile
              ? styles.mobileHeader
              : {}),
          }}
        >
          <div>
            <h1 style={styles.title}>
              Withdraw Returns
            </h1>

            <p style={styles.subtitle}>
              Withdraw your available weekly
              returns securely.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/";
            }}
            style={{
              ...styles.dashboardButton,
              ...(isMobile
                ? styles.mobileDashboardButton
                : {}),
            }}
          >
            🏠 Dashboard
          </button>
        </div>

        {/* =========================
            BALANCE CARDS
        ========================= */}

        <div
          style={{
            ...styles.balanceGrid,
            ...(isMobile
              ? styles.mobileBalanceGrid
              : {}),
          }}
        >
          <div
            style={{
              ...styles.balanceCard,
              ...styles.greenBalanceCard,
            }}
          >
            <div style={styles.balanceIcon}>
              💰
            </div>

            <div style={styles.balanceLabel}>
              Withdrawable Returns
            </div>

            <div style={styles.balanceValue}>
              PKR{" "}
              {formatMoney(
                withdrawableReturns
              )}
            </div>
          </div>

          <div
            style={{
              ...styles.balanceCard,
              ...styles.orangeBalanceCard,
            }}
          >
            <div style={styles.balanceIcon}>
              ⏳
            </div>

            <div style={styles.balanceLabel}>
              Pending Withdrawals
            </div>

            <div style={styles.balanceValue}>
              PKR{" "}
              {formatMoney(
                pendingAmount
              )}
            </div>
          </div>

          <div
            style={{
              ...styles.balanceCard,
              ...styles.blueBalanceCard,
            }}
          >
            <div style={styles.balanceIcon}>
              ✅
            </div>

            <div style={styles.balanceLabel}>
              Available for New Withdrawal
            </div>

            <div style={styles.balanceValue}>
              PKR{" "}
              {formatMoney(
                availableForNewWithdrawal
              )}
            </div>
          </div>
        </div>

        {/* =========================
            WITHDRAW FORM
        ========================= */}

        <section style={styles.formCard}>
          <div style={styles.sectionHeading}>
            <div>
              <h2 style={styles.sectionTitle}>
                Withdrawal Details
              </h2>

              <p style={styles.sectionSubtitle}>
                Enter your bank details and
                withdrawal amount below.
              </p>
            </div>

            <div style={styles.weeklyBadge}>
              🎁 Weekly Returns
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            <div
              style={{
                ...styles.formGrid,
                ...(isMobile
                  ? styles.mobileFormGrid
                  : {}),
              }}
            >
              {/* FULL NAME */}

              <div style={styles.field}>
                <label
                  style={styles.label}
                >
                  Full Name
                </label>

                <input
                  type="text"
                  value={
                    user?.fullName ||
                    user?.name ||
                    ""
                  }
                  readOnly
                  style={{
                    ...styles.input,
                    ...styles.readOnlyInput,
                  }}
                />
              </div>

              {/* MOBILE */}

              <div style={styles.field}>
                <label
                  style={styles.label}
                >
                  Mobile Number
                </label>

                <input
                  type="text"
                  value={
                    user?.phone || ""
                  }
                  readOnly
                  style={{
                    ...styles.input,
                    ...styles.readOnlyInput,
                  }}
                />
              </div>

              {/* BANK NAME */}

              <div style={styles.field}>
                <label
                  style={styles.label}
                >
                  Bank Name
                </label>

                <input
                  type="text"
                  value={bankName}
                  onChange={(event) =>
                    setBankName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your bank name"
                  style={styles.input}
                />
              </div>

              {/* ACCOUNT NUMBER */}

              <div style={styles.field}>
                <label
                  style={styles.label}
                >
                  Account Number
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    accountNumber
                  }
                  onChange={(event) =>
                    setAccountNumber(
                      event.target.value
                    )
                  }
                  placeholder="Enter your account number"
                  style={styles.input}
                />
              </div>

              {/* AMOUNT */}

              <div
                style={{
                  ...styles.field,
                  gridColumn:
                    isMobile
                      ? "auto"
                      : "1 / -1",
                }}
              >
                <label
                  style={styles.label}
                >
                  Withdrawal Amount
                </label>

                <div
                  style={
                    styles.amountInputWrap
                  }
                >
                  <span
                    style={
                      styles.amountPrefix
                    }
                  >
                    PKR
                  </span>

                  <input
                    type="number"
                    min={
                      MIN_WITHDRAWAL
                    }
                    max={
                      MAX_WITHDRAWAL
                    }
                    step="1"
                    value={
                      withdrawAmount
                    }
                    onChange={(event) =>
                      setWithdrawAmount(
                        event.target.value
                      )
                    }
                    placeholder="Enter withdrawal amount"
                    style={
                      styles.amountInput
                    }
                  />
                </div>

                <div
                  style={
                    styles.amountHint
                  }
                >
                  Minimum PKR{" "}
                  {formatMoney(
                    MIN_WITHDRAWAL
                  )}{" "}
                  • Maximum PKR{" "}
                  {formatMoney(
                    MAX_WITHDRAWAL
                  )}
                </div>
              </div>
            </div>

            {/* MESSAGE */}

            {message && (
              <div
                style={{
                  ...styles.message,
                  ...(messageType ===
                  "success"
                    ? styles.successMessage
                    : styles.errorMessage),
                }}
              >
                <span>
                  {messageType ===
                  "success"
                    ? "✅"
                    : "⚠️"}
                </span>

                <span>
                  {message}
                </span>
              </div>
            )}

            {/* BUTTON */}

            <button
              type="submit"
              disabled={
                submitting ||
                availableForNewWithdrawal <
                  MIN_WITHDRAWAL
              }
              style={{
                ...styles.submitButton,
                ...(submitting ||
                availableForNewWithdrawal <
                  MIN_WITHDRAWAL
                  ? styles.disabledButton
                  : {}),
              }}
            >
              {submitting
                ? "Submitting..."
                : "💸 Submit Withdrawal Request"}
            </button>
          </form>
        </section>

        {/* =========================
            INFO CARD
        ========================= */}

        <section style={styles.infoCard}>
          <div style={styles.infoIcon}>
            ℹ️
          </div>

          <div>
            <div style={styles.infoTitle}>
              Withdrawal Information
            </div>

            <div style={styles.infoText}>
              Your withdrawal request will remain
              Pending until it is reviewed and
              approved. Pending withdrawal amounts
              are reserved so they cannot be
              requested again.
            </div>
          </div>
        </section>

        {/* =========================
            RECENT REQUESTS
        ========================= */}

        <section style={styles.historyCard}>
          <div
            style={styles.historyHeader}
          >
            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                Recent Withdrawal Requests
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Your latest withdrawal activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/withdraw-history";
              }}
              style={
                styles.historyButton
              }
            >
              View History →
            </button>
          </div>

          {withdrawRequests.length ===
          0 ? (
            <div
              style={styles.emptyState}
            >
              No withdrawal requests yet.
            </div>
          ) : (
            <div>
              {withdrawRequests
                .slice(0, 5)
                .map((item) => {
                  const status =
                    String(
                      item.status ||
                        "Pending"
                    ).toLowerCase();

                  return (
                    <div
                      key={item.id}
                      style={{
                        ...styles.requestRow,
                        ...(isMobile
                          ? styles.mobileRequestRow
                          : {}),
                      }}
                    >
                      <div
                        style={
                          styles.requestIcon
                        }
                      >
                        💸
                      </div>

                      <div
                        style={
                          styles.requestInfo
                        }
                      >
                        <div
                          style={
                            styles.requestTitle
                          }
                        >
                          Withdrawal
                        </div>

                        <div
                          style={
                            styles.requestMeta
                          }
                        >
                          {item.bankName ||
                            "Bank Transfer"}
                          {" • "}
                          {item.accountNumber ||
                            "N/A"}
                        </div>

                        <div
                          style={
                            styles.requestDate
                          }
                        >
                          {item.submittedAt
                            ? new Date(
                                item.submittedAt
                              ).toLocaleString()
                            : "Recently"}
                        </div>
                      </div>

                      <div
                        style={
                          styles.requestAmount
                        }
                      >
                        PKR{" "}
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
                            ? styles.approvedBadge
                            : status ===
                              "rejected"
                            ? styles.rejectedBadge
                            : styles.pendingBadge),
                        }}
                      >
                        {String(
                          item.status ||
                            "Pending"
                        ).toUpperCase()}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </div>

      {/* =========================
          STYLES
      ========================= */}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .withdrawPage {
          width: 100%;
        }

        @media (max-width: 768px) {
          input,
          button {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
}

/* =========================
   STYLES OBJECT
========================= */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #eef3f7 0%, #f7fafc 50%, #edf3f8 100%)",
    color: "#173b5a",
    padding: "30px",
  },

  mobilePage: {
    padding: "18px 12px 24px",
  },

  container: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  mobileContainer: {
    width: "100%",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "24px",
  },

  mobileHeader: {
    alignItems: "flex-start",
    flexDirection: "column",
  },

  title: {
    margin: 0,
    color: "#102a43",
    fontSize: "32px",
    fontWeight: 800,
    lineHeight: 1.15,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6b7c8f",
    fontSize: "15px",
    lineHeight: 1.5,
  },

  dashboardButton: {
    border: 0,
    borderRadius: "11px",
    padding: "12px 16px",
    background:
      "linear-gradient(135deg, #102a43, #173b5a)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(16, 42, 67, 0.16)",
    whiteSpace: "nowrap",
  },

  mobileDashboardButton: {
    width: "100%",
  },

  balanceGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },

  mobileBalanceGrid: {
    gridTemplateColumns: "1fr",
    gap: "12px",
  },

  balanceCard: {
    borderRadius: "18px",
    padding: "21px",
    color: "#ffffff",
    boxShadow:
      "0 12px 28px rgba(16, 42, 67, 0.12)",
    border:
      "1px solid rgba(255,255,255,0.18)",
  },

  greenBalanceCard: {
    background:
      "linear-gradient(135deg, #126b3b, #1d8a50)",
  },

  orangeBalanceCard: {
    background:
      "linear-gradient(135deg, #d97706, #f59e0b)",
  },

  blueBalanceCard: {
    background:
      "linear-gradient(135deg, #1769aa, #2c82c9)",
  },

  balanceIcon: {
    fontSize: "25px",
    marginBottom: "10px",
  },

  balanceLabel: {
    fontSize: "13px",
    fontWeight: 700,
    opacity: 0.92,
  },

  balanceValue: {
    marginTop: "7px",
    fontSize: "26px",
    fontWeight: 900,
    letterSpacing: "0.2px",
  },

  formCard: {
    background:
      "linear-gradient(135deg, #102a43, #173b5a)",
    borderRadius: "18px",
    padding: "24px",
    marginBottom: "22px",
    color: "#ffffff",
    border:
      "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 14px 32px rgba(16, 42, 67, 0.16)",
  },

  sectionHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "22px",
  },

  sectionTitle: {
    margin: 0,
    color: "#102a43",
    fontSize: "21px",
    fontWeight: 800,
  },

  formCardSectionTitle: {
    color: "#ffffff",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#7a8b9c",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  weeklyBadge: {
    padding: "9px 13px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.10)",
    color: "#d9f99d",
    border:
      "1px solid rgba(255,255,255,0.14)",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  form: {
    width: "100%",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },

  mobileFormGrid: {
    gridTemplateColumns: "1fr",
    gap: "15px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 800,
  },

  input: {
    width: "100%",
    height: "48px",
    border:
      "1px solid #d7e1e8",
    borderRadius: "10px",
    padding: "0 14px",
    outline: "none",
    background: "#ffffff",
    color: "#173b5a",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  readOnlyInput: {
    background: "#edf2f6",
    color: "#52667a",
  },

  amountInputWrap: {
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    borderRadius: "10px",
    overflow: "hidden",
    border:
      "1px solid #d7e1e8",
  },

  amountPrefix: {
    height: "48px",
    display: "flex",
    alignItems: "center",
    padding: "0 13px",
    background: "#eef2f5",
    color: "#173b5a",
    fontSize: "14px",
    fontWeight: 900,
    borderRight:
      "1px solid #d7e1e8",
  },

  amountInput: {
    flex: 1,
    width: "100%",
    height: "48px",
    border: 0,
    outline: "none",
    padding: "0 14px",
    background: "#ffffff",
    color: "#173b5a",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  amountHint: {
    color: "#b8c7d6",
    fontSize: "12px",
  },

  message: {
    marginTop: "20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    lineHeight: 1.5,
    fontWeight: 700,
  },

  successMessage: {
    background:
      "rgba(46, 161, 82, 0.16)",
    color: "#c8f7d2",
    border:
      "1px solid rgba(115, 214, 132, 0.22)",
  },

  errorMessage: {
    background:
      "rgba(220, 53, 69, 0.15)",
    color: "#ffd4d9",
    border:
      "1px solid rgba(255, 120, 135, 0.20)",
  },

  submitButton: {
    width: "100%",
    minHeight: "52px",
    marginTop: "20px",
    border: 0,
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #7fbf2f, #5ca72a)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 10px 22px rgba(92, 167, 42, 0.22)",
  },

  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
    boxShadow: "none",
  },

  infoCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "22px",
    border:
      "1px solid #dce5ec",
    boxShadow:
      "0 10px 28px rgba(16,42,67,0.07)",
  },

  infoIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e9f2fb",
    fontSize: "22px",
    flexShrink: 0,
  },

  infoTitle: {
    color: "#102a43",
    fontSize: "15px",
    fontWeight: 900,
    marginBottom: "5px",
  },

  infoText: {
    color: "#64778a",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  historyCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    border:
      "1px solid #dce5ec",
    boxShadow:
      "0 10px 28px rgba(16,42,67,0.07)",
  },

  historyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "18px",
  },

  historyButton: {
    border: 0,
    background: "#eff7f1",
    color: "#2f8140",
    borderRadius: "10px",
    padding: "10px 13px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  emptyState: {
    padding: "24px 12px",
    textAlign: "center",
    color: "#7c8c9c",
    fontSize: "14px",
  },

  requestRow: {
    display: "grid",
    gridTemplateColumns:
      "46px minmax(0, 1fr) auto auto",
    alignItems: "center",
    gap: "14px",
    padding: "15px 0",
    borderBottom:
      "1px solid #edf1f4",
  },

  mobileRequestRow: {
    gridTemplateColumns:
      "42px minmax(0, 1fr)",
    alignItems: "start",
  },

  requestIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff1e4",
    fontSize: "19px",
  },

  requestInfo: {
    minWidth: 0,
  },

  requestTitle: {
    color: "#173b5a",
    fontSize: "14px",
    fontWeight: 900,
  },

  requestMeta: {
    color: "#6d8092",
    fontSize: "12px",
    marginTop: "3px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  requestDate: {
    color: "#94a1ae",
    fontSize: "11px",
    marginTop: "4px",
  },

  requestAmount: {
    color: "#173b5a",
    fontSize: "14px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "82px",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.4px",
    whiteSpace: "nowrap",
  },

  pendingBadge: {
    background: "#fff4db",
    color: "#9a6a12",
  },

  approvedBadge: {
    background: "#e7f7eb",
    color: "#2f8a42",
  },

  rejectedBadge: {
    background: "#fde9eb",
    color: "#bd3d4d",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #eef3f7 0%, #f7fafc 50%, #edf3f8 100%)",
    padding: "20px",
  },

  loadingCard: {
    width: "100%",
    maxWidth: "360px",
    textAlign: "center",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "32px 24px",
    border:
      "1px solid #dce5ec",
    boxShadow:
      "0 14px 35px rgba(16,42,67,0.10)",
  },

  loadingIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },

  loadingTitle: {
    color: "#102a43",
    fontSize: "20px",
    fontWeight: 900,
  },

  loadingText: {
    marginTop: "7px",
    color: "#718396",
    fontSize: "13px",
  },
};