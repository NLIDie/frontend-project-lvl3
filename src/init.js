// @ts-check

import axios from 'axios';
import * as yup from 'yup';
import { nanoid } from 'nanoid';

import parseRss from './rss';
import watch from './view';

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

      state.feeds.unshift(feed);
      state.posts.unshift(...posts);

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

export default () => {
  const initState = {
    feeds: [],
    posts: [],
    loadingProcess: {
      status: 'idle',
      error: null,
    },
    form: {
      error: null,
      status: 'filling',
      valid: false,
    },
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('.rss-form input'),
    feedback: document.querySelector('.feedback'),
    submit: document.querySelector('.rss-form button[type="submit"]'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
  };

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

  const state = watch(elements, initState);

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
};
