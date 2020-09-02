import React from 'react';
import { ShareinputWrapper } from './shareinput.style';


export class Shareinput extends React.Component {
    // Once submitted, pass the application state to the global state
    onSubmit = (e) => {
        e.preventDefault();
        this.props.onSubmit();
    }

    // Visual component of our application, which should be shown (textbox + subit button)
    render() {
        return (
            <ShareinputWrapper>
                <p>{this.props.title}:</p>
                <form onSubmit={this.onSubmit} style={{ display: 'flex' }}>
                    <input
                        type='submit'
                        value={(this.props.shared) ? 'Unshare with Digipolis' : 'Share with Digipolis'}
                        className='btn'
                        style={{ flex: '1', background: this.props.shared ? 'red' : 'green', color: 'white', border: '1px solid white', padding: '10px', cursor: 'pointer', borderRadius: '5px'}}
                    />
                </form>
            </ShareinputWrapper>
        )
    }
}