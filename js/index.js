const API_KEY = 'AIzaSyDkTmZ_gC1KrLqexAIz7muD83-SglJwr-o';
const YTV_FAVORITE_LSKEY = 'ytv-favorite';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const router = new Navigo('/', { hash: true });

const main = document.querySelector('main');

const favoriteIds = JSON.parse(localStorage.getItem(YTV_FAVORITE_LSKEY) || '[]');

const declOfNum = (n, titles) => n + ' ' + titles[n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
const declOfNumWordOnly = (n, titles) => titles[n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];

// const convertDuration = (isoDuration) => {
//   const duration = isoDuration.replace('PT', '').replace('H', ' ч ').replace('M', ' мин ').replace('S', ' сек ');
//   return duration.trim();
// };

const preload = {
  elem: document.createElement('div'),
  content: '<div class="preload"><p class="preload__text">Загрузка...</p></div>',
  add() {
    main.style.display = 'flex';
    main.append(this.elem);
  },
  remove() {
    this.elem.remove();
    main.style = '';
  },
  init() {
    this.elem.className = 'preload';
    this.elem.innerHTML = this.content;
  },
};
preload.init();

const convertDuration = (isoDuration) => {
  const hoursMatch = isoDuration.match(/(\d+)H/);
  const minutesMatch = isoDuration.match(/(\d+)M/);
  const secondsMatch = isoDuration.match(/(\d+)S/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;

  let duration = '';

  if (hours > 0) {
    duration += `${declOfNum(hours, ['час', 'часа', 'часов'])} `;
  }

  if (minutes > 0) {
    duration += `${declOfNum(minutes, ['минута', 'минуты', 'минут'])} `;
  }

  if (seconds > 0) {
    duration += `${declOfNum(seconds, ['секунда', 'секунды', 'секунд'])} `;
  }

  // const duration = isoDuration.replace('PT', '').replace('H', ' ч ').replace('M', ' мин ').replace('S', ' сек ');
  return duration.trim();
};

const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return formatter.format(date);
};

const fetchTrendingVideos = async () => {
  try {
    const url = new URL(VIDEOS_URL);
    url.searchParams.append('part', 'contentDetails,id,snippet');
    url.searchParams.append('chart', 'mostPopular');
    url.searchParams.append('regionCode', 'RU');
    url.searchParams.append('maxResults', 12);
    url.searchParams.append('key', API_KEY);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('error: ', error);
  }
};

const fetchFavoriteVideos = async () => {
  try {
    if (favoriteIds.length === 0) {
      return { items: [] };
    }

    const url = new URL(VIDEOS_URL);
    url.searchParams.append('part', 'contentDetails,id,snippet');
    url.searchParams.append('maxResults', 12);
    url.searchParams.append('id', favoriteIds.join(','));
    url.searchParams.append('key', API_KEY);

    const response = await fetch(url);
    // console.log('response: ', await response.json());

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('error: ', error);
  }
};

const fetchVideoData = async (id) => {
  try {
    const url = new URL(VIDEOS_URL);
    url.searchParams.append('part', 'snippet,statistics');
    url.searchParams.append('id', id);
    url.searchParams.append('key', API_KEY);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('error: ', error);
  }
};

const fetchSearchVideos = async (searchQuery, page) => {
  try {
    const url = new URL(SEARCH_URL);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('type', 'video');
    url.searchParams.append('key', API_KEY);

    if (page) {
      url.searchParams.append('pageToken', page);
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('error: ', error);
  }
};

const createListVideo = (videos, titleText, pagination) => {
  const videoListSection = document.createElement('section');
  videoListSection.className = 'video-list';

  const container = document.createElement('div');
  container.className = 'container video-list__container';

  const title = document.createElement('h2');
  title.className = 'video-list__title';
  title.textContent = titleText;

  const videoListItems = document.createElement('ul');
  videoListItems.className = 'video-list__items';

  const listVideos = videos.items.map((video) => {
    // console.log('video id: ', video.id);
    const id = video.id.videoId || video.id;
    const li = document.createElement('li');
    li.className = 'video-list__item';
    li.innerHTML = `
      <article class="video-card">
        <a class="video-card__link" href="#/video/${id}">
          <img 
            class="video-card__thumb" 
            src="${video.snippet.thumbnails.standard?.url || video.snippet.thumbnails.high?.url}"
            alt="Превью видео &laquo;${video.snippet.title}&raquo;"
            title="Превью видео &laquo;${video.snippet.title}&raquo;"
            width="412" height="232">
          <h3 class="video-card__title" title="${video.snippet.title}">${video.snippet.title}</h3>
          <p class="video-card__channel">${video.snippet.channelTitle}</p>
          ${video.contentDetails ? `<p class="video-card__duration">${convertDuration(video.contentDetails.duration)}</p>` : ''}
        </a>
        <button 
          class="video-card__favorite favorite ${favoriteIds.includes(id) ? 'active' : ''}" 
          type="button" 
          aria-label="Добавить в избранное, ${video.snippet.title}" 
          title="${favoriteIds.includes(id) ? 'Удалить из избранного' : 'Добавить в избранное'}"
          data-video-id="${id}">
          <svg class="video-card__icon" width="20" height="20" viewBox="0 0 20 20">
            <use class="star-o" xlink:href="./img/sprite.svg#star-obw" />
            <use class="star" xlink:href="./img/sprite.svg#star" />
          </svg>
        </button>
      </article>
    `;

    return li;
  });
  videoListItems.append(...listVideos);

  container.append(title, videoListItems);
  videoListSection.append(container);

  if (pagination) {
    console.log('pagination: ', pagination);
    // todo Pagination

    const paginationElem = document.createElement('div');
    paginationElem.className = 'pagination';

    if (pagination.prev) {
      const arrowPrev = document.createElement('a');
      arrowPrev.className = 'pagination__arrow pagination__arrow_prev';
      arrowPrev.href = `#/search?q=${pagination.searchQuery}&page=${pagination.prev}`;
      arrowPrev.textContent = 'Предыдущая страница';
      paginationElem.append(arrowPrev);
    }

    if (pagination.next) {
      const arrowNext = document.createElement('a');
      arrowNext.className = 'pagination__arrow pagination__arrow_next';
      arrowNext.href = `#/search?q=${pagination.searchQuery}&page=${pagination.next}`;
      arrowNext.textContent = 'Следующая страница';
      paginationElem.append(arrowNext);
    }

    container.append(paginationElem);
  }

  return videoListSection;
};

const createVideo = (video) => {
  console.log('video: ', video);
  const videoSection = document.createElement('section');
  videoSection.className = 'video';
  videoSection.innerHTML = `
    <div class="container video__container">        
      <div class="video__player">
        <iframe class="video__iframe" width="100%" src="https://www.youtube.com/embed/${video.id}"
          title="${video.snippet.title}" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </div>
      <div class="video__content">
        <div class="video__content-header">
          <h2 class="video__title">${video.snippet.title}</h2>
          <button 
            class="video__link favorite ${favoriteIds.includes(video.id) ? 'active' : ''}" 
            type="button"
            data-video-id="${video.id}">
            <span class="video__no-favorite">В избранное</span>
            <span class="video__favorite">В избранном</span>
            <svg class="video__icon" width="20" height="20" viewBox="0 0 20 20">
              <use class="star-o" xlink:href="./img/sprite.svg#star-obw" />
              <use class="star" xlink:href="./img/sprite.svg#star" />
            </svg>
          </button>
        </div>
        <p class="video__channel">${video.snippet.channelTitle}</p>
        <p class="video__info">
          <span class="video__views">${parseInt(video.statistics.viewCount).toLocaleString()} ${declOfNumWordOnly(parseInt(video.statistics.viewCount), ['просмотр', 'просмотра', 'просмотров'])}</span> | 
          <span class="video__date">Дата премьеры: ${formatDate(video.snippet.publishedAt)}</span>
        </p>
        <p class="video__description">${video.snippet.description.replace(/\n/g, '<br />')}</p>
      </div>
    </div>
  `;
  return videoSection;
};

const createSearch = () => {
  const searchSection = document.createElement('section');
  searchSection.className = 'search';

  const searchContainer = document.createElement('div');
  searchContainer.className = 'container search__container';

  const searchTitle = document.createElement('h2');
  searchTitle.className = 'visually-hidden';
  searchTitle.textContent = 'Поиск';

  const searchForm = document.createElement('form');
  searchForm.className = 'search__form';
  searchForm.innerHTML = `
    <input class="search__input" type="search" name="search" placeholder="Найти видео..." required>
    <button class="search__btn" type="submit">
      <span>Поиск</span>
      <svg class="search__icon" width="20" height="20" viewBox="0 0 20 20">
        <use xlink:href="./img/sprite.svg#search" />
      </svg>
    </button>
  `;

  searchContainer.append(searchTitle, searchForm);
  searchSection.append(searchContainer);

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (searchForm.search.value.trim()) {
      router.navigate(`/search?q=${searchForm.search.value}`);
    }
  });

  return searchSection;
};

