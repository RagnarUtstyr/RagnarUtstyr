let currentHighlightIndex = 0;

// === Round counter (increments each time the list cycles back to the top) ===
window.roundCounter = window.roundCounter ?? 1;

window.updateRoundDisplay = function updateRoundDisplay() {
    const el = document.getElementById('round-value');
    if (el) el.textContent = window.roundCounter;
};

window.resetRoundCounter = function resetRoundCounter() {
    window.roundCounter = 1;
    window.updateRoundDisplay();
};

function highlightCurrentEntry() {
    const listItems = document.querySelectorAll('#rankingList li');

    // If there are no items, exit the function
    if (listItems.length === 0) {
        return;
    }

    // Ensure currentHighlightIndex is within bounds
    if (currentHighlightIndex >= listItems.length) {
        currentHighlightIndex = Math.min(currentHighlightIndex, listItems.length - 1); // Stay within bounds
    }

    // Remove highlight from all items
    listItems.forEach(item => item.classList.remove('highlighted'));

    // Highlight the current item
    listItems[currentHighlightIndex].classList.add('highlighted');
}

function moveToNextEntry() {
    const listItems = document.querySelectorAll('#rankingList li');

    // If there are no items, exit the function
    if (listItems.length === 0) {
        return;
    }

    // If we're currently on the last item, wrapping will start a new round
    const wasLast = currentHighlightIndex === listItems.length - 1;

    // Move to the next item, or loop back to the first if at the end
    currentHighlightIndex = (currentHighlightIndex + 1) % listItems.length;

    // If we wrapped from last back to first, increment the round counter
    if (wasLast && currentHighlightIndex === 0) {
        window.roundCounter = (window.roundCounter ?? 1) + 1;
        window.updateRoundDisplay?.();
    }

    // Apply the new highlight
    highlightCurrentEntry();
}

function moveToPreviousEntry() {
    const listItems = document.querySelectorAll('#rankingList li');

    // If there are no items, exit the function
    if (listItems.length === 0) {
        return;
    }

    // Move to the previous item, or loop to the last if at the beginning
    currentHighlightIndex = (currentHighlightIndex - 1 + listItems.length) % listItems.length;

    // Apply the new highlight
    highlightCurrentEntry();
}

function refreshHighlightAfterRemoval() {
    const listItems = document.querySelectorAll('#rankingList li');

    // If there are no items left, reset
    if (listItems.length === 0) {
        currentHighlightIndex = 0;
        return;
    }

    // If the current highlighted item was removed, adjust the index
    if (currentHighlightIndex >= listItems.length) {
        currentHighlightIndex = Math.min(currentHighlightIndex, listItems.length - 1); // Stay within bounds
    }

    // Apply highlight to the new current item
    highlightCurrentEntry();
}

function removeEntry(listItem) {
    const listItems = document.querySelectorAll('#rankingList li');
    const indexToRemove = Array.from(listItems).indexOf(listItem);

    // Remove the DOM element
    listItem.remove();

    // Adjust the highlight index if the highlighted item was removed
    if (currentHighlightIndex >= indexToRemove) {
        currentHighlightIndex = Math.max(0, currentHighlightIndex - 1); // Move the highlight up if needed
    }

    // Refresh the highlight after removal
    refreshHighlightAfterRemoval();
}

// Ensure that highlighting is always applied after DOM changes or button clicks
function ensureHighlightAlwaysVisible() {
    const observer = new MutationObserver(() => {
        highlightCurrentEntry(); // Reapply highlight after any DOM changes
    });

    // Observe the list for any changes (additions, deletions, etc.)
    const listElement = document.getElementById('rankingList');
    if (listElement) {
        observer.observe(listElement, { childList: true, subtree: false });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Attach event listener to "Next" button
    const nextButton = document.getElementById('next-button');
    if (nextButton) {
        nextButton.addEventListener('click', moveToNextEntry);
    }

    // Attach event listener to "Previous" button (if applicable)
    const prevButton = document.getElementById('prev-button');
    if (prevButton) {
        prevButton.addEventListener('click', moveToPreviousEntry);
    }

    // Ensure the first item is highlighted when the page loads
    highlightCurrentEntry();
    window.updateRoundDisplay?.();

    // Ensure the highlight stays visible even when the DOM changes
    ensureHighlightAlwaysVisible();
});