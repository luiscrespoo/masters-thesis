/**
 * Theme Management Module
 * Handles dark/light theme toggling with persistence in localStorage.
 */

export function initTheme() {
    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');

    // Update icon for current theme
    const currentTheme = html.getAttribute('data-theme') || 'light';
    updateThemeIcon(currentTheme);

    // Enable transitions after a brief delay (prevents flash on load)
    setTimeout(() => {
        html.classList.remove('no-transition');
    }, 50);

    // Handle theme toggle clicks
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';

            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeIcon(next);
        });
    }
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const sunIcon = themeToggle.querySelector('.icon-sun');
    const moonIcon = themeToggle.querySelector('.icon-moon');

    if (!sunIcon || !moonIcon) return;

    if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}
