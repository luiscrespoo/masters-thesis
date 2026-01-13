/**
 * Interactive Tables Module
 *
 * Provides advanced click-to-select functionality for table cells:
 *
 * Selection rules:
 * (a) Default: clicking a cell selects just that cell
 * (b) First column (not first row): clicking selects the entire row
 * (c) First row: clicking selects the entire column
 * (d) thead: works like first row (selects column(s))
 * (e) colspan/rowspan: selecting a cell with colspan/rowspan selects multiple columns/rows
 * (f) Toggle: clicking a selected cell deselects it; multiple selections can coexist
 */

export function initTables() {
    document.querySelectorAll('table').forEach(table => {
        table.addEventListener('click', handleTableClick);
    });
}

/**
 * Build a column map for a table that accounts for colspan and rowspan.
 * Returns a 2D array where map[rowIndex][colIndex] = the cell occupying that position.
 *
 * @param {HTMLTableElement} table - The table element
 * @returns {Array<Array<HTMLTableCellElement>>} - 2D map of cells by position
 */
function buildColumnMap(table) {
    const rows = Array.from(table.rows);
    if (rows.length === 0) return [];

    // Determine the maximum number of columns
    let maxCols = 0;
    rows.forEach(row => {
        let cols = 0;
        Array.from(row.cells).forEach(cell => {
            cols += cell.colSpan || 1;
        });
        maxCols = Math.max(maxCols, cols);
    });

    // Initialize empty map
    const map = rows.map(() => new Array(maxCols).fill(null));

    // Fill the map considering colspan and rowspan
    rows.forEach((row, rowIdx) => {
        let colIdx = 0;
        Array.from(row.cells).forEach(cell => {
            // Find the next available column in this row
            while (map[rowIdx][colIdx] !== null) {
                colIdx++;
            }

            const rowSpan = cell.rowSpan || 1;
            const colSpan = cell.colSpan || 1;

            // Fill all positions this cell occupies
            for (let r = 0; r < rowSpan && (rowIdx + r) < rows.length; r++) {
                for (let c = 0; c < colSpan && (colIdx + c) < maxCols; c++) {
                    map[rowIdx + r][colIdx + c] = cell;
                }
            }

            colIdx += colSpan;
        });
    });

    return map;
}

/**
 * Get the logical column indices that a cell occupies
 * @param {HTMLTableElement} table - The table
 * @param {HTMLTableCellElement} cell - The cell
 * @returns {number[]} - Array of column indices
 */
function getCellColumnIndices(table, cell) {
    const map = buildColumnMap(table);
    const indices = [];

    for (let rowIdx = 0; rowIdx < map.length; rowIdx++) {
        for (let colIdx = 0; colIdx < map[rowIdx].length; colIdx++) {
            if (map[rowIdx][colIdx] === cell && !indices.includes(colIdx)) {
                indices.push(colIdx);
            }
        }
    }

    return indices;
}

/**
 * Get the logical row indices that a cell occupies
 * @param {HTMLTableElement} table - The table
 * @param {HTMLTableCellElement} cell - The cell
 * @returns {number[]} - Array of row indices
 */
function getCellRowIndices(table, cell) {
    const map = buildColumnMap(table);
    const indices = [];

    for (let rowIdx = 0; rowIdx < map.length; rowIdx++) {
        for (let colIdx = 0; colIdx < map[rowIdx].length; colIdx++) {
            if (map[rowIdx][colIdx] === cell && !indices.includes(rowIdx)) {
                indices.push(rowIdx);
            }
        }
    }

    return indices;
}

/**
 * Check if a cell is in the first logical row (index 0)
 * @param {HTMLTableElement} table - The table
 * @param {HTMLTableCellElement} cell - The cell
 * @returns {boolean}
 */
function isInFirstRow(table, cell) {
    const rowIndices = getCellRowIndices(table, cell);
    return rowIndices.includes(0);
}

/**
 * Check if a cell is in the first logical column (index 0)
 * @param {HTMLTableElement} table - The table
 * @param {HTMLTableCellElement} cell - The cell
 * @returns {boolean}
 */
function isInFirstColumn(table, cell) {
    const colIndices = getCellColumnIndices(table, cell);
    return colIndices.includes(0);
}

/**
 * Check if a cell is in the thead
 * @param {HTMLTableCellElement} cell - The cell
 * @returns {boolean}
 */
function isInThead(cell) {
    const row = cell.parentElement;
    return row && row.parentElement && row.parentElement.tagName === 'THEAD';
}

/**
 * Get all cells in specified columns
 * @param {HTMLTableElement} table - The table
 * @param {number[]} colIndices - Column indices to select
 * @returns {Set<HTMLTableCellElement>} - Set of cells
 */
function getCellsInColumns(table, colIndices) {
    const map = buildColumnMap(table);
    const cells = new Set();

    for (let rowIdx = 0; rowIdx < map.length; rowIdx++) {
        for (const colIdx of colIndices) {
            if (colIdx < map[rowIdx].length && map[rowIdx][colIdx]) {
                cells.add(map[rowIdx][colIdx]);
            }
        }
    }

    return cells;
}

/**
 * Get all cells in specified rows
 * @param {HTMLTableElement} table - The table
 * @param {number[]} rowIndices - Row indices to select
 * @returns {Set<HTMLTableCellElement>} - Set of cells
 */
function getCellsInRows(table, rowIndices) {
    const map = buildColumnMap(table);
    const cells = new Set();

    for (const rowIdx of rowIndices) {
        if (rowIdx < map.length) {
            for (let colIdx = 0; colIdx < map[rowIdx].length; colIdx++) {
                if (map[rowIdx][colIdx]) {
                    cells.add(map[rowIdx][colIdx]);
                }
            }
        }
    }

    return cells;
}

/**
 * Toggle selection state for a set of cells.
 * If ALL cells are currently selected, deselect all.
 * Otherwise, select all.
 *
 * @param {Set<HTMLTableCellElement>} cells - Cells to toggle
 */
function toggleCellSelection(cells) {
    const cellArray = Array.from(cells);

    // Check if ALL cells are currently selected
    const allSelected = cellArray.every(cell => cell.classList.contains('selected'));

    if (allSelected) {
        // Deselect all
        cellArray.forEach(cell => cell.classList.remove('selected'));
    } else {
        // Select all
        cellArray.forEach(cell => cell.classList.add('selected'));
    }
}

/**
 * Handle click events on table cells
 * @param {Event} e - Click event
 */
function handleTableClick(e) {
    const cell = e.target.closest('td, th');
    if (!cell) return;

    const table = e.currentTarget;

    // Determine what cells should be toggled based on click location
    let cellsToToggle;

    const inThead = isInThead(cell);
    const inFirstRow = isInFirstRow(table, cell);
    const inFirstColumn = isInFirstColumn(table, cell);

    if (inThead || inFirstRow) {
        // First row or thead: select entire column(s)
        // Get all column indices this cell spans
        const colIndices = getCellColumnIndices(table, cell);
        cellsToToggle = getCellsInColumns(table, colIndices);
    } else if (inFirstColumn) {
        // First column (but not first row): select entire row(s)
        // Get all row indices this cell spans
        const rowIndices = getCellRowIndices(table, cell);
        cellsToToggle = getCellsInRows(table, rowIndices);
    } else {
        // Default: just select this cell
        cellsToToggle = new Set([cell]);
    }

    // Toggle the selection
    toggleCellSelection(cellsToToggle);
}
