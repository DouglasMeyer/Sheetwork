/* globals gapi */
import 'babel-polyfill'
import React, { PureComponent, cloneElement } from 'react';
import ReactDOM from "react-dom";

import ProjectsView from './ProjectsView'
import ProjectView from './ProjectView'

const CLIENT_ID = 'XXX';
const API_KEY = 'YYY';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

class App extends PureComponent {
  state = {
    authUser: null,
    view: <ProjectsView
      onProject={project => this.setState({ view: <ProjectView project={project} /> })}
    />
  }

  componentDidMount() {
    this.getGAPIAuth();
  }

  async getGAPIAuth() {
    await new Promise(resolve => {
      const script = document.createElement('script');
      script.src = "https://apis.google.com/js/api.js";
      script.onload = resolve;
      document.head.appendChild(script);
    });
    await new Promise(resolve => gapi.load('client:auth2', resolve));
    await gapi.client.init({
      'apiKey': API_KEY,
      'clientId': CLIENT_ID,
      'scope': SCOPES,
      'discoveryDocs': DISCOVERY_DOCS,
    });
    const { currentUser } = gapi.auth2.getAuthInstance()
    currentUser.listen(this.updateAuthUser);
    this.updateAuthUser(currentUser.get());
  }
  updateAuthUser = (authUser) => {
    this.setState({ authUser });
  }

  render() {
    const { authUser, view } = this.state;
    return cloneElement(view, { authUser });
  }
}

const root = document.createElement('div');
root.id = "root";
document.body.appendChild(root);
ReactDOM.render(<App />, root);
