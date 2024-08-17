document.addEventListener('DOMContentLoaded', function() {
    console.log('JavaScript is running');

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    document.body.appendChild(lightbox);

    document.addEventListener('click', function(event) {
        console.log('Clicked element:', event.target);

        // Update this condition to match the correct class
        if (event.target.classList.contains('interactive-image')) {
            console.log('Image clicked!');

            const img = document.createElement('img');
            img.src = event.target.src;
            while (lightbox.firstChild) {
                lightbox.removeChild(lightbox.firstChild);
            }
            lightbox.appendChild(img);
            lightbox.style.display = 'flex';

            document.body.classList.add('no-scroll');
        }
    });

    lightbox.addEventListener('click', () => {
        lightbox.style.display = 'none';

	document.body.classList.remove('no-scroll');
    });
});

let clickCount = 0;
const secretText = document.getElementById('key');

secretText.addEventListener('click', () => {
    clickCount++;
    
    if (clickCount > 9) {
	clickCount == 0;
        window.location.href = 'button.html'; // Replace with your desired URL
    }
});