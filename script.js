/* =========================
   Simple DOM-based Weather Dashboard
   - Fixes footer & carousel nav
   - Clickable carousel items open mini "pages"
   - Uses Open-Meteo for 7-day + air quality where available
   - Search supports Albanian (we pass language=sq to geocoding)
   ========================= */

/* ---- Theme toggle ---- */
const modeToggle = document.getElementById('modeToggle');
modeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  modeToggle.textContent = document.body.classList.contains('light-mode') ? '🌙 Dark Mode' : '☀️ Light Mode';
});

/* ---- DOM refs ---- */
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const errorMsg = document.getElementById('errorMsg');

const weatherCard = document.getElementById('weatherCard');
const cityNameEl = document.getElementById('cityName');
const tempEl = document.getElementById('temp');
const windEl = document.getElementById('wind');
const timeEl = document.getElementById('time');
const unitToggle = document.getElementById('unitToggle');

const featureContainer = document.getElementById('featureContainer');

/* ---- Units/state ---- */
let currentTempC = null;
let isCelsius = true;

/* ---- Utility helpers ---- */
function showError(text) {
  errorMsg.textContent = text;
  setTimeout(() => { if (errorMsg.textContent === text) errorMsg.textContent = ''; }, 3500);
}
function round(n) { return Math.round(n); }

/* ---- Clock (small, optional) ---- */
function startClock() {
  const clockEl = document.querySelector('header h1'); // reuse header title element for simplicity not required
  // no continuous clock in header to keep it simple (we already show times from API)
}
startClock();

/* ---- Geo on load ---- */
window.addEventListener('load', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      await fetchWeatherByCoords(latitude, longitude);
    }, () => {
      showError('Location access denied. Search manually below.');
    }, { timeout: 8000 });
  } else {
    showError('Geolocation not supported.');
  }
});

/* ---- Search handlers ---- */
searchBtn.addEventListener('click', () => {
  const q = cityInput.value.trim();
  if (!q) { showError('Please enter a city name.'); return; }
  fetchWeatherByCity(q);
});

/* ---- Unit toggle ---- */
unitToggle.addEventListener('click', () => {
  if (currentTempC === null) return;
  isCelsius = !isCelsius;
  updateTempDisplay();
});

/* ---- Fetch weather by city name (geocoding) ---- */
async function fetchWeatherByCity(city) {
  errorMsg.textContent = '';
  weatherCard.classList.add('hidden');
  featureContainer.classList.add('hidden');

  try {
    // allow Albanian / other languages: use language=sq (Albanian) and fallback will still work
    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&language=sq&count=5`;
    const geoRes = await fetch(geoURL);
    if (!geoRes.ok) throw new Error('Geocode fetch failed');
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      showError('❌ Qyteti nuk u gjet. (City not found)');
      return;
    }

    // pick first result (closest / best)
    const place = geoData.results[0];
    await fetchWeatherByCoords(place.latitude, place.longitude, place.name, place.country);
  } catch (err) {
    showError('Error finding city.');
    console.error(err);
  }
}

/* ---- Fetch weather by coords (current weather) ---- */
async function fetchWeatherByCoords(lat, lon, name = '', country = '') {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();

    if (!data.current_weather) { showError('Weather unavailable.'); return; }
    displayCurrentWeather(data.current_weather, name, country, lat, lon);
  } catch (err) {
    console.error(err);
    showError('Error fetching weather.');
  }
}

/* ---- Display current weather (DOM) ---- */
function displayCurrentWeather(current, name, country, lat, lon) {
  currentTempC = current.temperature;
  isCelsius = true;
  cityNameEl.textContent = name ? `${name}, ${country}` : `Your Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
  updateTempDisplay();
  windEl.textContent = `💨 Wind: ${current.windspeed} km/h`;
  // time format: use the API-provided time (it usually looks like "2025-11-10T15:00")
  timeEl.textContent = `🕒 Time: ${current.time.replace('T',' ')}`;
  weatherCard.classList.remove('hidden');
}

/* ---- Update temperature display depending on unit ---- */
function updateTempDisplay() {
  if (currentTempC === null) return;
  const show = isCelsius ? `${round(currentTempC)}°C` : `${round((currentTempC * 9)/5 + 32)}°F`;
  tempEl.textContent = `🌡 Temperature: ${show}`;
}

/* =====================================================
   CAROUSEL: prev/next, auto-slide and click-to-open feature
   ===================================================== */
const track = document.getElementById('carouselTrack');
const items = Array.from(document.querySelectorAll('.carousel-item'));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let carouselIndex = 0;
let autoSlideTimer = null;

function updateCarousel() {
  track.style.transform = `translateX(-${carouselIndex * 100}%)`;
}
function nextSlide() { carouselIndex = (carouselIndex + 1) % items.length; updateCarousel(); }
function prevSlide() { carouselIndex = (carouselIndex - 1 + items.length) % items.length; updateCarousel(); }

nextBtn.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });
prevBtn.addEventListener('click', () => { prevSlide(); resetAutoSlide(); });

// click item to open feature
items.forEach(item => {
  item.addEventListener('click', () => openFeature(item.dataset.feature));
});

// auto slide every 4s
function startAutoSlide() {
  stopAutoSlide();
  autoSlideTimer = setInterval(() => { nextSlide(); }, 4000);
}
function stopAutoSlide() { if (autoSlideTimer) clearInterval(autoSlideTimer); autoSlideTimer = null; }
function resetAutoSlide() { startAutoSlide(); }
startAutoSlide();

/* =====================================================
   FEATURE VIEWS: create mini-pages for each carousel card
   - 7day: fetch daily temps & show simple table
   - tempmap: placeholder + small explanation (map would need external tiles; keep simple)
   - wind: placeholder info
   - aqi: fetch air quality from Open-Meteo (if available) for current coords
   - sun: sunrise/sunset times using daily solar parameters
   - climate: placeholder / resources summary
   ===================================================== */

/* simple helper to clear and show feature container */
function showFeatureHtml(html) {
  featureContainer.innerHTML = html;
  featureContainer.classList.remove('hidden');
  // scroll into view a little
  featureContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* openFeature selects which mini-page to show */
async function openFeature(featureKey) {
  featureContainer.classList.add('hidden'); // hide while loading
  // If we do not have coordinates from current display, ask user to search or allow geolocation
  // Attempt to determine lat/lon from displayed city text (if "Your Location" used, we don't have coords here)
  // For simplicity we'll ask user to search first if no current location stored.
  // A small improvement: we can store last coords when we fetched weather.
  // We'll keep simple: store lastLat/lastLon when fetching coords.
  if (featureKey === '7day') {
    return show7Day();
  }
  if (featureKey === 'tempmap') {
    return showTempMap();
  }
  if (featureKey === 'wind') {
    return showWind();
  }
  if (featureKey === 'aqi') {
    return showAQI();
  }
  if (featureKey === 'sun') {
    return showSun();
  }
  if (featureKey === 'climate') {
    return showClimate();
  }
}

/* store last coordinates when fetching weather */
let lastLat = null;
let lastLon = null;
function storeLastCoords(lat, lon) { lastLat = lat; lastLon = lon; }

/* Modified fetchWeatherByCoords to store coords */
async function fetchWeatherByCoords(lat, lon, name = '', country = '') {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();

    if (!data.current_weather) { showError('Weather unavailable.'); return; }
    storeLastCoords(lat, lon);
    displayCurrentWeather(data.current_weather, name, country, lat, lon);
  } catch (err) {
    console.error(err);
    showError('Error fetching weather.');
  }
}


