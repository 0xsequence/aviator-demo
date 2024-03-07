import React from "react";
import { useOpenConnectModal } from "@0xsequence/kit";
import { useDisconnect, useAccount } from "wagmi";
import Login from "./Login.jsx";
import SignOut from "./SignOut.jsx";

import { KitProvider, getKitConnectWallets } from "@0xsequence/kit";
import {
  getDefaultConnectors,
  getDefaultWaasConnectors,
  mock,
} from "@0xsequence/kit-connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet, polygon, arbitrumSepolia, Chain } from "wagmi/chains";

const queryClient = new QueryClient();

const chains = [mainnet, arbitrumSepolia];
const projectAccessKey = ENV.projectAccessKey
const waasConfigKey = ENV.waasConfigKey
const googleClientId = ENV.googleClientId
const appleClientId = ENV.appleClientId
const appleRedirectURI = "https://strong-pavlova-dcf6f0.netlify.app";

const connectors = [
  ...getDefaultWaasConnectors({
    walletConnectProjectId: ENV.walletConnectId,
    defaultChainId: 421614,
    waasConfigKey,
    googleClientId,
    appleClientId,
    appleRedirectURI,
    appName: "demo app",
    projectAccessKey,
    enableConfirmationModal: true,
  }),
  ...getKitConnectWallets(projectAccessKey, []),
];

const transports = {};

chains.forEach((chain) => {
  transports[chain.id] = http();
});

const config = createConfig({
  transports,
  connectors,
  chains,
});

function App(props) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <KitProvider config={{ defaultTheme: "light" }}>
          <Login scene={props.scene} />
          <SignOut scene={props.scene} />
        </KitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

export { config };