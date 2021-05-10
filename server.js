
const express = require('express');
const app = express();
const router = express.Router();
const TableManager = require('./TableManager');
const shortid = require('shortid');
const badEntryRequestMSG = "need to include license plate and parking lot number"
const badExitRequest = "invalid ticket id"
const table = new TableManager;


app.listen(3000, () => {
	console.log(`listening at http://localhost:3000`);
});
app.get('/', (req, res) => {
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
    
    const exitTime = parseInt(Date.now());
    
    let rTicket = await table.fetchParkingTicket(ticketID)
    let totalTime = (exitTime - parseInt(rTicket.entryTime))/1000/60
    let totalPrice = Math.floor(totalTime/15) * 2.5

    if(rTicket === undefined || rTicket === null){
        res.status(400);
        res.send("Ticket was not found")
            
    }
    else{
    res.status(201).send({
        status: (200),
        msg:`Vehicle with plate number ${rTicket.carPlate} has left the parking lot`,
        ticket: rTicket,
        totalTime: totalTime,
        totalPrice: totalPrice
    }); 

    }
})
