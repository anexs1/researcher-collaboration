// src/Component/documents/DocumentEditor.jsx (or inline in App.jsx)

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react"; // Added useRef
import { createEditor, Node as SlateNode, Editor, Transforms, Text } from "slate";
import { Slate, Editable, withReact, useSlate } from "slate-react";
import axios from "axios";
import LoadingSpinner from "../Common/LoadingSpinner";
import { FaBold, FaItalic, FaUnderline } from 'react-icons/fa';
import { toggleMark, isMarkActive } from '../../utils/slateEditorUtils'; // Adjust path

// +++ Import Socket.IO client +++
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function debounce(func, delay) { /* ... as before ... */ }
const MarkButton = ({ format, icon }) => { /* ... as before ... */ };
const Toolbar = () => { /* ... as before ... */ };

// +++ Global socket instance reference (manage carefully) +++
// Alternatively, pass socket instance down as prop or use Context
let socket = null;

const DocumentEditor = ({ documentId, currentUser }) => {
  console.log(`%c[DocumentEditor] RENDER - ID: ${documentId}`, "color: red; font-size: 1.1em;");

  const editor = useMemo(() => withReact(createEditor()), []);
  const initialSlateValue = useMemo(() => [{ type: 'paragraph', children: [{ text: '' }] }], []);
  const [editorValue, setEditorValue] = useState(initialSlateValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [docTitle, setDocTitle] = useState("No Document Selected");
  const isRemoteChange = useRef(false); // Ref to track if change came from socket

  const apiClient = useMemo(() => { /* ... as before ... */ });

  // --- Socket Connection and Event Handling ---
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || !documentId) {
        // Disconnect if no token or no document ID
        if (socket) {
            console.log(`[DocumentEditor Socket] Disconnecting socket ${socket.id} (no token or docId)`);
            socket.disconnect();
            socket = null;
        }
        return;
    };

    // Connect or reuse existing connection
    if (!socket || socket.disconnected) {
        console.log(`[DocumentEditor Socket] Attempting connection to ${API_BASE_URL}`);
        socket = io(API_BASE_URL, {
            auth: { token },
            transports: ["websocket"]
        });

        socket.on('connect', () => {
            console.log(`[DocumentEditor Socket] Connected: ${socket.id}. Emitting join-document for ${documentId}`);
            socket.emit('join-document', documentId); // Join room on connect
        });

        socket.on('disconnect', (reason) => {
            console.log(`[DocumentEditor Socket] Disconnected: ${reason}`);
            // Optionally handle reconnection logic or UI feedback
        });

        socket.on('connect_error', (err) => {
            console.error(`[DocumentEditor Socket] Connection Error: ${err.message}`);
            setError(`Socket connection failed: ${err.message}`);
        });
    } else if (socket.connected) {
         // If already connected but documentId changed, rejoin room
         console.log(`[DocumentEditor Socket] Already connected: ${socket.id}. Emitting join-document for new ID ${documentId}`);
         // You might need to leave the previous room first if documentId changed
         // socket.emit('leave-document', previousDocumentId); // Need to track previous ID
         socket.emit('join-document', documentId);
    }

    // --- Listener for remote changes ---
    const handleRemoteChange = (data) => {
        if (data.documentId === documentId) { // Ensure change is for this doc
            console.log(`[DocumentEditor Socket] Received 'remote-change' for doc ${documentId}:`, data.operations);
            isRemoteChange.current = true; // Flag that the next change is remote
            Editor.withoutNormalizing(editor, () => {
                data.operations.forEach(op => {
                    try {
                        // Apply remote operation
                        editor.apply(op);
                    } catch (e) {
                        console.error("Error applying remote operation:", op, e);
                        setError("Sync error applying remote change.");
                    }
                });
            });
            // Set flag back after applying changes (perhaps in a microtask)
             Promise.resolve().then(() => { isRemoteChange.current = false; });
             // Force update Slate's value state IF needed after external changes
             // This forces React to re-render with the updated editor state
             setEditorValue([...editor.children]);
        } else {
            // console.log(`[DocumentEditor Socket] Ignored remote change for different doc ID ${data.documentId}`);
        }
    };

    socket.on('remote-change', handleRemoteChange);

    // Cleanup on unmount or when documentId/token changes
    return () => {
        console.log(`[DocumentEditor Socket] Cleanup effect running for doc ${documentId}. Socket ID: ${socket?.id}`);
        if (socket) {
            console.log(`[DocumentEditor Socket] Emitting leave-document for ${documentId}`);
            socket.emit('leave-document', documentId);
            socket.off('remote-change', handleRemoteChange);
            // Consider disconnecting entirely if appropriate, or manage connection globally
            // socket.disconnect();
            // socket = null;
        }
    };
  }, [documentId, editor]); // Rerun effect if documentId or editor instance changes

  // --- Fetch Initial Document Content ---
  useEffect(() => {
     // ... (The existing useEffect for fetching initial content via HTTP GET remains largely the same) ...
     // Important: When content is fetched successfully, set it using setEditorValue
     console.log(`%c[DocumentEditor] Fetch useEffect TRIGGERED. documentId: ${documentId}`, "color: green;");
     if (!documentId || !currentUser?.id) { /* reset state */ return; }
     setLoading(true); setError(''); setDocTitle(`Loading ${documentId}...`);
     apiClient.get(`/api/documents/${documentId}`)
      .then((res) => {
         if (res.data.success) {
           const fetchedContent = Array.isArray(res.data.data.content) && res.data.data.content.length > 0 ? res.data.data.content : initialSlateValue;
           // Set initial value for the editor - this should only happen ONCE per document load
           // The `key` prop on <Slate> handles re-initialization better.
           // Setting it directly might interfere if edits are happening.
           // Let's rely on the key prop + initialValue for setting content on load.
           setEditorValue(fetchedContent);
           setDocTitle(res.data.data.title || "Untitled");
         } else { /* handle error */ }
      })
      .catch(err => { /* handle error */ })
      .finally(() => setLoading(false));
  }, [documentId, apiClient, initialSlateValue, currentUser]); // Dependencies

  // Save function (now less critical for real-time, maybe for periodic backup?)
  const debouncedSave = useCallback( /* ... can potentially be removed or repurposed ... */ );

  // --- Editor onChange Handler ---
  const handleEditorChange = (newValue) => {
    setEditorValue(newValue); // Update local state

    // If the change originated from a remote source, don't emit it back
    if (isRemoteChange.current) {
        // console.log("[DocumentEditor] onChange skipped emission for remote change");
        return;
    }

    const ops = editor.operations.filter(o => o.type !== 'set_selection');
    if (ops.length > 0 && socket && socket.connected && documentId) {
      console.log(`[DocumentEditor] Emitting 'document-change' for doc ${documentId}`);
      socket.emit('document-change', { documentId, operations: ops });
    }
    // debouncedSave(newValue); // Decide if you still want debounced full saves
  };


  const renderLeaf = useCallback(({ attributes, children, leaf }) => { /* ... as before ... */ }, []);
  const renderElement = useCallback(({ attributes, children, element }) => { /* ... as before ... */ }, []);

  // ... (Loading/Error return JSX) ...

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">{docTitle}</h2>
      {error && <p className="text-red-600 bg-red-100 p-3 rounded mb-4 border border-red-300">{error}</p>}

      {!loading && (
        <Slate editor={editor} initialValue={editorValue} key={documentId || 'editor-no-doc-selected'} onChange={handleEditorChange}>
          <Toolbar />
          <Editable
            placeholder="Start typing..."
            className="prose max-w-none p-3 border border-gray-300 rounded-b-md min-h-[300px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            spellCheck autoFocus={!!documentId} readOnly={!documentId || loading}
            renderLeaf={renderLeaf} renderElement={renderElement}
            onKeyDown={ /* ... hotkeys if needed ... */ }
          />
        </Slate>
      )}
    </div>
  );
};

export default DocumentEditor; // If separate file