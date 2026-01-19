// Slide Navigation
let currentSlide = 1;
const totalSlides = 15;

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

            // For slide 4 (demo slide), replace iframe with placeholder
            const iframe = slide.querySelector('.demo-iframe');
            let placeholder = null;
            if (iframe) {
                iframe.style.display = 'none';
                placeholder = document.createElement('div');
                placeholder.className = 'demo-placeholder-pdf';
                placeholder.innerHTML = `
                    <div style="
                        width: 100%;
                        height: 100%;
                        background: #E2E8F0;
                        border-radius: 16px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: #64748B;
                        font-size: 24px;
                        gap: 16px;
                    ">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        <span style="font-weight: 600;">Live Demo</span>
                        <span style="font-size: 16px;">waLLLnut.com/demo/excel</span>
                    </div>
                `;
                iframe.parentElement.appendChild(placeholder);
            }

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

            // Restore iframe and remove placeholder
            if (iframe && placeholder) {
                iframe.style.display = '';
                placeholder.remove();
            }
        }

        // Save PDF
        pdf.save('waLLLnut_IR_Deck_2026.pdf');

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

    // Add copyright to all slides except slide 1
    document.querySelectorAll('.slide-inner').forEach((inner, index) => {
        if (index === 0) return; // Skip title slide
        const copyright = document.createElement('div');
        copyright.className = 'slide-copyright';
        copyright.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="46" height="46" rx="12" fill="#F1F5F9"/>
                <path d="M11.6582 27.4746C11.6583 30.0105 13.7337 32.0664 16.293 32.0664H21.1709V20.4658H24.8291V32.0664H29.707C32.2663 32.0664 34.3417 30.0105 34.3418 27.4746V20.4658H38V28.4414C37.9998 32.4454 34.7236 35.6914 30.6826 35.6914H15.3174C11.2764 35.6914 8.00018 32.4454 8 28.4414V20.4658H11.6582V27.4746ZM23.0029 10.3047C27.3132 10.3049 30.8076 13.7672 30.8076 18.0381V28.4297H27.4141V18.3008C27.414 15.8869 25.4391 13.9299 23.0029 13.9297C20.5666 13.9297 18.5909 15.8867 18.5908 18.3008V28.4297H15.1973V18.0381C15.1973 13.767 18.6925 10.3047 23.0029 10.3047Z" fill="#94A3B8"/>
            </svg>
            <span>© 2026 waLLLnut Inc.</span>
        `;
        inner.appendChild(copyright);
    });
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
