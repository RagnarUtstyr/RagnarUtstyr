// Initialize EmailJS
emailjs.init('jEPsmc03XiqQMqiy5'); // Replace with your actual User ID from EmailJS

// Handle form submission
document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    // Get form values
    let from_name = document.getElementById('name').value;
    let from_email = document.getElementById('email').value;
    let from_date = document.getElementById('from_date').value;
    let to_date = document.getElementById('to_date').value;
    let message = document.getElementById('message').value;

    // Get basket items from localStorage
    let basket = JSON.parse(localStorage.getItem('basket') || '{}');
    let basketContent = '';
    for (let item in basket) {
        if (basket.hasOwnProperty(item)) {
            basketContent += `${item}: ${basket[item]} units\n`;
        }
    }

    if (basketContent === '') {
        basketContent = 'Basket is empty.';
    }

    // Debugging: Log basket content
    console.log('Basket Content:', basketContent);

    // Prepare the email parameters
    let templateParams = {
        from_name: from_name,
        from_email: from_email,
        from_date: from_date,
        to_date: to_date,
        message: message,
        basket_items: basketContent
    };

    // Debugging: Log template parameters
    console.log('Template Parameters:', templateParams);

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
