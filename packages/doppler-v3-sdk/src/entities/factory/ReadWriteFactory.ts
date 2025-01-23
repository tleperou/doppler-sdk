import {
  ReadWriteContract,
  ReadWriteAdapter,
  Drift,
  ContractWriteOptions,
  OnMinedParam,
} from '@delvtech/drift';
import { ReadFactory, AirlockABI } from './ReadFactory';
import { Address, encodeAbiParameters, Hex, parseEther } from 'viem';

export interface CreateParams {
  initialSupply: bigint;
  numTokensToSell: bigint;
  numeraire: Address;
  tokenFactory: Address;
  tokenFactoryData: Hex;
  governanceFactory: Address;
  governanceFactoryData: Hex;
  poolInitializer: Address;
  poolInitializerData: Hex;
  liquidityMigrator: Address;
  liquidityMigratorData: Hex;
  integrator: Address;
  salt: Hex;
}

export interface V3PoolConfig {
  startTick: number;
  endTick: number;
  numPositions: number;
  maxShareToBeSold: bigint;
  maxShareToBond: bigint;
  fee: number;
}

export interface VestingConfig {
  yearlyMintCap: bigint;
  vestingDuration: bigint;
  recipients: Address[];
  amounts: bigint[];
}

export interface TokenConfig {
  name: string;
  symbol: string;
  tokenURI: string;
}

export interface InitializerContractDependencies {
  tokenFactory: Address;
  governanceFactory: Address;
  poolInitializer: Address;
  liquidityMigrator: Address;
}

export const defaultV3PoolConfig: V3PoolConfig = {
  startTick: 167520,
  endTick: 200040,
  numPositions: 10,
  maxShareToBeSold: parseEther('0.2'),
  maxShareToBond: parseEther('0.5'),
  fee: 3000,
};

export const defaultVestingConfig: VestingConfig = {
  yearlyMintCap: parseEther('100000000'),
  vestingDuration: BigInt(365 * 24 * 60 * 60), // 1 year
  recipients: [],
  amounts: [],
};

export interface CreateV3PoolParams {
  userAddress: Address; // used to generate salt
  numeraire: Address;
  contracts: InitializerContractDependencies;
  initialSupply: bigint;
  numTokensToSell: bigint;
  tokenConfig: TokenConfig;
  v3PoolConfig?: V3PoolConfig;
  vestingConfig?: VestingConfig;
  integrator: Address;
}

export interface SimulateCreateResult {
  asset: Hex;
  pool: Hex;
  governance: Hex;
  timelock: Hex;
  migrationPool: Hex;
}

interface DefaultConfigOptions {
  useDefaultVesting: boolean;
  useDefaultV3PoolConfig: boolean;
}

export class ReadWriteFactory extends ReadFactory {
  declare airlock: ReadWriteContract<AirlockABI>;

  constructor(address: Address, drift: Drift<ReadWriteAdapter>) {
    super(address, drift);
  }

