"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "support",
      text: "Hello! 👋 Welcome to Transport Hub Support. How can we help you today?",
      time: "Now",
    },
  ]);

  const [userName, setUserName] = useState("User");
  const [userPhone, setUserPhone] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("transportLoggedIn");

    if (loggedIn !== "true") {
      router.push("/login");
      return;
    }

    try {
      const savedUser = JSON.parse(
        localStorage.getItem("transportUser") || "null"
      );

      if (savedUser) {
        setUserName(savedUser.fullName || savedUser.name || "User");
        setUserPhone(savedUser.phone || savedUser.mobile || "");
      }
    } catch (error) {
      console.log("User data error:", error);
    }
  }, [router]);

  const sendMessage = () => {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;

    const newMessage = {
      id: Date.now(),
      sender: "user",
      text: cleanMessage,
      time: "Now",
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "support",
          text: "Thanks for contacting Transport Hub Support. Our support team will assist you shortly. 💙",
          time: "Now",
        },
      ]);
    }, 700);
  };

  const sendQuickMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      const newMessage = {
        id: Date.now(),
        sender: "user",
        text,
        time: "Now",
      };

      setMessages((prev) => [...prev, newMessage]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "support",
            text: "Sure! We have received your request. Our support team will assist you shortly. 💙",
            time: "Now",
          },
        ]);
      }, 700);
    }, 50);

    setMessage("");
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Transport Hub Support, I need help with my account.${userPhone ? ` My registered number is ${userPhone}.` : ""}`
  );

  const whatsappLink = `https://wa.me/923263159327?text=${whatsappMessage}`;

  const faqs = [
    {
      question: "How can I make a deposit?",
      answer:
        "Go to the Deposit section, select your transport plan, enter your bank details and submit your deposit request.",
    },
    {
      question: "How can I withdraw my returns?",
      answer:
        "Open the Withdraw section and submit a withdrawal request when your available return balance reaches the minimum cashout amount.",
    },
    {
      question: "Where can I see my transactions?",
      answer:
        "Open the Transactions section from your dashboard to view your account activity.",
    },
    {
      question: "How can I contact support?",
      answer:
        "You can contact us through Live Chat or directly through WhatsApp Support.",
    },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>🎧 Support Center</div>
          <div style={styles.headerSubtitle}>
            We are here to help you
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          style={styles.backButton}
        >
          🏠 Dashboard
        </button>
      </div>

      <main style={styles.container}>
        <div style={styles.welcomeCard}>
          <div style={styles.welcomeIcon}>🎧</div>

          <div style={{ flex: 1 }}>
            <h2 style={styles.welcomeTitle}>
              Hello, {userName}! 👋
            </h2>

            <p style={styles.welcomeText}>
              Need help with your Transport Hub account? Our support
              options are available below.
            </p>
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("chat")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "chat" ? styles.activeTab : {}),
            }}
          >
            💬 Live Chat
          </button>

          <button
            onClick={() => setActiveTab("whatsapp")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "whatsapp" ? styles.activeTab : {}),
            }}
          >
            📱 WhatsApp
          </button>

          <button
            onClick={() => setActiveTab("faq")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "faq" ? styles.activeTab : {}),
            }}
          >
            ❓ FAQs
          </button>
        </div>

        {activeTab === "chat" && (
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderIcon}>💬</div>

              <div>
                <h2 style={styles.cardTitle}>Live Chat</h2>
                <p style={styles.cardSubtitle}>
                  Chat with Transport Hub Support
                </p>
              </div>

              <div style={styles.onlineBadge}>
                <span style={styles.onlineDot}></span>
                Online
              </div>
            </div>

            <div style={styles.chatBox}>
              <div style={styles.messagesArea}>
                {messages.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      ...styles.messageRow,
                      justifyContent:
                        item.sender === "user"
                          ? "flex-end"
                          : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        ...styles.messageBubble,
                        ...(item.sender === "user"
                          ? styles.userBubble
                          : styles.supportBubble),
                      }}
                    >
                      <div>{item.text}</div>

                      <div
                        style={{
                          ...styles.messageTime,
                          textAlign:
                            item.sender === "user"
                              ? "right"
                              : "left",
                        }}
                      >
                        {item.sender === "user"
                          ? "You"
                          : "Support"}{" "}
                        • {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.quickReplies}>
                <button
                  onClick={() =>
                    sendQuickMessage("I need help with my deposit.")
                  }
                  style={styles.quickButton}
                >
                  💰 Deposit Help
                </button>

                <button
                  onClick={() =>
                    sendQuickMessage("I need help with my withdrawal.")
                  }
                  style={styles.quickButton}
                >
                  💸 Withdrawal Help
                </button>

                <button
                  onClick={() =>
                    sendQuickMessage("I have an issue with my account.")
                  }
                  style={styles.quickButton}
                >
                  👤 Account Help
                </button>
              </div>

              <div style={styles.inputArea}>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  style={styles.input}
                />

                <button
                  onClick={sendMessage}
                  style={styles.sendButton}
                >
                  Send ➤
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "whatsapp" && (
          <section style={styles.card}>
            <div style={styles.whatsappSection}>
              <div style={styles.whatsappIcon}>📱</div>

              <h2 style={styles.cardTitle}>
                WhatsApp Support
              </h2>

              <p style={styles.whatsappText}>
                Contact our support team directly on WhatsApp for
                assistance with your account.
              </p>

              <div style={styles.numberBox}>
                <div style={styles.numberLabel}>
                  Support Number
                </div>

                <div style={styles.number}>
                  +92 326 3159327
                </div>
              </div>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.whatsappButton}
              >
                💬 Chat on WhatsApp
              </a>

              <p style={styles.smallText}>
                WhatsApp will open in a new tab or the WhatsApp app.
              </p>
            </div>
          </section>
        )}

        {activeTab === "faq" && (
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderIcon}>❓</div>

              <div>
                <h2 style={styles.cardTitle}>Frequently Asked Questions</h2>
                <p style={styles.cardSubtitle}>
                  Quick answers to common questions
                </p>
              </div>
            </div>

            <div style={styles.faqList}>
              {faqs.map((faq, index) => (
                <details key={index} style={styles.faqItem}>
                  <summary style={styles.faqQuestion}>
                    <span>{faq.question}</span>
                    <span>＋</span>
                  </summary>

                  <p style={styles.faqAnswer}>
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div style={styles.bottomSupport}>
          <div style={styles.bottomIcon}>🎧</div>

          <div style={{ flex: 1 }}>
            <div style={styles.bottomTitle}>
              Need more assistance?
            </div>

            <div style={styles.bottomText}>
              Contact us through WhatsApp for direct support.
            </div>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.bottomButton}
          >
            WhatsApp
          </a>
        </div>

        <button
          onClick={() => router.push("/")}
          style={styles.dashboardButton}
        >
          ← Back to Dashboard
        </button>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef3f7",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    background: "linear-gradient(135deg, #102A43, #173B5A)",
    padding: "22px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    boxShadow: "0 4px 16px rgba(16, 42, 67, 0.18)",
  },

  headerTitle: {
    fontSize: "25px",
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: "5px",
    color: "#C9D8E6",
    fontSize: "14px",
  },

  backButton: {
    border: "1px solid #294B66",
    background: "#1E3A56",
    color: "#ffffff",
    padding: "11px 17px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },

  container: {
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "28px 20px 45px",
  },

  welcomeCard: {
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "18px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "17px",
    boxShadow: "0 8px 25px rgba(16, 42, 67, 0.12)",
  },

  welcomeIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "15px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    flexShrink: 0,
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "21px",
  },

  welcomeText: {
    margin: "7px 0 0",
    color: "#C9D8E6",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  tabs: {
    marginTop: "22px",
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "14px",
    padding: "7px",
    display: "flex",
    gap: "7px",
  },

  tabButton: {
    flex: 1,
    border: "none",
    background: "transparent",
    color: "#9FB3C8",
    padding: "13px 10px",
    borderRadius: "9px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
  },

  activeTab: {
    background: "#1E3A56",
    color: "#ffffff",
  },

  card: {
    marginTop: "20px",
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 8px 25px rgba(16, 42, 67, 0.12)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "18px",
  },

  cardHeaderIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "13px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },

  cardTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "800",
  },

  cardSubtitle: {
    margin: "4px 0 0",
    color: "#9FB3C8",
    fontSize: "13px",
  },

  onlineBadge: {
    marginLeft: "auto",
    background: "#173B5A",
    border: "1px solid #294B66",
    color: "#8FD694",
    padding: "7px 11px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  onlineDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#8FD694",
    display: "inline-block",
  },

  chatBox: {
    background: "#173B5A",
    border: "1px solid #294B66",
    borderRadius: "14px",
    overflow: "hidden",
  },

  messagesArea: {
    minHeight: "320px",
    maxHeight: "420px",
    overflowY: "auto",
    padding: "18px",
  },

  messageRow: {
    display: "flex",
    marginBottom: "13px",
  },

  messageBubble: {
    maxWidth: "75%",
    padding: "12px 14px",
    borderRadius: "13px",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  supportBubble: {
    background: "#102A43",
    border: "1px solid #294B66",
    color: "#ffffff",
    borderBottomLeftRadius: "4px",
  },

  userBubble: {
    background: "#2E6B4A",
    color: "#ffffff",
    borderBottomRightRadius: "4px",
  },

  messageTime: {
    marginTop: "6px",
    fontSize: "10px",
    color: "#9FB3C8",
  },

  quickReplies: {
    padding: "10px 14px",
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    borderTop: "1px solid #294B66",
  },

  quickButton: {
    border: "1px solid #294B66",
    background: "#102A43",
    color: "#C9D8E6",
    padding: "8px 11px",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
  },

  inputArea: {
    display: "flex",
    gap: "9px",
    padding: "13px",
    borderTop: "1px solid #294B66",
  },

  input: {
    flex: 1,
    minWidth: 0,
    border: "1px solid #294B66",
    background: "#102A43",
    color: "#ffffff",
    padding: "12px 13px",
    borderRadius: "9px",
    outline: "none",
    fontSize: "14px",
  },

  sendButton: {
    border: "none",
    background: "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "0 18px",
    borderRadius: "9px",
    fontWeight: "800",
    cursor: "pointer",
  },

  whatsappSection: {
    textAlign: "center",
    padding: "18px 10px 12px",
  },

  whatsappIcon: {
    width: "78px",
    height: "78px",
    borderRadius: "50%",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    margin: "0 auto 17px",
  },

  whatsappText: {
    maxWidth: "600px",
    margin: "10px auto 20px",
    color: "#C9D8E6",
    lineHeight: 1.6,
    fontSize: "14px",
  },

  numberBox: {
    maxWidth: "420px",
    margin: "0 auto 20px",
    padding: "15px",
    background: "#173B5A",
    border: "1px solid #294B66",
    borderRadius: "12px",
  },

  numberLabel: {
    color: "#9FB3C8",
    fontSize: "12px",
    marginBottom: "5px",
  },

  number: {
    color: "#8FD694",
    fontSize: "20px",
    fontWeight: "800",
  },

  whatsappButton: {
    display: "inline-block",
    textDecoration: "none",
    background: "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "13px 24px",
    borderRadius: "10px",
    fontWeight: "800",
    fontSize: "14px",
  },

  smallText: {
    marginTop: "14px",
    color: "#9FB3C8",
    fontSize: "12px",
  },

  faqList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  faqItem: {
    background: "#173B5A",
    border: "1px solid #294B66",
    borderRadius: "11px",
    overflow: "hidden",
  },

  faqQuestion: {
    padding: "16px",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    listStyle: "none",
    fontSize: "14px",
  },

  faqAnswer: {
    margin: 0,
    padding: "0 16px 16px",
    color: "#C9D8E6",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  bottomSupport: {
    marginTop: "20px",
    background: "#102A43",
    border: "1px solid #1E3A56",
    borderRadius: "15px",
    padding: "17px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
  },

  bottomIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "11px",
    background: "#1E3A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  bottomTitle: {
    fontWeight: "800",
    fontSize: "14px",
  },

  bottomText: {
    color: "#9FB3C8",
    fontSize: "12px",
    marginTop: "4px",
  },

  bottomButton: {
    textDecoration: "none",
    background: "linear-gradient(135deg, #3E8E5B, #2E6B4A)",
    color: "#ffffff",
    padding: "10px 15px",
    borderRadius: "9px",
    fontSize: "12px",
    fontWeight: "800",
  },

  dashboardButton: {
    width: "100%",
    marginTop: "20px",
    border: "1px solid #1E3A56",
    background: "#102A43",
    color: "#ffffff",
    padding: "14px",
    borderRadius: "11px",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "14px",
  },
};