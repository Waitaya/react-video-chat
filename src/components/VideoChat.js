import React, { useEffect, useState, useRef } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Peer from "simple-peer";
import {
  CameraIcon,
  Microphone,
  TurnOffCamera,
  TurnOffMicrophone,
} from "./Icons";
import Alert from "./Alert";
import process from "process";

// Add polyfill for process
window.process = process;

const client = new W3CWebSocket("ws://localhost:5001");

function VideoChat() {
  const [yourID, setYourID] = useState("");
  const [users, setUsers] = useState([]);
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  // Media
  const [isAudio, setIsAudio] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();

  useEffect(() => {
    // Setup WebSocket connection and event listeners
    client.onopen = () => {
      const id = Math.floor(Math.random() * 10000);
      console.log(`Registering with ID: ${id}`);
      client.send(JSON.stringify({ type: "register", id }));
    };

    client.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log('Received message:', data);
      switch (data.type) {
        case "yourID":
          setYourID(data.id);
          break;
        case "allUsers":
          setUsers(data.users);
          break;
        case "hey":
          setReceivingCall(true);
          setCaller(data.from);
          setCallerSignal(data.signal);
          break;
        case "user left":
          handleUserLeft(data.id);
          break;
        case "callAccepted":
          if (peerRef.current) {
            setCallAccepted(true);
            peerRef.current.signal(data.signal);
          }
          break;
        default:
          break;
      }
    };

    return () => {
      // Only close WebSocket if it is open
      if (client.readyState === W3CWebSocket.OPEN) {
        client.close();
      }
    };
  }, []);

  useEffect(() => {
    // Setup media stream
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        setIsAudio(true);
        setIsVideo(true);
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserLeft = (userId) => {
    console.log("User left:", userId);
    setReceivingCall(false);
    setCaller("");
    setCallAccepted(false);
    setUsers((users) => users.filter((user) => user !== userId));
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  };

  const callPeer = (id) => {
    try {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Add more STUN/TURN servers as needed
          ],
        },
      });

      peer.on("signal", (data) => {
        client.send(
          JSON.stringify({
            type: "callUser",
            userToCall: id,
            signalData: data,
            from: yourID,
          })
        );
      });

      peer.on("stream", (stream) => {
        if (partnerVideo.current) {
          partnerVideo.current.srcObject = stream;
        }
      });

      peer.on("close", () => {
        console.log("Peer connection closed");
        handleUserLeft(id);
      });

      peer.on("error", (err) => {
        console.error("Peer connection error:", err);
        handleUserLeft(id);
      });

      peerRef.current = peer;
    } catch (error) {
      console.error("Error handling peer:", error);
    }
  };

  const acceptCall = () => {
    try {
      setCallAccepted(true);
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Add more STUN/TURN servers as needed
          ],
        },
      });

      peer.on("signal", (data) => {
        client.send(
          JSON.stringify({
            type: "acceptCall",
            signal: data,
            to: caller,
          })
        );
      });

      peer.on("stream", (stream) => {
        partnerVideo.current.srcObject = stream;
      });

      peer.on("close", () => {
        console.log("Peer connection closed");
        handleUserLeft(caller);
      });

      peer.on("error", (err) => {
        console.error("Peer connection error:", err);
        handleUserLeft(caller);
      });

      peerRef.current = peer;
      peer.signal(callerSignal);
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const toggleMedia = ({ video, audio }) => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => (track.enabled = video));
      stream.getAudioTracks().forEach((track) => (track.enabled = audio));
    }
    setIsVideo(video);
    setIsAudio(audio);
  };

  return (
    <div className="w-screen h-screen relative bg-gray-300">
      {stream && (
        <video
          playsInline
          muted={!isAudio}
          ref={userVideo}
          autoPlay
          className="w-full h-full"
        />
      )}
      {receivingCall && (
        <Alert
          message={`${caller} is calling you`}
          onClick={() => {
            acceptCall();
            setReceivingCall(false);
          }}
        />
      )}
      <div className="absolute top-11 right-12 bg-yellow-50 w-full h-full max-w-80 max-h-80 border border-white shadow-md">
        {callAccepted ? (
          <video
            playsInline
            ref={partnerVideo}
            autoPlay
            className="w-full h-full"
          />
        ) : (
          <div className="grid grid-cols-1 divide-y">
            {users.map((key) => {
              if (String(key) === String(yourID)) return null;
              return (
                <div
                  key={key}
                  className="text-center cursor-pointer p-4"
                  onClick={() => callPeer(key)}
                >
                  Call {key}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-6">
          <div
            className="h-12 w-12 cursor-pointer shadow bg-gray-300"
            onClick={() => toggleMedia({ video: isVideo, audio: !isAudio })}
          >
            {isAudio ? <Microphone /> : <TurnOffMicrophone />}
          </div>

          <div
            className="h-12 w-12 cursor-pointer shadow bg-gray-300"
            onClick={() => toggleMedia({ video: !isVideo, audio: isAudio })}
          >
            {isVideo ? <CameraIcon /> : <TurnOffCamera />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoChat;
