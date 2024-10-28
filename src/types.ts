export interface CommonParams {
  /**
   * The pool manager address
   */
  poolManager: string,
  /**
   * TODO: add description
   */
  startingTime: bigint,
  endingTime: bigint,
  minimumProceeds: bigint,
  maximumProceeds: bigint,
  startingTick: number,
  endingTick: number,
  epochLength: bigint,
  gamma: number,
  isToken0: boolean,
}

export interface TokenParams {
  name: string,
  symbol: string,
  // initialSupply: bigint,
}

export interface DopplerSaltPredictionParams extends CommonParams {
  initialSupply: bigint,
}

export interface DopplerCreateParams extends DopplerSaltPredictionParams {
  salt: bigint,
}

export interface AirlockParams extends TokenParams, DopplerCreateParams {
  numeraire: string,
  owner: string,
  tokenFactory: string,
  tokenData: string,
  governanceFactory: string,
  governanceData: string,
  hookFactory: string,
  hookData: string,
  recipients: string[],
  amounts: bigint[],
}
