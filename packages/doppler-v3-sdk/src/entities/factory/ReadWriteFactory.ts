import {
  ReadWriteContract,
  ReadWriteAdapter,
  Drift,
  ContractWriteOptions,
  OnMinedParam,
} from '@delvtech/drift';
import { ReadFactory, AirlockABI } from './ReadFactory';
import { Address, encodeAbiParameters, Hex, parseEther } from 'viem';

const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

const DEFAULT_START_TICK = 167520;
const DEFAULT_END_TICK = 200040;
const DEFAULT_NUM_POSITIONS = 10;
const DEFAULT_FEE = 3000; // 0.3% fee tier

const DEFAULT_VESTING_DURATION = BigInt(ONE_YEAR_IN_SECONDS);
const DEFAULT_INITIAL_SUPPLY_INT = 1_000_000_000;
const DEFAULT_NUM_TOKENS_TO_SELL_INT = 900_000_000;
const DEFAULT_YEARLY_MINT_CAP_INT = 100_000_000;
const DEFAULT_PRE_MINT_INT = 9_000_000; // 0.9% of the total supply

// Leave these as strings so that we know they are less than 1
// note: must satisfy maxShareToBeSold + maxShareToBond <= 1
const DEFAULT_MAX_SHARE_TO_BE_SOLD = '0.2';
const DEFAULT_MAX_SHARE_TO_BE_BOND = '0.5';

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

export interface SaleConfig {
  initialSupply: bigint;
  numTokensToSell: bigint;
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
  v3Initializer: Address;
  liquidityMigrator: Address;
}

export interface CreateV3PoolParams {
  integrator: Address;
  userAddress: Address; // used to generate salt
  numeraire: Address;
  contracts: InitializerContractDependencies;
  tokenConfig: TokenConfig;
  saleConfig: SaleConfig | 'default';
  v3PoolConfig: V3PoolConfig | 'default';
  vestingConfig: VestingConfig | 'default';
}

export interface SimulateCreateResult {
  asset: Hex;
  pool: Hex;
  governance: Hex;
  timelock: Hex;
  migrationPool: Hex;
}

export interface DefaultConfigs {
  defaultV3PoolConfig?: V3PoolConfig;
  defaultVestingConfig?: VestingConfig;
  defaultSaleConfig?: SaleConfig;
}

export class ReadWriteFactory extends ReadFactory {
  declare airlock: ReadWriteContract<AirlockABI>;
  declare defaultV3PoolConfig: V3PoolConfig;
  declare defaultVestingConfig: VestingConfig;
  declare defaultSaleConfig: SaleConfig;

  constructor(
    address: Address,
    drift: Drift<ReadWriteAdapter>,
    defaultConfigs?: DefaultConfigs
  ) {
    super(address, drift);

    this.defaultV3PoolConfig = defaultConfigs?.defaultV3PoolConfig ?? {
      startTick: DEFAULT_START_TICK,
      endTick: DEFAULT_END_TICK,
      numPositions: DEFAULT_NUM_POSITIONS,
      maxShareToBeSold: parseEther(DEFAULT_MAX_SHARE_TO_BE_SOLD),
      maxShareToBond: parseEther(DEFAULT_MAX_SHARE_TO_BE_BOND),
      fee: DEFAULT_FEE,
    };

    this.defaultVestingConfig = defaultConfigs?.defaultVestingConfig ?? {
      yearlyMintCap: parseEther(DEFAULT_YEARLY_MINT_CAP_INT.toString()),
      vestingDuration: DEFAULT_VESTING_DURATION,
      recipients: [],
      amounts: [],
    };

    this.defaultSaleConfig = defaultConfigs?.defaultSaleConfig ?? {
      initialSupply: parseEther(DEFAULT_INITIAL_SUPPLY_INT.toString()),
      numTokensToSell: parseEther(DEFAULT_NUM_TOKENS_TO_SELL_INT.toString()),
    };
  }

