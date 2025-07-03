import React from "react";
import Web3EthProvider from "./components/web3-eth-provider";
import DisconnectUser from "./components/user-disconnect";

const AppDisconnectUser = (props) => {
    console.log("AppDisconnectUser");

  return (
    <Web3EthProvider network={props.network}>
      <DisconnectUser {...props} />
    </Web3EthProvider>
  )
}

export default AppDisconnectUser;
