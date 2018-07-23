/* globals gapi */
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { ActionsContext, RecordsContext, SpreadsheetContext } from './contexts';
import { GridView, TableView, FormView } from './Components';

export default class ProjectEditView extends PureComponent {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    authUser: PropTypes.shape({})
  }

  state = {
    spreadsheet: null,
    records: {},
    view: {
      component: GridView,
      children: [
        {
          component: TableView,
          records: 'Accounts',
          columns: {
            'Account': {},
            'Amount': { attr: 'SUM of Amount', align: 'right' }
          }
        },
        {
          component: TableView,
          records: 'Transactions',
          columns: {
            'Date': { align: 'right' },
            'Amount': { align: 'right' },
            'Account': {},
            'Description': {}
          }
        },
        { component: FormView,
          record: 'Transactions',
          fields: {
            'Date': { type: 'date', defaultValue: (new Date).toJSON().slice(0, 10) },
            'Amount': { type: 'number' },
            'Account': { listFrom: 'Accounts.Account' },
            'Description': {}
          }
        }
      ]
    }
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
    this.setState({ spreadsheet, records: {} });

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
  handleTitleUpdate = async ({ target: { value } }) => {
    const { projectId } = this.props;

    await gapi.client.sheets.spreadsheets
      .batchUpdate({ spreadsheetId: projectId }, { requests: [ { updateSpreadsheetProperties: {
        properties: { title: value }, fields: 'title'
      } } ] });
  }

  render() {
    const { spreadsheet, records, view: { component: ViewComponent, ...componentProps } } = this.state;
    const actions = {
      onUpdateRecords: this.handleUpdateRecords
    };
    if (!spreadsheet) return <div style={{ display: 'grid', placeContent: 'center' }}>Loading ...</div>;

    return <div>
      <h1><input defaultValue={ spreadsheet.properties.title } onBlur={this.handleTitleUpdate} /></h1>
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
