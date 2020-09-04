import React from 'react';
import axios from 'axios';
import SolidAclUtils from 'solid-acl-utils';
import auth from 'solid-auth-client';
import FC from 'solid-file-client';
import { errorToaster, successToaster } from '@utils';
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
const fetch = auth.fetch.bind(auth);
const { READ } = SolidAclUtils.Permissions;

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

    // Checks if read access to the ACCESSLISTWEBID has already been granted
    updateShareStatus = async () => {
        try {
            const aclAPI = new SolidAclUtils.AclApi(fetch, { autoSave: true });
            const acl = await aclAPI.loadFromFileUrl(this.state.file);
            const permissions = acl.getPermissionsFor(ACCESSLISTWEBID).permissions;
            const shared = permissions.has(READ);
            this.setState({ shared });
        } catch (err) {
            errorToaster(String(err));
        }
    }

    // Give read permissions to a webId at a certain url
    giveReadPermissions = async (url) => {
        try {
            const aclAPI = new SolidAclUtils.AclApi(fetch, { autoSave: true });
            const acl = await aclAPI.loadFromFileUrl(this.state.file);
            await acl.addRule(READ, url);
            successToaster(`Read access granted to ${url}.`);
            this.updateShareStatus();
            const urlcomponents = this.state.file.split('/');
            const filename = urlcomponents[urlcomponents.length - 1];
            await api.put(`/solidfiles/${filename}`, {
                address: this.state.file
            });
            successToaster('File added in Digipolis API.');
        } catch (err) {
            errorToaster(`Error granting access to ${url}: ${err}`);
        }
    }

    takeReadPermissions = async (url) => {
        try {
            const aclAPI = new SolidAclUtils.AclApi(fetch, { autoSave: true });
            const acl = await aclAPI.loadFromFileUrl(this.state.file);
            await acl.deleteRule(READ, url);
            successToaster(`Read access removed from ${url}.`);
            this.updateShareStatus();
            const urlcomponents = this.state.file.split('/');
            const filename = urlcomponents[urlcomponents.length - 1];
            await api({
                method: 'DELETE',
                url: `/solidfiles/${filename}`,
                data: {
                    address: this.state.file
                }
            });
            successToaster('File removed in Digipolis API');
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