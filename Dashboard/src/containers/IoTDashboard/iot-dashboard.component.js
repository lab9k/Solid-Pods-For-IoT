import React from 'react';
import { errorToaster, successToaster } from '@utils';
import { AccessControlList } from '@inrupt/solid-react-components';
import { retrieveStore, getFiles, getSensor, getMeasurements, getData } from './utils';
import { Visualize, Textinput, Selectinput, Shareinput } from './components';
import {
    IoTDashboardWrapper,
    IoTDashboardContainer,
    Header
} from './iot-dashboards.style';

const ACCESSLISTWEBID = 'https://flordigipolis.solidweb.org/profile/card#me';
const IOTFOLDER = 'private/iot';

export class IoTDashboard extends React.Component {
    // Program state
    state = {
        files: [],
        file: 'None',
        store: undefined,
        fetcher: undefined,
        webId: undefined,
        shared: undefined,
        data: []
    }

    componentDidMount() {
        getFiles(IOTFOLDER)
            .then((files) => this.setState({files}))
            .catch((err) => errorToaster(err));
    }

    onReceiveFile = (file) => {
        this.setState({ file, data: [], shared: undefined }, () => {
            if(this.state.file !== 'None'){
                retrieveStore(this.state.file)
                    .then(({ store, fetcher, webId }) => {
                        // Save the store and fetcher into the program state
                        this.setState({ store, fetcher, webId }, () => {
                            this.updateShareStatus();
                            this.onReceiveStore();
                        });
                    })
                    .catch(err => errorToaster(err));
            }
        })
    }

    onReceiveStore = () => {
        // Getting sensor data
        var {sensor, type} = getSensor(this.state.store);
        if (type === 'sosa' || type === 'saref') {
            var measurements = getMeasurements(sensor, type, this.state.store);
            var data = getData(measurements, type, this.state.store);
            this.setState({data});
        } else {
            errorToaster('No SSN/SOSA or SAREF device found in this file.');
        }
    }

    updateShareStatus = () => {
        // Getting ACL status
        const ACLFile = new AccessControlList(this.state.webId, this.state.file);
        ACLFile.getPermissions().then(permissions => {
            console.log(permissions);
            var filtered_permissions = permissions.filter((permission) => {
                console.log(permissions);
                // Check if the WebId where the access list is stored is already listed under read permissions
                return permission.agents.includes(ACCESSLISTWEBID) && permission.modes.includes("Read");
            });
            this.setState({shared: !!filtered_permissions.length});
        }).catch(err => errorToaster(err));
    }

    // Give read permissions to a webId at a certain url
    giveReadPermissions = async (url) => {
        try {
            // Fix the access control list
            const ACLFile = new AccessControlList(this.state.webId, this.state.file);
            // Don't forget to repeat the existing permissions to make sure you don't lock yourself out.
            var existingpermissions = await ACLFile.getPermissions();
            const permissions = [
                ...existingpermissions,
                {   
                    agents: [url],
                    modes: [AccessControlList.MODES.READ]
                }
            ];
            ACLFile.assignPermissions(permissions).then(() => {
                this.updateShareStatus();
                if (url === ACCESSLISTWEBID) {
                    // Also send a put request to our API to let it know access was granted
                }
                successToaster(`Read access granted to ${url}.`);
            });
            
        } catch (err) {
            errorToaster(`Error granting access to ${url}: ${err}`);
        }
    }

    takeReadPermissions = async(url) => {
        try {
            const permissions = [
                {
                    agents: [url],
                    modes: [AccessControlList.MODES.READ]
                }
            ];
            const ACLFile = new AccessControlList(this.state.webId, this.state.file);
            ACLFile.removePermissions(permissions).then(() => {
                this.updateShareStatus();
                if (url === ACCESSLISTWEBID) {
                    // Also send a put request to our API to let it know access was granted
                }
                successToaster(`Read access removed from ${url}.`);
            });
        } catch (err) {
            errorToaster(err);
        }
    } 

    // onSubmit function for the Digipolis share button
    onShareDigipolis = async (url) => {
        if (this.state.shared) {
            console.log('We need to unshare the file');
            this.takeReadPermissions(ACCESSLISTWEBID);
        } else {
            console.log('We need to share the file');
            this.giveReadPermissions(ACCESSLISTWEBID);
        }
    }

    render() {
        return (
            <IoTDashboardWrapper>
                <IoTDashboardContainer>
                    <Header>
                        <h3>IoT Dashboard</h3>
                        <p>This page allows you to manage and visualize the IoT data stored in your pod in either SAREF or SSN format.</p>
                        <p>By default it will look for files in the /private/iot folder.</p>
                        <p>Please pick the file you would like to manage from the dropdown menu.</p>
                    </Header>
                    <Selectinput onSubmit={this.onReceiveFile} options={this.state.files} label="Select a file" option={this.state.file}></Selectinput>
                    {(this.state.file !== 'None') ? <Textinput onSubmit={this.giveReadPermissions} default={ACCESSLISTWEBID} title='Share this file' label='share'></Textinput> : <></>}
                    {(this.state.file !== 'None' && this.state.shared !== undefined) ? <Shareinput onSubmit={this.onShareDigipolis} title='Share this file' shared={this.state.shared}></Shareinput> : <></>}
                    <Visualize data = {this.state.data} object = {this.state.file} type = {this.state.type}></Visualize>
                </IoTDashboardContainer>
            </IoTDashboardWrapper>
        )
    }
}

export default IoTDashboard;