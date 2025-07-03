import React from "react";
import Web3EthProvider from "./components/web3-eth-provider";
import SendFundsToContract from "./components/send-funds-batcher";

const AppSendFundsToBatcher = (props) => {
  return (
    <Web3EthProvider network={props.network}>
      <SendFundsToContract contract_address={props.payment_service_address} {...props} />
    </Web3EthProvider>
  )
}

export default AppSendFundsToBatcher;
