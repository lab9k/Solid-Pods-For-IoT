import React from 'react';
import {InformationWrapper} from './information.style';


export class Description extends React.Component {
    // Once submitted, pass the application state to the global state
    onSubmit = (e) => {
        e.preventDefault();
        this.props.onSubmit();
    }

    // Visual component of our application, which should be shown (textbox + subit button)
    render(){
        return(
            <InformationWrapper>
                <p>{this.props.title}:</p>
                <form onSubmit = {this.onSubmit} style = {{display: 'flex'}}>
                    <input
                        type='text'
                        name='description'
                        style={{flex: '10', padding: ''}}
                        value={this.props.value}
                        onChange={this.props.onChange}
                    />
                    <input
                        type='submit'
                        value={this.props.label}
                        className='btn'
                        style={{flex: '1'}}
                    />
                </form>
            </InformationWrapper>
        )
    }
}