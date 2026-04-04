'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getSitemapData, SitemapUrl } from '@/lib/data';
import styles from './analyze.module.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    status?: string;
}

const Icons = {
    AI: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /><path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2z" /><path d="M12 7l-1 2h2zM12 17l-1-2h2zM7 12l2-1v2zM17 12l-2-1v2z" /></svg>
    ),
    Send: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polyline points="22 2 15 22 11 13 2 9 22 2" /></svg>
    ),
    ArrowLeft: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
    ),
    User: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
    Sparkles: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
    )
};

export default function AnalyzePage() {
    const [data, setData] = useState<SitemapUrl[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [status, setStatus] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Ensure theme is set for CSS variables in globals.css
        document.documentElement.setAttribute('data-theme', 'dark');
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sitemapData = await getSitemapData();
                setData(sitemapData);
            } catch (err) {
                console.error('Failed to load sitemap:', err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isTyping || data.length === 0) return;

        const currentInput = input;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: currentInput };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        setStatus('Scanning sitemap data...');

        try {
            const dataSummary = data.map(item => ({
                path: item.path,
                type: item.type,
                priority: item.priority
            }));

            // Construct a prompt that includes history for multi-turn feel
            const historyContext = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
            const fullPrompt = historyContext
                ? `${historyContext}\nUser: ${currentInput}`
                : currentInput;

            setStatus('Seeking Marketing Specialist...');
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    sitemapData: dataSummary
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to analyze');
            }

            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: result.text };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${(err as Error).message}`
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            setStatus('');
        }
    };

    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i}>{line.substring(2)}</h1>;
            if (line.startsWith('## ')) return <h2 key={i}>{line.substring(3)}</h2>;
            if (line.startsWith('### ')) return <h3 key={i}>{line.substring(4)}</h3>;
            if (line.startsWith('- ')) return <li key={i}>{line.substring(2)}</li>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i}>{line}</p>;
        });
    };

    return (
        <main className={styles.chatContainer}>
            <header className={styles.chatHeader}>
                <Link href="/" className={styles.backBtn}>
                    <Icons.ArrowLeft />
                </Link>
                <div className={styles.headerInfo}>
                    <div className={styles.aiBadge}>
                        <Icons.AI />
                    </div>
                    <div className={styles.headerText}>
                        <h1>Marketing Brain</h1>
                        <p>{data.length} URLs context loaded</p>
                    </div>
                </div>
                <div className={styles.headerStatus}>
                    <Icons.Sparkles />
                    <span>Gemini Pro</span>
                </div>
            </header>

            <div className={styles.messageArea} ref={scrollRef}>
                <div className={styles.messageList}>
                    {messages.length === 0 && (
                        <div className={styles.welcomeState}>
                            <div className={styles.welcomeIcon}>✨</div>
                            <h2>Sitemap Intelligence</h2>
                            <p>Ask anything about the sitemap strategy, SEO gaps, or content opportunities.</p>
                            <div className={styles.suggestions}>
                                <button onClick={() => { setInput('Find high-priority content gaps'); }}>Find high-priority content gaps</button>
                                <button onClick={() => { setInput('Analyze site structure for SEO'); }}>Analyze site structure for SEO</button>
                                <button onClick={() => { setInput('Suggest new blog categories'); }}>Suggest new blog categories</button>
                            </div>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`${styles.messageWrapper} ${styles[msg.role]}`}
                            >
                                <div className={styles.avatar}>
                                    {msg.role === 'user' ? <Icons.User /> : <Icons.AI />}
                                </div>
                                <div className={styles.bubble}>
                                    <div className={styles.bubbleContent}>
                                        {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <div className={`${styles.messageWrapper} ${styles.assistant}`}>
                            <div className={styles.avatar}>
                                <Icons.AI />
                            </div>
                            <div className={styles.bubble}>
                                <div className={styles.typingIndicator}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <div className={styles.typingStatus}>{status}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <footer className={styles.inputArea}>
                <form onSubmit={handleSend} className={styles.inputWrapper}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your analysis instructions..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        rows={1}
                    />
                    <button type="submit" disabled={isTyping || !input.trim()} className={styles.sendBtn}>
                        <Icons.Send />
                    </button>
                </form>
                <div className={styles.inputNote}>
                    Shift + Enter for new line • AI can make mistakes
                </div>
            </footer>
        </main>
    );
}
