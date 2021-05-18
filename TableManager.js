//Communication with the DataBase

require('dotenv').config();
const AWS = require("aws-sdk")
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const REGION = 'us-east-2';

class TableManager{
    constructor() {
        this.docClient = new DynamoDB({ region: REGION });
		this.tableName = 'ParkingTicket';
	}
    

    async insertParkingTicket (ticket){

        var input = marshall ({
            TicketID: ticket.ticketID,
            carPlate: ticket.carPlate,
            parkingLot: ticket.parkingLot,
            entryTime: Date.now(),
            exitTime: ticket.exitTime
    
        })
        var params = {
            TableName: 'ParkingTicket',
            Item: (input)
        };
    
        try{
            await this.docClient.putItem(params)
        } catch (e) {
            console.log(e);
        }
    }

    async fetchParkingTicket(ticketID) {
        let newTicket = {}
        var params = {
            TableName: 'ParkingTicket',
            Key: marshall( {
                "TicketID": ticketID
            })
        };

        try {
            newTicket = await this.docClient.getItem(params);
        } catch(e) {
            console.log(e);
        }
    
        
        return  unmarshall(newTicket.Item);
    }
}


module.exports = TableManager;