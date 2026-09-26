"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/* =========================
   PLANS
========================= */

const plans = [
  {
    id: 1,
    name: "Starter",
    amount: 100,
    weekly: 15,
  },
  {
    id: 2,
    name: "Basic",
    amount: 500,
    weekly: 75,
  },
  {
    id: 3,
    name: "Standard",
    amount: 1500,
    weekly: 225,
  },
  {
    id: 4,
    name: "Premium",
    amount: 3500,
    weekly: 525,
  },
  {
    id: 5,
    name: "Advanced",
    amount: 7500,
    weekly: 1125,
  },
  {
    id: 6,
    name: "Professional",
    amount: 13000,
    weekly: 1950,
  },
  {
    id: 7,
    name: "Elite",
    amount: 25000,
    weekly: 3750,
  },
  {
    id: 8,
    name: "Executive",
    amount: 50000,
    weekly: 7500,
  },
  {
    id: 9,
    name: "Platinum",
    amount: 125000,
    weekly: 18750,
  },
  {
    id: 10,
    name: "Diamond",
    amount: 175000,
    weekly: 26250,
  },
  {
    id: 11,
    name: "Royal",
    amount: 225000,
    weekly: 33750,
  },
  {
    id: 12,
    name: "Grand Royal",
    amount: 300000,
    weekly: 45000,
  },
];

/* =========================
   PAYMENT METHODS
   ONLY EASYPaisa + BANK
========================= */

const paymentMethods = [
  {
    id: "easypaisa",
    title: "Easypaisa",
    accountName: "Fakhar Abbas",
    accountNumber: "0345-5096922",
  },
  {
    id: "bank",
    title: "Bank Transfer",
    accountName: "WAJAHAT ABBAS",
    accountNumber: "0407326243356",
    bankName: "United Bank Limited",
  },
];

