"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function DepositHistoryPage() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizePhone = (value) => {
    let phone = String(value || "").trim();

    phone = phone.replace(/\s+/g, "");

    if (phone.startsWith("+92")) {
      phone = "0" + phone.slice(3);
    } else if (phone.startsWith("0092")) {
      phone = "0" + phone.slice(4);
    }

    return phone;
  };

  const normalizeText = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase();
  };

  const phonesMatch = (value1, value2) => {
    const a = normalizePhone(value1);
    const b = normalizePhone(value2);

    if (!a || !b) return false;

    if (a === b) return true;

    const digitsA = a.replace(/\D/g, "");
    const digitsB = b.replace(/\D/g, "");

    if (digitsA === digitsB) return true;

    if (
      digitsA.length >= 10 &&
      digitsB.length >= 10 &&
      digitsA.slice(-10) === digitsB.slice(-10)
    ) {
      return true;
    }

    return false;
  };

  const convertSupabaseRow = (row) => {
    const rowUser =
      row.user_data &&
      typeof row.user_data === "object"
        ? row.user_data
        : {};

    const rowPlan =
      row.plan &&
      typeof row.plan === "object"
        ? row.plan
        : {};

    return {
      id: row.id,
      requestId: row.id,

      status:
        row.status ||
        "Pending",

      amount:
        row.deposit_amount ??
        rowPlan.amount ??
        rowPlan.price ??
        0,

      price:
        row.deposit_amount ??
        rowPlan.amount ??
        rowPlan.price ??
        0,

      depositAmount:
        row.deposit_amount ??
        0,

      plan: rowPlan,

      planName:
        rowPlan.name ||
        row.plan_name ||
        "Transport Plan",

      paymentMethod:
        row.payment_method ||
        "—",

      paymentMethodId:
        row.payment_method_id ||
        "",

      accountName:
        row.account_name ||
        "",

      accountNumber:
        row.account_number ||
        "",

      bankName:
        row.bank_name ||
        "",

      transactionId:
        row.transaction_id ||
        "",

      screenshot:
        row.screenshot ||
        "",

      screenshotName:
        row.screenshot_name ||
        "",

      submittedAt:
        row.created_at ||
        "",

      createdAt:
        row.created_at ||
        "",

      updatedAt:
        row.updated_at ||
        "",

      userPhone:
        rowUser.phone ||
        rowUser.mobile ||
        rowUser.phoneNumber ||
        rowUser.username ||
        row.phone ||
        row.mobile ||
        row.phoneNumber ||
        row.userPhone ||
        "",

      user: rowUser,
    };
  };

  useEffect(() => {
    const loadDepositHistory = async () => {
      const loggedIn =
        localStorage.getItem(
          "transportLoggedIn"
        );

      if (loggedIn !== "true") {
        window.location.href = "/login";
        return;
      }

      const userData =
        localStorage.getItem(
          "transportUser"
        );

      if (!userData) {
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(userData);

        const phone =
          user.phone ||
          user.mobile ||
          user.phoneNumber ||
          user.username;

        if (!phone) {
          setLoading(false);
          return;
        }

        const normalizedPhone =
          normalizePhone(phone);

        // =========================================================
        // 1. LOCAL HISTORY
        // =========================================================

        const userKey =
          `transportDepositRequests_${phone}`;

        const oldUserKey =
          `transportDepositRequest_${phone}`;

        let userDeposits = [];
        let oldUserDeposit = null;

        try {
          const saved =
            localStorage.getItem(userKey);

          if (saved) {
            const parsed =
              JSON.parse(saved);

            if (Array.isArray(parsed)) {
              userDeposits = parsed;
            }
          }
        } catch (error) {
          console.error(
            "Error reading local deposits:",
            error
          );
        }

        try {
          const saved =
            localStorage.getItem(oldUserKey);

          if (saved) {
            const parsed =
              JSON.parse(saved);

            if (parsed) {
              oldUserDeposit = parsed;
            }
          }
        } catch (error) {
          console.error(
            "Error reading old local deposit:",
            error
          );
        }

        const localRecords = [
          ...userDeposits,
          ...(oldUserDeposit
            ? [oldUserDeposit]
            : []),
        ];

        // =========================================================
        // 2. COLLECT LOCAL IDS + TRANSACTION IDS
        // =========================================================

        const localIds = new Set();

        const localTransactionIds =
          new Set();

        localRecords.forEach((deposit) => {
          if (
            deposit?.id ||
            deposit?.requestId
          ) {
            localIds.add(
              String(
                deposit.id ||
                  deposit.requestId
              )
            );
          }

          if (
            deposit?.transactionId ||
            deposit?.transaction_id
          ) {
            localTransactionIds.add(
              normalizeText(
                deposit.transactionId ||
                  deposit.transaction_id
              )
            );
          }
        });

        // =========================================================
        // 3. LOAD ALL SUPABASE DEPOSITS
        // =========================================================

        let supabaseDeposits = [];

        try {
          const {
            data,
            error,
          } = await supabase
            .from("deposit_requests")
            .select("*")
            .order("created_at", {
              ascending: false,
            });

          if (error) {
            console.error(
              "Supabase Deposit History Error:",
              error
            );
          } else if (Array.isArray(data)) {
            data.forEach((row) => {
              const rowUser =
                row.user_data &&
                typeof row.user_data === "object"
                  ? row.user_data
                  : {};

              const rowId =
                row.id
                  ? String(row.id)
                  : "";

              const rowTransactionId =
                normalizeText(
                  row.transaction_id
                );

              const rowPhone =
                rowUser.phone ||
                rowUser.mobile ||
                rowUser.phoneNumber ||
                rowUser.username ||
                row.phone ||
                row.mobile ||
                row.phoneNumber ||
                row.userPhone ||
                "";

              // =====================================================
              // EXACT MATCHES
              // =====================================================

              const idMatch =
                rowId &&
                localIds.has(rowId);

              const transactionMatch =
                rowTransactionId &&
                localTransactionIds.has(
                  rowTransactionId
                );

              const phoneMatch =
                phonesMatch(
                  rowPhone,
                  normalizedPhone
                );

              // =====================================================
              // IMPORTANT:
              // ID OR TRANSACTION ID OR PHONE
              // =====================================================

              if (
                idMatch ||
                transactionMatch ||
                phoneMatch
              ) {
                supabaseDeposits.push(
                  convertSupabaseRow(row)
                );
              }
            });
          }
        } catch (error) {
          console.error(
            "Error loading Supabase deposits:",
            error
          );
        }

        // =========================================================
        // 4. REMOVE DUPLICATE SUPABASE RECORDS
        // =========================================================

        const uniqueSupabaseMap =
          new Map();

        supabaseDeposits.forEach(
          (deposit) => {
            if (!deposit?.id) return;

            uniqueSupabaseMap.set(
              String(deposit.id),
              deposit
            );
          }
        );

        supabaseDeposits =
          Array.from(
            uniqueSupabaseMap.values()
          );

        // =========================================================
        // 5. MERGE LOCAL + SUPABASE
        //
        // SUPABASE ALWAYS WINS
        // =========================================================

        const mergedMap =
          new Map();

        userDeposits.forEach(
          (deposit, index) => {
            const key =
              deposit.id ||
              deposit.requestId ||
              (
                deposit.transactionId ||
                deposit.transaction_id ||
                `${deposit.amount || deposit.price || 0}-${
                  deposit.submittedAt ||
                  deposit.createdAt ||
                  deposit.date ||
                  index
                }`
              );

            mergedMap.set(
              String(key),
              deposit
            );
          }
        );

        if (oldUserDeposit) {
          const key =
            oldUserDeposit.id ||
            oldUserDeposit.requestId ||
            oldUserDeposit.transactionId ||
            oldUserDeposit.transaction_id ||
            `old-${
              oldUserDeposit.amount ||
              oldUserDeposit.price ||
              0
            }-${
              oldUserDeposit.submittedAt ||
              oldUserDeposit.createdAt ||
              oldUserDeposit.date ||
              "deposit"
            }`;

          mergedMap.set(
            String(key),
            oldUserDeposit
          );
        }

        // =========================================================
        // 6. OVERWRITE USING SUPABASE
        // =========================================================

        supabaseDeposits.forEach(
          (supabaseDeposit) => {
            const supabaseId =
              supabaseDeposit.id
                ? String(
                    supabaseDeposit.id
                  )
                : "";

            const supabaseTransaction =
              normalizeText(
                supabaseDeposit.transactionId
              );

            // Replace exact ID
            if (supabaseId) {
              mergedMap.set(
                supabaseId,
                supabaseDeposit
              );
            }

            // Also replace matching transaction ID
            if (
              supabaseTransaction
            ) {
              const keys =
                Array.from(
                  mergedMap.keys()
                );

              keys.forEach((key) => {
                const existing =
                  mergedMap.get(key);

                const existingTransaction =
                  normalizeText(
                    existing?.transactionId ||
                      existing?.transaction_id
                  );

                if (
                  existingTransaction &&
                  existingTransaction ===
                    supabaseTransaction
                ) {
                  mergedMap.set(
                    key,
                    supabaseDeposit
                  );
                }
              });
            }
          }
        );

        // =========================================================
        // 7. FINAL DEPOSITS
        // =========================================================

        const finalDeposits =
          Array.from(
            mergedMap.values()
          );

        finalDeposits.sort(
          (a, b) => {
            const dateA =
              new Date(
                a.updatedAt ||
                  a.submittedAt ||
                  a.createdAt ||
                  a.date ||
                  0
              ).getTime();

            const dateB =
              new Date(
                b.updatedAt ||
                  b.submittedAt ||
                  b.createdAt ||
                  b.date ||
                  0
              ).getTime();

            return dateB - dateA;
          }
        );

        // =========================================================
        // 8. SAVE LATEST VERSION LOCALLY
        // =========================================================

        try {
          localStorage.setItem(
            userKey,
            JSON.stringify(
              finalDeposits
            )
          );
        } catch (error) {
          console.error(
            "Error saving updated history:",
            error
          );
        }

        setDeposits(
          finalDeposits
        );
      } catch (error) {
        console.error(
          "Error loading deposit history:",
          error
        );
      }

      setLoading(false);
    };

    loadDepositHistory();
  }, []);

  const getStatusStyle = (
    status
  ) => {
    const normalizedStatus =
      String(
        status || "Pending"
      ).toLowerCase();

    if (
      normalizedStatus ===
      "approved"
    ) {
      return {
        background: "#dcfce7",
        color: "#166534",
        border:
          "1px solid #86efac",
      };
    }

    if (
      normalizedStatus ===
      "rejected"
    ) {
      return {
        background: "#fee2e2",
        color: "#991b1b",
        border:
          "1px solid #fca5a5",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
      border:
        "1px solid #fcd34d",
    };
  };

  const formatDate = (
    value
  ) => {
    if (!value) return "—";

    try {
      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return String(value);
      }

      return date.toLocaleString();
    } catch {
      return String(value);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div
          style={
            styles.loadingCard
          }
        >
          Loading deposit history...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Deposit History
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              View your deposit requests and their current status.
            </p>
          </div>
        </div>

        {deposits.length ===
        0 ? (
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
              💰
            </div>

            <h2
              style={
                styles.emptyTitle
              }
            >
              No Deposit History
            </h2>

            <p
              style={
                styles.emptyText
              }
            >
              Your deposit requests will appear here after you
              submit a deposit.
            </p>
          </div>
        ) : (
          <div
            style={
              styles.list
            }
          >
            {deposits.map(
              (
                deposit,
                index
              ) => {
                const status =
                  deposit.status ||
                  "Pending";

                const planName =
                  deposit.plan?.name ||
                  deposit.planName ||
                  deposit.name ||
                  "Transport Plan";

                const amount =
                  deposit.amount ??
                  deposit.price ??
                  deposit.depositAmount ??
                  deposit.plan?.amount ??
                  deposit.plan?.price ??
                  0;

                const paymentMethod =
                  deposit.paymentMethod ||
                  deposit.method ||
                  deposit.paymentType ||
                  "—";

                const bankName =
                  deposit.bankName ||
                  deposit.bank ||
                  "";

                return (
                  <div
                    key={
                      deposit.id ||
                      deposit.requestId ||
                      deposit.transactionId ||
                      `deposit-${index}`
                    }
                    style={
                      styles.card
                    }
                  >
                    <div
                      style={
                        styles.cardTop
                      }
                    >
                      <div>
                        <div
                          style={
                            styles.planLabel
                          }
                        >
                          TRANSPORT PLAN
                        </div>

                        <h2
                          style={
                            styles.planName
                          }
                        >
                          {planName}
                        </h2>
                      </div>

                      <div
                        style={{
                          ...styles.status,
                          ...getStatusStyle(
                            status
                          ),
                        }}
                      >
                        {status}
                      </div>
                    </div>

                    <div
                      style={
                        styles.divider
                      }
                    />

                    <div
                      style={
                        styles.infoGrid
                      }
                    >
                      <div
                        style={
                          styles.infoBox
                        }
                      >
                        <span
                          style={
                            styles.infoLabel
                          }
                        >
                          Amount
                        </span>

                        <strong
                          style={
                            styles.amount
                          }
                        >
                          PKR{" "}
                          {Number(
                            amount ||
                              0
                          ).toLocaleString()}
                        </strong>
                      </div>

                      <div
                        style={
                          styles.infoBox
                        }
                      >
                        <span
                          style={
                            styles.infoLabel
                          }
                        >
                          Payment Method
                        </span>

                        <strong
                          style={
                            styles.infoValue
                          }
                        >
                          {paymentMethod}
                        </strong>
                      </div>

                      {bankName ? (
                        <div
                          style={
                            styles.infoBox
                          }
                        >
                          <span
                            style={
                              styles.infoLabel
                            }
                          >
                            Bank
                          </span>

                          <strong
                            style={
                              styles.infoValue
                            }
                          >
                            {bankName}
                          </strong>
                        </div>
                      ) : null}

                      <div
                        style={
                          styles.infoBox
                        }
                      >
                        <span
                          style={
                            styles.infoLabel
                          }
                        >
                          Submitted
                        </span>

                        <strong
                          style={
                            styles.infoValue
                          }
                        >
                          {formatDate(
                            deposit.submittedAt ||
                              deposit.createdAt ||
                              deposit.date
                          )}
                        </strong>
                      </div>
                    </div>

                    {deposit.transactionId ? (
                      <div
                        style={
                          styles.transactionBox
                        }
                      >
                        <span
                          style={
                            styles.transactionLabel
                          }
                        >
                          Transaction ID
                        </span>

                        <strong
                          style={
                            styles.transactionId
                          }
                        >
                          {
                            deposit.transactionId
                          }
                        </strong>
                      </div>
                    ) : null}

                    {String(
                      status
                    ).toLowerCase() ===
                    "approved" ? (
                      <div
                        style={
                          styles.approvedMessage
                        }
                      >
                        ✅ Deposit approved successfully.
                      </div>
                    ) : null}

                    {String(
                      status
                    ).toLowerCase() ===
                    "rejected" ? (
                      <div
                        style={
                          styles.rejectedMessage
                        }
                      >
                        ❌ This deposit request was rejected.
                      </div>
                    ) : null}

                    {String(
                      status
                    ).toLowerCase() ===
                    "pending" ? (
                      <div
                        style={
                          styles.pendingMessage
                        }
                      >
                        ⏳ Your deposit is currently under review.
                      </div>
                    ) : null}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f7f1",
    padding: "24px",
    boxSizing: "border-box",
    color: "#173b2b",
    fontFamily:
      "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  header: {
    background: "#102A43",
    borderRadius: "16px",
    padding: "22px 24px",
    marginBottom: "20px",
    boxShadow:
      "0 8px 25px rgba(16,42,67,.12)",
  },

  title: {
    margin: 0,
    color: "#ffffff",
    fontSize: "25px",
    fontWeight: 900,
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#d9e8f5",
    fontSize: "13px",
  },

  list: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },

  card: {
    background: "#ffffff",
    border:
      "1px solid #dce8df",
    borderRadius: "16px",
    padding: "20px",
    boxShadow:
      "0 7px 22px rgba(23,59,43,.08)",
  },

  cardTop: {
    display: "flex",
    alignItems:
      "flex-start",
    justifyContent:
      "space-between",
    gap: "15px",
  },

  planLabel: {
    color: "#5d7a6a",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1px",
    marginBottom: "5px",
  },

  planName: {
    margin: 0,
    color: "#173b2b",
    fontSize: "20px",
    fontWeight: 900,
  },

  status: {
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  divider: {
    height: "1px",
    background: "#e6eee8",
    margin: "16px 0",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },

  infoBox: {
    background: "#f6faf7",
    border:
      "1px solid #e1ece4",
    borderRadius: "10px",
    padding: "12px",
  },

  infoLabel: {
    display: "block",
    color: "#718879",
    fontSize: "10px",
    fontWeight: 800,
    marginBottom: "5px",
    textTransform:
      "uppercase",
  },

  infoValue: {
    display: "block",
    color: "#173b2b",
    fontSize: "13px",
    fontWeight: 800,
    wordBreak:
      "break-word",
  },

  amount: {
    display: "block",
    color: "#2e6b4a",
    fontSize: "17px",
    fontWeight: 900,
  },

  transactionBox: {
    marginTop: "12px",
    background: "#eef7f0",
    border:
      "1px solid #d4e8d8",
    borderRadius: "10px",
    padding: "12px",
  },

  transactionLabel: {
    display: "block",
    color: "#718879",
    fontSize: "10px",
    fontWeight: 800,
    marginBottom: "5px",
    textTransform:
      "uppercase",
  },

  transactionId: {
    color: "#173b2b",
    fontSize: "13px",
    wordBreak:
      "break-all",
  },

  approvedMessage: {
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "9px",
    background: "#ecfdf3",
    border:
      "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "12px",
    fontWeight: 800,
  },

  rejectedMessage: {
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "9px",
    background: "#fff1f2",
    border:
      "1px solid #fecdd3",
    color: "#9f1239",
    fontSize: "12px",
    fontWeight: 800,
  },

  pendingMessage: {
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "9px",
    background: "#fffbeb",
    border:
      "1px solid #fde68a",
    color: "#92400e",
    fontSize: "12px",
    fontWeight: 800,
  },

  emptyCard: {
    background: "#ffffff",
    border:
      "1px solid #dce8df",
    borderRadius: "16px",
    padding: "45px 20px",
    textAlign: "center",
    boxShadow:
      "0 7px 22px rgba(23,59,43,.08)",
  },

  emptyIcon: {
    fontSize: "38px",
    marginBottom: "10px",
  },

  emptyTitle: {
    margin: 0,
    color: "#173b2b",
    fontSize: "19px",
    fontWeight: 900,
  },

  emptyText: {
    margin:
      "8px auto 0",
    maxWidth: "450px",
    color: "#718879",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  loadingCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "30px",
    textAlign: "center",
    color: "#173b2b",
    fontWeight: 800,
    boxShadow:
      "0 7px 22px rgba(23,59,43,.08)",
  },
};