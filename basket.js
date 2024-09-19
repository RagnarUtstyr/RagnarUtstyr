// Add item to basket using LocalStorage
function addToBasket(itemName) {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');
    if (!basket[itemName]) {
        basket[itemName] = 1;  // Start with 1 item
    } else {
        basket[itemName]++;  // Increment the quantity
    }
    localStorage.setItem('basket', JSON.stringify(basket));  // Save in LocalStorage
    updateBasketIcon();
    updateBasketPage(); // Re-render the basket immediately
}

// Remove an item or decrease quantity from the basket
function removeFromBasket(itemName) {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');
    if (basket[itemName]) {
        basket[itemName]--;  // Decrement the quantity
        if (basket[itemName] === 0) {
            delete basket[itemName]; // Remove the item if quantity is 0
        }
        localStorage.setItem('basket', JSON.stringify(basket));  // Update the basket in LocalStorage
        updateBasketIcon();
        updateBasketPage(); // Re-render the basket immediately
    }
}

// Update the basket icon with item count using LocalStorage
function updateBasketIcon() {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');
    let totalItems = 0;

    for (let item in basket) {
        totalItems += basket[item];
    }

    document.getElementById('basket-icon-count').textContent = totalItems;
}

// Re-render the basket page with individual quantity controls
function updateBasketPage() {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');
    let basketItems = document.getElementById('basket-items');
    let totalItems = 0;
    basketItems.innerHTML = ''; // Clear basket list

    // Display each item in the basket with quantity controls
    for (let item in basket) {
        let li = document.createElement('li');
        li.id = `item-${item}`; // Assign unique ID for each item
        li.innerHTML = `
            ${item} (x<span id="quantity-${item}">${basket[item]}</span>)
            <button class="increase" onclick="addToBasket('${item}')">+</button>
            <button class="decrease" onclick="removeFromBasket('${item}')">-</button>
        `;
        basketItems.appendChild(li);
        totalItems += basket[item];
    }

    document.getElementById('basket-total').textContent = totalItems;
}

// Generate and download the basket contents as a .txt file
function downloadBasket() {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');
    if (Object.keys(basket).length === 0) {
        alert("Your basket is empty.");
        return;
    }

    // Generate the text content
    let textContent = "Your Basket Inquiry:\n\n";
    for (let item in basket) {
        textContent += `${item}: ${basket[item]} units\n`;
    }

    // Create a blob with the text content
    let blob = new Blob([textContent], { type: "text/plain" });

    // Create a link element and set the download attribute
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "basket_inquiry.txt";

    // Append the link, trigger the download, and remove the link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Optionally, clear the basket after download
    localStorage.setItem('basket', '{}');
    updateBasketPage(); // Update the basket display on the page
}

// Ensure the basket icon is updated on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('basket-icon-count')) {
        updateBasketIcon(); // Update the icon count on all pages
    }

    // If on the basket page, update the detailed basket
    if (document.getElementById('basket-items')) {
        updateBasketPage(); // Re-render the detailed basket display on load
    }

    // Attach the download basket handler if on the basket page
    let submitButton = document.getElementById('submit-inquiry');
    if (submitButton) {
        submitButton.addEventListener('click', downloadBasket);
    }
});
