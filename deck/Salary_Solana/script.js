// Compliance-Ready Confidential Transfer Deck - LatticA
// Modular slide loading with edit capabilities

const slideFiles = [
    'slides/slide1.html',
    'slides/slide2.html',
    'slides/slide3.html',
    'slides/slide4.html',
    'slides/slide5.html',
    'slides/slide6.html',
    'slides/slide7.html'
];

let currentSlide = 1;
let totalSlides = slideFiles.length;
let isEditMode = false;
let undoStack = [];
let redoStack = [];

// Load all slides
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
                console.error(`Failed to load ${slideFiles[i]}`);
                // Create placeholder
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

// Slide Navigation
function updateSlide() {
    document.querySelectorAll('.slide').forEach((slide, index) => {
        slide.classList.remove('active');
        if (index + 1 === currentSlide) {
            slide.classList.add('active');
        }
    });

    document.getElementById('slideCounter').textContent = `${currentSlide} / ${totalSlides}`;

    // Update thumbnail active state
    document.querySelectorAll('.thumbnail-item').forEach((thumb, index) => {
        thumb.classList.toggle('active', index + 1 === currentSlide);
    });

    // Update layer panel if in edit mode
    if (isEditMode) {
        updateLayerPanel();
    }
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

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.target.isContentEditable) return;

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
    } else if (e.key === 'e' && e.ctrlKey) {
        e.preventDefault();
        toggleEditMode();
    } else if (e.key === 'z' && e.ctrlKey) {
        e.preventDefault();
        undo();
    } else if (e.key === 'y' && e.ctrlKey) {
        e.preventDefault();
        redo();
    }
});

// Thumbnail Panel
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

// Edit Mode
function toggleEditMode() {
    isEditMode = !isEditMode;
    document.body.classList.toggle('edit-mode', isEditMode);
    document.getElementById('editBtn').classList.toggle('active', isEditMode);
    document.getElementById('editToolbar').classList.toggle('active', isEditMode);
    document.getElementById('layerPanel').classList.toggle('active', isEditMode);
    document.getElementById('thumbnailPanel').classList.toggle('active', isEditMode);

    if (isEditMode) {
        enableEditing();
    } else {
        disableEditing();
    }
}

function enableEditing() {
    // Make text elements editable
    document.querySelectorAll('.slide h1, .slide h2, .slide h3, .slide h4, .slide p, .slide span, .slide li').forEach(el => {
        if (!el.closest('button') && !el.closest('a')) {
            el.setAttribute('contenteditable', 'true');
            el.addEventListener('input', saveState);
        }
    });

    updateLayerPanel();
}

function disableEditing() {
    document.querySelectorAll('[contenteditable]').forEach(el => {
        el.removeAttribute('contenteditable');
    });
}

function updateLayerPanel() {
    const list = document.getElementById('layerList');
    const activeSlide = document.querySelector('.slide.active');
    if (!activeSlide) return;

    list.innerHTML = '';
    const elements = activeSlide.querySelectorAll('h1, h2, h3, h4, p, img, .card, .badge');

    elements.forEach((el, index) => {
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.style.cssText = 'padding: 8px 12px; border-bottom: 1px solid var(--card-border); cursor: pointer; font-size: 12px; color: var(--text-gray);';
        item.textContent = `${el.tagName.toLowerCase()}: ${el.textContent.slice(0, 20)}...`;
        item.onclick = () => {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
        list.appendChild(item);
    });
}

// Editing Commands
function execCommand(command) {
    document.execCommand(command, false, null);
}

function changeFontSize(size) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size;
        range.surroundContents(span);
    }
}

function changeColor(color) {
    document.execCommand('foreColor', false, color);
}

function setAnimation(animation) {
    const selection = window.getSelection();
    if (selection.anchorNode) {
        const element = selection.anchorNode.parentElement;
        if (element) {
            element.className = element.className.replace(/fade-in|slide-left|slide-right|slide-up|scale-up|bounce/g, '').trim();
            if (animation) {
                element.classList.add(animation);
            }
        }
    }
}

// Undo/Redo
function saveState() {
    const content = document.getElementById('deckContainer').innerHTML;
    undoStack.push(content);
    redoStack = [];
}

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(document.getElementById('deckContainer').innerHTML);
        document.getElementById('deckContainer').innerHTML = undoStack.pop();
        updateSlide();
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(document.getElementById('deckContainer').innerHTML);
        document.getElementById('deckContainer').innerHTML = redoStack.pop();
        updateSlide();
    }
}

// Export HTML
function exportHTML() {
    const content = document.getElementById('deckContainer').innerHTML;
    const blob = new Blob([`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Exported Deck</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="deck-container">
        ${content}
    </div>
</body>
</html>
    `], { type: 'text/html' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deck-export.html';
    a.click();
    URL.revokeObjectURL(url);
}

// PDF Download
async function downloadPDF() {
    const downloadBtn = document.getElementById('downloadBtn');
    const originalHTML = downloadBtn.innerHTML;

    downloadBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin">
            <circle cx="12" cy="12" r="10" stroke-dasharray="30" stroke-dashoffset="10"></circle>
        </svg>
        Generating...
    `;
    downloadBtn.disabled = true;

    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }';
    document.head.appendChild(style);

    // Add PDF export mode class
    document.body.classList.add('pdf-export-mode');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720],
        hotfixes: ['px_scaling']
    });

    const slides = document.querySelectorAll('.slide');
    const originalSlide = currentSlide;

    // Convert all SVG images to data URLs for better rendering
    const svgImages = document.querySelectorAll('img[src$=".svg"]');
    const originalSrcs = [];

    for (const img of svgImages) {
        originalSrcs.push(img.src);
        try {
            const response = await fetch(img.src);
            const svgText = await response.text();
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            img.src = url;
        } catch (e) {
            console.warn('Could not convert SVG:', img.src);
        }
    }

    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
        for (let i = 0; i < slides.length; i++) {
            // Show only current slide
            slides.forEach(s => {
                s.style.display = 'none';
                s.classList.remove('active');
            });
            slides[i].style.display = 'block';
            slides[i].classList.add('active');

            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 150));

            const canvas = await html2canvas(slides[i], {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#0A0A0A',
                logging: false,
                width: 1280,
                height: 720,
                windowWidth: 1280,
                windowHeight: 720,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                foreignObjectRendering: true,
                removeContainer: true
            });

            if (i > 0) {
                pdf.addPage([1280, 720], 'landscape');
            }

            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720);
        }

        pdf.save('LatticA_Confidential_Transfer.pdf');

    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
    } finally {
        // Restore original SVG sources
        svgImages.forEach((img, index) => {
            if (originalSrcs[index]) {
                URL.revokeObjectURL(img.src);
                img.src = originalSrcs[index];
            }
        });

        // Remove PDF export mode
        document.body.classList.remove('pdf-export-mode');

        slides.forEach(s => s.style.display = '');
        currentSlide = originalSlide;
        updateSlide();

        document.getElementById('spin-style')?.remove();
        downloadBtn.innerHTML = originalHTML;
        downloadBtn.disabled = false;
    }
}

// Touch/Swipe support
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

// Fullscreen (press F)
document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
        if (!e.target.isContentEditable) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSlides();
});
