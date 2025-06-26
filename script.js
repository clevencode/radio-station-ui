// === Player Controls Module ===
const PlayerControls = (() => {
  const audio = document.getElementById('radio-player');
  const playBtn = document.getElementById('play-pause-btn');
  const nextBtn = document.getElementById("next-btn");
  const prevBtn = document.getElementById("prev-btn");
  const coverArt = document.getElementById('cover-art');
  const miniPlayBtn = document.querySelector('.mini-play-btn');

  let isPlaying = false;
  let stations = [];
  let currentIndex = 0;

  function setStations(newStations) {
    stations = newStations;
    setCurrentIndex(0);
  }

  function getCurrentIndex() {
    return currentIndex;
  }

  function setCurrentIndex(index) {
    currentIndex = index;
    displayStation(currentIndex);
  }

  function getIsPlaying() {
    return isPlaying;
  }

  function updatePlayButtons(icon) {
    playBtn.innerHTML = icon;
    miniPlayBtn.innerHTML = icon;
  }

  function play() {
    if (!stations[currentIndex]) return;
    audio.play().then(() => {
      updatePlayButtons('<i class="fas fa-pause" aria-hidden="true"></i>');
      isPlaying = true;
    }).catch(err => {
      console.error("Erro ao reproduzir áudio:", err);
      alert("Não foi possível reproduzir esta estação.");
    });
  }

  function pause() {
    audio.pause();
    updatePlayButtons('<i class="fas fa-play" aria-hidden="true"></i>');
    isPlaying = false;
  }

  function displayStation(index) {
    const station = stations[index];
    if (!station) return;
    const name = station.name || 'Sem Nome';
    const country = station.country || 'Desconhecido';
    const favicon = station.favicon || 'https://via.placeholder.com/150';
    document.getElementById('artist-name').innerText = name;
    document.getElementById('song-name').innerText = country;
    document.getElementById('mini-artist-name').innerText = name;
    document.getElementById('mini-song-name').innerText = country;
    coverArt.style.backgroundImage = `url(${favicon})`;
    audio.src = station.url_resolved || '';
  }

  playBtn.addEventListener('click', () => isPlaying ? pause() : play());
  nextBtn.addEventListener('click', () => {
    if (!stations.length) return;
    setCurrentIndex((currentIndex + 1) % stations.length);
    if (isPlaying) play();
  });
  prevBtn.addEventListener('click', () => {
    if (!stations.length) return;
    setCurrentIndex((currentIndex - 1 + stations.length) % stations.length);
    if (isPlaying) play();
  });

  return { setStations, getCurrentIndex, setCurrentIndex, getIsPlaying, play, pause };
})();

// === Station Grid Renderer ===
const StationGrid = (() => {
  const grid = document.querySelector('.stations-grid');
  function atualizarGrade(stations) {
    grid.innerHTML = '';
    if (!stations.length) {
      grid.innerHTML = '<div class="station-item">Nenhuma estação encontrada</div>';
      return;
    }
    stations.forEach((station, index) => {
      const item = document.createElement('div');
      item.className = 'station-item';
      item.innerHTML = `
        <img src="${station.favicon || 'https://via.placeholder.com/40'}" class="station-favicon" alt="Logo"/>
        <span>${station.name || 'Sem nome'}</span>
      `;
      item.addEventListener('click', () => {
        PlayerControls.setCurrentIndex(index);
        PlayerControls.play();
      });
      grid.appendChild(item);
    });
  }
  return { atualizarGrade };
})();

// === Station Fetcher ===
const StationFetcher = (() => {
  async function fetchStationsByCountry(countryName) {
    try {
      const url = `https://de1.api.radio-browser.info/json/stations/bycountry/${encodeURIComponent(countryName)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao acessar API');
      const data = await res.json();
      const validStations = data.filter(s => s.url_resolved?.startsWith('http'));
      PlayerControls.setStations(validStations);
      StationGrid.atualizarGrade(validStations);
      if (validStations.length && PlayerControls.getIsPlaying()) PlayerControls.play();
    } catch (err) {
      console.error('Erro ao buscar estações:', err);
      alert('Erro ao carregar estações.');
    }
  }
  return { fetchStationsByCountry };
})();

// === Country Detection ===
const CountryDetection = (() => {
  const idiomaParaPais = {
    'pt': 'Brazil', 'pt-BR': 'Brazil',
    'en': 'United States', 'en-US': 'United States',
    'fr': 'France', 'fr-FR': 'France',
    'es': 'Spain', 'es-ES': 'Spain',
    'de': 'Germany', 'de-DE': 'Germany',
    'ht': 'Haiti', 'ht-HT': 'Haiti'
  };

  function detectarPorIdioma() {
    const lang = navigator.language || navigator.userLanguage;
    const pais = idiomaParaPais[lang] || idiomaParaPais[lang.split('-')[0]] || 'Brazil';
    StationFetcher.fetchStationsByCountry(pais);
  }

  async function success(pos) {
    const { latitude, longitude } = pos.coords;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const data = await res.json();
      const country = data?.address?.country;
      if (country) StationFetcher.fetchStationsByCountry(country);
      else detectarPorIdioma();
    } catch {
      detectarPorIdioma();
    }
  }

  function detectarComGeolocalizacao() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, detectarPorIdioma);
    } else {
      detectarPorIdioma();
    }
  }

  return { detectarPorIdioma, detectarComGeolocalizacao };
})();

// === Inicialização ===
document.addEventListener('DOMContentLoaded', () => {
  CountryDetection.detectarComGeolocalizacao();

  // Alternância de painéis
  document.getElementById('view-stations-btn-player').addEventListener('click', () => {
    document.querySelector('.player-panel').classList.remove('active');
    document.querySelector('.stations-list-panel').classList.add('active');
  });
  document.getElementById('view-stations-btn-list').addEventListener('click', () => {
    document.querySelector('.stations-list-panel').classList.remove('active');
    document.querySelector('.player-panel').classList.add('active');
  });

  // Mini player controls
  document.querySelector('.mini-play-btn').addEventListener('click', () => {
    PlayerControls.getIsPlaying() ? PlayerControls.pause() : PlayerControls.play();
  });
  document.querySelector('.mini-next-btn').addEventListener('click', () => {
    document.getElementById("next-btn").click();
  });
});





