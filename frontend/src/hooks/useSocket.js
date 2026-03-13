import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

export default function useSocket(onCardMoved, onCardUpdated) {  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(API_URL);

    socketRef.current.on("card:moved",   (data) => onCardMoved(data));
socketRef.current.on("card:updated", (data) => onCardUpdated?.(data));
  

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return socketRef.current;
}