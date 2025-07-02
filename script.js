// ========================
// 🎵 PLAYER CONTROLS
// ========================
const PlayerControls = (() => {
  const audio = document.getElementById('radio-player');
  const playBtn = document.getElementById('play-pause-btn');
  const nextBtn = document.getElementById('next-btn');
  const prevBtn = document.getElementById('prev-btn');
  const coverArt = document.getElementById('cover-art');
  const miniPlayBtn = document.querySelector('.mini-play-btn');
  const miniPlayer = document.getElementById('mini-player');

  let isPlaying = false;
  let stations = [];
  let currentIndex = 0;
  let lastScrollPosition = window.pageYOffset;

  // Configura scroll behavior do mini player
  const setupScrollBehavior = () => {
    const handleScroll = () => {
      const currentScrollPosition = window.pageYOffset;
      if (currentScrollPosition > lastScrollPosition) {
        miniPlayer?.classList.add('sticky', 'visible');
      } else {
        miniPlayer?.classList.remove('visible');
      }
      lastScrollPosition = currentScrollPosition;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  };

  const cleanupScroll = setupScrollBehavior();

  function setStations(newStations) {
    if (!Array.isArray(newStations)) return;
    stations = newStations;
    setCurrentIndex(0);
  }

  function setCurrentIndex(index) {
    if (index < 0 || index >= stations.length) return;
    currentIndex = index;
    displayStation(index);
    StationGrid.atualizarGrade(stations);
  }

  function getCurrentIndex() {
    return currentIndex;
  }

  function getIsPlaying() {
    return isPlaying;
  }

  function updatePlayIcons(icon) {
    const iconHTML = `<span class="material-icons">${icon}</span>`;
    if (playBtn) playBtn.innerHTML = iconHTML;
    if (miniPlayBtn) miniPlayBtn.innerHTML = iconHTML;
    const miniIcon = document.getElementById('mini-toggle-icon');
    if (miniIcon) miniIcon.textContent = icon;
  }

  function play() {
    if (!stations[currentIndex]) return;
    audio.src = stations[currentIndex].url_resolved || '';
    audio.play().then(() => {
      updatePlayIcons('pause');
      isPlaying = true;
      StationGrid.atualizarGrade(stations);
      miniPlayer?.classList.add('active', 'visible', 'sticky');
    }).catch(err => {
      console.error('Erro ao reproduzir:', err);
      alert('Não foi possível reproduzir esta estação.');
    });
  }

  function pause() {
    audio.pause();
    updatePlayIcons('play_arrow');
    isPlaying = false;
    StationGrid.atualizarGrade(stations);
  }

  function displayStation(index) {
    const station = stations[index];
    if (!station) return;

    const name = station.name || 'Sem nome';
    const country = station.country || 'Desconhecido';
    const icon = station.favicon || 'https://via.placeholder.com/150';

    // Atualiza mini-player
    if (miniPlayer) {
      const miniName = miniPlayer.querySelector('#mini-station-name');
      const miniCountry = miniPlayer.querySelector('#mini-station-country');
      if (miniName) miniName.textContent = name;
      if (miniCountry) miniCountry.textContent = country;
      miniPlayer.classList.add('active');
    }

    // Atualiza player principal
    const artistName = document.getElementById('artist-name');
    const songName = document.getElementById('song-name');
    if (artistName) artistName.textContent = name;
    if (songName) songName.textContent = country;

    // Atualiza elementos adicionais se existirem
    const updateIfExists = (id, content) => {
      const el = document.getElementById(id);
      if (el) el.textContent = content;
    };
    updateIfExists('mini-artist-name', name);
    updateIfExists('mini-song-name', country);

    if (coverArt) coverArt.style.backgroundImage = `url(${icon})`;
  }

  if (playBtn) playBtn.addEventListener('click', () => isPlaying ? pause() : play());
  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (!stations.length) return;
    setCurrentIndex((currentIndex + 1) % stations.length);
    if (isPlaying) play();
  });
  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (!stations.length) return;
    setCurrentIndex((currentIndex - 1 + stations.length) % stations.length);
    if (isPlaying) play();
  });

  return {
    setStations,
    setCurrentIndex,
    getCurrentIndex,
    getIsPlaying,
    play,
    pause,
    cleanup: cleanupScroll
  };
})();

