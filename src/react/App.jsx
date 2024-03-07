import React from "react";
import { useOpenConnectModal } from "@0xsequence/kit";
import { useDisconnect, useAccount } from "wagmi";
import MyPage from "./MyPage.jsx";
import SignOut from "./SignOut.jsx";

import { KitProvider, getKitConnectWallets } from "@0xsequence/kit";
import {
  getDefaultConnectors,
  getDefaultWaasConnectors,
  mock,
} from "@0xsequence/kit-connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet, polygon, Chain } from "wagmi/chains";

const queryClient = new QueryClient();

const chains = [mainnet, polygon];
//   const projectAccessKey = ENV.projectAccessKey

//   const connectors = getDefaultConnectors({
//     walletConnectProjectId: ENV.walletConnectId,
//     defaultChainId: 137,
//     appName: 'demo app',
//     projectAccessKey
//   })

const projectAccessKey = "EeP6AmufRFfigcWaNverI6CAAAAAAAAAA";
const waasConfigKey =
  "eyJwcm9qZWN0SWQiOjIsImVtYWlsUmVnaW9uIjoidXMtZWFzdC0yIiwiZW1haWxDbGllbnRJZCI6IjVncDltaDJmYnFiajhsNnByamdvNzVwMGY2IiwicnBjU2VydmVyIjoiaHR0cHM6Ly9uZXh0LXdhYXMuc2VxdWVuY2UuYXBwIn0=";
const googleClientId =
  "970987756660-35a6tc48hvi8cev9cnknp0iugv9poa23.apps.googleusercontent.com";
const appleClientId = "com.horizon.sequence.waas";
const appleRedirectURI = "https://strong-pavlova-dcf6f0.netlify.app";

const connectors = [
  ...getDefaultWaasConnectors({
    walletConnectProjectId: "c65a6cb1aa83c4e24500130f23a437d8",
    defaultChainId: 137,
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
          <MyPage scene={props.scene} />
          <SignOut scene={props.scene} />
        </KitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

export { config };
