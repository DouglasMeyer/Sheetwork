// @flow
import { Component } from 'react';
import { createHashHistory as createHistory } from 'history';
import LZString from 'lz-string';

type CurrentPageType = {
  component?: string,
  styles?: string,
  playground?: string
}

type Route = {
  currentPage: CurrentPageType
}

type Location = any

type RouterProps = Route & {
  setCurrentPage: (currentPage: CurrentPageType) => void
}

export function encode({ currentPage }: Route): Location {
  let pathname;
  if (currentPage.component) pathname = `/component/${currentPage.component}`;
  else if (currentPage.styles) pathname = `/styles/${currentPage.styles}`;
  else if (currentPage.playground !== undefined) pathname = `/playground/${LZString.compressToEncodedURIComponent(currentPage.playground)}`;
  else pathname = '/';
  const search = '?';
  return { pathname, search };
}

function decode({ pathname, search }: Location): Route {
  const currentPage: CurrentPageType = {};
  const pageMatch = /^\/(component|styles|playground)\/([^/]+)/.exec(pathname);
  if (pageMatch) currentPage[pageMatch[1]] = pageMatch[2];

  // Old way of linking to playground
  const playgroundMatch = /playground=(.*)/.exec(search);
  if (playgroundMatch) {
    currentPage.playground = decodeURIComponent(playgroundMatch[1]);
  // New way of linking to playground
  } else if (currentPage.playground) {
    currentPage.playground = LZString.decompressFromEncodedURIComponent(currentPage.playground);
  }

  return { currentPage };
}

export default class Router extends Component<RouterProps> {
  history: any
  endHistory: any

  isCurrentLocation({ pathname, search }: Location) {
    return pathname === this.history.location.pathname &&
      search === (this.history.location.search || '?');
  }

  isPageChange(oldState: Route) {
    const { currentPage: { component, styles, playground } } = this.props;
    return component !== oldState.currentPage.component ||
      styles !== oldState.currentPage.styles ||
      // It isn't a page change if the playground contents changes.
      !!playground !== !!oldState.currentPage.playground;
  }

  componentWillMount() {
    this.history = createHistory();

    const onHistory = (location) => {
      const {
        currentPage,
        setCurrentPage
      } = this.props;

      const decoded = decode(location);
      const encoded = encode(decoded);
      if (!this.isCurrentLocation(encoded)) {
        this.history.replace(encoded);
      }

      if (
        JSON.stringify(decoded.currentPage) !== JSON.stringify(currentPage)
      ) setCurrentPage(decoded.currentPage);
    };
    onHistory(this.history.location);
    this.endHistory = this.history.listen(onHistory);
  }

  componentWillUnmount() {
    this.endHistory();
  }

  shouldComponentUpdate(nextProps: RouterProps) {
    return this.props.currentPage !== nextProps.currentPage;
  }

  componentDidUpdate() {
    const { currentPage } = this.props;
    const oldState = decode(this.history.location);
    const encoded = encode({ currentPage });
    if (!this.isCurrentLocation(encoded)) {
      if (this.isPageChange(oldState)) {
        this.history.push(encoded);
      } else {
        this.history.replace(encoded);
      }
    }
  }

  render() { return null; } // eslint-disable-line class-methods-use-this
}
