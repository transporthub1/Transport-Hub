"use client";

export default function TransportPlans() {
  const plans = [
    { name: "Starter Transport Plan", price: 100, daily: 15, duration: 120 },
    { name: "Basic Transport Plan", price: 500, daily: 75, duration: 120 },
    { name: "Standard Transport Plan", price: 1500, daily: 225, duration: 120 },
    { name: "Premium Transport Plan", price: 3500, daily: 525, duration: 120 },
    { name: "Advanced Transport Plan", price: 7500, daily: 1125, duration: 120 },
    { name: "Professional Transport Plan", price: 13000, daily: 1950, duration: 120 },
    { name: "Elite Transport Plan", price: 25000, daily: 3750, duration: 120 },
    { name: "Executive Transport Plan", price: 50000, daily: 7500, duration: 120 },
    { name: "Platinum Transport Plan", price: 125000, daily: 18750, duration: 120 },
    { name: "Diamond Transport Plan", price: 175000, daily: 26250, duration: 120 },
    { name: "Royal Transport Plan", price: 225000, daily: 33750, duration: 120 },
    { name: "Grand Royal Transport Plan", price: 300000, daily: 45000, duration: 120 }
  ];

  const badges = [
    "STARTER",
    "BASIC",
    "STANDARD",
    "PREMIUM",
    "ADVANCED",
    "PRO",
    "ELITE",
    "EXECUTIVE",
    "PLATINUM",
    "DIAMOND",
    "ROYAL",
    "ULTIMATE"
  ];

  function selectPlan(plan) {
    const name = encodeURIComponent(plan.name);

    window.location.href =
      "/plan-confirmation?name=" +
      name +
      "&price=" +
      plan.price +
      "&daily=" +
      plan.daily +
      "&duration=" +
      plan.duration;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f7f1",
        color: "#173b2b",
        padding: "30px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto"
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "22px",
            gap: "15px"
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 900,
                color: "#102A43"
              }}
            >
              Transport Plans
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: "13px",
                color: "#718278"
              }}
            >
              Choose a plan and start your journey.
            </p>
          </div>

          <div
            style={{
              background: "#102A43",
              color: "#ffffff",
              border: "1px solid #1E3A56",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "11px",
              fontWeight: 800,
              boxShadow: "0 5px 15px rgba(16,42,67,.12)"
            }}
          >
            👤 User
          </div>
        </div>

        {/* Available Plans Header */}
        <div
          style={{
            background: "#102A43",
            border: "1px solid #1E3A56",
            borderRadius: "15px",
            padding: "18px 20px",
            marginBottom: "20px",
            boxShadow: "0 7px 20px rgba(16,42,67,.12)"
          }}
        >
          <h2
            style={{
              margin: "0 0 5px",
              fontSize: "18px",
              fontWeight: 900,
              color: "#ffffff"
            }}
          >
            Available Plans
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#C9D8E6"
            }}
          >
            Select the plan that suits your investment.
          </p>
        </div>

        {/* Plans */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "15px"
          }}
        >
          {plans.map(function (plan, index) {
            const totalReturn = plan.daily * plan.duration;

            return (
              <div
                key={index}
                style={{
                  background: "#102A43",
                  border: "1px solid #1E3A56",
                  borderRadius: "15px",
                  padding: "16px",
                  boxShadow: "0 8px 22px rgba(16,42,67,.12)",
                  boxSizing: "border-box",
                  color: "#ffffff"
                }}
              >
                {/* Card Top */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "9px"
                  }}
                >
                  <span
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "11px",
                      background: "#1E3A56",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      border: "1px solid rgba(143,214,148,.18)"
                    }}
                  >
                    🚛
                  </span>

                  <span
                    style={{
                      background: "#1E3A56",
                      color: "#8FD694",
                      border: "1px solid rgba(143,214,148,.25)",
                      padding: "5px 8px",
                      borderRadius: "20px",
                      fontSize: "8px",
                      fontWeight: 900
                    }}
                  >
                    {badges[index]}
                  </span>
                </div>

                {/* Plan Name */}
                <h3
                  style={{
                    margin: "0 0 10px",
                    fontSize: "14px",
                    lineHeight: 1.3,
                    fontWeight: 900,
                    color: "#ffffff"
                  }}
                >
                  {plan.name}
                </h3>

                {/* Investment */}
                <div
                  style={{
                    background: "#173B5A",
                    border: "1px solid #1E3A56",
                    borderRadius: "10px",
                    padding: "11px",
                    marginBottom: "11px"
                  }}
                >
                  <div
                    style={{
                      fontSize: "8px",
                      fontWeight: 700,
                      color: "#C9D8E6",
                      textTransform: "uppercase",
                      marginBottom: "4px"
                    }}
                  >
                    Investment
                  </div>

                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 900,
                      color: "#8FD694"
                    }}
                  >
                    PKR {plan.price.toLocaleString()}
                  </div>
                </div>

                {/* Details */}
                <div
                  style={{
                    borderTop: "1px solid #29435A",
                    paddingTop: "7px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "5px 0"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#C9D8E6"
                      }}
                    >
                      Daily Return
                    </span>

                    <strong
                      style={{
                        fontSize: "10px",
                        color: "#ffffff"
                      }}
                    >
                      PKR {plan.daily.toLocaleString()}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "5px 0"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#C9D8E6"
                      }}
                    >
                      Duration
                    </span>

                    <strong
                      style={{
                        fontSize: "10px",
                        color: "#ffffff"
                      }}
                    >
                      {plan.duration} Days
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "5px 0"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#C9D8E6"
                      }}
                    >
                      Total Return
                    </span>

                    <strong
                      style={{
                        fontSize: "10px",
                        color: "#8FD694"
                      }}
                    >
                      PKR {totalReturn.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  type="button"
                  onClick={function () {
                    selectPlan(plan);
                  }}
                  style={{
                    width: "100%",
                    marginTop: "11px",
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #2c8a59, #1f6b45)",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 5px 12px rgba(31,107,69,.20)"
                  }}
                >
                  Select Plan
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Text */}
        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            color: "#849189",
            fontSize: "11px"
          }}
        >
          Scroll down to view more plans ↓
        </div>
      </div>
    </div>
  );
}