// Add item to basket using LocalStorage and enforce maxQuantity
function addToBasket(itemName, maxQuantity) {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');

    // Initialize item in the basket if it doesn't exist
    if (!basket[itemName]) {
        basket[itemName] = 1;  // Start with 1 item
    } else {
        if (basket[itemName] < maxQuantity) {
            basket[itemName]++;
        } else {
            alert(`You cannot add more than ${maxQuantity} of ${itemName}.`);
            return;
        }
    }

    // Save updated basket to LocalStorage
    localStorage.setItem('basket', JSON.stringify(basket));
    updateBasketIcon(); // Update basket icon with item count
    updateBasketPage(); // Re-render basket items on the basket page
}

// Remove item from the basket
function removeFromBasket(itemName) {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');

    // If the item exists in the basket, remove it
    if (basket[itemName]) {
        delete basket[itemName]; // Remove the item completely
    }

    // Save the updated basket to LocalStorage
    localStorage.setItem('basket', JSON.stringify(basket));
    updateBasketIcon(); // Update the basket icon count
    updateBasketPage(); // Re-render the basket page
}

// Empty the entire basket
function emptyCart() {
    // Clear the basket in LocalStorage
    localStorage.setItem('basket', '{}');
    updateBasketIcon();  // Update the basket icon count
    updateBasketPage();  // Re-render the basket page to show it's empty
}

// Update the basket icon with the total item count using LocalStorage
function updateBasketIcon() {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');
    let totalItems = 0;

    // Calculate the total number of items in the basket
    for (let item in basket) {
        if (basket.hasOwnProperty(item)) {
            totalItems += basket[item];
        }
    }

    // Update the basket icon with the total item count
    let basketIconCount = document.getElementById('basket-icon-count');
    if (basketIconCount) {
        basketIconCount.textContent = totalItems;
    }
}

// Update the basket page display with input fields for quantity control
function updateBasketPage() {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');
    let basketItems = document.getElementById('basket-items');

    if (basketItems) {
        basketItems.innerHTML = ''; // Clear the current list of basket items

        // Display each item in the basket with input for quantity control
        for (let item in basket) {
            if (basket.hasOwnProperty(item)) {
                let li = document.createElement('li');
                li.innerHTML = `
                    <div class="basket-item-content">
                        <span class="item-name">${item}</span>
                        <div class="quantity-controls">
                            <button class="decrease" onclick="changeQuantity('${item}', ${basket[item]} - 1)">-</button>
                            <input 
                                type="number" 
                                class="quantity-input"
                                value="${basket[item]}" 
                                min="1" 
                                onchange="changeQuantity('${item}', this.value)"
                            >
                            <button class="increase" onclick="changeQuantity('${item}', ${basket[item]} + 1)">+</button>
                            <button class="remove" onclick="removeFromBasket('${item}')">
                                <img src="images/bin.png" alt="Remove" style="width: 20px; height: 20px;">
                            </button>
                        </div>
                    </div>
                `;
                basketItems.appendChild(li);
            }
        }

        // Update the total number of items in the basket
        let totalItems = Object.values(basket).reduce((a, b) => a + b, 0);
        document.getElementById('basket-total').textContent = totalItems;
    }
}

// Change quantity based on user input
function changeQuantity(itemName, newQuantity) {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');
    let quantity = parseInt(newQuantity);

    // Ensure the input quantity is valid (at least 1)
    if (isNaN(quantity) || quantity < 1) {
        quantity = 1; // Set a minimum of 1 if the input is invalid
    }

    // Update the basket with the new quantity
    basket[itemName] = quantity;
    localStorage.setItem('basket', JSON.stringify(basket));
    updateBasketIcon(); // Update the basket icon count
    updateBasketPage(); // Re-render the basket page with the new quantity
}

// Generate and download the basket contents as a PDF file
function downloadBasket() {
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');

    // If the basket is empty, alert the user
    if (Object.keys(basket).length === 0) {
        alert("Your basket is empty.");
        return;
    }

    // Prepare the content of the basket as styled HTML
    let basketContent = `
        <div style="font-family: 'Poppins', sans-serif; color: white; background-color: #333; padding: 20px; border-radius: 10px;">
            <h1 style="color: #ffcc00; text-align: center;">Your Basket Inquiry</h1>
            <ul style="list-style-type: none; padding: 0; font-size: 16px; background-color: #333;">`;

    for (let item in basket) {
        if (basket.hasOwnProperty(item)) {
            basketContent += `
                <li style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ffcc00;">
                    <span style="flex-grow: 1; text-align: left;">${item}</span>
                    <span style="text-align: right;">${basket[item]} units</span>
                </li>`;
        }
    }

    basketContent += `</ul></div>`;

    // Create a container element for the PDF content
    let pdfContainer = document.createElement('div');
    pdfContainer.innerHTML = basketContent;

    // Use html2pdf to generate and download the PDF with no margins
    html2pdf(pdfContainer, {
        margin: 0,  // Full-page background
        filename: 'basket_inquiry.pdf',
        html2canvas: { scale: 2, backgroundColor: "#333" },  // Grey background
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    });
}

// Ensure the basket icon and page are updated on page load
document.addEventListener('DOMContentLoaded', function() {
    // If basket icon is present, update its count
    if (document.getElementById('basket-icon-count')) {
        updateBasketIcon();
    }

    // If on the basket page, update the basket items display
    if (document.getElementById('basket-items')) {
        updateBasketPage();
    }

    // Attach the download basket handler if the submit button is present
    let submitButton = document.getElementById('submit-inquiry');
    if (submitButton) {
        submitButton.addEventListener('click', downloadBasket);
    }

    // Attach the empty cart handler if the empty cart button is present
    let emptyCartButton = document.getElementById('empty-cart');
    if (emptyCartButton) {
        emptyCartButton.addEventListener('click', emptyCart);
    }
});
