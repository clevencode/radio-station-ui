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

  let isPlaying = false;
  let stations = [];
  let currentIndex = 0;

  function setStations(newStations) {
    stations = newStations;
    setCurrentIndex(0);
  }

  function setCurrentIndex(index) {
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
    audio.play().then(() => {
      updatePlayIcons('pause');
      isPlaying = true;
      StationGrid.atualizarGrade(stations);
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
    document.getElementById('mini-station-name').textContent = name;
    document.getElementById('mini-station-country').textContent = country;
    document.getElementById('mini-player')?.classList.add('active');

    document.getElementById('artist-name').innerText = name;
    document.getElementById('song-name').innerText = country;
    if (document.getElementById('mini-artist-name'))
      document.getElementById('mini-artist-name').innerText = name;
    if (document.getElementById('mini-song-name'))
      document.getElementById('mini-song-name').innerText = country;

    coverArt.style.backgroundImage = `url(${icon})`;
    audio.src = station.url_resolved || '';
  }

  // Eventos dos botões principais
  playBtn?.addEventListener('click', () => isPlaying ? pause() : play());
  nextBtn?.addEventListener('click', () => {
    if (!stations.length) return;
    setCurrentIndex((currentIndex + 1) % stations.length);
    if (isPlaying) play();
  });
  prevBtn?.addEventListener('click', () => {
    if (!stations.length) return;
    setCurrentIndex((currentIndex - 1 + stations.length) % stations.length);
    if (isPlaying) play();
  });

  return { setStations, setCurrentIndex, getCurrentIndex, getIsPlaying, play, pause };
})();


// ========================
// 📻 STATION GRID (com filtro de busca)
// ========================
const StationGrid = (() => {
  const grid = document.querySelector('.stations-grid');
  const inputBusca = document.getElementById('search-input');

  let allStations = [];

  function atualizarGrade(stations) {
    grid.innerHTML = '';
    if (!stations.length) {
      grid.innerHTML = `<div class="station-item station-empty">Nenhuma estação encontrada</div>`;
      return;
    }

    stations.forEach((station, index) => {
      const name = station.name?.toLowerCase() || '';
      const filtro = inputBusca?.value?.toLowerCase() || '';

      // Se houver filtro, verifica apenas se a primeira letra do nome corresponde ao filtro
      if (filtro && name.charAt(0) !== filtro.charAt(0)) return;

      const isCurrent = index === PlayerControls.getCurrentIndex();
      const isPlaying = PlayerControls.getIsPlaying() && isCurrent;

      const item = document.createElement('div');
      item.className = 'station-item';
      if (isCurrent) item.classList.add('active');

      item.innerHTML = `
        <img class="thumb" src="${station.favicon || 'https://via.placeholder.com/40'}" alt="Ícone da estação" />
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

      // Ativa a estação ao clicar no card
      item.addEventListener('click', (e) => {
        // Impede conflito com botão play
        if (e.target.closest('.btn-play')) return;

        document.querySelectorAll('.station-item').forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        PlayerControls.setCurrentIndex(index);
        PlayerControls.play();
      });

      // Botão de play/pause embutido
      const playBtn = item.querySelector('.btn-play');
      playBtn.addEventListener('click', (e) => {
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

  // Atualiza ao digitar
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

  // Apenas detecção por idioma
  function detectarComGeolocalizacao() {
    detectarPorIdioma();
  }

  return { detectarPorIdioma, detectarComGeolocalizacao };
})();


// ========================
// 🚀 INICIALIZAÇÃO COM BOAS PRÁTICAS
// ========================
document.addEventListener('DOMContentLoaded', () => {
  CountryDetection.detectarComGeolocalizacao();
  setupPainelAlternancia();
  setupMiniPlayerControles();
  setupMiniPlayerToggle();
});
document.addEventListener('DOMContentLoaded', () => {
  CountryDetection.detectarComGeolocalizacao();
  setupPainelAlternancia();
  setupMiniPlayerControles();
  setupMiniPlayerToggle(); // 👈 adicionado aqui
});

/**
 * Alterna entre os painéis do player e da lista de estações.
 */
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

/**
 * Configura os controles do mini player (caso existam).
 */
function setupMiniPlayerControles() {
  const btnPlayMini = document.querySelector('.mini-play-btn');
  const btnNextMini = document.querySelector('.mini-next-btn');
  const btnNext = document.getElementById('next-btn');

  if (btnPlayMini) {
    btnPlayMini.addEventListener('click', () => {
      PlayerControls.getIsPlaying() ? PlayerControls.pause() : PlayerControls.play();
    });
  }

  if (btnNextMini && btnNext) {
    btnNextMini.addEventListener('click', () => {
      btnNext.click();
    });
  }
}

/**
 * Configura o botão de toggle do mini player.
 */
function setupMiniPlayerToggle() {
  document.getElementById('mini-toggle-btn')?.addEventListener('click', () => {
    PlayerControls.getIsPlaying()
      ? PlayerControls.pause()
      : PlayerControls.play();
  });
}

function setupMiniPlayerToggle() {
  const toggleBtn = document.getElementById('toggle-mini-btn');
  const icon = document.getElementById('toggle-icon');
  const miniPlayer = document.getElementById('mini-player');

  if (!toggleBtn || !icon || !miniPlayer) return;

  toggleBtn.addEventListener('click', () => {
    const ativo = miniPlayer.classList.toggle('active');
    icon.textContent = ativo ? 'remove' : 'add';
  });
}

function setupMiniPlayerVisibilityToggle() {
  const toggleBtn = document.getElementById('toggle-mini-btn');
  const icon = document.getElementById('toggle-icon');
  const miniPlayer = document.getElementById('mini-player');

  if (!toggleBtn || !icon || !miniPlayer) return;

  toggleBtn.addEventListener('click', () => {
    const ativo = miniPlayer.classList.toggle('active');
    icon.textContent = ativo ? 'remove' : 'add';
  });
}
