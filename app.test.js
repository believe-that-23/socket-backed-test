import request from 'supertest';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import server from './index.js'; // Assuming server.js exports the Express app

describe('Socket.io Server', () => {
  let httpServer;
  let ioServer;

  beforeAll((done) => {
    server.listen(3000, () => {
      console.log(`Server is listening on port ${3000}`);
    });
    const app = express();
    httpServer = http.createServer(app);
    ioServer = new Server(httpServer);
    console.log("server: ", server);
    // Start the server
    httpServer.listen(0, () => {
      done();
    });
  });

  afterAll(async () => {
    await server.close();
    await httpServer.close();
  });


  //   it('should respond with "Hello, world!" on socket connection', (done) => {
  //     const client = require('socket.io-client')(`http://localhost:3000`);
  //     client.on('message', (message) => {
  //       expect(message).toEqual('Hello, world!');
  //       done();
  //     });
  //   });

  it('should broadcast "Hello everyone: Test message" to all clients', (done) => {
    const client1 = require('socket.io-client')(`http://localhost:3000`);
    const client2 = require('socket.io-client')(`http://localhost:3000`);


    client1.on('broadcastMessage', (message) => {
      // Don't need to assert here; the other client's callback handles it
    });

    client2.on('broadcastMessage', (message) => {
      expect(message).toEqual('Hello everyone: Test message');
      client1.disconnect();
      client2.disconnect();
      done();
    });

    // Emit the "broadcast" event from one of the clients
    client1.emit('broadcast', 'Test message');
  });

  it(`should receive "message" event when "sendMessage" Event is emitted`, (done) => {
    const client1 = require('socket.io-client')(`http://localhost:3000`);
    const client2 = require('socket.io-client')(`http://localhost:3000`);
    const testMsg = { username: 'user01', message: 'Lorem ipsum' };

    client1.on('message', (message) => {
      // Don't need to assert here; the other client's callback handles it
    });

    // This will be called when any one of the clients emits "sendMessage" event
    client2.on('message', (message) => {
      setImmediate(() => {
        expect(message).toEqual({
          username: testMsg.username,
          text: testMsg.message,
        });
      });
      client1.disconnect();
      client2.disconnect();
      done();
    });

    // Emit the "sendMessage" event from one of the clients
    client1.emit('sendMessage', testMsg);
  });

  it('should welcome a user and broadcast to the room on "join" event', (done) => {
    const client1 = require('socket.io-client')(`http://localhost:3000`);
    // const client2 = require('socket.io-client')(`http://localhost:3000`);
    const roomName = 'exampleRoom';

    client1.on('message', (message) => {
      setImmediate(() => {
        expect(message.text).toContain(`Alice`);
        client1.disconnect();
        done();
      });
    });

    // Client 1 joins the room
    client1.emit('join', { username: 'Alice', room: roomName });
  });

  it('should inform other users someone has joined the room on "join" event', (done) => {
    const client1 = require('socket.io-client')(`http://localhost:3000`);
    const client2 = require('socket.io-client')(`http://localhost:3000`);
    const usernameClient1 = 'Alice';
    const usernameClient2 = 'Bob';

    const roomName = 'exampleRoom';

    client1.on('message', (message) => {
      setImmediate(() => {
        if (message.username === usernameClient2) {
          expect(message.text).toEqual(
            `${usernameClient2} has joined the room.`
          );
          client1.disconnect();
          client2.disconnect();
          done();
        }
      });
    });

    // Client 1 joins the room
    client1.emit('join', { username: usernameClient1, room: roomName });

    // Client 2 joins the room
    client2.emit('join', { username: usernameClient2, room: roomName });
  });
});