  private generateRandomSalt = (account: Address) => {
    const array = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    // XOR addr with the random bytes
    if (account) {
      const addressBytes = account.slice(2).padStart(40, '0');
      // XOR first 20 bytes with the address
      for (let i = 0; i < 20; i++) {
        const addressByte = parseInt(
          addressBytes.slice(i * 2, (i + 1) * 2),
          16
        );
        array[i] ^= addressByte;
      }
    }
    return `0x${Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
  };

  private encodePoolInitializerData(config: CreateV3PoolParams): Hex {
    const { v3PoolConfig } = config;

    if (!v3PoolConfig) {
      throw new Error('V3 pool config is undefined');
    }
    return encodeAbiParameters(
      [
        { type: 'uint24' },
        { type: 'int24' },
        { type: 'int24' },
        { type: 'uint16' },
        { type: 'uint256' },
        { type: 'uint256' },
      ],
      [
        v3PoolConfig.fee,
        v3PoolConfig.startTick,
        v3PoolConfig.endTick,
        v3PoolConfig.numPositions,
        v3PoolConfig.maxShareToBeSold,
        v3PoolConfig.maxShareToBond,
      ]
    );
  }

  private encodeTokenFactoryData(config: CreateV3PoolParams): Hex {
    const { tokenConfig, vestingConfig } = config;

    if (!vestingConfig) {
      throw new Error('Vesting config is undefined');
    }

    return encodeAbiParameters(
      [
        { type: 'string' },
        { type: 'string' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'address[]' },
        { type: 'uint256[]' },
        { type: 'string' },
      ],
      [
        tokenConfig.name,
        tokenConfig.symbol,
        vestingConfig.yearlyMintCap,
        vestingConfig.vestingDuration,
        vestingConfig.recipients,
        vestingConfig.amounts,
        tokenConfig.tokenURI,
      ]
    );
  }

  private encodeGovernanceFactoryData(config: CreateV3PoolParams): Hex {
    const { tokenConfig } = config;
    return encodeAbiParameters([{ type: 'string' }], [tokenConfig.name]);
  }

  private encode(
    params: CreateV3PoolParams,
    options?: DefaultConfigOptions
  ): CreateParams {
    const {
      userAddress,
      initialSupply,
      numTokensToSell,
      numeraire,
      integrator,
      contracts,
    } = params;

    if (!userAddress) {
      throw new Error('User address is required. Is a wallet connected?');
    }

    if (options?.useDefaultV3PoolConfig || !params?.v3PoolConfig) {
      params.v3PoolConfig = defaultV3PoolConfig;
    }

    if (options?.useDefaultVesting || !params?.vestingConfig) {
      params.vestingConfig = defaultVestingConfig;
      params.vestingConfig.recipients = [userAddress];
      params.vestingConfig.amounts = [params.vestingConfig.yearlyMintCap];
    }

    if (
      params?.v3PoolConfig?.startTick < 0 ||
      params?.v3PoolConfig?.endTick < 0 ||
      params?.v3PoolConfig?.startTick > params?.v3PoolConfig?.endTick
    ) {
      throw new Error('Invalid pool configuration');
    }

    const salt = this.generateRandomSalt(userAddress) as Hex;
    const governanceFactoryData = this.encodeGovernanceFactoryData(params);
    const tokenFactoryData = this.encodeTokenFactoryData(params);
    const poolInitializerData = this.encodePoolInitializerData(params);
    const liquidityMigratorData = '0x' as Hex;

    const {
      tokenFactory,
      governanceFactory,
      poolInitializer,
      liquidityMigrator,
    } = contracts;

    const args: CreateParams = {
      initialSupply,
      numTokensToSell,
      numeraire,
      tokenFactory,
      tokenFactoryData,
      governanceFactory,
      governanceFactoryData,
      poolInitializer,
      poolInitializerData,
      liquidityMigrator,
      liquidityMigratorData,
      integrator,
      salt,
    };

    return args;
  }

  public async encodeCreateData(
    params: CreateV3PoolParams
  ): Promise<CreateParams> {
    if (!params.v3PoolConfig) {
      throw new Error('V3 pool config is undefined');
    }

    const createData = this.encode(params);
    const { asset } = await this.simulateCreate(createData);
    const isToken0 = Number(asset) < Number(params.numeraire);

    if (isToken0) {
      // invert the ticks
      params.v3PoolConfig.startTick = -params.v3PoolConfig.startTick;
      params.v3PoolConfig.endTick = -params.v3PoolConfig.endTick;
      createData.poolInitializerData = this.encodePoolInitializerData(params);
    }

    return createData;
  }

  public async create(
    params: CreateParams,
    options?: ContractWriteOptions & OnMinedParam
  ): Promise<Hex> {
    return this.airlock.write('create', { createData: params }, options);
  }

  public async simulateCreate(
    params: CreateParams
  ): Promise<SimulateCreateResult> {
    return this.airlock.simulateWrite('create', { createData: params });
  }
}
