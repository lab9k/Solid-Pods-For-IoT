import React from 'react';
import {InformationWrapper} from './information.style';


export class Location extends React.Component {
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
                        type='button'
                        value='here'
                        onClick={this.props.whereAmI}
                        className='btn'
                        style={{flex: '1'}}
                    />
                    Lat: 
                    <input
                        type='text'
                        name='latitude'
                        style={{flex: '10', padding: ''}}
                        value={this.props.latitude}
                        onChange={this.props.onChange}
                    />
                    Lon:
                     <input
                        type='text'
                        name='longitude'
                        style={{flex: '10', padding: ''}}
                        value={this.props.longitude}
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