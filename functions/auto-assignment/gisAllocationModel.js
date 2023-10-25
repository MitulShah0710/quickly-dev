'use strict';

const axios = require('axios');
const util = require('util');

class HereRouteMatrixServiceProvider {

    constructor(apikey) {
        this.apiKey = apikey
    }

    async getRouteMatrix(inputs) {
        console.log(inputs);
        try {
            const response = await axios.post('https://matrix.router.hereapi.com/v8/matrix?',
            {
                origins: inputs.origins,
                destinations: inputs.destinations,
                regionDefinition: {
                    type: "world"
                },
                matrixAttributes: ["travelTimes", "distances"]
            },
            {
                params: {
                    async: false,
                    apiKey: this.apiKey
                }
            });
            console.log(response);
            return response.data.matrix;

        } catch(error) {
            console.log(error);
            return {
                travelTimes:[],
                error: error.message
            }
        }
    }
}

const routeMatrixServiceProvider = new HereRouteMatrixServiceProvider(process.env.HERE_API);

const filterAgents = (maxTravelTime, matrix, agents) => {
    let selectedAgents = []

    if (matrix.errorCodes) {
        matrix.errorCodes.forEach((errorCode, index) => {
            if ( !errorCode && matrix.travelTimes[index] <= maxTravelTime ) {
                selectedAgents.push(agents[index].ID)
            }
        })
    } else {
        matrix.travelTimes.forEach((travelTime, index) => {
            if ( travelTime <= maxTravelTime ) {
                selectedAgents.push(agents[index].ID)
            }
        })
    }


    return selectedAgents
}

module.exports.submit = async (event, context) => {
    console.info("EVENT\n" + JSON.stringify(event, null, 2));

    const promise = new Promise(function(resolve, reject) {
        const { tenantHash } = event
        const taskCoords = event.task.latlong
        const maxTravelTime = event.config.maxTravelTimes[parseInt(event.current.attempts)-1]
        const maxTaskPerAgent = event.config.maxTasksPerAgent
        let agentsActive = event.agentsData
        let notifiedAgents = event.current.notifiedAgents

        // Filter out Agents without coordinates
        agentsActive = agentsActive.filter(agent => agent.latitude && agent.longitude)

        if ( agentsActive && Array.isArray(agentsActive) && agentsActive.length > 0 ) {
            // Use only agents on-duty
            agentsActive = agentsActive.filter(agent => agent.workStatus == "AVAILABLE" || agent.workStatus == "WORKING")

            // Only used agents with less than maxTaskPerAgent active tasks
            agentsActive = agentsActive.filter(agent => agent.activeTaskCount <= maxTaskPerAgent)

            // Only used agents-provided by user if a list was provided
            if ( event.agents && Array.isArray(event.agents) && event.agents.length > 0 ) {
                agentsActive = agentsActive.filter(agent => event.agents.includes(agent.ID) )
            }

            let destinationCords = agentsActive.map(agent => { return {
                lat: agent.latitude,
                lng: agent.longitude
            }})
            // Get Distance Matrix
            routeMatrixServiceProvider.getRouteMatrix({
                origins: taskCoords,
                destinations: destinationCords
            }).then(routeMatrix => {
                console.log(routeMatrix)
                let selectedAgents = filterAgents(maxTravelTime, routeMatrix, agentsActive)
                let newAgents = selectedAgents.filter(a => !notifiedAgents.includes(a) )
                resolve({
                    'selectedAgents':newAgents,
                    'numSelectedAgents': newAgents.length,
                    'notifiedAgents': notifiedAgents,
                    'attempts': parseInt(event.current.attempts) + 1
                });

            }).catch(err => {
                console.error(err);
                reject(Error(err))
            });

        } else {
            resolve({
                'selectedAgents': [],
                'numSelectedAgents': 0,
                'notifiedAgents': notifiedAgents,
                'attempts': parseInt(event.attempts) + 1
            });
        }

  });

  return promise;
};

