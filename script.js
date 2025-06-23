// === Player Controls Module ===
// Responsável por controlar o player de rádio (play, pause, próxima/voltar estação, exibir informações)
const PlayerControls = (() => {
  // Elementos do DOM relacionados ao player
  const audio = document.getElementById('radio-player');
  const playBtn = document.getElementById('play');
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');
  const coverArt = document.getElementById('cover-art');
  const bars = document.querySelectorAll('.bar');

  let isPlaying = false; // Estado do player
  let stations = [];     // Lista de estações carregadas
  let currentIndex = 0;  // Índice da estação atual

  // Define as estações e exibe a primeira
  function setStations(newStations) {
    stations = newStations;
    currentIndex = 0;
    displayStation(currentIndex);
  }

  // Retorna o índice atual
  function getCurrentIndex() {
    return currentIndex;
  }

  // Define o índice atual e exibe a estação correspondente
  function setCurrentIndex(index) {
    currentIndex = index;
    displayStation(currentIndex);
  }

  // Retorna se está tocando ou não
  function getIsPlaying() {
    return isPlaying;
  }

  // Dá play no áudio e atualiza o botão
  function play() {
    audio.play();
    playBtn.innerHTML = '&#10074;&#10074;';
    isPlaying = true;
  }

  // Dá pause no áudio e atualiza o botão
  function pause() {
    audio.pause();
    playBtn.innerHTML = '&#9658;';
    isPlaying = false;
  }

  // Exibe informações da estação atual
  function displayStation(index) {
    const station = stations[index];
    if (!station) return;
    document.querySelector('.track-info h3').innerText = station.name;
    document.querySelector('.track-info p').innerText = station.country || "Desconhecido";
    coverArt.style.backgroundImage = `url(${station.favicon || 'https://via.placeholder.com/150'})`;
    audio.src = station.url_resolved;
  }

  // Eventos dos botões de controle
  playBtn.addEventListener('click', () => {
    isPlaying ? pause() : play();
  });

  nextBtn.addEventListener('click', () => {
    if (stations.length === 0) return;
    currentIndex = (currentIndex + 1) % stations.length;
    displayStation(currentIndex);
    if (isPlaying) play();
  });

  prevBtn.addEventListener('click', () => {
    if (stations.length === 0) return;
    currentIndex = (currentIndex - 1 + stations.length) % stations.length;
    displayStation(currentIndex);
    if (isPlaying) play();
  });

  // Animação das barras de áudio
  audio.addEventListener('play', () => {
    bars.forEach(bar => bar.style.animationPlayState = 'running');
  });
  audio.addEventListener('pause', () => {
    bars.forEach(bar => bar.style.animationPlayState = 'paused');
  });

  // Exporta funções e variáveis necessárias
  return {
    setStations,
    getCurrentIndex,
    setCurrentIndex,
    getIsPlaying,
    play,
    pause,
    displayStation,
    audio
  };
})();

// === Station Selector Module ===
// Responsável por atualizar e gerenciar o seletor de estações no <select>
const StationSelector = (() => {
  const stationSelector = document.getElementById('select-station');

  // Atualiza as opções do seletor de estações
  function atualizarSeletorDeEstacoes(stations) {
    stationSelector.innerHTML = '<option value="">🎧 Selecionar Estação</option>';
    if (stations.length === 0) {
      const opt = document.createElement('option');
      opt.value = "";
      opt.textContent = "Nenhuma estação disponível";
      stationSelector.appendChild(opt);
      return;
    }
    stations.forEach((station, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = station.name;
      stationSelector.appendChild(opt);
    });
  }

  // Evento de mudança no seletor: troca a estação
  stationSelector.addEventListener('change', (e) => {
    const index = parseInt(e.target.value);
    if (!isNaN(index)) {
      PlayerControls.setCurrentIndex(index);
      if (PlayerControls.getIsPlaying()) PlayerControls.play();
    }
  });

  // Exporta função de atualização
  return {
    atualizarSeletorDeEstacoes
  };
})();

// === Station Fetcher Module ===
// Responsável por buscar estações de rádio via API
const StationFetcher = (() => {
  // Busca estações pelo nome do país
  async function fetchStationsByCountry(countryName) {
    const res = await fetch(`https://de1.api.radio-browser.info/json/stations/bycountry/${encodeURIComponent(countryName)}`);
    const stations = await res.json();
    PlayerControls.setStations(stations);
    StationSelector.atualizarSeletorDeEstacoes(stations);
    if (stations.length > 0 && PlayerControls.getIsPlaying()) PlayerControls.play();
    if (stations.length === 0) alert('Nenhuma rádio encontrada para este país.');
  }
  return { fetchStationsByCountry };
})();

// === Country Detection Module ===
// Responsável por detectar o país do usuário via idioma ou localização
const CountryDetection = (() => {
  // Mapeamento de idiomas para países
  const mapaIdiomaParaPais = {
    'pt': 'Brazil',
    'pt-BR': 'Brazil',
    'en': 'United States',
    'en-US': 'United States',
    'fr': 'France',
    'fr-FR': 'France',
    'es': 'Spain',
    'es-ES': 'Spain',
    'de': 'Germany',
    'de-DE': 'Germany',
    'ht': 'Haiti',
    'ht-HT': 'Haiti'
  };

  // Detecta país pelo idioma do navegador
  function detectarPaisPorIdioma() {
    const idioma = navigator.language || navigator.userLanguage;
    const paisDetectado = mapaIdiomaParaPais[idioma] || 'Brazil';
    StationFetcher.fetchStationsByCountry(paisDetectado);
  }

  // Detecta país pelo idioma ou mostra seletor manual
  async function detectarOuSelecionarPais() {
    const idioma = navigator.language || navigator.userLanguage;
    const paisDetectado = mapaIdiomaParaPais[idioma];
    if (paisDetectado) {
      StationFetcher.fetchStationsByCountry(paisDetectado);
    } else {
      mostrarSeletorDePais();
    }
  }

  // Sucesso ao obter localização geográfica
  async function success(position) {
    const { latitude, longitude } = position.coords;
    const locationRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
    const locationData = await locationRes.json();
    const country = locationData.address.country;
    if (country) {
      StationFetcher.fetchStationsByCountry(country);
    } else {
      alert('Não foi possível detectar sua localização.');
    }
  }

  // Erro ao obter localização
  function error(err) {
    alert('Erro ao obter localização: ' + err.message);
  }

  // Exporta funções de detecção
  return {
    detectarPaisPorIdioma,
    detectarOuSelecionarPais,
    success,
    error
  };
})();

// === Inicialização ===
// Detecta país automaticamente ao carregar a página
CountryDetection.detectarPaisPorIdioma();
