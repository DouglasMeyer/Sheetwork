/* globals gapi */
import React, { PureComponent, Fragment } from "react";
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

export class Null extends PureComponent {
  static propTypes = {
    edit: PropTypes.bool,
    onUpdate: PropTypes.func
  }

  handleChange = ({ target: { value } }) => {
    this.props.onUpdate({ component: value });
  }

  render() {
    return <div>
      Add view <select onChange={this.handleChange}>
        <option />
        { Object.keys(module.exports).map(componentName => <option key={componentName}>{ componentName }</option>) }
      </select>
    </div>;
  }
}

@consumesContext(RecordsContext, 'records')
@consumesContext(SpreadsheetContext, 'spreadsheet')
export class JSONView extends PureComponent {
  render() {
    return <pre style={{ overflowX: 'auto' }}>{ JSON.stringify(this.props, null, 2) }</pre>;
  }
}
@consumesContext(RecordsContext, 'allRecords')
export class TableView extends PureComponent {
  static propTypes = {
    records: PropTypes.string.isRequired,
    allRecords: PropTypes.shape({}).isRequired,
    columns: PropTypes.shape({}),
    edit: PropTypes.bool,
    onUpdate: PropTypes.func
  }

  render() {
    const { records, allRecords, columns: propColumns, edit } = this.props;
    const { attributes=[], list=[] } = allRecords[records] ? allRecords[records] : {};
    const columns = propColumns || attributes.reduce((attrs, attr) => ({ ...attrs, [attr]: {} }), {});

    return <table>
      { edit
        ? <caption style={{ backgroundColor: '#CCC', border: '1px dashed black' }}>
            TableView
          </caption>
        : false
      }
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
    children: PropTypes.array.isRequired,
    edit: PropTypes.bool,
    onUpdate: PropTypes.func
  }
  static defaultProps = {
    children: []
  }

  handleRemove = () => {
    const { onUpdate } = this.props;
    onUpdate(null);
  }
  handleChange = ({ target: { value }}) => {
    const { edit: _edit, onUpdate, children, ...props } = this.props;
    onUpdate({ ...props, children: [ ...children, { component: value } ], component: 'GridView' });
  }
  handleUpdate = (index, child) => {
    const { children, onUpdate } = this.props;
    onUpdate({
      component: 'GridView',
      children: [
        ...children.slice(0, index),
        child,
        ...children.slice(index + 1)
      ].filter(Boolean)
    });
  }

  render() {
    const { children, edit } = this.props;

    return <div style={edit ? { display: 'grid', gridTemplateColumns: 'auto 1fr' } : { display: 'grid' }}>
      { edit
        ? <div style={{ gridColumn: '1 / span 2', backgroundColor: '#CCC' }}>
            GridView
          </div>
        : null
      }
      { children.map(({ component: componentName, ...props }, index) => {
        const ViewComponent = module.exports[componentName];
        const view = <ViewComponent key={index} {...props} {...{ edit, onUpdate: (child) => this.handleUpdate(index, child) }} />;
        return edit
          ? <Fragment key={index}>
              <div style={{ minWidth: '3em', backgroundColor: '#CCC', border: '0 dashed black', borderWidth: '1px 0' }}>
                <p>{componentName}</p>
                <button onClick={() => this.handleUpdate(index, null)}>Remove</button>
              </div>
              {view}
            </Fragment>
          : view;
      }) }
      { edit
        ? <div style={{ gridColumn: '1 / span 2', backgroundColor: '#CCC' }}>
            Add view <select onChange={this.handleChange}>
              <option />
              { Object.keys(module.exports).map(componentName => <option key={componentName}>{ componentName }</option>) }
            </select>
          </div>
        : null
      }
    </div>;
  }
}
@consumesContext(RecordsContext, 'records')
class FormFieldView extends PureComponent {
  static propTypes = {
    records: PropTypes.shape({}),
    name: PropTypes.string.isRequired,
    hidden: PropTypes.bool,
    type: PropTypes.string,
    listFrom: PropTypes.string,
    defaultValue: PropTypes.string,
    edit: PropTypes.bool,
    onUpdate: PropTypes.func
  }

