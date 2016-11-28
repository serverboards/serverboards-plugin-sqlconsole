'use strict';

var React$2=Serverboards.React;
var SQLTextInput=React$2.createClass({displayName:'SQLTextInput',componentDidMount:function componentDidMount(){var _this=this;$(this.refs.textarea).on('keyup',function(a){a.ctrlKey&&13==a.keyCode&&_this.handleExecute($(_this.refs.textarea).val()),27==a.keyCode&&_this.clearTextArea()})},handleExecute:function handleExecute(){this.props.onExecute($(this.refs.textarea).val())},clearTextArea:function clearTextArea(){$(this.refs.textarea).val('')},render:function render(){return React$2.createElement('div',{className:'ui form',style:{flexGrow:0}},React$2.createElement('textarea',{ref:'textarea',className:'ui input '+(this.props.loading?'disabled':''),placeholder:'Write your SQL query and press Crtl+Enter',id:'query_area',disabled:this.props.loading}),React$2.createElement('div',{className:'ui buttons',style:{marginTop:10}},React$2.createElement('button',{className:'ui button yellow '+(this.props.loading?'disabled':''),onClick:this.handleExecute,style:{paddingTop:10}},'Execute query (Crtl+Enter)'),React$2.createElement('button',{className:'ui button',onClick:this.clearTextArea,style:{paddingTop:10}},'Clear area (ESC)')))}});

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

var React$3=Serverboards.React;function DataGrid(a){function b(d){return"object"==("undefined"==typeof d?"undefined":_typeof(d))?JSON.stringify(d):d}return void 0==a.data?React$3.createElement("div",{style:{flexGrow:1,overflow:"scroll"}},React$3.createElement("table",{className:"ui red celled unstackable table"})):React$3.createElement("div",{style:{flexGrow:1,overflow:"scroll"}},React$3.createElement("table",{className:"ui "+(a.loading?"grey":"green")+" celled unstackable table"},React$3.createElement("thead",null,React$3.createElement("tr",null,a.headers.map(function(d,e){return React$3.createElement("th",{key:e},d)}))),React$3.createElement("tbody",null,a.data.map(function(d,e){return React$3.createElement("tr",{key:e},d.map(function(f,g){return React$3.createElement("td",{key:g},b(f))}))}))))}

var React$1=Serverboards.React;
var rpc=Serverboards.rpc;
var Flash=Serverboards.Flash;
var Console=React$1.createClass({displayName:'Console',getInitialState:function getInitialState(){return{data:[],columns:['','',''],databases:[],tables:[],plugin_id:void 0,loading_database:!0,loading_tables:!1,loading_data:!1}},componentDidMount:function componentDidMount(){var _this=this,a=void 0;rpc.call('plugin.start',['serverboards.remotesql/daemon']).then(function(b){return a=b,console.log('plugin id %o',a),_this.setState({plugin_id:a}),_this.openConnection('template1',a)}).then(function(){return console.log('plugin id %o',a),rpc.call(a+'.databases').then(function(b){_this.setState({databases:b,loading_database:!1}),$(_this.refs.database).dropdown('set text','Select a database')})}).catch(function(b){console.error(b),Flash.error(b+'')}),$(this.refs.el).find('.ui.dropdown').dropdown(),$(this.refs.database).dropdown('set text','Loading database list...'),$(this.refs.table).dropdown('set text','')},componentWillUnmount:function componentWillUnmount(){console.log('Stop database connection? %o',this.state.plugin_id),this.state.plugin_id&&(console.log('Stop database connection'),rpc.call('plugin.stop',[this.state.plugin_id]))},openConnection:function openConnection(a,b){var _this2=this;b||(b=this.state.plugin_id);var d=this.props.service.config;return console.log(this.props.service),$(this.refs.table).dropdown('set text','Loading tables...'),this.setState({loading_tables:!0}),rpc.call(b+'.open',{via:d.via.uuid,type:d.type,hostname:d.hostname,port:d.port,username:d.username,password_pw:d.password_pw,database:a}).then(function(){return rpc.call(b+'.tables')}).then(function(f){$(_this2.refs.table).dropdown('set text','Select a table'),_this2.setState({tables:f,loading_tables:!1})})},handleExecute:function handleExecute(a,b){var _this3=this;console.log('Execute SQL: %o',a),this.setState({loading_data:!0}),b||(b=this.state.plugin_id),rpc.call(b+'.execute',[a]).then(function(d){console.log('Got response: %o',d),_this3.setState({data:d.data,columns:d.columns,loading_data:!1})}).catch(function(d){console.error(d),Flash.error(d+''),_this3.setState({loading_data:!1,data:void 0,columns:[]})}),$(this.refs.el).find('#query_area').val(a)},render:function render(){var _this4=this,a=this.props,b=this.state,d=a.service||{},f=b.loading_data||b.loading_database||b.loading_tables;return React$1.createElement('div',{ref:'el',style:{flexDirection:'column',flexGrow:1,display:'flex'}},React$1.createElement('div',{className:'ui top secondary menu'},React$1.createElement('h3',{className:'ui header'},'SQL Console for ',React$1.createElement('i',null,d.name)),React$1.createElement('div',{className:'right menu'},React$1.createElement('div',{className:'ui form'},React$1.createElement('div',{className:'two fields'},React$1.createElement('div',{className:'field'},React$1.createElement('label',null,'Database',b.loading_database?React$1.createElement('i',{className:'ui loading notched circle icon'}):null),React$1.createElement('select',{name:'database',ref:'database',className:'ui search dropdown',onChange:function onChange(g){return _this4.openConnection(g.target.value)}},b.databases.map(function(g){return React$1.createElement('option',{key:g,value:g},g)}))),React$1.createElement('div',{className:'field'},React$1.createElement('label',null,'Table',b.loading_tables?React$1.createElement('i',{className:'ui loading notched circle icon'}):null),React$1.createElement('select',{name:'tables',ref:'table',className:'ui search dropdown',onChange:function onChange(g){return _this4.handleExecute('SELECT * FROM '+g.target.value+' LIMIT 100;')}},b.tables.sort().map(function(g){return React$1.createElement('option',{value:g},g)}))))))),React$1.createElement('div',{className:'ui container',style:{flexDirection:'column',flexGrow:1,display:'flex',paddingBottom:20}},React$1.createElement(DataGrid,{data:b.data,headers:b.columns,loading:f}),React$1.createElement(SQLTextInput,{onExecute:this.handleExecute,loading:f})))}});

var React=Serverboards.React;
function main(a,b){return Serverboards.ReactDOM.render(React.createElement(function(c){return React.createElement(Console,{service:b.service})},null),a),function(){Serverboards.ReactDOM.unmountComponentAtNode(a)}}Serverboards.add_screen("serverboards.remotesql/console",main);