"use client";

import { useEffect, useState } from "react";

const MIN_CASHOUT = 50;
const MAX_CASHOUT = 50000;

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

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

export default function Withdraw() {
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [withdrawableReturns, setWithdrawableReturns] =
    useState(0);

  const [pendingAmount, setPendingAmount] =
    useState(0);

  useEffect(() => {
    const loggedIn =
      localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      window.location.replace("/login");
      return;
    }

    const savedUser =
      readJSON("transportUser", null);

    if (!savedUser) {
      window.location.replace("/login");
      return;
    }

    setUser(savedUser);

    const phone =
      savedUser.phone ||
      savedUser.mobile ||
      savedUser.number ||
      "";

    if (!phone) {
      setLoading(false);
      return;
    }

    /*
      Weekly return balance is stored
      separately for every user.
    */

    const returnsKey =
      "transportWithdrawableReturns_" + phone;

    const savedReturns =
      localStorage.getItem(returnsKey);

    if (savedReturns !== null) {
      setWithdrawableReturns(
        Number(savedReturns) || 0
      );
    } else {
      setWithdrawableReturns(0);
    }

    /*
      Load withdrawal requests.
    */

    let requests =
      readJSON(
        "transportWithdrawRequests",
        []
      );

    if (!Array.isArray(requests)) {
      requests = [];
    }

    /*
      Old compatibility request.
    */

    const oldRequest =
      readJSON(
        "transportWithdrawRequest",
        null
      );

    if (oldRequest) {
      const oldId =
        oldRequest.id ||
        "withdraw-old-" +
          (oldRequest.submittedAt || Date.now());

      const alreadyExists =
        requests.some(
          (request) =>
            request.id === oldId ||
            (
              request.phone === oldRequest.phone &&
              request.amount === oldRequest.amount &&
              request.submittedAt ===
                oldRequest.submittedAt
            )
        );

      if (!alreadyExists) {
        requests.push({
          ...oldRequest,
          id: oldId,
        });
      }
    }

    /*
      Only show requests belonging
      to the currently logged-in user.
    */

    const userRequests =
      requests.filter(
        (request) =>
          String(request.phone || "") ===
          String(phone)
      );

    userRequests.sort(
      (a, b) =>
        new Date(
          b.submittedAt || b.createdAt || 0
        ) -
        new Date(
          a.submittedAt || a.createdAt || 0
        )
    );

    setWithdrawRequests(
      userRequests
    );

    /*
      Pending withdrawal amount is reserved.
    */

    const pendingTotal =
      userRequests
        .filter(
          (request) =>
            request.status === "Pending"
        )
        .reduce(
          (total, request) =>
            total +
            Number(request.amount || 0),
          0
        );

    setPendingAmount(
      pendingTotal
    );

    setLoading(false);
  }, []);

  /*
    Current user's total weekly return
    balance available in withdrawal wallet.
  */

  const availableReturns =
    Math.max(
      0,
      Number(withdrawableReturns || 0)
    );

  /*
    Pending requests are temporarily reserved.
  */

  const availableForNewWithdrawal =
    Math.max(
      0,
      availableReturns - pendingAmount
    );

  const latestRequest =
    withdrawRequests.length > 0
      ? withdrawRequests[0]
      : null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    setMessage("");
    setSubmitting(true);

    const withdrawAmount =
      Number(amount);

    const phone =
      user.phone ||
      user.mobile ||
      user.number ||
      "";

    const fullName =
      user.fullName ||
      user.name ||
      user.username ||
      "";

    if (!phone) {
      setMessage(
        "Your account mobile number could not be found."
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (
      !bankName.trim() ||
      !accountNumber.trim() ||
      !amount
    ) {
      setMessage(
        "Please fill in all withdrawal fields."
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (
      !Number.isFinite(withdrawAmount) ||
      withdrawAmount <= 0
    ) {
      setMessage(
        "Please enter a valid withdrawal amount."
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (
      withdrawAmount < MIN_CASHOUT
    ) {
      setMessage(
        "Minimum cashout amount is PKR " +
          formatMoney(MIN_CASHOUT) +
          "."
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (
      withdrawAmount > MAX_CASHOUT
    ) {
      setMessage(
        "Maximum cashout amount is PKR " +
          formatMoney(MAX_CASHOUT) +
          "."
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    if (
      withdrawAmount >
      availableForNewWithdrawal
    ) {
      setMessage(
        "You can withdraw up to PKR " +
          formatMoney(
            availableForNewWithdrawal
          ) +
          ". Your pending withdrawal amount is already reserved."
      );
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    const now =
      new Date().toISOString();

    const newRequest = {
      id:
        "withdraw-" +
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .slice(2, 8),

      fullName,

      phone,

      bankName:
        bankName.trim(),

      accountNumber:
        accountNumber.trim(),

      amount:
        withdrawAmount,

      /*
        Weekly return system information.
      */

      returnType:
        "Weekly",

      withdrawableBalance:
        availableReturns,

      availableBalanceAtRequest:
        availableForNewWithdrawal,

      status:
        "Pending",

      submittedAt:
        now,

      createdAt:
        now,

      updatedAt:
        now,
    };

    /*
      Save new request in global array.
    */

    const allRequests =
      readJSON(
        "transportWithdrawRequests",
        []
      );

    const requestList =
      Array.isArray(allRequests)
        ? allRequests
        : [];

    requestList.unshift(
      newRequest
    );

    saveJSON(
      "transportWithdrawRequests",
      requestList
    );

    /*
      Save current user's withdrawal history separately.
    */

    const userWithdrawKey =
      "transportWithdrawRequests_" +
      phone;

    const savedUserRequests =
      readJSON(
        userWithdrawKey,
        []
      );

    const userRequestList =
      Array.isArray(savedUserRequests)
        ? savedUserRequests
        : [];

    userRequestList.unshift(
      newRequest
    );

    saveJSON(
      userWithdrawKey,
      userRequestList
    );

    /*
      Keep old key for compatibility
      with existing Admin Panel / History.
    */

    saveJSON(
      "transportWithdrawRequest",
      newRequest
    );

    /*
      Update local state.
    */

    const updatedUserRequests =
      [
        newRequest,
        ...withdrawRequests,
      ];

    setWithdrawRequests(
      updatedUserRequests
    );

    setPendingAmount(
      pendingAmount + withdrawAmount
    );

    setMessage(
      "Withdrawal request submitted successfully. It is now pending admin verification."
    );

    setMessageType("success");

    setAmount("");
    setBankName("");
    setAccountNumber("");

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>
            💸
          </div>

          <div style={styles.loadingTitle}>
            Transport Hub
          </div>

          <div style={styles.loadingText}>
            Loading withdrawal page...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    user.fullName ||
    user.name ||
    user.username ||
    user.phone ||
    "User";

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div style={styles.headerIcon}>
            💸
          </div>

          <div style={{ flex: 1 }}>
            <div style={styles.headerWelcome}>
              {displayName}
            </div>

            <h1 style={styles.headerTitle}>
              Withdraw Funds
            </h1>

            <p style={styles.headerSubtitle}>
              Cash out your earned weekly returns
            </p>
          </div>
        </div>

        {/* EARNED RETURNS */}

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            🎁 Total Earned Returns
          </h2>

          <span style={styles.greenAmount}>
            PKR{" "}
            {formatMoney(
              availableReturns
            )}
          </span>

          <small style={styles.cardDescription}>
            Total weekly returns currently available
            in your withdrawal balance.
          </small>
        </div>

        {/* AVAILABLE */}

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            💰 Available for Withdrawal
          </h2>

          <span style={styles.greenAmount}>
            PKR{" "}
            {formatMoney(
              availableForNewWithdrawal
            )}
          </span>

          {pendingAmount > 0 && (
            <small style={styles.pendingBalanceText}>
              PKR{" "}
              {formatMoney(
                pendingAmount
              )}{" "}
              is currently reserved in pending withdrawals.
            </small>
          )}

          {pendingAmount === 0 && (
            <small style={styles.cardDescription}>
              You can cash out your earned weekly returns.
            </small>
          )}
        </div>

        {/* LIMITS */}

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            📌 Cashout Limits
          </h2>

          <div style={styles.limitsGrid}>

            <div style={styles.limitBox}>
              <span style={styles.limitLabel}>
                Minimum Cashout
              </span>

              <strong style={styles.limitValue}>
                PKR{" "}
                {formatMoney(
                  MIN_CASHOUT
                )}
              </strong>
            </div>

            <div style={styles.limitBox}>
              <span style={styles.limitLabel}>
                Maximum Cashout
              </span>

              <strong style={styles.limitValue}>
                PKR{" "}
                {formatMoney(
                  MAX_CASHOUT
                )}
              </strong>
            </div>

          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <div
            style={
              messageType === "success"
                ? styles.successMessage
                : styles.errorMessage
            }
          >
            <span>
              {messageType === "success"
                ? "✓"
                : "⚠️"}
            </span>

            <span>{message}</span>
          </div>
        )}

        {/* PENDING REQUEST */}

        {latestRequest &&
          latestRequest.status ===
            "Pending" && (
            <div style={styles.pendingCard}>

              <div style={styles.statusIcon}>
                ⏳
              </div>

              <h2 style={styles.pendingTitle}>
                Withdrawal Pending
              </h2>

              <span style={styles.statusText}>
                Your withdrawal request is waiting
                for admin verification.
              </span>

              <small style={styles.statusSmall}>
                Requested Amount: PKR{" "}
                {formatMoney(
                  latestRequest.amount
                )}
              </small>

              <small style={styles.statusSmall}>
                Bank:{" "}
                {latestRequest.bankName}
              </small>

              <small style={styles.statusSmall}>
                Submitted:{" "}
                {new Date(
                  latestRequest.submittedAt
                ).toLocaleString()}
              </small>

            </div>
          )}

        {/* APPROVED REQUEST */}

        {latestRequest &&
          latestRequest.status ===
            "Approved" && (
            <div style={styles.approvedCard}>

              <div style={styles.statusIcon}>
                ✅
              </div>

              <h2 style={styles.approvedTitle}>
                Withdrawal Approved
              </h2>

              <span style={styles.statusText}>
                Your withdrawal request has been
                approved by the admin.
              </span>

              <small style={styles.statusSmall}>
                Approved Amount: PKR{" "}
                {formatMoney(
                  latestRequest.amount
                )}
              </small>

              {latestRequest.updatedAt && (
                <small style={styles.statusSmall}>
                  Updated:{" "}
                  {new Date(
                    latestRequest.updatedAt
                  ).toLocaleString()}
                </small>
              )}

            </div>
          )}

        {/* REJECTED REQUEST */}

        {latestRequest &&
          latestRequest.status ===
            "Rejected" && (
            <div style={styles.rejectedCard}>

              <div style={styles.statusIcon}>
                ❌
              </div>

              <h2 style={styles.rejectedTitle}>
                Withdrawal Rejected
              </h2>

              <span style={styles.statusText}>
                Your previous withdrawal request
                was rejected. You can submit a
                new request if your balance is
                available.
              </span>

              {latestRequest.updatedAt && (
                <small style={styles.statusSmall}>
                  Updated:{" "}
                  {new Date(
                    latestRequest.updatedAt
                  ).toLocaleString()}
                </small>
              )}

            </div>
          )}

        {/* NO BALANCE */}

        {availableForNewWithdrawal <
          MIN_CASHOUT &&
          !(
            latestRequest &&
            latestRequest.status ===
              "Pending"
          ) && (
            <div style={styles.warningCard}>

              <div style={styles.warningIcon}>
                🔒
              </div>

              <h2 style={styles.warningTitle}>
                Cashout Not Available
              </h2>

              <span style={styles.warningText}>
                You need at least PKR{" "}
                {formatMoney(
                  MIN_CASHOUT
                )}{" "}
                available balance to make a withdrawal.
              </span>

              <small style={styles.warningSmall}>
                Available now: PKR{" "}
                {formatMoney(
                  availableForNewWithdrawal
                )}
              </small>

            </div>
          )}

        {/* WITHDRAWAL FORM */}

        {availableForNewWithdrawal >=
          MIN_CASHOUT && (
          <form
            onSubmit={handleSubmit}
            style={styles.formCard}
          >

            <h2 style={styles.formTitle}>
              💳 Withdrawal Details
            </h2>

            <p style={styles.formSubtitle}>
              Enter your bank details and withdrawal amount.
            </p>

            {/* FULL NAME */}

            <label style={styles.label}>
              Full Name
            </label>

            <input
              type="text"
              value={displayName}
              readOnly
              style={styles.readOnlyInput}
            />

            {/* PHONE */}

            <label style={styles.label}>
              Mobile Number
            </label>

            <input
              type="text"
              value={user.phone || ""}
              readOnly
              style={styles.readOnlyInput}
            />

            {/* BANK */}

            <label style={styles.label}>
              Bank Name
            </label>

            <input
              type="text"
              placeholder="Enter bank name"
              value={bankName}
              onChange={(e) =>
                setBankName(
                  e.target.value
                )
              }
              style={styles.input}
            />

            {/* ACCOUNT */}

            <label style={styles.label}>
              Account Number
            </label>

            <input
              type="text"
              placeholder="Enter account number"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(
                  e.target.value
                )
              }
              style={styles.input}
            />

            {/* AMOUNT */}

            <label style={styles.label}>
              Withdrawal Amount
            </label>

            <input
              type="number"
              min={MIN_CASHOUT}
              max={Math.min(
                MAX_CASHOUT,
                availableForNewWithdrawal
              )}
              placeholder={
                "Min PKR " +
                MIN_CASHOUT
              }
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              style={styles.amountInput}
            />

            <div style={styles.availableText}>
              Available to withdraw:{" "}
              <strong>
                PKR{" "}
                {formatMoney(
                  availableForNewWithdrawal
                )}
              </strong>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={
                submitting
                  ? styles.disabledSubmitButton
                  : styles.submitButton
              }
            >
              {submitting
                ? "Processing..."
                : "✓ Submit Withdrawal Request"}
            </button>

          </form>
        )}

        {/* BACK */}

        <button
          onClick={() => {
            window.location.href =
              "/";
          }}
          style={styles.dashboardButton}
        >
          ← Back to Dashboard
        </button>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef3f7",
    padding: "30px 20px 60px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
    color: "#ffffff",
  },

  container: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef3f7",
    fontFamily: "Arial, sans-serif",
  },

  loadingCard: {
    width: "280px",
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "18px",
    padding: "30px",
    textAlign: "center",
    boxSizing: "border-box",
  },

  loadingIcon: {
    fontSize: "35px",
    marginBottom: "10px",
  },

  loadingTitle: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 900,
  },

  loadingText: {
    color: "#9FB3C8",
    fontSize: "10px",
    marginTop: "6px",
  },

  header: {
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "20px",
    padding: "25px 27px",
    color: "#ffffff",
    boxShadow:
      "0 10px 28px rgba(16,42,67,0.16)",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    gap: "17px",
  },

  headerIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    flexShrink: 0,
  },

  headerWelcome: {
    color: "#8FD694",
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "3px",
  },

  headerTitle: {
    margin: 0,
    fontSize: "27px",
    fontWeight: 900,
    letterSpacing: "-0.4px",
    color: "#ffffff",
  },

  headerSubtitle: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#C9D8E6",
  },

  card: {
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "17px",
    padding: "20px 22px",
    marginBottom: "14px",
    boxShadow:
      "0 7px 20px rgba(16,42,67,0.10)",
  },

  cardTitle: {
    margin: "0 0 9px",
    fontSize: "15px",
    fontWeight: 800,
    color: "#ffffff",
  },

  greenAmount: {
    display: "block",
    fontSize: "26px",
    fontWeight: 900,
    color: "#8FD694",
  },

  cardDescription: {
    display: "block",
    marginTop: "5px",
    fontSize: "11px",
    lineHeight: "1.5",
    color: "#9FB3C8",
  },

  pendingBalanceText: {
    display: "block",
    marginTop: "6px",
    fontSize: "11px",
    lineHeight: "1.5",
    color: "#F4D77A",
  },

  limitsGrid: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "11px",
  },

  limitBox: {
    background: "#173B5A",
    border: "1px solid #294B66",
    borderRadius: "11px",
    padding: "12px 14px",
  },

  limitLabel: {
    display: "block",
    fontSize: "10px",
    color: "#9FB3C8",
    marginBottom: "5px",
  },

  limitValue: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#ffffff",
  },

  warningCard: {
    background: "#173B5A",
    border: "1px solid #294B66",
    borderRadius: "17px",
    padding: "20px 22px",
    marginBottom: "17px",
  },

  warningIcon: {
    fontSize: "25px",
    marginBottom: "6px",
  },

  warningTitle: {
    margin: "0 0 8px",
    fontSize: "16px",
    color: "#F4D77A",
    fontWeight: 900,
  },

  warningText: {
    display: "block",
    fontSize: "12px",
    lineHeight: "1.6",
    color: "#C9D8E6",
  },

  warningSmall: {
    display: "block",
    marginTop: "8px",
    color: "#9FB3C8",
    fontSize: "10px",
  },

  pendingCard: {
    background: "#173B5A",
    border: "1px solid #315674",
    borderRadius: "17px",
    padding: "20px 22px",
    marginBottom: "17px",
  },

  pendingTitle: {
    margin: "0 0 8px",
    fontSize: "16px",
    color: "#F4D77A",
    fontWeight: 900,
  },

  approvedCard: {
    background: "#173B5A",
    border: "1px solid #3D7050",
    borderRadius: "17px",
    padding: "20px 22px",
    marginBottom: "17px",
  },

  approvedTitle: {
    margin: "0 0 8px",
    fontSize: "16px",
    color: "#8FD694",
    fontWeight: 900,
  },

  rejectedCard: {
    background: "#173B5A",
    border: "1px solid #69414B",
    borderRadius: "17px",
    padding: "20px 22px",
    marginBottom: "17px",
  },

  rejectedTitle: {
    margin: "0 0 8px",
    fontSize: "16px",
    color: "#FF9F96",
    fontWeight: 900,
  },

  statusIcon: {
    fontSize: "25px",
    marginBottom: "5px",
  },

  statusText: {
    fontSize: "12px",
    lineHeight: "1.6",
    color: "#C9D8E6",
  },

  statusSmall: {
    display: "block",
    marginTop: "8px",
    color: "#9FB3C8",
    fontSize: "10px",
  },

  formCard: {
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "19px",
    padding: "24px",
    boxShadow:
      "0 8px 23px rgba(16,42,67,0.14)",
    marginBottom: "17px",
  },

  formTitle: {
    margin: 0,
    fontSize: "19px",
    color: "#ffffff",
    fontWeight: 900,
  },

  formSubtitle: {
    margin: "6px 0 5px",
    fontSize: "11px",
    color: "#9FB3C8",
  },

  label: {
    display: "block",
    marginBottom: "6px",
    marginTop: "14px",
    fontSize: "11px",
    fontWeight: 800,
    color: "#C9D8E6",
  },

  input: {
    width: "100%",
    minHeight: "47px",
    padding: "0 13px",
    border: "1px solid #365873",
    borderRadius: "10px",
    background: "#173B5A",
    color: "#ffffff",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },

  readOnlyInput: {
    width: "100%",
    minHeight: "47px",
    padding: "0 13px",
    border: "1px solid #294B66",
    borderRadius: "10px",
    background: "#173B5A",
    color: "#9FB3C8",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },

  amountInput: {
    width: "100%",
    minHeight: "47px",
    padding: "0 13px",
    border: "1px solid #3D7050",
    borderRadius: "10px",
    background: "#173B5A",
    color: "#8FD694",
    fontSize: "14px",
    fontWeight: 800,
    outline: "none",
    boxSizing: "border-box",
  },

  availableText: {
    marginTop: "9px",
    color: "#9FB3C8",
    fontSize: "10px",
  },

  submitButton: {
    width: "100%",
    minHeight: "50px",
    marginTop: "20px",
    border: "none",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 6px 15px rgba(30,105,61,0.20)",
  },

  disabledSubmitButton: {
    width: "100%",
    minHeight: "50px",
    marginTop: "20px",
    border: "none",
    borderRadius: "11px",
    background: "#29435A",
    color: "#9FB3C8",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "not-allowed",
  },

  successMessage: {
    borderRadius: "11px",
    padding: "12px 14px",
    marginBottom: "15px",
    fontSize: "11px",
    lineHeight: "1.5",
    background: "#173B5A",
    border: "1px solid #3D7050",
    color: "#8FD694",
    display: "flex",
    gap: "8px",
  },

  errorMessage: {
    borderRadius: "11px",
    padding: "12px 14px",
    marginBottom: "15px",
    fontSize: "11px",
    lineHeight: "1.5",
    background: "#29384A",
    border: "1px solid #536B80",
    color: "#F4D77A",
    display: "flex",
    gap: "8px",
  },

  dashboardButton: {
    width: "100%",
    minHeight: "47px",
    border: "1px solid #294B66",
    borderRadius: "11px",
    background: "#102A43",
    color: "#C9D8E6",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },
};