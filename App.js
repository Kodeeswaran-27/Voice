import React, { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";

const WS_URL = "ws://localhost:8000/ws/";

function App() {
  const [myId, setMyId] = useState("");
  const [peerId, setPeerId] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [ws, setWs] = useState(null);
  const [stream, setStream] = useState(null);
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    const id = Math.random().toString(36).substring(7);
    setMyId(id);
    const websocket = new WebSocket(WS_URL + id);
    setWs(websocket);

    websocket.onmessage = (event) => {
      const [from, signal] = event.data.split(":", 1);
      if (signal) {
        setIncomingCall({ from, signal });
      }
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) myVideo.current.srcObject = currentStream;
      });

    return () => websocket.close();
  }, []);

  const callUser = () => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (data) => {
      ws.send(`${peerId}:${JSON.stringify(data)}`);
    });

    peer.on("stream", (userStream) => {
      userVideo.current.srcObject = userStream;
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      ws.send(`${incomingCall.from}:${JSON.stringify(data)}`);
    });

    peer.on("stream", (userStream) => {
      userVideo.current.srcObject = userStream;
    });

    peer.signal(JSON.parse(incomingCall.signal));
    connectionRef.current = peer;
    setIncomingCall(null);
  };

  return (
    <div>
      <h2>My ID: {myId}</h2>
      <input
        type="text"
        placeholder="Enter Peer ID to Call"
        onChange={(e) => setPeerId(e.target.value)}
      />
      <button onClick={callUser}>Call</button>

      {incomingCall && (
        <div>
          <h3>Incoming Call from {incomingCall.from}</h3>
          <button onClick={answerCall}>Answer</button>
        </div>
      )}

      <div>
        <video ref={myVideo} playsInline autoPlay muted />
        <video ref={userVideo} playsInline autoPlay />
      </div>
    </div>
  );
}
export default App;