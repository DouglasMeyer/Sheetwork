/* globals gapi */
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { ActionsContext, RecordsContext, SpreadsheetContext } from './contexts';
import * as Components from './Components';

export default class ProjectView extends PureComponent {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    authUser: PropTypes.shape({})
  }

  state = {
    spreadsheet: null,
    records: {},
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
      console.error(e, spreadsheet); // eslint-disable-line no-console
      view = { component: 'JSONView' };
    }
    this.setState({ spreadsheet, records: {}, view });

    await this.handleUpdateRecords();
  }
  handleUpdateRecords = async () => {
    const { spreadsheetId, sheets } = this.state.spreadsheet;

    const response = await gapi.client.sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: sheets.map(sheet => `${sheet.properties.title}!A1:Z1000`)
    });

    const records = response.result.valueRanges.reduce((acc, { range, values }) => {
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

  render() {
    const { spreadsheet, records, view: { component: componentName, ...componentProps } } = this.state;
    const ViewComponent = Components[componentName];
    const actions = {
      onUpdateRecords: this.handleUpdateRecords
    };
    if (!spreadsheet) return <div style={{ display: 'grid', placeContent: 'center' }}>Loading ...</div>;

    return <div>
      <h1>{ spreadsheet.properties.title }</h1>
      <ActionsContext.Provider value={actions}>
        <RecordsContext.Provider value={records}>
          <SpreadsheetContext.Provider value={spreadsheet}>
            <ViewComponent {...componentProps} />
          </SpreadsheetContext.Provider>
        </RecordsContext.Provider>
      </ActionsContext.Provider>
    </div>;
  }
}