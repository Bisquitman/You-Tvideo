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
  // content: '<div class="preload"><p class="preload__text">Загрузка...</p></div>',
  content: `
    <div class="preload">
      <div class="spinner">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
      </div>
    </div>
  `,
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
      arrowPrev.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.02542 10L12.8754 5.63902C12.9154 5.60387 12.9469 5.56215 12.9683 5.51626C12.9897 5.47037 13.0005 5.42122 13 5.37167C12.9995 5.32212 12.9878 5.27314 12.9656 5.22756C12.9433 5.18199 12.911 5.14073 12.8704 5.10617C12.8298 5.07161 12.7818 5.04444 12.7291 5.02623C12.6764 5.00802 12.6201 4.99912 12.5635 5.00007C12.5069 5.00101 12.451 5.01177 12.3992 5.03173C12.3473 5.05168 12.3005 5.08043 12.2615 5.11632L7.12133 9.73865C7.04353 9.80862 7 9.90238 7 10C7 10.0976 7.04353 10.1914 7.12133 10.2613L12.2615 14.8837C12.3005 14.9196 12.3473 14.9483 12.3992 14.9683C12.451 14.9882 12.5069 14.999 12.5635 14.9999C12.6201 15.0009 12.6764 14.992 12.7291 14.9738C12.7818 14.9556 12.8298 14.9284 12.8704 14.8938C12.911 14.8593 12.9433 14.818 12.9656 14.7724C12.9878 14.7269 12.9995 14.6779 13 14.6283C13.0005 14.5788 12.9897 14.5296 12.9683 14.4837C12.9469 14.4379 12.9154 14.3961 12.8754 14.361L8.02542 10Z" fill="currentColor"/>
        </svg> <span>Назад</span>
      `;
      paginationElem.append(arrowPrev);
    }

    if (pagination.next) {
      const arrowNext = document.createElement('a');
      arrowNext.className = 'pagination__arrow pagination__arrow_next';
      arrowNext.href = `#/search?q=${pagination.searchQuery}&page=${pagination.next}`;
      arrowNext.innerHTML = `
        <span>Вперёд</span> <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.9746 10L7.12457 5.63902C7.08464 5.60387 7.05307 5.56215 7.03169 5.51626C7.01031 5.47037 6.99954 5.42122 7.00001 5.37167C7.00048 5.32212 7.01218 5.27314 7.03443 5.22756C7.05668 5.18199 7.08904 5.14073 7.12963 5.10617C7.17022 5.07161 7.21824 5.04444 7.27092 5.02623C7.32359 5.00802 7.37987 4.99912 7.4365 5.00007C7.49313 5.00101 7.54898 5.01177 7.60082 5.03173C7.65266 5.05168 7.69947 5.08043 7.73853 5.11632L12.8787 9.73865C12.9565 9.80862 13 9.90238 13 10C13 10.0976 12.9565 10.1914 12.8787 10.2613L7.73853 14.8837C7.69947 14.9196 7.65266 14.9483 7.60082 14.9683C7.54898 14.9882 7.49313 14.999 7.4365 14.9999C7.37987 15.0009 7.32359 14.992 7.27092 14.9738C7.21824 14.9556 7.17022 14.9284 7.12963 14.8938C7.08904 14.8593 7.05668 14.818 7.03443 14.7724C7.01218 14.7269 7.00048 14.6779 7.00001 14.6283C6.99954 14.5788 7.01031 14.5296 7.03169 14.4837C7.05307 14.4379 7.08464 14.3961 7.12457 14.361L11.9746 10Z" fill="currentColor"/>
        </svg>
      `;
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
        <p class="video__description">${video.snippet.description.replaceAll('\n', '<br />')}</p>
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
