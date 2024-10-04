// search.js

document.addEventListener("DOMContentLoaded", function() {
    // Attach event listener to the search input field
    const searchField = document.getElementById("search-field");
    if (searchField) {
        searchField.addEventListener("keyup", filterItems);
    }
});

function filterItems() {
    // Get the search input value and split it into individual words
    let searchValue = document.getElementById("search-field").value.toLowerCase().trim();
    let searchWords = searchValue.split(/\s+/); // Split by whitespace

    // Get all equipment cards
    let equipmentCards = document.querySelectorAll(".content-grid .nav-card");

    // Loop through all cards and hide those that don't match all search words
    equipmentCards.forEach(function(card) {
        let itemName = card.querySelector("h2").textContent.toLowerCase();
        let keywords = card.getAttribute("data-keywords");
        keywords = keywords ? keywords.toLowerCase() : ""; // Default to empty string if null

        // Combine the item name and keywords for the search
        let searchableText = itemName + " " + keywords;

        // Check if every word in the search matches part of the combined text
        let matches = searchWords.every(function(word) {
            return searchableText.includes(word);
        });

        if (matches) {
            card.style.display = "flex"; // Show matching items (using 'flex' to match existing styling)
        } else {
            card.style.display = "none"; // Hide non-matching items
        }
    });
}
