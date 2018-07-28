/* globals gapi */
import 'babel-polyfill'
import React, { PureComponent, Fragment } from 'react';
import ReactDOM from "react-dom";

import './index.css';
import Router from './Router';
import ProjectsView from './ProjectsView';
import ProjectView from './ProjectView';
import ProjectEditView from './ProjectEditView';

const redirect = sessionStorage.redirect;
delete sessionStorage.redirect;
if (redirect && redirect != location.href) {
  history.replaceState(null, null, redirect);
}

function encodeRoute({ projectId, edit }) {
  const pathname = projectId ? `/Sheetwork/project/${projectId}${edit ? '/edit' : ''}` : '/Sheetwork/';
  const search = '';
  return { pathname, search };
}
const pathRegExp = new RegExp(`^/Sheetwork/
(?:project
  (?:/
    (?<projectId>[^/]+)
    (?:/
      (?<edit>edit)?
    )?
  )?
)
`.replace(/\n */g, ''));
function decodeRoute({ pathname }) {
  const groups = (pathRegExp.exec(pathname) || {}).groups || {};
  const { projectId, edit } = groups;

  const page = { projectId };
  if (projectId && edit) page.edit = true;
  return page;
}

const CLIENT_ID = '38243760343-v9ol1etb6tjiiaqu4i9gkjgrn6bo3t5k.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDqXoinrpugGNi52LWnrMfDGAQFjad0td4';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

class App extends PureComponent {
  state = {
    authUser: null,
    projectId: null,
    edit: false
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
  handlePageChange = ({ projectId, edit }) => {
    this.setState({ projectId, edit });
  }
  handleProject = (projectId) => {
    this.setState({ projectId, edit: true });
  }

  render() {
    const { authUser, projectId, edit } = this.state;
    return <Fragment>
      <Router encode={encodeRoute} decode={decodeRoute}
        page={{ projectId, edit }}
        onPageChange={this.handlePageChange}
      />
      { projectId
        ? edit
          ? <ProjectEditView authUser={authUser} projectId={projectId} />
          : <ProjectView authUser={authUser} projectId={projectId} />
        : <ProjectsView authUser={authUser} onProject={this.handleProject} />
      }
    </Fragment>
  }
}

const root = document.createElement('div');
root.id = "root";
document.body.appendChild(root);
ReactDOM.render(<App />, root);