const createHero = () => {
  const heroSection = document.createElement('section');
  heroSection.className = 'hero';

  heroSection.innerHTML = `
    <div class="container">
      <div class="hero__container">
        <a class="hero__link" href="#/favorite">
          <span>Избранное</span>
          <svg class="hero__icon" width="20" height="20" viewBox="0 0 20 20" role="img">
            <use xlink:href="./img/sprite.svg#star-ow" />
          </svg>
        </a>
        <svg class="hero__logo" viewBox="0 0 240 32" role="img"
          aria-label="Логотип сервиса You-Tvideo">
          <use xlink:href="./img/sprite.svg#logo-white" />
        </svg>
        <h1 class="hero__title">Смотри. Загружай. Создавай</h1>
        <p class="hero__tagline">Удобный видеохостинг для тебя</p>
      </div>
    </div>
  `;

  return heroSection;
};

const createHeader = () => {
  const header = document.querySelector('.header');
  if (header) {
    return header;
  }
  const headerElem = document.createElement('header');
  headerElem.className = 'header';
  headerElem.innerHTML = `
    <div class="container header__container">
      <a class="header__link" href="#/">
        <svg class="header__logo" viewBox="0 0 240 32" role="img" aria-label="Логотип сервиса You-Tvideo">
          <use xlink:href="./img/sprite.svg#logo-orange" />
        </svg>
      </a>

      <a class="header__link header__link_favorite" href="#/favorite">
        <span>Избранное</span>
        <svg class="header__favorite-icon" width="20" height="20" viewBox="0 0 20 20">
          <use xlink:href="./img/sprite.svg#star-ob" />
        </svg>
      </a>
    </div>
  `;
  return headerElem;
};

