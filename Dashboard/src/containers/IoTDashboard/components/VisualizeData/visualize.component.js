import React from 'react';
import Graph from './Graph';
import SecondaryData from './SecondaryData';
import CopyData from './CopyData';



export class Visualize extends React.Component {
    // Creating reference to insert in the page
    render(){
        if(this.props.data.length !== 0){
            // There is actual data to be visualized
            if(this.props.data[0].timestamp !== undefined){
                // The data has timestamps and can thus be graphed
                return(
                    <div>
                        <Graph data = {this.props.data} object={this.props.object} type = {this.props.type}></Graph> 
                        <CopyData data = {this.props.data}></CopyData>
                    </div>
                )
            } else {
                // The data has no timestamps and will thus be printed
                return (
                    <div>
                        <SecondaryData data = {this.props.data} type = {this.props.type}></SecondaryData>
                        <CopyData data = {this.props.data}></CopyData>
                    </div>
                )
            }
        } else {
            return <p></p>
        }
    }
}