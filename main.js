// Initialize the slide index to the first slide (index 0)
let slideIndex = 0;

// Select all slides and dots
let slides = document.querySelectorAll(".slide");
let dots = document.querySelectorAll(".dot");

// Get the total number of slides
let totalSlides = slides.length;

// Function to show the current slide based on the slide index
function showSlides() {
    // Calculate the new position to translate the carousel
    let carousel = document.querySelector('.carousel');
    
    // Increment the slide index
    slideIndex++;
    
    // If the slide index exceeds the total slides, reset it to the first slide
    if (slideIndex >= totalSlides) {
        slideIndex = 0;
    }

    // Apply the transform property to slide the images to the left
    carousel.style.transform = `translateX(${-slideIndex * 100}%)`;

    // Update the active class for the dots (pagination indicator)
    dots.forEach(dot => dot.classList.remove("active"));
    dots[slideIndex].classList.add("active");
}

// Start the slideshow, change the slide every 3 seconds (3000 ms)
setInterval(showSlides, 5000);

// Function to show the selected slide when clicking on dots (pagination)
function currentSlide(n) {
    let carousel = document.querySelector('.carousel');
    
    // Update the slide index based on the dot clicked
    slideIndex = n - 1;

    // Slide to the selected image
    carousel.style.transform = `translateX(${-slideIndex * 100}%)`;

    // Update the active class for the dots
    dots.forEach(dot => dot.classList.remove("active"));
    dots[slideIndex].classList.add("active");
}

// Add event listeners to the dots to manually select a slide when clicked
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentSlide(index + 1);
    });
});
