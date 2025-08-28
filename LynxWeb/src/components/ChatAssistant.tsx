import React, { useState, useEffect, useRef } from 'react';
import './ChatAssistant.css';

const ChatAssistant: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastSelector, setLastSelector] = useState<string | null>(null);

  useEffect(() => {
    return () => removeHighlights();
  }, []);

  const removeHighlights = () => {
    document.querySelectorAll('.chat-ai-highlight').forEach((el) => {
      el.classList.remove('chat-ai-highlight');
    });
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = (el?: HTMLTextAreaElement | null) => {
    const ta = el ?? textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const max = Math.floor(window.innerHeight * 0.45);
    const desired = Math.min(ta.scrollHeight, max);
    ta.style.height = desired + 'px';
  };

  const highlightSelector = (selector: string) => {
    removeHighlights();
    let els: Element[] = [];
    try {
      els = Array.from(document.querySelectorAll(selector));
    } catch (e) {
      setMessage(`Invalid selector: ${selector}`);
      return;
    }
    if (!els.length || (selector.trim() === 'body' && els.length === 1 && els[0] === document.body)) {
      setMessage(`No elements found for selector: ${selector}`);
      setLastSelector(null);
      return;
    }
    els.forEach((el, i) => {
      (el as HTMLElement).classList.add('chat-ai-highlight');
      if (i === 0) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    setMessage(`Found ${els.length} element(s).`);
    setLastSelector(selector);
  };

  const parseSelectorFromAi = (text: string): string | null => {
    try {
      const j = JSON.parse(text);
      if (j && typeof j.selector === 'string') return j.selector;
    } catch (_){ }
    const m = text.match(/selector\s*[:=]\s*(['"]?)([^'"\n]+)\1/i);
    if (m) return m[2].trim();
    const fenced = text.replace(/(^```\w*|```$)/g, '').trim();
    if (fenced && fenced.length < 200) return fenced;
    return null;
  };

  const callAiSdk = async (userQuery: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const mod: any = await import('openai');
      const OpenAI = mod.default ?? mod.OpenAI ?? mod;
      const client: any = new OpenAI({ 
        apiKey, 
        dangerouslyAllowBrowser: true
      });
      
      const resp = await client.chat.completions.create({ 
        model: 'gpt-4o-mini', 
        messages: [{ 
          role: 'user', 
          content: `Provide a CSS selector to find elements described: "${userQuery}". Respond ONLY with JSON {"selector":"...","explanation":"..."}.` 
        }], 
        max_tokens: 200 
      });
      
      const aiRespText = resp?.choices?.[0]?.message?.content;
      if (!aiRespText) throw new Error('No response from OpenAI');
      return aiRespText;
    } catch (err) {
      return JSON.stringify({ selector: 'body', explanation: 'Could not reach AI SDK' });
    } finally {
      setLoading(false);
    }
  };

  const onFind = async () => {
    if (!query.trim()) {
      setMessage('Please describe the element to find.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const aiText = await callAiSdk(query);
      const selector = parseSelectorFromAi(aiText || '') || null;
      if (!selector) {
        setMessage('AI did not return a selector. Response: ' + aiText);
        setLastSelector(null);
        setLoading(false);
        return;
      }
      const cleanSelector = selector.replace(/:contains\(([^)]+)\)/gi, '*:has-text($1)');
      highlightSelector(cleanSelector);
    } catch (e: any) {
      setMessage('Failed to find elements: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        textareaRef.current?.focus();
        resizeTextarea();
      }, 40);
    }
  }, [open]);

  return (
    <div className={`chat-assistant-root ${open ? 'open' : ''}`}>
      <button className={`chat-fab ${open ? 'active' : ''}`} onClick={() => setOpen((v) => !v)} aria-label="Open assistant">
        🤖
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chat assistant panel">
          <div className="chat-header">
            <strong>Navigation Assistant</strong>
            <button className="close" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="chat-body">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); resizeTextarea(e.target); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onFind();
                }
              }}
              placeholder="e.g. the 'Save' button in the header"
            />
            <div className="chat-actions">
              <button onClick={onFind} disabled={loading}>{loading ? 'Searching…' : 'Find'}</button>
              <button onClick={() => { setQuery(''); setMessage(null); removeHighlights(); setLastSelector(null); }}>Clear</button>
            </div>
            {message && <div className="chat-message">{message}</div>}
            {lastSelector && <div className="chat-result">Last selector: <code>{lastSelector}</code></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