export default function Deposit() {
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* =========================
     NORMALIZE PLAN
  ========================= */

  const normalizePlan = (savedPlan) => {
    if (!savedPlan) {
      return null;
    }

    const savedId = Number(savedPlan.id || 0);

    const savedName = String(savedPlan.name || "")
      .trim()
      .toLowerCase();

    const savedAmount = Number(
      savedPlan.amount || savedPlan.price || 0
    );

    let matchingPlan = null;

    /* Match by ID */
    if (savedId > 0) {
      matchingPlan = plans.find(
        (plan) => Number(plan.id) === savedId
      );
    }

    /* Match by name + amount */
    if (!matchingPlan && savedName && savedAmount > 0) {
      matchingPlan = plans.find(
        (plan) =>
          plan.name.toLowerCase() === savedName &&
          Number(plan.amount) === savedAmount
      );
    }

    /* Match by name */
    if (!matchingPlan && savedName) {
      matchingPlan = plans.find(
        (plan) => plan.name.toLowerCase() === savedName
      );
    }

    if (matchingPlan) {
      const weekly = Number(matchingPlan.weekly);

      return {
        ...matchingPlan,
        id: Number(matchingPlan.id),
        amount: Number(matchingPlan.amount),
        weekly,
        weeklyReturn: weekly,
        daily: weekly,
        dailyReturn: weekly,
        duration: 260,
        durationWeeks: 260,
        durationYears: 5,
        totalReturn: weekly * 260,
      };
    }

    /* Old saved plan compatibility */
    const weekly = Number(
      savedPlan.weekly ||
        savedPlan.weeklyReturn ||
        savedPlan.daily ||
        savedPlan.dailyReturn ||
        0
    );

    if (savedAmount > 0 && weekly > 0) {
      return {
        id: savedPlan.id || null,
        name: savedPlan.name || "Transport Plan",
        amount: savedAmount,
        weekly,
        weeklyReturn: weekly,
        daily: weekly,
        dailyReturn: weekly,
        duration: 260,
        durationWeeks: 260,
        durationYears: 5,
        totalReturn: weekly * 260,
      };
    }

    return null;
  };

  /* =========================
     LOAD USER + SELECTED PLAN
  ========================= */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

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

      const name =
        parsedUser?.name ||
        parsedUser?.fullName ||
        parsedUser?.username ||
        "";

      setFullName(name);
      setMobile(phone);

      const userPlanKey =
        "transportSelectedPlan_" + phone;

      const userSavedPlan =
        localStorage.getItem(userPlanKey);

      const commonSavedPlan =
        localStorage.getItem("transportSelectedPlan");

      const savedPlan =
        userSavedPlan || commonSavedPlan;

      if (!savedPlan) {
        return;
      }

      try {
        const parsedPlan = JSON.parse(savedPlan);

        const normalizedPlan =
          normalizePlan(parsedPlan);

        if (!normalizedPlan) {
          return;
        }

        setSelectedPlan(normalizedPlan);

        setDepositAmount(
          String(normalizedPlan.amount)
        );

        localStorage.setItem(
          "transportSelectedPlan",
          JSON.stringify(normalizedPlan)
        );

        if (phone) {
          localStorage.setItem(
            userPlanKey,
            JSON.stringify(normalizedPlan)
          );
        }
      } catch (error) {
        console.error(
          "Saved plan could not be loaded:",
          error
        );
      }
    } catch (error) {
      console.error(
        "User data could not be loaded:",
        error
      );

      window.location.href = "/";
    }
  }, []);

  /* =========================
     PAYMENT METHOD
  ========================= */

  const handlePaymentSelect = (method) => {
    setSelectedPayment(method);
    setPaymentOpen(false);
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!selectedPlan) {
      setMessage(
        "No transport plan has been selected. Please go back and select a plan first."
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

      const weeklyReturn = Number(
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

        paymentMethod: selectedPayment.title,

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
          id: Number(selectedPlan.id),

          name: selectedPlan.name,

          amount:
            Number(selectedPlan.amount),

          weekly:
            weeklyReturn,

          weeklyReturn:
            weeklyReturn,

          daily:
            weeklyReturn,

          dailyReturn:
            weeklyReturn,

          duration:
            260,

          durationWeeks:
            260,

          durationYears:
            5,

          totalReturn:
            weeklyReturn * 260,
        },

        screenshot:
          screenshot.data,

        screenshotName:
          screenshot.name,

        status:
          "Pending",

        createdAt:
          new Date().toISOString(),
      };

      /* =========================
         SUPABASE
      ========================= */

      const { error: supabaseError } =
        await supabase
          .from("deposit_requests")
          .insert({
            id: request.id,

            user_data: request.user,

            payment_method:
              request.paymentMethod,

            payment_method_id:
              request.paymentMethodId,

            account_name:
              request.accountName,

            account_number:
              request.accountNumber,

            bank_name:
              request.bankName,

            transaction_id:
              request.transactionId,

            deposit_amount:
              request.depositAmount,

            plan:
              request.plan,

            screenshot:
              request.screenshot,

            screenshot_name:
              request.screenshotName,

            status:
              request.status,

            created_at:
              request.createdAt,
          });

      if (supabaseError) {
        console.error(
          "Supabase deposit error:",
          supabaseError
        );

        throw new Error(
          supabaseError.message
        );
      }

      /* =========================
         USER-SPECIFIC REQUESTS
         KEEP LOCAL STORAGE
      ========================= */

      const userKey =
        "transportDepositRequests_" +
        phone;

      const existingUserRequests =
        JSON.parse(
          localStorage.getItem(userKey) ||
            "[]"
        );

      existingUserRequests.push(request);

      localStorage.setItem(
        userKey,
        JSON.stringify(
          existingUserRequests
        )
      );

      /* =========================
         ALL REQUESTS
      ========================= */

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

      /* =========================
         LATEST USER REQUEST
      ========================= */

      localStorage.setItem(
        "transportDepositRequest_" +
          phone,
        JSON.stringify(request)
      );

      /* =========================
         LATEST COMMON REQUEST
      ========================= */

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
      console.error(
        "Deposit submission error:",
        error
      );

      setMessage(
        error?.message
          ? "Deposit Error: " + error.message
          : "Deposit Error: Unknown error occurred."
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
            <h1>
              Make a Deposit
            </h1>

            <p>
              Complete your payment to activate your selected transport plan.
            </p>
          </div>
        </div>

        {/* =========================
            SELECTED PLAN
        ========================= */}

        {selectedPlan ? (
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
        ) : (
          <section className="noPlanBox">

            <strong>
              No Plan Selected
            </strong>

            <span>
              Please go back to Transport Plans and select a plan first.
            </span>

          </section>
        )}

        {/* =========================
            PAYMENT METHOD
        ========================= */}

        <section className="sectionCard paymentSection">

          <div className="sectionHeading">

            <div>
              <h2>
                Payment Method
              </h2>

              <p>
                Select your preferred payment method.
              </p>
            </div>

          </div>

          <div className="paymentSelector">

            <button
              type="button"
              className={`paymentSelectButton ${
                selectedPayment
                  ? "hasSelection"
                  : ""
              }`}
              onClick={() =>
                setPaymentOpen(
                  !paymentOpen
                )
              }
            >

              <span>
                {selectedPayment
                  ? selectedPayment.title
                  : "Select Payment Method"}
              </span>

              <span
                className={`selectArrow ${
                  paymentOpen
                    ? "rotate"
                    : ""
                }`}
              >
                ▼
              </span>

            </button>

            {paymentOpen && (
              <div className="paymentDropdown">

                {paymentMethods.map(
                  (method) => (
                    <button
                      type="button"
                      key={method.id}
                      className={`paymentOption ${
                        selectedPayment?.id ===
                        method.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handlePaymentSelect(
                          method
                        )
                      }
                    >
                      {method.title}
                    </button>
                  )
                )}

              </div>
            )}

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
                  Payment Method
                </span>

                <h2>
                  {selectedPayment.title}
                </h2>
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
                Please make the payment only to the account shown above.
              </div>

            </div>

          </section>
        )}

        {/* =========================
            PAYMENT DETAILS
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

              {/* FULL NAME */}

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

              {/* MOBILE NUMBER */}

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

              {/* DEPOSIT AMOUNT */}

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

              {/* TRANSACTION ID */}

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

              {/* PAYMENT SCREENSHOT */}

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

            {/* MESSAGE */}

            {message && (
              <div
                className={`message ${messageType}`}
              >
                {message}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="submitButton"
              disabled={
                submitting ||
                !selectedPlan
              }
            >
              {submitting
                ? "Submitting..."
                : "Submit Deposit Request"}
            </button>

          </form>

        </section>

      </div>

      {/* =========================
          STYLES
      ========================= */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .depositPage {
          position: relative;

          min-height: 100vh;

          background:
            linear-gradient(
              135deg,
              #eef3f7 0%,
              #f7fafc 50%,
              #edf3f8 100%
            );

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
          background:
            rgba(
              255,
              255,
              255,
              0.96
            );

          border-radius: 18px;

          padding: 24px;

          margin-bottom: 22px;

          border:
            1px solid
            #dce5ec;

          box-shadow:
            0 10px 30px
            rgba(
              16,
              42,
              67,
              0.07
            );
        }

        .sectionHeading {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

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

        .selectedPlanBox {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 12px;

          background:
            linear-gradient(
              135deg,
              #102a43,
              #173b5a
            );

          color: #ffffff;

          border-radius: 18px;

          padding:
            20px 24px;

          margin-bottom: 22px;

          box-shadow:
            0 10px 25px
            rgba(
              16,
              42,
              67,
              0.14
            );
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

        .noPlanBox {
          display: flex;

          flex-direction: column;

          gap: 6px;

          background:
            #fff7e8;

          border:
            1px solid
            #f0d49b;

          border-radius: 18px;

          padding: 20px 24px;

          margin-bottom: 22px;

          color: #7a5717;
        }

        .noPlanBox strong {
          font-size: 16px;
        }

        .noPlanBox span {
          font-size: 13px;

          color: #9a7737;
        }

        .paymentSection {
          position: relative;

          z-index: 10;
        }

        .paymentSelector {
          position: relative;

          width: 100%;

          max-width: 650px;
        }

        .paymentSelectButton {
          width: 100%;

          height: 54px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          padding:
            0 17px;

          border:
            1px solid
            #d5e0e8;

          border-radius: 12px;

          background:
            #ffffff;

          color: #78899a;

          font-size: 14px;

          font-weight: 700;

          cursor: pointer;

          transition:
            all 0.2s ease;

          box-shadow:
            0 4px 14px
            rgba(
              16,
              42,
              67,
              0.05
            );
        }

        .paymentSelectButton:hover {
          border-color:
            #4caf50;
        }

        .paymentSelectButton:focus {
          outline: none;

          border-color:
            #4caf50;

          box-shadow:
            0 0 0 3px
            rgba(
              76,
              175,
              80,
              0.10
            );
        }

        .paymentSelectButton.hasSelection {
          color: #173b5a;
        }

        .selectArrow {
          color: #708397;

          font-size: 11px;

          transition:
            transform 0.2s ease;
        }

        .selectArrow.rotate {
          transform:
            rotate(180deg);
        }

        .paymentDropdown {
          position: absolute;

          top:
            calc(
              100% + 7px
            );

          left: 0;

          width: 100%;

          background:
            #ffffff;

          border:
            1px solid
            #d7e1e8;

          border-radius: 12px;

          padding: 6px;

          box-shadow:
            0 14px 35px
            rgba(
              16,
              42,
              67,
              0.14
            );

          overflow: hidden;

          z-index: 100;
        }

        .paymentOption {
          width: 100%;

          min-height: 46px;

          display: flex;

          align-items: center;

          padding:
            0 13px;

          border: 0;

          border-radius: 8px;

          background:
            transparent;

          color: #173b5a;

          font-size: 14px;

          font-weight: 700;

          text-align: left;

          cursor: pointer;

          transition:
            all 0.15s ease;
        }

        .paymentOption:hover {
          background:
            #f1f6f9;

          color:
            #102a43;
        }

        .paymentOption.selected {
          background:
            #eef8f0;

          color:
            #2d8a38;
        }

        .paymentInfoCard {
          background:
            linear-gradient(
              135deg,
              #102a43,
              #173b5a
            );

          color: #ffffff;

          border-radius: 18px;

          padding: 24px;

          margin-bottom: 22px;

          box-shadow:
            0 10px 28px
            rgba(
              16,
              42,
              67,
              0.14
            );
        }

        .paymentInfoHeader {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          padding-bottom: 18px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );
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

        .accountInfo {
          padding-top: 17px;
        }

        .infoRow {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 20px;

          padding:
            13px 0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
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

          padding:
            13px 15px;

          border-radius: 10px;

          background:
            rgba(
              255,
              255,
              255,
              0.07
            );

          color: #d8e3ec;

          font-size: 13px;

          line-height: 1.5;
        }

        .formCard {
          margin-bottom: 30px;

          background:
            linear-gradient(
              135deg,
              #102a43,
              #173b5a
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );

          color: #ffffff;

          box-shadow:
            0 10px 28px
            rgba(
              16,
              42,
              67,
              0.18
            );
        }

        .formCard .sectionHeading h2 {
          color: #ffffff;
        }

        .formCard .sectionHeading p {
          color: #a9bac9;
        }

        .formGrid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );

          gap: 18px;
        }

        .inputGroup {
          display: flex;

          flex-direction: column;

          gap: 8px;
        }

        .inputGroup.fullWidth {
          grid-column:
            1 / -1;
        }

        .inputGroup label {
          font-size: 13px;

          font-weight: 800;

          color: #ffffff;
        }

        .inputGroup input {
          width: 100%;

          height: 48px;

          border:
            1px solid
            #d7e1e8;

          border-radius: 10px;

          padding:
            0 14px;

          outline: none;

          background:
            #ffffff;

          color: #173b5a;

          font-size: 14px;

          transition:
            0.2s ease;
        }

        .inputGroup input::placeholder {
          color: #8a99a8;
        }

        .inputGroup input:focus {
          border-color:
            #4caf50;

          box-shadow:
            0 0 0 3px
            rgba(
              76,
              175,
              80,
              0.12
            );
        }

        .uploadBox {
          position: relative;

          min-height: 90px;

          border:
            2px dashed
            rgba(
              255,
              255,
              255,
              0.28
            );

          border-radius: 12px;

          background:
            rgba(
              255,
              255,
              255,
              0.06
            );

          overflow: hidden;

          transition:
            0.2s ease;
        }

        .uploadBox:hover {
          border-color:
            #4caf50;

          background:
            rgba(
              255,
              255,
              255,
              0.09
            );
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

          justify-content:
            center;

          padding: 12px;

          text-align: center;

          color: #ffffff;
        }

        .uploadText div {
          display: flex;

          flex-direction: column;

          gap: 4px;
        }

        .uploadText strong {
          font-size: 13px;

          color: #ffffff;
        }

        .uploadText small {
          color: #a9bac9;

          font-size: 11px;
        }

        .message {
          margin-top: 20px;

          padding:
            13px 15px;

          border-radius: 10px;

          font-size: 13px;

          font-weight: 700;

          line-height: 1.5;
        }

        .message.success {
          background:
            #eaf8ec;

          color:
            #267b30;

          border:
            1px solid
            #bde5c2;
        }

        .message.error {
          background:
            #fff0f0;

          color:
            #a62828;

          border:
            1px solid
            #efc0c0;
        }

        .submitButton {
          width: 100%;

          height: 52px;

          margin-top: 20px;

          border: 0;

          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #4caf50,
              #429747
            );

          color: #ffffff;

          font-size: 15px;

          font-weight: 900;

          cursor: pointer;

          transition:
            0.2s ease;
        }

        .submitButton:hover {
          transform:
            translateY(-1px);

          box-shadow:
            0 8px 18px
            rgba(
              76,
              175,
              80,
              0.22
            );
        }

        .submitButton:disabled {
          opacity: 0.65;

          cursor:
            not-allowed;

          transform: none;
        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 800px) {

          .depositPage {
            padding-top:
              calc(
                76px +
                env(
                  safe-area-inset-top,
                  0px
                )
              );

            padding-right: 18px;

            padding-bottom: 18px;

            padding-left: 18px;
          }

          .selectedPlanBox {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .formGrid {
            grid-template-columns:
              1fr;
          }

          .inputGroup.fullWidth {
            grid-column:
              auto;
          }

          .paymentSelector {
            max-width: 100%;
          }

        }

        @media (max-width: 550px) {

          .depositPage {
            padding-top:
              calc(
                76px +
                env(
                  safe-area-inset-top,
                  0px
                )
              );

            padding-right: 12px;

            padding-bottom: 12px;

            padding-left: 12px;
          }

          .pageHeader h1 {
            font-size: 25px;
          }

          .sectionCard {
            padding: 17px;
          }

          .selectedPlanBox {
            grid-template-columns:
              1fr 1fr;

            padding: 17px;
          }

          .infoRow {
            align-items:
              flex-start;

            flex-direction:
              column;

            gap: 5px;
          }

          .infoRow strong {
            text-align:
              left;
          }

          .paymentInfoHeader h2 {
            font-size: 20px;
          }

        }

      `}</style>
    </div>
  );
}