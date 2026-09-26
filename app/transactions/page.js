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

function formatTransactionDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getTransactionDate(transaction) {
  return (
    transaction?.date ||
    transaction?.createdAt ||
    transaction?.created_at ||
    transaction?.submittedAt ||
    transaction?.submitted_at ||
    0
  );
}

function getTransactionTimestamp(transaction) {
  const value = getTransactionDate(transaction);

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

  if (originalType.includes("deposit")) {
    type = "Deposit";
  } else if (originalType.includes("withdraw")) {
    type = "Withdraw";
  } else if (originalType.includes("return")) {
    type = "Weekly Return";
  } else if (originalType.includes("referral")) {
    type = "Referral Bonus";
  }

  return {
    ...transaction,

    type,

    returnType:
      transaction?.returnType ||
      transaction?.return_type ||
      (originalType.includes("return")
        ? "Weekly"
        : undefined),

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
      transaction?.submitted_at ||
      "N/A",

    createdAt:
      transaction?.createdAt ||
      transaction?.created_at ||
      transaction?.date ||
      transaction?.submittedAt ||
      transaction?.submitted_at ||
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

/*
 * --------------------------------------------------
 * REMOVE DUPLICATE WITHDRAWALS
 * --------------------------------------------------
 */
function removeDuplicateWithdrawals(
  transactions
) {
  const list = Array.isArray(
    transactions
  )
    ? [...transactions]
    : [];

  const withdrawals =
    list.filter(
      (transaction) =>
        getTransactionType(
          transaction
        ) === "withdraw"
    );

  const processedWithdrawals =
    withdrawals.filter(
      (transaction) => {
        const status = String(
          transaction?.status ||
            ""
        ).toLowerCase();

        return (
          status === "approved" ||
          status === "rejected" ||
          status === "completed"
        );
      }
    );

  return list.filter(
    (transaction) => {
      const type =
        getTransactionType(
          transaction
        );

      if (
        type !== "withdraw"
      ) {
        return true;
      }

      const status =
        String(
          transaction?.status ||
            ""
        ).toLowerCase();

      if (
        status !==
        "pending"
      ) {
        return true;
      }

      const amount =
        Number(
          transaction?.amount ||
            0
        );

      const phone =
        normalizePhone(
          transaction?.phone ||
            transaction?.userPhone ||
            transaction?.mobile ||
            transaction?.user_phone ||
            ""
        );

      const matchingProcessed =
        processedWithdrawals.some(
          (processed) => {
            const processedAmount =
              Number(
                processed?.amount ||
                  0
              );

            if (
              processedAmount !==
              amount
            ) {
              return false;
            }

            const processedPhone =
              normalizePhone(
                processed?.phone ||
                  processed?.userPhone ||
                  processed?.mobile ||
                  processed?.user_phone ||
                  ""
              );

            if (
              phone &&
              processedPhone
            ) {
              return (
                phone ===
                processedPhone
              );
            }

            return true;
          }
        );

      return !matchingProcessed;
    }
  );
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
       * LOAD LOCAL TRANSACTIONS
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
                          transaction?.user_phone ||
                          ""
                      );

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
       * REMOVE LOCAL DUPLICATES FIRST
       * --------------------------------------------------
       */
      const cleanedLocalTransactions =
        removeDuplicateWithdrawals(
          localTransactions
        );

      /*
       * --------------------------------------------------
       * REMOVE LOCAL RECORDS ALREADY REPRESENTED
       * BY SUPABASE
       * --------------------------------------------------
       */
      const filteredLocalTransactions =
        cleanedLocalTransactions.filter(
          (localTransaction) => {
            if (
              !localTransaction
            ) {
              return false;
            }

            if (
              localTransaction.id
            ) {
              const exactMatch =
                supabaseTransactions.some(
                  (central) =>
                    String(
                      central?.id ||
                        ""
                    ) ===
                    String(
                      localTransaction.id
                    )
                );

              if (
                exactMatch
              ) {
                return false;
              }
            }

            const localType =
              getTransactionType(
                localTransaction
              );

            if (
              localType ===
              "withdraw"
            ) {
              const localStatus =
                String(
                  localTransaction?.status ||
                    ""
                ).toLowerCase();

              if (
                localStatus ===
                "pending"
              ) {
                const localAmount =
                  Number(
                    localTransaction?.amount ||
                      0
                  );

                const localPhone =
                  normalizePhone(
                    localTransaction?.phone ||
                      localTransaction?.userPhone ||
                      localTransaction?.mobile ||
                      localTransaction?.user_phone ||
                      ""
                  );

                const centralProcessed =
                  supabaseTransactions.some(
                    (
                      central
                    ) => {
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

                      const centralStatus =
                        String(
                          central?.status ||
                            ""
                        ).toLowerCase();

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

                      const centralAmount =
                        Number(
                          central?.amount ||
                            0
                        );

                      if (
                        centralAmount !==
                        localAmount
                      ) {
                        return false;
                      }

                      const centralPhone =
                        normalizePhone(
                          central?.user_phone ||
                            central?.phone ||
                            central?.userPhone ||
                            central?.mobile ||
                            ""
                        );

                      if (
                        localPhone &&
                        centralPhone
                      ) {
                        return (
                          localPhone ===
                          centralPhone
                        );
                      }

                      return true;
                    }
                  );

                if (
                  centralProcessed
                ) {
                  return false;
                }
              }
            }

            return true;
          }
        );

      /*
       * --------------------------------------------------
       * MERGE SUPABASE + LOCAL
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

      /*
       * --------------------------------------------------
       * FINAL CLEANUP
       * --------------------------------------------------
       */
      const deduplicatedTransactions =
        removeDuplicateWithdrawals(
          Array.from(
            mergedMap.values()
          )
        );

      /*
       * --------------------------------------------------
       * NEWEST FIRST
       * --------------------------------------------------
       */
      deduplicatedTransactions.sort(
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
       * SAVE CLEANED RESULT
       * --------------------------------------------------
       */
      if (
        phone
      ) {
        try {
          localStorage.setItem(
            "transportTransactions_" +
              phone,
            JSON.stringify(
              deduplicatedTransactions
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
        deduplicatedTransactions
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
            boxSizing:
              "border-box",
            minWidth:
              0,
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

          <div
            style={{
              minWidth:
                0,
              overflow:
                "hidden",
            }}
          >
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
                overflowWrap:
                  "anywhere",
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
                overflowWrap:
                  "anywhere",
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
              width:
                "100%",
              minWidth:
                0,
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

                const isReferral =
                  type.includes(
                    "referral"
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

                if (
                  isReferral
                ) {
                  colors = {
                    border:
                      "#80651d",
                    iconBackground:
                      "#5D4A1B",
                    icon:
                      "🎁",
                    title:
                      "#ffffff",
                    amount:
                      "#F4D77A",
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
                    : isReferral
                    ? "Referral Bonus"
                    : normalized.type ||
                      "Transaction";

                const displayDate =
                  formatTransactionDate(
                    normalized.date ||
                      normalized.createdAt ||
                      normalized.created_at ||
                      normalized.submittedAt ||
                      normalized.submitted_at
                  );

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
                      width:
                        "100%",
                      minWidth:
                        0,
                      boxSizing:
                        "border-box",
                      overflow:
                        "hidden",
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
                        minWidth:
                          0,
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
                          minWidth:
                            0,
                          flex:
                            1,
                          overflow:
                            "hidden",
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

                        <div
                          style={{
                            minWidth:
                              0,
                            overflow:
                              "hidden",
                          }}
                        >
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
                              overflowWrap:
                                "anywhere",
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
                          flexShrink:
                            0,
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
                        width:
                          "100%",
                        minWidth:
                          0,
                        boxSizing:
                          "border-box",
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
                          minWidth:
                            0,
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          overflow:
                            "hidden",
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
                            overflowWrap:
                              "anywhere",
                            wordBreak:
                              "break-word",
                          }}
                        >
                          PKR{" "}
                          {Number(
                            normalized.amount ||
                              0
                          ).toLocaleString()}
                        </strong>
                      </div>

                      {/* DATE & TIME */}

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
                          minWidth:
                            0,
                          width:
                            "100%",
                          boxSizing:
                            "border-box",
                          overflow:
                            "hidden",
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
                            width:
                              "100%",
                            maxWidth:
                              "100%",
                            fontSize:
                              "13px",
                            color:
                              "#ffffff",
                            lineHeight:
                              "1.5",
                            whiteSpace:
                              "normal",
                            overflowWrap:
                              "anywhere",
                            wordBreak:
                              "break-word",
                            boxSizing:
                              "border-box",
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
                            minWidth:
                              0,
                            width:
                              "100%",
                            boxSizing:
                              "border-box",
                            overflow:
                              "hidden",
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
                              overflowWrap:
                                "anywhere",
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
                            minWidth:
                              0,
                            width:
                              "100%",
                            boxSizing:
                              "border-box",
                            overflow:
                              "hidden",
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
                              overflowWrap:
                                "anywhere",
                              wordBreak:
                                "break-word",
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
                            minWidth:
                              0,
                            width:
                              "100%",
                            boxSizing:
                              "border-box",
                            overflow:
                              "hidden",
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
                                "1.5",
                              overflowWrap:
                                "anywhere",
                              wordBreak:
                                "break-word",
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
              boxSizing:
                "border-box",
              width:
                "100%",
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
                overflowWrap:
                  "anywhere",
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
            boxSizing:
              "border-box",
          }}
        >
          ← Back to Dashboard
        </button>

      </div>
    </div>
  );
}