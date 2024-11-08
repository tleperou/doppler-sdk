import { getContract, Address, PublicClient } from 'viem'
import { DopplerABI } from './abis/DopplerABI'
import { AirlockABI } from './abis/AirlockABI'
import { AddressProvider } from './AddressProvider'
import { Clients } from './DopplerSDK'

export class ContractManager {
  private readonly clients: Clients 
  private readonly addresses: AddressProvider

  constructor(clients: Clients, addresses: AddressProvider) {
    this.clients = clients
    this.addresses = addresses
  }

  dopplerAt(address: Address) {
    return getContract({
      address,
      abi: DopplerABI,
      client: this.clients.public
    })
  }

  airlock() {
    return getContract({
      address: this.addresses.getAddresses().airlock,
      abi: AirlockABI,
      client: this.clients
    })
  }
}