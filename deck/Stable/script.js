// Slide Navigation
let currentSlide = 1;
const totalSlides = 18;

function updateSlide() {
    document.querySelectorAll('.slide').forEach(slide => {
        slide.classList.remove('active');
    });

    const activeSlide = document.querySelector(`[data-slide="${currentSlide}"]`);
    if (activeSlide) {
        activeSlide.classList.add('active');
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
    updateSlide();
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
