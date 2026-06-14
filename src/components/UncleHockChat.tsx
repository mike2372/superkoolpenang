import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User, Flame, Droplet, Zap, AlertTriangle, RefreshCw } from "lucide-react";
import { ChatMessage } from "../types";

interface UncleHockChatProps {
  onClose?: () => void;
  onSuggestionClick?: (type: string) => void;
}

const PRESETS = [
  { label: "💧 Water Dripping", prompt: "Ayo Uncle Hock, my bedroom aircon is leaking water until whole floor wet! Help, what to do?" },
  { label: "🔥 Blowing Warm Air", prompt: "Uncle Hock, my aircon turned on already but only blowing fan warm air-lah, not cold at all!" },
  { label: "⚡ Green Light Blinking", prompt: "Hello Uncle Hock, light is blinking blinking on my unit, then it suddenly shut down. What happen?" },
  { label: "💨 Smalls Like Vinegar", prompt: "Uncle Hock, why my aircon start up always got sour bad smell? Like old socks!" },
];

export default function UncleHockChat({ onClose }: UncleHockChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "bot",
      text: "Wey! Hello boss! Welcome to SuperCool Penang diagnostics. I am Uncle Hock. Aircon having headache is it? Leaking water, or blowing hot wind? Tell me, I check for you! 🛠️",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "bot",
        text: data.reply || data.error || "Aiyo, line bit slow-lah. Can you say that again?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "bot",
        text: "Wah! Uncle must be in a concrete room servicing condenser, signal lost! Let me try climbing down the ladder-lah. Send me a message again in a short while!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-slate-150 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-700 to-teal-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center font-bold text-gray-900 text-sm overflow-hidden">
              👴🏻
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base tracking-tight flex items-center gap-1.5">
              Uncle Hock <span className="text-xs bg-teal-500 text-teal-50 px-1.5 py-0.5 rounded-full font-normal">Active</span>
            </h3>
            <p className="text-xs text-blue-100 font-sans">Penangite service legend (30 yrs exp)</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
            id="chat-close-btn"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-0">
        <div className="text-center py-1">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase bg-slate-200/50 px-2 py-0.5 rounded-full">
            Local AI Diagnostic Support
          </span>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                msg.sender === "user" ? "bg-blue-600 text-white" : "bg-amber-400 text-slate-900"
              }`}
            >
              {msg.sender === "user" ? <User size={13} /> : "👴🏻"}
            </div>
            <div>
              <div
                className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm"
                }`}
              >
                {msg.text.split("\n").map((line, idx) => (
                  <p key={idx} className={idx > 0 ? "mt-1" : ""}>
                    {line}
                  </p>
                ))}
              </div>
              <span className={`text-[10px] text-slate-400 mt-1 block ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-2.5 max-w-[80%]">
            <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 text-xs shadow-sm">
              👴🏻
            </div>
            <div className="bg-white border border-slate-100 shadow-sm p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
              <span className="text-xs text-slate-500 italic">Uncle Hock is thinking on a ladder</span>
              <div className="flex gap-1 items-center ml-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Diagnostic Buttons */}
      <div className="p-2 border-t border-slate-100 bg-white">
        <p className="text-[10px] font-sans font-medium text-slate-400 px-2 mb-1.5">Common Penang Aircon Headache (Tap to Ask):</p>
        <div className="flex flex-wrap gap-1.5 px-1 pb-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSendMessage(p.prompt)}
              className="text-xs font-sans px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg hover:text-slate-900 transition-all border border-slate-150 active:bg-blue-50 active:border-blue-200"
              disabled={isTyping}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2 items-center"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Uncle Hock e.g., Daikin blinking lamp..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-800 disabled:opacity-50"
          disabled={isTyping}
          maxLength={500}
          id="chat-text-input"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-300 disabled:text-slate-500"
          disabled={!inputValue.trim() || isTyping}
          id="chat-send-btn"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
