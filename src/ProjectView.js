import React, { PureComponent } from "react";
import PropTypes from "prop-types";

// const pageStyle = {
//   display: 'flex',
//   flexDirection: 'column',
//   justifyContent: 'center'
// };

// const gridStyle = {
//   display: 'flex',
//   flexWrap: 'wrap',
//   justifyContent: 'center',
//   alignItems: 'center'
// };

// const projectStyle = {
//   backgroundColor: '#EEE',
//   boxShadow: '1px 1px 1px 1px rgba(100, 100, 100, 0.3)',
//   margin: '0.5em',
//   padding: '1em',
//   borderRadius: '3px',
// };

// const newProjectStyle = Object.assign({},
//   projectStyle,
//   {
//     maxWidth: '200px',
//     textAlign: 'center'
//   }
// );

// const disabledNewProjectStyle = Object.assign({},
//   newProjectStyle,
//   {
//     color: '#888'
//   }
// );

export default class ProjectView extends PureComponent {
  static propTypes = {
    project: PropTypes.shape({
    })
    // onProject: PropTypes.func
  }

  // constructor(props) {
  //   super(props);
  //   const storedProjects = localStorage.getItem('Sheetwork_projects');
  //   const projects = storedProjects
  //     ? JSON.parse(storedProjects)
  //     : [
  //         { name: 'TaskTickets' }
  //       ];
  //   this.state = { projects };
  // }

  // handleNewProject = async () => {
  //   const project = fetch(`/projects`, {
  //     method: 'POST'
  //   });
  //   this.props.onProject(project);
  // }

  render() {
    const { project } = this.props;
    console.log(project);

    // return <div style={pageStyle}>
    //   <div style={gridStyle}>
    //     <div style={disabledNewProjectStyle}>
    //       Create project from<br /><em>existing spreadsheet</em>
    //     </div>
    //     <div style={newProjectStyle} onClick={this.handleNewProject}>
    //       Create project from<br /><em>new spreadsheet</em>
    //     </div>
    //     <div style={disabledNewProjectStyle}>
    //       Create project<br /><em>stored on this computer</em>
    //     </div>
    //   </div>
    //   <div style={gridStyle}>
    //     { projects.map(project =>
    //       <div key={project.name} style={projectStyle}>
    //         { project.name }
    //       </div>
    //     )}
    //   </div>
    // </div>;
    return <pre>{JSON.stringify(project, null, 2)}</pre>;
  }
}