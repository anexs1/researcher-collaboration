// import React, { useState, useEffect, useRef } from "react";
// import "../index.css";
// //Make sure endpoint matches your backend
// const socket = io("http://localhost:3000");

// const Messages = ({ closeChat, username }) => {
//   const [messages, setMessages] = useState([]);
//   const [message, setMessage] = useState("");
//   const chatBodyRef = useRef(null); // Reference to chat body for scrolling

//   useEffect(() => {
//     // Listen for incoming messages from the server
//     socket.on("chat message", (msg) => {
//       setMessages((prevMessages) => [...prevMessages, msg]); // Add new message to state
//     });

//     return () => {
//       socket.off("chat message"); // Clean up listener when component unmounts
//     };
//   }, []);

//   //Scroll to the bottom of chat whenever a new message has arrived
//   useEffect(() => {
//     if (chatBodyRef.current) {
//       chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
//     }
//   }, [messages]); //Depend on the messages state

//   const sendMessage = () => {
//     if (message.trim() !== "") {
//       // Emit message to the server
//       socket.emit("chat message", {
//         text: message,
//         sender: username || "Anonymous",
//       });
//       setMessage("");
//     }
//   };

//   return (
//     <div className="chat-popup w-full max-w-md bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
//       <div className="chat-header bg-blue-500 text-white py-2 px-4 flex justify-between items-center border-b border-gray-300">
//         <h4 className="text-lg font-semibold">Chat</h4>
//         <button
//           className="close-btn text-white hover:text-gray-200 focus:outline-none"
//           onClick={closeChat}
//         >
//           ✖
//         </button>
//       </div>
//       <div
//         ref={chatBodyRef}
//         className="chat-body p-4 space-y-2 overflow-y-auto max-h-96"
//       >
//         {messages.map((msg, index) => (
//           <div
//             key={index}
//             className={`message flex flex-col w-fit max-w-[80%] rounded-lg py-2 px-3 break-words ${
//               msg.sender === (username || "Anonymous")
//                 ? "bg-green-200 ml-auto items-end"
//                 : "bg-gray-100 mr-auto items-start"
//             }`}
//           >
//             <div className="message-content text-sm">
//               <strong className="font-medium">{msg.sender}:</strong> {msg.text}
//             </div>
//           </div>
//         ))}
//       </div>
//       <div className="chat-footer p-4 border-t border-gray-300 flex items-center">
//         <input
//           type="text"
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           onKeyPress={(e) => {
//             if (e.key === "Enter") {
//               sendMessage();
//             }
//           }}
//           placeholder="Type a message..."
//           className="flex-grow border border-gray-400 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//         <button
//           onClick={sendMessage}
//           className="ml-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Messages;
// src/Page/Messages.jsx
import React from "react";

const Messages = () => {
  // Component code
  return (
    <div>
      <h2>anaccscscc</h2>
    </div>
  );
};

export default Messages; // This is crucial!
