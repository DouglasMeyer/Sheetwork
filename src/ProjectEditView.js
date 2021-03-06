/* globals gapi */
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { ActionsContext, RecordsContext, SpreadsheetContext } from './contexts';
import { get, set } from './persistance';
import * as Components from './Components';

export default class ProjectEditView extends PureComponent {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    authUser: PropTypes.shape({})
  }

  state = {
    spreadsheet: null,
    records: {},
    edit: true,
    view: {}
  }

  componentDidMount() {
    this.ensureSpreadsheet();
  }

  componentDidUpdate() {
    this.ensureSpreadsheet();
  }

  async ensureSpreadsheet() {
    const { authUser, projectId } = this.props;

    if (!authUser) return;
    if (this.state.spreadsheet && this.state.spreadsheet.spreadsheetId === projectId) return;

    let response = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: projectId })

    const spreadsheet = response.result;
    let view;
    try {
      view = JSON.parse(spreadsheet.developerMetadata.find(({ metadataKey }) => metadataKey === "Sheetwork_View").metadataValue);
    } catch (e) {
      console.error(e, spreadsheet.developerMetadata); // eslint-disable-line no-console
      view = { component: 'JSONView' };
    }
    this.setState({ spreadsheet, records: {}, view });
    const projects = get('projects', {});
    set('projects', { ...projects, [projectId]: spreadsheet.properties.title });

    await this.handleUpdateRecords();
  }
  handleUpdateRecords = async () => {
    const { spreadsheetId, sheets } = this.state.spreadsheet;

    const response = await gapi.client.sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: sheets
        .filter(({ properties: { sheetType } }) => sheetType === 'GRID')
        .map(({ properties: { title } }) => `${title}!A1:Z1000`)
    });

    const records = response.result.valueRanges.reduce((acc, { range, values = [[]] }) => {
      const sheet = range.split('!')[0];
      const attributes = values[0];
      const list = values.slice(1).map(row =>
        row.reduce((attrs, value, index) => ({ ...attrs, [attributes[index]]: value }), {})
      )
      return {
        ...acc,
        [sheet]: { attributes, list }
      };
    }, {});

    this.setState({ records });
  }
  handleTitleUpdate = async ({ target: { value } }) => {
    const { projectId } = this.props;

    const projects = get('projects', {});
    set('projects', { ...projects, [projectId]: value });

    await gapi.client.sheets.spreadsheets
      .batchUpdate({ spreadsheetId: projectId }, { requests: [ { updateSpreadsheetProperties: {
        properties: { title: value }, fields: 'title'
      } } ] });
  }
  handleViewUpdate = async () => {
    const { projectId } = this.props;
    const { view } = this.state;

    try {
      await gapi.client.sheets.spreadsheets
        .batchUpdate({ spreadsheetId: projectId }, { requests: [ { updateDeveloperMetadata: {
          dataFilters: {
            developerMetadataLookup: {
              locationType: 'SPREADSHEET',
              metadataKey: 'Sheetwork_View'
            }
          },
          fields: '*',
          developerMetadata: {
            metadataKey: 'Sheetwork_View',
            metadataValue: JSON.stringify(view),
            location: { spreadsheet: true },
            visibility: 'PROJECT'
          }
        } } ] });
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
    }
  }
  handleUpdate = (view = {}) => {
    this.setState({ view });
  }
  handleEdit = ({ target: { checked } }) => this.setState({ edit: checked })

  render() {
    const { spreadsheet, records, edit, view: { component: componentName, ...componentProps } } = this.state;
    const ViewComponent = Components[componentName] || Components.Null;
    const actions = {
      onUpdateRecords: this.handleUpdateRecords
    };
    if (!spreadsheet) return <div style={{ display: 'grid', placeContent: 'center' }}>Loading ...</div>;

    return <div>
      <h1>
        <input defaultValue={ spreadsheet.properties.title } onBlur={this.handleTitleUpdate} />
        <a href={spreadsheet.spreadsheetUrl} target="_new">↪</a>
      </h1>
      <label>Edit <input type="checkbox" checked={edit} onChange={this.handleEdit} /></label>
      <button onClick={this.handleViewUpdate}>Save</button>
      { componentName
        ? <button onClick={() => this.handleUpdate()}>Remove Root</button>
        : null
      }
      <ActionsContext.Provider value={actions}>
        <RecordsContext.Provider value={records}>
          <SpreadsheetContext.Provider value={spreadsheet}>
            <ViewComponent edit={edit} onUpdate={this.handleUpdate} {...componentProps} />
          </SpreadsheetContext.Provider>
        </RecordsContext.Provider>
      </ActionsContext.Provider>
    </div>;
  }
}
