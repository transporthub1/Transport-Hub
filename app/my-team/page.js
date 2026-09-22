"use client";

import { useEffect, useState } from "react";

export default function MyTeam() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  const levels = [
    { level: 1, name: "Level 1", bonus: "10%" },
    { level: 2, name: "Level 2", bonus: "5%" },
    { level: 3, name: "Level 3", bonus: "3%" },
    { level: 4, name: "Level 4", bonus: "2%" },
    { level: 5, name: "Level 5", bonus: "1%" },
    { level: 6, name: "Level 6", bonus: "0.5%" },
  ];

  useEffect(() => {
    const loggedIn = localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      window.location.replace("/login");
      return;
    }

    const savedUser = localStorage.getItem("transportUser");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.log("Could not load user");
      }
    }

    const savedTeam = localStorage.getItem("transportTeam");

    if (savedTeam) {
      try {
        setTeam(JSON.parse(savedTeam));
      } catch (error) {
        console.log("Could not load team");
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return null;
  }

  const getLevelMembers = (level) => {
    return team.filter((member) => Number(member.level || 1) === level);
  };

  const getMemberBonus = (member) => {
    return Number(member.bonusEarned || member.bonus || 0);
  };

  const totalBonus = team.reduce((total, member) => {
    return total + getMemberBonus(member);
  }, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef3f7",
        padding: "25px 15px 50px",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #102A43, #173B5A)",
            borderRadius: "22px",
            padding: "28px 25px",
            color: "#ffffff",
            textAlign: "center",
            boxShadow: "0 12px 30px rgba(16, 42, 67, 0.20)",
            marginBottom: "20px",
            border: "1px solid #1E3A56",
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "8px" }}>👥</div>

          <h1
            style={{
              margin: "0 0 7px",
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
              border: "1px solid #1E3A56",
              boxShadow: "0 6px 18px rgba(16, 42, 67, 0.12)",
              display: "flex",
              alignItems: "center",
              gap: "15px",
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

            <div>
              <div
                style={{
                  fontSize: "19px",
                  fontWeight: "800",
                  color: "#ffffff",
                }}
              >
                {user.fullName}
              </div>

              <div
                style={{
                  color: "#9FB3C8",
                  fontSize: "13px",
                  marginTop: "3px",
                }}
              >
                Your account
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          {/* Team Members */}
          <div
            style={{
              background: "#102A43",
              borderRadius: "18px",
              padding: "20px",
              border: "1px solid #1E3A56",
              boxShadow: "0 6px 18px rgba(16, 42, 67, 0.12)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "13px",
                background: "#1E3A56",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "25px",
                marginBottom: "10px",
              }}
            >
              👥
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#9FB3C8",
                marginBottom: "5px",
              }}
            >
              Total Team Members
            </div>

            <strong
              style={{
                fontSize: "28px",
                color: "#ffffff",
              }}
            >
              {team.length}
            </strong>
          </div>

          {/* Bonus */}
          <div
            style={{
              background: "#102A43",
              borderRadius: "18px",
              padding: "20px",
              border: "1px solid #294B66",
              boxShadow: "0 6px 18px rgba(16, 42, 67, 0.12)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "13px",
                background: "#1E3A56",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "25px",
                marginBottom: "10px",
              }}
            >
              💰
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#9FB3C8",
                marginBottom: "5px",
              }}
            >
              Total Bonus Earned
            </div>

            <strong
              style={{
                fontSize: "28px",
                color: "#8FD694",
              }}
            >
              PKR {totalBonus.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Levels */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {levels.map((levelInfo) => {
            const levelMembers = getLevelMembers(levelInfo.level);

            const levelBonus = levelMembers.reduce((total, member) => {
              return total + getMemberBonus(member);
            }, 0);

            return (
              <div
                key={levelInfo.level}
                style={{
                  background: "#102A43",
                  borderRadius: "20px",
                  border: "1px solid #1E3A56",
                  boxShadow: "0 8px 22px rgba(16, 42, 67, 0.13)",
                  overflow: "hidden",
                }}
              >
                {/* Level Header */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #102A43, #173B5A)",
                    padding: "18px 20px",
                    color: "#ffffff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #1E3A56",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "800",
                      }}
                    >
                      {levelInfo.name}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        marginTop: "4px",
                        color: "#C9D8E6",
                      }}
                    >
                      Referral Bonus: {levelInfo.bonus}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#1E3A56",
                      padding: "9px 15px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#C9D8E6",
                    }}
                  >
                    {levelMembers.length} Members
                  </div>
                </div>

                {/* Level Summary */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "15px 20px",
                    background: "#173B5A",
                    borderBottom: "1px solid #294B66",
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: "#9FB3C8",
                        fontSize: "12px",
                      }}
                    >
                      Total Members
                    </span>

                    <div
                      style={{
                        color: "#ffffff",
                        fontSize: "20px",
                        fontWeight: "800",
                        marginTop: "3px",
                      }}
                    >
                      {levelMembers.length}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        color: "#9FB3C8",
                        fontSize: "12px",
                      }}
                    >
                      Level Bonus
                    </span>

                    <div
                      style={{
                        color: "#8FD694",
                        fontSize: "18px",
                        fontWeight: "800",
                        marginTop: "3px",
                      }}
                    >
                      PKR {levelBonus.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div style={{ padding: "10px 15px 15px" }}>
                  {levelMembers.length > 0 ? (
                    levelMembers.map((member, index) => (
                      <div
                        key={index}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "45px 1.5fr 1fr 1fr 1fr",
                          alignItems: "center",
                          gap: "12px",
                          padding: "14px 10px",
                          borderBottom:
                            index === levelMembers.length - 1
                              ? "none"
                              : "1px solid #294B66",
                        }}
                      >
                        {/* Icon */}
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "#1E3A56",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "19px",
                          }}
                        >
                          👤
                        </div>

                        {/* Name */}
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "800",
                              color: "#ffffff",
                            }}
                          >
                            {member.fullName || "Unknown Member"}
                          </div>

                          <div
                            style={{
                              fontSize: "10px",
                              color: "#9FB3C8",
                              marginTop: "3px",
                            }}
                          >
                            Member #{index + 1}
                          </div>
                        </div>

                        {/* Mobile */}
                        <div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#9FB3C8",
                            }}
                          >
                            Mobile
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#ffffff",
                              marginTop: "3px",
                            }}
                          >
                            {member.phone || "N/A"}
                          </div>
                        </div>

                        {/* Joined */}
                        <div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#9FB3C8",
                            }}
                          >
                            Joined
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#ffffff",
                              marginTop: "3px",
                            }}
                          >
                            {member.createdAt
                              ? new Date(
                                  member.createdAt
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>

                        {/* Bonus */}
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#9FB3C8",
                            }}
                          >
                            Bonus
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "800",
                              color: "#8FD694",
                              marginTop: "3px",
                            }}
                          >
                            PKR {getMemberBonus(member).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "28px 10px",
                        color: "#9FB3C8",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "30px",
                          marginBottom: "7px",
                        }}
                      >
                        👤
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "#C9D8E6",
                        }}
                      >
                        No Members Yet
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "4px",
                          color: "#9FB3C8",
                        }}
                      >
                        Members at this level will appear here.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            width: "100%",
            marginTop: "25px",
            padding: "15px",
            border: "1px solid #1E3A56",
            borderRadius: "14px",
            background: "#102A43",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "800",
            cursor: "pointer",
            boxShadow: "0 7px 18px rgba(16, 42, 67, 0.15)",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}