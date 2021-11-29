/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface SettlementProxyInterface extends ethers.utils.Interface {
  functions: {
    "DOMAIN_SEPARATOR1()": FunctionFragment;
    "DOMAIN_SEPARATOR2()": FunctionFragment;
    "RBTC_ADDRESS()": FunctionFragment;
    "WRBTC_ADDRESS()": FunctionFragment;
    "balanceOf(address)": FunctionFragment;
    "canceledOfHash(bytes32)": FunctionFragment;
    "filledAmountInOfHash(bytes32)": FunctionFragment;
    "getImplementation()": FunctionFragment;
    "getProxyOwner()": FunctionFragment;
    "isOwner()": FunctionFragment;
    "minFee()": FunctionFragment;
    "orderBookAddress()": FunctionFragment;
    "orderBookMarginAddress()": FunctionFragment;
    "owner()": FunctionFragment;
    "relayerFeePercent()": FunctionFragment;
    "setImplementation(address)": FunctionFragment;
    "setProxyOwner(address)": FunctionFragment;
    "sovrynSwapNetwork()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "DOMAIN_SEPARATOR1",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "DOMAIN_SEPARATOR2",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "RBTC_ADDRESS",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "WRBTC_ADDRESS",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "balanceOf", values: [string]): string;
  encodeFunctionData(
    functionFragment: "canceledOfHash",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "filledAmountInOfHash",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getImplementation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getProxyOwner",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "isOwner", values?: undefined): string;
  encodeFunctionData(functionFragment: "minFee", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "orderBookAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "orderBookMarginAddress",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "relayerFeePercent",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setImplementation",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "setProxyOwner",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "sovrynSwapNetwork",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "DOMAIN_SEPARATOR1",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "DOMAIN_SEPARATOR2",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "RBTC_ADDRESS",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "WRBTC_ADDRESS",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "canceledOfHash",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "filledAmountInOfHash",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getProxyOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "isOwner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "minFee", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "orderBookAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "orderBookMarginAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "relayerFeePercent",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setProxyOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "sovrynSwapNetwork",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "ImplementationChanged(address,address)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "ImplementationChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}

export type ImplementationChangedEvent = TypedEvent<
  [string, string] & { _oldImplementation: string; _newImplementation: string }
>;

export type OwnershipTransferredEvent = TypedEvent<
  [string, string] & { _oldOwner: string; _newOwner: string }
>;

export class SettlementProxy extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: SettlementProxyInterface;

  functions: {
    DOMAIN_SEPARATOR1(overrides?: CallOverrides): Promise<[string]>;

    DOMAIN_SEPARATOR2(overrides?: CallOverrides): Promise<[string]>;

    RBTC_ADDRESS(overrides?: CallOverrides): Promise<[string]>;

    WRBTC_ADDRESS(overrides?: CallOverrides): Promise<[string]>;

    balanceOf(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;

    canceledOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    filledAmountInOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    /**
     * Return address of the implementation.
     */
    getImplementation(
      overrides?: CallOverrides
    ): Promise<[string] & { _implementation: string }>;

    /**
     * Return address of the owner.
     */
    getProxyOwner(
      overrides?: CallOverrides
    ): Promise<[string] & { _owner: string }>;

    /**
     * Returns true if the caller is the current owner.
     */
    isOwner(overrides?: CallOverrides): Promise<[boolean]>;

    minFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    orderBookAddress(overrides?: CallOverrides): Promise<[string]>;

    orderBookMarginAddress(overrides?: CallOverrides): Promise<[string]>;

    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: CallOverrides): Promise<[string]>;

    relayerFeePercent(overrides?: CallOverrides): Promise<[BigNumber]>;

    /**
     * Wrapper for _setImplementation that exposes the function as public for owner to be able to set a new version of the contract as current pointing implementation.
     * Set address of the implementation.
     * @param _implementation Address of the implementation.
     */
    setImplementation(
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    /**
     * Set address of the owner.
     * @param _owner Address of the owner.
     */
    setProxyOwner(
      _owner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    sovrynSwapNetwork(overrides?: CallOverrides): Promise<[string]>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  DOMAIN_SEPARATOR1(overrides?: CallOverrides): Promise<string>;

  DOMAIN_SEPARATOR2(overrides?: CallOverrides): Promise<string>;

  RBTC_ADDRESS(overrides?: CallOverrides): Promise<string>;

  WRBTC_ADDRESS(overrides?: CallOverrides): Promise<string>;

  balanceOf(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

  canceledOfHash(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

  filledAmountInOfHash(
    arg0: BytesLike,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  /**
   * Return address of the implementation.
   */
  getImplementation(overrides?: CallOverrides): Promise<string>;

  /**
   * Return address of the owner.
   */
  getProxyOwner(overrides?: CallOverrides): Promise<string>;

  /**
   * Returns true if the caller is the current owner.
   */
  isOwner(overrides?: CallOverrides): Promise<boolean>;

  minFee(overrides?: CallOverrides): Promise<BigNumber>;

  orderBookAddress(overrides?: CallOverrides): Promise<string>;

  orderBookMarginAddress(overrides?: CallOverrides): Promise<string>;

  /**
   * Returns the address of the current owner.
   */
  owner(overrides?: CallOverrides): Promise<string>;

  relayerFeePercent(overrides?: CallOverrides): Promise<BigNumber>;

  /**
   * Wrapper for _setImplementation that exposes the function as public for owner to be able to set a new version of the contract as current pointing implementation.
   * Set address of the implementation.
   * @param _implementation Address of the implementation.
   */
  setImplementation(
    _implementation: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  /**
   * Set address of the owner.
   * @param _owner Address of the owner.
   */
  setProxyOwner(
    _owner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  sovrynSwapNetwork(overrides?: CallOverrides): Promise<string>;

  /**
   * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
   */
  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    DOMAIN_SEPARATOR1(overrides?: CallOverrides): Promise<string>;

    DOMAIN_SEPARATOR2(overrides?: CallOverrides): Promise<string>;

    RBTC_ADDRESS(overrides?: CallOverrides): Promise<string>;

    WRBTC_ADDRESS(overrides?: CallOverrides): Promise<string>;

    balanceOf(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    canceledOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    filledAmountInOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    /**
     * Return address of the implementation.
     */
    getImplementation(overrides?: CallOverrides): Promise<string>;

    /**
     * Return address of the owner.
     */
    getProxyOwner(overrides?: CallOverrides): Promise<string>;

    /**
     * Returns true if the caller is the current owner.
     */
    isOwner(overrides?: CallOverrides): Promise<boolean>;

    minFee(overrides?: CallOverrides): Promise<BigNumber>;

    orderBookAddress(overrides?: CallOverrides): Promise<string>;

    orderBookMarginAddress(overrides?: CallOverrides): Promise<string>;

    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: CallOverrides): Promise<string>;

    relayerFeePercent(overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Wrapper for _setImplementation that exposes the function as public for owner to be able to set a new version of the contract as current pointing implementation.
     * Set address of the implementation.
     * @param _implementation Address of the implementation.
     */
    setImplementation(
      _implementation: string,
      overrides?: CallOverrides
    ): Promise<void>;

    /**
     * Set address of the owner.
     * @param _owner Address of the owner.
     */
    setProxyOwner(_owner: string, overrides?: CallOverrides): Promise<void>;

    sovrynSwapNetwork(overrides?: CallOverrides): Promise<string>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "ImplementationChanged(address,address)"(
      _oldImplementation?: string | null,
      _newImplementation?: string | null
    ): TypedEventFilter<
      [string, string],
      { _oldImplementation: string; _newImplementation: string }
    >;

    ImplementationChanged(
      _oldImplementation?: string | null,
      _newImplementation?: string | null
    ): TypedEventFilter<
      [string, string],
      { _oldImplementation: string; _newImplementation: string }
    >;

    "OwnershipTransferred(address,address)"(
      _oldOwner?: string | null,
      _newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { _oldOwner: string; _newOwner: string }
    >;

    OwnershipTransferred(
      _oldOwner?: string | null,
      _newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { _oldOwner: string; _newOwner: string }
    >;
  };

  estimateGas: {
    DOMAIN_SEPARATOR1(overrides?: CallOverrides): Promise<BigNumber>;

    DOMAIN_SEPARATOR2(overrides?: CallOverrides): Promise<BigNumber>;

    RBTC_ADDRESS(overrides?: CallOverrides): Promise<BigNumber>;

    WRBTC_ADDRESS(overrides?: CallOverrides): Promise<BigNumber>;

    balanceOf(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    canceledOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    filledAmountInOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    /**
     * Return address of the implementation.
     */
    getImplementation(overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Return address of the owner.
     */
    getProxyOwner(overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Returns true if the caller is the current owner.
     */
    isOwner(overrides?: CallOverrides): Promise<BigNumber>;

    minFee(overrides?: CallOverrides): Promise<BigNumber>;

    orderBookAddress(overrides?: CallOverrides): Promise<BigNumber>;

    orderBookMarginAddress(overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: CallOverrides): Promise<BigNumber>;

    relayerFeePercent(overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Wrapper for _setImplementation that exposes the function as public for owner to be able to set a new version of the contract as current pointing implementation.
     * Set address of the implementation.
     * @param _implementation Address of the implementation.
     */
    setImplementation(
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    /**
     * Set address of the owner.
     * @param _owner Address of the owner.
     */
    setProxyOwner(
      _owner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    sovrynSwapNetwork(overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    DOMAIN_SEPARATOR1(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    DOMAIN_SEPARATOR2(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    RBTC_ADDRESS(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    WRBTC_ADDRESS(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    balanceOf(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    canceledOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    filledAmountInOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    /**
     * Return address of the implementation.
     */
    getImplementation(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * Return address of the owner.
     */
    getProxyOwner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * Returns true if the caller is the current owner.
     */
    isOwner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    minFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    orderBookAddress(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    orderBookMarginAddress(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    relayerFeePercent(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * Wrapper for _setImplementation that exposes the function as public for owner to be able to set a new version of the contract as current pointing implementation.
     * Set address of the implementation.
     * @param _implementation Address of the implementation.
     */
    setImplementation(
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    /**
     * Set address of the owner.
     * @param _owner Address of the owner.
     */
    setProxyOwner(
      _owner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    sovrynSwapNetwork(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
