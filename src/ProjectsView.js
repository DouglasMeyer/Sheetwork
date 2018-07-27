/* globals gapi */
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { get, set } from './persistance';

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
};

const gridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center'
};

const projectStyle = {
  backgroundColor: '#EEE',
  boxShadow: '1px 1px 1px 1px rgba(100, 100, 100, 0.3)',
  margin: '0.5em',
  padding: '1em',
  borderRadius: '3px',
  cursor: 'pointer'
};

const newProjectStyle = Object.assign({},
  projectStyle,
  {
    maxWidth: '200px',
    textAlign: 'center',
  }
);

const disabledNewProjectStyle = Object.assign({},
  newProjectStyle,
  {
    color: '#888',
    cursor: 'default'
  }
);

export default class ProjectsView extends PureComponent {
  static propTypes = {
    onProject: PropTypes.func,
    authUser: PropTypes.shape({})
  }

  constructor(props) {
    super(props);
    this.state = { projects: get('projects', {}) };
  }

  handleNewProject = async () => {
    var spreadsheetBody = {
      properties: {
        title: "Untitled Sheetwork spreadsheet"
      },
      developerMetadata: {
        metadataKey: 'Sheetwork_View',
        metadataValue: JSON.stringify({ component: 'JSONView' }),
        location: { spreadsheet: true },
        visibility: 'PROJECT'
      }
    };

    const response = await gapi.client.sheets.spreadsheets.create({}, spreadsheetBody);

    const { spreadsheetId: id, properties: { title } } = response.result;
    this.setState(({ projects }) => {
      const newProjects = { ...projects, [id]: title };
      set('projects', newProjects);
      return { projects: newProjects };
    });

    this.props.onProject(id);
  }

  render() {
    const { projects } = this.state;
    const { authUser } = this.props;

    return <div style={pageStyle}>
      <div style={gridStyle}>
        <div style={disabledNewProjectStyle}>
          Create project from<br /><em>existing spreadsheet</em>
        </div>
        <div style={authUser ? newProjectStyle : disabledNewProjectStyle} onClick={this.handleNewProject}>
          Create project from<br /><em>new spreadsheet</em>
        </div>
        <div style={disabledNewProjectStyle}>
          Create project<br /><em>stored on this computer</em>
        </div>
      </div>
      <div style={gridStyle}>
        { Object.keys(projects).map(projectId =>
          <div key={projectId} style={projectStyle} onClick={() => this.props.onProject(projectId)}>
            { projects[projectId] }
          </div>
        )}
      </div>
    </div>;
  }
}