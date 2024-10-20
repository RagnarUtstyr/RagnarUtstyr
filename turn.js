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

    // If there are no items left, do nothing
    if (listItems.length === 0) {
        currentHighlightIndex = 0; // Reset the index to 0 if the list is empty
        return;
    }

    // If the current item was removed, shift the highlight to the next item
    if (currentHighlightIndex >= listItems.length) {
        currentHighlightIndex = Math.min(currentHighlightIndex, listItems.length - 1); // Move to the last item if necessary
    }

    // Reapply highlight to the current item
    highlightCurrentEntry();
}

function removeEntry(listItem) {
    const listItems = document.querySelectorAll('#rankingList li');
    const indexToRemove = Array.from(listItems).indexOf(listItem);

    // Remove the DOM element
    listItem.remove();

    // Adjust the highlight index if needed
    if (currentHighlightIndex >= indexToRemove) {
        currentHighlightIndex = Math.max(0, currentHighlightIndex - 1); // Move the highlight up if needed
    }

    // Refresh the highlight after removal
    refreshHighlightAfterRemoval(); 
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

    // Highlight the first item when the page loads, if there are any items
    highlightCurrentEntry();
});
