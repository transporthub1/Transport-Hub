"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function normalizePhone(value) {
  let phone = String(value || "")
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .trim();

  if (phone.startsWith("+92")) {
    phone = "0" + phone.slice(3);
  } else if (phone.startsWith("0092")) {
    phone = "0" + phone.slice(4);
  }

  return phone;
}

function getTransactionDate(transaction) {
  return (
    transaction?.date ||
    transaction?.createdAt ||
    transaction?.created_at ||
    transaction?.submittedAt ||
    0
  );
}

function getTransactionTimestamp(transaction) {
  const value =
    getTransactionDate(transaction);

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function getTransactionType(transaction) {
  const type = String(
    transaction?.type || ""
  ).toLowerCase();

  if (type.includes("deposit")) {
    return "deposit";
  }

  if (type.includes("withdraw")) {
    return "withdraw";
  }

  if (type.includes("return")) {
    return "return";
  }

  if (type.includes("referral")) {
    return "referral";
  }

  return type;
}

function normalizeTransaction(transaction) {
  const originalType = String(
    transaction?.type || ""
  ).toLowerCase();

  let type =
    transaction?.type ||
    "Transaction";

  if (
    originalType.includes("deposit")
  ) {
    type = "Deposit";
  } else if (
    originalType.includes("withdraw")
  ) {
    type = "Withdraw";
  } else if (
    originalType.includes("return")
  ) {
    type = "Weekly Return";
  } else if (
    originalType.includes("referral")
  ) {
    type = "Referral Bonus";
  }

  return {
    ...transaction,

    type,

    returnType:
      transaction?.returnType ||
      transaction?.return_type ||
      (
        originalType.includes("return")
          ? "Weekly"
          : undefined
      ),

    amount: Number(
      transaction?.amount || 0
    ),

    status:
      transaction?.status ||
      "Completed",

    date:
      transaction?.date ||
      transaction?.createdAt ||
      transaction?.created_at ||
      transaction?.submittedAt ||
      "N/A",

    createdAt:
      transaction?.createdAt ||
      transaction?.created_at ||
      transaction?.date ||
      null,

    planName:
      transaction?.planName ||
      transaction?.plan_name ||
      "",

    description:
      transaction?.description ||
      "",
  };
}

function sameTransactionByBasicData(
  first,
  second
) {
  const firstType =
    getTransactionType(first);

  const secondType =
    getTransactionType(second);

  if (
    firstType !==
    secondType
  ) {
    return false;
  }

  const firstAmount =
    Number(
      first?.amount || 0
    );

  const secondAmount =
    Number(
      second?.amount || 0
    );

  if (
    firstAmount !==
    secondAmount
  ) {
    return false;
  }

  const firstPhone =
    normalizePhone(
      first?.phone ||
        first?.userPhone ||
        first?.mobile ||
        ""
    );

  const secondPhone =
    normalizePhone(
      second?.phone ||
        second?.userPhone ||
        second?.mobile ||
        ""
    );

  if (
    firstPhone &&
    secondPhone &&
    firstPhone !==
      secondPhone
  ) {
    return false;
  }

  return true;
}

function isLocalDuplicateOfCentral(
  localTransaction,
  centralTransactions
) {
  if (
    !localTransaction ||
    !Array.isArray(
      centralTransactions
    ) ||
    centralTransactions.length === 0
  ) {
    return false;
  }

  /*
   * 1. Exact ID match
   */
  if (localTransaction.id) {
    const exactIdMatch =
      centralTransactions.some(
        (central) =>
          String(
            central?.id || ""
          ) ===
          String(
            localTransaction.id
          )
      );

    if (exactIdMatch) {
      return true;
    }
  }

  /*
   * 2. For withdrawals only:
   *    If Supabase already has an approved/rejected
   *    transaction with same user + amount and the
   *    timestamps are close, the old local Pending
   *    record is considered the same transaction.
   *
   *    This specifically fixes the old duplicate:
   *    Approved PKR 33,750 + Pending PKR 33,750.
   */
  const localType =
    getTransactionType(
      localTransaction
    );

  if (
    localType ===
    "withdraw"
  ) {
    const localTime =
      getTransactionTimestamp(
        localTransaction
      );

    return centralTransactions.some(
      (central) => {
        const centralType =
          getTransactionType(
            central
          );

        if (
          centralType !==
          "withdraw"
        ) {
          return false;
        }

        if (
          !sameTransactionByBasicData(
            localTransaction,
            central
          )
        ) {
          return false;
        }

        const centralStatus =
          String(
            central?.status ||
              ""
          ).toLowerCase();

        /*
         * Central processed record has priority.
         */
        if (
          centralStatus !==
            "approved" &&
          centralStatus !==
            "rejected" &&
          centralStatus !==
            "completed"
        ) {
          return false;
        }

        const centralTime =
          getTransactionTimestamp(
            central
          );

        /*
         * Same transaction is normally created
         * around the same time. Allow 10 minutes
         * to cover timezone/date formatting differences.
         */
        if (
          localTime > 0 &&
          centralTime > 0
        ) {
          return (
            Math.abs(
              localTime -
                centralTime
            ) <=
            10 *
              60 *
              1000
          );
        }

        return true;
      }
    );
  }

  return false;
}

export default function Transactions() {
  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTransactions = async () => {
      const loggedIn =
        localStorage.getItem(
          "transportLoggedIn"
        );

      if (
        loggedIn !==
        "true"
      ) {
        window.location.replace(
          "/login"
        );
        return;
      }

      const savedUser =
        localStorage.getItem(
          "transportUser"
        );

      let user = null;

      try {
        user =
          savedUser
            ? JSON.parse(
                savedUser
              )
            : null;
      } catch (error) {
        console.log(
          "Could not load user"
        );
      }

      const rawPhone =
        user?.phone ||
        user?.mobile ||
        user?.number ||
        "";

      const phone =
        normalizePhone(
          rawPhone
        );

      /*
       * --------------------------------------------------
       * LOAD TRANSACTIONS FROM SUPABASE
       * --------------------------------------------------
       */
      let supabaseTransactions =
        [];

      if (phone) {
        try {
          const {
            data,
            error,
          } = await supabase
            .from(
              "transactions"
            )
            .select("*")
            .eq(
              "user_phone",
              phone
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

          if (error) {
            console.log(
              "Supabase transactions load error:",
              error.message
            );
          } else {
            supabaseTransactions =
              Array.isArray(data)
                ? data.map(
                    normalizeTransaction
                  )
                : [];
          }
        } catch (error) {
          console.log(
            "Supabase transactions request failed:",
            error
          );
        }
      }

      /*
       * --------------------------------------------------
       * LOAD OLD LOCAL TRANSACTIONS
       * --------------------------------------------------
       */
      let localTransactions =
        [];

      let savedTransactions =
        null;

      if (rawPhone) {
        savedTransactions =
          localStorage.getItem(
            "transportTransactions_" +
              rawPhone
          );
      }

      if (
        !savedTransactions &&
        phone
      ) {
        savedTransactions =
          localStorage.getItem(
            "transportTransactions_" +
              phone
          );
      }

      if (
        !savedTransactions
      ) {
        savedTransactions =
          localStorage.getItem(
            "transportTransactions"
          );
      }

      if (
        savedTransactions
      ) {
        try {
          const parsedTransactions =
            JSON.parse(
              savedTransactions
            );

          if (
            Array.isArray(
              parsedTransactions
            )
          ) {
            localTransactions =
              parsedTransactions
                .map(
                  normalizeTransaction
                )
                .filter(
                  (
                    transaction
                  ) => {
                    if (
                      !phone
                    ) {
                      return true;
                    }

                    const transactionPhone =
                      normalizePhone(
                        transaction?.phone ||
                          transaction?.userPhone ||
                          transaction?.mobile ||
                          ""
                      );

                    /*
                     * Old local records may not have
                     * phone information.
                     */
                    if (
                      !transactionPhone
                    ) {
                      return true;
                    }

                    return (
                      transactionPhone ===
                      phone
                    );
                  }
                );
          }
        } catch (error) {
          console.log(
            "Could not load local transactions"
          );
        }
      }

      /*
       * --------------------------------------------------
       * REMOVE LOCAL DUPLICATES ALREADY PRESENT CENTRALLY
       * --------------------------------------------------
       *
       * Supabase is the central source.
       * Old local duplicates are hidden when a matching
       * processed transaction exists centrally.
       * --------------------------------------------------
       */
      const filteredLocalTransactions =
        localTransactions.filter(
          (localTransaction) =>
            !isLocalDuplicateOfCentral(
              localTransaction,
              supabaseTransactions
            )
        );

      /*
       * --------------------------------------------------
       * MERGE SUPABASE + REMAINING LOCAL
       * --------------------------------------------------
       */
      const mergedMap =
        new Map();

      supabaseTransactions.forEach(
        (transaction) => {
          const key =
            String(
              transaction?.id ||
                ""
            ).trim();

          if (key) {
            mergedMap.set(
              key,
              transaction
            );
          }
        }
      );

      filteredLocalTransactions.forEach(
        (transaction) => {
          const key =
            String(
              transaction?.id ||
                ""
            ).trim();

          if (key) {
            if (
              !mergedMap.has(
                key
              )
            ) {
              mergedMap.set(
                key,
                transaction
              );
            }
          } else {
            const fallbackKey =
              [
                getTransactionType(
                  transaction
                ),
                Number(
                  transaction?.amount ||
                    0
                ),
                getTransactionTimestamp(
                  transaction
                ),
              ].join(
                "|"
              );

            if (
              !mergedMap.has(
                fallbackKey
              )
            ) {
              mergedMap.set(
                fallbackKey,
                transaction
              );
            }
          }
        }
      );

      const finalTransactions =
        Array.from(
          mergedMap.values()
        );

      /*
       * Newest first.
       */
      finalTransactions.sort(
        (a, b) =>
          getTransactionTimestamp(
            b
          ) -
          getTransactionTimestamp(
            a
          )
      );

      /*
       * --------------------------------------------------
       * UPDATE LOCAL CACHE
       * --------------------------------------------------
       *
       * Keep only the final de-duplicated list locally.
       * --------------------------------------------------
       */
      if (
        phone &&
        finalTransactions.length >
          0
      ) {
        try {
          localStorage.setItem(
            "transportTransactions_" +
              phone,
            JSON.stringify(
              finalTransactions
            )
          );
        } catch (error) {
          console.log(
            "Could not update local transaction cache"
          );
        }
      }

      if (
        cancelled
      ) {
        return;
      }

      setTransactions(
        finalTransactions
      );

      setLoading(
        false
      );
    };

    loadTransactions();

    return () => {
      cancelled =
        true;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          background:
            "#eef3f7",
          color:
            "#102A43",
          fontFamily:
            "Arial, sans-serif",
          fontSize:
            "18px",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight:
          "100vh",
        background:
          "#eef3f7",
        padding:
          "35px 20px 60px",
        boxSizing:
          "border-box",
        fontFamily:
          "Arial, sans-serif",
        color:
          "#ffffff",
      }}
    >
      <div
        style={{
          width:
            "100%",
          maxWidth:
            "800px",
          margin:
            "0 auto",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #102A43 0%, #173B5A 100%)",
            borderRadius:
              "22px",
            padding:
              "28px 30px",
            color:
              "#ffffff",
            boxShadow:
              "0 12px 30px rgba(16, 42, 67, 0.20)",
            marginBottom:
              "22px",
            display:
              "flex",
            alignItems:
              "center",
            gap:
              "18px",
            border:
              "1px solid #1E3A56",
          }}
        >
          <div
            style={{
              width:
                "62px",
              height:
                "62px",
              borderRadius:
                "18px",
              background:
                "#1E3A56",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              fontSize:
                "31px",
              flexShrink:
                0,
            }}
          >
            📊
          </div>

          <div>
            <h1
              style={{
                margin:
                  0,
                fontSize:
                  "30px",
                fontWeight:
                  "800",
                letterSpacing:
                  "-0.5px",
              }}
            >
              Transaction History
            </h1>

            <p
              style={{
                margin:
                  "7px 0 0",
                fontSize:
                  "15px",
                color:
                  "#C9D8E6",
              }}
            >
              View your deposits and withdrawals
            </p>
          </div>
        </div>

        {/* TRANSACTIONS */}

        {transactions.length >
        0 ? (
          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap:
                "15px",
            }}
          >
            {transactions.map(
              (
                transaction,
                index
              ) => {
                const normalized =
                  normalizeTransaction(
                    transaction
                  );

                const originalType =
                  String(
                    normalized.type ||
                      ""
                  );

                const type =
                  originalType.toLowerCase();

                const isDeposit =
                  type.includes(
                    "deposit"
                  );

                const isWithdrawal =
                  type.includes(
                    "withdraw"
                  );

                const isReturn =
                  type.includes(
                    "return"
                  );

                let colors = {
                  border:
                    "#80651d",
                  iconBackground:
                    "#29435A",
                  icon:
                    "📋",
                  title:
                    "#ffffff",
                  amount:
                    "#8FD694",
                };

                if (
                  isDeposit
                ) {
                  colors = {
                    border:
                      "#2E6B4A",
                    iconBackground:
                      "#24543E",
                    icon:
                      "💰",
                    title:
                      "#ffffff",
                    amount:
                      "#8FD694",
                  };
                }

                if (
                  isWithdrawal
                ) {
                  colors = {
                    border:
                      "#75433F",
                    iconBackground:
                      "#573533",
                    icon:
                      "💸",
                    title:
                      "#ffffff",
                    amount:
                      "#FF9F96",
                  };
                }

                if (
                  isReturn
                ) {
                  colors = {
                    border:
                      "#315D7C",
                    iconBackground:
                      "#254A66",
                    icon:
                      "📈",
                    title:
                      "#ffffff",
                    amount:
                      "#8FD694",
                  };
                }

                const status =
                  String(
                    normalized.status ||
                      ""
                  ).toLowerCase();

                let statusBackground =
                  "#29435A";

                let statusColor =
                  "#F4D77A";

                if (
                  status ===
                  "approved"
                ) {
                  statusBackground =
                    "#24543E";

                  statusColor =
                    "#8FD694";
                }

                if (
                  status ===
                  "rejected"
                ) {
                  statusBackground =
                    "#573533";

                  statusColor =
                    "#FF9F96";
                }

                if (
                  status ===
                  "completed"
                ) {
                  statusBackground =
                    "#24543E";

                  statusColor =
                    "#8FD694";
                }

                const displayType =
                  isReturn
                    ? "Weekly Return"
                    : isWithdrawal
                    ? "Withdraw"
                    : isDeposit
                    ? "Deposit"
                    : normalized.type ||
                      "Transaction";

                const displayDate =
                  normalized.date ||
                  normalized.createdAt ||
                  "N/A";

                return (
                  <div
                    key={
                      normalized.id ||
                      index
                    }
                    style={{
                      background:
                        "#102A43",
                      border:
                        "1px solid " +
                        colors.border,
                      borderRadius:
                        "18px",
                      padding:
                        "20px",
                      boxShadow:
                        "0 8px 22px rgba(16, 42, 67, 0.16)",
                    }}
                  >

                    {/* TOP */}

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap:
                          "12px",
                        marginBottom:
                          "17px",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "12px",
                        }}
                      >
                        <div
                          style={{
                            width:
                              "46px",
                            height:
                              "46px",
                            borderRadius:
                              "13px",
                            background:
                              colors.iconBackground,
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontSize:
                              "22px",
                            flexShrink:
                              0,
                          }}
                        >
                          {
                            colors.icon
                          }
                        </div>

                        <div>
                          <strong
                            style={{
                              display:
                                "block",
                              fontSize:
                                "17px",
                              color:
                                colors.title,
                              textTransform:
                                "capitalize",
                            }}
                          >
                            {
                              displayType
                            }
                          </strong>

                          <span
                            style={{
                              display:
                                "block",
                              marginTop:
                                "3px",
                              fontSize:
                                "12px",
                              color:
                                "#9FB3C8",
                            }}
                          >
                            Transaction #
                            {index +
                              1}
                          </span>
                        </div>
                      </div>

                      {/* STATUS */}

                      <span
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          padding:
                            "7px 12px",
                          borderRadius:
                            "20px",
                          background:
                            statusBackground,
                          color:
                            statusColor,
                          fontSize:
                            "12px",
                          fontWeight:
                            "700",
                          whiteSpace:
                            "nowrap",
                          border:
                            "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {
                          normalized.status ||
                          "Completed"
                        }
                      </span>

                    </div>

                    {/* DETAILS */}

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap:
                          "11px",
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
                            normalized.amount ||
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
                          {
                            displayDate
                          }
                        </strong>
                      </div>

                      {/* RETURN TYPE */}

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
                            {
                              normalized.returnType ||
                              "Weekly"
                            }
                          </strong>
                        </div>
                      )}

                      {/* PLAN */}

                      {normalized.planName && (
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
                            Plan
                          </span>

                          <strong
                            style={{
                              display:
                                "block",
                              fontSize:
                                "14px",
                              color:
                                "#ffffff",
                            }}
                          >
                            {
                              normalized.planName
                            }
                          </strong>
                        </div>
                      )}

                      {/* DESCRIPTION */}

                      {normalized.description && (
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
                            Details
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
                            {
                              normalized.description
                            }
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
              background:
                "#102A43",
              border:
                "1px solid #1E3A56",
              borderRadius:
                "18px",
              padding:
                "40px 25px",
              textAlign:
                "center",
              boxShadow:
                "0 8px 22px rgba(16, 42, 67, 0.16)",
            }}
          >
            <div
              style={{
                width:
                  "68px",
                height:
                  "68px",
                borderRadius:
                  "18px",
                background:
                  "#1E3A56",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                margin:
                  "0 auto 16px",
                fontSize:
                  "31px",
              }}
            >
              📭
            </div>

            <h2
              style={{
                margin:
                  "0 0 8px",
                fontSize:
                  "20px",
                color:
                  "#ffffff",
              }}
            >
              No Transactions Yet
            </h2>

            <span
              style={{
                fontSize:
                  "14px",
                color:
                  "#9FB3C8",
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
            window.location.href =
              "/";
          }}
          style={{
            width:
              "100%",
            minHeight:
              "50px",
            marginTop:
              "18px",
            border:
              "1px solid #1E3A56",
            borderRadius:
              "12px",
            background:
              "#102A43",
            color:
              "#ffffff",
            fontSize:
              "14px",
            fontWeight:
              "700",
            cursor:
              "pointer",
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