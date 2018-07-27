/* globals gapi */
import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import { ActionsContext, RecordsContext, SpreadsheetContext } from './contexts';

function objectMap(object, fn) {
  return Object.keys(object).map((key, index) => fn(key, object[key], index));
}
function objectFilter(object, fn) {
  return Object.keys(object)
    .filter((key, index) => fn(key, object[key], index))
    .reduce((newObject, key) => ({ ...newObject, [key]: object[key] }), {});
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

const editorStyles = {
  backgroundColor: '#CCC',
  border: '1px dashed black'
};

export class Null extends PureComponent {
  static propTypes = {
    edit: PropTypes.bool,
    onUpdate: PropTypes.func
  }

  handleChange = component => this.props.onUpdate({ component })

  render() {
    const { edit } = this.props;
    if (!edit) return null;

    return <div style={{ ...editorStyles, padding: '1em' }}>
      Add view
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        { Object.keys(module.exports)
          .filter(componentName => componentName !== 'Null')
          .map(componentName =>
            <div key={componentName} style={{ border: '1px solid rgba(0,0,0, 0.2)', display: 'inline-block', minWidth: '10%', maxWidth: '30%', padding: '1em', cursor: 'pointer' }} onClick={() => this.handleChange(componentName)}>{componentName}</div>
          )
        }
      </div>
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
class TableColumnEdit extends PureComponent {
  static propTypes = {
    name: PropTypes.string.isRequired,
    hidden: PropTypes.bool,
    align: PropTypes.string,
    title: PropTypes.string,
    onUpdate: PropTypes.func
  }

  handleHidden = ({ target: { checked: hidden } }) => {
    const { onUpdate, ...props } = this.props;
    onUpdate({ ...props, hidden });
  }
  handleAlign = ({ target: { value: align } }) => {
    const { onUpdate, ...props } = this.props;
    onUpdate({ ...props, align });
  }
  handleTitle = ({ target: { value: title } }) => {
    const { onUpdate, ...props } = this.props;
    onUpdate({ ...props, title });
  }

  render() {
    const { name, hidden, align, title } = this.props;

    return <div style={{ backgroundColor: '#CCC', border: '1px dashed black' }}>
      {name}
      <label>
        Hide
        <input type="checkbox" checked={Boolean(hidden)} onChange={this.handleHidden} />
      </label>
      <label>
        Align
        <select value={align || ""} onChange={this.handleAlign}>
          <option value="">left</option>
          <option value="center">center</option>
          <option value="right">right</option>
        </select>
      </label>
      <label>
        Title
        <input value={title || ""} onChange={this.handleTitle} />
      </label>
    </div>;
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
  componentDidMount() {
    const {
      records, allRecords,
      onUpdate, edit: _edit,
      ...props
    } = this.props;

    if (!records) onUpdate({
      ...props,
      component: 'TableView',
      records: Object.keys(allRecords)[0]
    });
  }

  handleChangeRecords = ({ target: { value: records } }) => {
    const {
      onUpdate, allRecords,
      records: _records, columns: _columns, edit: _edit,
      ...props
    } = this.props;
    const { attributes=[] } = allRecords[records] ? allRecords[records] : {};

    onUpdate({
      ...props,
      component: 'TableView',
      records,
      columns: attributes.reduce((attrs, attr) =>
        ({ ...attrs, [attr]: {} }),
        {}
      )
    });
  }
  handleColumnUpdate = ({ name, ...columnProps }) => {
    const {
      onUpdate, columns,
      allRecords: _allRecords, edit: _edit,
      ...props
    } = this.props;
    onUpdate({
      ...props,
      component: 'TableView',
      columns: {
        ...columns,
        [name]: columnProps
      }
    });
  }

  render() {
    const { records, allRecords, columns = {}, edit } = this.props;
    const { attributes=[], list=[] } = allRecords[records] ? allRecords[records] : {};

    const table = <table>
      <thead>
        <tr>
          { objectMap(
            objectFilter(columns, (col, { hidden }) => !hidden),
            (col, { align, title }) => <th key={col} style={{ textAlign: align }}>{ title || col }</th>
          ) }
        </tr>
      </thead>
      <tbody>
        { list.map((item, y) => <tr key={y}>
          { objectMap(
            objectFilter(columns, (col, { hidden }) => !hidden),
            (col, { align, attr }) => <td key={col} style={{ textAlign: align }}>{ item[attr || col] }</td>
          ) }
        </tr>) }
      </tbody>
    </table>;

    return edit
      ? <div style={{ ...editorStyles, padding: '1em' }}>
          TableView
          {' '}
          <select value={records} onChange={this.handleChangeRecords}>
            { Object.keys(allRecords).map(name => <option key={name} value={name}>{name}</option>) }
          </select>
          <form>
            { attributes.map(attr => <TableColumnEdit key={attr} name={attr} {...columns[attr]} onUpdate={this.handleColumnUpdate} />) }
          </form>
          <div style={{ backgroundColor: '#DDD' }}>
            { table }
          </div>
        </div>
      : table;
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

  handleAdd = () => {
    const { edit: _edit, onUpdate, children, ...props } = this.props;
    onUpdate({ ...props, children: [ ...children, { component: 'Null' }], component: 'GridView' });
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

    return <div style={{ display: 'grid', ...(edit ? { ...editorStyles, padding: '1em', gridTemplateColumns: 'auto 1fr' } : {})}}>
      { edit
        ? <div style={{ gridColumn: '1 / span 2', borderBottom: '1px dashed black', paddingBottom: '1em' }}>
            GridView
          </div>
        : null
      }
      { children.map(({ component: componentName, ...props }, index) => {
        const ViewComponent = module.exports[componentName];
        const view = <ViewComponent key={index} {...props} {...{ edit, onUpdate: (child) => this.handleUpdate(index, child) }} />;
        return edit
          ? <Fragment key={index}>
              <div style={{ minWidth: '3em', borderBottom: '1px dashed black', padding: '1em 1em 1em 0' }}>
                <button onClick={() => this.handleUpdate(index, null)}>Remove</button>
              </div>
              <div style={{ backgroundColor: '#DDD', borderBottom: '1px dashed black' }}>{view}</div>
            </Fragment>
          : view;
      }) }
      { edit
        ? <button style={{ marginTop: '1em' }} onClick={this.handleAdd}>Add View</button>
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
    defaultValue: PropTypes.string
  }

  render() {
    const {
      records, name, type, listFrom, hidden, defaultValue: defaultValueProp,
      ...props
    } = this.props;
    const defaultValue = defaultValueProp === 'now' && type === 'date'
      ? (new Date).toJSON().slice(0, 10)
      : defaultValueProp === 'now' && type === 'datetime'
      ? (new Date).toLocaleString().replace(',', '')
      : defaultValueProp;

    let list;
    if (listFrom) {
      const [ collection, listAttr ] = listFrom.split('.');
      list = <datalist id={`${name}_list`}>
        { (records[collection] ? records[collection].list : []).map(item => item[listAttr]).filter(firstInstance).map(item => <option key={item} value={item} />) }
      </datalist>;
    }
    const input = <input
      type={ hidden ? 'hidden' : (type || 'text') }
      name={name}
      list={listFrom ? `${name}_list` : null}
      defaultValue={defaultValue}
      {...props}
    />;

    return hidden
      ? input
      : <label>{ name }{ list }{ input }</label>;
  }
}
@consumesContext(RecordsContext, 'records')
class FormFieldEdit extends PureComponent {
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
      records, name, type, listFrom, hidden, defaultValue,
    } = this.props;

    return <div style={{ backgroundColor: '#CCC', border: '1px dashed black' }}>
      {name}
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
          <option>datetime</option>
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
          { type === 'date' || type === 'datetime' ? <option value="now" /> : null }
        </datalist>
        <input value={defaultValue} list={`${name}_default_list`} onChange={this.handleDefault} />
      </label>
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
    fields: PropTypes.shape({}),
    edit: PropTypes.bool,
    onUpdate: PropTypes.func
  }
  componentDidMount() {
    const {
      record, records,
      spreadsheet: _spreadsheet, actions: _actions,
      onUpdate, edit: _edit,
      ...props
    } = this.props;

    if (!record) onUpdate({
      ...props,
      component: 'FormView',
      record: Object.keys(records)[0]
    });
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
    const formFields = <Fragment>
      { objectMap(fields, (attr, props) =>
        <FormFieldView key={attr} name={attr} {...props} />
      ) }
      <input type="submit" />
    </Fragment>;

    return <form onSubmit={this.handleSubmit} style={edit ? { ...editorStyles, padding: '1em' } : {}}>
      { edit
        ? <Fragment>
            <div>
              FormView
              <select value={record} onChange={this.handleChangeRecord}>
                { Object.keys(records).map(recordName => <option key={recordName}>{recordName}</option>) }
              </select>
            </div>
            { objectMap(fields, (attr, props) =>
              <FormFieldEdit key={attr} name={attr} {...props} edit={edit} onUpdate={this.handleAttrUpdate} />
            ) }
            <div style={{ backgroundColor: '#DDD' }}>{ formFields }</div>
          </Fragment>
        : formFields
      }
    </form>;
  }
}
