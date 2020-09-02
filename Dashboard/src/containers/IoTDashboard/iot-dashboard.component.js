import React from 'react';
import axios from 'axios';
import aclClient from 'ownacl';
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
const APIURL = 'http://solid.pool42.io:8030/v1/';

const api = axios.create({
    baseURL: APIURL,
    timeout: 3000
});

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

    // Immediately after mounting, the list of the files in the /private/iot subfolder is read
    componentDidMount() {
        getFiles(IOTFOLDER)
            .then((files) => this.setState({ files }))
            .catch((err) => errorToaster(String(err)));
    }

    // Upon receival of the file name, we need to check share access and get the data out of it
    onReceiveFile = (file) => {
        this.setState({ file, data: [], shared: undefined }, () => {
            if (this.state.file !== 'None') {
                retrieveStore(this.state.file)
                    .then(({ store, fetcher, webId }) => {
                        // Save the store and fetcher into the program state
                        this.setState({ store, fetcher, webId }, () => {
                            this.updateShareStatus();
                            this.onReceiveStore();
                        });
                    })
                    .catch(err => errorToaster(String(err)));
            }
        })
    }

    // When the data is in the store, we need to get the data out of it
    onReceiveStore = () => {
        // Getting sensor data
        var { sensor, type } = getSensor(this.state.store);
        if (type === 'sosa' || type === 'saref') {
            var measurements = getMeasurements(sensor, type, this.state.store);
            var data = getData(measurements, type, this.state.store);
            this.setState({ data });
        } else {
            errorToaster('No SSN/SOSA or SAREF device found in this file.');
        }
    }

    // Checks if our file already has an acl file, if not creates one, in the end we know whether the access list webId already has access. Admittedly it's a mess
    updateShareStatus = () => {
        var aclurl = `${this.state.file}.acl`;
        // Check if an ACL file already exists
        const ACLFile = new AccessControlList(this.state.webId, this.state.file);
        ACLFile.getACLFile().then(result => {
            // Checking if our file already has its own acl file
            if (result.url === aclurl) {
                // ACL File is already present
                console.log('ACL File Found');
                // Check file permissions
                const acl = new aclClient(aclurl);
                acl.readAccessControl().then(permissions => {
                    var filtered_permissions = permissions.filter((permission) => {
                        return permission.name === ACCESSLISTWEBID;
                    });
                    this.setState({ shared: !!filtered_permissions.length });
                }).catch(err => errorToaster(err));
            } else {
                // ACL File is not yet present
                console.log('ACL File not yet found');
                // Get old permissions
                ACLFile.getPermissions().then((old_permissions) => {
                    // Create ACL file with old permissions
                    ACLFile.createACL(old_permissions).then(() => {
                        // Get new permissions
                        const acl = new aclClient(aclurl);
                        acl.readAccessControl().then(permissions => {
                            console.log(permissions)
                            var filtered_permissions = permissions.filter((permission) => {
                                return permission.name === ACCESSLISTWEBID;
                            });
                            this.setState({ shared: !!filtered_permissions.length });
                        }).catch(err => errorToaster(err));
                    }).catch(err => errorToaster(err));
                }).catch(err => errorToaster(err));
            }
        }).catch(err => errorToaster(err));
    }

    // Give read permissions to a webId at a certain url
    giveReadPermissions = async (url) => {
        try {
            // Fix the access control list
            const acl = new aclClient(`${this.state.file}.acl`);
            const toAdd = {
                name: url,
                access: ['Read']
            };
            acl.addAgent(toAdd).then(() => {
                this.updateShareStatus();
                successToaster(`Read access granted to ${url}.`);
                if (url === ACCESSLISTWEBID) {
                    const urlcomponents = this.state.file.split('/');
                    const filename = urlcomponents[urlcomponents.length - 1];
                    // Also send a put request to our API to let it know access was granted
                    api.put(`/solidfiles/${filename}`, {
                        title: filename,
                        address: this.state.file
                    }).then((res) => {
                        console.log(res);
                        successToaster('File added in Digipolis API.');
                    }).catch(err => errorToaster(String(err)));
                }
            });

        } catch (err) {
            errorToaster(`Error granting access to ${url}: ${err}`);
        }
    }

    takeReadPermissions = async (url) => {
        try {
            // Fix the access control list
            const acl = new aclClient(`${this.state.file}.acl`);
            const toRemove = {
                name: url,
                access: ['Read']
            };
            acl.deleteAgent(toRemove).then(() => {
                this.updateShareStatus();
                successToaster(`Read access removed from ${url}.`);
                if (url === ACCESSLISTWEBID) {
                    const urlcomponents = this.state.file.split('/');
                    const filename = urlcomponents[urlcomponents.length - 1];
                    // Also send a delete request to our API to let it know access was granted
                    api({
                        method: 'DELETE',
                        url: `/solidfiles/${filename}`,
                        data: {
                            title: filename,
                            address: this.state.file
                        }
                    }).then((res) => {
                        console.log(res);
                        successToaster('File removed in Digipolis API');
                    }).catch(err => errorToaster(String(err)));
                }
            });
        } catch (err) {
            errorToaster(String(err));
        }
    }

    // onSubmit function for the Digipolis share button
    onShareDigipolis = () => {
        if (this.state.shared) {
            // The file was shared, now we need to take away the permissions
            this.takeReadPermissions(ACCESSLISTWEBID);
        } else {
            // The file wasn't shared, now we need to add permissions
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
                    <Visualize data={this.state.data} object={this.state.file} type={this.state.type}></Visualize>
                </IoTDashboardContainer>
            </IoTDashboardWrapper>
        )
    }
}

export default IoTDashboard;