  handleHidden = ({ target: { checked } }) => {
    const { name, onUpdate, edit: _edit, records: _records, ...props } = this.props;
    onUpdate(name, { ...props, hidden: checked });
  }
  handleType = ({ target: { value } }) => {
    const { name, onUpdate, edit: _edit, records: _records, ...props } = this.props;
    onUpdate(name, { ...props, type: value });
  }
  handleDefault = ({ target: { value } }) => {
    const { name, onUpdate, edit: _edit, records: _records, ...props } = this.props;
    onUpdate(name, { ...props, defaultValue: value });
  }
  handleListFrom = ({ target: { value } }) => {
    const { name, onUpdate, edit: _edit, records: _records, ...props } = this.props;
    onUpdate(name, { ...props, listFrom: value });
  }

  render() {
    const {
      records, name, type, listFrom, hidden, defaultValue, edit,
      onUpdate: _onUpdate,
      ...props
    } = this.props;

    let list;
    if (listFrom) {
      const [ collection, listAttr ] = listFrom.split('.');
      list = <datalist id={`${name}_list`}>
        { (records[collection] ? records[collection].list : []).map(item => item[listAttr]).filter(firstInstance).map(item => <option key={item} value={item} />) }
      </datalist>;
    }

    return <Fragment>
      { edit
        ? <div style={{ backgroundColor: '#CCC', border: '1px dashed black' }}>
            <label>
              Hide
              <input type="checkbox" checked={Boolean(hidden)} onChange={this.handleHidden} />
            </label>
            <label>
              Type
              <select value={type} onChange={this.handleType}>
                <option></option>
                <option>number</option>
                <option>date</option>
                <option>select</option>
              </select>
            </label>
            <label>
              List
              <datalist id={`${name}_list_list`}>
                { Object.keys(records).map(recordName =>
                  <Fragment key={recordName}>
                    { records[recordName].attributes
                      .map(attrName => `${recordName}.${attrName}`)
                      .map(value => <option key={value} value={value} />)
                    }
                  </Fragment>
                ) }
              </datalist>
              <input value={listFrom} list={`${name}_list_list`} onChange={this.handleListFrom} />
            </label>
            <label>
              Default
              <datalist id={`${name}_default_list`}>
                { type === 'date' ? <option value="now" /> : null }
                {/* { fields[attr].listFrom ? <option value="now" /> : null } */}
              </datalist>
              <input value={defaultValue} list={`${name}_default_list`} onChange={this.handleDefault} />
            </label>
          </div>
        : null
      }
      <label>
        {name}
        {list}
        { hidden
          ? null
          : <input
              type={type || 'text'}
              name={name}
              list={listFrom ? `${name}_list` : null}
              defaultValue={type === 'date' && defaultValue === 'now'
                ? (new Date).toJSON().slice(0, 10)
                : defaultValue
              }
              {...props}
            />
        }
      </label>
    </Fragment>;
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
    fields: PropTypes.shape({}),
    edit: PropTypes.bool,
    onUpdate: PropTypes.func
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
  handleAttrUpdate = (name, props) => {
    const { record, fields, onUpdate } = this.props;
    onUpdate({
      component: 'FormView',
      record,
      fields: {
        ...fields,
        [name]: props
      }
    });
  }
  handleChangeRecord = ({ target: { value } }) => {
    const { records, onUpdate } = this.props;
    const attributes = records[value].attributes;
    onUpdate({
      component: 'FormView',
      record: value,
      fields: attributes.reduce((attrs, attr) => ({ ...attrs, [attr]: {} }), {})
    });
  }

  render() {
    const { record, records, edit, fields: propFields } = this.props;
    const attributes = records[record] ? records[record].attributes : [];
    const fields = propFields || attributes.reduce((attrs, attr) => ({ ...attrs, [attr]: {} }), {});

    return <form onSubmit={this.handleSubmit}>
      { edit
        ? <div style={{ backgroundColor: '#CCC', border: '1px dashed black' }}>
            FormView
            <select value={record} onChange={this.handleChangeRecord}>
              { Object.keys(records).map(recordName => <option key={recordName}>{recordName}</option>) }
            </select>
          </div>
        : false
      }
      { objectMap(fields, (attr, props) =>
        props.hidden && !edit ? null : <FormFieldView key={attr} name={attr} {...props} edit={edit} onUpdate={this.handleAttrUpdate} />
      ) }
      <input type="submit" />
    </form>;
  }
}
