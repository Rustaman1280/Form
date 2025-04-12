// Optional JavaScript
// For this setup, CSS handles the fade-in and looping animations.
// You could add JS later for more complex interactions if needed.

document.addEventListener('DOMContentLoaded', () => {
    console.log("Website loaded and animations started via CSS.");
    // Example: Add class after delay (if CSS animation wasn't used for fade-in)
    // setTimeout(() => {
    //    document.body.classList.add('loaded');
    // }, 100); // Small delay
});

// If you used a class for fade-in in CSS instead of animating body directly:
// style.css might have:
// body { opacity: 0; transition: opacity 1.5s ease-out; }
// body.loaded { opacity: 1; }