// ========================
// 📻 STATION GRID (filtro de busca)
// ========================
const StationGrid = (() => {
  const grid = document.querySelector('.stations-grid');
  const inputBusca = document.getElementById('search-input');
  let allStations = [];

  function atualizarGrade(stations) {
    if (!grid) return;
    grid.innerHTML = '';

    if (!stations.length) {
      grid.innerHTML = `<div class="station-item station-empty">Nenhuma estação encontrada</div>`;
      return;
    }

    const filtro = inputBusca?.value?.toLowerCase() || '';

    stations.forEach((station, index) => {
      const name = station.name?.toLowerCase() || '';
      if (filtro && !name.includes(filtro)) return;

      const isCurrent = index === PlayerControls.getCurrentIndex();
      const isPlaying = PlayerControls.getIsPlaying() && isCurrent;

      const item = document.createElement('div');
      item.className = 'station-item';
      if (isCurrent) item.classList.add('active');

      item.innerHTML = `
        <img class="thumb" src="${station.favicon}" alt=""
          onerror="this.onerror=null;this.src='img/erro.svg';" />
        <div class="station-info">
          <div class="station-name">${station.name || '<i>Sem nome</i>'}</div>
          <div class="station-country">${station.country || '<span style="opacity:0.6">Desconhecido</span>'}</div>
        </div>
        <div class="station-controls">
          <button class="btn-play" title="${isPlaying ? 'Pausar' : 'Tocar'}">
            <span class="material-icons">${isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-play')) return;
        document.querySelectorAll('.station-item').forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        PlayerControls.setCurrentIndex(index);
        PlayerControls.play();
      });

      item.querySelector('.btn-play').addEventListener('click', (e) => {
        e.stopPropagation();
        const isCurrent = index === PlayerControls.getCurrentIndex();
        if (isCurrent && PlayerControls.getIsPlaying()) {
          PlayerControls.pause();
        } else {
          PlayerControls.setCurrentIndex(index);
          PlayerControls.play();
        }
      });

      grid.appendChild(item);
    });
  }

  if (inputBusca) {
    inputBusca.addEventListener('input', () => atualizarGrade(allStations));
    inputBusca.addEventListener('focus', () => {
      document.querySelector('.player')?.classList.remove('ativo');
      document.querySelector('.estacoes-lista')?.classList.add('ativo');
    });
  }

  return {
    atualizarGrade: (stations) => {
      allStations = stations;
      atualizarGrade(allStations);
    }
  };
})();

// ========================
// 🌍 STATION FETCHER
// ========================
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

      if (validStations.length && PlayerControls.getIsPlaying()) {
        PlayerControls.play();
      }
    } catch (err) {
      console.error('Erro ao buscar estações:', err);
      alert('Erro ao carregar estações.');
    }
  }

  return { fetchStationsByCountry };
})();

// ========================
// 🌐 COUNTRY DETECTION
// ========================
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

  function detectarComGeolocalizacao() {
    // Atualmente só detecta pelo idioma
    detectarPorIdioma();
  }

  return { detectarPorIdioma, detectarComGeolocalizacao };
})();

// ========================
// 🚀 INICIALIZAÇÃO
// ========================
document.addEventListener('DOMContentLoaded', () => {
  CountryDetection.detectarComGeolocalizacao();
  setupPainelAlternancia();
  setupMiniPlayerControles();
  setupMiniPlayerToggle();
});

function setupPainelAlternancia() {
  const btnParaLista = document.getElementById('view-stations-btn-player');
  const btnParaPlayer = document.getElementById('view-stations-btn-list');
  const painelPlayer = document.querySelector('.player');
  const painelEstacoes = document.querySelector('.estacoes-lista');

  if (btnParaLista && btnParaPlayer && painelPlayer && painelEstacoes) {
    btnParaLista.addEventListener('click', () => {
      painelPlayer.classList.remove('ativo');
      painelEstacoes.classList.add('ativo');
    });
    btnParaPlayer.addEventListener('click', () => {
      painelEstacoes.classList.remove('ativo');
      painelPlayer.classList.add('ativo');
    });
  }
}

function setupMiniPlayerControles() {
  const miniPlayBtn = document.querySelector('.mini-play-btn');
  if (miniPlayBtn) {
    miniPlayBtn.addEventListener('click', () => {
      if (PlayerControls.getIsPlaying()) {
        PlayerControls.pause();
      } else {
        PlayerControls.play();
      }
    });
  }
}

function setupMiniPlayerToggle() {
  const miniPlayer = document.getElementById('mini-player');
  if (!miniPlayer) return;

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > lastScroll) {
      miniPlayer.classList.add('visible');
    } else {
      miniPlayer.classList.remove('visible');
    }
    lastScroll = currentScroll;
  });
}
