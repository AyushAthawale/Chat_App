const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {userJoin,getCurrentUser,userLeave,
  getRoomUsers} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder pushes static html pages requested by browser from  server 
app.use(express.static(path.join(__dirname, 'public')));


const botName='ChatCord Bot';

io.on('connection',(socket)=> {
    socket.on('joinRoom',({username,room})=>{
       const user =userJoin(socket.id,username,room);

      socket.join(user.room);

       //welcome current user
    socket.emit('message', formatMessage(botName,'Welcome to ChatCord'));

    //broadcast when a user connects 
    socket.broadcast.to(user.room).emit('message',formatMessage(botName,`A ${user.username} has joined the chat`));
    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
    

    });

   

     //Listen for chatMessage 
     socket.on('chatMessage',(msg)=> {
      //  console.log(msg);
       const user=getCurrentUser(socket.id);
      
       io.to(user.room).emit('message',formatMessage(user.username,msg));
     });

     //Runs when a client disconnects
     socket.on('disconnect',()=>{
       const user= userLeave(socket.id);

       if(user) {
        io.to(user.room).emit('message',formatMessage(botName,`A ${user.username} has left the chat`)
        );
            // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });




       }

     
    });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));