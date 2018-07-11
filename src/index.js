/* globals gapi */
import 'babel-polyfill'
import React, { PureComponent, Fragment } from 'react';
import ReactDOM from "react-dom";

import Router from './Router';
import ProjectsView from './ProjectsView';
import ProjectView from './ProjectView';

function encodeRoute({ projectId }) {
  const pathname = projectId ? `/project/${projectId}` : '/';
  const search = '';
  return { pathname, search };
}
function decodeRoute({ pathname }) {
  const page = { projectId: null };
  const projectMatch = /^\/project\/([^/]+)/.exec(pathname);
  if (projectMatch) page.projectId = projectMatch[1];

  return page;
}

const CLIENT_ID = 'XXX';
const API_KEY = 'YYY';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

class App extends PureComponent {
  state = {
    authUser: null,
    projectId: null
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
  handlePageChange = ({ projectId }) => {
    this.setState({ projectId });
  }
  handleProject = (project) => {
    this.setState({ projectId: project.spreadsheetId });
  }

  render() {
    const { authUser, projectId } = this.state;
    return <Fragment>
      <Router encode={encodeRoute} decode={decodeRoute}
        page={{ projectId }}
        onPageChange={this.handlePageChange}
      />
      { projectId
        ? <ProjectView authUser={authUser} projectId={projectId} />
        : <ProjectsView authUser={authUser} onProject={this.handleProject} />
      }
    </Fragment>
  }
}

const root = document.createElement('div');
root.id = "root";
document.body.appendChild(root);
ReactDOM.render(<App />, root);
