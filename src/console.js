const {React, rpc, Flash, plugin} = Serverboards
const {map_get} = Serverboards.utils

import SQLTextInput from './sqltextinput'
import DataGrid from './datagrid'

const Console=React.createClass({
  getInitialState(){
    console.log(this.props)
    return {
      data:[
      ],
      columns:["","",""],
      databases: [],
      tables: [],
      plugin: undefined,
      loading_database: true,
      loading_tables: false,
      loading_data: false,
      service: this.props.data.service.uuid,
    }
  },
  componentDidMount(){
    Promise.all([
      plugin.start("serverboards.remotesql/daemon"),
      rpc.call("service.get", [this.props.data.service.uuid])
    ]).then( (plugin_service) => {
      let plugin = plugin_service[0]
      let service = plugin_service[1]
      console.log("plugin_service", plugin_service, plugin, service)
      this.setState({plugin, service})
      return this.openConnection(null, plugin, service).then( () => plugin )
    }).then( (plugin) => {
      return plugin.call("databases").then( (databases) => {
        this.setState({databases, loading_database: false})
        $(this.refs.database).dropdown("set text", "Select a database")
      })
    }).catch( (e) => {
      console.error(e)
      Flash.error(String(e))
    })

    $(this.refs.el).find('.ui.dropdown').dropdown()
    $(this.refs.database).dropdown("set text", "Loading database list...")
    $(this.refs.table).dropdown("set text", "")
  },
  componentWillUnmount(){
    console.log("Stop database connection? %o", this.state.plugin)
    if (this.state.plugin){
      console.log("Stop database connection")
      this.state.plugin.call("close", []).then( () =>
        this.state.plugin.stop()
      )
    }
  },
  openConnection(database, plugin, service){
    if (!plugin)
      plugin=this.state.plugin
    if (!service)
      service=this.state.service
    const c=service.config
    console.log("service", service, plugin)
    $(this.refs.table).dropdown("set text", "Loading tables...")
    this.setState({loading_tables:true})
    return plugin.call("open", {
      service_id: service["uuid"],
      database: database
    }).then( () => plugin.call("tables")).then( (tables) => {
      $(this.refs.table).dropdown("set value", "")
      $(this.refs.table).dropdown("set text", "Select a table")
      this.setState({tables, loading_tables: false})
    })
  },
  handleExecute(sql, plugin){
    console.log("Execute SQL: %o", sql)
    this.setState({loading_data: true})
    if (!plugin)
      plugin=this.state.plugin
    plugin.call("execute", [sql]).then( (res) => {
      console.log("Got response: %o", res)
      this.setState({data:res.data, columns:res.columns, loading_data: false})
    }).catch((e) => {
      console.error(e)
      Flash.error(String(e))
      this.setState({loading_data: false, data: undefined, columns:[]})
    })
    $(this.refs.el).find('#query_area').val(sql)
  },
  handleTableSelect(ev){
    const table=ev.target.value
    if (!table || table=="")
      return;
    this.handleExecute(`SELECT * FROM ${table} LIMIT 100;`)
  },
  render(){
    const props=this.props
    const state=this.state
    const service=state.service || {}
    const loading_data = state.loading_data || state.loading_database || state.loading_tables
    return (
      <div ref="el" style={{flexDirection: "column", flexGrow: 1, display: "flex", maxHeight: "100%"}}>
        <div className="ui top secondary menu">
          <h3 className="ui header">SQL Console for <i>{service.name}</i></h3>
          <div className="right menu">
            <div className="ui form">
              <div className="two fields">
                <div className="field">
                  <label>
                    Database
                      {state.loading_database ? (
                        <i className="ui loading notched circle icon"/>
                      ) : null}
                  </label>
                  <select name="database" ref="database" className="ui search dropdown" onChange={(ev) => this.openConnection(ev.target.value)}>
                    {state.databases.map( (db) => (
                      <option key={db} value={db}>{db}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>
                    Table
                    {state.loading_tables ? (
                      <i className="ui loading notched circle icon"/>
                    ) : null}
                  </label>
                  <select name="tables" ref="table" className="ui search dropdown" onChange={this.handleTableSelect}>
                    <option value=""></option>
                    {state.tables.sort().map( (db) => (
                      <option key={db} value={db}>{db}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="ui container expand" style={{display: "flex", flexDirection: "column", maxHeight: "calc( 100% - 65px )"}}>
          <DataGrid data={state.data} headers={state.columns} loading={loading_data}/>
          <SQLTextInput onExecute={this.handleExecute} loading={loading_data}/>
        </div>
      </div>
    )
  }
})

export default Console
