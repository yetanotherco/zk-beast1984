import React from "react";
import Web3EthProvider from "./components/web3-eth-provider";
import SubmitProofToBatcher from "./components/send-proof-batcher";

const AppSubmitProofToBatcher = (props) => {
  return (
    <Web3EthProvider network={props.network}>
      <SubmitProofToBatcher {...props} />
    </Web3EthProvider>
  )
}

export default AppSubmitProofToBatcher;
