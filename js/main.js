/**
 * Initializes the thesis viewer modules.
 */

import { initTheme } from './theme.js';
import { initNavigation } from './navigation.js';
import { initScroll } from './scroll.js';
import { initSlides } from './slides.js';
import { initNumbering } from './numbering.js';
import { initTables } from './tables.js';
import { initCitations } from './citations.js';
import { initLightbox } from './lightbox.js';

/**
 * Resolve once MathJax is ready or absent.
 */
function waitForMathJax() {
    return new Promise((resolve) => {
        if (window.MathJax?.startup?.promise) {
            window.MathJax.startup.promise.then(resolve);
            return;
        }

        if (window.MathJax) {
            const checkInterval = setInterval(() => {
                if (window.MathJax?.startup?.promise) {
                    clearInterval(checkInterval);
                    window.MathJax.startup.promise.then(resolve);
                }
            }, 50);

            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
            return;
        }

        resolve();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initNavigation();
    initSlides();
    initScroll();
    initTables();
    initCitations();
    initLightbox();

    await waitForMathJax();
    initNumbering();
});
