/**
 * Navigation Module
 *
 * Handles mobile menu, collapsible table of contents, and smooth scrolling.
 */

import { switchToMain } from './slides.js';

export function initNavigation() {
    initMobileMenu();
    initCollapsibleTOC();
    initSmoothScroll();
}

/**
 * Mobile Menu Toggle
 * Shows/hides sidebar on mobile devices
 */
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    // Toggle sidebar on menu button click
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        document.body.classList.toggle('sidebar-open');
    });

    // Close sidebar when clicking on main content (mobile only)
    if (mainContent) {
        mainContent.addEventListener('click', () => {
            if (window.innerWidth <= 1000) {
                sidebar.classList.remove('open');
                document.body.classList.remove('sidebar-open');
            }
        });
    }
}

/**
 * Collapsible Table of Contents
 * Allows expanding/collapsing nested sections in sidebar
 */
function initCollapsibleTOC() {
    // Add click handlers to all toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const parent = btn.closest('.has-children');
            if (parent) {
                parent.classList.toggle('open');
                // Update arrow: ▸ when closed, ▾ when open
                btn.textContent = parent.classList.contains('open') ? '▾' : '▸';
            }
        });
    });

    // Initialize arrow states based on existing open class
    document.querySelectorAll('.has-children').forEach(item => {
        const btn = item.querySelector(':scope > .nav-row > .toggle-btn');
        if (btn) {
            btn.textContent = item.classList.contains('open') ? '▾' : '▸';
        }
    });
}

/**
 * Smooth Scrolling for Anchor Links
 * Scrolls smoothly to section when clicking TOC links.
 * Excludes citation links (.cite) which are handled by citations.js
 */
function initSmoothScroll() {
    const sidebar = document.getElementById('sidebar');

    // Select all anchor links EXCEPT citations and sidebar header
    document.querySelectorAll('a[href^="#"]:not(.cite):not(.sidebar-header)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Skip if it's the #top link (handled by slides.js via sidebar title)
            if (href === '#top') {
                return;
            }

            if (href && href.length > 1) {
                const target = document.querySelector(href);

                if (target) {
                    e.preventDefault();

                    // Switch to main view if currently viewing header
                    switchToMain();

                    // Delay to allow view transition, then scroll
                    setTimeout(() => {
                        const targetPosition = target.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo({
                            top: targetPosition - 100,
                            behavior: 'instant'
                        });
                    }, 120);

                    // Don't close sidebar - let user click outside to close it
                }
            }
        });
    });
}
