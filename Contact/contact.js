// Load the EmailJS SDK
<script src="https://cdn.emailjs.com/dist/email.min.js"></script>

<script>
  // Initialize EmailJS with your User ID
  (function() {
    emailjs.init("jEPsmc03XiqQMqiy5");
  })();
</script>

<script>
  // Add event listener to the form
  document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission behavior

    // Collect form data
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const fromDate = document.getElementById('from-date').value;
    const toDate = document.getElementById('to-date').value;
    const message = document.getElementById('message').value;

    // Send form data to EmailJS
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
</script>
