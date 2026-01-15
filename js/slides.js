/**
 * Slides Module - Simple view switching between header and main
 */

import { revealAllInView, hideAllInView } from './scroll.js';

let currentView = null; // Start as null to force initial setup
let locked = false;
const LOCK_DURATION = 300; // ms to prevent rapid switching

const HEADER_BOTTOM_MARGIN = 32;
const HEADER_VISIBILITY_MARGIN = 8;

// Touch state for swipe detection
let touchStartY = null;
let touchStartX = null;
const SWIPE_THRESHOLD = 50; // px minimum swipe distance

function isHeaderAtBottom() {
    const header = document.querySelector('header');
    if (!header) return false;
    return header.scrollTop + header.clientHeight >= header.scrollHeight - HEADER_BOTTOM_MARGIN;
}

function isHeaderReadyToSwitch() {
    const header = document.querySelector('header');
    const scrollDownBtn = document.getElementById('scrollDownBtn');
    if (!header || !scrollDownBtn) return false;
    if (!scrollDownBtn.classList.contains('revealed')) return false;

    const headerRect = header.getBoundingClientRect();
    const btnRect = scrollDownBtn.getBoundingClientRect();
    const btnVisible = btnRect.top >= headerRect.top + HEADER_VISIBILITY_MARGIN &&
        btnRect.bottom <= headerRect.bottom - HEADER_VISIBILITY_MARGIN;

    return btnVisible && isHeaderAtBottom();
}

export function initSlides() {
    const sidebarTitle = document.getElementById('sidebarTitle');

    // Always start at header on reload, clear any hash
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname);
    }
    showHeader(true); // true = initial load

    // Wheel event - boundary detection with arrow gate
    // Sidebar scrolling is independent - only handle wheel events outside sidebar
    window.addEventListener('wheel', (e) => {
        if (locked) return;

        // If scrolling inside the sidebar, let it handle its own scrolling
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.contains(e.target)) {
            return; // Don't interfere with sidebar scrolling
        }

        if (currentView === 'header') {
            const scrollBtn = document.getElementById('scrollDownBtn');
            const header = document.querySelector('header');

            if (scrollBtn && header && e.deltaY > 10) {
                // Switch when header is scrolled to (or near) the bottom
                if (isHeaderReadyToSwitch()) {
                    e.preventDefault();
                    showMain();
                } else {
                    // Manually scroll the header element since body has overflow:hidden
                    header.scrollTop += e.deltaY;
                    e.preventDefault();
                }
            }
        } else {
            // At top in main, scrolling up
            if (window.scrollY < 10 && e.deltaY < -10) {
                e.preventDefault();
                showHeader();
            }
        }
    }, { passive: false });

    // Touch events for mobile swipe between header and main
    window.addEventListener('touchstart', (e) => {
        // Don't track if inside sidebar
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.contains(e.target)) {
            touchStartY = null;
            return;
        }
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (touchStartY === null || locked) return;

        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const deltaY = touchStartY - touchEndY;
        const deltaX = Math.abs(touchStartX - touchEndX);

        // Only trigger if vertical swipe is dominant (not horizontal)
        if (Math.abs(deltaY) < SWIPE_THRESHOLD || deltaX > Math.abs(deltaY)) {
            touchStartY = null;
            return;
        }

        if (currentView === 'header' && deltaY > 0) {
            // Swipe up in header -> check if at bottom
            const header = document.querySelector('header');
            if (header) {
                if (isHeaderReadyToSwitch()) {
                    showMain();
                }
            }
        } else if (currentView === 'main' && deltaY < 0) {
            // Swipe down in main -> check if at top
            if (window.scrollY < 10) {
                showHeader();
            }
        }

        touchStartY = null;
    }, { passive: true });

    // Click on sidebar header -> show header
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) {
        sidebarHeader.addEventListener('click', (e) => {
            // Don't trigger if clicking on theme toggle
            if (e.target.closest('.theme-toggle')) return;
            e.preventDefault();
            showHeader();
        });
    }

    // Click on "Back to Top" links (except sidebar header)
    document.querySelectorAll('a[href="#top"]').forEach(link => {
        if (!link.classList.contains('sidebar-header')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showHeader();
            });
        }
    });

    // Click on scroll down button in header - only works when revealed
    const scrollDownBtn = document.getElementById('scrollDownBtn');
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Only allow if button is revealed
            if (isHeaderReadyToSwitch()) {
                showMain();
            }
        });
    }
}

function showHeader(isInitial = false) {
    if (currentView === 'header' && !locked && !isInitial) return;

    locked = true;
    // Hide main content first (for animation) - only if transitioning, not on initial load
    if (currentView === 'main' && !isInitial) {
        hideAllInView('main');
    }

    currentView = 'header';

    // Update classes first
    document.body.classList.remove('viewing-main');
    document.body.classList.add('viewing-header');
    document.documentElement.classList.remove('viewing-main');
    document.documentElement.classList.add('viewing-header');

    // Wait for DOM update, then scroll and reveal
    requestAnimationFrame(() => {
        window.scrollTo(0, 0);

        // Scroll header to top - ensures TFM icon/title visible when content doesn't fit
        const header = document.querySelector('header');
        if (header) {
            header.scrollTop = 0;
        }

        // Update sidebar immediately
        const sidebarTitle = document.getElementById('sidebarTitle');
        if (sidebarTitle) sidebarTitle.classList.add('active');
        document.querySelectorAll('.sidebar a[data-section]').forEach(a => {
            a.classList.remove('active', 'ancestor-active');
        });

        // Only update URL if there's a hash to clear (avoid repeated Safari issues)
        if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname);
        }

        // Delay reveal to allow transitions to be enabled (no-transition removed after 50ms)
        // and to create the fade-in animation effect
        setTimeout(() => {
            revealAllInView('header');
        }, isInitial ? 100 : 50);
    });

    setTimeout(() => { locked = false; }, LOCK_DURATION);
}

function showMain(isInitial = false, skipScroll = false) {
    if (currentView === 'main' && !locked && !isInitial) return;

    locked = true;

    // Hide header content first (for animation) - only if transitioning, not on initial load
    if (currentView === 'header' && !isInitial) {
        hideAllInView('header');
    }

    currentView = 'main';

    // Update classes first
    document.body.classList.remove('viewing-header');
    document.body.classList.add('viewing-main');
    document.documentElement.classList.remove('viewing-header');
    document.documentElement.classList.add('viewing-main');

    // Wait for DOM update, then scroll and reveal
    requestAnimationFrame(() => {
        if (!skipScroll) {
            window.scrollTo(0, 0);
        }

        // Update sidebar immediately
        const sidebarTitle = document.getElementById('sidebarTitle');
        if (sidebarTitle) sidebarTitle.classList.remove('active');

        // Highlight first section
        const firstSection = document.querySelector('.sidebar a[data-section="summary"]');
        if (firstSection) firstSection.classList.add('active');

        // Delay reveal to allow transitions to be enabled (no-transition removed after 50ms)
        // and to create the fade-in animation effect
        setTimeout(() => {
            revealAllInView('main');
        }, isInitial ? 100 : 50);
    });

    setTimeout(() => { locked = false; }, LOCK_DURATION);
}

// Public API
export function getCurrentView() {
    return currentView;
}

export function switchToMain(skipScroll = false) {
    showMain(false, skipScroll);
}
