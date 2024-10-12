let currentHighlightIndex = 0;

function highlightCurrentEntry() {
    const listItems = document.querySelectorAll('#rankingList li');

    // If there are no items, exit the function
    if (listItems.length === 0) {
        return;
    }

    // Ensure currentHighlightIndex is within bounds
    if (currentHighlightIndex >= listItems.length) {
        currentHighlightIndex = 0; // Reset to first item if out of bounds
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

    // Move to the next item, or loop back to the first if at the end
    currentHighlightIndex = (currentHighlightIndex + 1) % listItems.length;

    // Apply the new highlight
    highlightCurrentEntry();
}

function refreshHighlightAfterRemoval() {
    const listItems = document.querySelectorAll('#rankingList li');

    // If there are no items left, do nothing
    if (listItems.length === 0) {
        return;
    }

    // Adjust currentHighlightIndex if necessary
    if (currentHighlightIndex >= listItems.length) {
        currentHighlightIndex = 0; // Reset to first item if out of bounds
    }

    // Reapply highlight to the current item
    highlightCurrentEntry();
}

function removeEntry(id, listItem) {
    // Simulate removing from database (assuming `remove` is a function you have)
    listItem.remove(); // Remove the DOM element
    refreshHighlightAfterRemoval(); // Refresh highlight after removal
}

document.addEventListener('DOMContentLoaded', () => {
    // Attach event listener to "Next" button
    const nextButton = document.getElementById('next-button');
    if (nextButton) {
        nextButton.addEventListener('click', moveToNextEntry);
    }

    // Highlight the first item when the page loads, if there are any items
    highlightCurrentEntry();
});
