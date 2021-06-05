// @ts-check

import onChange from 'on-change';
import _has from 'lodash/has';

const errorTextMapping = {
  noRss: 'Ресурс не содержит валидный RSS',
  network: 'Ошибка сети',
  unknown: 'Неизвестная ошибка. Что-то пошло не так.',
  exists: 'RSS уже существует',
  required: 'Не должно быть пустым',
  notUrl: 'Ссылка должна быть валидным URL',
};

const handleForm = (elements, state) => {
  const { form: { valid, error } } = state;
  const { input, feedback } = elements;

  if (valid) {
    input.classList.remove('is-invalid');
    return;
  }

  input.classList.add('is-invalid');
  feedback.classList.add('text-danger');
  feedback.textContent = errorTextMapping[error];
};

const loadingProcessStatusMapping = {
  idle: (elements) => {
    const {
      submit,
      input,
      feedback,
    } = elements;

    submit.disabled = false;
    input.removeAttribute('readonly');
    input.value = '';
    feedback.classList.add('text-success');
    feedback.textContent = 'RSS успешно загружен';
    input.focus();
  },

  failed: (elements, state) => {
    const {
      submit,
      input,
      feedback,
    } = elements;

    submit.disabled = false;
    input.removeAttribute('readonly');
    feedback.classList.add('text-danger');
    feedback.textContent = errorTextMapping[state.loadingProcess.error];
  },

  loading: (elements) => {
    const {
      submit,
      input,
      feedback,
    } = elements;

    submit.disabled = true;
    input.setAttribute('readonly', true);
    feedback.classList.remove('text-success');
    feedback.classList.remove('text-danger');
    feedback.innerHTML = '';
  },
};

const handleLoadingProcessStatus = (elements, state) => {
  const {
    loadingProcess,
  } = state;

  if (!_has(loadingProcessStatusMapping, loadingProcess.status)) {
    throw new Error(`Unknown loadingProcess status: '${loadingProcess.status}'`);
  }

  loadingProcessStatusMapping[loadingProcess.status](elements, state);
};

const handleFeeds = (elements, state) => {
  const { feeds } = state;
  const { feedsContainer } = elements;

  const feedsListTemplate = feeds.map((feed) => (`
    <li class="list-group-item border-0 border-end-0">
      <h3 class="h6 m-0">${feed.title}</h3>
      <p class="m-0 small text-black-50">${feed.description}</p>
    </li>
  `)).join('\n');

  const rootTemplate = `
    <div class='card border-0'>
      <div class="card-body">
        <h2 class="card-title h4">Фиды</h2>
      </div>
      <ul class='list-group border-0 rounded-0'>
        ${feedsListTemplate}
      </ul>
    </div>
  `;

  feedsContainer.innerHTML = rootTemplate.trim();
};

const handlePosts = (elements, state) => {
  const { posts } = state;
  const { postsContainer } = elements;

  const postsListTemplate = posts.map((post) => `
      <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
        <a
          class="fw-bold"
          href="${post.link}"
          data-id="${post.id}"
          target="_blank"
          rel="noopener noreferrer"
        >${post.title}</a>

        <button
          class="btn btn-outline-primary btn-sm"
          type="button"
          data-id="${post.id}"
          data-bsToggle="modal"
          data-bsTarget="#modal"
        >Просмотр</button>
      </li>
    `).join('\n');

  const rootTemplate = `
    <div class="card border-0">
      <div class="card-body">
        <h2 class="card-title h4">Посты</h2>
      </div>

      <ul class="list-group border-0 rounded-0">
        ${postsListTemplate}
      </ul>
    </div>
  `;

  postsContainer.innerHTML = rootTemplate.trim();
};

const watchedStatePathMapping = {
  form: handleForm,
  'loadingProcess.status': handleLoadingProcessStatus,
  feeds: handleFeeds,
  posts: handlePosts,
};

export default (elements, initState) => onChange(initState, (path) => {
  if (_has(watchedStatePathMapping, path)) {
    watchedStatePathMapping[path](elements, initState);
  }
});
