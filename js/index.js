const API_KEY = 'AIzaSyDkTmZ_gC1KrLqexAIz7muD83-SglJwr-o';
const YTV_FAVORITE_LSKEY = 'ytv-favorite';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const favoriteIds = JSON.parse(localStorage.getItem(YTV_FAVORITE_LSKEY) || '[]');
const videoListItems = document.querySelector('.video-list__items');

const declOfNum = (n, titles) => n + ' ' + titles[n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
const declOfNumWordOnly = (n, titles) => titles[n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];

// const convertDuration = (isoDuration) => {
//   const duration = isoDuration.replace('PT', '').replace('H', ' ч ').replace('M', ' мин ').replace('S', ' сек ');
//   return duration.trim();
// };

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

const showListVideos = (videos) => {
  videoListItems.textContent = '';

  const listVideos = videos.items.map((video) => {
    const li = document.createElement('li');
    li.className = 'video-list__item';
    li.innerHTML = `
      <article class="video-card">
        <a class="video-card__link" href="/video.html?id=${video.id}">
          <img 
            class="video-card__thumb" 
            src="${video.snippet.thumbnails.standard?.url || video.snippet.thumbnails.high?.url}"
            alt="Превью видео &laquo;${video.snippet.title}&raquo;"
            title="Превью видео &laquo;${video.snippet.title}&raquo;"
            width="412" height="232">
          <h3 class="video-card__title" title="${video.snippet.title}">${video.snippet.title}</h3>
          <p class="video-card__channel">${video.snippet.channelTitle}</p>
          <p class="video-card__duration">${convertDuration(video.contentDetails.duration)}</p>
        </a>
        <button 
          class="video-card__favorite favorite ${favoriteIds.includes(video.id) ? 'active' : ''}" 
          type="button" 
          aria-label="Добавить в избранное, ${video.snippet.title}" 
          title="${favoriteIds.includes(video.id) ? 'Удалить из избранного' : 'Добавить в избранное'}"
          data-video-id="${video.id}">
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
};

const showVideo = ({ items: [video] }) => {
  console.log('video: ', video);
  const videoElem = document.querySelector('.video');
  videoElem.innerHTML = `
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
};

const init = () => {
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
