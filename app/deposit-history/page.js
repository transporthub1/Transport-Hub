"use client";

import { useEffect, useState } from "react";

export default function DepositHistory() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      window.location.replace("/login");
      return;
    }

    const savedDeposit = localStorage.getItem(
      "transportDepositRequest"
    );

    if (savedDeposit) {
      try {
        const deposit = JSON.parse(savedDeposit);
        setDeposits([deposit]);
      } catch (error) {
        console.log("Could not load deposit history");
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
              Deposit History
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                fontSize: "15px",
                color: "#C9D8E6",
              }}
            >
              View your deposit requests
            </p>
          </div>
        </div>

        {/* DEPOSIT HISTORY */}

        {deposits.length > 0 ? (
          <div>
            {deposits.map((deposit, index) => (
              <div
                key={index}
                style={{
                  background: "#102A43",
                  border: "1px solid #1E3A56",
                  borderRadius: "18px",
                  padding: "23px",
                  marginBottom: "18px",
                  boxShadow:
                    "0 8px 22px rgba(16, 42, 67, 0.16)",
                }}
              >

                {/* DEPOSIT TITLE */}

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
                        background: "#1E3A56",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "21px",
                      }}
                    >
                      💰
                    </div>

                    <div>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "17px",
                          color: "#ffffff",
                        }}
                      >
                        Deposit
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: "3px",
                          fontSize: "12px",
                          color: "#9FB3C8",
                        }}
                      >
                        Deposit Request
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
                        deposit.status === "Approved"
                          ? "#24543E"
                          : deposit.status === "Rejected"
                          ? "#573533"
                          : "#29435A",
                      color:
                        deposit.status === "Approved"
                          ? "#8FD694"
                          : deposit.status === "Rejected"
                          ? "#FF9F96"
                          : "#F4D77A",
                      fontSize: "12px",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {deposit.status || "Pending"}
                  </span>
                </div>

                {/* DETAILS */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "12px",
                  }}
                >

                  {/* PLAN */}

                  <div
                    style={{
                      background: "#173B5A",
                      border: "1px solid #294B66",
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
                      Plan
                    </span>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#ffffff",
                        lineHeight: "1.4",
                      }}
                    >
                      {deposit.planName || "N/A"}
                    </strong>
                  </div>

                  {/* AMOUNT */}

                  <div
                    style={{
                      background: "#173B5A",
                      border: "1px solid #294B66",
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
                        fontSize: "16px",
                        color: "#8FD694",
                      }}
                    >
                      PKR{" "}
                      {Number(
                        deposit.amount || 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  {/* BANK */}

                  <div
                    style={{
                      background: "#173B5A",
                      border: "1px solid #294B66",
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
                        color: "#ffffff",
                      }}
                    >
                      {deposit.bankName || "N/A"}
                    </strong>
                  </div>

                  {/* DATE */}

                  <div
                    style={{
                      background: "#173B5A",
                      border: "1px solid #294B66",
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
                      Submitted
                    </span>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "13px",
                        color: "#ffffff",
                        lineHeight: "1.4",
                      }}
                    >
                      {deposit.submittedAt
                        ? new Date(
                            deposit.submittedAt
                          ).toLocaleString()
                        : "N/A"}
                    </strong>
                  </div>

                </div>

              </div>
            ))}
          </div>
        ) : (
          /* NO HISTORY */

          <div
            style={{
              background: "#102A43",
              border: "1px solid #1E3A56",
              borderRadius: "18px",
              padding: "35px 25px",
              marginBottom: "18px",
              textAlign: "center",
              boxShadow:
                "0 8px 22px rgba(16, 42, 67, 0.16)",
            }}
          >
            <div
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "18px",
                background: "#1E3A56",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 15px",
                fontSize: "30px",
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
              No Deposit History
            </h2>

            <span
              style={{
                fontSize: "14px",
                color: "#9FB3C8",
              }}
            >
              Your deposit requests will appear here.
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
            border: "1px solid #1E3A56",
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