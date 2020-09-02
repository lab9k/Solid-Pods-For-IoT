import React from 'react';
import {CopyDataWrapper} from './copy.style';
import { successToaster } from '@utils';


export class CopyData extends React.Component{
    // Copy data functionality + success messages once copied
    onCopy = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(this.props.data.map(elem => JSON.stringify(elem)));
        successToaster('Copied succesfully')
    }

    // Yay buttons!
    render(){
        return(
            <CopyDataWrapper>
                <form onSubmit = {this.onCopy} >
                    <input
                        type='submit'
                        value='Copy data to clipboard'
                        className='btn'
                        style={{flex: '1'}}
                    />
                </form>
            </CopyDataWrapper>
        );
    }
}