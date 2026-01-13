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
        Generating PDF...
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
        pdf.save('LatticA_Salary_IR_Deck.pdf');

    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
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
    initPoolDiagram();
});

// D3.js Pool Visualization
function initPoolDiagram() {
    const container = document.getElementById('poolDiagram');
    if (!container || typeof d3 === 'undefined') return;

    const width = container.clientWidth || 1200;
    const height = 320;

    const svg = d3.select('#poolDiagram')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Define nodes
    const poolCenterX = width / 2;
    const poolCenterY = 140;
    const poolRadius = 80;

    // Sender addresses (left side)
    const senders = [
        { id: 'S1', label: '0xA3f...', x: 120, y: 80 },
        { id: 'S2', label: '0x7B2...', x: 120, y: 160 },
        { id: 'S3', label: '0xC9d...', x: 120, y: 240 }
    ];

    // Receiver addresses (right side)
    const receivers = [
        { id: 'R1', label: '0x5E8...', x: width - 120, y: 80 },
        { id: 'R2', label: '0x1F4...', x: width - 120, y: 160 },
        { id: 'R3', label: '0x9A7...', x: width - 120, y: 240 }
    ];

    // AML investigator (bottom)
    const investigator = { id: 'AML', label: 'AML 조사관', x: width - 180, y: 290 };

    // Draw gradient definitions
    const defs = svg.append('defs');

    const poolGradient = defs.append('radialGradient')
        .attr('id', 'poolGradient');
    poolGradient.append('stop').attr('offset', '0%').attr('stop-color', '#A78BFA');
    poolGradient.append('stop').attr('offset', '100%').attr('stop-color', '#7C3AED');

    // Draw ZK Pool (large circle in center)
    svg.append('ellipse')
        .attr('cx', poolCenterX)
        .attr('cy', poolCenterY)
        .attr('rx', poolRadius + 30)
        .attr('ry', poolRadius)
        .attr('fill', 'url(#poolGradient)')
        .attr('opacity', 0.2);

    svg.append('ellipse')
        .attr('cx', poolCenterX)
        .attr('cy', poolCenterY)
        .attr('rx', poolRadius + 20)
        .attr('ry', poolRadius - 10)
        .attr('fill', 'url(#poolGradient)')
        .attr('opacity', 0.4);

    svg.append('text')
        .attr('x', poolCenterX)
        .attr('y', poolCenterY - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#5B21B6')
        .attr('font-weight', '700')
        .attr('font-size', '16px')
        .text('ZK Privacy Pool');

    svg.append('text')
        .attr('x', poolCenterX)
        .attr('y', poolCenterY + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#7C3AED')
        .attr('font-size', '12px')
        .text('(내부 익명)');

    // Draw arrows from senders to pool
    senders.forEach(sender => {
        svg.append('line')
            .attr('x1', sender.x + 40)
            .attr('y1', sender.y)
            .attr('x2', poolCenterX - poolRadius - 20)
            .attr('y2', poolCenterY)
            .attr('stroke', '#e37120')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,3')
            .attr('marker-end', 'url(#arrowOrange)');
    });

    // Draw arrows from pool to receivers (showing "from: Pool")
    receivers.forEach(receiver => {
        svg.append('line')
            .attr('x1', poolCenterX + poolRadius + 20)
            .attr('y1', poolCenterY)
            .attr('x2', receiver.x - 40)
            .attr('y2', receiver.y)
            .attr('stroke', '#10B981')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowGreen)');
    });

    // Arrow markers
    defs.append('marker')
        .attr('id', 'arrowOrange')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 9)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', '#e37120');

    defs.append('marker')
        .attr('id', 'arrowGreen')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 9)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', '#10B981');

    defs.append('marker')
        .attr('id', 'arrowRed')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 9)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', '#DC2626');

    // Draw sender nodes
    senders.forEach(sender => {
        const g = svg.append('g');
        g.append('circle')
            .attr('cx', sender.x)
            .attr('cy', sender.y)
            .attr('r', 28)
            .attr('fill', '#FED7AA')
            .attr('stroke', '#e37120')
            .attr('stroke-width', 2);
        g.append('text')
            .attr('x', sender.x)
            .attr('y', sender.y + 4)
            .attr('text-anchor', 'middle')
            .attr('fill', '#9A3412')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .text(sender.label);
    });

    // Draw receiver nodes
    receivers.forEach(receiver => {
        const g = svg.append('g');
        g.append('circle')
            .attr('cx', receiver.x)
            .attr('cy', receiver.y)
            .attr('r', 28)
            .attr('fill', '#D1FAE5')
            .attr('stroke', '#10B981')
            .attr('stroke-width', 2);
        g.append('text')
            .attr('x', receiver.x)
            .attr('y', receiver.y + 4)
            .attr('text-anchor', 'middle')
            .attr('fill', '#065F46')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .text(receiver.label);

        // "from: Pool" label
        g.append('text')
            .attr('x', receiver.x - 60)
            .attr('y', receiver.y - 20)
            .attr('text-anchor', 'middle')
            .attr('fill', '#7C3AED')
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .text('from: Pool');
    });

    // AML tracking path (blocked)
    svg.append('path')
        .attr('d', `M ${investigator.x} ${investigator.y}
                    Q ${investigator.x - 100} ${investigator.y - 50} ${receivers[2].x - 40} ${receivers[2].y + 20}`)
        .attr('fill', 'none')
        .attr('stroke', '#DC2626')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8,4')
        .attr('marker-end', 'url(#arrowRed)');

    // Draw blocked indicator at pool edge
    svg.append('circle')
        .attr('cx', poolCenterX + poolRadius + 10)
        .attr('cy', poolCenterY + 40)
        .attr('r', 16)
        .attr('fill', '#FEE2E2')
        .attr('stroke', '#DC2626')
        .attr('stroke-width', 2);

    svg.append('text')
        .attr('x', poolCenterX + poolRadius + 10)
        .attr('y', poolCenterY + 45)
        .attr('text-anchor', 'middle')
        .attr('fill', '#DC2626')
        .attr('font-size', '16px')
        .attr('font-weight', '700')
        .text('✕');

    // Blocked label
    svg.append('text')
        .attr('x', poolCenterX + poolRadius + 60)
        .attr('y', poolCenterY + 70)
        .attr('text-anchor', 'start')
        .attr('fill', '#DC2626')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text('추적 차단!');

    // AML investigator
    svg.append('rect')
        .attr('x', investigator.x - 45)
        .attr('y', investigator.y - 15)
        .attr('width', 90)
        .attr('height', 30)
        .attr('rx', 6)
        .attr('fill', '#FEE2E2')
        .attr('stroke', '#DC2626')
        .attr('stroke-width', 2);

    svg.append('text')
        .attr('x', investigator.x)
        .attr('y', investigator.y + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#DC2626')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text('🔍 AML 추적');

    // Labels
    svg.append('text')
        .attr('x', 120)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e37120')
        .attr('font-size', '13px')
        .attr('font-weight', '700')
        .text('송신자 (입금)');

    svg.append('text')
        .attr('x', width - 120)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#10B981')
        .attr('font-size', '13px')
        .attr('font-weight', '700')
        .text('수신자 (출금)');
}

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
