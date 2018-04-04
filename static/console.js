'use strict';

var React$2=Serverboards.React;
var SQLTextInput=React$2.createClass({displayName:'SQLTextInput',componentDidMount:function componentDidMount(){var _this=this;$(this.refs.textarea).on('keyup',function(a){a.ctrlKey&&13==a.keyCode&&_this.handleExecute($(_this.refs.textarea).val()),27==a.keyCode&&_this.clearTextArea()})},handleExecute:function handleExecute(){this.props.onExecute($(this.refs.textarea).val())},clearTextArea:function clearTextArea(){$(this.refs.textarea).val('')},render:function render(){return React$2.createElement('div',{className:'ui form with padding',style:{flexGrow:0}},React$2.createElement('textarea',{ref:'textarea',className:'ui input '+(this.props.loading?'disabled':''),placeholder:'Write your SQL query and press Crtl+Enter',id:'query_area',disabled:this.props.loading}),React$2.createElement('div',{className:'ui buttons',style:{marginTop:10}},React$2.createElement('button',{className:'ui button yellow '+(this.props.loading?'disabled':''),onClick:this.handleExecute,style:{paddingTop:10}},'Execute query (Crtl+Enter)'),React$2.createElement('button',{className:'ui button',onClick:this.clearTextArea,style:{paddingTop:10}},'Clear area (ESC)')))}});

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

var React$3=Serverboards.React;function DataGrid(a){function b(d){return"object"==("undefined"==typeof d?"undefined":_typeof(d))?React$3.createElement("pre",null,JSON.stringify(d,null,2)):!0===d?"True":!1==d?"False":d}return void 0==a.data?React$3.createElement("div",{style:{flexGrow:1,overflow:"scroll"}},React$3.createElement("table",{className:"ui red celled unstackable table"})):React$3.createElement("div",{style:{flexGrow:1,overflow:"scroll"}},React$3.createElement("div",{className:"ui padding"},React$3.createElement("table",{className:"ui "+(a.loading?"grey":"green")+" celled unstackable table"},React$3.createElement("thead",null,React$3.createElement("tr",null,a.headers.map(function(d,e){return React$3.createElement("th",{key:e},d)}))),React$3.createElement("tbody",null,a.data.map(function(d,e){return React$3.createElement("tr",{key:e},d.map(function(f,g){return React$3.createElement("td",{key:g},b(f))}))})))))}

var _Serverboards=Serverboards;
var React$1=_Serverboards.React;
var rpc=_Serverboards.rpc;
var Flash=_Serverboards.Flash;
var plugin=_Serverboards.plugin;
var Console=React$1.createClass({displayName:'Console',getInitialState:function getInitialState(){return console.log(this.props),{data:[],columns:['','',''],databases:[],tables:[],plugin:void 0,loading_database:!0,loading_tables:!1,loading_data:!1,service:this.props.data.service.uuid}},componentDidMount:function componentDidMount(){var _this=this;Promise.all([plugin.start('serverboards.remotesql/daemon'),rpc.call('service.get',[this.props.data.service.uuid])]).then(function(a){var b=a[0],d=a[1];return console.log('plugin_service',a,b,d),_this.setState({plugin:b,service:d}),_this.openConnection(null,b,d).then(function(){return b})}).then(function(a){return a.call('databases').then(function(b){_this.setState({databases:b,loading_database:!1}),$(_this.refs.database).dropdown('set text','Select a database')})}).catch(function(a){console.error(a),Flash.error(a+'')}),$(this.refs.el).find('.ui.dropdown').dropdown(),$(this.refs.database).dropdown('set text','Loading database list...'),$(this.refs.table).dropdown('set text','')},componentWillUnmount:function componentWillUnmount(){var _this2=this;console.log('Stop database connection? %o',this.state.plugin),this.state.plugin&&(console.log('Stop database connection'),this.state.plugin.call('close',[]).then(function(){return _this2.state.plugin.stop()}))},openConnection:function openConnection(a,b,d){var _this3=this;return b||(b=this.state.plugin),d||(d=this.state.service),d.config,console.log('service',d,b),$(this.refs.table).dropdown('set text','Loading tables...'),this.setState({loading_tables:!0}),b.call('open',{service_id:d.uuid,database:a}).then(function(){return b.call('tables')}).then(function(f){$(_this3.refs.table).dropdown('set value',''),$(_this3.refs.table).dropdown('set text','Select a table'),_this3.setState({tables:f,loading_tables:!1})})},handleExecute:function handleExecute(a,b){var _this4=this;console.log('Execute SQL: %o',a),this.setState({loading_data:!0}),b||(b=this.state.plugin),b.call('execute',[a]).then(function(d){console.log('Got response: %o',d),_this4.setState({data:d.data,columns:d.columns,loading_data:!1})}).catch(function(d){console.error(d),Flash.error(d+''),_this4.setState({loading_data:!1,data:void 0,columns:[]})}),$(this.refs.el).find('#query_area').val(a)},handleTableSelect:function handleTableSelect(a){var b=a.target.value;!b||''==b||this.handleExecute('SELECT * FROM '+b+' LIMIT 100;')},render:function render(){var _this5=this;this.props;var a=this.state,b=a.service||{},d=a.loading_data||a.loading_database||a.loading_tables;return React$1.createElement('div',{ref:'el',style:{flexDirection:'column',flexGrow:1,display:'flex',maxHeight:'100%'}},React$1.createElement('div',{className:'ui top secondary menu'},React$1.createElement('h3',{className:'ui header'},'SQL Console for ',React$1.createElement('i',null,b.name)),React$1.createElement('div',{className:'right menu'},React$1.createElement('div',{className:'ui form'},React$1.createElement('div',{className:'two fields'},React$1.createElement('div',{className:'field'},React$1.createElement('label',null,'Database',a.loading_database?React$1.createElement('i',{className:'ui loading notched circle icon'}):null),React$1.createElement('select',{name:'database',ref:'database',className:'ui search dropdown',onChange:function onChange(f){return _this5.openConnection(f.target.value)}},a.databases.map(function(f){return React$1.createElement('option',{key:f,value:f},f)}))),React$1.createElement('div',{className:'field'},React$1.createElement('label',null,'Table',a.loading_tables?React$1.createElement('i',{className:'ui loading notched circle icon'}):null),React$1.createElement('select',{name:'tables',ref:'table',className:'ui search dropdown',onChange:this.handleTableSelect},React$1.createElement('option',{value:''}),a.tables.sort().map(function(f){return React$1.createElement('option',{key:f,value:f},f)}))))))),React$1.createElement('div',{className:'ui container expand',style:{display:'flex',flexDirection:'column',maxHeight:'calc( 100% - 65px )'}},React$1.createElement(DataGrid,{data:a.data,headers:a.columns,loading:d}),React$1.createElement(SQLTextInput,{onExecute:this.handleExecute,loading:d})))}});

Serverboards.add_screen("serverboards.remotesql/console",Console,{react:!0});