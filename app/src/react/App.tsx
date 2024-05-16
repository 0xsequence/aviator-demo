import React from 'react';
import Login from './Login';
import SignOut from './SignOut';

import { KitProvider, getKitConnectWallets } from '@0xsequence/kit';
import { getDefaultWaasConnectors } from '@0xsequence/kit-connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { mainnet, polygon, arbitrumSepolia, Chain } from 'wagmi/chains';

const queryClient = new QueryClient();
const chains = [mainnet, arbitrumSepolia];
const projectAccessKey = process.env.PROJECT_ACCESS_KEY_PROD!;
const waasConfigKey = process.env.WAAS_CONFIG_KEY!;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const appleClientId = process.env.APPLE_CLIENT_ID;

// TODO: update this
const appleRedirectURI =
  'https://' + window.location.host + '/waas-airplane-demo';

function App(props: any) {
  const connectors = [
    ...getDefaultWaasConnectors({
      walletConnectProjectId: process.env.WALLET_CONNECT_ID!,
      defaultChainId: arbitrumSepolia.id,
      waasConfigKey,
      googleClientId,
      appleClientId,
      appleRedirectURI,
      appName: 'Aviator Demo',
      projectAccessKey,
      enableConfirmationModal: false,
    })
  ];

  const transports: any = {};

  chains.forEach(chain => {
    transports[chain.id] = http();
  });

  const config = createConfig({
    transports,
    connectors,
    //@ts-ignore
    chains,
  });

  return (
    <WagmiProvider config={config}>
        <KitProvider
          config={{ projectAccessKey, defaultTheme: 'light', signIn: { showEmailInput: false } }}
        >
          <QueryClientProvider client={queryClient}>
              <div id="app">
                <Login scene={props.scene} />
                <SignOut scene={props.scene} />
              </div>
          </QueryClientProvider>
        </KitProvider>
    </WagmiProvider>
  );
}

export default App;