const indexRoute = async () => {
  // Header остаётся при переходе с других страниц, надо убирать (?)
  // const header = document.querySelector('.header');
  // if (header) {
  //   header.remove();
  // }
  
  // Короткий вариант:
  document.querySelector('.header')?.remove();

  main.innerHTML = '';
  preload.add();
  const hero = createHero();
  const search = createSearch();

  const videos = await fetchTrendingVideos();
  preload.remove();
  const listVideo = createListVideo(videos, 'В тренде');

  main.append(hero, search, listVideo);
};

const videoRoute = async (ctx) => {
  const id = ctx.data.id;
  //todo Вставить preloader
  main.textContent = '';
  preload.add();

  document.body.prepend(createHeader());

  const search = createSearch();

  const data = await fetchVideoData(id);
  const video = data.items[0];
  preload.remove(); //todo Убрать preloader
  const videoSection = createVideo(video);

  main.append(search, videoSection);

  const searchQuery = video.snippet.title;
  const videos = await fetchSearchVideos(searchQuery);
  const listVideo = createListVideo(videos, 'Похожие видео');

  main.append(listVideo);
};

const favoriteRoute = async () => {
  document.body.prepend(createHeader());
  main.textContent = '';

  preload.add();

  const search = createSearch();
  const videos = await fetchFavoriteVideos();
  // console.log('videos: ', videos);

  preload.remove();

  const listVideo = createListVideo(videos, 'Избранное');

  main.append(search, listVideo);
};

const searchRoute = async (ctx) => {
  const searchQuery = ctx.params.q;
  const page = ctx.params.page;

  if (searchQuery) {
    document.body.prepend(createHeader());
    main.textContent = '';

    preload.add();

    const search = createSearch();
    const videos = await fetchSearchVideos(searchQuery, page);

    preload.remove();

    const listVideo = createListVideo(videos, 'Результаты поиска', {
      searchQuery,
      next: videos.nextPageToken,
      prev: videos.prevPageToken,
    });

    main.append(search, listVideo);
  }
};

const init = () => {
  router
    .on({
      '/': indexRoute,
      '/video/:id': videoRoute,
      '/favorite': favoriteRoute,
      '/search': searchRoute,
    })
    .resolve();

  //* Всё, что ниже закомментировано, заменили роутером вверху
  /* 
  const currentPage = location.pathname.split('/').pop();
  const urlSearchParams = new URLSearchParams(location.search);
  const videoID = urlSearchParams.get('id');
  const searchQuery = urlSearchParams.get('q');

  if (currentPage === 'index.html' || currentPage === '') {
    fetchTrendingVideos().then(showListVideos);
  } else if (currentPage === 'video.html' && videoID) {
    fetchVideoData(videoID).then(showVideo);
  } else if (currentPage === 'favorite.html') {
    console.log('currentPage: ', currentPage);
    fetchFavoriteVideos().then(showListVideos);
  } else if (currentPage === 'search.html' && searchQuery) {
    console.log('currentPage: ', currentPage);
  }
  */

  document.body.addEventListener('click', (e) => {
    const itemFavorite = e.target.closest('.favorite');

    if (itemFavorite) {
      const videoId = itemFavorite.dataset.videoId;

      if (favoriteIds.includes(videoId)) {
        favoriteIds.splice(favoriteIds.indexOf(videoId), 1);
        localStorage.setItem(YTV_FAVORITE_LSKEY, JSON.stringify(favoriteIds));
        itemFavorite.classList.remove('active');
        itemFavorite.title = 'Добавить в избранное';
      } else {
        favoriteIds.push(videoId);
        localStorage.setItem(YTV_FAVORITE_LSKEY, JSON.stringify(favoriteIds));
        itemFavorite.classList.add('active');
        itemFavorite.title = 'Удалить из избранного';
      }
    }
  });
};
init();
