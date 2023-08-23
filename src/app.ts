import "reflect-metadata";
import express from "express";

const app = express();

require("./loaders").default({ expressApp: app });

const port = process.env.PORT || 3030;
var server = app
  .listen(3030, "192.168.100.93", () => {
    console.log(`
    ------------------------------------------------
    ################################################
    Server listening on port: ${port} 
    ################################################`);
  })
  .on("error", (err) => {
    console.log(err);
  });

process.on("uncaughtException", (error, origin) => {
  console.log("----- Uncaught exception -----");
  console.log(error);
  console.log("----- Exception origin -----");
  console.log(origin);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("----- Unhandled Rejection at -----");
  console.log(promise);
  console.log("----- Reason -----");
  console.log(reason);
});
// setInterval(() => {
//   console.log('app still running')
// }, 1000)

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket: any) => {
  console.log(`
    
    

    user join:   ${socket.id}


  `);

  // socket.on('addInventory',function(data:any){
  //   io.emit('getSocketInventory',data);
  //   console.log(data)
  // })
  socket.on("disconnect", function () {
    console.log(`
    
    

      user left:   ${socket.id}

    
    `);
  });
});

export default io;
