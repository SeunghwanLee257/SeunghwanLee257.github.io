// Slide Navigation
let currentSlide = 1;
let totalSlides = 17; // Will be updated dynamically

function updateSlide() {
    document.querySelectorAll('.slide').forEach(slide => {
        slide.classList.remove('active');
    });

    const activeSlide = document.querySelector(`[data-slide="${currentSlide}"]`);
    if (activeSlide) {
        activeSlide.classList.add('active');
        // Apply auto-fit after slide becomes visible
        requestAnimationFrame(() => autoFitSlide(activeSlide));
    }

    document.getElementById('slideCounter').textContent = `${currentSlide} / ${totalSlides}`;

    document.getElementById('prevBtn').style.opacity = currentSlide === 1 ? '0.5' : '1';
    document.getElementById('nextBtn').style.opacity = currentSlide === totalSlides ? '0.5' : '1';
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

// ========== AUTO-FIT SYSTEM ==========
// Automatically scales down content if it overflows the slide

function autoFitSlide(slide) {
    const inner = slide.querySelector('.slide-inner');
    if (!inner) return;

    // Skip title slide and appendix divider
    if (inner.classList.contains('title-slide') || inner.classList.contains('appendix-divider')) {
        inner.style.transform = '';
        inner.style.transformOrigin = '';
        return;
    }

    // Reset any previous scaling
    inner.style.transform = '';
    inner.style.transformOrigin = 'top left';

    const containerW = 1280;
    const containerH = 720;
    const paddingX = 120; // 60px * 2
    const paddingY = 80;  // 40px * 2

    const contentW = inner.scrollWidth;
    const contentH = inner.scrollHeight;

    // Check if content overflows
    if (contentH > containerH || contentW > containerW) {
        const scaleX = containerW / contentW;
        const scaleY = containerH / contentH;
        const scale = Math.min(scaleX, scaleY, 1);

        if (scale < 1) {
            // Minimum scale to maintain readability
            const finalScale = Math.max(scale, 0.75);
            inner.style.transform = `scale(${finalScale})`;
            inner.style.transformOrigin = 'top left';

            // Log overflow for debugging
            if (scale < 0.9) {
                console.warn(`Slide ${slide.dataset.slide} scaled to ${(finalScale * 100).toFixed(0)}% (content: ${contentH}px > container: ${containerH}px)`);
            }
        }
    }
}

// Apply auto-fit to all slides on load and resize
function autoFitAllSlides() {
    document.querySelectorAll('.slide').forEach(slide => {
        // Temporarily show slide for measurement
        const wasHidden = !slide.classList.contains('active');
        if (wasHidden) {
            slide.style.visibility = 'hidden';
            slide.style.display = 'block';
        }

        autoFitSlide(slide);

        if (wasHidden) {
            slide.style.display = '';
            slide.style.visibility = '';
        }
    });
}

// ResizeObserver for responsive auto-fit
const resizeObserver = new ResizeObserver(() => {
    const activeSlide = document.querySelector('.slide.active');
    if (activeSlide) {
        autoFitSlide(activeSlide);
    }
});

// Keyboard navigation
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

// PDF Download - High Quality, One slide per page
async function downloadPDF() {
    const downloadBtn = document.getElementById('downloadBtn');
    const originalHTML = downloadBtn.innerHTML;

    downloadBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin">
            <circle cx="12" cy="12" r="10" stroke-dasharray="30" stroke-dashoffset="10"></circle>
        </svg>
        PDF 생성 중...
    `;
    downloadBtn.disabled = true;

    // Add spin animation
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = `
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
    `;
    document.head.appendChild(style);

    const { jsPDF } = window.jspdf;

    // Create PDF with exact slide dimensions (1280x720 = 16:9)
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720],
        hotfixes: ['px_scaling']
    });

    const slides = document.querySelectorAll('.slide');
    const originalSlide = currentSlide;

    try {
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];

            // Show this slide temporarily
            slides.forEach(s => s.style.display = 'none');
            slide.style.display = 'block';

            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture with html2canvas - high quality settings
            const canvas = await html2canvas(slide, {
                scale: 2, // 2x for better quality
                useCORS: true,
                backgroundColor: '#F8FAFC',
                logging: false,
                width: 1280,
                height: 720,
                windowWidth: 1280,
                windowHeight: 720
            });

            // Add page (except for first slide)
            if (i > 0) {
                pdf.addPage([1280, 720], 'landscape');
            }

            // Add image to PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720, undefined, 'FAST');
        }

        // Save PDF
        pdf.save('waLLLnut_Koscom_Stablecoin_Proposal.pdf');

    } catch (error) {
        console.error('PDF generation error:', error);
        alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        // Restore original state
        slides.forEach(s => s.style.display = '');
        currentSlide = originalSlide;
        updateSlide();

        // Clean up
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Count actual slides
    totalSlides = document.querySelectorAll('.slide').length;

    // Setup resize observer
    const container = document.querySelector('.deck-container');
    if (container) {
        resizeObserver.observe(container);
    }

    // Initial auto-fit after fonts load
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            autoFitAllSlides();
            updateSlide();
        });
    } else {
        setTimeout(() => {
            autoFitAllSlides();
            updateSlide();
        }, 100);
    }
});

// Fullscreen toggle (press F)
document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
});
