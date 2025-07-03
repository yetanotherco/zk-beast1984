import React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { ConfigAnvil, ConfigSepolia, ConfigMainnet, ConfigHolesky } from "../config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Disable retries
      refetchOnWindowFocus: false, // Disable refetching on tab focus
    },
  },
});

const configSelector = (config_name) => {
  switch (config_name) {
    case "anvil":
      return ConfigAnvil;
    case "sepolia":
      return ConfigSepolia;
    case "mainnet":
      return ConfigMainnet;
    case "holesky":
      return ConfigHolesky;
    default:
      return ConfigAnvil;
  }
}

const Web3EthProvider = ({ children, network }) => {
  return (
    <>
      <WagmiProvider config={configSelector(network)}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider theme="minimal">
            {children}
          </ConnectKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}

export default Web3EthProvider;
