// Slide Navigation
let currentSlide = 1;
const totalSlides = 14;

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
    initializeCharts();
});

// Initialize Chart.js charts
function initializeCharts() {
    // Chart.js global defaults
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = 'Pretendard, Paperlogy, sans-serif';
        Chart.defaults.font.size = 11;
        Chart.defaults.color = '#494949';

        // Settlement Time Chart (Slide 5)
        const settlementCtx = document.getElementById('settlementTimeChart');
        if (settlementCtx) {
            new Chart(settlementCtx, {
                type: 'bar',
                data: {
                    labels: ['기존 T+2', 'Atomic'],
                    datasets: [{
                        label: '결제 시간 (시간)',
                        data: [48, 0.01],
                        backgroundColor: ['#ef4444', '#10b981'],
                        borderRadius: 8,
                        barThickness: 50
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ctx.parsed.y < 1 ? '실시간' : `${ctx.parsed.y}시간`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: '시간' },
                            grid: { color: '#e5e7eb' }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // Fee Comparison Chart (Slide 5)
        const feeCtx = document.getElementById('feeComparisonChart');
        if (feeCtx) {
            new Chart(feeCtx, {
                type: 'bar',
                data: {
                    labels: ['카드/PG', '스테이블코인'],
                    datasets: [{
                        label: '수수료 (%)',
                        data: [2.5, 0.1],
                        backgroundColor: ['#ef4444', '#10b981'],
                        borderRadius: 8,
                        barThickness: 50
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: '%' },
                            grid: { color: '#e5e7eb' }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // Availability Chart (Slide 5)
        const availCtx = document.getElementById('availabilityChart');
        if (availCtx) {
            new Chart(availCtx, {
                type: 'doughnut',
                data: {
                    labels: ['운영 가능', '운영 불가'],
                    datasets: [{
                        data: [100, 0],
                        backgroundColor: ['#10b981', '#e5e7eb'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                },
                plugins: [{
                    id: 'centerText',
                    afterDraw: (chart) => {
                        const ctx = chart.ctx;
                        ctx.save();
                        const centerX = chart.width / 2;
                        const centerY = chart.height / 2;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = 'bold 18px Pretendard';
                        ctx.fillStyle = '#10b981';
                        ctx.fillText('24/7', centerX, centerY - 8);
                        ctx.font = '11px Pretendard';
                        ctx.fillStyle = '#494949';
                        ctx.fillText('365일', centerX, centerY + 12);
                        ctx.restore();
                    }
                }]
            });
        }

        // Radar Chart for Comparison (Slide 13)
        const radarCtx = document.getElementById('comparisonRadar');
        if (radarCtx) {
            new Chart(radarCtx, {
                type: 'radar',
                data: {
                    labels: ['비연결성', '감사 가능', 'Issuer 통제', '양자내성', '한국 규제'],
                    datasets: [
                        {
                            label: 'Tornado Cash',
                            data: [100, 0, 0, 0, 0],
                            borderColor: '#94a3b8',
                            backgroundColor: 'rgba(148, 163, 184, 0.1)',
                            borderWidth: 2,
                            pointRadius: 3
                        },
                        {
                            label: 'Zcash',
                            data: [100, 30, 0, 0, 0],
                            borderColor: '#a78bfa',
                            backgroundColor: 'rgba(167, 139, 250, 0.1)',
                            borderWidth: 2,
                            pointRadius: 3
                        },
                        {
                            label: 'Private Wallet (CT)',
                            data: [0, 100, 100, 30, 30],
                            borderColor: '#60a5fa',
                            backgroundColor: 'rgba(96, 165, 250, 0.1)',
                            borderWidth: 2,
                            pointRadius: 3
                        },
                        {
                            label: 'ZK Pool Only',
                            data: [100, 0, 0, 0, 0],
                            borderColor: '#fbbf24',
                            backgroundColor: 'rgba(251, 191, 36, 0.1)',
                            borderWidth: 2,
                            pointRadius: 3
                        },
                        {
                            label: 'waLLLnut',
                            data: [100, 100, 100, 100, 100],
                            borderColor: '#e37120',
                            backgroundColor: 'rgba(227, 113, 32, 0.2)',
                            borderWidth: 3,
                            pointRadius: 5,
                            pointBackgroundColor: '#e37120'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { display: false },
                            grid: { color: '#e5e7eb' },
                            pointLabels: {
                                font: { size: 12, weight: '600', family: 'Pretendard' },
                                color: '#1b1b1b'
                            }
                        }
                    }
                }
            });
        }
    }
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
