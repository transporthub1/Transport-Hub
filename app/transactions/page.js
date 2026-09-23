"use client";

import { useEffect, useState } from "react";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      window.location.replace("/login");
      return;
    }

    const savedUser = localStorage.getItem("transportUser");

    let user = null;

    try {
      user = savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.log("Could not load user");
    }

    const phone =
      user?.phone ||
      user?.mobile ||
      user?.number ||
      "";

    let savedTransactions = null;

    /*
      First load current user's transactions.
    */
    if (phone) {
      savedTransactions = localStorage.getItem(
        "transportTransactions_" + phone
      );
    }

    /*
      Compatibility fallback for old global transactions.
    */
    if (!savedTransactions) {
      savedTransactions = localStorage.getItem(
        "transportTransactions"
      );
    }

    if (savedTransactions) {
      try {
        const parsedTransactions = JSON.parse(
          savedTransactions
        );

        if (Array.isArray(parsedTransactions)) {
          let userTransactions = parsedTransactions;

          /*
            If transaction records contain user information,
            only show the currently logged-in user's records.
          */
          if (phone) {
            const containsUserData =
              parsedTransactions.some(
                (transaction) =>
                  transaction?.phone ||
                  transaction?.userPhone ||
                  transaction?.mobile
              );

            if (containsUserData) {
              userTransactions =
                parsedTransactions.filter(
                  (transaction) => {
                    const transactionPhone =
                      transaction?.phone ||
                      transaction?.userPhone ||
                      transaction?.mobile ||
                      "";

                    return (
                      String(transactionPhone) ===
                      String(phone)
                    );
                  }
                );
            }
          }

          /*
            Convert all Return transactions
            to Weekly Return.
          */
          const normalizedTransactions =
            userTransactions.map(
              (transaction) => {
                const originalType = String(
                  transaction?.type || ""
                );

                const isReturn =
                  originalType
                    .toLowerCase()
                    .includes("return");

                if (isReturn) {
                  return {
                    ...transaction,
                    type: "Weekly Return",
                    returnType: "Weekly",
                  };
                }

                return transaction;
              }
            );

          /*
            Newest transactions first.
          */
          normalizedTransactions.sort(
            (a, b) => {
              const dateA = new Date(
                a?.date ||
                  a?.createdAt ||
                  a?.submittedAt ||
                  0
              ).getTime();

              const dateB = new Date(
                b?.date ||
                  b?.createdAt ||
                  b?.submittedAt ||
                  0
              ).getTime();

              return dateB - dateA;
            }
          );

          setTransactions(
            normalizedTransactions
          );
        }
      } catch (error) {
        console.log(
          "Could not load transactions"
        );
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#eef3f7",
          color: "#102A43",
          fontFamily: "Arial, sans-serif",
          fontSize: "18px",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef3f7",
        padding: "35px 20px 60px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #102A43 0%, #173B5A 100%)",
            borderRadius: "22px",
            padding: "28px 30px",
            color: "#ffffff",
            boxShadow:
              "0 12px 30px rgba(16, 42, 67, 0.20)",
            marginBottom: "22px",
            display: "flex",
            alignItems: "center",
            gap: "18px",
            border: "1px solid #1E3A56",
          }}
        >
          <div
            style={{
              width: "62px",
              height: "62px",
              borderRadius: "18px",
              background: "#1E3A56",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "31px",
              flexShrink: 0,
            }}
          >
            📊
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
              }}
            >
              Transaction History
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                fontSize: "15px",
                color: "#C9D8E6",
              }}
            >
              View your deposits and withdrawals
            </p>
          </div>
        </div>

        {/* TRANSACTIONS */}

        {transactions.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            {transactions.map(
              (transaction, index) => {
                const originalType = String(
                  transaction.type || ""
                );

                const type =
                  originalType.toLowerCase();

                const isDeposit =
                  type.includes("deposit");

                const isWithdrawal =
                  type.includes("withdraw");

                const isReturn =
                  type.includes("return");

                let colors = {
                  border: "#80651d",
                  iconBackground: "#29435A",
                  icon: "📋",
                  title: "#ffffff",
                  amount: "#8FD694",
                };

                if (isDeposit) {
                  colors = {
                    border: "#2E6B4A",
                    iconBackground: "#24543E",
                    icon: "💰",
                    title: "#ffffff",
                    amount: "#8FD694",
                  };
                }

                if (isWithdrawal) {
                  colors = {
                    border: "#75433F",
                    iconBackground: "#573533",
                    icon: "💸",
                    title: "#ffffff",
                    amount: "#FF9F96",
                  };
                }

                if (isReturn) {
                  colors = {
                    border: "#315D7C",
                    iconBackground: "#254A66",
                    icon: "📈",
                    title: "#ffffff",
                    amount: "#8FD694",
                  };
                }

                const status =
                  String(
                    transaction.status || ""
                  ).toLowerCase();

                let statusBackground =
                  "#29435A";

                let statusColor =
                  "#F4D77A";

                if (status === "approved") {
                  statusBackground =
                    "#24543E";
                  statusColor =
                    "#8FD694";
                }

                if (status === "rejected") {
                  statusBackground =
                    "#573533";
                  statusColor =
                    "#FF9F96";
                }

                const displayType =
                  isReturn
                    ? "Weekly Return"
                    : transaction.type ||
                      "Transaction";

                const displayDate =
                  transaction.date ||
                  transaction.createdAt ||
                  transaction.submittedAt ||
                  "N/A";

                return (
                  <div
                    key={
                      transaction.id ||
                      index
                    }
                    style={{
                      background: "#102A43",
                      border:
                        "1px solid " +
                        colors.border,
                      borderRadius: "18px",
                      padding: "20px",
                      boxShadow:
                        "0 8px 22px rgba(16, 42, 67, 0.16)",
                    }}
                  >

                    {/* TOP */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        marginBottom: "17px",
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
                            width: "46px",
                            height: "46px",
                            borderRadius: "13px",
                            background:
                              colors.iconBackground,
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "center",
                            fontSize: "22px",
                            flexShrink: 0,
                          }}
                        >
                          {colors.icon}
                        </div>

                        <div>
                          <strong
                            style={{
                              display: "block",
                              fontSize: "17px",
                              color:
                                colors.title,
                              textTransform:
                                "capitalize",
                            }}
                          >
                            {displayType}
                          </strong>

                          <span
                            style={{
                              display: "block",
                              marginTop: "3px",
                              fontSize: "12px",
                              color: "#9FB3C8",
                            }}
                          >
                            Transaction #
                            {index + 1}
                          </span>
                        </div>
                      </div>

                      {/* STATUS */}

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          padding: "7px 12px",
                          borderRadius: "20px",
                          background:
                            statusBackground,
                          color:
                            statusColor,
                          fontSize: "12px",
                          fontWeight: "700",
                          whiteSpace:
                            "nowrap",
                          border:
                            "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {transaction.status ||
                          "Completed"}
                      </span>

                    </div>

                    {/* DETAILS */}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap: "11px",
                      }}
                    >

                      {/* AMOUNT */}

                      <div
                        style={{
                          background:
                            "#173B5A",
                          border:
                            "1px solid " +
                            colors.border,
                          borderRadius:
                            "12px",
                          padding:
                            "13px 14px",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9FB3C8",
                            marginBottom:
                              "5px",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.5px",
                          }}
                        >
                          Amount
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            fontSize:
                              "17px",
                            color:
                              colors.amount,
                          }}
                        >
                          PKR{" "}
                          {Number(
                            transaction.amount ||
                              0
                          ).toLocaleString()}
                        </strong>
                      </div>

                      {/* DATE */}

                      <div
                        style={{
                          background:
                            "#173B5A",
                          border:
                            "1px solid " +
                            colors.border,
                          borderRadius:
                            "12px",
                          padding:
                            "13px 14px",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            color:
                              "#9FB3C8",
                            marginBottom:
                              "5px",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.5px",
                          }}
                        >
                          Date & Time
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            fontSize:
                              "13px",
                            color:
                              "#ffffff",
                            lineHeight:
                              "1.4",
                          }}
                        >
                          {displayDate}
                        </strong>
                      </div>

                      {/* WEEKLY RETURN */}

                      {isReturn && (
                        <div
                          style={{
                            background:
                              "#173B5A",
                            border:
                              "1px solid " +
                              colors.border,
                            borderRadius:
                              "12px",
                            padding:
                              "13px 14px",
                            gridColumn:
                              "1 / -1",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "block",
                              fontSize:
                                "10px",
                              color:
                                "#9FB3C8",
                              marginBottom:
                                "5px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.5px",
                            }}
                          >
                            Return Type
                          </span>

                          <strong
                            style={{
                              display:
                                "block",
                              fontSize:
                                "14px",
                              color:
                                "#8FD694",
                            }}
                          >
                            Weekly Return
                          </strong>
                        </div>
                      )}

                    </div>

                  </div>
                );
              }
            )}
          </div>
        ) : (

          /* EMPTY STATE */

          <div
            style={{
              background: "#102A43",
              border:
                "1px solid #1E3A56",
              borderRadius: "18px",
              padding: "40px 25px",
              textAlign: "center",
              boxShadow:
                "0 8px 22px rgba(16, 42, 67, 0.16)",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "18px",
                background: "#1E3A56",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "31px",
              }}
            >
              📭
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "20px",
                color: "#ffffff",
              }}
            >
              No Transactions Yet
            </h2>

            <span
              style={{
                fontSize: "14px",
                color: "#9FB3C8",
              }}
            >
              Your deposits and withdrawals
              will appear here.
            </span>
          </div>
        )}

        {/* BACK BUTTON */}

        <button
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            width: "100%",
            minHeight: "50px",
            marginTop: "18px",
            border:
              "1px solid #1E3A56",
            borderRadius: "12px",
            background: "#102A43",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow:
              "0 5px 14px rgba(16, 42, 67, 0.14)",
          }}
        >
          ← Back to Dashboard
        </button>

      </div>
    </div>
  );
}