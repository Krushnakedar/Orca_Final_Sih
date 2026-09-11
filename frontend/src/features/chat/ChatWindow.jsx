import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  Compass,
  Fish,
  Waves,
  ArrowRight,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Scale,
} from "lucide-react";
import { chatService } from "../../services/chatService";
import AgentTraceViewer from "./AgentTraceViewer";
import EvidenceDrawer from "../explainability/EvidenceDrawer";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useLanguage } from "../../context/LanguageContext";

const SECTORS = [
  { name: "Mumbai Coast", lat: 18.922, lon: 72.8347 },
  { name: "Kochi Harbor", lat: 9.9312, lon: 76.2673 },
  { name: "Chennai Offshore", lat: 13.0827, lon: 80.2707 },
  { name: "Visakhapatnam", lat: 17.6868, lon: 83.2185 },
  { name: "Porbandar", lat: 21.6417, lon: 69.6293 },
];

export default function ChatWindow() {
  const { language, t, speakText, stopSpeaking, isSpeaking } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [conversationId, setConversationId] = useState(
    () => `conv_${Date.now()}`,
  );
  const messagesEndRef = useRef(null);

  const getLocalizedSuggestions = () => {
    if (language === "hi") {
      return [
        "क्या कल सुबह मुंबई के पास मछली पकड़ने जाना सुरक्षित है?",
        "निकटतम संभावित मछली पकड़ने का क्षेत्र (PFZ) कहाँ है?",
        "वर्तमान समुद्री मौसम और लहरों की स्थिति बताएं।",
        "कोच्चि बंदरगाह पर समुद्र की स्थिति कैसी है?",
      ];
    }
    if (language === "mr") {
      return [
        "उद्या सकाळी मुंबईजवळ मासेमारी करणे सुरक्षित आहे का?",
        "जवळचे संभाव्य मासेमारी क्षेत्र (PFZ) कुठे आहे?",
        "सध्याच्या हवामानाचा व लाटांचा अंदाज काय आहे?",
        "कोची बंदरावर समुद्राची स्थिती कशी आहे?",
      ];
    }
    return [
      "Is it safe to go fishing tomorrow morning near Mumbai?",
      "Where is the nearest potentially favourable fishing zone?",
      "Explain the current marine weather advisory.",
      "What are the wave conditions at Kochi Harbor?",
    ];
  };

  const suggestions = getLocalizedSuggestions();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Voice speech recognition is not supported on this browser. Please use Chrome or Edge.",
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    if (language === "hi") recognition.lang = "hi-IN";
    else if (language === "mr") recognition.lang = "mr-IN";
    else if (language === "ta") recognition.lang = "ta-IN";
    else if (language === "ml") recognition.lang = "ml-IN";
    else if (language === "gu") recognition.lang = "gu-IN";
    else recognition.lang = "en-IN";

    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputPrompt(transcript);
      setIsListening(false);
      handleSendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSendMessage = async (queryText = inputPrompt) => {
    const text = queryText.trim();
    if (!text || loading) return;

    setInputPrompt("");
    const userMsg = {
      id: `msg_u_${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatService.sendMessage(
        text,
        {
          sectorName: selectedSector.name,
          lat: selectedSector.lat,
          lon: selectedSector.lon,
        },
        conversationId,
        language,
      );

      if (res.aiResponse) {
        setMessages((prev) => [...prev, res.aiResponse]);
      }
    } catch (err) {
      const errorMsg = {
        id: `msg_err_${Date.now()}`,
        sender: "ai",
        text: `**Query Processing Notice:** Could not complete the marine intelligence query. (${err.message || "Network error"})`,
        intent: "ERROR",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = async () => {
    try {
      await chatService.resetSession(conversationId);
    } finally {
      setMessages([]);
      setConversationId(`conv_${Date.now()}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[740px] rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-2xl overflow-hidden">
      {/* Chat Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ocean-500 to-tealAccent-500 flex items-center justify-center text-slate-950 shadow-md">
            <Bot className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">
                {t("aiAssistant", "ORCA Marine Intelligence Assistant")}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              English • हिन्दी • मराठी • தமிழ் • മലയാളം • ગુજરાતી
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-ocean-400" />
            <label htmlFor="chat-sector" className="sr-only">
              Select sector
            </label>
            <select
              id="chat-sector"
              value={selectedSector.name}
              onChange={(e) => {
                const sec =
                  SECTORS.find((s) => s.name === e.target.value) || SECTORS[0];
                setSelectedSector(sec);
              }}
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {SECTORS.map((s) => (
                <option
                  key={s.name}
                  value={s.name}
                  className="bg-slate-900 text-slate-100"
                >
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleResetChat}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
            title="Reset Conversation"
            aria-label="Reset conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message List Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ocean-500/20 to-tealAccent-500/20 border border-ocean-800/60 flex items-center justify-center text-ocean-400 shadow-xl">
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100">
                {t("aiAssistant", "Conversational Marine Safety Assistant")}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t(
                  "askAiPlaceholder",
                  "Ask operational questions regarding fishing voyage safety, PFZ locations, weather alerts, or lower-risk routing.",
                )}
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {t("suggestedPrompts", "Suggested Operational Prompts")}:
              </span>
              <div className="space-y-1.5 text-left">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sug)}
                    className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between transition hover:border-ocean-600 group"
                  >
                    <span>💬 {sug}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-ocean-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ocean-500 to-tealAccent-500 flex items-center justify-center text-slate-950 shrink-0 shadow-md mt-1">
                  <Bot className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-lg ${
                  msg.sender === "user"
                    ? "bg-ocean-600 text-white rounded-tr-none"
                    : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none"
                }`}
              >
                {msg.sender === "user" ? (
                  <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                ) : (
                  <div>
                    {/* Voice Read Aloud Speaker Button for Artisanal Fishermen */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        Language:{" "}
                        <strong>
                          {(msg.language || language).toUpperCase()}
                        </strong>
                      </span>
                      <button
                        onClick={() =>
                          isSpeaking
                            ? stopSpeaking()
                            : speakText(msg.text, msg.language || language)
                        }
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-tealAccent-300 text-[10px] font-semibold flex items-center gap-1 transition"
                        aria-label={
                          isSpeaking
                            ? "Stop voice playback"
                            : "Read response aloud"
                        }
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-tealAccent-400" />
                        )}
                        <span>
                          {isSpeaking
                            ? t("stopReading", "Stop Voice")
                            : t("readAloud", "Read Aloud")}
                        </span>
                      </button>
                    </div>

                    {/* Rich Markdown Output Render */}
                    <div className="prose prose-invert prose-xs max-w-none space-y-2.5 font-sans">
                      {msg.text.split("\n\n").map((para, pIdx) => {
                        if (para.startsWith("### ")) {
                          return (
                            <h3
                              key={pIdx}
                              className="text-sm font-bold text-white"
                            >
                              {para.replace("### ", "")}
                            </h3>
                          );
                        }
                        if (para.startsWith("#### ")) {
                          return (
                            <h4
                              key={pIdx}
                              className="text-xs font-bold text-tealAccent-400 mt-2"
                            >
                              {para.replace("#### ", "")}
                            </h4>
                          );
                        }
                        if (para.startsWith("> ")) {
                          return (
                            <blockquote
                              key={pIdx}
                              className="p-2.5 rounded-lg bg-slate-950 border-l-2 border-ocean-500 text-[11px] text-slate-400 italic"
                            >
                              {para.replace("> ", "")}
                            </blockquote>
                          );
                        }
                        return (
                          <div
                            key={pIdx}
                            className="text-slate-300 leading-relaxed"
                          >
                            {para.split("\n").map((line, lIdx) => (
                              <div
                                key={lIdx}
                                className={
                                  line.startsWith("- ") ? "pl-2 py-0.5" : ""
                                }
                              >
                                {line}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    {/* Evidence & Explainability Drawer */}
                    {msg.explainabilityPackage && (
                      <EvidenceDrawer
                        explainabilityPackage={msg.explainabilityPackage}
                      />
                    )}

                    {/* Agent Thought & Execution Trace Component */}
                    {msg.trace && (
                      <AgentTraceViewer
                        trace={msg.trace}
                        totalExecutionTimeMs={msg.totalExecutionTimeMs}
                        evidence={msg.evidence}
                        plan={msg.plan}
                      />
                    )}
                  </div>
                )}

                <div className="text-[10px] text-right opacity-60 font-mono pt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 shadow-md mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ocean-500 to-tealAccent-500 flex items-center justify-center text-slate-950 shrink-0 shadow-md">
              <Bot className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-ocean-400">
                  Analyzing marine conditions
                </span>{" "}
                in {language.toUpperCase()}...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips Bar */}
      {messages.length > 0 && (
        <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-semibold shrink-0">
            {t("suggestedPrompts", "Suggestions")}:
          </span>
          {suggestions.slice(0, 3).map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sug)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap transition"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Controls with Voice STT Mic */}
      <div className="p-3.5 bg-slate-900/80 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? t("voiceListening", "Listening...")
                  : t("askAiPlaceholder", `Ask about ${selectedSector.name}...`)
              }
              className={`w-full pl-4 pr-12 py-3 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition ${
                isListening
                  ? "border-rose-500 ring-2 ring-rose-500/40 animate-pulse"
                  : "border-slate-800 focus:border-ocean-500"
              }`}
              disabled={loading}
              aria-label="Ask the marine assistant"
            />

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition ${
                isListening
                  ? "bg-rose-600 text-white animate-bounce"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
              }`}
              title="Voice Input (Speech-to-Text)"
              aria-label={
                isListening ? "Stop voice input" : "Start voice input"
              }
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="px-4 py-3 bg-gradient-to-r from-ocean-600 to-ocean-500 hover:from-ocean-500 hover:to-ocean-400 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-ocean-950/50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

        <div className="mt-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-tealAccent-400" />
          <span>
            {t(
              "disclaimer",
              "Decision Support Only • Verified Evidence • Zero Hallucination",
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
