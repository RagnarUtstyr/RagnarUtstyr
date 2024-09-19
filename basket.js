// Helper function to get cookie value
function getCookie(name) {
    let value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
}

// Helper function to set cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Add item to basket function
function addToBasket(itemName, maxQuantity) {
    let basket = JSON.parse(getCookie('basket') || '{}');
    if (!basket[itemName]) {
        basket[itemName] = 1;  // Start with 1 item
    } else {
        if (basket[itemName] < maxQuantity) {
            basket[itemName]++;
        } else {
            alert("You cannot add more than " + maxQuantity + " of this item.");
        }
    }
    setCookie('basket', JSON.stringify(basket), 7);  // Save for 7 days
    updateBasketIcon();
}

// Update the basket icon with item count
function updateBasketIcon() {
    let basket = JSON.parse(getCookie('basket') || '{}');
    let totalItems = 0;

    for (let item in basket) {
        totalItems += basket[item];
    }

    document.getElementById('basket-icon-count').textContent = totalItems;
}

// Update basket page display (for the dedicated basket page)
function updateBasketPage() {
    let basket = JSON.parse(getCookie('basket') || '{}');
    let basketItems = document.getElementById('basket-items');
    let totalItems = 0;
    basketItems.innerHTML = ''; // Clear basket list

    for (let item in basket) {
        let li = document.createElement('li');
        li.textContent = `${item} (x${basket[item]})`;
        basketItems.appendChild(li);
        totalItems += basket[item];
    }

    document.getElementById('basket-total').textContent = totalItems;
}

// Submit inquiry button click handler (only on the basket page)
function submitInquiry() {
    let basket = JSON.parse(getCookie('basket') || '{}');
    if (Object.keys(basket).length === 0) {
        alert("Your basket is empty.");
        return;
    }

    let message = "You have selected the following items:\n\n";
    for (let item in basket) {
        message += `${item}: ${basket[item]} units\n`;
    }

    // Mailto logic (you can replace with actual email sending logic)
    let subject = encodeURIComponent("Product Inquiry");
    let body = encodeURIComponent(message);
    window.location.href = `mailto:sales@example.com?subject=${subject}&body=${body}`;

    // Clear the basket after submission
    setCookie('basket', '{}', 7);  // Clear basket
    updateBasketPage();  // Update the basket display on the page
}

// Ensure the basket icon is updated on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('basket-icon-count')) {
        updateBasketIcon(); // Update the icon count on all pages
    }

    // If on the basket page, update the detailed basket
    if (document.getElementById('basket-items')) {
        updateBasketPage(); // Update the detailed basket display
    }

    // Attach the submit inquiry handler if on the basket page
    let submitButton = document.getElementById('submit-inquiry');
    if (submitButton) {
        submitButton.addEventListener('click', submitInquiry);
    }
});
