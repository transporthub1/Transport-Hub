"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function MyTeam() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedTotalBonus, setSavedTotalBonus] = useState(0);

  const levels = [
    { level: 1, name: "Level 1", bonus: "10%" },
    { level: 2, name: "Level 2", bonus: "5%" },
    { level: 3, name: "Level 3", bonus: "3%" },
    { level: 4, name: "Level 4", bonus: "2%" },
    { level: 5, name: "Level 5", bonus: "1%" },
    { level: 6, name: "Level 6", bonus: "0.5%" },
  ];

  const levelPercentages = {
    1: 10,
    2: 5,
    3: 3,
    4: 2,
    5: 1,
    6: 0.5,
  };

  const normalizePhone = (value) => {
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
  };

  const normalizeText = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase();
  };

  const getUserPhone = (person) => {
    if (!person) {
      return "";
    }

    return normalizePhone(
      person.phone ||
        person.mobile ||
        person.phoneNumber ||
        person.mobileNumber ||
        ""
    );
  };

  const getReferralCode = (person) => {
    if (!person) {
      return "";
    }

    return normalizeText(
      person.referral_code ||
        person.referralCode ||
        person.referral ||
        ""
    );
  };

  const getParentIdentifiers = (person) => {
    if (!person) {
      return [];
    }

    const values = [
      person.referred_by,
      person.referredBy,
      person.referrer_code,
      person.referrerCode,
      person.referrer_phone,
      person.referrerPhone,
      person.referrer_mobile,
      person.referrerMobile,
      person.parent_phone,
      person.parentPhone,
      person.upline_phone,
      person.uplinePhone,
    ];

    const identifiers = [];

    values.forEach((value) => {
      if (!value) {
        return;
      }

      const raw = String(value).trim();

      if (!raw) {
        return;
      }

      identifiers.push(normalizeText(raw));

      const cleanPhone = normalizePhone(raw);

      if (cleanPhone && cleanPhone !== raw) {
        identifiers.push(
          normalizeText(cleanPhone)
        );
      }
    });

    return [
      ...new Set(identifiers),
    ];
  };

  const getPersonIdentifiers = (person) => {
    if (!person) {
      return [];
    }

    const values = [
      getUserPhone(person),
      getReferralCode(person),
      person.referral_code,
      person.referralCode,
      person.phone,
      person.mobile,
      person.phoneNumber,
      person.mobileNumber,
    ];

    const identifiers = [];

    values.forEach((value) => {
      if (!value) {
        return;
      }

      const raw = String(value).trim();

      if (!raw) {
        return;
      }

      identifiers.push(normalizeText(raw));

      const cleanPhone = normalizePhone(raw);

      if (cleanPhone) {
        identifiers.push(
          normalizeText(cleanPhone)
        );
      }
    });

    return [
      ...new Set(identifiers),
    ];
  };

  const userMatchesParent = (member, parent) => {
    const parentIdentifiers =
      getPersonIdentifiers(parent);

    const memberParentIdentifiers =
      getParentIdentifiers(member);

    if (
      parentIdentifiers.length === 0 ||
      memberParentIdentifiers.length === 0
    ) {
      return false;
    }

    return memberParentIdentifiers.some(
      (memberValue) =>
        parentIdentifiers.includes(
          memberValue
        )
    );
  };

  const parseUserData = (value) => {
    if (!value) {
      return {};
    }

    if (
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return value;
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);

        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          return parsed;
        }
      } catch (error) {
        console.log(
          "Could not parse deposit user_data:",
          error
        );
      }
    }

    return {};
  };

  const calculateMemberBonus = (
    member,
    approvedDeposits,
    level
  ) => {
    const memberPhone =
      normalizePhone(
        member?.phone ||
          member?.mobile ||
          ""
      );

    if (!memberPhone) {
      return 0;
    }

    const percent =
      Number(
        levelPercentages[level] || 0
      );

    if (percent <= 0) {
      return 0;
    }

    const totalDeposited =
      approvedDeposits
        .filter((deposit) => {
          return (
            normalizePhone(
              deposit.phone
            ) === memberPhone &&
            String(
              deposit.status || ""
            ).toLowerCase() ===
              "approved"
          );
        })
        .reduce(
          (total, deposit) =>
            total +
            Number(
              deposit.amount || 0
            ),
          0
        );

    return Number(
      (
        totalDeposited *
        percent /
        100
      ).toFixed(2)
    );
  };

  useEffect(() => {
    let cancelled = false;

    const loadTeam = async () => {
      const loggedIn =
        localStorage.getItem(
          "transportLoggedIn"
        );

      if (loggedIn !== "true") {
        window.location.replace(
          "/login"
        );
        return;
      }

      const savedUser =
        localStorage.getItem(
          "transportUser"
        );

      let currentUser = null;

      try {
        currentUser = savedUser
          ? JSON.parse(savedUser)
          : null;
      } catch (error) {
        console.log(
          "Could not load saved user:",
          error
        );
      }

      if (!currentUser) {
        window.location.replace(
          "/login"
        );
        return;
      }

      if (cancelled) {
        return;
      }

      setUser(currentUser);

      const currentPhone =
        normalizePhone(
          currentUser.phone ||
            currentUser.mobile ||
            currentUser.phoneNumber ||
            ""
        );

      if (!currentPhone) {
        setTeam([]);
        setLoading(false);
        return;
      }

      try {
        /*
         * --------------------------------------------------
         * LOAD ALL USERS FROM SUPABASE
         * --------------------------------------------------
         */
        const {
          data: usersData,
          error: usersError,
        } = await supabase
          .from("users")
          .select(
            "id, full_name, phone, referral_code, referred_by, referrer_code, referrer_phone, referral_bonus, total_referral_bonus, created_at"
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

        if (usersError) {
          console.error(
            "Could not load Supabase users for My Team:",
            usersError
          );

          setTeam([]);
          setLoading(false);
          return;
        }

        const allUsers =
          Array.isArray(usersData)
            ? usersData
            : [];

        /*
         * --------------------------------------------------
         * FIND CURRENT USER IN SUPABASE
         * --------------------------------------------------
         */
        const centralCurrentUser =
          allUsers.find(
            (person) =>
              normalizePhone(
                person.phone
              ) === currentPhone
          );

        const rootUser =
          centralCurrentUser ||
          {
            ...currentUser,

            phone:
              currentPhone,

            full_name:
              currentUser.fullName ||
              currentUser.full_name ||
              currentUser.name ||
              "",

            referral_bonus:
              Number(
                currentUser.referralBonus || 0
              ),

            total_referral_bonus:
              Number(
                currentUser.totalReferralBonus || 0
              ),
          };

        /*
         * --------------------------------------------------
         * LOAD SAVED REFERRAL BONUS
         * --------------------------------------------------
         */
        const currentReferralBonus =
          Number(
            centralCurrentUser?.referral_bonus ??
              currentUser.referralBonus ??
              0
          );

        const currentTotalReferralBonus =
          Number(
            centralCurrentUser?.total_referral_bonus ??
              currentUser.totalReferralBonus ??
              currentReferralBonus ??
              0
          );

        setSavedTotalBonus(
          currentTotalReferralBonus
        );

        /*
         * --------------------------------------------------
         * LOAD ALL DEPOSIT REQUESTS
         * --------------------------------------------------
         */
        const {
          data: depositsData,
          error: depositsError,
        } = await supabase
          .from("deposit_requests")
          .select(
            "id, user_data, deposit_amount, amount, status, created_at"
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

        if (depositsError) {
          console.log(
            "Could not load deposit requests for My Team:",
            depositsError
          );
        }

        const approvedDeposits =
          (
            Array.isArray(depositsData)
              ? depositsData
              : []
          ).map((row) => {
            const userData =
              parseUserData(
                row?.user_data
              );

            const phone =
              normalizePhone(
                userData.phone ||
                  userData.mobile ||
                  userData.phoneNumber ||
                  userData.mobileNumber ||
                  ""
              );

            const amount =
              Number(
                row.deposit_amount ??
                  row.amount ??
                  userData.deposit_amount ??
                  userData.amount ??
                  0
              );

            return {
              id:
                row.id || "",

              phone,
              amount,

              status:
                row.status ||
                "Pending",

              createdAt:
                row.created_at ||
                "",
            };
          });

        /*
         * --------------------------------------------------
         * BUILD 6-LEVEL TEAM
         * --------------------------------------------------
         */
        const usedPhones =
          new Set([
            currentPhone,
          ]);

        let parents = [
          rootUser,
        ];

        const allTeamMembers = [];

        for (
          let level = 1;
          level <= 6;
          level++
        ) {
          const currentLevelMembers =
            [];

          for (
            const candidate of allUsers
          ) {
            const candidatePhone =
              getUserPhone(
                candidate
              );

            if (
              !candidatePhone ||
              usedPhones.has(
                candidatePhone
              )
            ) {
              continue;
            }

            const isChild =
              parents.some(
                (parent) =>
                  userMatchesParent(
                    candidate,
                    parent
                  )
              );

            if (!isChild) {
              continue;
            }

            const memberBonus =
              calculateMemberBonus(
                candidate,
                approvedDeposits,
                level
              );

            const mappedMember =
              {
                id:
                  candidate.id || "",

                fullName:
                  candidate.full_name ||
                  "Unknown Member",

                phone:
                  candidatePhone,

                createdAt:
                  candidate.created_at ||
                  "",

                level,

                bonus:
                  memberBonus,

                bonusEarned:
                  memberBonus,

                referralBonus:
                  memberBonus,

                referralCode:
                  candidate.referral_code ||
                  "",

                referredBy:
                  candidate.referred_by ||
                  null,
              };

            currentLevelMembers.push(
              mappedMember
            );

            usedPhones.add(
              candidatePhone
            );

            allTeamMembers.push(
              mappedMember
            );
          }

          parents =
            currentLevelMembers.map(
              (member) =>
                allUsers.find(
                  (person) =>
                    normalizePhone(
                      person.phone
                    ) ===
                    normalizePhone(
                      member.phone
                    )
                ) || {
                  phone:
                    member.phone,

                  referral_code:
                    member.referralCode,
                }
            );
        }

        /*
         * --------------------------------------------------
         * FALLBACK FOR SAVED REFERRAL BONUS
         * --------------------------------------------------
         */
        if (
          allTeamMembers.length === 1 &&
          allTeamMembers[0].level === 1 &&
          Number(
            allTeamMembers[0].bonusEarned || 0
          ) === 0 &&
          currentReferralBonus > 0
        ) {
          allTeamMembers[0].bonus =
            currentReferralBonus;

          allTeamMembers[0].bonusEarned =
            currentReferralBonus;

          allTeamMembers[0].referralBonus =
            currentReferralBonus;
        }

        if (cancelled) {
          return;
        }

        setTeam(
          allTeamMembers
        );

        try {
          localStorage.setItem(
            "transportTeam_" +
              currentPhone,
            JSON.stringify(
              allTeamMembers
            )
          );
        } catch (error) {
          console.log(
            "Could not save team cache:",
            error
          );
        }

        if (centralCurrentUser) {
          const updatedLocalUser =
            {
              ...currentUser,

              fullName:
                centralCurrentUser.full_name ||
                currentUser.fullName ||
                "",

              phone:
                normalizePhone(
                  centralCurrentUser.phone
                ),

              referralCode:
                centralCurrentUser.referral_code ||
                currentUser.referralCode ||
                "",

              referredBy:
                centralCurrentUser.referred_by ??
                currentUser.referredBy ??
                null,

              referrerCode:
                centralCurrentUser.referrer_code ??
                currentUser.referrerCode ??
                null,

              referrerPhone:
                centralCurrentUser.referrer_phone ??
                currentUser.referrerPhone ??
                null,

              referralBonus:
                Number(
                  centralCurrentUser.referral_bonus ??
                    currentUser.referralBonus ??
                    0
                ),

              totalReferralBonus:
                Number(
                  centralCurrentUser.total_referral_bonus ??
                    currentUser.totalReferralBonus ??
                    0
                ),
            };

          localStorage.setItem(
            "transportUser",
            JSON.stringify(
              updatedLocalUser
            )
          );

          setUser(
            updatedLocalUser
          );
        }
      } catch (error) {
        console.error(
          "My Team Supabase loading error:",
          error
        );

        setTeam([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTeam();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#eef3f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Arial, sans-serif",
          color: "#102A43",
          fontSize: "18px",
          fontWeight: "700",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        Loading My Team...
      </div>
    );
  }

  const getLevelMembers = (level) => {
    return team.filter(
      (member) =>
        Number(
          member.level || 1
        ) === level
    );
  };

  const getMemberBonus = (member) => {
    return Number(
      member.bonusEarned ||
        member.bonus ||
        member.referralBonus ||
        0
    );
  };

  const calculatedTeamBonus =
    team.reduce(
      (total, member) =>
        total +
        getMemberBonus(
          member
        ),
      0
    );

  const totalBonus =
    Math.max(
      calculatedTeamBonus,
      Number(savedTotalBonus || 0)
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef3f7",
        padding: "25px 15px 50px",
        fontFamily:
          "Arial, sans-serif",
        color: "#ffffff",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #102A43, #173B5A)",
            borderRadius: "22px",
            padding: "28px 25px",
            color: "#ffffff",
            textAlign: "center",
            boxShadow:
              "0 12px 30px rgba(16, 42, 67, 0.20)",
            marginBottom: "20px",
            border:
              "1px solid #1E3A56",
            boxSizing:
              "border-box",
          }}
        >
          <div
            style={{
              fontSize: "42px",
              marginBottom: "8px",
            }}
          >
            👥
          </div>

          <h1
            style={{
              margin:
                "0 0 7px",
              fontSize: "30px",
              fontWeight: "800",
            }}
          >
            My Team
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#C9D8E6",
            }}
          >
            View your 6-level referral team
          </p>
        </div>

        {/* User Account */}
        {user && (
          <div
            style={{
              background: "#102A43",
              borderRadius: "18px",
              padding: "18px 20px",
              marginBottom: "18px",
              border:
                "1px solid #1E3A56",
              boxShadow:
                "0 6px 18px rgba(16, 42, 67, 0.12)",
              display: "flex",
              alignItems: "center",
              gap: "15px",
              boxSizing:
                "border-box",
              minWidth:
                0,
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "#1E3A56",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "25px",
                flexShrink: 0,
              }}
            >
              👤
            </div>

            <div
              style={{
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: "19px",
                  fontWeight: "800",
                  color: "#ffffff",
                  overflowWrap:
                    "anywhere",
                }}
              >
                {user.fullName ||
                  user.name ||
                  user.username ||
                  "User"}
              </div>

              <div
                style={{
                  color: "#9FB3C8",
                  fontSize: "13px",
                  marginTop:
                    "3px",
                }}
              >
                Your account
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div
          className="teamSummaryGrid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          {/* Team Members */}
          <div
            style={{
              background: "#102A43",
              borderRadius:
                "18px",
              padding: "20px",
              border:
                "1px solid #1E3A56",
              boxShadow:
                "0 6px 18px rgba(16, 42, 67, 0.12)",
              minWidth: 0,
              boxSizing:
                "border-box",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "13px",
                background:
                  "#1E3A56",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: "25px",
                marginBottom:
                  "10px",
              }}
            >
              👥
            </div>

            <div
              style={{
                fontSize: "13px",
                color:
                  "#9FB3C8",
                marginBottom:
                  "5px",
              }}
            >
              Total Team Members
            </div>

            <strong
              style={{
                fontSize: "28px",
                color:
                  "#ffffff",
              }}
            >
              {team.length}
            </strong>
          </div>

          {/* Bonus */}
          <div
            style={{
              background:
                "#102A43",
              borderRadius:
                "18px",
              padding: "20px",
              border:
                "1px solid #294B66",
              boxShadow:
                "0 6px 18px rgba(16, 42, 67, 0.12)",
              minWidth: 0,
              boxSizing:
                "border-box",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "13px",
                background:
                  "#1E3A56",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: "25px",
                marginBottom:
                  "10px",
              }}
            >
              💰
            </div>

            <div
              style={{
                fontSize: "13px",
                color:
                  "#9FB3C8",
                marginBottom:
                  "5px",
              }}
            >
              Total Bonus Earned
            </div>

            <strong
              style={{
                fontSize: "28px",
                color:
                  "#8FD694",
                overflowWrap:
                  "anywhere",
              }}
            >
              PKR{" "}
              {totalBonus.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Levels */}
        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            gap: "18px",
            width: "100%",
            minWidth: 0,
          }}
        >
          {levels.map(
            (levelInfo) => {
              const levelMembers =
                getLevelMembers(
                  levelInfo.level
                );

              let levelBonus =
                levelMembers.reduce(
                  (
                    total,
                    member
                  ) =>
                    total +
                    getMemberBonus(
                      member
                    ),
                  0
                );

              if (
                levelInfo.level === 1 &&
                levelMembers.length === 1 &&
                levelBonus === 0 &&
                Number(
                  savedTotalBonus || 0
                ) > 0
              ) {
                levelBonus =
                  Number(
                    savedTotalBonus
                  );
              }

              return (
                <div
                  key={
                    levelInfo.level
                  }
                  style={{
                    background:
                      "#102A43",
                    borderRadius:
                      "20px",
                    border:
                      "1px solid #1E3A56",
                    boxShadow:
                      "0 8px 22px rgba(16, 42, 67, 0.13)",
                    overflow:
                      "hidden",
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    minWidth:
                      0,
                  }}
                >
                  {/* Level Header */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #102A43, #173B5A)",
                      padding:
                        "18px 20px",
                      color:
                        "#ffffff",
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: "12px",
                      borderBottom:
                        "1px solid #1E3A56",
                      flexWrap:
                        "wrap",
                      boxSizing:
                        "border-box",
                    }}
                  >
                    <div
                      style={{
                        minWidth:
                          0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "22px",
                          fontWeight:
                            "800",
                        }}
                      >
                        {
                          levelInfo.name
                        }
                      </div>

                      <div
                        style={{
                          fontSize:
                            "12px",
                          marginTop:
                            "4px",
                          color:
                            "#C9D8E6",
                        }}
                      >
                        Referral Bonus:{" "}
                        {
                          levelInfo.bonus
                        }
                      </div>
                    </div>

                    <div
                      style={{
                        background:
                          "#1E3A56",
                        padding:
                          "9px 15px",
                        borderRadius:
                          "12px",
                        fontSize:
                          "13px",
                        fontWeight:
                          "700",
                        color:
                          "#C9D8E6",
                        flexShrink:
                          0,
                      }}
                    >
                      {
                        levelMembers.length
                      }{" "}
                      Members
                    </div>
                  </div>

                  {/* Level Summary */}
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: "15px",
                      padding:
                        "15px 20px",
                      background:
                        "#173B5A",
                      borderBottom:
                        "1px solid #294B66",
                      flexWrap:
                        "wrap",
                      boxSizing:
                        "border-box",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color:
                            "#9FB3C8",
                          fontSize:
                            "12px",
                        }}
                      >
                        Total Members
                      </span>

                      <div
                        style={{
                          color:
                            "#ffffff",
                          fontSize:
                            "20px",
                          fontWeight:
                            "800",
                          marginTop:
                            "3px",
                        }}
                      >
                        {
                          levelMembers.length
                        }
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign:
                          "right",
                      }}
                    >
                      <span
                        style={{
                          color:
                            "#9FB3C8",
                          fontSize:
                            "12px",
                        }}
                      >
                        Level Bonus
                      </span>

                      <div
                        style={{
                          color:
                            "#8FD694",
                          fontSize:
                            "18px",
                          fontWeight:
                            "800",
                          marginTop:
                            "3px",
                        }}
                      >
                        PKR{" "}
                        {levelBonus.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Members */}
                  <div
                    style={{
                      padding:
                        "10px 15px 15px",
                      width:
                        "100%",
                      boxSizing:
                        "border-box",
                      minWidth:
                        0,
                      overflowX:
                        "auto",
                      overflowY:
                        "hidden",
                    }}
                  >
                    {levelMembers.length >
                    0 ? (
                      <div
                        style={{
                          minWidth:
                            "620px",
                          width:
                            "100%",
                        }}
                      >
                        {levelMembers.map(
                          (
                            member,
                            index
                          ) => (
                            <div
                              key={
                                member.id ||
                                member.phone ||
                                index
                              }
                              className="teamMemberRow"
                              style={{
                                display:
                                  "grid",
                                gridTemplateColumns:
                                  "42px 1.6fr 1.2fr 1fr 1fr",
                                alignItems:
                                  "center",
                                gap:
                                  "12px",
                                padding:
                                  "14px 10px",
                                borderBottom:
                                  index ===
                                  levelMembers.length - 1
                                    ? "none"
                                    : "1px solid #294B66",
                                minWidth:
                                  "620px",
                                width:
                                  "100%",
                                boxSizing:
                                  "border-box",
                              }}
                            >
                              {/* Icon */}
                              <div
                                style={{
                                  width:
                                    "40px",
                                  height:
                                    "40px",
                                  borderRadius:
                                    "50%",
                                  background:
                                    "#1E3A56",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  fontSize:
                                    "19px",
                                  flexShrink:
                                    0,
                                }}
                              >
                                👤
                              </div>

                              {/* Name */}
                              <div
                                style={{
                                  minWidth:
                                    0,
                                  overflow:
                                    "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize:
                                      "14px",
                                    fontWeight:
                                      "800",
                                    color:
                                      "#ffffff",
                                    whiteSpace:
                                      "nowrap",
                                    overflow:
                                      "hidden",
                                    textOverflow:
                                      "ellipsis",
                                  }}
                                >
                                  {
                                    member.fullName
                                  }
                                </div>

                                <div
                                  style={{
                                    fontSize:
                                      "10px",
                                    color:
                                      "#9FB3C8",
                                    marginTop:
                                      "3px",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  Member #
                                  {
                                    index +
                                    1
                                  }
                                </div>
                              </div>

                              {/* Mobile */}
                              <div
                                style={{
                                  minWidth:
                                    0,
                                  overflow:
                                    "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize:
                                      "10px",
                                    color:
                                      "#9FB3C8",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  Mobile
                                </div>

                                <div
                                  style={{
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      "700",
                                    color:
                                      "#ffffff",
                                    marginTop:
                                      "3px",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  {
                                    member.phone
                                  }
                                </div>
                              </div>

                              {/* Joined */}
                              <div
                                style={{
                                  minWidth:
                                    0,
                                  overflow:
                                    "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize:
                                      "10px",
                                    color:
                                      "#9FB3C8",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  Joined
                                </div>

                                <div
                                  style={{
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      "700",
                                    color:
                                      "#ffffff",
                                    marginTop:
                                      "3px",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  {
                                    member.createdAt
                                      ? new Date(
                                          member.createdAt
                                        ).toLocaleDateString(
                                          "en-GB"
                                        )
                                      : "N/A"
                                  }
                                </div>
                              </div>

                              {/* Bonus */}
                              <div
                                style={{
                                  textAlign:
                                    "right",
                                  minWidth:
                                    0,
                                  overflow:
                                    "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize:
                                      "10px",
                                    color:
                                      "#9FB3C8",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  Bonus
                                </div>

                                <div
                                  style={{
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      "800",
                                    color:
                                      "#8FD694",
                                    marginTop:
                                      "3px",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  PKR{" "}
                                  {getMemberBonus(
                                    member
                                  ).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign:
                            "center",
                          padding:
                            "28px 10px",
                          color:
                            "#9FB3C8",
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              "30px",
                            marginBottom:
                              "7px",
                          }}
                        >
                          👤
                        </div>

                        <div
                          style={{
                            fontSize:
                              "14px",
                            fontWeight:
                              "700",
                            color:
                              "#C9D8E6",
                          }}
                        >
                          No Members Yet
                        </div>

                        <div
                          style={{
                            fontSize:
                              "12px",
                            marginTop:
                              "4px",
                            color:
                              "#9FB3C8",
                          }}
                        >
                          Members at this level will appear here.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Back Button */}
        <button
          onClick={() => {
            window.location.href =
              "/";
          }}
          style={{
            width:
              "100%",
            marginTop:
              "25px",
            padding:
              "15px",
            border:
              "1px solid #1E3A56",
            borderRadius:
              "14px",
            background:
              "#102A43",
            color:
              "#ffffff",
            fontSize:
              "15px",
            fontWeight:
              "800",
            cursor:
              "pointer",
            boxShadow:
              "0 7px 18px rgba(16, 42, 67, 0.15)",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          .teamSummaryGrid {
            grid-template-columns: 1fr !important;
          }

          .teamMemberRow {
            grid-template-columns:
              42px
              1.6fr
              1.2fr
              1fr
              1fr !important;

            gap: 10px !important;
            min-width: 620px !important;
          }
        }

        @media (max-width: 480px) {
          .teamMemberRow {
            grid-template-columns:
              40px
              1.5fr
              1.15fr
              0.95fr
              0.95fr !important;

            min-width: 600px !important;
            gap: 9px !important;
            padding: 12px 8px !important;
          }

          .teamMemberRow > div:nth-child(2) > div:first-child {
            font-size: 12px !important;
          }

          .teamMemberRow > div:nth-child(3) > div:last-child,
          .teamMemberRow > div:nth-child(4) > div:last-child,
          .teamMemberRow > div:nth-child(5) > div:last-child {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}