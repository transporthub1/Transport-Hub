"use client";

import { useEffect, useState } from "react";

export default function WithdrawHistory() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      window.location.replace("/login");
      return;
    }

    const userRaw = localStorage.getItem("transportUser");

    if (!userRaw) {
      setLoading(false);
      return;
    }

    let currentUser = null;

    try {
      currentUser = JSON.parse(userRaw);
    } catch (error) {
      console.log("Could not load user");
      setLoading(false);
      return;
    }

    const phone =
      currentUser?.phone ||
      currentUser?.mobile ||
      currentUser?.phoneNumber ||
      "";

    let userWithdrawals = [];

    /* CURRENT USER WITHDRAW HISTORY */
    if (phone) {
      const savedUserWithdrawals = localStorage.getItem(
        "transportWithdrawRequests_" + phone
      );

      if (savedUserWithdrawals) {
        try {
          const parsed = JSON.parse(savedUserWithdrawals);

          if (Array.isArray(parsed)) {
            userWithdrawals = parsed;
          } else if (parsed) {
            userWithdrawals = [parsed];
          }
        } catch (error) {
          console.log("Could not load user withdrawal history");
        }
      }
    }

    /* FALLBACK TO GLOBAL WITHDRAW HISTORY */
    if (userWithdrawals.length === 0) {
      const savedAllWithdrawals = localStorage.getItem(
        "transportWithdrawRequests"
      );

      if (savedAllWithdrawals) {
        try {
          const parsed = JSON.parse(savedAllWithdrawals);

          if (Array.isArray(parsed)) {
            userWithdrawals = parsed.filter((withdrawal) => {
              const withdrawalPhone =
                withdrawal?.phone ||
                withdrawal?.userPhone ||
                withdrawal?.mobile ||
                withdrawal?.phoneNumber ||
                "";

              if (!withdrawalPhone) {
                return false;
              }

              return String(withdrawalPhone) === String(phone);
            });
          } else if (parsed) {
            const withdrawalPhone =
              parsed?.phone ||
              parsed?.userPhone ||
              parsed?.mobile ||
              parsed?.phoneNumber ||
              "";

            if (
              withdrawalPhone &&
              String(withdrawalPhone) === String(phone)
            ) {
              userWithdrawals = [parsed];
            }
          }
        } catch (error) {
          console.log("Could not load withdrawal history");
        }
      }
    }

    /* OLD SINGLE REQUEST FALLBACK */
    if (userWithdrawals.length === 0) {
      const oldRequest = localStorage.getItem(
        "transportWithdrawRequest_" + phone
      );

      if (oldRequest) {
        try {
          const parsed = JSON.parse(oldRequest);

          if (Array.isArray(parsed)) {
            userWithdrawals = parsed;
          } else if (parsed) {
            userWithdrawals = [parsed];
          }
        } catch (error) {
          console.log("Could not load old withdrawal request");
        }
      }
    }

    /* FINAL OLD GLOBAL FALLBACK */
    if (userWithdrawals.length === 0) {
      const oldGlobalRequest = localStorage.getItem(
        "transportWithdrawRequest"
      );

      if (oldGlobalRequest) {
        try {
          const parsed = JSON.parse(oldGlobalRequest);

          if (Array.isArray(parsed)) {
            userWithdrawals = parsed.filter((withdrawal) => {
              const withdrawalPhone =
                withdrawal?.phone ||
                withdrawal?.userPhone ||
                withdrawal?.mobile ||
                withdrawal?.phoneNumber ||
                "";

              return (
                withdrawalPhone &&
                String(withdrawalPhone) === String(phone)
              );
            });
          } else if (parsed) {
            const withdrawalPhone =
              parsed?.phone ||
              parsed?.userPhone ||
              parsed?.mobile ||
              parsed?.phoneNumber ||
              "";

            if (
              withdrawalPhone &&
              String(withdrawalPhone) === String(phone)
            ) {
              userWithdrawals = [parsed];
            }
          }
        } catch (error) {
          console.log("Could not load old withdrawal history");
        }
      }
    }

    /* NORMALIZE + SORT */
    const normalizedWithdrawals = userWithdrawals
      .map((withdrawal) => {
        return {
          ...withdrawal,
          status: withdrawal?.status || "Pending",
          returnType:
            withdrawal?.returnType ||
            withdrawal?.type ||
            "Weekly",
        };
      })
      .sort((a, b) => {
        const dateA = new Date(
          a?.submittedAt ||
            a?.createdAt ||
            a?.date ||
            0
        ).getTime();

        const dateB = new Date(
          b?.submittedAt ||
            b?.createdAt ||
            b?.date ||
            0
        ).getTime();

        return dateB - dateA;
      });

    setWithdrawals(normalizedWithdrawals);
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
        color: "#102A43",
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
            boxShadow: "0 12px 30px rgba(16, 42, 67, 0.18)",
            marginBottom: "22px",
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              width: "62px",
              height: "62px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "31px",
              flexShrink: 0,
            }}
          >
            📋
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
              Withdraw History
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                fontSize: "15px",
                color: "#C9D8E6",
              }}
            >
              View your withdrawal requests
            </p>
          </div>
        </div>

        {/* WITHDRAWAL HISTORY */}
        {withdrawals.length > 0 ? (
          <div>
            {withdrawals.map((withdrawal, index) => (
              <div
                key={withdrawal?.id || index}
                style={{
                  background: "#102A43",
                  border: "1px solid #1E3A56",
                  borderRadius: "18px",
                  padding: "23px",
                  marginBottom: "18px",
                  boxShadow: "0 10px 26px rgba(16, 42, 67, 0.14)",
                }}
              >
                {/* TITLE + STATUS */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "15px",
                    marginBottom: "20px",
                    paddingBottom: "15px",
                    borderBottom: "1px solid #29435A",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "12px",
                        background: "#173B5A",
                        border: "1px solid #29435A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "21px",
                      }}
                    >
                      💸
                    </div>

                    <div>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "17px",
                          color: "#ffffff",
                        }}
                      >
                        Withdrawal
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: "3px",
                          fontSize: "12px",
                          color: "#9FB3C8",
                        }}
                      >
                        Withdrawal Request
                      </span>
                    </div>
                  </div>

                  {/* STATUS */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "7px 12px",
                      borderRadius: "20px",
                      background:
                        withdrawal.status === "Approved"
                          ? "rgba(143, 214, 148, 0.14)"
                          : withdrawal.status === "Rejected"
                          ? "rgba(255, 159, 150, 0.14)"
                          : "rgba(244, 215, 122, 0.14)",
                      color:
                        withdrawal.status === "Approved"
                          ? "#8FD694"
                          : withdrawal.status === "Rejected"
                          ? "#FF9F96"
                          : "#F4D77A",
                      border:
                        withdrawal.status === "Approved"
                          ? "1px solid rgba(143, 214, 148, 0.25)"
                          : withdrawal.status === "Rejected"
                          ? "1px solid rgba(255, 159, 150, 0.25)"
                          : "1px solid rgba(244, 215, 122, 0.25)",
                      fontSize: "12px",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {withdrawal.status || "Pending"}
                  </span>
                </div>

                {/* DETAILS */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "12px",
                  }}
                >
                  {/* AMOUNT */}
                  <div
                    style={{
                      background: "#173B5A",
                      border: "1px solid #29435A",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        color: "#9FB3C8",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                      }}
                    >
                      Amount
                    </span>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "17px",
                        color: "#8FD694",
                      }}
                    >
                      PKR{" "}
                      {Number(
                        withdrawal.amount || 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  {/* BANK */}
                  <div
                    style={{
                      background: "#173B5A",
                      border: "1px solid #29435A",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        color: "#9FB3C8",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                      }}
                    >
                      Bank
                    </span>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#FFFFFF",
                      }}
                    >
                      {withdrawal.bankName || "N/A"}
                    </strong>
                  </div>

                  {/* ACCOUNT NUMBER */}
                  <div
                    style={{
                      background: "#173B5A",
                      border: "1px solid #29435A",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        color: "#9FB3C8",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                      }}
                    >
                      Account Number
                    </span>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#FFFFFF",
                        wordBreak: "break-word",
                      }}
                    >
                      {withdrawal.accountNumber || "N/A"}
                    </strong>
                  </div>

                  {/* RETURN TYPE */}
                  <div
                    style={{
                      background: "#173B5A",
                      border: "1px solid #29435A",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        color: "#9FB3C8",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                      }}
                    >
                      Return Type
                    </span>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#FFFFFF",
                      }}
                    >
                      {withdrawal.returnType || "Weekly"}
                    </strong>
                  </div>

                  {/* DATE */}
                  <div
                    style={{
                      background: "#173B5A",
                      border: "1px solid #29435A",
                      borderRadius: "12px",
                      padding: "14px",
                      gridColumn: "1 / -1",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        color: "#9FB3C8",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                      }}
                    >
                      Submitted
                    </span>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "13px",
                        color: "#FFFFFF",
                        lineHeight: "1.4",
                      }}
                    >
                      {withdrawal.submittedAt
                        ? new Date(
                            withdrawal.submittedAt
                          ).toLocaleString()
                        : withdrawal.createdAt
                        ? new Date(
                            withdrawal.createdAt
                          ).toLocaleString()
                        : "N/A"}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* NO WITHDRAW HISTORY */
          <div
            style={{
              background: "#102A43",
              border: "1px solid #1E3A56",
              borderRadius: "18px",
              padding: "38px 25px",
              marginBottom: "18px",
              textAlign: "center",
              boxShadow: "0 10px 26px rgba(16, 42, 67, 0.12)",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "18px",
                background: "#173B5A",
                border: "1px solid #29435A",
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
                color: "#FFFFFF",
              }}
            >
              No Withdraw History
            </h2>

            <span
              style={{
                fontSize: "14px",
                color: "#9FB3C8",
              }}
            >
              Your withdrawal requests will appear here.
            </span>
          </div>
        )}

        {/* BACK TO DASHBOARD */}
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            width: "100%",
            minHeight: "50px",
            border: "1px solid #29435A",
            borderRadius: "12px",
            background: "#102A43",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 7px 18px rgba(16, 42, 67, 0.12)",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}