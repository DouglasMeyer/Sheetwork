/* globals gapi */
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { ActionsContext, RecordsContext, SpreadsheetContext } from './contexts';

function objectMap(object, fn) {
  return Object.keys(object).map((key, index) => fn(key, object[key], index));
}
function firstInstance(item, index, array) {
  return array.indexOf(item) === index;
}

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

@consumesContext(RecordsContext, 'allRecords')
export class TableView extends PureComponent {
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
export class GridView extends PureComponent {
  static propTypes = {
    children: PropTypes.array.isRequired
  }

  render() {
    return <div style={{ display: 'grid' }}>
      { this.props.children.map(({ component: ViewComponent, ...props }, index) => <ViewComponent key={index} {...props} />) }
    </div>;
  }
}
@consumesContext(ActionsContext, 'actions')
@consumesContext(RecordsContext, 'records')
@consumesContext(SpreadsheetContext, 'spreadsheet')
export class FormView extends PureComponent {
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
