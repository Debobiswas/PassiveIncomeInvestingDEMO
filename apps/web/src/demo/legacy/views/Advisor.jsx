import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { advisorMessages } from '../data/dummy';

const C = {
  hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
  accent: 'var(--accent)', subtle: 'var(--bg-subtle)', border: 'var(--border)',
};

const SUGGESTED = [
  'What ETFs match my yield target of 6%?',
  'How do I reach $1,000/mo passive income?',
  'Explain covered call ETFs in simple terms',
  'What is the difference between XDIV and VDY?',
];

const CANNED = {
  default: "Great question! Based on your portfolio and the passive income investing framework, I'd recommend focusing on high-quality dividend ETFs with a consistent distribution history. For your current situation, a blend of Canadian equity and covered-call ETFs can optimize yield while managing downside risk. Would you like me to run a more detailed analysis?",
  yield:   "To hit a 6%+ yield target, consider ZWB (6.94%) or HDIV (8.71%) balanced with XDIV (5.42%). Higher yield often comes with slightly higher MER. Shall I build a sample portfolio allocation?",
  income:  "To reach $1,000/month at your current yield of 4.82%, you'd need ~$249,000 invested. You're at $148,320 — roughly $100K to go. At your savings rate, you'd hit this in approximately 18–24 months. Want me to model different contribution scenarios?",
};

function MessageBubble({ msg }) {
  const isAI = msg.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className={`flex gap-3 group ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: isAI ? 'rgba(124,58,237,0.10)' : 'rgba(245,166,35,0.12)' }}>
        {isAI ? <Bot size={15} style={{ color: '#7C3AED' }} /> : <User size={15} style={{ color: C.accent }} />}
      </div>
      <div className={`max-w-[78%] space-y-1 ${isAI ? '' : 'items-end flex flex-col'}`}>
        <p className="text-[10px] font-medium mb-1" style={{ color: C.low }}>{isAI ? 'AI Advisor' : 'You'}</p>
        <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={isAI
            ? { background: '#fff', border: `1px solid ${C.border}`, color: C.hi, borderTopLeftRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
            : { background: 'rgba(245,166,35,0.10)', border: '1px solid rgba(245,166,35,0.25)', color: C.hi, borderTopRightRadius: 4 }
          }>
          {msg.typing
            ? <span className="flex gap-1 items-center h-4">
                {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: C.low, animationDelay: `${i*0.15}s` }} />)}
              </span>
            : msg.content}
        </div>
        {isAI && !msg.typing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pt-1">
            <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] cursor-pointer px-2 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" style={{ color: C.low }} aria-label={copied ? 'Copied to clipboard' : 'Copy message'}>
              <Copy size={10} />{copied ? 'Copied' : 'Copy'}
            </button>
            <button className="p-1.5 cursor-pointer rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" style={{ color: C.low }} aria-label="Helpful"><ThumbsUp size={11} /></button>
            <button className="p-1.5 cursor-pointer rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" style={{ color: C.low }} aria-label="Not helpful"><ThumbsDown size={11} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Advisor() {
  const [messages, setMessages] = useState(advisorMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '', typing: true }]);
    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      const response = lower.includes('yield') || lower.includes('6%') ? CANNED.yield
        : lower.includes('1,000') || lower.includes('1000') || lower.includes('income') ? CANNED.income
        : CANNED.default;
      setMessages(prev => [...prev.filter(m => !m.typing), { role: 'assistant', content: response }]);
      setLoading(false);
    }, 1400);
  };

  return (
    <div className="h-screen flex flex-col p-6 max-h-screen">
      {/* Header */}
      <div className="card rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.15)' }}>
            <Bot size={18} style={{ color: '#7C3AED' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-hi)' }}>Passive Income Advisor</p>
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>Online
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-low)' }}>Trained on passive income strategies · RAG-powered</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMessages(advisorMessages)}
            className="flex items-center gap-1.5 text-xs cursor-pointer px-3 py-1.5 rounded-xl card transition-all duration-200"
            style={{ color: 'var(--text-mid)' }}>
            <RefreshCw size={12} />Reset
          </button>
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-low)' }}>
            <Sparkles size={12} style={{ color: 'var(--accent)' }} />
            <span>Claude / GPT-4</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 mb-4">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              className="text-xs cursor-pointer rounded-xl px-3 py-2 text-left transition-all duration-200"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.35)'; e.currentTarget.style.color = 'var(--text-hi)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mid)'; }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); sendMessage(); }}
        className="card rounded-2xl p-2 flex items-center gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="Ask about ETFs, income strategies, portfolio rebalancing…"
          disabled={loading}
          className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
          style={{ color: 'var(--text-hi)' }} />
        <button type="submit" disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: 'var(--accent)' }}>
          <Send size={14} className="text-white" />
        </button>
      </form>
    </div>
  );
}
