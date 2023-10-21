const API_KEY = 'AIzaSyDkTmZ_gC1KrLqexAIz7muD83-SglJwr-o';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const videoListItems = document.querySelector('.video-list__items');

const convertDuration = (isoDuration) => {
  const duration = isoDuration.replace('PT', '').replace('H', ' ч ').replace('M', ' мин ').replace('S', ' сек ');
  return duration.trim();
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
    console.error('error: ', error);
  }
};

const showVideos = (videos) => {
  videoListItems.textContent = '';

  const listVideos = videos.items.map((video) => {
    console.log('video: ', video);
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
        <button class="video-card__favorite" type="button" aria-label="Добавить в избранное, ${video.snippet.title}" title="Добавить в избранное">
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

fetchTrendingVideos().then(showVideos);
