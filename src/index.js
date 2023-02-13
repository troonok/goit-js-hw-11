import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { FetchImg } from './js/fetchImg';
import { LoadMoreBtn } from './js/loadMoreBtn';

const formtEl = document.querySelector('.search__form');
const galleryEl = document.querySelector('.gallery');

const fetchImg = new FetchImg();
const showMoreBtnEl = new LoadMoreBtn({
  selector: '#load-more',
  isHidden: true,
});

formtEl.addEventListener('submit', onSubmit);
showMoreBtnEl.button.addEventListener('click', onMoreSearch);

function onSubmit(evt) {
  evt.preventDefault();

  const form = evt.currentTarget;
  fetchImg.search = form.elements.searchQuery.value.trim();

  if (fetchImg.search === '') {
    clearImgList();
    showMoreBtnEl.hide();
    return Notify.failure('Please enter your request');
  }
  showMoreBtnEl.hide();
  clearImgList();
  fetchImg.resetPage();

  fetchImgCard().finally(form.reset());
}

function onMoreSearch() {
  showMoreBtnEl.disable();
  fetchImgCard().then(markup => {
    scroll();

    return markup;
  });
}

async function fetchImgCard() {
  try {
    const data = await fetchImg.getImg();
    if (!data.totalHits) {
      showMoreBtnEl.hide();
      return Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    }

    if (!(fetchImg.queryPage > 2)) {
      Notify.success(`Hooray! We found ${data.totalHits} images.`);
    }

    let currentPage = (+fetchImg.queryPage - 1) * fetchImg.per_page;
    console.log(currentPage);
    let totalImg = data.totalHits;
    console.log(totalImg);

    if (totalImg <= currentPage) {
      Notify.info("We're sorry, but you've reached the end of search results.");
      showMoreBtnEl.hide();
    } else {
      showMoreBtnEl.show();
    }

    const hits = await data.hits;
    const listImg = await createMurkup(hits);
    const murkupList = await updateImgList(listImg);
    showMoreBtnEl.enable();
    lightbox.refresh();

    return murkupList;
  } catch (error) {
    onError();
    console.log(error.message);
  }
}

function createMurkup(images) {
  const markup = images
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `
     
    <div class="photo-card">
     <a class="photo__item" href="${largeImageURL}">
  <img class="img" src="${webformatURL}" alt="${tags}" loading="lazy" />
  </a>
  <div class="info">
    <p class="info-item"><b>Likes</b> ${likes}</p>
    <p class="info-item"><b>Views</b> ${views}</p>
    <p class="info-item"><b>Comments</b> ${comments}</p>
    <p class="info-item"><b>Downloads</b> ${downloads}</p>
  </div>
</div>`
    )
    .join('');
  return markup;
}

function updateImgList(markup) {
  galleryEl.insertAdjacentHTML('beforeend', markup);
}

function clearImgList() {
  galleryEl.innerHTML = '';
}

function onError() {
  clearImgList();
  Notify.failure('Please enter your details');
}

var lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: '250',
});

function scroll() {
  const { height: cardHeight = fetchImg.per_page } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight,
    behavior: 'smooth',
  });
}