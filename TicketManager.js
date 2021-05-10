//Communication with the DataBase

require('dotenv').config();
const AWS = require("aws-sdk")
// AWS.config.loadFromPath('./config.json');
let docClient = new AWS.DynamoDB.DocumentClient();
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

class TableManager{
    constructor() {
		this.docClient = new AWS.DynamoDB.DocumentClient();
		this.tableName = 'ParkingTicket';
	}
    

    //let docClient = new AWS.DynamoDB.DocumentClient();
    async insertParkingTicket (ticket){

        var input ={
            TicketID: ticket.ticketID,
            carPlate: ticket.carPlate,
            parkingLot: ticket.parkingLot,
            entryTime: Date.now(),
            //entryTime: ticket.entryTime.toString(),//Communication with the DataBase

require('dotenv').config();
const AWS = require("aws-sdk")
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
AWS.config.loadFromPath('./config.json');
//let docClient = new AWS.DynamoDB.DocumentClient();
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const REGION = 'us-east-2';

class TableManager{
    constructor() {
        //this.docClient = new DynamoDB({ region: REGION });
		this.docClient = new AWS.DynamoDB.DocumentClient();
		this.tableName = 'ParkingTicket';
	}
    

    //let docClient = new AWS.DynamoDB.DocumentClient();
    async insertParkingTicket (ticket){

        var input ={
            TicketID: ticket.ticketID,
            carPlate: ticket.carPlate,
            parkingLot: ticket.parkingLot,
            entryTime: Date.now(),
            //entryTime: ticket.entryTime.toString(),
            exitTime: ticket.exitTime
    
        }
        var params = {
            TableName: 'ParkingTicket',
            Key: {
                "TicketID": ticket.ticketID
            },
            Item: (input)
        };
    
        this.docClient.put(params, function(err, data){
            if(err){
                console.log("not found" + JSON.stringify(err, null, 2));
            }
            else{
                console.log("success ")
            }
        })

        // params = {
        //     TableName: 'ParkingTicket',
        //     Key: {
        //         "TicketID": ticket.ticketID
        //     }
        // };
    }

    async getTicket(ticketID){
        let item = {};
        var params = {
			TableName: 'ParkingTicket',
			Key: ({
                "TicketID": ticketID
            } )
		};

		try {
			item = await this.docClient.get(params);
            console.log("csr plate is " + item.Item)
		} catch (e) {
			console.log(e);
		}

		return (item.Item);
    }

    async fetchParkingTicket(ticketID) {
        let newTicket = {}
        var params = {
            TableName: 'ParkingTicket',
            Key: ( {
                "TicketID": ticketID
            })
        };

        // this.docClient.get(params, function(err, data){
        //     if(err){
        //         console.log("not found" + JSON.stringify(err, null, 2));
        //     }
        //     else{
        //         console.log("success " + JSON.stringify(data, null, 2))
        //         ticket = data.Item;
        //         let exitTime = parseInt(Date.now())
        //         ticket.exitTime = exitTime
               
        //         let entryTime = parseInt(ticket.entryTime)
        //         let numOfMinutesElapsed = ((exitTime - entryTime)/1000)/60
        //         ticket.numOfMinutesElapsed = numOfMinutesElapsed;
        //         console.log("value: " + numOfMinutesElapsed)
        //         console.log("and" + ticket.numOfMinutesElapsed);
            
        //     }
        // })

        try {
            newTicket = await this.docClient.get(params);
            const str = CircularJSON.stringify(newTicket);
            JSON.parse(str);
            console.log("the new ticket is  = " + str)
            
        } catch(e) {
            console.log(e);
        }
    
        
        return  (newTicket);
    }

    // async calcBill(ticket){
    //     return Math.floor(ticket.numOfMinutesElapsed/15) * 2.5;
    // }



}


// module.exports = TableManager;
//             exitTime: ticket.exitTime
    
//         }
//         var params = {
//             TableName: 'ParkingTicket',
//             Item: input
//         };
    
//         this.docClient.put(params, function(err, data){
//             if(err){
//                 console.log("not found" + JSON.stringify(err, null, 2));
//             }
//             else{
//                 console.log("success ")
//             }
//         })

//         params = {
//             TableName: 'ParkingTicket',
//             Key: {
//                 "TicketID": ticket.ticketID
//             }
//         };
//     }

//     async getTicket(ticketID){
//         const params = {
// 			TableName: 'ParkingTicket',
// 			Key:marshall({
//                 "TicketID": ticketID
//             } )
// 		};

// 		let item = {};

// 		try {
// 			item = await this.docClient.getItem(params);
// 		} catch (e) {
// 			console.log(e);
// 		}

// 		return unmarshall(item.Item);
//     }

//     async fetchParkingTicket(ticketID) {
//         let ticket = {}
//         var params = {
//             TableName: 'ParkingTicket',
//             Key: {
//                 "TicketID": ticketID
//             }
//         };

//         this.docClient.get(params, function(err, data){
//             if(err){
//                 console.log("not found" + JSON.stringify(err, null, 2));
//             }
//             else{
//                 console.log("success " + JSON.stringify(data, null, 2))
//                 ticket = data.Item;
//                 let exitTime = parseInt(Date.now())
//                 ticket.exitTime = exitTime
               
//                 let entryTime = parseInt(ticket.entryTime)
//                 let numOfMinutesElapsed = ((exitTime - entryTime)/1000)/60
//                 ticket.numOfMinutesElapsed = numOfMinutesElapsed;
//                 console.log("value: " + numOfMinutesElapsed)
//                 console.log("and" + ticket.numOfMinutesElapsed);
            
 
//             }
//         })
        
//         return ticket;
//     }

//     async calcBill(ticket){
//         return ticket.numOfMinutesElapsed * 4;
//     }



// }


//module.exports = TableManager;