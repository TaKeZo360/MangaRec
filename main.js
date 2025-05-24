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

function weightedRandom(groups) {
  const totalWeight = groups.reduce((sum, g) => sum + g.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const group of groups) {
    if (rand < group.weight) {
      const items = group.items;
      return items[Math.floor(Math.random() * items.length)];
    }
    rand -= group.weight;
  }
}

const TEN_MINUTES = 1000 * 60 * 10;

async function showMangaPeriodically() {
  const now = Date.now();
  
  const savedTime = localStorage.getItem('lastUpdateTime');
  const savedManga = localStorage.getItem('lastManga');
  
  if (savedTime && savedManga && now - parseInt(savedTime, 10) < TEN_MINUTES) {
    renderManga(JSON.parse(savedManga));
    return;
  }
  
  const topManga = await fetchTopManga();
  if (!topManga) {
    titleEl.textContent = 'Failed to load manga.';
    mangaCard.style.display = 'block';
    return;
  }
  
  const groups = [
    { weight: 30, items: topManga.filter(m => m.type === 'Manga') },
    { weight: 30, items: topManga.filter(m => m.type === 'Manhua') },
    { weight: 30, items: topManga.filter(m => m.type === 'Manhwa') },
    { weight: 10, items: topManga.filter(m => !['Manga', 'Manhua', 'Manhwa'].includes(m.type)) }
  ].filter(g => g.items.length > 0);
  
  const manga = weightedRandom(groups);
  
  localStorage.setItem('lastUpdateTime', now.toString());
  localStorage.setItem('lastManga', JSON.stringify(manga));
  
  renderManga(manga);
}

async function searchManga(query) {
  if (!query.trim()) {
    showMangaPeriodically();
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

// Start immediately and check every minute if 10 minutes have passed to update
showMangaPeriodically();
setInterval(showMangaPeriodically, 1000 * 60);