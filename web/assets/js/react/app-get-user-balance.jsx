import React from "react";
import Web3EthProvider from "./components/web3-eth-provider";
import UserBalanceFetch from "./components/user-balance-fetch";

const AppGetUserBalance = (props) => {
  return (
    <Web3EthProvider network={props.network}>
      <UserBalanceFetch contract_address={props.payment_service_address} user_address={props.user_address} {...props} />
    </Web3EthProvider>
  )
}

export default AppGetUserBalance;
