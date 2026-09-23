"use client";

import { useEffect, useState } from "react";

const plans = [
  {
    id: 1,
    name: "Starter",
    amount: 100,
    weekly: 15,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 3900,
  },
  {
    id: 2,
    name: "Basic",
    amount: 500,
    weekly: 75,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 19500,
  },
  {
    id: 3,
    name: "Standard",
    amount: 1500,
    weekly: 225,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 58500,
  },
  {
    id: 4,
    name: "Premium",
    amount: 3500,
    weekly: 525,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 136500,
  },
  {
    id: 5,
    name: "Advanced",
    amount: 7500,
    weekly: 1125,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 292500,
  },
  {
    id: 6,
    name: "Professional",
    amount: 13000,
    weekly: 1950,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 507000,
  },
  {
    id: 7,
    name: "Elite",
    amount: 25000,
    weekly: 3750,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 975000,
  },
  {
    id: 8,
    name: "Executive",
    amount: 50000,
    weekly: 7500,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 1950000,
  },
  {
    id: 9,
    name: "Platinum",
    amount: 125000,
    weekly: 18750,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 4875000,
  },
  {
    id: 10,
    name: "Diamond",
    amount: 175000,
    weekly: 26250,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 6825000,
  },
  {
    id: 11,
    name: "Royal",
    amount: 225000,
    weekly: 33750,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 8775000,
  },
  {
    id: 12,
    name: "Grand Royal",
    amount: 300000,
    weekly: 45000,
    durationYears: 5,
    durationWeeks: 260,
    totalReturn: 11700000,
  },
];

const paymentMethods = [
  {
    id: "jazzcash",
    title: "JazzCash",
    accountName: "Fakhar Abbas",
    accountNumber: "0308-0127173",
    logoType: "jazzcash",
  },
  {
    id: "easypaisa",
    title: "Easypaisa",
    accountName: "Fakhar Abbas",
    accountNumber: "0345-5096922",
    logoType: "easypaisa",
  },
  {
    id: "sadapay",
    title: "SadaPay",
    accountName: "Transport Hub",
    accountNumber: "0300-0000000",
    logoType: "sadapay",
  },
  {
    id: "bank",
    title: "Bank Transfer",
    accountName: "Transport Hub",
    accountNumber: "000000000000",
    bankName: "Your Bank Name",
    logoType: "bank",
  },
];

/* =========================
   PAYMENT LOGO STYLE
========================= */

function PaymentLogo({ type }) {
  if (type === "jazzcash") {
    return (
      <div className="brandLogo jazzcashLogo">
        <div className="jazzSymbol">
          <span></span>
          <span></span>
        </div>

        <div className="brandLogoText">JazzCash</div>
      </div>
    );
  }

  if (type === "easypaisa") {
    return (
      <div className="brandLogo easypaisaLogo">
        <div className="easySymbol">
          <span></span>
        </div>

        <div className="brandLogoText">easypaisa</div>
      </div>
    );
  }

  if (type === "sadapay") {
    return (
      <div className="brandLogo sadapayLogo">
        <div className="sadaSymbol">
          <span></span>
          <span></span>
        </div>

        <div className="brandLogoText">SadaPay</div>
      </div>
    );
  }

  return (
    <div className="brandLogo bankLogoStyle">
      <div className="bankSymbol">🏦</div>
      <div className="brandLogoText">Bank</div>
    </div>
  );
}

