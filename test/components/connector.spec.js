import expect from 'expect';
let sinon = require('sinon');
import { createStore } from 'redux';
import Connector from '../../src/components/connector';
import _ from 'lodash';

describe('Connector', () => {
  let store;
  let connect;
  let targetObj;
  let defaultState;

  beforeEach(() => {
    defaultState = {
      foo: 'bar',
      baz: -1
    };
    store = createStore((state = defaultState, action) => {
      return {...state, baz: action.payload};
    });
    targetObj = {};
    connect = Connector(store);
  });

	it('Should throw when target is not a Function or a plain object', () => {
	  expect(connect(() => ({})).bind(connect, 15)).toThrow();
	  expect(connect(() => ({})).bind(connect, undefined)).toThrow();
	  expect(connect(() => ({})).bind(connect, 'test')).toThrow();

	  expect(connect(() => ({})).bind(connect, {})).toNotThrow();
    expect(connect(() => ({})).bind(connect, () => {})).toNotThrow();

	});

  it('Should throw when selector does not return a plain object', () => {
    expect(connect.bind(connect, state => state.foo)).toThrow();
  });

  it('Should extend target (Object) with selected state once directly after creation', () => {
     connect(
      () => ({
        vm: { test: 1 }
      }))(targetObj);

    expect(targetObj.vm).toEqual({ test: 1 });
  });

  it('Should update the target (Object) passed to connect when the store updates', () => {
    connect(state => state)(targetObj);
    store.dispatch({ type: 'ACTION', payload: 0 });
    expect(targetObj.baz).toBe(0);
    store.dispatch({ type: 'ACTION', payload: 7 });
    expect(targetObj.baz).toBe(7);
  });

  it('Should prevent unnecessary updates when state does not change (shallowly)', () => {
    connect(state => state)(targetObj);
    store.dispatch({ type: 'ACTION', payload: 5 });

    expect(targetObj.baz).toBe(5);

    targetObj.baz = 0;

    //this should not replace our mutation, since the state didn't change 
    store.dispatch({ type: 'ACTION', payload: 5 });

    expect(targetObj.baz).toBe(0);

  });

  it('Should extend target (object) with actionCreators', () => {
    connect(() => ({}), { ac1: () => { }, ac2: () => { } })(targetObj);
    expect(_.isFunction(targetObj.ac1)).toBe(true);
    expect(_.isFunction(targetObj.ac2)).toBe(true);
  });

   it('Should return an unsubscribing function', () => {
    const unsubscribe = connect(state => state)(targetObj);
    store.dispatch({ type: 'ACTION', payload: 5 });

    expect(targetObj.baz).toBe(5);

    unsubscribe();

    store.dispatch({ type: 'ACTION', payload: 7 });

    expect(targetObj.baz).toBe(5);

  });

  it('Should provide dispatch to mapDispatchToTarget when receiving a Function', () => {
    let receivedDispatch;
    connect(() => ({}), dispatch => { receivedDispatch = dispatch })(targetObj);
    expect(receivedDispatch).toBe(store.dispatch);
  });

});