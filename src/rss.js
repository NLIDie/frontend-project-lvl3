// @ts-check

class RSSParsingError extends Error {
  constructor(message) {
    super(message);
    this.isParsingError = true;
  }
}

export default (data) => {
  const parser = new DOMParser();
  const rssDOM = parser.parseFromString(data, 'text/xml');

  const parserError = rssDOM.querySelector('parsererror');
  if (parserError === undefined) {
    throw new RSSParsingError(parserError.textContent);
  }

  const channelTitleElem = rssDOM.querySelector('channel > title');
  const channelDescriptionElem = rssDOM.querySelector('channel > description');
  const itemElements = rssDOM.querySelectorAll('item');

  const items = Array.from(itemElements).map((elem) => {
    const titleElement = elem.querySelector('title');
    const linkElement = elem.querySelector('link');
    const descriptionElement = elem.querySelector('description');

    return {
      title: titleElement.textContent,
      link: linkElement.textContent,
      description: descriptionElement.textContent,
    };
  });

  return {
    title: channelTitleElem.textContent,
    description: channelDescriptionElem.textContent,
    items,
  };
};
