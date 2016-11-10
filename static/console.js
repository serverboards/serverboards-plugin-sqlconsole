'use strict';

var React$2=Serverboards.React;
var SQLTextInput=React$2.createClass({displayName:'SQLTextInput',componentDidMount:function componentDidMount(){var _this=this;$(this.refs.textarea).on('keyup',function(a){a.ctrlKey&&13==a.keyCode&&_this.handleExecute($(_this.refs.textarea).val()),27==a.keyCode&&_this.clearTextArea()})},handleExecute:function handleExecute(){this.props.onExecute($(this.refs.textarea).val())},clearTextArea:function clearTextArea(){$(this.refs.textarea).val('')},render:function render(){return React$2.createElement('div',{className:'ui form'},React$2.createElement('textarea',{ref:'textarea',className:'ui input',placeholder:'Write your SQL query and press Crtl+Enter',id:'query_area'}),React$2.createElement('div',{className:'ui buttons',style:{marginTop:10}},React$2.createElement('button',{className:'ui button yellow',onClick:this.handleExecute,style:{paddingTop:10}},'Execute query (Crtl+Enter)'),React$2.createElement('button',{className:'ui button',onClick:this.clearTextArea,style:{paddingTop:10}},'Clear area (ESC)')))}});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

var React$3=Serverboards.React;function DataGrid(a){function b(d){return"object"==("undefined"==typeof d?"undefined":_typeof(d))?JSON.stringify(d):d}return React$3.createElement("div",{style:{height:"60vh",overflow:"scroll"}},React$3.createElement("table",{className:"ui celled unstackable table"},React$3.createElement("thead",null,a.headers.map(function(d){return React$3.createElement("th",null,d)})),React$3.createElement("tbody",null,a.data.map(function(d){return React$3.createElement("tr",null,d.map(function(e){return React$3.createElement("td",null,b(e))}))}))))}

var React$1=Serverboards.React;
var rpc=Serverboards.rpc;
var Flash=Serverboards.Flash;
var Console=React$1.createClass({displayName:'Console',getInitialState:function getInitialState(){return{data:[],columns:['','',''],databases:['template1'],tables:[],plugin_id:void 0}},componentDidMount:function componentDidMount(){var _this=this,a=void 0;rpc.call('plugin.start',['serverboards.remotesql/daemon']).then(function(b){return a=b,console.log('plugin id %o',a),_this.setState({plugin_id:a}),_this.openConnection('template1',a)}).then(function(){return console.log('plugin id %o',a),rpc.call(a+'.databases').then(function(b){_this.setState({databases:b})})}).catch(function(b){console.error(b),Flash.error(b+'')}),$(this.refs.el).find('.ui.dropdown').dropdown()},componentWillUnmount:function componentWillUnmount(){console.log('Stop database connection? %o',this.state.plugin_id),this.state.plugin_id&&(console.log('Stop database connection'),rpc.call('plugin.stop',[this.state.plugin_id]))},openConnection:function openConnection(a,b){var _this2=this;b||(b=this.state.plugin_id);var d=this.props.service.config;return console.log(this.props.service),rpc.call(b+'.open',{via:d.via.uuid,type:d.type,hostname:d.hostname,port:d.port,username:d.username,password_pw:d.password_pw,database:a}).then(function(){return rpc.call(b+'.tables')}).then(function(f){_this2.setState({tables:f})})},handleExecute:function handleExecute(a,b){var _this3=this;b||(b=this.state.plugin_id),rpc.call(b+'.execute',[a]).then(function(d){console.log('Got response: %o',d),_this3.setState({data:d.data,columns:d.columns})}).catch(function(d){console.error(d),Flash.error(d+'')}),$(this.refs.el).find('#query_area').val(a)},render:function render(){var _this4=this,a=this.props,b=this.state,d=a.service||{};return React$1.createElement('div',{ref:'el'},React$1.createElement('div',{className:'ui top secondary menu'},React$1.createElement('h3',{className:'ui header'},'SQL Console for ',React$1.createElement('i',null,d.name))),React$1.createElement('div',{className:'ui container'},React$1.createElement('div',{className:'ui form'},React$1.createElement('div',{className:'two fields'},React$1.createElement('div',{className:'field'},React$1.createElement('label',null,'Database'),React$1.createElement('select',{name:'database',defaultValue:'template1',className:'ui dropdown',onChange:function onChange(f){return _this4.openConnection(f.target.value)}},b.databases.map(function(f){return React$1.createElement('option',{value:f},f)}))),React$1.createElement('div',{className:'field'},React$1.createElement('label',null,'Table'),React$1.createElement('select',{name:'tables',className:'ui dropdown',onChange:function onChange(f){return _this4.handleExecute('SELECT * FROM '+f.target.value+' LIMIT 100;')}},b.tables.sort().map(function(f){return React$1.createElement('option',{value:f},f)}))))),React$1.createElement(DataGrid,{data:b.data,headers:b.columns}),React$1.createElement(SQLTextInput,{onExecute:this.handleExecute})))}});

var React=Serverboards.React;
function main(a,b){return Serverboards.ReactDOM.render(React.createElement(function(c){return React.createElement(Console,{service:b.service})},null),a),function(){Serverboards.ReactDOM.unmountComponentAtNode(a)}}Serverboards.add_screen("serverboards.remotesql/console",main);