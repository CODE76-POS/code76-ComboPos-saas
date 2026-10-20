import React, { useState, useRef, useEffect } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
  Star,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Gift,
  Calendar,
  MapPin,
  Lightbulb,
  PhoneCall,
  RotateCcw,
} from 'lucide-react';
import { ProductItem } from '../../types/index.ts';

interface ChatMessage {
  role: 'model' | 'user';
  text: string;
}

export interface InquiryLeadData {
  name: string;
  email: string;
  phone: string;
  location: string;
  preferredContact?: string;
  product: ProductItem;
  notes?: string;
}

interface AIChatbotWidgetProps {
  inquiryLead?: InquiryLeadData | null;
  isOpenControlled?: boolean;
  onCloseControlled?: () => void;
}

export const AIChatbotWidget: React.FC<AIChatbotWidgetProps> = ({
  inquiryLead,
  isOpenControlled,
  onCloseControlled,
}) => {
  const { products, company, reviews, settings, landingMetrics, setLandingMetrics } = usePOS();

  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : isOpenInternal;

  const handleOpen = () => {
    setIsOpenInternal(true);
  };

  const handleClose = () => {
    setIsOpenInternal(false);
    if (onCloseControlled) onCloseControlled();
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `Hello! 👋 Welcome to **${company.name}**.\n\nI am your AI Concierge & Commercial Advisor. Tell me about your business (e.g. supermarket, restaurant, hardware store, service agency) or what POS terminals and printers you are looking for, and I will recommend the best equipment bundle with live pricing!`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [enableThinking, setEnableThinking] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [referralFriendName, setReferralFriendName] = useState('');
  const [referralSubmitted, setReferralSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // When an inquiry lead arrives from the quote modal, trigger tailored psychological sales dialogue
  const handledLeadRef = useRef<string | null>(null);

  useEffect(() => {
    if (inquiryLead && inquiryLead.product) {
      const leadKey = `${inquiryLead.email}-${inquiryLead.product.id}`;
      if (handledLeadRef.current !== leadKey) {
        handledLeadRef.current = leadKey;
        setIsOpenInternal(true);

        const promoPrice = inquiryLead.product.isOnPromo
          ? inquiryLead.product.promoDiscountPrice || inquiryLead.product.sellingPrice
          : inquiryLead.product.sellingPrice;

        const isService = inquiryLead.product.type === 'service';

        const greeting = `Hello **${inquiryLead.name}**! 👋 Welcome! I have recorded your quote request for the **${inquiryLead.product.name}** (${inquiryLead.product.isOnPromo ? `🔥 Promotional Special: $${promoPrice.toFixed(2)}` : `$${promoPrice.toFixed(2)}`}).\n\n` +
          (isService
            ? `📅 **Book Priority On-Site Demo**: As this is an enterprise commercial service, would you like our deployment specialist to **book a 20-minute on-site installation appointment** at your location in **${inquiryLead.location || 'your area'}** this week?`
            : `🏢 **Close Order or Visit Showroom**: We have units in stock reserved for you. Would you like to **finalize your order with warranty protection**, or would you prefer to **visit our showroom** at **${company.address || 'CBD Showroom'}, ${company.location}** to test the terminal with live barcode scanning?`) +
          `\n\n💡 **Your Feedback**: What stood out to you most about this item, and are there any specific suggestions or workflow features that would make it even more perfect for your daily operations?`;

        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: greeting,
          },
        ]);

        if (inquiryLead.email) {
          setLeadCaptured(true);
        }
      }
    }
  }, [inquiryLead, company]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // Track bot conversation metric
    setLandingMetrics((prev) => ({
      ...prev,
      chatbotConversations: prev.chatbotConversations + 1,
    }));

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          posContext: {
            company,
            products,
            reviews: reviews.filter((r) => r.isApprovedForLanding),
          },
          visitorNeed: inquiryLead ? `Customer ${inquiryLead.name} inquired about ${inquiryLead.product.name} at location ${inquiryLead.location}` : undefined,
          enableThinking,
        }),
      });

      const data = await res.json();
      const botReply = data.reply || data.fallbackReply || 'I am ready to help you find the perfect POS solution!';
      setMessages((prev) => [...prev, { role: 'model', text: botReply }]);
    } catch (e) {
      console.error('Chatbot error:', e);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `Thank you for your inquiry! Our flagship **CODE76 Touch Terminal** ($599) and **Thermal Receipt Printer** ($129) are ready for dispatch with full 2-year warranty. Would you like our sales team to contact you with a formal quote or schedule an on-site visit?`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim()) return;

    setLeadCaptured(true);
    setLandingMetrics((prev) => ({
      ...prev,
      leadsCaptured: prev.leadsCaptured + 1,
    }));

    setMessages((prev) => [
      ...prev,
      {
        role: 'model',
        text: `Thank you! We have registered your contact (${leadEmail}). An executive commercial quote with special bulk pricing and direct warranty will be delivered within 15 minutes!`,
      },
    ]);
  };

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralFriendName.trim()) return;

    setReferralSubmitted(true);
    setLandingMetrics((prev) => ({
      ...prev,
      referralVisits: prev.referralVisits + 1,
    }));

    setMessages((prev) => [
      ...prev,
      {
        role: 'model',
        text: `🎉 Amazing! We have registered your personal referral for **${referralFriendName}**. When they purchase any POS hardware or service, you will both receive a **$50 credit or 10% cash discount**!`,
      },
    ]);
  };

  return (
    <>
      {/* Floating Toggle Button with Neon Accents */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-400 text-white shadow-[0_0_25px_rgba(20,184,166,0.5)] hover:shadow-[0_0_35px_rgba(20,184,166,0.7)] border-2 border-teal-300/40 flex items-center gap-3 transition-all hover:scale-105 cursor-pointer group active:scale-95"
          title="Open AI Sales Concierge & Product Advisor"
        >
          <div className="relative">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 absolute -top-1 -right-1 ring-2 ring-emerald-600 animate-ping" />
          </div>
          <div className="text-left hidden sm:block pr-1">
            <div className="text-xs font-black leading-tight flex items-center gap-1">
              <span>AI Sales Concierge</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            </div>
            <div className="text-[10px] text-emerald-100 opacity-95 leading-tight">
              Interactive pricing & closing deals
            </div>
          </div>
        </button>
      )}

      {/* Chat Window with Responsive Viewport Containment */}
      {isOpen && (
        <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[410px] max-w-[calc(100vw-24px)] h-[580px] max-h-[85vh] rounded-3xl bg-slate-900 border-2 border-teal-500/40 shadow-[0_0_40px_rgba(15,23,42,0.95)] flex flex-col overflow-hidden text-white animate-in slide-in-from-bottom-5 duration-200 backdrop-blur-md">
          {/* Header with Neon Accents */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-teal-800 via-slate-900 to-slate-900 border-b border-teal-500/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/25 text-teal-300 flex items-center justify-center border border-teal-400/50 font-bold shadow-[0_0_12px_rgba(20,184,166,0.3)]">
                <Bot className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <div className="text-xs font-black flex items-center gap-1.5 text-slate-100">
                  <span>CODE76 Sales Concierge</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                </div>
                <div className="text-[10px] text-teal-300 font-medium">Psychological Sales Intelligence</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setEnableThinking(!enableThinking)}
                title="Toggle High Thinking Mode"
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  enableThinking
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">Thinking</span>
              </button>

              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs scrollbar-thin">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-teal-600 text-white rounded-tr-xs shadow-md shadow-teal-600/20'
                      : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-teal-300 flex items-center justify-center shrink-0 border border-slate-700">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs italic">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-teal-400 animate-spin" />
                </div>
                <span>Analyzing catalog & calculating recommendations...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* PSYCHOLOGICAL SALES PERSUASION QUICK ACTION PILLS */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => handleSend('I want to book an on-site service appointment or live demo this week.')}
              className="px-2.5 py-1 rounded-full bg-teal-950/80 hover:bg-teal-900 text-[10px] text-teal-300 font-semibold whitespace-nowrap cursor-pointer border border-teal-700/60 flex items-center gap-1 shadow-xs"
            >
              <Calendar className="w-3 h-3" />
              Book Appointment
            </button>
            <button
              onClick={() => handleSend('Can I visit your showroom in person to test the touch terminal and receipt printers?')}
              className="px-2.5 py-1 rounded-full bg-sky-950/80 hover:bg-sky-900 text-[10px] text-sky-300 font-semibold whitespace-nowrap cursor-pointer border border-sky-700/60 flex items-center gap-1 shadow-xs"
            >
              <MapPin className="w-3 h-3" />
              Visit Showroom
            </button>
            <button
              onClick={() => handleSend('What features make this POS item stand out, and can we customize it for our store?')}
              className="px-2.5 py-1 rounded-full bg-amber-950/80 hover:bg-amber-900 text-[10px] text-amber-300 font-semibold whitespace-nowrap cursor-pointer border border-amber-700/60 flex items-center gap-1 shadow-xs"
            >
              <Lightbulb className="w-3 h-3" />
              Custom Suggestions
            </button>
            <button
              onClick={() => handleSend('Are there lighter or alternative budget-friendly items if I change my mind?')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold whitespace-nowrap cursor-pointer border border-slate-700 flex items-center gap-1 shadow-xs"
            >
              <RotateCcw className="w-3 h-3" />
              Alternative Options
            </button>
            <button
              onClick={() => handleSend('How can I refer a colleague, friend, or relative to earn the $50 bonus?')}
              className="px-2.5 py-1 rounded-full bg-purple-950/80 hover:bg-purple-900 text-[10px] text-purple-300 font-semibold whitespace-nowrap cursor-pointer border border-purple-700/60 flex items-center gap-1 shadow-xs"
            >
              <Gift className="w-3 h-3" />
              Refer Friend ($50)
            </button>
          </div>

          {/* Quick Lead capture box if not yet captured */}
          {!leadCaptured && (
            <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 shrink-0">
              <form onSubmit={handleLeadSubmit} className="flex gap-1.5">
                <input
                  type="email"
                  placeholder="Enter email to get formal PDF quote..."
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                >
                  Get Quote
                </button>
              </form>
            </div>
          )}

          {/* Referral Incentive Box */}
          {!referralSubmitted && (
            <div className="px-3 py-1.5 bg-gradient-to-r from-amber-950/70 to-purple-950/70 border-t border-slate-800 text-[11px] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 text-amber-300 text-[10px]">
                <Gift className="w-3.5 h-3.5" />
                <span className="font-semibold">Refer friend/colleague ($50):</span>
              </div>
              <form onSubmit={handleReferralSubmit} className="flex gap-1">
                <input
                  type="text"
                  placeholder="Friend's name or phone..."
                  value={referralFriendName}
                  onChange={(e) => setReferralFriendName(e.target.value)}
                  className="w-28 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-100"
                />
                <button
                  type="submit"
                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  Refer
                </button>
              </form>
            </div>
          )}

          {/* Message Input Field */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about POS hardware, appointment, discounts..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white transition cursor-pointer shadow-md shadow-teal-600/30 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
