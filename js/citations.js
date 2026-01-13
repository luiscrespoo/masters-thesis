/**
 * Citations Module
 *
 * Provides interactive citation previews instead of jumping to bibliography.
 * When clicking a citation like [1], a tooltip shows the full reference info
 * with a direct link to the source (DOI/URL).
 *
 * Features:
 * - Click to show/hide tooltip
 * - Click outside to close
 * - Mobile-friendly (works with touch)
 * - Smooth animations
 * - Direct link to source if available
 */

let activeTooltip = null;

export function initCitations() {
    // Create tooltip container (reused for all citations)
    createTooltipContainer();

    // Use event delegation on document to catch all cite clicks
    // This works even for citations inside captions that are modified by numbering.js
    document.addEventListener('click', (e) => {
        const cite = e.target.closest('a.cite');
        if (cite) {
            handleCiteClick(e, cite);
        } else {
            handleOutsideClick(e);
        }
    });

    // Close tooltip on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideTooltip();
        }
    });

    // Reposition on scroll/resize
    window.addEventListener('scroll', repositionTooltip, { passive: true });
    window.addEventListener('resize', repositionTooltip, { passive: true });
}

/**
 * Create the tooltip container element
 */
function createTooltipContainer() {
    const tooltip = document.createElement('div');
    tooltip.id = 'cite-tooltip';
    tooltip.className = 'cite-tooltip';
    tooltip.innerHTML = `
        <div class="cite-tooltip-arrow"></div>
        <div class="cite-tooltip-content">
            <button class="cite-tooltip-close" aria-label="Close">&times;</button>
            <div class="cite-tooltip-body"></div>
        </div>
    `;
    document.body.appendChild(tooltip);

    // Close button handler
    tooltip.querySelector('.cite-tooltip-close').addEventListener('click', (e) => {
        e.stopPropagation();
        hideTooltip();
    });
}

/**
 * Handle click on a citation link
 * @param {Event} e - Click event
 * @param {HTMLElement} cite - The citation link element (from event delegation)
 */
function handleCiteClick(e, cite) {
    e.preventDefault();
    e.stopPropagation();
    toggleCitationTooltip(cite);
}

export function toggleCitationTooltip(cite) {
    if (!cite) return;

    const href = cite.getAttribute('href');
    if (!href || !href.startsWith('#ref-')) return;

    const refId = href.substring(1);
    const bibEntry = document.getElementById(refId);
    if (!bibEntry) return;

    // If clicking the same citation, toggle off
    if (activeTooltip === cite) {
        hideTooltip();
        return;
    }

    // Show tooltip for this citation
    showTooltip(cite, bibEntry);
}

/**
 * Show the tooltip for a citation
 * @param {HTMLElement} cite - The citation link element
 * @param {HTMLElement} bibEntry - The bibliography entry element
 */
function showTooltip(cite, bibEntry) {
    const tooltip = document.getElementById('cite-tooltip');
    if (!tooltip) return;

    // Clear previous selection first (instant deselect)
    if (activeTooltip && activeTooltip !== cite) {
        activeTooltip.classList.remove('cite-active');
    }

    // Extract info from bibliography entry
    const authorsEl = bibEntry.querySelector('.bib-authors');
    const titleEl = bibEntry.querySelector('.bib-title');
    const linkEl = bibEntry.querySelector('a[href]');

    // Get the publication info (everything after title, before link)
    const fullText = bibEntry.textContent;
    const emEl = bibEntry.querySelector('em');
    const pubInfo = emEl ? emEl.textContent.trim() : '';

    // Extract year (usually at the end before DOI)
    const yearMatch = fullText.match(/\.\s*(\d{4})\s*\./);
    const year = yearMatch ? yearMatch[1] : '';

    // Build tooltip content
    const authors = authorsEl ? authorsEl.textContent.trim() : '';
    const title = titleEl ? titleEl.textContent.trim() : '';

    let bodyHTML = '';
    if (authors) {
        bodyHTML += `<div class="cite-authors">${authors}</div>`;
    }
    if (title) {
        bodyHTML += `<div class="cite-title">${title}</div>`;
    }
    if (pubInfo || year) {
        let pubText = '';
        if (pubInfo && year) {
            pubText = `${pubInfo}, ${year}`;
        } else if (pubInfo) {
            pubText = pubInfo;
        } else if (year) {
            pubText = year;
        }
        bodyHTML += `<div class="cite-pub">${pubText}</div>`;
    }
    // Add source link icon at the end if available
    if (linkEl) {
        const url = linkEl.getAttribute('href');
        bodyHTML += `<a href="${url}" target="_blank" rel="noopener" class="cite-source-link" title="Open source">
            <svg class="icon"><use href="#icon-external-link"/></svg>
        </a>`;
    }
    tooltip.querySelector('.cite-tooltip-body').innerHTML = bodyHTML;

    // Position and show
    tooltip.classList.add('visible');
    activeTooltip = cite;
    cite.classList.add('cite-active');

    positionTooltip(cite, tooltip);
}

/**
 * Position the tooltip relative to the citation
 * @param {HTMLElement} cite - The citation link
 * @param {HTMLElement} tooltip - The tooltip element
 */
function positionTooltip(cite, tooltip) {
    const citeRect = cite.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const arrow = tooltip.querySelector('.cite-tooltip-arrow');

    // Calculate citation center (for arrow positioning)
    const citeCenterX = citeRect.left + (citeRect.width / 2);

    // Default: position below the citation
    let top = citeRect.bottom + 12 + window.scrollY;
    let left = citeCenterX - (tooltipRect.width / 2) + window.scrollX;

    // Adjust horizontal position to stay within viewport
    const padding = 16;
    if (left < padding) {
        left = padding;
    } else if (left + tooltipRect.width > viewportWidth - padding) {
        left = viewportWidth - tooltipRect.width - padding;
    }

    // Calculate arrow position relative to tooltip
    const arrowLeft = citeCenterX - left + window.scrollX - 8; // 8 = half arrow width

    // If tooltip would go below viewport, show above
    if (citeRect.bottom + tooltipRect.height + 20 > viewportHeight) {
        top = citeRect.top - tooltipRect.height - 12 + window.scrollY;
        tooltip.classList.add('above');
    } else {
        tooltip.classList.remove('above');
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Position arrow to point at citation
    if (arrow) {
        arrow.style.left = `${Math.max(16, Math.min(arrowLeft, tooltipRect.width - 24))}px`;
    }
}

/**
 * Reposition tooltip on scroll/resize
 */
function repositionTooltip() {
    if (!activeTooltip) return;

    const tooltip = document.getElementById('cite-tooltip');
    if (!tooltip || !tooltip.classList.contains('visible')) return;

    positionTooltip(activeTooltip, tooltip);
}

/**
 * Hide the tooltip
 */
function hideTooltip() {
    const tooltip = document.getElementById('cite-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }

    if (activeTooltip) {
        activeTooltip.classList.remove('cite-active');
        activeTooltip = null;
    }
}

/**
 * Handle clicks outside the tooltip
 * @param {Event} e - Click event
 */
function handleOutsideClick(e) {
    if (!activeTooltip) return;

    const tooltip = document.getElementById('cite-tooltip');
    const clickedOnCite = e.target.closest('.cite');
    const clickedOnTooltip = tooltip && tooltip.contains(e.target);

    // Close if clicked outside both tooltip and any citation
    if (!clickedOnCite && !clickedOnTooltip) {
        hideTooltip();
    }
}
