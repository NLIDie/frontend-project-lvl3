// @ts-check

import 'bootstrap/js/dist/modal';

import axios from 'axios';
import * as yup from 'yup';
import { nanoid } from 'nanoid';
import i18next from 'i18next';
import _differenceWith from 'lodash/differenceWith';
import _has from 'lodash/has';

import locales from './locales';
import parseRss from './rss';
import watch from './view';

const fetchingTimeout = 5000;

const getUrlWithProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://hexlet-allorigins.herokuapp.com');

  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');

  return urlWithProxy.toString();
};

const getErrorType = (err) => {
  if (err.isParsingError) {
    return 'rss';
  }

  if (err.isAxiosError) {
    return 'network';
  }

  return 'unknown';
};

const makeFeed = ({
  url,
  title,
  description,
}) => ({
  id: nanoid(),
  url,
  title,
  description,
});

const makePost = ({
  channelId,
  title,
  link,
  description,
}) => ({
  id: nanoid(),
  channelId,
  title,
  link,
  description,
});

const fetchRss = (state, url) => {
  state.loadingProcess.status = 'loading';

  const promise = axios.get(getUrlWithProxy(url), { timeout: 10000 })
    .then((response) => {
      const rssData = parseRss(response.data.contents);

      const feed = makeFeed({
        url,
        title: rssData.title,
        description: rssData.description,
      });
      const posts = rssData.items.map((item) => makePost({ ...item, channelId: feed.id }));

      state.feeds = [feed, ...state.feeds];
      state.posts = [...posts, ...state.posts];

      state.loadingProcess.status = 'idle';
      state.loadingProcess.error = null;

      state.form = {
        ...state.form,
        status: 'filling',
        error: null,
      };
    })
    .catch((err) => {
      console.error(err);
      state.loadingProcess.status = 'failed';
      state.loadingProcess.error = getErrorType(err);
    });

  return promise;
};

const fetchNewPosts = (state) => {
  const promises = state.feeds.map((feed) => (
    axios
      .get(getUrlWithProxy(feed.url))
      .then((response) => {
        const feedData = parseRss(response.data.contents);

        const newPosts = feedData.items.map((postData) => (
          makePost({ ...postData, channelId: feed.id })
        ));
        const oldPosts = state.posts.filter((post) => post.channelId === feed.id);

        const posts = _differenceWith(
          newPosts,
          oldPosts,
          (post1, post2) => post1.link === post2.link,
        ).map(makePost);

        state.posts = [...posts, ...state.posts];
      })
      .catch(console.error)
  ));

  Promise
    .all(promises)
    .finally(() => setTimeout(() => fetchNewPosts(state), fetchingTimeout));
};

export default () => {
  const initState = {
    feeds: [],
    posts: [],
    seenPosts: new Set(),
    loadingProcess: {
      status: 'idle',
      error: null,
    },
    form: {
      error: null,
      status: 'filling',
      valid: false,
    },
    modal: {
      postId: null,
    },
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('.rss-form input'),
    feedback: document.querySelector('.feedback'),
    submit: document.querySelector('.rss-form button[type="submit"]'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    modal: document.querySelector('#modal'),
  };

  i18next
    .createInstance()
    .init({
      lng: 'ru',
      debug: false,
      resources: {
        ru: locales.ru,
        en: locales.en,
      },
    })
    .then((i18nTranslate) => {
      yup.setLocale(locales.yup);

      const urlSchema = yup
        .string()
        .url('notUrl')
        .required('required');

      const validateRssUrl = (url, feeds) => {
        const feedUrls = feeds.map((feed) => feed.url);
        const actualUrlSchema = urlSchema.notOneOf(feedUrls, 'exists');

        try {
          actualUrlSchema.validateSync(url);
          return null;
        } catch (err) {
          return err.message;
        }
      };

      const state = watch(elements, initState, i18nTranslate);

      elements.form.addEventListener('submit', (evt) => {
        evt.preventDefault();

        const formData = new FormData(evt.target);
        const rssUrl = formData.get('url');

        const err = validateRssUrl(rssUrl, state.feeds);
        if (err !== null) {
          state.form = {
            ...state.form,
            valid: false,
            error: err,
          };

          return;
        }

        state.form = {
          ...state.form,
          valid: true,
          error: null,
        };

        fetchRss(state, rssUrl);
      });

      elements.postsContainer.addEventListener('click', (evt) => {
        if (!_has(evt.target.dataset, 'id')) {
          return;
        }

        const { id } = evt.target.dataset;
        state.modal.postId = id;
        state.seenPosts.add(id);
      });

      setTimeout(() => fetchNewPosts(state), fetchingTimeout);
    });
};
