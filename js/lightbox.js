/**
 * Lightbox overlay for figures with citation and reference handling.
 */

import { toggleCitationTooltip } from './citations.js';
import { createScrollAnchor, restoreScrollAnchor } from './scroll_anchor.js';

let lightboxElement = null;
let lightboxAnchor = null;

export function initLightbox() {
    createLightboxElement();
    attachFigureListeners();
}

function createLightboxElement() {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-backdrop"></div>
        <div class="lightbox-container">
            <button class="lightbox-close" aria-label="Close">&times;</button>
            <div class="lightbox-content">
                <img class="lightbox-image" src="" alt="">
                <div class="lightbox-caption-row">
                    <div class="lightbox-caption"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(lightbox);
    lightboxElement = lightbox;

    lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('open')) {
            closeLightbox();
        }
    });
    lightbox.querySelector('.lightbox-caption-row').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeLightbox();
        }
    });

    // Keep citation and reference links functional inside the overlay.
    lightbox.querySelector('.lightbox-caption').addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        if (link.classList.contains('cite')) {
            e.preventDefault();
            e.stopPropagation();
            toggleCitationTooltip(link);
            return;
        }

        if (link.classList.contains('ref')) {
            e.preventDefault();
            const href = link.getAttribute('href');
            closeLightbox({ skipAnchorRestore: true });
            setTimeout(() => {
                if (href) {
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'instant', block: 'start' });
                    }
                }
            }, 100);
        }
    });
}

function attachFigureListeners() {
    document.querySelectorAll('.figure').forEach(figure => {
        const img = figure.querySelector('img');
        if (img) {
            img.style.cursor = 'pointer';
            img.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openLightbox(figure);
            });
        }
    });
}

function openLightbox(figure) {
    if (!lightboxElement) return;

    lightboxAnchor = createScrollAnchor();

    const img = figure.querySelector('img');
    const caption = figure.querySelector('.caption');

    if (!img) return;

    const lightboxImg = lightboxElement.querySelector('.lightbox-image');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;

    const lightboxCaption = lightboxElement.querySelector('.lightbox-caption');
    if (caption) {
        lightboxCaption.innerHTML = caption.innerHTML;
    } else {
        lightboxCaption.innerHTML = '';
    }

    lightboxElement.classList.add('open');
    document.body.classList.add('lightbox-open');
    document.documentElement.classList.add('lightbox-open');
    applyScrollbarCompensation();
}

function closeLightbox(options = {}) {
    if (!lightboxElement) return;

    lightboxElement.classList.remove('open');
    document.body.classList.remove('lightbox-open');
    document.documentElement.classList.remove('lightbox-open');
    clearScrollbarCompensation();

    const tooltip = document.getElementById('cite-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
    document.querySelectorAll('.cite-active').forEach(el => {
        el.classList.remove('cite-active');
    });

    if (!options.skipAnchorRestore && lightboxAnchor) {
        requestAnimationFrame(() => {
            restoreScrollAnchor(lightboxAnchor);
            lightboxAnchor = null;
        });
    } else {
        lightboxAnchor = null;
    }
}

function applyScrollbarCompensation() {
    if (window.CSS?.supports?.('scrollbar-gutter: stable')) {
        return;
    }
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
}

function clearScrollbarCompensation() {
    document.body.style.paddingRight = '';
}
