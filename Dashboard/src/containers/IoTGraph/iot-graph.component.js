import React from 'react';
import { errorToaster } from '@utils';
import {retrieveStore, getDevices, getObjects, getResources, getData, getResourceTypes} from './utils';
import {Visualize, Textinput, Selectinput} from './components';
import{
    IoTGraphWrapper,
    IoTGraphContainer,
    Header
} from './iot-graph.style';

export class IoTGraph extends React.Component {
    // Program state
    state = {
        url:'',
        store: undefined,
        fetcher: undefined,
        devices: [],
        device: 'None',
        objects: [],
        object: 'None',
        types: [],
        type: 'None',
        data: []
    }      

    // Callback function after the database URL is commited
    onReceiveURL = (url) => {
        // Save URL to the program state
        this.setState({url, devices: [], objects: [], data: [], device: 'None', object: 'None', type: 'None', types: []}, () => {
            // Fetch the database into a store
            retrieveStore(url).then(({store, fetcher}) => {
                // Save the store and fetcher into the program state
                this.setState({store, fetcher}, () => {
                    // Obtaining the devices from the database
                    var devices = getDevices(store);
                    // Adding the devices to the program state
                    this.setState({devices});
                })
            }).catch(err => errorToaster(err));
        });
    }

    // Callback function for when the device is picked from the dropdown
    onReceiveDevice = (device) => {
        // Check if the selected item isn't the default "Select an option"
        this.setState({device}, () => {
            if(this.state.device !== 'None'){
                // Getting the objects contained by the device
                var objects = getObjects(this.state.store, device);
                this.setState({objects});
            } else {
                this.setState({data: [], objects: [], object: 'None', type: 'None', types: []});
            }
        });

    }

    // Callback function for when the object is picked from the dropdown
    onReceiveObject = (object) => {
        this.setState({object}, () => {
            if(this.state.object !== 'None'){
                // Obtaining the resources from the object
                var resources = getResources(this.state.store, this.state.object);
                var types = getResourceTypes(this.state.store, resources);
                this.setState({types});
            } else {
                this.setState({data: [], type: 'None', types: []}, () => this.onReceiveType('None'));
            }
        })
    }

    // Callback function for when the resource type is picked from the dropdown
    onReceiveType = (type) => {
        this.setState({type}, () => {
            if(this.state.type !== 'None'){
                console.log(this.state.type)
                var data = getData(this.state.store, this.state.object, type);
                this.setState({data});
            } else {
                this.setState({data: []});
            }
        });
    }

    render(){
        return(
            <IoTGraphWrapper>
                <IoTGraphContainer>
                    <Header>
                        <h3>Historical data visualization</h3>
                        <p>This page allows you to visualize the historical sensor data saved in your solid pod.</p>
                        <p>Start by entering the URL of the location where the database you wish to visualize is stored.</p>
                        <p>From there, you can pick from the available devices and its objects which resource needs to be visualized.</p>
                    </Header>
                    <Textinput onSubmit = {this.onReceiveURL} default = {`https://${this.props.webId.split('/')[2]}/private/leshandata.ttl`}></Textinput>
                    <Selectinput onSubmit = {this.onReceiveDevice} options={this.state.devices} label="Pick a device" option={this.state.device.value || this.state.device}></Selectinput>
                    <Selectinput onSubmit = {this.onReceiveObject} options={this.state.objects} label="Pick an object" option={this.state.object.value || this.state.object}></Selectinput>
                    <Selectinput onSubmit = {this.onReceiveType} options={this.state.types} label="Pick a resource type" option={this.state.type}></Selectinput>
                    <Visualize data = {this.state.data} object = {this.state.object} type = {this.state.type}></Visualize>
                </IoTGraphContainer>
            </IoTGraphWrapper>
        )
    }
}

export default IoTGraph;