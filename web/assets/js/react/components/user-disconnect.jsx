import React from "react";
import { useDisconnect } from 'wagmi';

console.log("DisconnectUser mounted");

const DisconnectUser = () => {
    console.log("DisconnectUser");
    const { disconnect } = useDisconnect();

    const handleClick = () => {
        disconnect();
        // Here we redirect to reach the backend and clean the session
        window.location.href = "/disconnect";
    };

    return (
        <button
            onClick={handleClick}
            style={{ border: "2px solid black", padding: "8px 16px", cursor: "pointer" }}
        >
            Disconnect
        </button>
    );
};

export default DisconnectUser;
