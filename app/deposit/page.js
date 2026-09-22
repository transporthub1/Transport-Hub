"use client";

import { useEffect, useState } from "react";

const plans = [
  { id: 1, name: "Starter", price: 100, daily: 15, duration: 120 },
  { id: 2, name: "Basic", price: 500, daily: 75, duration: 120 },
  { id: 3, name: "Standard", price: 1500, daily: 225, duration: 120 },
  { id: 4, name: "Premium", price: 3500, daily: 525, duration: 120 },
  { id: 5, name: "Advanced", price: 7500, daily: 1125, duration: 120 },
  { id: 6, name: "Professional", price: 13000, daily: 1950, duration: 120 },
  { id: 7, name: "Elite", price: 25000, daily: 3750, duration: 120 },
  { id: 8, name: "Executive", price: 50000, daily: 7500, duration: 120 },
  { id: 9, name: "Platinum", price: 125000, daily: 18750, duration: 120 },
  { id: 10, name: "Diamond", price: 175000, daily: 26250, duration: 120 },
  { id: 11, name: "Royal", price: 225000, daily: 33750, duration: 120 },
  { id: 12, name: "Grand Royal", price: 300000, daily: 45000, duration: 120 }
];

export default function Deposit() {
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [bankName, setBankName] = useState("");
  const [message, setMessage] = useState("");
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      window.location.href = "/login";
      return;
    }

    const savedUser = localStorage.getItem("transportUser");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.log("User data could not be loaded");
      }
    }

    const savedPlan = localStorage.getItem("transportSelectedPlan");

    if (savedPlan) {
      try {
        const parsedPlan = JSON.parse(savedPlan);

        if (parsedPlan && parsedPlan.price) {
          setSelectedPlan(parsedPlan);
          setShowPlans(false);
          return;
        }
      } catch (error) {
        console.log("Selected plan could not be loaded");
      }
    }

    setShowPlans(true);
  }, []);

  const selectPlan = (plan) => {
    const planData = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      daily: plan.daily,
      duration: plan.duration,
      totalReturn: plan.daily * plan.duration
    };

    setSelectedPlan(planData);
    setShowPlans(false);
    setBankName("");
    setMessage("");

    localStorage.setItem(
      "transportSelectedPlan",
      JSON.stringify(planData)
    );
  };

  const backToPlans = () => {
    setSelectedPlan(null);
    setBankName("");
    setMessage("");
    setShowPlans(true);

    localStorage.removeItem("transportSelectedPlan");
  };

  const submitDeposit = (event) => {
    event.preventDefault();

    if (!selectedPlan) {
      setMessage("Please select a plan first.");
      return;
    }

    if (!bankName.trim()) {
      setMessage("Please enter your bank name.");
      return;
    }

    let requests = [];

    const savedRequests = localStorage.getItem(
      "transportDepositRequests"
    );

    if (savedRequests) {
      try {
        const parsedRequests = JSON.parse(savedRequests);

        if (Array.isArray(parsedRequests)) {
          requests = parsedRequests;
        }
      } catch (error) {
        requests = [];
      }
    }

    const depositRequest = {
      id:
        "deposit-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 8),

      fullName: user?.fullName || "",
      phone: user?.phone || "",
      bankName: bankName.trim(),

      planId: selectedPlan.id,
      planName: selectedPlan.name,

      amount: Number(selectedPlan.price),
      dailyReturn: Number(selectedPlan.daily),
      duration: Number(selectedPlan.duration),
      totalReturn: Number(selectedPlan.totalReturn),

      status: "Pending",
      submittedAt: new Date().toISOString()
    };

    requests.push(depositRequest);

    localStorage.setItem(
      "transportDepositRequests",
      JSON.stringify(requests)
    );

    localStorage.setItem(
      "transportDepositRequest",
      JSON.stringify(depositRequest)
    );

    setMessage(
      "Deposit request submitted successfully. It is pending verification."
    );

    setBankName("");
  };

  if (!user) {
    return (
      <div style={styles.loading}>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <header style={styles.header}>
          <div style={styles.headerIcon}>💰</div>

          <div>
            <h1 style={styles.title}>
              Make a Deposit
            </h1>

            <p style={styles.subtitle}>
              {showPlans
                ? "Select a transport plan to continue"
                : "Complete your deposit request"}
            </p>
          </div>
        </header>

        {showPlans && (
          <div>

            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                Select Your Transport Plan
              </h2>

              <p style={styles.sectionText}>
                Choose an investment plan below to continue.
              </p>
            </div>

            <div style={styles.plansGrid}>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  style={styles.planCard}
                >
                  <div style={styles.planTop}>

                    <div>
                      <h3 style={styles.planName}>
                        {plan.name}
                      </h3>

                      <span style={styles.planTag}>
                        Transport Plan
                      </span>
                    </div>

                    <div style={styles.planIcon}>
                      🚛
                    </div>

                  </div>

                  <div style={styles.investmentBox}>
                    <p style={styles.investmentLabel}>
                      Investment
                    </p>

                    <strong style={styles.investmentAmount}>
                      PKR {plan.price.toLocaleString()}
                    </strong>
                  </div>

                  <div style={styles.smallDetails}>

                    <div style={styles.smallBox}>
                      <span style={styles.smallLabel}>
                        Daily Return
                      </span>

                      <strong style={styles.smallValue}>
                        PKR {plan.daily.toLocaleString()}
                      </strong>
                    </div>

                    <div style={styles.smallBox}>
                      <span style={styles.smallLabel}>
                        Duration
                      </span>

                      <strong style={styles.smallValue}>
                        {plan.duration} Days
                      </strong>
                    </div>

                  </div>

                  <button
                    onClick={() => selectPlan(plan)}
                    style={styles.selectButton}
                  >
                    Select Plan →
                  </button>

                </div>
              ))}
            </div>

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              style={styles.dashboardButton}
            >
              ← Back to Dashboard
            </button>

          </div>
        )}

        {!showPlans && selectedPlan && (
          <div style={styles.formWrapper}>

            <div style={styles.selectedCard}>

              <div style={styles.selectedIcon}>
                🚛
              </div>

              <div style={styles.selectedInfo}>
                <span style={styles.selectedLabel}>
                  Selected Transport Plan
                </span>

                <h2 style={styles.selectedName}>
                  {selectedPlan.name}
                </h2>

                <div style={styles.selectedDetails}>
                  <span>
                    Investment:{" "}
                    <strong>
                      PKR {selectedPlan.price.toLocaleString()}
                    </strong>
                  </span>

                  <span>
                    Daily:{" "}
                    <strong>
                      PKR {selectedPlan.daily.toLocaleString()}
                    </strong>
                  </span>

                  <span>
                    {selectedPlan.duration} Days
                  </span>
                </div>
              </div>

            </div>

            <div style={styles.formCard}>

              <h2 style={styles.formTitle}>
                Deposit Details
              </h2>

              <p style={styles.formSubtitle}>
                Enter your bank details to submit the deposit request.
              </p>

              <form onSubmit={submitDeposit}>

                <label style={styles.label}>
                  Full Name
                </label>

                <input
                  type="text"
                  value={user.fullName || ""}
                  readOnly
                  style={styles.readOnlyInput}
                />

                <label style={styles.label}>
                  Mobile Number
                </label>

                <input
                  type="text"
                  value={user.phone || ""}
                  readOnly
                  style={styles.readOnlyInput}
                />

                <label style={styles.label}>
                  Bank Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your bank name"
                  value={bankName}
                  onChange={(event) =>
                    setBankName(event.target.value)
                  }
                  style={styles.input}
                />

                <label style={styles.label}>
                  Deposit Amount
                </label>

                <input
                  type="text"
                  value={
                    "PKR " +
                    selectedPlan.price.toLocaleString()
                  }
                  readOnly
                  style={styles.amountInput}
                />

                <button
                  type="submit"
                  style={styles.submitButton}
                >
                  ✓ Submit Deposit Request
                </button>

              </form>

              {message && (
                <div
                  style={{
                    ...styles.message,
                    background: message.includes("successfully")
                      ? "#173B5A"
                      : "#3B3420",
                    color: message.includes("successfully")
                      ? "#8FD694"
                      : "#FFD98A",
                    border: message.includes("successfully")
                      ? "1px solid #315674"
                      : "1px solid #66572E"
                  }}
                >
                  {message.includes("successfully")
                    ? "✓ "
                    : "⚠️ "}
                  {message}
                </div>
              )}

              <button
                onClick={backToPlans}
                style={styles.changePlanButton}
              >
                ← Select Another Plan
              </button>

              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                style={styles.dashboardButton}
              >
                ← Back to Dashboard
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef3f7",
    color: "#102A43",
    fontFamily: "Arial, sans-serif",
    padding: "30px 20px 50px"
  },

  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto"
  },

  loading: {
    minHeight: "100vh",
    background: "#eef3f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    color: "#102A43"
  },

  header: {
    background: "linear-gradient(135deg, #102A43, #173B5A)",
    borderRadius: "20px",
    padding: "25px 28px",
    color: "#ffffff",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 10px 25px rgba(16,42,67,0.18)"
  },

  headerIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "15px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    border: "1px solid rgba(255,255,255,0.08)"
  },

  title: {
    margin: 0,
    fontSize: "27px",
    fontWeight: 800
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#C9D8E6",
    fontSize: "13px"
  },

  sectionHeader: {
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "18px",
    padding: "22px",
    marginBottom: "20px",
    boxShadow: "0 8px 22px rgba(16,42,67,0.12)"
  },

  sectionTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "20px"
  },

  sectionText: {
    margin: "6px 0 0",
    color: "#C9D8E6",
    fontSize: "12px"
  },

  plansGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "17px"
  },

  planCard: {
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "17px",
    padding: "19px",
    boxShadow: "0 9px 24px rgba(16,42,67,0.14)"
  },

  planTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "15px"
  },

  planName: {
    margin: 0,
    fontSize: "17px",
    color: "#ffffff",
    fontWeight: 800
  },

  planTag: {
    display: "inline-block",
    marginTop: "4px",
    color: "#9FB3C4",
    fontSize: "9px"
  },

  planIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },

  investmentBox: {
    background: "#173B5A",
    border: "1px solid #294B66",
    borderRadius: "11px",
    padding: "13px",
    marginBottom: "12px"
  },

  investmentLabel: {
    margin: "0 0 4px",
    color: "#AFC1D0",
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase"
  },

  investmentAmount: {
    color: "#8FD694",
    fontSize: "21px"
  },

  smallDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "14px"
  },

  smallBox: {
    background: "#173B5A",
    border: "1px solid #294B66",
    borderRadius: "9px",
    padding: "10px"
  },

  smallLabel: {
    display: "block",
    color: "#AFC1D0",
    fontSize: "9px"
  },

  smallValue: {
    display: "block",
    marginTop: "3px",
    color: "#FFFFFF",
    fontSize: "12px"
  },

  selectButton: {
    width: "100%",
    height: "43px",
    border: 0,
    borderRadius: "9px",
    background: "linear-gradient(135deg, #4CAF50, #72C978)",
    color: "#102A43",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer"
  },

  formWrapper: {
    maxWidth: "680px",
    margin: "0 auto"
  },

  selectedCard: {
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 9px 24px rgba(16,42,67,0.14)"
  },

  selectedIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "15px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px"
  },

  selectedInfo: {
    flex: 1
  },

  selectedLabel: {
    display: "block",
    color: "#AFC1D0",
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase"
  },

  selectedName: {
    margin: "4px 0 8px",
    color: "#ffffff",
    fontSize: "20px"
  },

  selectedDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    color: "#C9D8E6",
    fontSize: "10px"
  },

  formCard: {
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "20px",
    padding: "26px",
    boxShadow: "0 10px 28px rgba(16,42,67,0.15)"
  },

  formTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "21px"
  },

  formSubtitle: {
    margin: "6px 0 22px",
    color: "#AFC1D0",
    fontSize: "12px"
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#C9D8E6",
    fontSize: "12px",
    fontWeight: 700
  },

  input: {
    width: "100%",
    height: "48px",
    padding: "0 14px",
    border: "1px solid #365873",
    borderRadius: "10px",
    background: "#173B5A",
    color: "#ffffff",
    fontSize: "13px",
    boxSizing: "border-box",
    marginBottom: "17px",
    outline: "none"
  },

  readOnlyInput: {
    width: "100%",
    height: "48px",
    padding: "0 14px",
    border: "1px solid #294B66",
    borderRadius: "10px",
    background: "#173B5A",
    color: "#AFC1D0",
    fontSize: "13px",
    boxSizing: "border-box",
    marginBottom: "17px"
  },

  amountInput: {
    width: "100%",
    height: "48px",
    padding: "0 14px",
    border: "1px solid #3D7050",
    borderRadius: "10px",
    background: "#173B5A",
    color: "#8FD694",
    fontSize: "14px",
    fontWeight: 800,
    boxSizing: "border-box",
    marginBottom: "20px"
  },

  submitButton: {
    width: "100%",
    height: "49px",
    border: 0,
    borderRadius: "10px",
    background: "linear-gradient(135deg, #4CAF50, #72C978)",
    color: "#102A43",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer"
  },

  message: {
    marginTop: "16px",
    padding: "13px",
    borderRadius: "10px",
    fontSize: "11px"
  },

  changePlanButton: {
    width: "100%",
    height: "45px",
    marginTop: "13px",
    border: "1px solid #365873",
    borderRadius: "10px",
    background: "#173B5A",
    color: "#C9D8E6",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer"
  },

  dashboardButton: {
    width: "100%",
    border: 0,
    background: "transparent",
    color: "#9FB3C4",
    fontSize: "12px",
    fontWeight: 700,
    padding: "18px 10px",
    cursor: "pointer"
  }
};