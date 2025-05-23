const statusIcons = {
  "Publishing": "fas fa-spinner",
  "Completed": "fas fa-check-double",
  "Hiatus": "fas fa-pause-circle",
  "Discontinued": "fas fa-times-circle",
  "Not yet published": "fas fa-clock",
  "Finished": "fas fa-check-circle"
};

const statusClasses = {
  "Publishing": "status-publishing",
  "Completed": "status-completed",
  "Hiatus": "status-hiatus",
  "Discontinued": "status-discontinued",
  "Not yet published": "status-upcoming",
  "Finished": "status-completed"
};

const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const mangaCard = document.getElementById('mangaCard');
const coverImg = document.getElementById('coverImg');
const titleEl = document.getElementById('title');
const scoreEl = document.getElementById('score');
const descEl = document.getElementById('desc');
const readBtn = document.getElementById('readBtn');
const statusEl = document.getElementById('status');
const genresEl = document.getElementById('genres');
const typeBadge = document.getElementById('typeBadge');
const yearBadge = document.getElementById('yearBadge');

function renderManga(manga) {
  coverImg.src = manga.images.jpg.large_image_url || '';
  coverImg.alt = manga.title + ' cover';
  titleEl.textContent = manga.title;
  scoreEl.textContent = manga.score ?? 'N/A';
  
  // Type and launch year badges
  typeBadge.textContent = manga.type || 'Unknown';
  const year = manga.published?.prop?.from?.year;
  yearBadge.textContent = year ? `Year: ${year}` : 'Year: N/A';
  
  const statusText = manga.status || 'Unknown';
  const icon = statusIcons[statusText] || 'fas fa-info-circle';
  const className = statusClasses[statusText] || '';
  statusEl.innerHTML = `<span class="badge status ${className}"><i class="${icon}"></i> ${statusText}</span>`;
  
  genresEl.innerHTML = manga.genres.map(g => `<span class="badge genre"><i class="fas fa-tag"></i> ${g.name}</span>`).join('') || 'N/A';
  
  scoreEl.style.color = window.getComputedStyle(statusEl.querySelector('span') || statusEl).backgroundColor || '#eee';
  
  descEl.innerHTML = `<span class="section-label">Synopsis:</span> ${manga.synopsis || 'No description available.'}`;
  readBtn.href = manga.url;
  mangaCard.style.display = 'block';
}

async function fetchTopManga() {
  try {
    const res = await fetch('https://api.jikan.moe/v4/top/manga');
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

function getTodayKey() {
  const today = new Date();
  return `dailyManga_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
}

async function showDailyManga() {
  const todayKey = getTodayKey();
  const saved = localStorage.getItem(todayKey);
  if (saved) {
    const manga = JSON.parse(saved);
    renderManga(manga);
    return;
  }
  
  const topManga = await fetchTopManga();
  if (!topManga) {
    titleEl.textContent = 'Failed to load daily manga.';
    mangaCard.style.display = 'block';
    return;
  }
  
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = dayOfYear % topManga.length;
  const manga = topManga[index];
  
  localStorage.setItem(todayKey, JSON.stringify(manga));
  renderManga(manga);
}

async function searchManga(query) {
  if (!query.trim()) {
    showDailyManga();
    return;
  }
  try {
    const res = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();
    if (data.data.length === 0) {
      alert('No results found.');
      mangaCard.style.display = 'none';
      return;
    }
    renderManga(data.data[0]);
  } catch {
    alert('Search failed.');
    mangaCard.style.display = 'none';
  }
}

searchBtn.addEventListener('click', () => {
  searchManga(searchInput.value);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    searchManga(searchInput.value);
  }
});

showDailyManga();