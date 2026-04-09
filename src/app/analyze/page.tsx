'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { getSitemapData, SitemapUrl } from '@/lib/data';
import styles from './analyze.module.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
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

            const historyContext = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
            const fullPrompt = historyContext
                ? `${historyContext}\nUser: ${currentInput}`
                : currentInput;

            setStatus('Consulting Marketing Intelligence...');
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
                content: `**Error:** ${(err as Error).message}`
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            setStatus('');
        }
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
                        <h1>AI Growth Consultant</h1>
                        <p>{data.length > 0 ? `${data.length} URLs loaded` : 'Loading sitemap...'}</p>
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
                            <div className={styles.welcomeIcon}>📈</div>
                            <h2>Growth Intelligence</h2>
                            <p>Identify missing high-conversion pages, funnel leaks, and quick revenue wins.</p>
                            <div className={styles.suggestions}>
                                <button onClick={() => setInput('Analyze site for growth opportunities')}>Analyze site for growth opportunities</button>
                                <button onClick={() => setInput('Identify funnel leaks')}>Identify funnel leaks</button>
                                <button onClick={() => setInput('Suggest quick revenue wins')}>Suggest quick revenue wins</button>
                            </div>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`${styles.messageWrapper} ${styles[msg.role]}`}
                            >
                                <div className={styles.avatar}>
                                    {msg.role === 'user' ? <Icons.User /> : <Icons.AI />}
                                </div>
                                <div className={styles.bubble}>
                                    <div className={styles.bubbleContent}>
                                        {msg.role === 'user' ? (
                                            <p>{msg.content}</p>
                                        ) : (
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`${styles.messageWrapper} ${styles.assistant}`}
                        >
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
                        </motion.div>
                    )}

                    <footer className={styles.chatScrollFooter}>
                        <div className={styles.footerBrand}>© 2026 superyou.in • IDMS Group 8</div>
                        <div className={styles.contributors}>
                            <span className={styles.builtBy}>Built by:</span>
                            <a href="mailto:ibrahim.khalil_ug25@ashoka.edu.in">Ibrahim Khalil</a>,{' '}
                            <a href="mailto:ananya.karel_ug25@ashoka.edu.in">Ananya Karel</a>,{' '}
                            <a href="mailto:gaurika.bhanot_ug25@ashoka.edu.in">Gaurika Bhanot</a>,{' '}
                            <a href="mailto:roshan.pathak_ug25@ashoka.edu.in">Roshan Pathak</a>,{' '}
                            <a href="mailto:yashvi.mehta_ug2024@ashoka.edu.in">Yashvi Mehta</a>,{' '}
                            <a href="mailto:abhijith.menon_ug2024@ashoka.edu.in">Abhijith Menon</a>,{' '}
                            <a href="mailto:manya.jindal_ug2024@ashoka.edu.in">Manya Jindal</a>,{' '}
                            <a href="mailto:aneesh.dasgupta_ug2024@ashoka.edu.in">Aneesh Dasgupta</a>
                        </div>
                    </footer>
                </div>
            </div>

            <footer className={styles.inputArea}>
                <form onSubmit={handleSend} className={styles.inputWrapper}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={data.length === 0 ? 'Loading growth context...' : 'Ask about funnel leaks, revenue wins, strategy...'}
                        disabled={data.length === 0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        rows={1}
                    />
                    <button type="submit" disabled={isTyping || !input.trim() || data.length === 0} className={styles.sendBtn}>
                        <Icons.Send />
                    </button>
                </form>
                <div className={styles.inputNote}>
                    Shift + Enter for new line • AI Growth Consultant
                </div>
            </footer>
        </main>
    );
}
