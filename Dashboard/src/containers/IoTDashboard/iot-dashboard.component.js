import React from 'react';
import { errorToaster, successToaster } from '@utils';
import { AccessControlList } from '@inrupt/solid-react-components';
import { retrieveStore, getFiles, getSensor, getMeasurements, getData } from './utils';
import { Visualize, Textinput, Selectinput } from './components';
import {
    IoTDashboardWrapper,
    IoTDashboardContainer,
    Header
} from './iot-dashboards.style';

export class IoTDashboard extends React.Component {
    // Program state
    state = {
        files: [],
        file: 'None',
        store: undefined,
        fetcher: undefined,
        data: []
    }

    async componentDidMount() {
        console.log('mounted');
        var files = await getFiles().catch((err) => {
            errorToaster(err);
        });
        this.setState({ files }, () => {
            console.log(`Set files state to ${files}`);
        });
    }

    onReceiveFile = (file) => {
        this.setState({ file }, () => {
            retrieveStore(file)
                .then(({ store, fetcher, webId }) => {
                    // Save the store and fetcher into the program state
                    this.setState({ store, fetcher, webId, data: [] }, () => {
                        this.onReceiveStore();
                    })
                })
                .catch(err => errorToaster(err));
            console.log(this.state.file);
        })
    }

    onReceiveStore = () => {
        var {sensor, type} = getSensor(this.state.store);
        if (type === 'sosa' || type === 'saref') {
            var measurements = getMeasurements(sensor, type, this.state.store);
            var data = getData(measurements, type, this.state.store);
            console.log(data);
            this.setState({data}, () => {
                console.log("Data set as state");
            });
        } else {
            errorToaster('No SSN/SOSA or SAREF device found in this file.');
        }
    }

    onShare = async (url) => {
        try {
            const permissions = [
            {
                agents: [url],
                modes: [AccessControlList.MODES.READ]
            }
            ];
            const ACLFile = new AccessControlList(this.state.webId, this.state.file);
            await ACLFile.createACL(permissions);
            successToaster(`Read access granted to ${url}.`);
        } catch (err) {
            errorToaster(`Error granting access to ${url}: ${err}`);
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
                    {(this.state.file !== 'None') ? <Textinput onSubmit={this.onShare} default={'https://example-friend.com/profile/card#me'} title='Share this file' label='share'></Textinput> : <></>}
                    <Visualize data = {this.state.data} object = {this.state.file} type = {this.state.type}></Visualize>
                </IoTDashboardContainer>
            </IoTDashboardWrapper>
        )
    }
}

export default IoTDashboard;