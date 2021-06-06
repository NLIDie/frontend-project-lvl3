// @ts-check

import onChange from 'on-change';
import _has from 'lodash/has';

const handleForm = (elements, state, i18nTranslate) => {
  const { form: { valid, error } } = state;
  const { input, feedback } = elements;

  if (valid) {
    input.classList.remove('is-invalid');
    return;
  }

  input.classList.add('is-invalid');
  feedback.classList.add('text-danger');
  feedback.textContent = i18nTranslate([`errors.${error}`, 'errors.unknown']);
};

const loadingProcessStatusMapping = {
  idle: (elements, _, i18nTranslate) => {
    const { submit, input, feedback } = elements;

    submit.disabled = false;
    input.removeAttribute('readonly');
    input.value = '';
    feedback.classList.add('text-success');
    feedback.textContent = i18nTranslate('loading.success');
    input.focus();
  },

  failed: (elements, state, i18nTranslate) => {
    const { submit, input, feedback } = elements;

    submit.disabled = false;
    input.removeAttribute('readonly');
    feedback.classList.add('text-danger');
    feedback.textContent = i18nTranslate([`errors.${state.loadingProcess.error}`, 'errors.unknown']);
  },

  loading: (elements) => {
    const { submit, input, feedback } = elements;

    submit.disabled = true;
    input.setAttribute('readonly', true);
    feedback.classList.remove('text-success');
    feedback.classList.remove('text-danger');
    feedback.innerHTML = '';
  },
};

const handleLoadingProcessStatus = (elements, state, i18nTranslate) => {
  const { loadingProcess } = state;

  if (!_has(loadingProcessStatusMapping, loadingProcess.status)) {
    throw new Error(`Unknown loadingProcess status: '${loadingProcess.status}'`);
  }

  loadingProcessStatusMapping[loadingProcess.status](elements, state, i18nTranslate);
};

const handleFeeds = (elements, state, i18nTranslate) => {
  const { feedsContainer } = elements;
  const { feeds } = state;

  const feedsListTemplate = feeds.map((feed) => (`
    <li class="list-group-item border-0 border-end-0">
      <h3 class="h6 m-0">${feed.title}</h3>
      <p class="m-0 small text-black-50">${feed.description}</p>
    </li>
  `)).join('\n');

  const rootTemplate = `
    <div class='card border-0'>
      <div class="card-body">
        <h2 class="card-title h4">${i18nTranslate('feeds')}</h2>
      </div>
      <ul class='list-group border-0 rounded-0'>
        ${feedsListTemplate}
      </ul>
    </div>
  `;

  feedsContainer.innerHTML = rootTemplate.trim();
};

const handlePosts = (elements, state, i18nTranslate) => {
  const { postsContainer } = elements;
  const { posts, seenPosts } = state;

  const postsListTemplate = posts.map((post) => {
    const linkClasses = seenPosts.has(post.id)
      ? 'fw-normal link-secondary'
      : 'fw-bold';

    return `
      <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
        <a
          class="${linkClasses}"
          href="${post.link}"
          data-id="${post.id}"
          target="_blank"
          rel="noopener noreferrer"
        >${post.title}</a>

        <button
          class="btn btn-outline-primary btn-sm"
          type="button"
          data-id="${post.id}"
          data-bs-toggle="modal"
          data-bs-target="#modal"
        >${i18nTranslate('preview')}</button>
      </li>
    `;
  }).join('\n');

  const rootTemplate = `
    <div class="card border-0">
      <div class="card-body">
        <h2 class="card-title h4">${i18nTranslate('posts')}</h2>
      </div>

      <ul class="list-group border-0 rounded-0">
        ${postsListTemplate}
      </ul>
    </div>
  `;

  postsContainer.innerHTML = rootTemplate.trim();
};

const handleModal = (elements, state) => {
  const { modal: modalElem } = elements;
  const { posts, modal } = state;

  const titleElem = modalElem.querySelector('.modal-title');
  const bodyElem = modalElem.querySelector('.modal-body');
  const fullArticleBtnElem = modalElem.querySelector('.full-article');

  const post = posts.find(({ id }) => id === modal.postId);

  titleElem.textContent = post.title;
  bodyElem.textContent = post.description;
  fullArticleBtnElem.href = post.link;
};

const watchedStatePathMapping = {
  form: handleForm,
  'loadingProcess.status': handleLoadingProcessStatus,
  feeds: handleFeeds,
  posts: handlePosts,
  seenPosts: handlePosts,
  'modal.postId': handleModal,
};

export default (elements, initState, i18nTranslate) => onChange(initState, (path) => {
  if (_has(watchedStatePathMapping, path)) {
    watchedStatePathMapping[path](elements, initState, i18nTranslate);
  }
});
