let React = Serverboards.React

const SQLTextInput=React.createClass({
  componentDidMount(){
    $(this.refs.textarea).on('keyup', (e) => {
      if (e.ctrlKey && e.keyCode == 13) {
        this.handleExecute( $(this.refs.textarea).val() )
      }
      if (e.keyCode == 27) {
        this.clearTextArea()
      }
    })
  },
  handleExecute(){
    this.props.onExecute( $(this.refs.textarea).val() )
  },
  clearTextArea(){
    $(this.refs.textarea).val('')
  },
  render(){
    return (
      <div className="ui form with padding" style={{flexGrow:0}}>
        <textarea
          ref="textarea"
          className={`ui input ${ this.props.loading ? "disabled" : ""}`}
          placeholder="Write your SQL query and press Crtl+Enter"
          id="query_area"
          disabled={this.props.loading}
          />
        <div className="ui buttons" style={{marginTop: 10}}>
          <button className={`ui button yellow ${ this.props.loading ? "disabled" : ""}`} onClick={this.handleExecute} style={{paddingTop:10}}>Execute query (Crtl+Enter)</button>
          <button className="ui button" onClick={this.clearTextArea} style={{paddingTop:10}}>Clear area (ESC)</button>
        </div>
      </div>
    )
  }
})
export default SQLTextInput
