<script src="https://cdn.emailjs.com/dist/email.min.js"></script>
<script>
  // Initialize EmailJS with your User ID (this is provided by EmailJS)
  (function() {
    emailjs.init("jEPsmc03XiqQMqiy5"); // Replace with your EmailJS User ID
  })();
</script>

<script>
  document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission behavior
    
    // Collect form data
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const from = document.getElementById('from-date').value;
    const to = document.getElementById('to-date').value;
    const message = document.getElementById('message').value;

    emailjs.send('service_2gyl3vr', 'template_ijqjjne', {
      name: name,
      email: email,
      from_date: from,
      to_date: to,
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
