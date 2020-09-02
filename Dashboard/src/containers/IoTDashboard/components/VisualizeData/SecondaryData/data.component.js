import React from 'react';
import {SecondaryDataWrapper} from './data.style';

export class SecondaryData extends React.Component{
    render(){
        return(
            <SecondaryDataWrapper>
                <h4>Textual Data</h4>
                <ul>
                    {this.props.data.map((data, i) => {
                        return <li key={i}>{`${this.props.type}: ${data}`}</li>
                    })}
                </ul>
            </SecondaryDataWrapper>
        );
    }
}