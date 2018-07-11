// @flow
import { Component } from 'react';
import PropTypes from "prop-types";
import { createBrowserHistory as createHistory } from 'history';

export default class Router extends Component {
  static propTypes = {
    encode: PropTypes.func.isRequired,
    decode: PropTypes.func.isRequired,
    page: PropTypes.any.isRequired,
    onPageChange: PropTypes.func.isRequired,

    isPageChange: PropTypes.func
  }

  static defaultProps = {
    isPageChange: () => true
  }

  isCurrentLocation({ pathname, search }) {
    return pathname === this.history.location.pathname &&
      search === this.history.location.search;
  }

  componentDidMount() {
    this.history = createHistory();

    const onHistory = (location) => {
      const { encode, decode, page, onPageChange } = this.props;

      const decoded = decode(location);
      const encoded = encode(decoded);
      if (!this.isCurrentLocation(encoded)) {
        this.history.replace(encoded);
      }

      if (
        JSON.stringify(decoded) !== JSON.stringify(page)
      ) onPageChange(decoded);
    };
    onHistory(this.history.location);
    this.endHistory = this.history.listen(onHistory);
  }

  componentWillUnmount() {
    this.endHistory();
  }

  shouldComponentUpdate(nextProps) {
    return this.props.page !== nextProps.page;
  }

  componentDidUpdate() {
    const { decode, encode, page, isPageChange } = this.props;
    const oldPage = decode(this.history.location);
    const encoded = encode(page);
    if (!this.isCurrentLocation(encoded)) {
      if (isPageChange(oldPage)) {
        this.history.push(encoded);
      } else {
        this.history.replace(encoded);
      }
    }
  }

  render() { return null; } // eslint-disable-line class-methods-use-this
}
