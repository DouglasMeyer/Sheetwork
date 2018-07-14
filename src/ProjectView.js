/* globals gapi */
import React, { PureComponent, createElement, createContext } from "react";
import PropTypes from "prop-types";

function objectMap(object, fn) {
  return Object.keys(object).map((key, index) => fn(key, object[key], index));
}
function firstInstance(item, index, array) {
  return array.indexOf(item) === index;
}

const ActionsContext = createContext();
const RecordsContext = createContext();
const SpreadsheetContext = createContext();

function consumesContext(Context, propName) {
  return function(Component) {
    return class ConsumesContextComponent extends PureComponent {
      render() {
        return <Context.Consumer>
          { value => <Component { ...{ ...this.props, [propName]: value } } /> }
        </Context.Consumer>;
      }
    };
  };
}

function RenderView({ component, ...props }) {
  return createElement(component, props);
}
RenderView.propTypes = {
  component: PropTypes.any
};

@consumesContext(RecordsContext, 'allRecords')
class TableView extends PureComponent {
  static propTypes = {
    records: PropTypes.string.isRequired,
    allRecords: PropTypes.shape({}).isRequired,
    columns: PropTypes.shape({})
  }

  render() {
    const { records, allRecords, columns: propColumns } = this.props;
    const { attributes=[], list=[] } = allRecords[records] ? allRecords[records] : {};
    const columns = propColumns || attributes.reduce((attrs, attr) => ({ ...attrs, [attr]: {} }), {});

    return <table>
      <thead>
        <tr>
          { objectMap(columns, (col, { align }) => <th key={col} style={{ textAlign: align }}>{ col }</th>) }
        </tr>
      </thead>
      <tbody>
        { list.map((item, y) => <tr key={y}>
          { objectMap(columns, (col, { align, attr }) => <td key={col} style={{ textAlign: align }}>{ item[attr || col] }</td>) }
        </tr>) }
      </tbody>
    </table>;
  }
}
class GridView extends PureComponent {
  static propTypes = {
    children: PropTypes.array.isRequired
  }

  render() {
    return <div style={{ display: 'grid' }}>
      { this.props.children.map((child, index) => <RenderView key={index} {...child} />) }
    </div>;
  }
}
@consumesContext(ActionsContext, 'actions')
@consumesContext(RecordsContext, 'records')
@consumesContext(SpreadsheetContext, 'spreadsheet')
class FormView extends PureComponent {
  static propTypes = {
    record: PropTypes.string.isRequired,
    records: PropTypes.shape({}),
    spreadsheet: PropTypes.shape({}),
    actions: PropTypes.shape({}),
    fields: PropTypes.shape({})
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const { record, spreadsheet: { spreadsheetId }, actions: { onUpdateRecords } } = this.props;
    const formElements = [ ...e.target.elements ].filter(formElement => formElement.name);

    const value = formElements.map(formElement => formElement.value);
    formElements.map(formElement => formElement.value = '');

    await gapi.client.sheets.spreadsheets.values
      .append({ spreadsheetId, range: `${record}!A1:Z1000`, valueInputOption: "USER_ENTERED" }, { values: [ value ] })

    onUpdateRecords();
  }

  render() {
    const { record, records, fields: propFields } = this.props;
    const attributes = records[record] ? records[record].attributes : [];
    const fields = propFields || attributes.reduce((attrs, attr) => ({ ...attrs, [attr]: {} }), {});

    return <form onSubmit={this.handleSubmit}>
      { objectMap(fields, (attr, { listFrom, type, ...props }) => {
        let list;
        if (listFrom) {
          const [ collection, listAttr ] = listFrom.split('.');
          list = <datalist id={`${attr}_list`}>
            { (records[collection] ? records[collection].list : []).map(item => item[listAttr]).filter(firstInstance).map(item => <option key={item} value={item} />) }
          </datalist>;
        }
        return <label key={attr}>
          {attr}
          {list}
          <input type={type || 'text'} name={attr} list={listFrom ? `${attr}_list` : null} {...props} />
        </label>;
      } ) }
      <input type="submit" />
    </form>;
  }
}

export default class ProjectView extends PureComponent {
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
    const { spreadsheet, records, view } = this.state;
    const actions = {
      onUpdateRecords: this.handleUpdateRecords
    };
    if (!spreadsheet) return <div style={{ display: 'grid', placeContent: 'center' }}>Loading ...</div>;

    return <div>
      <h1><input defaultValue={ spreadsheet.properties.title } onBlur={this.handleTitleUpdate} /></h1>
      <ActionsContext.Provider value={actions}>
        <RecordsContext.Provider value={records}>
          <SpreadsheetContext.Provider value={spreadsheet}>
            <RenderView {...view} />
          </SpreadsheetContext.Provider>
        </RecordsContext.Provider>
      </ActionsContext.Provider>
    </div>;
  }
}