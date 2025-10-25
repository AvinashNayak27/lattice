import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { createBaseAccountSDK } from "@base-org/account";
import "@rainbow-me/rainbowkit/styles.css";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

const queryClient = new QueryClient();

// Initialize Base Account SDK with Sub Accounts configuration
// This SDK instance will be used throughout the app for Sub Account functionality
export const baseAccountSDK = createBaseAccountSDK({
  appName: "Lattice",
  appLogoUrl: "https://base.org/logo.png",
  appChainIds: [base.id],
  subAccounts: {
    creation: 'on-connect', // Automatically create sub account on connect
    defaultAccount: 'sub',   // Use sub account by default for transactions
  },
  // paymasterUrls: {
  //   [base.id]: 'https://api.developer.coinbase.com/rpc/v1/base/RkKfb6F3mzACMh8N3l4umpfaKIFS91z5'
  // }
});

const config = getDefaultConfig({
  appName: "Lattice",
  projectId: "WALLETCONNECT_PROJECT_ID",
  chains: [base],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
  ssr: false,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
