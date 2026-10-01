import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  RefreshCw,
  User,
  Check,
  Copy,
  Wifi,
  HelpCircle,
} from "lucide-react";
import { askAiSupport, ChatMessage } from "../services/gemini";
import { Customer } from "../types";
import { Language, translations } from "../translations";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentCustomer?: Customer | null;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentCustomer,
}) => {
  const t = translations[lang];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text:
        lang === "id"
          ? `Halo! Saya NetLancar AI Bot, asisten cerdas ISP & RT/RW Net Anda.
Ada yang bisa saya bantu terkait cek tagihan, troubleshooting koneksi WiFi/ONT, atau panduan teknis jaringan?`
          : `Hello! I am NetLancar AI Bot, your intelligent ISP & RT/RW Net assistant.
How can I help you today with billing inquiries, WiFi/ONT troubleshooting, or network technical guides?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const quickPrompts =
    lang === "id"
      ? [
          "Lampu LOS di modem berkedip merah",
          "Koneksi internet terasa lambat",
          "Bagaimana cara bayar via QRIS & VA?",
          "Berapa rincian alokasi bandwidth QoS?",
        ]
      : [
          "Modem LOS red light is blinking",
          "Internet connection feels slow",
          "How to pay via QRIS & Virtual Account?",
          "Explain QoS bandwidth allocation formula",
        ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const botReply = await askAiSupport(query, messages, currentCustomer);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div
        id="ai-support-modal"
        className="w-full max-w-lg h-[620px] max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t.aiAssistantTitle}
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentCustomer
                  ? `Konteks: ${currentCustomer.name} (${currentCustomer.pppoeUsername})`
                  : "Dukungan AI Jaringan & Billing 24/7"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                m.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs ${
                  m.sender === "user"
                    ? "bg-slate-700 dark:bg-slate-600"
                    : "bg-indigo-600 shadow-xs"
                }`}
              >
                {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`group relative max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.sender === "user" ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {m.timestamp}
                </div>

                {m.sender === "bot" && (
                  <button
                    onClick={() => handleCopy(m.id, m.text)}
                    className="absolute -bottom-2 right-2 hidden group-hover:flex items-center gap-1 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-xs"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs py-2">
              <Bot className="w-4 h-4 text-indigo-500 animate-spin" />
              <span>{t.aiThinking}</span>
            </div>
          )}
        </div>

        {/* Quick Question Prompts */}
        <div className="px-3 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-slate-400 shrink-0 font-medium">{t.quickQuestions}</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="shrink-0 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
          <input
            id="ai-modal-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t.aiInputPlaceholder}
            className="flex-1 py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            id="ai-modal-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
