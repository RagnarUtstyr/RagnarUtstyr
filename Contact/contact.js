// Initialize EmailJS
(function() {
  emailjs.init("jEPsmc03XiqQMqiy5"); // Your EmailJS User ID
})();

// Add event listener to the form
document.getElementById('contactForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the form from submitting normally

  // Collect form data
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const fromDate = document.getElementById('from-date').value;
  const toDate = document.getElementById('to-date').value;
  const message = document.getElementById('message').value;

  // Send the form data to EmailJS
  emailjs.send('service_2gyl3vr', 'template_ijqjjne', {
    name: name,
    email: email,
    from_date: fromDate,
    to_date: toDate,
    message: message
  }).then(function(response) {
    console.log('SUCCESS!', response.status, response.text);
    alert('Your message has been sent successfully!');
  }, function(error) {
    console.log('FAILED...', error);
    alert('Failed to send message. Please try again later.');
  });
});
