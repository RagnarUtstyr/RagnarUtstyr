// Basket functionality
const basket = {};

document.querySelectorAll('.add-to-basket').forEach(button => {
    button.addEventListener('click', () => {
        const itemName = button.getAttribute('data-item');

        // Add to basket or increase quantity
        if (basket[itemName]) {
            basket[itemName].quantity += 1;
        } else {
            basket[itemName] = { quantity: 1 };
        }

        updateBasket();
    });
});

function updateBasket() {
    const basketItems = document.getElementById('basket-items');
    basketItems.innerHTML = '';

    for (const [itemName, itemData] of Object.entries(basket)) {
        const itemElement = document.createElement('li');
        itemElement.classList.add('basket-item');

        const quantityControls = `
            <div class="item-quantity">
                <button class="decrease-quantity" data-item="${itemName}">-</button>
                <span>${itemData.quantity}</span>
                <button class="increase-quantity" data-item="${itemName}">+</button>
            </div>
        `;

        itemElement.innerHTML = `
            <span>${itemName}</span>
            ${quantityControls}
            <button class="remove-item" data-item="${itemName}">🗑️</button>
        `;

        basketItems.appendChild(itemElement);
    }

    // Add event listeners for quantity controls and remove buttons
    document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', () => {
            const itemName = button.getAttribute('data-item');
            basket[itemName].quantity += 1;
            updateBasket();
        });
    });

    document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', () => {
            const itemName = button.getAttribute('data-item');
            if (basket[itemName].quantity > 1) {
                basket[itemName].quantity -= 1;
            } else {
                delete basket[itemName];
            }
            updateBasket();
        });
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', () => {
            const itemName = button.getAttribute('data-item');
            delete basket[itemName];
            updateBasket();
        });
    });
}

// Clear basket button
document.getElementById('clear-basket').addEventListener('click', () => {
    Object.keys(basket).forEach(item => delete basket[item]);
    updateBasket();
});
