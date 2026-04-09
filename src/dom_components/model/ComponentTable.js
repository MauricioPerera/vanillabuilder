/**
 * Table-related components
 */
import Component from './Component.js';

export class ComponentTable extends Component {
  defaults() {
    return { ...super.defaults(), type: 'table', tagName: 'table', droppable: ['tbody', 'thead', 'tfoot'] };
  }
  static isComponent(el) {
    return el.tagName === 'TABLE' ? { type: 'table' } : false;
  }
}

export class ComponentTableHead extends Component {
  defaults() {
    return { ...super.defaults(), type: 'thead', tagName: 'thead', draggable: ['table'], droppable: ['tr'] };
  }
  static isComponent(el) {
    return el.tagName === 'THEAD' ? { type: 'thead' } : false;
  }
}

export class ComponentTableBody extends Component {
  defaults() {
    return { ...super.defaults(), type: 'tbody', tagName: 'tbody', draggable: ['table'], droppable: ['tr'] };
  }
  static isComponent(el) {
    return el.tagName === 'TBODY' ? { type: 'tbody' } : false;
  }
}

export class ComponentTableFoot extends Component {
  defaults() {
    return { ...super.defaults(), type: 'tfoot', tagName: 'tfoot', draggable: ['table'], droppable: ['tr'] };
  }
  static isComponent(el) {
    return el.tagName === 'TFOOT' ? { type: 'tfoot' } : false;
  }
}

export class ComponentRow extends Component {
  defaults() {
    return { ...super.defaults(), type: 'row', tagName: 'tr', draggable: ['thead', 'tbody', 'tfoot'], droppable: ['th', 'td'] };
  }
  static isComponent(el) {
    return el.tagName === 'TR' ? { type: 'row' } : false;
  }
}

export class ComponentCell extends Component {
  defaults() {
    return { ...super.defaults(), type: 'cell', tagName: 'td', draggable: ['tr'] };
  }
  static isComponent(el) {
    return (el.tagName === 'TD' || el.tagName === 'TH') ? { type: 'cell', tagName: el.tagName.toLowerCase() } : false;
  }
}
