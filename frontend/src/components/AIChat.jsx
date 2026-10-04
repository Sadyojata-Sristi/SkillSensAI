import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  MessageCircle,
  Send,
  X,
  Sparkles,
  User,
  Loader2,
  Settings,
  Upload,
  Check,
} from "lucide-react";

import "./AIChat.css";

const AI_OPTIONS = [
  { id: "cat", name: "Mochi", emoji: "🐱" },
  { id: "dog", name: "Buddy", emoji: "🐶" },
  { id: "robot", name: "Nova", emoji: "🤖" },
  { id: "panda", name: "Panda", emoji: "🐼" },
  { id: "fox", name: "Foxy", emoji: "🦊" },
  { id: "bear", name: "Bear", emoji: "🐻" },
  { id: "owl", name: "Ollie", emoji: "🦉" },
  { id: "alien", name: "Zippy", emoji: "👽" },
  { id: "frog", name: "Froggy", emoji: "🐸" },
  { id: "rabbit", name: "Bunny", emoji: "🐰" },
];

function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Hi! I'm your SkillSensAI companion. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [aiName, setAiName] = useState(() => {
    try {
      return localStorage.getItem("skillsensai_ai_name") || "Nova";
    } catch {
      return "Nova";
    }
  });

  const [aiCharacter, setAiCharacter] = useState(() => {
    try {
      return (
        localStorage.getItem("skillsensai_ai_character") ||
        "robot"
      );
    } catch {
      return "robot";
    }
  });

  const [aiImage, setAiImage] = useState(() => {
    try {
      return localStorage.getItem("skillsensai_ai_image") || "";
    } catch {
      return "";
    }
  });

  const [tempName, setTempName] = useState(aiName);
  const [tempCharacter, setTempCharacter] =
    useState(aiCharacter);
  const [tempImage, setTempImage] = useState(aiImage);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const selectedCharacter =
    AI_OPTIONS.find(
      (item) => item.id === aiCharacter
    ) || AI_OPTIONS[2];

  const getCharacter = () => {
    if (aiImage) {
      return (
        <img
          src={aiImage}
          alt={aiName}
          className="ai-character-image"
        />
      );
    }

    return (
      <span className="ai-character-emoji">
        {selectedCharacter.emoji}
      </span>
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !showCustomize) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, showCustomize]);

  const openCustomize = () => {
    setTempName(aiName);
    setTempCharacter(aiCharacter);
    setTempImage(aiImage);
    setShowCustomize(true);
  };

  const closeCustomize = () => {
    setShowCustomize(false);
  };

  const saveCustomization = () => {
    const finalName =
      tempName.trim() || "Nova";

    setAiName(finalName);
    setAiCharacter(tempCharacter);
    setAiImage(tempImage);

    try {
      localStorage.setItem(
        "skillsensai_ai_name",
        finalName
      );

      localStorage.setItem(
        "skillsensai_ai_character",
        tempCharacter
      );

      if (tempImage) {
        localStorage.setItem(
          "skillsensai_ai_image",
          tempImage
        );
      } else {
        localStorage.removeItem(
          "skillsensai_ai_image"
        );
      }
    } catch {
      // Ignore localStorage errors.
    }

    setShowCustomize(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    // Keep uploaded image reasonably small.
    if (file.size > 3 * 1024 * 1024) {
      alert("Please choose an image smaller than 3 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setTempImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

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

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setInput("");
    setIsTyping(true);

    /*
      FUTURE REAL AI BACKEND

      Replace the demo response section below with:

      const response = await fetch(
        "https://YOUR-BACKEND-URL/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedMessage,
            ai_name: aiName,
            ai_character: aiCharacter,
          }),
        }
      );

      const data = await response.json();
      const aiText = data.response;
    */

    setTimeout(() => {
      const lower =
        trimmedMessage.toLowerCase();

      let aiText =
        `I'm ${aiName}! I'm currently in demo mode, but I'm ready to help you learn.`;

      if (
        lower.includes("sing") ||
        lower.includes("voice") ||
        lower.includes("pitch")
      ) {
        aiText =
          "Let's work on your singing! Try a few minutes of humming first, then practice matching one note at a time. I can help you understand pitch, stability and accuracy.";
      } else if (
        lower.includes("music") ||
        lower.includes("song")
      ) {
        aiText =
          "For music practice, try this: 5 minutes of warm-up, 10 minutes of lesson practice, and 5 minutes recording yourself. Then review your mistakes.";
      } else if (
        lower.includes("boxing") ||
        lower.includes("fight") ||
        lower.includes("martial")
      ) {
        aiText =
          "For martial arts, focus on stance, guard, balance and controlled movement before increasing speed. Consistency matters more than rushing.";
      } else if (
        lower.includes("practice") ||
        lower.includes("today")
      ) {
        aiText =
          "Here's a quick 20-minute session: 5 minutes warm-up, 10 minutes focused practice, and 5 minutes testing yourself.";
      } else if (
        lower.includes("skill") ||
        lower.includes("learn")
      ) {
        aiText =
          "SkillSensAI works best when you follow the cycle: Learn → Practice → Get Feedback → Improve → Master.";
      } else if (
        lower.includes("hello") ||
        lower.includes("hi") ||
        lower.includes("hey")
      ) {
        aiText =
          `Hey! ${aiName} here. What would you like to learn today?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: aiText,
        },
      ]);

      setIsTyping(false);
    }, 900);
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* =====================================================
          AI CHARACTER
          ===================================================== */}

      <button
        className="ai-character-floating"
        onClick={openCustomize}
        title="Customize your AI"
        aria-label="Customize your AI"
      >
        <div className="ai-character-glow" />

        <div className="ai-character-bubble">
          {getCharacter()}
        </div>

        <div className="ai-character-edit">
          <Settings size={13} />
        </div>

        <div className="ai-character-name">
          {aiName}
        </div>
      </button>

      {/* =====================================================
          CHAT BUTTON
          ===================================================== */}

      {!isOpen && (
        <button
          className="ai-chat-floating-button"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle size={21} />
          <span>Chat with AI</span>
          <Sparkles
            size={16}
            className="ai-chat-sparkle"
          />
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
                {getCharacter()}
              </div>

              <div>
                <div className="ai-chat-title">
                  {aiName}
                </div>

                <div className="ai-chat-status">
                  <span className="ai-status-dot" />
                  Your AI companion
                </div>
              </div>
            </div>

            <div className="ai-chat-header-actions">
              <button
                className="ai-header-icon"
                onClick={openCustomize}
                title="Customize AI"
              >
                <Settings size={17} />
              </button>

              <button
                className="ai-header-icon"
                onClick={() =>
                  setIsOpen(false)
                }
                title="Close"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="ai-chat-messages">
            <div className="ai-chat-welcome">
              <div className="ai-welcome-icon">
                {getCharacter()}
              </div>

              <div>
                <strong>
                  Hi! I'm {aiName}
                </strong>

                <p>
                  Your personal SkillSensAI
                  learning companion.
                </p>
              </div>
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-message-row ${
                  message.sender === "user"
                    ? "user-row"
                    : "ai-row"
                }`}
              >
                <div
                  className={`ai-message-avatar ${
                    message.sender === "user"
                      ? "user-avatar"
                      : ""
                  }`}
                >
                  {message.sender === "user" ? (
                    <User size={16} />
                  ) : (
                    getCharacter()
                  )}
                </div>

                <div
                  className={`ai-message-bubble ${
                    message.sender === "user"
                      ? "user-message"
                      : "ai-message"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="ai-message-row ai-row">
                <div className="ai-message-avatar">
                  {getCharacter()}
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

          {/* INPUT */}
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
                placeholder={`Ask ${aiName} anything...`}
              />

              <button
                className="ai-send-button"
                onClick={sendMessage}
                disabled={
                  !input.trim() || isTyping
                }
              >
                {isTyping ? (
                  <Loader2
                    size={18}
                    className="ai-loading-icon"
                  />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>

            <div className="ai-chat-footer">
              <span>
                ✨ SkillSensAI AI Companion
              </span>
            </div>
          </div>

          {/* =================================================
              CUSTOMIZATION PANEL
              ================================================= */}

          {showCustomize && (
            <div className="ai-customize-overlay">
              <div className="ai-customize-panel">
                <div className="ai-customize-header">
                  <div>
                    <h3>Customize Your AI</h3>
                    <p>
                      Create your own learning
                      companion.
                    </p>
                  </div>

                  <button
                    className="ai-customize-close"
                    onClick={closeCustomize}
                  >
                    <X size={19} />
                  </button>
                </div>

                {/* PREVIEW */}
                <div className="ai-customize-preview">
                  <div className="ai-preview-character">
                    {tempImage ? (
                      <img
                        src={tempImage}
                        alt="AI preview"
                      />
                    ) : (
                      <span>
                        {
                          (
                            AI_OPTIONS.find(
                              (item) =>
                                item.id ===
                                tempCharacter
                            ) ||
                            AI_OPTIONS[2]
                          ).emoji
                        }
                      </span>
                    )}
                  </div>

                  <strong>
                    {tempName.trim() ||
                      "Your AI"}
                  </strong>

                  <span>
                    Your personal AI
                    companion
                  </span>
                </div>

                {/* NAME */}
                <label className="ai-customize-label">
                  AI Name
                </label>

                <input
                  className="ai-name-input"
                  value={tempName}
                  onChange={(event) =>
                    setTempName(
                      event.target.value
                    )
                  }
                  maxLength={24}
                  placeholder="Give your AI a name"
                />

                {/* CHARACTERS */}
                <label className="ai-customize-label">
                  Choose your AI character
                </label>

                <div className="ai-character-options">
                  {AI_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      className={`ai-character-option ${
                        tempCharacter ===
                        option.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        setTempCharacter(
                          option.id
                        );
                        setTempImage("");
                      }}
                      title={option.name}
                    >
                      <span>
                        {option.emoji}
                      </span>

                      {tempCharacter ===
                        option.id && (
                        <div className="ai-option-check">
                          <Check size={11} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* UPLOAD */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageUpload
                  }
                  style={{
                    display: "none",
                  }}
                />

                <button
                  className="ai-upload-button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <Upload size={17} />

                  <span>
                    {tempImage
                      ? "Change AI Image"
                      : "Upload Your Own AI Image"}
                  </span>
                </button>

                {tempImage && (
                  <button
                    className="ai-remove-image"
                    onClick={() =>
                      setTempImage("")
                    }
                  >
                    Remove uploaded image
                  </button>
                )}

                {/* SAVE */}
                <button
                  className="ai-save-button"
                  onClick={
                    saveCustomization
                  }
                >
                  <Check size={18} />
                  Save AI
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default AIChat;
