/**
 * Scroll reveal and active TOC tracking.
 */

const REVEAL_SELECTOR = 'header .header-inner > *, main p, main li, main h2, main h3, main h4, main h5, .figure, .equation, .algorithm, blockquote, table, .bib-entry';
const REVEAL_ENTER_MARGIN = 0.95;
const REVEAL_EXIT_MARGIN = 0.05;

let allLinks = [];
let sectionIds = [];
let ancestorMap = {};
let lastActiveId = null;

export function initScroll() {
    buildSectionMap();
    setupScrollHandler();

    setTimeout(() => {
        updateActiveSection();
        updateScrollReveal();
    }, 100);
}

function buildSectionMap() {
    allLinks = Array.from(document.querySelectorAll('.sidebar a[data-section]'));
    sectionIds = allLinks.map(l => l.getAttribute('data-section'));

    allLinks.forEach(link => {
        const id = link.getAttribute('data-section');
        const ancestors = [];

        let parentLi = link.closest('li')?.parentElement?.closest('li.has-children');
        while (parentLi) {
            const parentLink = parentLi.querySelector(':scope > .nav-row > a[data-section]');
            if (parentLink) {
                ancestors.push(parentLink.getAttribute('data-section'));
            }
            parentLi = parentLi.parentElement?.closest('li.has-children');
        }

        ancestorMap[id] = ancestors;
    });
}

function setupScrollHandler() {
    let ticking = false;

    const scheduleUpdate = () => {
        if (ticking) return;
        requestAnimationFrame(() => {
            updateActiveSection();
            updateScrollReveal();
            ticking = false;
        });
        ticking = true;
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
}

function updateScrollReveal() {
    const windowHeight = window.innerHeight;
    const enterPoint = windowHeight * REVEAL_ENTER_MARGIN;
    const exitPoint = windowHeight * REVEAL_EXIT_MARGIN;

    document.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
        const rect = el.getBoundingClientRect();

        const isInViewport = rect.top < enterPoint && rect.bottom > exitPoint;

        if (isInViewport) {
            el.classList.add('revealed');
        } else {
            el.classList.remove('revealed');
        }
    });
}

function updateActiveSection() {
    if (document.body.classList.contains('viewing-header')) {
        return;
    }

    const offset = 180;
    let deepestId = null;

    const sectionsWithPos = [];
    sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const rect = el.getBoundingClientRect();
            sectionsWithPos.push({ id, top: rect.top });
        }
    });

    sectionsWithPos.sort((a, b) => a.top - b.top);

    for (const sec of sectionsWithPos) {
        if (sec.top <= offset) {
            deepestId = sec.id;
        }
    }

    if (!deepestId) deepestId = 'top';

    const activeId = findVisibleSection(deepestId);

    if (activeId === lastActiveId) return;
    lastActiveId = activeId;

    updateSidebarHighlighting(activeId);
    scrollSidebarToActive(activeId);
}

function isSectionVisible(sectionId) {
    const link = document.querySelector(`.sidebar a[data-section="${sectionId}"]`);
    if (!link) return false;

    let parentLi = link.closest('li')?.parentElement?.closest('li.has-children');
    while (parentLi) {
        if (!parentLi.classList.contains('open')) {
            return false;
        }
        parentLi = parentLi.parentElement?.closest('li.has-children');
    }

    return true;
}

function findVisibleSection(sectionId) {
    if (isSectionVisible(sectionId)) {
        return sectionId;
    }

    const ancestors = ancestorMap[sectionId] || [];
    for (const ancestorId of ancestors) {
        if (isSectionVisible(ancestorId)) {
            return ancestorId;
        }
    }

    return sectionId;
}

function getLevel(id) {
    const link = document.querySelector(`.sidebar a[data-section="${id}"]`);
    if (!link) return 0;

    const text = link.textContent.trim();
    const match = text.match(/^([\d\.]+)/);

    if (!match) return 1;

    const dots = (match[1].match(/\./g) || []).length;
    return dots + 1;
}

function updateSidebarHighlighting(activeId) {
    const ancestors = ancestorMap[activeId] || [];

    allLinks.forEach(link => {
        link.classList.remove('active');
        link.classList.remove('ancestor-active');
    });

    allLinks.forEach(link => {
        const linkId = link.getAttribute('data-section');
        const li = link.closest('li');

        if (linkId === activeId) {
            link.classList.add('active');
        } else if (ancestors.includes(linkId)) {
            link.classList.add('ancestor-active');

            // Auto-open top-level chapters only.
            const linkLevel = getLevel(linkId);
            if (linkLevel === 1) {
                li?.classList.add('open');
            }
        }
    });

    ancestors.forEach(ancestorId => {
        const level = getLevel(ancestorId);
        if (level === 1) {
            const li = document.querySelector(`.sidebar a[data-section="${ancestorId}"]`)?.closest('li');
            if (li) li.classList.add('open');
        }
    });
}

function scrollSidebarToActive(activeId) {
    const sidebarContent = document.querySelector('.sidebar-content');
    const activeLink = document.querySelector(`.sidebar a[data-section="${activeId}"]`);

    if (!activeLink || !sidebarContent || !isSectionVisible(activeId)) {
        return;
    }

    const linkRect = activeLink.getBoundingClientRect();
    const containerRect = sidebarContent.getBoundingClientRect();

    if (linkRect.top < containerRect.top + 80 || linkRect.bottom > containerRect.bottom - 80) {
        sidebarContent.scrollTo({
            top: activeLink.offsetTop - sidebarContent.clientHeight / 2,
            behavior: 'smooth'
        });
    }
}

// Reveal elements immediately when switching views.
export function revealAllInView(view) {
    if (view === 'main') {
        // Avoid revealing the entire document at once (Safari jank).
        updateScrollReveal();
        return;
    }

    const selector = view === 'header'
        ? 'header .header-inner > *'
        : 'main p, main li, main h2, main h3, main h4, main h5, .figure, .equation, .algorithm, blockquote, table, .bib-entry';

    document.querySelectorAll(selector).forEach(el => {
        el.classList.add('revealed');
    });
}

// Reset reveal state before switching views.
export function hideAllInView(view) {
    const selector = view === 'header'
        ? 'header .header-inner > *'
        : 'main p, main li, main h2, main h3, main h4, main h5, .figure, .equation, .algorithm, blockquote, table, .bib-entry';

    document.querySelectorAll(selector).forEach(el => {
        el.classList.remove('revealed');
    });
}
