export class Position {
  public readonly tickLower: number
  public readonly tickUpper: number
  public readonly liquidity: bigint 
  public readonly salt: number
  public readonly type: 'lowerSlug' | 'upperSlug' | `pdSlug${number}`
  
  constructor(tickLower: number, tickUpper: number, liquidity: bigint, salt: number, type: 'lowerSlug' | 'upperSlug' | `pdSlug${number}`) {
    this.tickLower = tickLower
    this.tickUpper = tickUpper
    this.liquidity = liquidity
    this.salt = salt
    this.type = type
  }

  public static fromRaw(raw: any): Position {
    let type: 'lowerSlug' | 'upperSlug' | `pdSlug${number}`
    if (raw.salt == 1) type = 'lowerSlug'
    else if (raw.salt == 2) type = 'upperSlug'
    else type = `pdSlug${raw.salt}`

    return new Position(raw.tickLower, raw.tickUpper, raw.liquidity, raw.salt, type)
  }
}
