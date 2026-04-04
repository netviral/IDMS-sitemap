/**
 * Visualizer Logic for IDMS Sitemap
 * Handles tree construction, filtering, and theme switching
 */

let SITE_DATA = { urls: [], baseUrl: '' };

function slugToLabel(slug) {
    if (!slug || slug === '/') return 'Home';
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function priorityClass(p) {
    if (p >= 0.8) return 'priority-high';
    if (p >= 0.6) return 'priority-mid';
    return 'priority-low';
}

function makeLeaf(path, type, label, priority) {
    const a = document.createElement('a');
    a.href = SITE_DATA.baseUrl + path;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = `leaf ${type}`;
    a.dataset.type = type;

    const icon = type === 'product' ? '📦' :
        type === 'blog' ? '📝' :
            type === 'collection' ? '📚' : '📄';

    a.innerHTML = `
    <div class="leaf-row">
      <div class="leaf-icon">${icon}</div>
      <div class="leaf-text">${label}</div>
    </div>
    <div class="leaf-meta">
      <span class="leaf-type-tag">${type}</span>
      <div class="priority-dot ${priorityClass(priority)}"></div>
    </div>
  `;

    a.addEventListener('mouseenter', () => showTooltip(SITE_DATA.baseUrl + path));
    a.addEventListener('mouseleave', hideTooltip);
    return a;
}

function makeSectionHeader(label, cls, count) {
    const div = document.createElement('div');
    div.className = `section-header ${cls}`;
    div.innerHTML = `<span class="chevron">▶</span> ${label} <span class="count-badge">${count}</span>`;
    return div;
}

function wrapBranchItem(child, type) {
    const item = document.createElement('div');
    item.className = 'branch-item';
    if (type) item.dataset.section = type;
    item.appendChild(child);
    return item;
}

function toggle(header, children) {
    const ch = header.querySelector('.chevron');
    const isCollapsed = children.classList.contains('collapsed');
    if (isCollapsed) {
        children.classList.remove('collapsed');
        ch.classList.add('open');
    } else {
        children.classList.add('collapsed');
        ch.classList.remove('open');
    }
}

const tooltip = document.getElementById('tooltip');
function showTooltip(text) {
    tooltip.textContent = text;
    tooltip.classList.add('visible');
}
function hideTooltip() {
    tooltip.classList.remove('visible');
}

// Build tree
async function buildTree() {
    const tree = document.getElementById('tree');
    tree.innerHTML = ''; // Clear previous

    const data = await window.loadSitemapData();
    SITE_DATA = data;
    const urls = data.urls;

    // Update Stats
    const prodCount = urls.filter(u => u.path.startsWith('/products/')).length;
    const blogCount = urls.filter(u => u.path.startsWith('/blogs/')).length;
    const colCount = urls.filter(u => u.path.startsWith('/collections/')).length;
    const pageCount = urls.filter(u => u.path.startsWith('/pages/')).length;

    document.getElementById('stat-products').textContent = prodCount;
    document.getElementById('stat-blogs').textContent = blogCount;
    document.getElementById('stat-collections').textContent = colCount;
    document.getElementById('stat-pages').textContent = pageCount;

    // Root Node
    const rootLink = document.createElement('a');
    rootLink.href = SITE_DATA.baseUrl + '/';
    rootLink.target = '_blank';
    rootLink.rel = 'noopener';
    rootLink.className = 'root-node';
    rootLink.innerHTML = `🏠 superyou.in <span class="badge">HOME</span>`;
    rootLink.addEventListener('mouseenter', () => showTooltip(SITE_DATA.baseUrl + '/'));
    rootLink.addEventListener('mouseleave', hideTooltip);
    tree.appendChild(rootLink);

    const rootBranch = document.createElement('div');
    rootBranch.className = 'branch';
    tree.appendChild(rootBranch);

    // ── COLLECTIONS ──────────────────────────────
    const collections = urls.filter(u => u.path.startsWith('/collections/')).map(u => u.path);
    const colHeader = makeSectionHeader('collections', 'collections', collections.length);
    const colChildren = document.createElement('div');
    colChildren.className = 'children branch collapsed';

    colHeader.addEventListener('click', () => toggle(colHeader, colChildren));

    collections.forEach(path => {
        const label = slugToLabel(path.replace('/collections/', ''));
        const entry = urls.find(u => u.path === path);
        const leaf = makeLeaf(path, 'collection', label, entry ? entry.priority : 0.64);
        colChildren.appendChild(wrapBranchItem(leaf, 'collections'));
    });

    const colItem = wrapBranchItem(colHeader, 'collections');
    colItem.appendChild(colChildren);
    rootBranch.appendChild(colItem);

    // ── PRODUCTS ─────────────────────────────────
    const products = urls.filter(u => u.path.startsWith('/products/')).map(u => u.path);
    const prodHeader = makeSectionHeader('products', 'products', products.length);
    const prodChildren = document.createElement('div');
    prodChildren.className = 'children branch collapsed';

    prodHeader.addEventListener('click', () => toggle(prodHeader, prodChildren));

    // Group products loosely
    const wafers = products.filter(p => p.includes('wafer') || p.includes('chips') || p.includes('minis') || p.includes('variety') || p.includes('assorted') || p.includes('travel'));
    const powders = products.filter(p => p.includes('protein-powder') || (p.includes('fermented-yeast-protein') && !p.includes('wafer')));
    const creatine = products.filter(p => p.includes('creatine'));
    const others = products.filter(p => !wafers.includes(p) && !powders.includes(p) && !creatine.includes(p));

    const groups = [
        { label: '🧇 Wafers & Snacks', items: [...new Set(wafers)] },
        { label: '🥤 Protein Powders', items: [...new Set(powders)] },
        { label: '⚡ Creatine', items: [...new Set(creatine)] },
        { label: '📦 Others', items: [...new Set(others)] },
    ];

    groups.forEach(group => {
        if (!group.items.length) return;
        const groupWrap = document.createElement('div');
        groupWrap.className = 'collection-group branch-item';
        groupWrap.dataset.section = 'products';

        const groupLabel = document.createElement('div');
        groupLabel.className = 'collection-label';
        groupLabel.innerHTML = `<span class="chevron">▶</span> ${group.label} <span style="opacity:0.5;font-size:10px">(${group.items.length})</span>`;

        const groupChildren = document.createElement('div');
        groupChildren.className = 'children branch collapsed';

        groupLabel.addEventListener('click', () => toggle(groupLabel, groupChildren));

        group.items.forEach(path => {
            const label = slugToLabel(path.replace('/products/', ''));
            const entry = urls.find(u => u.path === path);
            const leaf = makeLeaf(path, 'product', label, entry ? entry.priority : 0.64);
            groupChildren.appendChild(wrapBranchItem(leaf, 'products'));
        });

        groupWrap.appendChild(groupLabel);
        groupWrap.appendChild(groupChildren);
        prodChildren.appendChild(groupWrap);
    });

    const prodItem = wrapBranchItem(prodHeader, 'products');
    prodItem.appendChild(prodChildren);
    rootBranch.appendChild(prodItem);

    // ── BLOGS ─────────────────────────────────────
    const blogPosts = urls.filter(u => u.path.startsWith('/blogs/'));
    const blogHeader = makeSectionHeader('blogs', 'blogs', blogPosts.length);
    const blogChildren = document.createElement('div');
    blogChildren.className = 'children branch collapsed';

    blogHeader.addEventListener('click', () => toggle(blogHeader, blogChildren));

    blogPosts.forEach(({ path, priority }) => {
        const slug = path.split('/').pop();
        const label = slugToLabel(slug);
        const leaf = makeLeaf(path, 'blog', label, priority);
        blogChildren.appendChild(wrapBranchItem(leaf, 'blogs'));
    });

    const blogItem = wrapBranchItem(blogHeader, 'blogs');
    blogItem.appendChild(blogChildren);
    rootBranch.appendChild(blogItem);

    // ── PAGES ─────────────────────────────────────
    const pages = urls.filter(u => u.path.startsWith('/pages/'));
    const pageHeader = makeSectionHeader('pages', 'pages', pages.length);
    const pageChildren = document.createElement('div');
    pageChildren.className = 'children branch collapsed';

    pageHeader.addEventListener('click', () => toggle(pageHeader, pageChildren));

    pages.forEach(({ path, priority }) => {
        const label = slugToLabel(path.replace('/pages/', ''));
        const leaf = makeLeaf(path, 'page', label, priority);
        pageChildren.appendChild(wrapBranchItem(leaf, 'pages'));
    });

    const pageItem = wrapBranchItem(pageHeader, 'pages');
    pageItem.appendChild(pageChildren);
    rootBranch.appendChild(pageItem);
}

// Initialization and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Theme Switcher
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;

            document.querySelectorAll('.branch-item[data-section]').forEach(item => {
                if (filter === 'all' || item.dataset.section === filter) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

    // Expand/Collapse All
    let allExpanded = false;
    const expandBtn = document.getElementById('expandAll');
    expandBtn.addEventListener('click', function () {
        allExpanded = !allExpanded;
        this.textContent = allExpanded ? 'Collapse All' : 'Expand All';
        document.querySelectorAll('.children').forEach(c => {
            if (allExpanded) c.classList.remove('collapsed');
            else c.classList.add('collapsed');
        });
        document.querySelectorAll('.chevron').forEach(c => {
            c.classList.toggle('open', allExpanded);
        });
    });

    buildTree();
});
