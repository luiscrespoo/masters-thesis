// Snapshot the top-of-viewport content for lightbox restore.
const ANCHOR_SELECTOR = [
    'main p',
    'main li',
    'main h1',
    'main h2',
    'main h3',
    'main h4',
    'main h5',
    'main h6',
    'main .figure',
    'main .equation',
    'main .algorithm',
    'main blockquote',
    'main table',
    'main .bib-entry',
    'main .caption',
    'main img'
].join(', ');
const ANCHOR_LINE = 0;
const ANCHOR_LINE_PADDING = 0;
const REPLACED_TAGS = new Set(['IMG', 'VIDEO', 'CANVAS', 'SVG', 'IFRAME', 'OBJECT', 'EMBED']);

function isViewingMain() {
    return document.body.classList.contains('viewing-main') ||
        document.documentElement.classList.contains('viewing-main');
}

function clampAnchorLine(line) {
    const maxLine = Math.max(ANCHOR_LINE_PADDING, window.innerHeight - ANCHOR_LINE_PADDING);
    return Math.max(ANCHOR_LINE_PADDING, Math.min(maxLine, line));
}

function getAnchorLine() {
    return clampAnchorLine(ANCHOR_LINE);
}

function getAnchorPoint(anchorLine) {
    const y = Math.max(0, Math.min(window.innerHeight - 1, anchorLine));
    const content = document.querySelector('.content-inner') || document.querySelector('main');
    const clampX = (x) => Math.max(1, Math.min(window.innerWidth - 1, x));

    if (content) {
        const rect = content.getBoundingClientRect();
        if (rect.width > 0) {
            return { x: clampX(rect.left + rect.width * 0.5), y };
        }
    }

    return { x: clampX(window.innerWidth * 0.5), y };
}

function isNodeInMain(node) {
    if (!node) return false;
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return !!el?.closest('main');
}

function isReplacedElement(el) {
    const tag = el?.tagName?.toUpperCase();
    return !!tag && REPLACED_TAGS.has(tag);
}

function getTextRect(node, offset) {
    if (!node?.isConnected) return null;
    const range = document.createRange();

    if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent ? node.textContent.length : 0;
        const safeOffset = Math.min(offset, textLength);
        range.setStart(node, safeOffset);
        range.setEnd(node, safeOffset);
    } else {
        range.selectNode(node);
    }

    let rect = range.getBoundingClientRect();
    if ((!rect || rect.height === 0) && node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent ? node.textContent.length : 0;
        const start = Math.max(0, Math.min(offset, textLength - 1));
        const end = Math.min(textLength, start + 1);
        if (end > start) {
            range.setStart(node, start);
            range.setEnd(node, end);
            rect = range.getBoundingClientRect();
        }
    }

    if (!rect || rect.height === 0) {
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return el ? el.getBoundingClientRect() : null;
    }

    return rect;
}

function getTextAnchor(anchorLine, point) {
    let node = null;
    let offset = 0;

    if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(point.x, point.y);
        if (range) {
            node = range.startContainer;
            offset = range.startOffset;
        }
    } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(point.x, point.y);
        if (pos) {
            node = pos.offsetNode;
            offset = pos.offset;
        }
    }

    if (!node || !isNodeInMain(node)) return null;

    const rect = getTextRect(node, offset);
    if (!rect) return null;
    if (point.y < rect.top || point.y > rect.bottom) return null;

    return {
        type: 'text',
        node,
        offset,
        line: anchorLine,
        offsetY: anchorLine - rect.top
    };
}

function findElementAnchor(anchorLine, point) {
    const hit = document.elementFromPoint(point.x, point.y);
    if (hit) {
        const candidate = hit.closest(ANCHOR_SELECTOR);
        if (candidate) return candidate;
    }

    const elements = document.querySelectorAll(ANCHOR_SELECTOR);
    let lastAbove = null;

    for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < anchorLine) {
            lastAbove = el;
            continue;
        }
        if (rect.top <= anchorLine && rect.bottom >= anchorLine) {
            return el;
        }
        if (rect.top > anchorLine) {
            return lastAbove || el;
        }
    }

    return lastAbove;
}

export function createScrollAnchor() {
    if (!isViewingMain()) return null;

    const anchorLine = getAnchorLine();
    const point = getAnchorPoint(anchorLine);
    const textAnchor = getTextAnchor(anchorLine, point);
    if (textAnchor) return textAnchor;

    const el = findElementAnchor(anchorLine, point);
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const rawOffset = anchorLine - rect.top;
    const offsetWithin = rect.height > 0 && rawOffset >= 0 && rawOffset <= rect.height;
    const offsetRatio = offsetWithin ? rawOffset / rect.height : null;

    return {
        type: 'element',
        el,
        offset: rawOffset,
        offsetRatio,
        preferRatio: isReplacedElement(el),
        line: anchorLine
    };
}

export function restoreScrollAnchor(anchor, options = {}) {
    if (!anchor || !isViewingMain()) return;

    const anchorLine = clampAnchorLine(anchor.line ?? getAnchorLine());
    const rect = anchor.type === 'text'
        ? getTextRect(anchor.node, anchor.offset)
        : anchor.el?.getBoundingClientRect();

    if (!rect) return;

    let offset = anchor.offset;
    if (anchor.type === 'text' && typeof anchor.offsetY === 'number') {
        offset = anchor.offsetY;
    } else if (anchor.preferRatio && anchor.offsetRatio != null && rect.height > 0) {
        offset = rect.height * anchor.offsetRatio;
    }

    const desiredTop = anchorLine - offset;
    const delta = rect.top - desiredTop;
    if (Math.abs(delta) < 0.5) return;

    window.scrollBy({ top: delta, behavior: options.behavior || 'auto' });
}
