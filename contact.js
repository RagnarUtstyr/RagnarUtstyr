// Handle form submission
document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    // Get form values
    let from_name = document.getElementById('name').value;
    let from_email = document.getElementById('email').value;
    let from_date = document.getElementById('from_date').value;
    let to_date = document.getElementById('to_date').value;
    let message = document.getElementById('message').value;

    // Get basket items from localStorage and prepare as an array
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');
    let basketItemsArray = [];

    for (let item in basket) {
        if (basket.hasOwnProperty(item)) {
            basketItemsArray.push({
                item_name: item,
                quantity: basket[item]
            });
        }
    }

    // Prepare the email parameters
    let templateParams = {
        from_name: from_name,
        from_email: from_email,
        from_date: from_date,
        to_date: to_date,
        message: message,
        basket_items: basketItemsArray.length > 0 ? basketItemsArray : null
    };

    // Send the email using EmailJS
    emailjs.send('service_2gyl3vr', 'template_ijqjjne', templateParams)
        .then(function(response) {
            alert('Your inquiry has been sent successfully!');
            document.getElementById('contact-form').reset(); // Reset the form
        }, function(error) {
            alert('There was an error sending your inquiry. Please try again later.');
            console.error('EmailJS Error:', error);
        });
});
// Initialize EmailJS
emailjs.init('jEPsmc03XiqQMqiy5'); // Replace with your actual User ID

// Handle form submission
document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Your form handling and email sending code
});
