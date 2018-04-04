let React = Serverboards.React

function DataGrid(props){
  function to_string(c){
    if (typeof(c) == 'object')
      return (
        <pre>
          {JSON.stringify(c, null, 2)}
        </pre>
      )
    if (c===true)
      return "True"
    if (c==false)
      return "False"
    return c
  }

  if (props.data==undefined)
    return (
      <div style={{flexGrow:1, overflow: "scroll"}}>
        <table className={`ui red celled unstackable table`}>
        </table>
      </div>
    )
  return (
    <div style={{flexGrow:1, overflow: "scroll"}}>
      <div className="ui padding">
        <table className={`ui ${ props.loading ? "grey" : "green" } celled unstackable table`}>
          <thead>
            <tr>
              {props.headers.map( (h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.data.map( (row, i) => (
              <tr key={i}>
                {row.map( (cell, i) => (
                  <td key={i}>{to_string(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataGrid
