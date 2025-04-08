
const videoURL = document.getElementById('videoURL');
const loader = document.getElementById('loader');
const preview = document.getElementById('preview');
const thumbnail = document.getElementById('thumbnail');
const title = document.getElementById('title');
const qualityButtons = document.getElementById('qualityButtons');

videoURL.addEventListener('paste', () => {
  setTimeout(fetchInfo, 100);
});

function showLoader(show) {
  loader.style.display = show ? 'block' : 'none';
}

function fetchInfo() {
  const url = videoURL.value.trim();
  if (!url) return;

  showLoader(true);
  preview.classList.add('hidden');
  fetch('/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) throw new Error(data.error);
    title.textContent = data.title;
    thumbnail.src = data.thumbnail;
    qualityButtons.innerHTML = '';
    data.formats.forEach(fmt => {
      const btn = document.createElement('button');
      btn.textContent = `${fmt.height}p`;
      btn.onclick = () => downloadVideo(url, fmt.format_id);
      qualityButtons.appendChild(btn);
    });
    preview.classList.remove('hidden');
  })
  .catch(err => alert('Error: ' + err.message))
  .finally(() => showLoader(false));
}

function downloadVideo(url, format_id) {
  showLoader(true);
  fetch('/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, format_id })
  })
  .then(res => res.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'video.mp4';
    a.click();
  })
  .catch(err => alert('Download error: ' + err.message))
  .finally(() => showLoader(false));
}

const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createParticles() {
  particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      d: Math.random() * 0.5 + 0.5
    });
  }
}
createParticles();

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
    ctx.fill();
    p.y += p.d;
    if (p.y > canvas.height) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
    }
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();
