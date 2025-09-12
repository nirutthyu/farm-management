import React, { useEffect, useState } from "react";
import { Link,useLocation } from "react-router-dom";

export default function LandingPage() {
  const location = useLocation();
  const user = location.state?.user; // Get user info from navigate state
  const [username, setUsername] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("english");
  const [quickTips, setQuickTips] = useState([]);

  useEffect(() => {
     if (user) {
      setUsername(user.name); 
    } else {

      setUsername("Farmer");
    }

    loadQuickTips();
  }, []);

  useEffect(() => {

    loadQuickTips();
  }, [language]);

  const loadQuickTips = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/quick-tips?language=${language}`);
      const data = await response.json();
      if (data.tips) {
        setQuickTips(data.tips.slice(0, 3)); 
      }
    } catch (error) {
      console.error("Error loading quick tips:", error);
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;


    const userMessage = { sender: "user", text: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          language: language,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const botMessage = { 
          sender: "bot", 
          text: data.response, 
          timestamp: new Date(),
          language: data.language 
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = language === "tamil" 
        ? "மன்னிக்கவும், ஏதோ பிரச்சனை ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்."
        : "Sorry, something went wrong. Please try again.";
      
      const errorMsg = { 
        sender: "bot", 
        text: errorMessage, 
        timestamp: new Date(),
        isError: true 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  const handleQuickTip = (tip) => {
    const question = language === "tamil" 
      ? `இந்த குறிப்பு பற்றி மேலும் விளக்கமாக சொல்லுங்கள்: ${tip}`
      : `Tell me more about this tip: ${tip}`;
    sendMessage(question);
  };

  const toggleLanguage = async () => {
    const newLanguage = language === "english" ? "tamil" : "english";
    setLanguage(newLanguage);
    
    // Clear current session when language changes to start fresh conversation
    try {
      await fetch("http://localhost:5000/api/chat/clear-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });
      
      // Generate new session ID for new language
      setSessionId(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      
      // Add language switch message
      const switchMessage = newLanguage === "tamil" 
        ? "மொழி தமிழுக்கு மாற்றப்பட்டது. நான் இப்போது தமிழில் உதவ முடியும்!"
        : "Language switched to English. I can now help you in English!";
        
      const langSwitchMsg = { 
        sender: "bot", 
        text: switchMessage, 
        timestamp: new Date(),
        isLanguageSwitch: true 
      };
      setMessages(prev => [...prev, langSwitchMsg]);
      
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  const clearChat = async () => {
    try {
      await fetch("http://localhost:5000/api/chat/clear-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });
      
      // Generate new session ID
      setSessionId(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      setMessages([]);
      
    } catch (error) {
      console.error("Error clearing chat:", error);
      setMessages([]); // Clear UI regardless of API call success
    }
  };

  return (
    <div className="admin-landing-container">
      <section className="hero-section">
        <h1 className="hero-title">Welcome, {username} 👋</h1>
        <p className="hero-description">
          Manage your farm needs, products, and crops all in one place.
        </p>
      </section>

      <div className="admin-options">
        <div className="option-card">
          <h2>Add Products</h2>
          <p>Add new products to the system.</p>
          <Link to="/add-item" className="option-link">Go to Add Products</Link>
        </div>

        <div className="option-card">
          <h2>Manage Fertilizers</h2>
          <p>Get smart fertilizer recommendations</p>
          <Link to="/fertilizer-detection" className="option-link">Go to Manage Fertilizers</Link>
        </div>

        <div className="option-card">
          <h2>Farm Reports</h2>
          <p>View and generate reports for farm management.</p>
          <Link to="/sensor-control" className="option-link">Go to Farm Reports</Link>
        </div>
      </div>

      {/* Floating Round Chat Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0px 4px 6px rgba(0,0,0,0.2)",
          zIndex: 1001,
        }}
      >
        {chatOpen ? "×" : "💬"}
      </button>

      {/* Overlay + Chat Window */}
      {chatOpen && (
        <>
          {/* Semi-transparent background overlay */}
          <div
            onClick={() => setChatOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 1000,
            }}
          ></div>

          {/* Chat Window */}
          <div
            style={{
              position: "fixed",
              top: "90px",
              right: "20px",
              width: "380px",
              height: "550px",
              background: "white",
              border: "1px solid #ccc",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.25)",
              zIndex: 1002,
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "#28a745",
                color: "white",
                padding: "12px",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
                fontWeight: "bold",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{language === "tamil" ? "விவசாய உதவியாளர்" : "Farm Assistant"}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={toggleLanguage}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "4px",
                    color: "white",
                    fontSize: "10px",
                    padding: "4px 6px",
                    cursor: "pointer",
                  }}
                >
                  {language === "tamil" ? "EN" : "த"}
                </button>
                <button
                  onClick={clearChat}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "4px",
                    color: "white",
                    fontSize: "12px",
                    padding: "4px 6px",
                    cursor: "pointer",
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: "12px",
                overflowY: "auto",
                maxHeight: "400px",
              }}
            >
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#666", marginBottom: "15px" }}>
                  <p>{language === "tamil" ? "வணக்கம்! நான் உங்கள் விவசாய உதவியாளர்." : "Hello! I'm your farm assistant."}</p>
                  
                  {quickTips.length > 0 && (
                    <div>
                      <p style={{ fontSize: "14px", marginBottom: "10px" }}>
                        {language === "tamil" ? "இன்றைய குறிப்புகள்:" : "Quick tips:"}
                      </p>
                      {quickTips.map((tip, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickTip(tip)}
                          style={{
                            display: "block",
                            width: "100%",
                            margin: "5px 0",
                            padding: "8px",
                            background: "#f8f9fa",
                            border: "1px solid #dee2e6",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                            color:"black",
                            textAlign: "left",
                          }}
                        >
                          💡 {tip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "12px",
                    textAlign: msg.sender === "user" ? "right" : "left",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      backgroundColor: msg.isError
                        ? "#ffebee"
                        : msg.sender === "user"
                        ? "#28a745"
                        : "#f1f1f1",
                      color: msg.isError
                        ? "#c62828"
                        : msg.sender === "user"
                        ? "white"
                        : "black",
                      maxWidth: "85%",
                      wordWrap: "break-word",
                      fontSize: "14px",
                      lineHeight: "1.4",
                    }}
                  >
                    {msg.text}
                  </span>
                  {msg.timestamp && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#999",
                        marginTop: "4px",
                        textAlign: msg.sender === "user" ? "right" : "left",
                      }}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div style={{ textAlign: "left", marginBottom: "12px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      backgroundColor: "#f1f1f1",
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    {language === "tamil" ? "டைப் செய்து கொண்டிருக்கிறேன்..." : "Typing..."}
                  </span>
                </div>
              )}
            </div>

            {/* Input + Send */}
            <div
              style={{
                display: "flex",
                borderTop: "1px solid #ccc",
                padding: "8px",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleSend();
                  }
                }}
                placeholder={
                  language === "tamil"
                    ? "உங்கள் கேள்வியை இங்கே டைப் செய்யுங்கள்..."
                    : "Ask me about farming..."
                }
                disabled={isLoading}
                style={{
                  flex: 1,
                  border: "1px solid #ccc",
                  borderRadius: "20px",
                  padding: "10px 14px",
                  outline: "none",
                  fontSize: "14px",
                  opacity: isLoading ? 0.6 : 1,
                }}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                style={{
                  marginLeft: "8px",
                  background: isLoading || !input.trim() ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  fontSize: "16px",
                  cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isLoading ? "⏳" : "➤"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}