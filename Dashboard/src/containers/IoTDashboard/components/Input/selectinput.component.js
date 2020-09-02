import React from 'react';
import {Selectinputwrapper} from './selectinput.style';


export class Selectinput extends React.Component {
    // Update the application state if the selection contents changes + pass it on to the master program
    onChange = (e) => {
        let option = e.target.value;
        if(option !== 'None'){
            option = this.props.options.filter(item => {
                return (item.value || item) === option;
            })[0];
        }
        this.props.onSubmit(option);
    }

    // Visual component of our application, which should be shown (textbox + subit button)
    render(){
        if(this.props.options.length !== 0){
            return(
                <Selectinputwrapper>
                    <p>{this.props.label}:</p>
                    <form style = {{display: 'flex'}}>
                        <select onChange={this.onChange} value={this.props.option}>
                            <option value='None' key='NoneSelected'>Select an option...</option>>
                            {this.props.options.map((option) =>{
                                return <option value={option.value || option} key={option.value || option}>{option.value || option}</option>
                            })}
                        </select>
                    </form>
                </Selectinputwrapper>
            )
        } else {
            return(<p></p>);
        }
    }
}