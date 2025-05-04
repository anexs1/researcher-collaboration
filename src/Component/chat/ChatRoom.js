// import React, { useEffect, useState, useRef } from "react";
// import { Button, Form, ListGroup, InputGroup } from "react-bootstrap";
// import { getMessages, sendMessage } from "../../api/chat.api";
// import useWebSocket from "../../hooks/useWebSocket";

// const ChatRoom = ({ projectId }) => {
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [loading, setLoading] = useState(true);
//   const messagesEndRef = useRef(null);
//   const { user } = useSelector((state) => state.auth);

//   // Get initial messages
//   useEffect(() => {
//     const fetchMessages = async () => {
//       try {
//         const data = await getMessages(projectId);
//         setMessages(data);
//         setLoading(false);
//       } catch (error) {
//         console.error("Failed to fetch messages:", error);
//         setLoading(false);
//       }
//     };

//     fetchMessages();
//   }, [projectId]);

//   // WebSocket connection for real-time updates
//   const { lastMessage } = useWebSocket(`ws://localhost:5000/chat/${projectId}`);

//   useEffect(() => {
//     if (lastMessage) {
//       const message = JSON.parse(lastMessage.data);
//       setMessages((prev) => [...prev, message]);
//     }
//   }, [lastMessage]);

//   // Auto-scroll to bottom
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!newMessage.trim()) return;

//     try {
//       const message = {
//         content: newMessage,
//         user_id: user.id,
//         user_name: user.name,
//       };

//       // Optimistic update
//       setMessages((prev) => [...prev, message]);
//       setNewMessage("");

//       // Send to server
//       await sendMessage(projectId, newMessage);
//     } catch (error) {
//       console.error("Failed to send message:", error);
//       // Revert optimistic update if needed
//     }
//   };

//   if (loading) return <Spinner animation="border" />;

//   return (
//     <div className="chat-room">
//       <div
//         className="message-list mb-3"
//         style={{ height: "400px", overflowY: "auto" }}
//       >
//         <ListGroup>
//           {messages.map((msg, index) => (
//             <ListGroup.Item
//               key={index}
//               className={`d-flex ${
//                 msg.user_id === user.id
//                   ? "justify-content-end"
//                   : "justify-content-start"
//               }`}
//             >
//               <div
//                 className={`message ${
//                   msg.user_id === user.id ? "sent" : "received"
//                 }`}
//               >
//                 <div className="message-sender">
//                   <small>
//                     {msg.user_id === user.id ? "You" : msg.user_name}
//                   </small>
//                 </div>
//                 <div className="message-content">{msg.content}</div>
//                 <div className="message-time">
//                   <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
//                 </div>
//               </div>
//             </ListGroup.Item>
//           ))}
//           <div ref={messagesEndRef} />
//         </ListGroup>
//       </div>

//       <Form onSubmit={handleSendMessage}>
//         <InputGroup>
//           <Form.Control
//             type="text"
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             placeholder="Type your message..."
//           />
//           <Button variant="primary" type="submit">
//             Send
//           </Button>
//         </InputGroup>
//       </Form>
//     </div>
//   );
// };

// export default ChatRoom;
