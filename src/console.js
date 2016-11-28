const React = Serverboards.React
const rpc = Serverboards.rpc
const Flash = Serverboards.Flash

import SQLTextInput from './sqltextinput'
import DataGrid from './datagrid'

const Console=React.createClass({
  getInitialState(){
    return {
      data:[
      ],
      columns:["","",""],
      databases: [],
      tables: [],
      plugin_id: undefined,
      loading_database: true,
      loading_tables: false,
      loading_data: false,
    }
  },
  componentDidMount(){
    let plugin_id
    rpc.call("plugin.start",["serverboards.remotesql/daemon"]).then( (pid) => {
      plugin_id=pid
      console.log("plugin id %o", plugin_id)
      this.setState({plugin_id})
      return this.openConnection("template1", plugin_id)
    }).then( () => {
      console.log("plugin id %o", plugin_id)
      return rpc.call(`${plugin_id}.databases`).then( (databases) => {
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
    console.log("Stop database connection? %o", this.state.plugin_id)
    if (this.state.plugin_id){
      console.log("Stop database connection")
      rpc.call("plugin.stop",[this.state.plugin_id])
    }
  },
  openConnection(database, plugin_id){
    if (!plugin_id)
      plugin_id=this.state.plugin_id
    const c=this.props.service.config
    console.log(this.props.service)
    $(this.refs.table).dropdown("set text", "Loading tables...")
    this.setState({loading_tables:true})
    return rpc.call(`${plugin_id}.open`, {
      via: c.via.uuid,
      type: c.type,
      hostname: c.hostname,
      port: c.port,
      username: c.username,
      password_pw: c.password_pw,
      database: database
    }).then( () => rpc.call(`${plugin_id}.tables`)).then( (tables) => {
      $(this.refs.table).dropdown("set text", "Select a table")
      this.setState({tables, loading_tables: false})
    })
  },
  handleExecute(sql, plugin_id){
    console.log("Execute SQL: %o", sql)
    this.setState({loading_data: true})
    if (!plugin_id)
      plugin_id=this.state.plugin_id
    rpc.call(`${plugin_id}.execute`, [sql]).then( (res) => {
      console.log("Got response: %o", res)
      this.setState({data:res.data, columns:res.columns, loading_data: false})
    }).catch((e) => {
      console.error(e)
      Flash.error(String(e))
      this.setState({loading_data: false, data: undefined, columns:[]})
    })
    $(this.refs.el).find('#query_area').val(sql)
  },
  render(){
    const props=this.props
    const state=this.state
    const service=props.service || {}
    const loading_data = state.loading_data || state.loading_database || state.loading_tables
    return (
      <div ref="el" style={{flexDirection: "column", flexGrow: 1, display: "flex"}}>
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
                  <select name="tables" ref="table" className="ui search dropdown" onChange={(ev) => this.handleExecute(`SELECT * FROM ${ev.target.value} LIMIT 100;`)}>
                    {state.tables.sort().map( (db) => (
                      <option value={db}>{db}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="ui container" style={{flexDirection: "column", flexGrow: 1, display: "flex", paddingBottom: 20}}>
          <DataGrid data={state.data} headers={state.columns} loading={loading_data}/>
          <SQLTextInput onExecute={this.handleExecute} loading={loading_data}/>
        </div>
      </div>
    )
  }
})

export default Console
