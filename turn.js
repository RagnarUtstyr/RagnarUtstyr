let currentHighlightIndex = 0;

function highlightCurrentEntry() {
    const listItems = document.querySelectorAll('#rankingList li');

    // If there are no items, exit the function
    if (listItems.length === 0) {
        return;
    }

    // Ensure currentHighlightIndex is within bounds
    if (currentHighlightIndex >= listItems.length) {
        currentHighlightIndex = listItems.length - 1; // Move to the last available item
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
        currentHighlightIndex = 0; // Reset the index to 0 if the list is empty
        return;
    }

    // If the current item was removed, shift the highlight down
    if (currentHighlightIndex >= listItems.length) {
        currentHighlightIndex = listItems.length - 1; // Move to the last item
    }

    // Reapply highlight to the current item
    highlightCurrentEntry();
}

function removeEntry(id, listItem) {
    // Simulate removing from database (assuming `remove` is a function you have)
    listItem.remove(); // Remove the DOM element

    // Check if the removed item was the highlighted one
    refreshHighlightAfterRemoval(); // Refresh highlight after removal
}

document.addEventListener('DOMContentLoaded', () => {
    // Attach event listener to "Next" button
    const nextButton = document.getElementById('next-button');
    if (nextButton) {
        nextButton.addEventListener('click', moveToNextEntry);
    }

    // Highlight the first item when the page loads, if there are any items
    highlightCurrentEntry();  // Ensure the first item is highlighted
});
