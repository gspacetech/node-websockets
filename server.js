'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
 // .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

// wss.on('connection', (ws) => {
//   console.log('Client connected');
//   ws.on('close', () => console.log('Client disconnected'));
// });

// setInterval(() => {
//   wss.clients.forEach((client) => {
//     client.send(new Date().toTimeString());
//   });
// }, 1000);

//all connected to the server users 
var users = {};

var group = {};
group["roominit"]={};
//group.room["gaurav"] = "connection";
//group.room["nikhil"] = "connection1";
//console.log("test 2d array "+group.room.length);
//console.log("test 2d array "+group[room][nikhil]);

  
//when a user connects to our sever 
wss.on('connection', function(connection) {
  
   //console.log("User connected");
	 
   //when server gets a message from a connected user 
   connection.on('message', function(message) {
	// console.log("User message "+ message);
      var data; 
      //accepting only JSON messages 
      try { 
         data = JSON.parse(message); 
      } catch (e) { 
         console.log("Invalid JSON"); 
         data = {}; 
      }
	    var roomName = data.roomId;
	//console.log("User type "+ data.type);	  
      //switching type of the user message 
      switch (data.type) { 
         //when a user tries to login 
		     
         case "init": 
            //console.log("User logged", data.id+" "+data.roomId); 
            //if anyone is logged in with this username then refuse 
			
            if(group[data.roomId]) { 
			//console.log("init room has ", data.id+" "+data.roomId); 	
				if(group[data.roomId][data.id]){
					console.log("init user has ", data.id+" "+data.roomId); 
				}else{
					
					// add user id
					if(hasRoomInitConnection()){
						console.log("join no user ", data.id+" "+data.roomId);
						connection.id=data.id;
					connection.isInitiator = false;
					group[data.roomId][data.id] = connection;
				
					sendToAllInRoom(roomName, { 
                  		type: "join", 
                  		success: true 
               		}); 
					}else{
						console.log("joininit no user ", data.id+" "+data.roomId);
						connection.id=data.id;
					connection.isInitiator = true;
					group[data.roomId][data.id] = connection;
					
					sendToAllInRoom(roomName, { 
                  		type: "joininit", 
                  		success: true 
               		}); 
					}
				}
            } else { 
				// add room and user id
				console.log("init no room  ", data.id+" "+data.roomId);
				group[data.roomId]={};
		    		connection.id = data.id;
		    		connection.isInitiator = true;
				group[data.roomId][data.id] = connection;
				
               //save user connection on the server 
             //  users[data.name] = connection; 
             //  connection.name = data.name; 
					
               sendToAllInRoom(roomName, { 
                  type: "init", 
                  success: true 
               }); 
            }
			
            break;
				
         case "offer": 
            //for ex. UserA wants to call UserB 
            console.log("Sending offer to: all"); 
				
            //if UserB exists then send him offer details 
           // var conn = users[data.id]; 
				
          //  if(conn != null) { 
               //setting that UserA connected with UserB 
              // connection.otherName = data.name; 
					
               sendToAllInRoom(roomName, { 
                  type: "offer", 
                  offer: data.offer 
                  //name: connection.name 
               }); 
          //  } 
				
            break;
				
         case "answer": 
            console.log("Sending answer to: All"); 
            //for ex. UserB answers UserA 
            sendToAllInRoom(roomName, { 
                  type: "answer", 
                  answer: data.answer 
                  //name: connection.name 
               });
				
            break;		
         default: 
            sendTo(connection, { 
               type: "error", 
               message: "Command not found: " + data.type 
            }); 
				
            break;
				
      }  
   });
	
   //when user exits, for example closes a browser window 
   //this may help if we are still in "offer","answer" or "candidate" state 
   connection.on("close", function() { 
	
      if(connection.id) { 
		  for(var i in group){
			  var rooms = group[i];
			  for(var j in rooms){
				  var connectionTemp = rooms[j];
				  if(connectionTemp.id === connection.id){
					  delete rooms[j];
					  console.log("delete");
				  }else{
					  connectionTemp.send(JSON.stringify( {
                  		type: "leave"
                  		//name: connection.name 
               		})); 
     			console.log("leave");
				}
			  }
		}
		  
		 
         //delete users[connection.name]; 
			
//          if(connection.otherName) { 
//             console.log("Disconnecting from ", connection.otherName); 
//             var conn = users[connection.otherName]; 
//             conn.otherName = null;
				
// //             if(conn != null) { 
// //                sendTo(conn, { 
// //                   type: "leave" 
// //                }); 
// //             }  
//          } 
      } 
   });

   connection.send("Hello world");
	
});

function hasRoomInitConnection(){
	var hasinitiator = false;
	for(var i in group){
			  var rooms = group[i];
			  for(var j in rooms){
				  var connectionTemp = rooms[j];
				  if(connectionTemp.isInitiator === true){
					  hasinitiator = true;
					  console.log("inititor found");
			  }
			  }
		}
	console.log("has inititor " + hasinitiator);
	return hasinitiator;
}
  
function sendTo(connection, message) { 
   connection.send(JSON.stringify(message)); 
}


function sendToAllInRoom(roomId, message) { 
	console.log("room id "+roomId +" msg "+message);
	for(var i in group[roomId]){
		var connection = group[roomId][i];
		connection.send(JSON.stringify(message)); 
     	console.log(connection.id);
	}
}
