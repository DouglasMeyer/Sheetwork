/* globals gapi */
import React, { PureComponent } from "react";
import PropTypes from "prop-types";

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
    const storedProjects = localStorage.getItem('Sheetwork_projects');
    const projects = storedProjects ? JSON.parse(storedProjects) : [];
    this.state = { projects };
  }

  handleNewProject = async () => {
    var spreadsheetBody = {
      properties: {
        title: "Untitled Sheetwork spreadsheet"
      }
    };

    const response = await gapi.client.sheets.spreadsheets.create({}, spreadsheetBody);

    const project = response.result;
    this.setState(({ projects }) => {
      const newProjects = [ project, ...projects ];
      localStorage.setItem('Sheetwork_projects', JSON.stringify(newProjects))
      return { projects: newProjects };
    });


    this.props.onProject(project);
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
        { projects.map(project =>
          <div key={project.spreadsheetId} style={projectStyle} onClick={() => this.props.onProject(project)}>
            { project.properties.title }
          </div>
        )}
      </div>
    </div>;
  }
}