import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  MessageCircle,
  Send,
  X,
  Sparkles,
  User,
  Loader2,
} from "lucide-react";

import "./AIChat.css";

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Hi! I'm your SkillSensAI assistant. How can I help you learn today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /* =========================================================
     AUTO SCROLL TO LATEST MESSAGE
     ========================================================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  /* =========================================================
     FOCUS INPUT WHEN CHAT OPENS
     ========================================================= */

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  /* =========================================================
     FRONTEND DEMO AI RESPONSE
     
     Later this function can be replaced with:
     
     const response = await fetch("/api/chat", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         message: userMessage,
       }),
     });
     
     const data = await response.json();
     ========================================================= */

  const getDemoResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("sing") ||
      lowerMessage.includes("singing") ||
      lowerMessage.includes("voice")
    ) {
      return "For singing, start with breathing exercises, humming, and simple pitch-matching exercises. Practice consistently for a few minutes every day rather than trying to improve everything at once.";
    }

    if (
      lowerMessage.includes("music") ||
      lowerMessage.includes("song")
    ) {
      return "A good music practice session can be divided into three parts: warm-up, focused skill practice, and a short performance. SkillSensAI can help you track your progress as you practice.";
    }

    if (
      lowerMessage.includes("boxing") ||
      lowerMessage.includes("fight") ||
      lowerMessage.includes("martial")
    ) {
      return "For beginners in martial arts, focus first on stance, balance, guard position, footwork, and basic technique. Quality and control are more important than speed.";
    }

    if (
      lowerMessage.includes("practice") ||
      lowerMessage.includes("today")
    ) {
      return "Try a focused 20-minute session today: 5 minutes warm-up, 10 minutes on one specific skill, and 5 minutes reviewing your performance.";
    }

    if (
      lowerMessage.includes("skill") ||
      lowerMessage.includes("learn")
    ) {
      return "The best way to learn a skill is to practice consistently, get feedback, identify your weakest area, and repeat. SkillSensAI is designed around that learning → practice → feedback cycle.";
    }

    if (
      lowerMessage.includes("hello") ||
      lowerMessage.includes("hi") ||
      lowerMessage.includes("hey")
    ) {
      return "Hello! 👋 I'm ready to help you with your learning journey. Ask me about Music, Martial Arts, practice routines, or anything related to your skills.";
    }

    return "That's a great question! I'm currently running in demo mode. Soon I'll be connected to the SkillSensAI AI backend, where I'll be able to give you much more detailed and personalized answers.";
  };

  /* =========================================================
     SEND MESSAGE
     ========================================================= */

  const sendMessage = async () => {
    const trimmedMessage = input.trim();

    if (!trimmedMessage || isTyping) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmedMessage,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
    ]);

    setInput("");
    setIsTyping(true);

    try {
      /*
       * =====================================================
       * FUTURE REAL AI BACKEND
       * =====================================================
       *
       * Replace the demo section below with:
       *
       * const response = await fetch(
       *   "https://YOUR-BACKEND-URL/api/chat",
       *   {
       *     method: "POST",
       *     headers: {
       *       "Content-Type": "application/json",
       *     },
       *     body: JSON.stringify({
       *       message: trimmedMessage,
       *     }),
       *   }
       * );
       *
       * const data = await response.json();
       *
       * const aiText = data.response;
       *
       * =====================================================
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 900)
      );

      const aiText = getDemoResponse(trimmedMessage);

      const aiMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: aiText,
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        aiMessage,
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /* =========================================================
     ENTER KEY
     ========================================================= */

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  /* =========================================================
     CLOSE CHAT
     ========================================================= */

  const closeChat = () => {
    setIsOpen(false);
  };

  /* =========================================================
     OPEN CHAT
     ========================================================= */

  const openChat = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* =====================================================
          FLOATING CHAT BUTTON
          ===================================================== */}

      {!isOpen && (
        <button
          type="button"
          className="skillsensai-ai-floating-button"
          onClick={openChat}
          aria-label="Chat with AI"
        >
          <span className="ai-floating-icon">
            <MessageCircle size={23} />
          </span>

          <span className="ai-floating-text">
            Chat with AI
          </span>

          <span className="ai-floating-sparkle">
            <Sparkles size={13} />
          </span>
        </button>
      )}

      {/* =====================================================
          CHAT WINDOW
          ===================================================== */}

      {isOpen && (
        <div className="skillsensai-ai-chat-window">
          {/* HEADER */}

          <div className="ai-chat-header">
            <div className="ai-chat-header-left">
              <div className="ai-chat-avatar">
                <Bot size={23} />
              </div>

              <div className="ai-chat-title-area">
                <div className="ai-chat-title">
                  SkillSensAI AI
                </div>

                <div className="ai-chat-status">
                  <span className="ai-online-dot" />
                  AI Learning Assistant
                </div>
              </div>
            </div>

            <button
              type="button"
              className="ai-chat-close"
              onClick={closeChat}
              aria-label="Close AI chat"
            >
              <X size={19} />
            </button>
          </div>

          {/* CHAT MESSAGES */}

          <div className="ai-chat-messages">
            <div className="ai-chat-welcome">
              <div className="ai-welcome-icon">
                <Sparkles size={18} />
              </div>

              <div>
                <strong>Your learning assistant</strong>

                <p>
                  Ask me anything about your skills,
                  practice, or learning journey.
                </p>
              </div>
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-message-row ${
                  message.sender === "user"
                    ? "ai-user-row"
                    : "ai-bot-row"
                }`}
              >
                {message.sender === "ai" && (
                  <div className="ai-message-avatar">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`ai-message-bubble ${
                    message.sender === "user"
                      ? "ai-user-message"
                      : "ai-bot-message"
                  }`}
                >
                  {message.text}
                </div>

                {message.sender === "user" && (
                  <div className="ai-message-user-avatar">
                    <User size={15} />
                  </div>
                )}
              </div>
            ))}

            {/* TYPING INDICATOR */}

            {isTyping && (
              <div className="ai-message-row ai-bot-row">
                <div className="ai-message-avatar">
                  <Bot size={15} />
                </div>

                <div className="ai-typing-bubble">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}

          <div className="ai-chat-input-area">
            <div className="ai-chat-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask SkillSensAI..."
                disabled={isTyping}
                maxLength={500}
              />

              <button
                type="button"
                className="ai-send-button"
                onClick={sendMessage}
                disabled={
                  !input.trim() || isTyping
                }
                aria-label="Send message"
              >
                {isTyping ? (
                  <Loader2
                    size={18}
                    className="ai-send-loader"
                  />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>

            <div className="ai-chat-disclaimer">
              SkillSensAI AI can make mistakes. Check
              important information.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
