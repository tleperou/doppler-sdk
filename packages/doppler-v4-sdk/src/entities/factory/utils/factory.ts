import { encodeAbiParameters, Hex } from 'viem';
import { TokenConfig, VestingConfig } from '../types';

export const encodeTokenFactoryData = (
    tokenConfig: TokenConfig,
    vestingConfig: VestingConfig
): Hex => {
    return encodeAbiParameters(
        [
            { type: "string" },
            { type: "string" },
            { type: "uint256" },
            { type: "uint256" },
            { type: "address[]" },
            { type: "uint256[]" },
            { type: "string" },
        ],
        [
            tokenConfig.name,
            tokenConfig.symbol,
            vestingConfig.yearlyMintRate,
            vestingConfig.vestingDuration,
            vestingConfig.recipients,
            vestingConfig.amounts,
            tokenConfig.tokenURI,
        ]
    );
}