import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, AlertCircle, Sparkles, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { MarkdownRenderer } from './MarkdownRenderer.jsx';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';

export function Chat({ activeDocument }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedDocIndex, setExpandedDocIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customMessage) => {
    const textToSend = typeof customMessage === 'string' ? customMessage : query;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: textToSend.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat?message=${encodeURIComponent(textToSend.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to get answer.');
      }

      const assistantMessage = {
        role: 'assistant',
        content: data.message || 'No response returned from the model.',
        docs: Array.isArray(data.docs) ? data.docs : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[Chat Error]:', err);
      setError(err.message || 'Unable to connect to the backend server.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleDocExpand = (id) => {
    setExpandedDocIndex(expandedDocIndex === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-6.5rem)] min-h-[500px]">
      {/* Panel header */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Document Assistant
            </h2>
            <p className="text-[11px] text-slate-500">
              {activeDocument
                ? `Querying context from "${activeDocument}"`
                : 'Answers grounded in your uploaded PDF documents'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-6">
            <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Ask anything about your document
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Upload a PDF on the left panel, then ask questions. The assistant
              will retrieve relevant sections and formulate answers using Gemini.
            </p>

            {/* Quick Prompts */}
            <div className="w-full mt-6 space-y-2">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider text-left">
                Suggested questions:
              </p>
              {[
                'Can you provide a summary of this document?',
                'What are the key findings or takeaways?',
                'Explain the main methodology mentioned.',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 text-xs text-slate-700 transition-colors duration-150 flex items-center justify-between"
                >
                  <span>{suggestion}</span>
                  <span className="text-slate-400 text-[10px]">↵</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div className="flex flex-col gap-2 max-w-[85%]">
                <div
                  className={`p-3.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <>
                      <MarkdownRenderer content={msg.content} />
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                          AI Response
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.content, index)}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors px-2 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer"
                          title="Copy response"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-medium text-[11px]">
                                Copied!
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span className="text-[11px] font-medium">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {/* Source document citations if returned */}
                {msg.role === 'assistant' && msg.docs && msg.docs.length > 0 && (
                  <div className="mt-1 space-y-1.5">
                    <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-indigo-500" />
                      Retrieved Context ({msg.docs.length} chunks)
                    </p>
                    <div className="space-y-1">
                      {msg.docs.map((doc, docIdx) => {
                        const isExpanded = expandedDocIndex === `${index}-${docIdx}`;
                        const snippet = doc.pageContent || '';
                        const pageNum = doc.metadata?.loc?.pageNumber;

                        return (
                          <div
                            key={docIdx}
                            className="bg-slate-50/80 border border-slate-200 rounded-lg text-xs overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleDocExpand(`${index}-${docIdx}`)}
                              className="w-full px-2.5 py-1.5 flex items-center justify-between text-left text-slate-600 hover:bg-slate-100/60"
                            >
                              <span className="font-medium text-[11px] truncate">
                                Excerpt {docIdx + 1}{' '}
                                {pageNum ? `(Page ${pageNum})` : ''}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="px-2.5 pb-2 text-[11px] text-slate-600 bg-white border-t border-slate-100 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                {snippet}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="h-7 w-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading typing bubble */}
        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto justify-start">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl rounded-bl-none p-3.5 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></div>
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse delay-75"></div>
              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse delay-150"></div>
              <span className="text-xs text-slate-400 ml-2">Searching document...</span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 md:p-4 border-t border-slate-200 bg-white rounded-b-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the document..."
            disabled={loading}
            className="flex-1 h-10 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 transition-colors"
          />
          <Button
            type="submit"
            disabled={!query.trim() || loading}
            loading={loading}
            className="h-10 px-4 shrink-0"
          >
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