export default function Deposit() {
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* =========================
     LOAD USER
  ========================= */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loggedIn = localStorage.getItem("transportLoggedIn");
    const savedUser = localStorage.getItem("transportUser");

    if (loggedIn !== "true" || !savedUser) {
      window.location.href = "/";
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      setUser(parsedUser);

      const phone =
        parsedUser?.phone ||
        parsedUser?.mobile ||
        parsedUser?.phoneNumber ||
        "";

      setFullName(
        parsedUser?.name ||
          parsedUser?.fullName ||
          parsedUser?.username ||
          ""
      );

      setMobile(phone);

      const savedPlan =
        localStorage.getItem(
          "transportSelectedPlan_" + phone
        ) ||
        localStorage.getItem("transportSelectedPlan");

      if (savedPlan) {
        try {
          const parsedPlan = JSON.parse(savedPlan);

          const matchingPlan = plans.find(
            (plan) =>
              plan.id === parsedPlan.id
          );

          if (matchingPlan) {
            setSelectedPlan(matchingPlan);
            setDepositAmount(
              String(matchingPlan.amount)
            );

            localStorage.setItem(
              "transportSelectedPlan_" + phone,
              JSON.stringify(matchingPlan)
            );

            localStorage.setItem(
              "transportSelectedPlan",
              JSON.stringify(matchingPlan)
            );
          } else {
            const weekly = Number(
              parsedPlan.weekly ||
                parsedPlan.weeklyReturn ||
                parsedPlan.daily ||
                parsedPlan.dailyReturn ||
                0
            );

            const amount = Number(
              parsedPlan.amount ||
                parsedPlan.price ||
                0
            );

            if (amount > 0 && weekly > 0) {
              const convertedPlan = {
                id:
                  parsedPlan.id ||
                  Date.now(),

                name:
                  parsedPlan.name ||
                  "Transport Plan",

                amount: amount,

                weekly: weekly,

                weeklyReturn: weekly,

                durationYears: 5,

                durationWeeks: 260,

                // Compatibility
                daily: weekly,
                dailyReturn: weekly,
                duration: 260,

                totalReturn:
                  weekly * 260,
              };

              setSelectedPlan(
                convertedPlan
              );

              setDepositAmount(
                String(convertedPlan.amount)
              );

              localStorage.setItem(
                "transportSelectedPlan_" + phone,
                JSON.stringify(convertedPlan)
              );

              localStorage.setItem(
                "transportSelectedPlan",
                JSON.stringify(convertedPlan)
              );
            }
          }
        } catch {
          console.log(
            "Saved plan could not be loaded."
          );
        }
      }
    } catch {
      console.log(
        "User data could not be loaded."
      );

      window.location.href = "/";
    }
  }, []);

  /* =========================
     PLAN SELECT
  ========================= */

  const handlePlanSelect = (plan) => {
    const normalizedPlan = {
      ...plan,

      durationYears: 5,
      durationWeeks: 260,

      // Compatibility
      daily: plan.weekly,
      dailyReturn: plan.weekly,
      duration: 260,

      weeklyReturn: plan.weekly,

      totalReturn:
        Number(plan.weekly) * 260,
    };

    setSelectedPlan(normalizedPlan);
    setDepositAmount(
      String(normalizedPlan.amount)
    );

    setMessage("");
    setMessageType("");

    if (
      typeof window !== "undefined" &&
      user
    ) {
      const phone =
        user?.phone ||
        user?.mobile ||
        user?.phoneNumber ||
        "";

      localStorage.setItem(
        "transportSelectedPlan_" + phone,
        JSON.stringify(normalizedPlan)
      );

      localStorage.setItem(
        "transportSelectedPlan",
        JSON.stringify(normalizedPlan)
      );
    }
  };

  /* =========================
     PAYMENT SELECT
  ========================= */

  const handlePaymentSelect = (method) => {
    setSelectedPayment(method);
    setMessage("");
    setMessageType("");
  };

  /* =========================
     SCREENSHOT
  ========================= */

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setScreenshot(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Please upload an image file only."
      );

      setMessageType("error");
      event.target.value = "";
      setScreenshot(null);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setMessage(
        "Screenshot size must be less than 3MB."
      );

      setMessageType("error");
      event.target.value = "";
      setScreenshot(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setScreenshot({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result,
      });
    };

    reader.readAsDataURL(file);
  };

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!selectedPlan) {
      setMessage(
        "Please select a transport plan first."
      );

      setMessageType("error");
      return;
    }

    if (!selectedPayment) {
      setMessage(
        "Please select a payment method."
      );

      setMessageType("error");
      return;
    }

    if (!fullName.trim()) {
      setMessage(
        "Please enter your full name."
      );

      setMessageType("error");
      return;
    }

    if (!mobile.trim()) {
      setMessage(
        "Please enter your mobile number."
      );

      setMessageType("error");
      return;
    }

    if (
      !depositAmount ||
      Number(depositAmount) <= 0
    ) {
      setMessage(
        "Please enter a valid deposit amount."
      );

      setMessageType("error");
      return;
    }

    if (!transactionId.trim()) {
      setMessage(
        "Please enter your transaction ID."
      );

      setMessageType("error");
      return;
    }

    if (!screenshot) {
      setMessage(
        "Please upload your payment screenshot."
      );

      setMessageType("error");
      return;
    }

    setSubmitting(true);

    try {
      const savedUser = user || {};

      const phone =
        savedUser?.phone ||
        savedUser?.mobile ||
        savedUser?.phoneNumber ||
        mobile;

      const weeklyReturn =
        Number(
          selectedPlan.weekly ||
            selectedPlan.weeklyReturn ||
            selectedPlan.daily ||
            selectedPlan.dailyReturn ||
            0
        );

      const request = {
        id: "DEP-" + Date.now(),

        user: {
          ...savedUser,
          name: fullName.trim(),
          fullName: fullName.trim(),
          phone: mobile.trim(),
        },

        paymentMethod:
          selectedPayment.title,

        paymentMethodId:
          selectedPayment.id,

        accountName:
          selectedPayment.accountName,

        accountNumber:
          selectedPayment.accountNumber,

        bankName:
          selectedPayment.bankName || "",

        transactionId:
          transactionId.trim(),

        depositAmount:
          Number(depositAmount),

        plan: {
          id: selectedPlan.id,

          name: selectedPlan.name,

          amount:
            Number(selectedPlan.amount),

          // Weekly system
          weekly: weeklyReturn,

          weeklyReturn: weeklyReturn,

          durationYears: 5,

          durationWeeks: 260,

          // Compatibility
          daily: weeklyReturn,
          dailyReturn: weeklyReturn,
          duration: 260,

          totalReturn:
            weeklyReturn * 260,
        },

        screenshot: screenshot.data,

        screenshotName:
          screenshot.name,

        status: "Pending",

        createdAt:
          new Date().toISOString(),
      };

      const userKey =
        "transportDepositRequests_" +
        phone;

      const existingUserRequests =
        JSON.parse(
          localStorage.getItem(userKey) ||
            "[]"
        );

      existingUserRequests.push(
        request
      );

      localStorage.setItem(
        userKey,
        JSON.stringify(
          existingUserRequests
        )
      );

      const allRequests =
        JSON.parse(
          localStorage.getItem(
            "transportDepositRequests"
          ) || "[]"
        );

      allRequests.push(request);

      localStorage.setItem(
        "transportDepositRequests",
        JSON.stringify(allRequests)
      );

      localStorage.setItem(
        "transportDepositRequest_" +
          phone,
        JSON.stringify(request)
      );

      localStorage.setItem(
        "transportDepositRequest",
        JSON.stringify(request)
      );

      setMessage(
        "Deposit request submitted successfully. Your payment will be verified shortly."
      );

      setMessageType("success");

      setTransactionId("");
      setScreenshot(null);

      const fileInput =
        document.getElementById(
          "depositScreenshot"
        );

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while submitting your deposit request."
      );

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="depositPage">
      <div className="depositContainer">

        {/* =========================
            HEADER
        ========================= */}

        <div className="pageHeader">
          <div>
            <h1>Make a Deposit</h1>

            <p>
              Select your plan and complete your payment.
            </p>
          </div>
        </div>

        {/* =========================
            PLANS
        ========================= */}

        <section className="sectionCard">
          <div className="sectionHeading">
            <div>
              <h2>Choose Transport Plan</h2>

              <p>
                Select the plan you want to activate.
              </p>
            </div>
          </div>

          <div className="plansGrid">
            {plans.map((plan) => {
              const isActive =
                selectedPlan?.id ===
                plan.id;

              return (
                <button
                  type="button"
                  key={plan.id}
                  className={`planCard ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    handlePlanSelect(plan)
                  }
                >
                  <div className="planTop">
                    <span className="planName">
                      {plan.name}
                    </span>

                    {isActive && (
                      <span className="selectedBadge">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="planAmount">
                    PKR{" "}
                    {plan.amount.toLocaleString()}
                  </div>

                  <div className="planDetails">
                    <div>
                      <span>
                        Weekly Return
                      </span>

                      <strong>
                        PKR{" "}
                        {plan.weekly.toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Duration
                      </span>

                      <strong>
                        5 Years
                      </strong>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================
            SELECTED PLAN
        ========================= */}

        {selectedPlan && (
          <section className="selectedPlanBox">

            <div>
              <span>
                Selected Plan
              </span>

              <strong>
                {selectedPlan.name}
              </strong>
            </div>

            <div>
              <span>
                Investment
              </span>

              <strong>
                PKR{" "}
                {Number(
                  selectedPlan.amount
                ).toLocaleString()}
              </strong>
            </div>

            <div>
              <span>
                Weekly Return
              </span>

              <strong>
                PKR{" "}
                {Number(
                  selectedPlan.weekly
                ).toLocaleString()}
              </strong>
            </div>

            <div>
              <span>
                Duration
              </span>

              <strong>
                5 Years
              </strong>
            </div>

          </section>
        )}

        {/* =========================
            PAYMENT METHODS
        ========================= */}

        <section className="sectionCard">
          <div className="sectionHeading">
            <div>
              <h2>Payment Method</h2>

              <p>
                Select where you want to make your payment.
              </p>
            </div>
          </div>

          <div className="paymentGrid">
            {paymentMethods.map((method) => {
              const isActive =
                selectedPayment?.id ===
                method.id;

              return (
                <button
                  type="button"
                  key={method.id}
                  className={`paymentMethod payment-${method.id} ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    handlePaymentSelect(method)
                  }
                >
                  {isActive && (
                    <div className="paymentCheck">
                      ✓
                    </div>
                  )}

                  <div className="paymentLogoCircle">
                    <PaymentLogo
                      type={method.logoType}
                    />
                  </div>

                  <div className="paymentTitle">
                    {method.title}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================
            PAYMENT INFORMATION
        ========================= */}

        {selectedPayment && (
          <section className="paymentInfoCard">

            <div className="paymentInfoHeader">
              <div>
                <span className="smallLabel">
                  Pay Through
                </span>

                <h2>
                  {selectedPayment.title}
                </h2>
              </div>

              <div className="paymentInfoLogo">
                <PaymentLogo
                  type={
                    selectedPayment.logoType
                  }
                />
              </div>
            </div>

            <div className="accountInfo">

              {selectedPayment.bankName && (
                <div className="infoRow">
                  <span>
                    Bank Name
                  </span>

                  <strong>
                    {selectedPayment.bankName}
                  </strong>
                </div>
              )}

              <div className="infoRow">
                <span>
                  Account Name
                </span>

                <strong>
                  {selectedPayment.accountName}
                </strong>
              </div>

              <div className="infoRow">
                <span>
                  {selectedPayment.id ===
                  "bank"
                    ? "Account Number"
                    : "Account / Mobile Number"}
                </span>

                <strong>
                  {selectedPayment.accountNumber}
                </strong>
              </div>

              <div className="paymentWarning">
                ⚠️ Please make the payment only to the
                account shown above.
              </div>

            </div>
          </section>
        )}

        {/* =========================
            PAYMENT FORM
        ========================= */}

        <section className="sectionCard formCard">

          <div className="sectionHeading">
            <div>
              <h2>
                Payment Details
              </h2>

              <p>
                Enter your payment information below.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="formGrid">

              <div className="inputGroup">
                <label htmlFor="fullName">
                  Full Name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your full name"
                />
              </div>

              <div className="inputGroup">
                <label htmlFor="mobile">
                  Mobile Number
                </label>

                <input
                  id="mobile"
                  type="text"
                  value={mobile}
                  onChange={(event) =>
                    setMobile(
                      event.target.value
                    )
                  }
                  placeholder="03XXXXXXXXX"
                />
              </div>

              <div className="inputGroup">
                <label htmlFor="depositAmount">
                  Deposit Amount
                </label>

                <input
                  id="depositAmount"
                  type="number"
                  min="1"
                  value={depositAmount}
                  onChange={(event) =>
                    setDepositAmount(
                      event.target.value
                    )
                  }
                  placeholder="Enter deposit amount"
                />
              </div>

              <div className="inputGroup">
                <label htmlFor="transactionId">
                  Transaction ID
                </label>

                <input
                  id="transactionId"
                  type="text"
                  value={transactionId}
                  onChange={(event) =>
                    setTransactionId(
                      event.target.value
                    )
                  }
                  placeholder="Enter transaction ID"
                />
              </div>

              <div className="inputGroup fullWidth">
                <label htmlFor="depositScreenshot">
                  Payment Screenshot
                </label>

                <div className="uploadBox">
                  <input
                    id="depositScreenshot"
                    type="file"
                    accept="image/*"
                    onChange={
                      handleScreenshotChange
                    }
                  />

                  <div className="uploadText">
                    <span className="uploadIcon">
                      📷
                    </span>

                    <div>
                      <strong>
                        {screenshot
                          ? screenshot.name
                          : "Upload Payment Screenshot"}
                      </strong>

                      <small>
                        JPG, JPEG or PNG — Maximum 3MB
                      </small>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {message && (
              <div
                className={`message ${messageType}`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="submitButton"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Submit Deposit Request"}
            </button>

          </form>
        </section>
      </div>

      {/* =========================
          CSS
      ========================= */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .depositPage {
          min-height: 100vh;
          background: #eef3f7;
          color: #173b5a;
          padding: 30px;
        }

        .depositContainer {
          width: 100%;
          max-width: 1450px;
          margin: 0 auto;
        }

        .pageHeader {
          margin-bottom: 24px;
        }

        .pageHeader h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
          color: #102a43;
        }

        .pageHeader p {
          margin: 7px 0 0;
          color: #6b7c8f;
          font-size: 15px;
        }

        .sectionCard {
          background: #ffffff;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 22px;
          border: 1px solid #dce5ec;
          box-shadow:
            0 8px 25px rgba(16, 42, 67, 0.06);
        }

        .sectionHeading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .sectionHeading h2 {
          margin: 0;
          color: #102a43;
          font-size: 21px;
          font-weight: 800;
        }

        .sectionHeading p {
          margin: 5px 0 0;
          color: #78899a;
          font-size: 14px;
        }

        .plansGrid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .planCard {
          border: 2px solid #102a43;
          background: #102a43;
          border-radius: 15px;
          padding: 17px;
          text-align: left;
          cursor: pointer;
          transition: 0.2s ease;
          color: #ffffff;
        }

        .planCard:hover {
          transform: translateY(-2px);
          background: #173b5a;
          border-color: #173b5a;
          box-shadow:
            0 8px 20px
            rgba(16, 42, 67, 0.18);
        }

        .planCard.active {
          background: #173b5a;
          border-color: #4caf50;
          box-shadow:
            0 7px 20px
            rgba(76, 175, 80, 0.22);
        }

        .planTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .planName {
          font-weight: 800;
          font-size: 15px;
          color: #ffffff;
        }

        .selectedBadge {
          background: #4caf50;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 7px;
          border-radius: 20px;
        }

        .planAmount {
          margin-top: 14px;
          font-size: 20px;
          font-weight: 900;
          color: #ffffff;
        }

        .planDetails {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 15px;
          padding-top: 12px;
          border-top:
            1px solid rgba(255,255,255,0.16);
        }

        .planDetails div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .planDetails span {
          font-size: 11px;
          color: #b9c8d5;
        }

        .planDetails strong {
          font-size: 12px;
          color: #ffffff;
        }

        .selectedPlanBox {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 12px;
          background: #102a43;
          color: #ffffff;
          border-radius: 18px;
          padding: 20px 24px;
          margin-bottom: 22px;
          box-shadow:
            0 8px 22px
            rgba(16, 42, 67, 0.13);
        }

        .selectedPlanBox div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .selectedPlanBox span {
          color: #a9bac9;
          font-size: 11px;
        }

        .selectedPlanBox strong {
          color: #ffffff;
          font-size: 16px;
        }

        .paymentGrid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .paymentMethod {
          position: relative;
          min-height: 150px;
          border: 2px solid #dce5ec;
          background: #ffffff;
          border-radius: 22px;
          padding: 16px 12px;
          cursor: pointer;
          transition: 0.2s ease;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .paymentMethod:hover {
          transform: translateY(-2px);
          box-shadow:
            0 8px 22px
            rgba(16, 42, 67, 0.10);
        }

        .paymentMethod.active {
          border-color: #4caf50;
          box-shadow:
            0 7px 20px
            rgba(76, 175, 80, 0.18);
        }

        .payment-jazzcash {
          background: #fffdf4;
        }

        .payment-easypaisa {
          background: #f3fff7;
        }

        .payment-sadapay {
          background: #f1fffc;
        }

        .payment-bank {
          background: #f3f7ff;
        }

        .paymentLogoCircle {
          width: 76px;
          height: 76px;
          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow:
            0 5px 14px
            rgba(0, 0, 0, 0.10);

          overflow: hidden;
        }

        .payment-jazzcash .paymentLogoCircle {
          background:
            linear-gradient(
              145deg,
              #ffcf22,
              #fff1a6
            );
          border: 2px solid #f3bd00;
        }

        .payment-easypaisa .paymentLogoCircle {
          background:
            linear-gradient(
              145deg,
              #19b56b,
              #d9f9e9
            );
          border: 2px solid #16a863;
        }

        .payment-sadapay .paymentLogoCircle {
          background:
            linear-gradient(
              145deg,
              #e8fff7,
              #9ce8d1
            );
          border: 2px solid #57c9a9;
        }

        .payment-bank .paymentLogoCircle {
          background:
            linear-gradient(
              145deg,
              #173b5a,
              #6e9abb
            );
          border: 2px solid #173b5a;
        }

        .brandLogo {
          width: 100%;
          height: 100%;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 2px;
        }

        .brandLogoText {
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.3px;
        }

        .jazzcashLogo {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border: 2px solid #ffd000;
          box-shadow:
            0 4px 12px
            rgba(0, 0, 0, 0.14);
        }

        .jazzcashLogo::before {
          content: "";
          width: 18px;
          height: 34px;
          background: #ffd000;
          border-radius: 50%;
          position: absolute;
          left: 17px;
          transform: rotate(12deg);
        }

        .jazzcashLogo::after {
          content: "";
          width: 18px;
          height: 34px;
          background: #ed1c24;
          border-radius: 50%;
          position: absolute;
          right: 17px;
          transform: rotate(-12deg);
        }

        .jazzSymbol {
          position: relative;
          width: 34px;
          height: 28px;
        }

        .jazzSymbol span:first-child {
          position: absolute;
          left: 3px;
          top: 3px;
          width: 15px;
          height: 22px;
          border-radius:
            14px 2px 14px 14px;
          background: #f7c900;
          transform: rotate(-28deg);
        }

        .jazzSymbol span:last-child {
          position: absolute;
          right: 2px;
          top: 3px;
          width: 15px;
          height: 22px;
          border-radius:
            2px 14px 14px 14px;
          background: #ed1c24;
          transform: rotate(28deg);
        }

        .easypaisaLogo {
          color: #111111;
        }

        .easySymbol {
          width: 36px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .easySymbol span {
          width: 30px;
          height: 17px;
          border-radius: 50%;
          border: 7px solid #111111;
          border-right-color: #16aa62;
          transform: rotate(-12deg);
        }

        .sadapayLogo {
          color: #123b37;
        }

        .sadaSymbol {
          width: 36px;
          height: 28px;
          position: relative;
        }

        .sadaSymbol span:first-child {
          position: absolute;
          width: 28px;
          height: 13px;
          left: 4px;
          top: 3px;
          border: 5px solid #38c7a5;
          border-radius: 12px;
          transform: rotate(25deg);
        }

        .sadaSymbol span:last-child {
          position: absolute;
          width: 21px;
          height: 10px;
          left: 8px;
          bottom: 3px;
          border: 4px solid #ff7c65;
          border-radius: 10px;
          transform: rotate(-25deg);
        }

        .bankLogoStyle {
          color: #ffffff;
        }

        .bankSymbol {
          font-size: 29px;
          line-height: 1;
        }

        .paymentTitle {
          font-size: 14px;
          font-weight: 900;
          color: #102a43;
        }

        .paymentCheck {
          position: absolute;
          top: 9px;
          right: 9px;

          width: 27px;
          height: 27px;

          border-radius: 50%;
          background: #4caf50;
          color: #ffffff;

          font-size: 14px;
          font-weight: 900;

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow:
            0 3px 8px
            rgba(76, 175, 80, 0.28);
        }

        .paymentInfoCard {
          background: #102a43;
          color: #ffffff;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 22px;
          box-shadow:
            0 8px 25px
            rgba(16, 42, 67, 0.12);
        }

        .paymentInfoHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 18px;
          border-bottom:
            1px solid
            rgba(255, 255, 255, 0.12);
        }

        .smallLabel {
          color: #a9bac9;
          font-size: 11px;
          display: block;
          margin-bottom: 4px;
        }

        .paymentInfoHeader h2 {
          margin: 0;
          font-size: 22px;
          color: #ffffff;
        }

        .paymentInfoLogo {
          width: 100px;
          height: 100px;
          background: #ffffff;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .accountInfo {
          padding-top: 17px;
        }

        .infoRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 12px 0;
          border-bottom:
            1px solid
            rgba(255, 255, 255, 0.08);
        }

        .infoRow span {
          color: #a9bac9;
          font-size: 13px;
        }

        .infoRow strong {
          color: #ffffff;
          font-size: 14px;
          text-align: right;
        }

        .paymentWarning {
          margin-top: 17px;
          padding: 13px 15px;
          border-radius: 10px;
          background:
            rgba(255, 193, 7, 0.09);
          color: #ffd875;
          font-size: 13px;
          line-height: 1.5;
        }

        .formCard {
          margin-bottom: 30px;
        }

        .formGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .inputGroup {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .inputGroup.fullWidth {
          grid-column: 1 / -1;
        }

        .inputGroup label {
          font-size: 13px;
          font-weight: 800;
          color: #173b5a;
        }

        .inputGroup input {
          width: 100%;
          height: 48px;
          border: 1px solid #d7e1e8;
          border-radius: 10px;
          padding: 0 14px;
          outline: none;
          background: #ffffff;
          color: #173b5a;
          font-size: 14px;
          transition: 0.2s ease;
        }

        .inputGroup input:focus {
          border-color: #4caf50;
          box-shadow:
            0 0 0 3px
            rgba(76, 175, 80, 0.09);
        }

        .uploadBox {
          position: relative;
          min-height: 90px;
          border: 2px dashed #cdd9e2;
          border-radius: 12px;
          background: #f8fafb;
          overflow: hidden;
          transition: 0.2s ease;
        }

        .uploadBox:hover {
          border-color: #4caf50;
        }

        .uploadBox input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }

        .uploadText {
          min-height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #173b5a;
          padding: 12px;
        }

        .uploadIcon {
          font-size: 26px;
        }

        .uploadText div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .uploadText strong {
          font-size: 13px;
        }

        .uploadText small {
          color: #8393a2;
          font-size: 11px;
        }

        .message {
          margin-top: 20px;
          padding: 13px 15px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.5;
        }

        .message.success {
          background: #eaf8ec;
          color: #267b30;
          border: 1px solid #bde5c2;
        }

        .message.error {
          background: #fff0f0;
          color: #a62828;
          border: 1px solid #efc0c0;
        }

        .submitButton {
          width: 100%;
          height: 52px;
          margin-top: 20px;
          border: 0;
          border-radius: 11px;
          background: #4caf50;
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .submitButton:hover {
          background: #429747;
          transform: translateY(-1px);
        }

        .submitButton:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 1100px) {

          .plansGrid {
            grid-template-columns:
              repeat(3, 1fr);
          }

          .paymentGrid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 800px) {

          .depositPage {
            padding: 18px;
          }

          .plansGrid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .selectedPlanBox {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .formGrid {
            grid-template-columns: 1fr;
          }

          .inputGroup.fullWidth {
            grid-column: auto;
          }
        }

        @media (max-width: 550px) {

          .depositPage {
            padding: 12px;
          }

          .pageHeader h1 {
            font-size: 25px;
          }

          .sectionCard {
            padding: 17px;
          }

          .plansGrid {
            grid-template-columns: 1fr;
          }

          .paymentGrid {
            grid-template-columns:
              1fr 1fr;
          }

          .paymentMethod {
            min-height: 135px;
          }

          .paymentLogoCircle {
            width: 68px;
            height: 68px;
          }

          .selectedPlanBox {
            grid-template-columns:
              1fr 1fr;
            padding: 17px;
          }

          .paymentInfoHeader {
            align-items: flex-start;
          }

          .paymentInfoLogo {
            width: 78px;
            height: 78px;
          }

          .infoRow {
            align-items: flex-start;
            flex-direction: column;
            gap: 5px;
          }

          .infoRow strong {
            text-align: left;
          }
        }

      `}</style>
    </div>
  );
}