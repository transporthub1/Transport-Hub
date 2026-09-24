"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminSupport() {
  const [messages, setMessages] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Load messages error:", error);
      setLoading(false);
      return;
    }

    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("admin-support-chat")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const users = [
    ...new Map(
      messages.map((message) => [
        message.user_phone,
        {
          phone: message.user_phone,
          name: message.user_name || "User",
        },
      ])
    ).values(),
  ];

  const selectedMessages = messages.filter(
    (message) => message.user_phone === selectedPhone
  );

  const sendReply = async () => {
    const cleanReply = reply.trim();

    if (!cleanReply || !selectedPhone) return;

    const selectedUser = users.find(
      (user) => user.phone === selectedPhone
    );

    const { error } = await supabase
      .from("support_messages")
      .insert({
        user_phone: selectedPhone,
        user_name: selectedUser?.name || "User",
        sender: "admin",
        message: cleanReply,
      });

    if (error) {
      console.error("Reply error:", error);
      alert("Message send nahi hua.");
      return;
    }

    setReply("");
    await loadMessages();
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Support Messages</h1>
          <p>Manage live customer support chats</p>
        </div>

        <button onClick={loadMessages}>Refresh</button>
      </div>

      <div className="support-layout">
        <div className="users-panel">
          <h2>Users</h2>

          {loading ? (
            <div className="empty">Loading...</div>
          ) : users.length === 0 ? (
            <div className="empty">No messages yet</div>
          ) : (
            users.map((user) => (
              <button
                key={user.phone}
                className={`user-item ${
                  selectedPhone === user.phone ? "active" : ""
                }`}
                onClick={() => setSelectedPhone(user.phone)}
              >
                <strong>{user.name}</strong>
                <span>{user.phone}</span>
              </button>
            ))
          )}
        </div>

        <div className="chat-panel">
          {!selectedPhone ? (
            <div className="no-chat">
              <div>💬</div>

              <h2>Select a user</h2>

              <p>
                Select a user from the left side to view the support chat.
              </p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div>
                  <strong>
                    {
                      users.find(
                        (user) => user.phone === selectedPhone
                      )?.name
                    }
                  </strong>

                  <span>{selectedPhone}</span>
                </div>
              </div>

              <div className="messages">
                {selectedMessages.length === 0 ? (
                  <div className="empty">No messages</div>
                ) : (
                  selectedMessages.map((message, index) => (
                    <div
                      key={
                        message.id ||
                        `${message.created_at}-${index}`
                      }
                      className={`message-row ${
                        message.sender === "admin"
                          ? "admin-row"
                          : "user-row"
                      }`}
                    >
                      <div
                        className={`message ${
                          message.sender === "admin"
                            ? "admin-message"
                            : "user-message"
                        }`}
                      >
                        <div className="message-sender">
                          {message.sender === "admin"
                            ? "Admin"
                            : message.user_name || "User"}
                        </div>

                        <div>{message.message}</div>

                        <small>
                          {message.created_at
                            ? new Date(
                                message.created_at
                              ).toLocaleString()
                            : ""}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="reply-box">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendReply();
                    }
                  }}
                  placeholder="Type your reply..."
                />

                <button onClick={sendReply}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .admin-page {
          min-height: 100vh;
          padding: 30px;
          background: #f3f7fb;
          color: #102a43;
          font-family: Arial, sans-serif;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .admin-header h1 {
          margin: 0 0 6px;
          font-size: 28px;
          color: #102a43;
        }

        .admin-header p {
          margin: 0;
          color: #6b7c93;
        }

        .admin-header button {
          border: none;
          background: #102a43;
          color: white;
          padding: 11px 18px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
        }

        .support-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
          min-height: 650px;
        }

        .users-panel,
        .chat-panel {
          background: #102a43;
          border-radius: 18px;
          border: 1px solid #1e3a56;
          box-shadow: 0 8px 25px rgba(16, 42, 67, 0.18);
          overflow: hidden;
        }

        .users-panel {
          padding: 18px;
        }

        .users-panel h2 {
          margin: 0 0 15px;
          font-size: 18px;
          color: #ffffff;
        }

        .user-item {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 14px;
          margin-bottom: 8px;
          border: 1px solid #294b66;
          background: #173b5b;
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
        }

        .user-item:hover {
          background: #1d4868;
        }

        .user-item.active {
          background: #1f5275;
          border-color: #36a269;
        }

        .user-item strong {
          color: #ffffff;
          font-size: 14px;
        }

        .user-item span {
          color: #c5d3df;
          font-size: 12px;
        }

        .empty {
          text-align: center;
          color: #b7c6d3;
          padding: 30px 10px;
        }

        .chat-panel {
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          padding: 18px 20px;
          border-bottom: 1px solid #294b66;
          background: #102a43;
          color: white;
        }

        .chat-header strong {
          display: block;
          font-size: 17px;
          margin-bottom: 4px;
        }

        .chat-header span {
          font-size: 12px;
          color: #c5d3df;
        }

        .messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: #102a43;
          min-height: 500px;
        }

        .message-row {
          display: flex;
          margin-bottom: 12px;
        }

        .user-row {
          justify-content: flex-start;
        }

        .admin-row {
          justify-content: flex-end;
        }

        .message {
          max-width: 70%;
          padding: 11px 14px;
          border-radius: 14px;
          line-height: 1.5;
          font-size: 14px;
        }

        .user-message {
          background: #173b5b;
          border: 1px solid #294b66;
          color: #ffffff;
          border-bottom-left-radius: 4px;
        }

        .admin-message {
          background: #102a43;
          border: 1px solid #294b66;
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }

        .message-sender {
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #d7e3ec;
          opacity: 0.9;
        }

        .message small {
          display: block;
          margin-top: 5px;
          font-size: 9px;
          color: #c5d3df;
          opacity: 0.7;
        }

        .no-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 30px;
          color: #b7c6d3;
          background: #102a43;
        }

        .no-chat div {
          font-size: 45px;
          margin-bottom: 12px;
        }

        .no-chat h2 {
          color: #ffffff;
          margin: 0 0 8px;
        }

        .no-chat p {
          margin: 0;
          color: #b7c6d3;
        }

        .reply-box {
          display: flex;
          gap: 10px;
          padding: 15px;
          border-top: 1px solid #294b66;
          background: #102a43;
        }

        .reply-box input {
          flex: 1;
          border: 1px solid #294b66;
          background: #173b5b;
          color: #ffffff;
          border-radius: 10px;
          padding: 12px 14px;
          outline: none;
          font-size: 14px;
        }

        .reply-box input::placeholder {
          color: #b7c6d3;
        }

        .reply-box input:focus {
          border-color: #36a269;
        }

        .reply-box button {
          border: none;
          background: #36a269;
          color: white;
          padding: 0 22px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .reply-box button:hover {
          background: #2e8b59;
        }

        @media (max-width: 800px) {
          .admin-page {
            padding: 15px;
          }

          .admin-header {
            gap: 15px;
          }

          .admin-header h1 {
            font-size: 23px;
          }

          .support-layout {
            grid-template-columns: 1fr;
          }

          .users-panel {
            max-height: 300px;
            overflow-y: auto;
          }

          .message {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
}