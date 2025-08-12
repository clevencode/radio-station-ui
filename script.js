// Controles do player principal e mini-player
const PlayerControls = (() => {
  // Referências aos elementos do DOM
  const audio = document.getElementById('radio-player');
  const playBtn = document.getElementById('play-pause-btn');
  const nextBtn = document.getElementById('next-btn');
  const prevBtn = document.getElementById('prev-btn');
  const coverArt = document.getElementById('cover-art');
  const miniPlayBtn = document.querySelector('.mini-play-btn');
  const miniPlayer = document.getElementById('mini-player');

  // Estado interno do player
  let isPlaying = false;
  let stations = [];
  let currentIndex = 0;
  let lastScrollPosition = window.pageYOffset;

  // Configura comportamento do mini-player ao rolar a página
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

  // Define lista de estações disponíveis
  function setStations(newStations) {
    if (!Array.isArray(newStations)) return;
    stations = newStations;
    setCurrentIndex(0);
  }

  // Define o índice da estação atual
  function setCurrentIndex(index) {
    if (index < 0 || index >= stations.length) return;
    currentIndex = index;
    displayStation(index);
    StationGrid.atualizarGrade(stations);
  }

  // Obtém índice da estação atual
  function getCurrentIndex() {
    return currentIndex;
  }

  // Verifica se o player está tocando
  function getIsPlaying() {
    return isPlaying;
  }

  // Atualiza ícones de play/pause
  function updatePlayIcons(icon) {
    const iconHTML = `<span class="material-icons">${icon}</span>`;
    if (playBtn) playBtn.innerHTML = iconHTML;
    if (miniPlayBtn) miniPlayBtn.innerHTML = iconHTML;
    const miniIcon = document.getElementById('mini-toggle-icon');
    if (miniIcon) miniIcon.textContent = icon;
  }

  // Inicia a reprodução da estação atual
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

  // Pausa a reprodução
  function pause() {
    audio.pause();
    updatePlayIcons('play_arrow');
    isPlaying = false;
    StationGrid.atualizarGrade(stations);
  }

  // Exibe informações da estação atual no player
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

    // Atualiza campos extras
    const updateIfExists = (id, content) => {
      const el = document.getElementById(id);
      if (el) el.textContent = content;
    };
    updateIfExists('mini-artist-name', name);
    updateIfExists('mini-song-name', country);

    if (coverArt) coverArt.style.backgroundImage = `url(${icon})`;
  }

  // Eventos dos botões principais
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

  // Retorna métodos públicos
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


// Renderiza a lista de estações e permite filtro de busca
const StationGrid = (() => {
  const grid = document.querySelector('.stations-grid');
  const inputBusca = document.getElementById('search-input');
  let allStations = [];

  // Atualiza a grade com as estações filtradas
  function atualizarGrade(stations) {
    if (!grid) return;
    grid.innerHTML = '';

    // Se não houver estações, mostra mensagem
    if (!stations.length) {
      grid.innerHTML = `<div class="station-item station-empty">Nenhuma estação encontrada</div>`;
      return;
    }

    const filtro = inputBusca?.value?.toLowerCase() || '';

    // Percorre todas as estações e cria o item na grade
    stations.forEach((station, index) => {
      const name = station.name?.toLowerCase() || '';
      if (filtro && !name.includes(filtro)) return;

      const isCurrent = index === PlayerControls.getCurrentIndex();
      const isPlaying = PlayerControls.getIsPlaying() && isCurrent;

      // Cria o elemento de estação
      const item = document.createElement('div');
      item.className = 'station-item';
      if (isCurrent) item.classList.add('active');

      item.innerHTML = `
        <img
          class="thumb"
          src="${station.favicon}"
          alt="icon"
          onerror="this.onerror=null;"
        />
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

      // Evento para selecionar estação clicando no item
      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-play')) return;
        document.querySelectorAll('.station-item').forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        PlayerControls.setCurrentIndex(index);
        PlayerControls.play();
      });

      // Evento para o botão de play/pause da estação
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

  // Eventos de busca
  if (inputBusca) {
    inputBusca.addEventListener('input', () => atualizarGrade(allStations));
    inputBusca.addEventListener('focus', () => {
      document.querySelector('.player')?.classList.remove('ativo');
      document.querySelector('.estacoes-lista')?.classList.add('ativo');
    });
  }

  // Retorna função para atualizar grade
  return {
    atualizarGrade: (stations) => {
      allStations = stations;
      atualizarGrade(allStations);
    }
  };
})();


// Busca estações de rádio pela API
const StationFetcher = (() => {
  // Busca estações de um país específico
  async function fetchStationsByCountry(countryName) {
    try {
      const url = `https://de1.api.radio-browser.info/json/stations/bycountry/${encodeURIComponent(countryName)}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Erro na requisição: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Filtra apenas estações HTTPS
      const validStations = data.filter(station => 
        station.url_resolved && station.url_resolved.startsWith('https')
      );
      
      // Atualiza controles e lista
      PlayerControls.setStations(validStations);
      StationGrid.atualizarGrade(validStations);
      
      console.info(`Foram carregadas ${validStations.length} estações válidas para ${countryName}.`);
      
      // Se já estiver tocando, reinicia o player
      if (validStations.length > 0 && PlayerControls.getIsPlaying()) {
        PlayerControls.play();
      }
      
    } catch (err) {
      console.error('Erro ao buscar estações:', err);
      alert('Erro ao carregar estações. Verifique sua conexão e tente novamente.');
    }
  }

  return { fetchStationsByCountry };
})();


// Detecta país do usuário para buscar estações
const CountryDetection = (() => {
  // Mapeamento de idioma para país
  const idiomaParaPais = {
    'pt': 'Brazil', 'pt-BR': 'Brazil',
    'en': 'United States', 'en-US': 'United States',
    'fr': 'France', 'fr-FR': 'France',
    'es': 'Spain', 'es-ES': 'Spain',
    'de': 'Germany', 'de-DE': 'Germany',
    'ht': 'Haiti', 'ht-HT': 'Haiti'
  };

  // Detecta país pelo idioma do navegador
  function detectarPorIdioma() {
    const lang = navigator.language || navigator.userLanguage;
    const pais = idiomaParaPais[lang] || idiomaParaPais[lang.split('-')[0]] || 'Brazil';
    StationFetcher.fetchStationsByCountry(pais);
  }

  // Por enquanto só detecta por idioma
  function detectarComGeolocalizacao() {
    detectarPorIdioma();
  }

  return { detectarPorIdioma, detectarComGeolocalizacao };
})();


// Inicialização do app
document.addEventListener('DOMContentLoaded', () => {
  CountryDetection.detectarComGeolocalizacao();
  setupPainelAlternancia();
  setupMiniPlayerControles();
  setupMiniPlayerToggle();
});


// Alterna entre o painel do player e a lista de estações
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


// Configura botão de play/pause no mini-player
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


// Mostra ou esconde mini-player conforme o scroll
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


// Controle de Volume do Player (acessa o <audio> diretamente)
(function () {
  // Pega o slider e o elemento <audio> diretamente do DOM
  const volumeSlider = document.getElementById('volume-slider');
  const audioEl = document.getElementById('radio-player');

  // Se não existir o slider ou o audio, não faz nada
  if (!volumeSlider || !audioEl) return;

  // Carrega volume salvo (se houver) ou usa volume atual do audio
  const savedVolume = localStorage.getItem('radioVolume');
  if (savedVolume !== null) {
    audioEl.volume = parseFloat(savedVolume);
    volumeSlider.value = savedVolume;
  } else {
    // garante que o slider mostre o volume atual do elemento
    volumeSlider.value = String(audioEl.volume ?? 1);
  }

  // Atualiza o volume em tempo real ao mover o slider
  volumeSlider.addEventListener('input', (e) => {
    const novoVolume = parseFloat(e.target.value);
    audioEl.volume = novoVolume; // valor entre 0 e 1
    // opcional: salva preferência do usuário
    localStorage.setItem('radioVolume', String(novoVolume));
  });
})();

(function () {
  const volumeSlider = document.getElementById('volume-slider');
  const volumeIconBtn = document.getElementById('volume-icon-btn');
  const volumeIcon = document.getElementById('volume-icon');
  const audioEl = document.getElementById('radio-player');

  if (!volumeSlider || !volumeIconBtn || !audioEl) return;

  // Carregar volume salvo
  const savedVolume = localStorage.getItem('radioVolume');
  if (savedVolume !== null) {
    audioEl.volume = parseFloat(savedVolume);
    volumeSlider.value = savedVolume;
    updateIcon(savedVolume);
  }

  // Atualiza ícone conforme volume
  function updateIcon(vol) {
    if (vol == 0) {
      volumeIcon.textContent = 'volume_off';
    } else if (vol <= 0.5) {
      volumeIcon.textContent = 'volume_down';
    } else {
      volumeIcon.textContent = 'volume_up';
    }
  }

  // Slider muda o volume
  volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    audioEl.volume = vol;
    localStorage.setItem('radioVolume', vol);
    updateIcon(vol);
  });

  // Botão mudo / desmudo
  let lastVolume = volumeSlider.value;
  volumeIconBtn.addEventListener('click', () => {
    if (audioEl.volume > 0) {
      lastVolume = audioEl.volume;
      audioEl.volume = 0;
      volumeSlider.value = 0;
      updateIcon(0);
    } else {
      audioEl.volume = lastVolume || 0.5;
      volumeSlider.value = lastVolume || 0.5;
      updateIcon(audioEl.volume);
    }
    localStorage.setItem('radioVolume', audioEl.volume);
  });
})();
