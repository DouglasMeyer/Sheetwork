/* globals gapi */
import React, { PureComponent, createRef } from "react";
import PropTypes from "prop-types";

export default class ProjectView extends PureComponent {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    authUser: PropTypes.shape({})
  }

  state = {
    spreadsheet: null,
    headers: {},
    records: {}
  }

  dateRef = createRef()
  amountRef = createRef()
  accountRef = createRef()
  descriptionRef = createRef()

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
    this.setState({ spreadsheet, headers: {}, records: {} });

    response = await gapi.client.sheets.spreadsheets.values.batchGet({
      spreadsheetId: projectId,
      ranges: spreadsheet.sheets.map(sheet => `${sheet.properties.title}!A1:Z1000`)
    });

    const headers = response.result.valueRanges.reduce((acc, { range, values }) => ({
      ...acc,
      [range.split('!')[0]]: values[0]
    }), {});

    const records = response.result.valueRanges.reduce((acc, { range, values }) => {
      const sheet = range.split('!')[0];
      return {
        ...acc,
        [sheet]: values.slice(1).map(cols =>
          cols.reduce((attrs, col, index) => ({ ...attrs, [headers[sheet][index]]: col }), {})
        )
      };
    }, {});

    this.setState({ headers, records });
  }
  handleSubmit = async (e) => {
    e.preventDefault();
    const { projectId } = this.props;
    const value = [
      this.dateRef.current.value,
      this.amountRef.current.value,
      this.accountRef.current.value,
      this.descriptionRef.current.value,
    ];

    const appendResponse = await gapi.client.sheets.spreadsheets.values
      .append({ spreadsheetId: projectId, range: "Transactions!A1:Z1000", valueInputOption: "USER_ENTERED" }, { values: [ value ] })

    this.dateRef.current.value = '';
    this.amountRef.current.value = '';
    this.accountRef.current.value = '';
    this.descriptionRef.current.value = '';

    const getResponse = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: projectId,
      range: appendResponse.result.updates.updatedRange
    });

    const headers = this.state.headers.Transactions;

    const record = getResponse.result.values[0].reduce((attrs, value, index) => ({ ...attrs, [headers[index]]: value }), {});

    this.setState(({ records }) => ({
      records: { ...records, Transactions: [ ...records.Transactions, record ] }
    }));
  }

  render() {
    const { spreadsheet, headers, records } = this.state;
    if (!spreadsheet) return <div style={{ display: 'grid', placeContent: 'center' }}>Loading ...</div>;

    return <div>
      { spreadsheet.sheets.map((sheet) => {
        const title = sheet.properties.title;
        const sheetHeaders = headers[title];
        const sheetRecords = records[title];
        if (!sheetHeaders) return;

        return <table key={sheet.properties.sheetId}>
          <caption>{title}</caption>
          <thead>
            <tr>
              { sheetHeaders.map(header => <th key={header}>{header}</th>) }
            </tr>
          </thead>
          <tbody>
            { sheetRecords.map((record, y) =>
              <tr key={y}>
                { sheetHeaders.map((col, x) => <td key={x}>{record[col]}</td>) }
              </tr>
            ) }
          </tbody>
        </table>;
      }) }
      <form onSubmit={this.handleSubmit}>
        <label>
          Date
          <input type="date" ref={this.dateRef} defaultValue={(new Date).toJSON().slice(0, 10)} />
        </label>
        <label>
          Amount
          <input type="number" ref={this.amountRef} />
        </label>
        <label>
          Account
          <input type="text" ref={this.accountRef} />
        </label>
        <label>
          Description
          <input type="text" ref={this.descriptionRef} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    </div>;
  }
}