  private resolveConfig<T extends object>(
    config: T | 'default',
    defaults: T
  ): T {
    if (config === 'default') {
      return { ...defaults };
    }
    return { ...config };
  }

  private resolveVestingConfig(
    config: VestingConfig | 'default',
    userAddress: Address
  ): VestingConfig {
    const base = config === 'default' ? this.defaultVestingConfig : config;

    return {
      ...base,
      recipients: config === 'default' ? [userAddress] : [...base.recipients],
      amounts:
        config === 'default'
          ? [parseEther(DEFAULT_PRE_MINT_INT.toString())]
          : [...base.amounts],
    };
  }

  private generateRandomSalt = (account: Address) => {
    const array = new Uint8Array(32);

    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      array.set(require('crypto').randomBytes(32));
    }

    if (account) {
      const addressBytes = account.slice(2).padStart(40, '0');
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

  private encodePoolInitializerData(v3PoolConfig: V3PoolConfig): Hex {
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

  private encodeTokenFactoryData(
    tokenConfig: TokenConfig,
    vestingConfig: VestingConfig
  ): Hex {
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

  private encodeGovernanceFactoryData(tokenConfig: TokenConfig): Hex {
    return encodeAbiParameters([{ type: 'string' }], [tokenConfig.name]);
  }

  private encode(params: CreateV3PoolParams): {
    createParams: CreateParams;
    v3PoolConfig: V3PoolConfig;
  } {
    const { userAddress, numeraire, integrator, contracts, tokenConfig } =
      params;

    if (!userAddress) {
      throw new Error('User address is required. Is a wallet connected?');
    }

    const vestingConfig = this.resolveVestingConfig(
      params.vestingConfig,
      userAddress
    );

    const v3PoolConfig = this.resolveConfig(
      params.v3PoolConfig,
      this.defaultV3PoolConfig
    );

    const saleConfig = this.resolveConfig(
      params.saleConfig,
      this.defaultSaleConfig
    );

    if (v3PoolConfig.startTick > v3PoolConfig.endTick) {
      throw new Error(
        'Invalid start and end ticks. Start tick must be less than end tick.'
      );
    }

    const salt = this.generateRandomSalt(userAddress) as Hex;
    const governanceFactoryData = this.encodeGovernanceFactoryData(tokenConfig);
    const tokenFactoryData = this.encodeTokenFactoryData(
      tokenConfig,
      vestingConfig
    );
    const poolInitializerData = this.encodePoolInitializerData(v3PoolConfig);
    const liquidityMigratorData = '0x' as Hex;

    const {
      tokenFactory,
      governanceFactory,
      v3Initializer: poolInitializer,
      liquidityMigrator,
    } = contracts;

    const { initialSupply, numTokensToSell } = saleConfig;

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

    return {
      createParams: args,
      v3PoolConfig,
    };
  }

  public async encodeCreateData(
    params: CreateV3PoolParams
  ): Promise<CreateParams> {
    const { createParams, v3PoolConfig } = this.encode(params);
    const { asset } = await this.simulateCreate(createParams);
    const isToken0 = Number(asset) < Number(params.numeraire);

    let createParamsCopy = { ...createParams };
    if (isToken0) {
      // invert the ticks
      v3PoolConfig.startTick = -v3PoolConfig.startTick;
      v3PoolConfig.endTick = -v3PoolConfig.endTick;
      createParamsCopy = {
        ...createParamsCopy,
        poolInitializerData: this.encodePoolInitializerData(v3PoolConfig),
      };
    }

    return createParamsCopy;
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

  public updateDefaultConfigs(configs: DefaultConfigs) {
    this.defaultV3PoolConfig =
      configs.defaultV3PoolConfig ?? this.defaultV3PoolConfig;
    this.defaultVestingConfig =
      configs.defaultVestingConfig ?? this.defaultVestingConfig;
    this.defaultSaleConfig =
      configs.defaultSaleConfig ?? this.defaultSaleConfig;
  }
}
