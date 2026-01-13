/**
 * Adds numbering to figures, tables, equations, and algorithms.
 * Section references remain sourced from the HTML.
 */

export function initNumbering() {
    try {
        numberFigures();
        numberTables();
        numberEquations();
        numberAlgorithms();
    } catch (error) {
        console.error('[Numbering] Error:', error);
    }
}

/**
 * Number all figures in the document sequentially.
 * Wraps content in .figure-inner and adds "Figure N." prefix to captions.
 * This ensures image + caption scroll together.
 * @returns {number} Number of figures processed
 */
function numberFigures() {
    const figures = document.querySelectorAll('.figure[id]');

    figures.forEach((fig, index) => {
        const figNum = index + 1;
        fig.setAttribute('data-number', figNum);

    let inner = fig.querySelector('.figure-inner');
    if (!inner) {
        inner = document.createElement('div');
        inner.className = 'figure-inner';

        while (fig.firstChild) {
            inner.appendChild(fig.firstChild);
        }
        fig.appendChild(inner);
    }

        const caption = inner.querySelector('.caption');
        if (caption) {
        const currentHTML = caption.innerHTML.trim();
        if (!currentHTML.startsWith('<strong>Figure')) {
            caption.innerHTML = `<strong>Figure ${figNum}.</strong> ${currentHTML}`;
        }
    }
    });

    return figures.length;
}

/**
 * Number all tables in the document sequentially.
 * Wraps content in .table-inner and adds "Table N." prefix to captions.
 * This ensures table + caption scroll together.
 * @returns {number} Number of tables processed
 */
function numberTables() {
    const tables = document.querySelectorAll('.results-table[id], div[id^="tab-"]');

    tables.forEach((tableDiv, index) => {
        const tabNum = index + 1;
        tableDiv.setAttribute('data-number', tabNum);

    let inner = tableDiv.querySelector('.table-inner');
    if (!inner) {
        inner = document.createElement('div');
        inner.className = 'table-inner';

        while (tableDiv.firstChild) {
            inner.appendChild(tableDiv.firstChild);
        }
        tableDiv.appendChild(inner);
    }

        const caption = inner.querySelector('.caption');
        if (caption) {
        const currentHTML = caption.innerHTML.trim();
        if (!currentHTML.startsWith('<strong>Table')) {
            caption.innerHTML = `<strong>Table ${tabNum}.</strong> ${currentHTML}`;
        }
    }
    });

    return tables.length;
}

/**
 * Number all equations in the document sequentially.
 * Wraps content in .equation-inner and adds "(N)" label inline.
 * This ensures the label scrolls with the equation content.
 * @returns {number} Number of equations processed
 */
function numberEquations() {
    const equations = document.querySelectorAll('.equation[id]');

    equations.forEach((eq, index) => {
        const eqNum = index + 1;
        eq.setAttribute('data-number', eqNum);

    let inner = eq.querySelector('.equation-inner');
    if (!inner) {
        inner = document.createElement('div');
        inner.className = 'equation-inner';

        while (eq.firstChild) {
            inner.appendChild(eq.firstChild);
        }
        eq.appendChild(inner);
    }

    let label = inner.querySelector('.equation-label');
    if (!label) {
        label = document.createElement('span');
        label.className = 'equation-label';
            inner.appendChild(label);
        }
        label.textContent = `(${eqNum})`;
    });

    return equations.length;
}

/**
 * Number all algorithms in the document sequentially.
 * Adds "Algorithm N:" prefix to captions.
 * @returns {number} Number of algorithms processed
 */
function numberAlgorithms() {
    const algorithms = document.querySelectorAll('.algorithm[id]');

    algorithms.forEach((alg, index) => {
        const algNum = index + 1;
        alg.setAttribute('data-number', algNum);

        const caption = alg.querySelector('.algo-caption');
        if (caption) {
        const currentText = caption.textContent.trim();
        if (!currentText.startsWith('Algorithm')) {
            caption.textContent = `Algorithm ${algNum}: ${currentText}`;
        }
    }
    });

    return algorithms.length;
}
