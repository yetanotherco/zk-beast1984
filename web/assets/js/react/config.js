import { http, createConfig } from 'wagmi'
import { anvil, sepolia, mainnet, holesky } from 'wagmi/chains'
import { getDefaultConfig } from "connectkit";


const common_config = {
    walletConnectProjectId: "b2fb11724ae6170bc3e2cf2d6e19ec5a",
    appName: "Zk Arcade",
}

export const ConfigAnvil = createConfig(
    getDefaultConfig({
        chains: [anvil],
        transports: {
            [anvil.id]: http()
        },
        ...common_config
    })
);

export const ConfigSepolia = createConfig(
    getDefaultConfig({
        chains: [sepolia],
        transports: {
            [sepolia.id]: http()
        },
        ...common_config
    })
);

export const ConfigMainnet = createConfig(
    getDefaultConfig({
        chains: [mainnet],
        transports: {
            [mainnet.id]: http()
        },
        ...common_config
    })
);

export const ConfigHolesky = createConfig(
    getDefaultConfig({
        chains: [holesky],
        transports: {
            [holesky.id]: http()
        },
        ...common_config
    })
);
