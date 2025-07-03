import React from "react";
import { useReadContract } from "wagmi";

const UserBalanceFetch = ({ contract_address, user_address }) => {
  const { 
    data: balance,
    isError,
    isLoading,
    error
  } = useReadContract({
    address: contract_address,
    abi: [
      {
        name: "user_balances",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "user_balances",
    args: [user_address],
    chainId: 17000,
  });

  if (isLoading) return <div>Loading user balance...</div>
  if (isError) {
    console.error("Error:", error);
    return <div>Error fetching user balance: {error?.message}</div>
  }

  balance_eth = balance?.toString()/"1000000000000000000"

  return <div>User Balance: {balance_eth} ETH</div>
};

export default UserBalanceFetch;
