'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getSitemapData, getBaseUrl, slugToLabel, SitemapUrl } from '@/lib/data';
import styles from './page.module.css';

// SVG Icons
const Icons = {
  Product: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
  ),
  Blog: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
  ),
  Collection: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10h10V2z" /><path d="M22 2h-6v10h6V2z" /><path d="M12 14H2v8h10v-8z" /><path d="M22 14h-6v8h6v-8z" /></svg>
  ),
  Page: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
  ),
  Chevron: ({ rotated }: { rotated?: boolean }) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: rotated ? 'rotate(90deg)' : 'rotate(0)' }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Theme: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
  ),
  AI: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /><path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2z" /><path d="M12 7l-1 2h2zM12 17l-1-2h2zM7 12l2-1v2zM17 12l-2-1v2z" /></svg>
  ),
  Terminal: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polyline points="22 2 15 22 11 13 2 9 22 2" /></svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
  )
};

const leafIcon = (type: SitemapUrl['type']) => {
  switch (type) {
    case 'product': return <Icons.Product />;
    case 'blog': return <Icons.Blog />;
    case 'collection': return <Icons.Collection />;
    default: return <Icons.Page />;
  }
};

const priorityClass = (p: number) => {
  if (p >= 0.8) return styles.priorityHigh;
  if (p >= 0.6) return styles.priorityMid;
  return styles.priorityLow;
};

export default function Home() {
  const [data, setData] = useState<SitemapUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'product' | 'blog' | 'collection' | 'page'>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    collections: true,
    products: true,
    blogs: true,
    pages: true
  });

  const [hoveredUrl, setHoveredUrl] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sitemapData = await getSitemapData();
        setData(sitemapData);
      } catch (err) {
        console.error('Failed to load sitemap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.path.toLowerCase().includes(search.toLowerCase()) ||
        slugToLabel(item.path, item.type).toLowerCase().includes(search.toLowerCase());
      const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [data, search, activeFilter]);

  const stats = useMemo(() => {
    return {
      products: data.filter(u => u.type === 'product').length,
      blogs: data.filter(u => u.type === 'blog').length,
      collections: data.filter(u => u.type === 'collection').length,
      pages: data.filter(u => u.type === 'page').length,
    };
  }, [data]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAll = (expand: boolean) => {
    setExpandedSections({
      collections: expand,
      products: expand,
      blogs: expand,
      pages: expand
    });
  };

  const renderSection = (title: string, type: SitemapUrl['type'], items: SitemapUrl[]) => {
    if (items.length === 0) return null;
    const isExpanded = expandedSections[title.toLowerCase()];

    return (
      <motion.div
        layout="position"
        className={styles.section}
        key={title}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={`${styles.sectionHeader} ${styles[type]}`}
          onClick={() => toggleSection(title.toLowerCase())}
        >
          <Icons.Chevron rotated={isExpanded} />
          <span className={styles.sectionTitle}>{title}</span>
          <span className={styles.countBadge}>{items.length}</span>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className={styles.grid}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {items.map((item, idx) => (
                <motion.a
                  key={item.path}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.01 }}
                  href={getBaseUrl() + item.path}
                  target="_blank"
                  rel="noopener"
                  className={`${styles.leaf} ${styles[item.type]}`}
                  onMouseEnter={() => setHoveredUrl(getBaseUrl() + item.path)}
                  onMouseLeave={() => setHoveredUrl(null)}
                >
                  <div className={styles.leafMain}>
                    <div className={styles.leafIcon}>{leafIcon(item.type)}</div>
                    <div className={styles.leafContent}>
                      <span className={styles.leafLabel}>{slugToLabel(item.path, item.type)}</span>
                      <span className={styles.leafPath}>{item.path}</span>
                    </div>
                  </div>
                  <div className={styles.leafFooter}>
                    <span className={styles.typeTag}>{item.type}</span>
                    <div className={`${styles.priorityDot} ${priorityClass(item.priority)}`} />
                  </div>
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brand}>
            <div className={styles.logo}>IDMS Group 8</div>
            <div className={styles.brandSub}>/ sitemap explorer</div>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: 'var(--accent)' }}>{stats.products}</span>
              <span className={styles.statLabel}>Products</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: 'var(--accent3)' }}>{stats.blogs}</span>
              <span className={styles.statLabel}>Blogs</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: 'var(--accent2)' }}>{stats.collections}</span>
              <span className={styles.statLabel}>Collections</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: 'var(--accent4)' }}>{stats.pages}</span>
              <span className={styles.statLabel}>Pages</span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <Link
              className={styles.aiBtn}
              href="/analyze"
            >
              <Icons.AI /> AI Analyse
            </Link>
            <button
              className={styles.themeToggle}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle Theme"
            >
              <Icons.Theme />
            </button>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <Icons.Search />
            <input
              type="text"
              placeholder="Search URLs or names..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterRow}>
            {(['all', 'collection', 'product', 'blog', 'page'] as const).map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${activeFilter === f ? styles.active : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}s
              </button>
            ))}
          </div>

          <div className={styles.expandControls}>
            <button onClick={() => toggleAll(true)}>Expand All</button>
            <div className={styles.divider} />
            <button onClick={() => toggleAll(false)}>Collapse All</button>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loader}>
            <div className={styles.spinner} />
            <p>Scanning Sitemap...</p>
          </div>
        ) : (
          <>
            <div className={styles.homeSection}>
              <a
                href={getBaseUrl() + '/'}
                target="_blank"
                rel="noopener"
                className={styles.rootNode}
                onMouseEnter={() => setHoveredUrl(getBaseUrl() + '/')}
                onMouseLeave={() => setHoveredUrl(null)}
              >
                🏠 superyou.in <span className={styles.rootBadge}>ROOT</span>
              </a>
            </div>

            <motion.div className={styles.tree}>
              <AnimatePresence mode="popLayout" initial={false}>
                {renderSection('Collections', 'collection', filteredData.filter(i => i.type === 'collection'))}
                {renderSection('Products', 'product', filteredData.filter(i => i.type === 'product'))}
                {renderSection('Blogs', 'blog', filteredData.filter(i => i.type === 'blog'))}
                {renderSection('Pages', 'page', filteredData.filter(i => i.type === 'page'))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>

      <div className={`${styles.tooltip} ${hoveredUrl ? styles.visible : ''}`}>
        {hoveredUrl}
      </div>

      <footer className={styles.footer}>
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
    </main>
  );
}
