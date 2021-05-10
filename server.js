
const express = require('express');
const app = express();
const router = express.Router();
const TableManager = require('./TableManager');
const shortid = require('shortid');
// const { ServerlessApplicationRepository } = require('aws-sdk');
const badEntryRequestMSG = "need to include license plate and parking lot number"
const badExitRequest = "invalid ticket id"

const table = new TableManager;

//app.use(router);

app.listen(3000, () => {
	console.log(`Example app listening at http://localhost:3000`);
});
app.get('/', (req, res) => {
    console.log("hi")
    res.status(200);
    res.send('ok');
})

app.post('/entry', async (req, res) => {

    if(req.query.plate === undefined || req.query.parkingLot === undefined || req.query.plate === null || req.query.parkingLot === null){
        res.status(400);
        res.send(badEntryRequestMSG);
        console.log("bad request");
    }
    else{
        let parkingTicket = {
            ticketID: shortid.generate(),
            carPlate: req.query.plate,
            parkingLot: req.query.parkingLot,
            entryTime: Date.now(),
            exitTime: 'null'
       };
       //TODO - save the parking ticket to DataBase
       table.insertParkingTicket(parkingTicket);

    res.status(201);
    res.send('ok ');
    }    
})

app.post('/exit', async (req, res) => {

    let ticketID = req.query.ticketId;
    
    if(ticketID === null || ticketID === undefined ){
        res.status(400);
        res.send(badExitRequest);
        console.log("bad request");
    }
    //else{  
    //     const exitTime = Date.now();
    //    let rTicket = await table.fetchParkingTicket(ticketID);

    //     if(rTicket === undefined || rTicket === null){
    //         res.status(400);
    //         res.send("Ticket was not found")
            
    //     }
    //     let bill = await table.calcBill(rTicket);
    //     res.status(201).send({
    //         status: (200),
    //         msg:'cool',
    //         ticket: rTicket,
    //         totalTime: rTicket.total,
    //         t: bill
    //     }); 
    //}
    const exitTime = Date.now();
    console.log("try to get ticket")
    //let rTicket = await table.getTicket(ticketID);
    let rTicket = await table.fetchParkingTicket(ticketID)

    console.log(" the new ticket is: " + rTicket)

    if(rTicket === undefined || rTicket === null){
        res.status(400);
        res.send("Ticket was not found")
            
    }
    else{
           // let bill = await table.calcBill(rTicket);
    res.status(201).send({
        status: (200),
        msg:'cool',
        ticket: rTicket,
        // totalTime: rTicket.total,
        // t: bill
    }); 

    }
 

    console.log("calc payment")

})
