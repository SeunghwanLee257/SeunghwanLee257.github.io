// LatticA Blind Auction Deck
// 경매 플랫폼용 비공개 입찰 솔루션

const slideFiles = [
    'slides/slide1.html',
    'slides/slide2.html',
    'slides/slide3.html',
    'slides/slide4.html',
    'slides/slide5.html',
    'slides/slide6.html',
    'slides/slide7.html',
];

let currentSlide = 1;
let totalSlides = slideFiles.length;

async function loadSlides() {
    const container = document.getElementById('deckContainer');
    container.innerHTML = '';

    for (let i = 0; i < slideFiles.length; i++) {
        try {
            const response = await fetch(slideFiles[i]);
            if (response.ok) {
                const html = await response.text();
                container.insertAdjacentHTML('beforeend', html);
            } else {
                container.insertAdjacentHTML('beforeend', `
                    <div class="slide" data-slide="${i + 1}">
                        <div class="slide-inner">
                            <h2>Slide ${i + 1}</h2>
                            <p>Failed to load: ${slideFiles[i]}</p>
                        </div>
                    </div>
                `);
            }
        } catch (error) {
            console.error(`Error loading ${slideFiles[i]}:`, error);
        }
    }

    updateSlide();
    generateThumbnails();
}

function updateSlide() {
    document.querySelectorAll('.slide').forEach((slide, index) => {
        slide.classList.remove('active');
        if (index + 1 === currentSlide) {
            slide.classList.add('active');
        }
    });

    document.getElementById('slideCounter').textContent = `${currentSlide} / ${totalSlides}`;

    document.querySelectorAll('.thumbnail-item').forEach((thumb, index) => {
        thumb.classList.toggle('active', index + 1 === currentSlide);
    });
}

function nextSlide() {
    if (currentSlide < totalSlides) {
        currentSlide++;
        updateSlide();
    }
}

function prevSlide() {
    if (currentSlide > 1) {
        currentSlide--;
        updateSlide();
    }
}

function goToSlide(num) {
    if (num >= 1 && num <= totalSlides) {
        currentSlide = num;
        updateSlide();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
    } else if (e.key === 'Home') {
        e.preventDefault();
        currentSlide = 1;
        updateSlide();
    } else if (e.key === 'End') {
        e.preventDefault();
        currentSlide = totalSlides;
        updateSlide();
    }
});

function generateThumbnails() {
    const list = document.getElementById('thumbnailList');
    list.innerHTML = '';

    for (let i = 1; i <= totalSlides; i++) {
        const thumb = document.createElement('div');
        thumb.className = 'thumbnail-item' + (i === currentSlide ? ' active' : '');
        thumb.innerHTML = `<span class="thumb-num">${i}</span>`;
        thumb.onclick = () => goToSlide(i);
        list.appendChild(thumb);
    }
}

function toggleThumbnailPanel() {
    document.getElementById('thumbnailPanel').classList.toggle('active');
}

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
        if (diff > 0) nextSlide();
        else prevSlide();
    }
}, { passive: true });

document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadSlides();
});
