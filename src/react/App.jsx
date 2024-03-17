import React from 'react';
import Login from './Login.jsx';
import SignOut from './SignOut.jsx';

import { KitProvider, getKitConnectWallets } from '@0xsequence/kit';
import { getDefaultWaasConnectors } from '@0xsequence/kit-connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { mainnet, polygon, arbitrumSepolia, Chain } from 'wagmi/chains';

const queryClient = new QueryClient();

const chains = [mainnet, arbitrumSepolia];
const projectAccessKey = ENV.projectAccessKey;
const waasConfigKey = ENV.waasConfigKey;
const googleClientId = ENV.googleClientId;
const appleClientId = ENV.appleClientId;

// TODO: update this
const appleRedirectURI = 'http://' + window.location.host
// const appleRedirectURI = 'https://strong-pavlova-dcf6f0.netlify.app'

const metadata = [
  ["Falcon Mark IV Redtail", "A sleek, high-speed interceptor with a gleaming scarlet finish."],
  ["Hawkwind P-22 Emerald", "A nimble, versatile fighter with a striking, metallic emerald green coat."],
  ["Lightning Spectre G6", "A ghostly, agile aircraft with a unique, shimmering silver hue that seems to fade in and out of visibility."],
  ["Raptor Fury X2", "A fast and furious dogfighter with a fiery, vibrant orange livery, striking fear into the hearts of its adversaries."],
  ["Skyraider Z-11 Onyx", "A fearsome, all-black night fighter known for its stealth and power."],
  ["Thunderbolt XR-5 Cobalt", "A robust, heavy fighter painted in a deep, vivid cobalt blue."],
]

function App(props) {
  const connectors = [
    ...getDefaultWaasConnectors({
      walletConnectProjectId: ENV.walletConnectId,
      defaultChainId: 421614,
      waasConfigKey,
      googleClientId,
      appleClientId,
      appleRedirectURI,
      appName: 'demo app',
      projectAccessKey,
      enableConfirmationModal: false,
    }),
    ...getKitConnectWallets(projectAccessKey, []),
  ];

  const transports = {};

  chains.forEach(chain => {
    transports[chain.id] = http();
  });

  const config = createConfig({
    transports,
    connectors,
    chains,
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <KitProvider config={{ defaultTheme: 'light' , signIn: {showEmailInput: false }}}>
          <div id="app">
            <Login scene={props.scene} />
            <SignOut scene={props.scene} />
          </div>
        </KitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
