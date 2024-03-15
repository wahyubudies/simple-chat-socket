import { useEffect, useRef, useState } from 'react';
import * as StompJs from '@stomp/stompjs';

const Chat = () => {
    const [message, setMessage] = useState("");
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);
    const [broadcastMessages, setBroadcastMessages] = useState([]);

    useEffect(() => {
        // Ensure client is created only once
        const client = clientRef.current || new StompJs.Client({
            brokerURL: 'ws://18.143.243.84:8085/connect',
            connectHeaders: {
                login: 'user', // Replace with actual credentials if needed
                passcode: 'password',
            },
            debug: function (str) {
                // console.log(str, moment(new Date()).format("DD-MM-YYYY H:mm:ss"));
                console.log(str);
            },
            reconnectDelay: 5000, // Adjust reconnection delay as needed
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });
        clientRef.current = client;

        // Connect only when not already connected
        if (!connected) {
            client.onConnect = function (frame) {
                setConnected(true);
                client.subscribe('/broadcast', function (message) {
                    const obj = JSON.parse(message.body);
                    setBroadcastMessages((prevMessages) => [...prevMessages, obj]);
                });
            };

            client.onStompError = function (frame) {
                console.error('Broker reported error:', frame.headers['message']);
                console.error('Additional details:', frame.body);
                // Implement reconnection logic or error handling here (optional)
            };

            client.activate();
        }

        // Cleanup function to deactivate on unmount
        return () => {
            clientRef.current.deactivate();
            setConnected(false);
        };
    }, []); // Empty dependency array to run only once

    const sendMessage = () => {
        if (clientRef.current) {
            clientRef.current.publish({
                destination: '/App/chat',
                body: JSON.stringify({
                    text: message,
                    media: [
                        {
                            url: "https://picsum.photos/250",
                            type: "IMAGE"
                        }
                    ]
                }), // Use the actual message from input
            });
            setMessage(""); // Clear input after sending
        } else {
            console.error("Client not connected, cannot send message.");
        }
    };

    return (
        <div>
            <div>App: {connected ? "Connected" : "Disconnected"}</div>
            <div>
                <input value={message} onChange={(e) => setMessage(e.target.value)} type="text" name="" id="" />
                <button onClick={sendMessage}>Send</button>
            </div>
            <div>
                <h3>Broadcast Messages:</h3>
                <ul>
                    {broadcastMessages.map((item, index) => (
                        <li key={index}>
                            {item.text} <br />
                            {item.media.map((item2, index2) => {
                                switch (item2.type) {
                                    case 'IMAGE':
                                        return <img width="250" key={index2} src={item2.url} alt="" />;
                                    case 'VIDEO':
                                        return (
                                            <video width="320" height="240" controls key={index2}>
                                                <source src={item2.url} type="video/mp4" />
                                                <source src={item2.url} type="video/ogg" />
                                                Your browser does not support the video tag.
                                            </video>
                                        );
                                    default:
                                        return null; // Handle other media types if needed
                                }
                            })}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Chat;