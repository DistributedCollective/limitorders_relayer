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

interface OrderBookMarginLogicInterface extends ethers.utils.Interface {
  functions: {
    "DOMAIN_SEPARATOR()": FunctionFragment;
    "allHashes(uint256,uint256)": FunctionFragment;
    "createOrder((bytes32,uint256,address,uint256,uint256,address,address,uint256,bytes32,uint256,uint256,uint8,bytes32,bytes32))": FunctionFragment;
    "getOrders(address,uint256,uint256)": FunctionFragment;
    "getTrader(bytes32)": FunctionFragment;
    "hashesOfCollateralToken(address,uint256,uint256)": FunctionFragment;
    "hashesOfTrader(address,uint256,uint256)": FunctionFragment;
    "initialize()": FunctionFragment;
    "isOwner()": FunctionFragment;
    "numberOfAllHashes()": FunctionFragment;
    "numberOfHashesOfCollateralToken(address)": FunctionFragment;
    "numberOfHashesOfTrader(address)": FunctionFragment;
    "orderOfHash(bytes32)": FunctionFragment;
    "owner()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "DOMAIN_SEPARATOR",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "allHashes",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "createOrder",
    values: [
      {
        loanId: BytesLike;
        leverageAmount: BigNumberish;
        loanTokenAddress: string;
        loanTokenSent: BigNumberish;
        collateralTokenSent: BigNumberish;
        collateralTokenAddress: string;
        trader: string;
        minEntryPrice: BigNumberish;
        loanDataBytes: BytesLike;
        deadline: BigNumberish;
        createdTimestamp: BigNumberish;
        v: BigNumberish;
        r: BytesLike;
        s: BytesLike;
      }
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getOrders",
    values: [string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getTrader",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "hashesOfCollateralToken",
    values: [string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "hashesOfTrader",
    values: [string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "isOwner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "numberOfAllHashes",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "numberOfHashesOfCollateralToken",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "numberOfHashesOfTrader",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "orderOfHash",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "DOMAIN_SEPARATOR",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "allHashes", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "createOrder",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getOrders", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getTrader", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "hashesOfCollateralToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "hashesOfTrader",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "isOwner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "numberOfAllHashes",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "numberOfHashesOfCollateralToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "numberOfHashesOfTrader",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "orderOfHash",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "MarginOrderCreated(bytes32,tuple)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "MarginOrderCreated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}

export type MarginOrderCreatedEvent = TypedEvent<
  [
    string,
    [
      string,
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      string,
      string,
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      number,
      string,
      string
    ] & {
      loanId: string;
      leverageAmount: BigNumber;
      loanTokenAddress: string;
      loanTokenSent: BigNumber;
      collateralTokenSent: BigNumber;
      collateralTokenAddress: string;
      trader: string;
      minEntryPrice: BigNumber;
      loanDataBytes: string;
      deadline: BigNumber;
      createdTimestamp: BigNumber;
      v: number;
      r: string;
      s: string;
    }
  ] & {
    hash: string;
    order: [
      string,
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      string,
      string,
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      number,
      string,
      string
    ] & {
      loanId: string;
      leverageAmount: BigNumber;
      loanTokenAddress: string;
      loanTokenSent: BigNumber;
      collateralTokenSent: BigNumber;
      collateralTokenAddress: string;
      trader: string;
      minEntryPrice: BigNumber;
      loanDataBytes: string;
      deadline: BigNumber;
      createdTimestamp: BigNumber;
      v: number;
      r: string;
      s: string;
    };
  }
>;

export type OwnershipTransferredEvent = TypedEvent<
  [string, string] & { previousOwner: string; newOwner: string }
>;

export class OrderBookMarginLogic extends BaseContract {
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

  interface: OrderBookMarginLogicInterface;

  functions: {
    DOMAIN_SEPARATOR(overrides?: CallOverrides): Promise<[string]>;

    allHashes(
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    createOrder(
      order: {
        loanId: BytesLike;
        leverageAmount: BigNumberish;
        loanTokenAddress: string;
        loanTokenSent: BigNumberish;
        collateralTokenSent: BigNumberish;
        collateralTokenAddress: string;
        trader: string;
        minEntryPrice: BigNumberish;
        loanDataBytes: BytesLike;
        deadline: BigNumberish;
        createdTimestamp: BigNumberish;
        v: BigNumberish;
        r: BytesLike;
        s: BytesLike;
      },
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getOrders(
      trader: string,
      offset: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        ([
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          string,
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          number,
          string,
          string
        ] & {
          loanId: string;
          leverageAmount: BigNumber;
          loanTokenAddress: string;
          loanTokenSent: BigNumber;
          collateralTokenSent: BigNumber;
          collateralTokenAddress: string;
          trader: string;
          minEntryPrice: BigNumber;
          loanDataBytes: string;
          deadline: BigNumber;
          createdTimestamp: BigNumber;
          v: number;
          r: string;
          s: string;
        })[]
      ] & {
        orders: ([
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          string,
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          number,
          string,
          string
        ] & {
          loanId: string;
          leverageAmount: BigNumber;
          loanTokenAddress: string;
          loanTokenSent: BigNumber;
          collateralTokenSent: BigNumber;
          collateralTokenAddress: string;
          trader: string;
          minEntryPrice: BigNumber;
          loanDataBytes: string;
          deadline: BigNumber;
          createdTimestamp: BigNumber;
          v: number;
          r: string;
          s: string;
        })[];
      }
    >;

    getTrader(
      hash: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string] & { trader: string }>;

    hashesOfCollateralToken(
      collateralToken: string,
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    hashesOfTrader(
      trader: string,
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    /**
     * Replace constructor with initialize function for Upgradable Contracts This function will be called only once by the owner
     */
    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    /**
     * Returns true if the caller is the current owner.
     */
    isOwner(overrides?: CallOverrides): Promise<[boolean]>;

    numberOfAllHashes(overrides?: CallOverrides): Promise<[BigNumber]>;

    numberOfHashesOfCollateralToken(
      collateralToken: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    numberOfHashesOfTrader(
      trader: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    orderOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [
        string,
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        string,
        string,
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        number,
        string,
        string
      ] & {
        loanId: string;
        leverageAmount: BigNumber;
        loanTokenAddress: string;
        loanTokenSent: BigNumber;
        collateralTokenSent: BigNumber;
        collateralTokenAddress: string;
        trader: string;
        minEntryPrice: BigNumber;
        loanDataBytes: string;
        deadline: BigNumber;
        createdTimestamp: BigNumber;
        v: number;
        r: string;
        s: string;
      }
    >;

    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: CallOverrides): Promise<[string]>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  DOMAIN_SEPARATOR(overrides?: CallOverrides): Promise<string>;

  allHashes(
    page: BigNumberish,
    limit: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string[]>;

  createOrder(
    order: {
      loanId: BytesLike;
      leverageAmount: BigNumberish;
      loanTokenAddress: string;
      loanTokenSent: BigNumberish;
      collateralTokenSent: BigNumberish;
      collateralTokenAddress: string;
      trader: string;
      minEntryPrice: BigNumberish;
      loanDataBytes: BytesLike;
      deadline: BigNumberish;
      createdTimestamp: BigNumberish;
      v: BigNumberish;
      r: BytesLike;
      s: BytesLike;
    },
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getOrders(
    trader: string,
    offset: BigNumberish,
    limit: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    ([
      string,
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      string,
      string,
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      number,
      string,
      string
    ] & {
      loanId: string;
      leverageAmount: BigNumber;
      loanTokenAddress: string;
      loanTokenSent: BigNumber;
      collateralTokenSent: BigNumber;
      collateralTokenAddress: string;
      trader: string;
      minEntryPrice: BigNumber;
      loanDataBytes: string;
      deadline: BigNumber;
      createdTimestamp: BigNumber;
      v: number;
      r: string;
      s: string;
    })[]
  >;

  getTrader(hash: BytesLike, overrides?: CallOverrides): Promise<string>;

  hashesOfCollateralToken(
    collateralToken: string,
    page: BigNumberish,
    limit: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string[]>;

  hashesOfTrader(
    trader: string,
    page: BigNumberish,
    limit: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string[]>;

  /**
   * Replace constructor with initialize function for Upgradable Contracts This function will be called only once by the owner
   */
  initialize(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  /**
   * Returns true if the caller is the current owner.
   */
  isOwner(overrides?: CallOverrides): Promise<boolean>;

  numberOfAllHashes(overrides?: CallOverrides): Promise<BigNumber>;

  numberOfHashesOfCollateralToken(
    collateralToken: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  numberOfHashesOfTrader(
    trader: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  orderOfHash(
    arg0: BytesLike,
    overrides?: CallOverrides
  ): Promise<
    [
      string,
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      string,
      string,
      BigNumber,
      string,
      BigNumber,
      BigNumber,
      number,
      string,
      string
    ] & {
      loanId: string;
      leverageAmount: BigNumber;
      loanTokenAddress: string;
      loanTokenSent: BigNumber;
      collateralTokenSent: BigNumber;
      collateralTokenAddress: string;
      trader: string;
      minEntryPrice: BigNumber;
      loanDataBytes: string;
      deadline: BigNumber;
      createdTimestamp: BigNumber;
      v: number;
      r: string;
      s: string;
    }
  >;

  /**
   * Returns the address of the current owner.
   */
  owner(overrides?: CallOverrides): Promise<string>;

  /**
   * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
   */
  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    DOMAIN_SEPARATOR(overrides?: CallOverrides): Promise<string>;

    allHashes(
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string[]>;

    createOrder(
      order: {
        loanId: BytesLike;
        leverageAmount: BigNumberish;
        loanTokenAddress: string;
        loanTokenSent: BigNumberish;
        collateralTokenSent: BigNumberish;
        collateralTokenAddress: string;
        trader: string;
        minEntryPrice: BigNumberish;
        loanDataBytes: BytesLike;
        deadline: BigNumberish;
        createdTimestamp: BigNumberish;
        v: BigNumberish;
        r: BytesLike;
        s: BytesLike;
      },
      overrides?: CallOverrides
    ): Promise<void>;

    getOrders(
      trader: string,
      offset: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      ([
        string,
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        string,
        string,
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        number,
        string,
        string
      ] & {
        loanId: string;
        leverageAmount: BigNumber;
        loanTokenAddress: string;
        loanTokenSent: BigNumber;
        collateralTokenSent: BigNumber;
        collateralTokenAddress: string;
        trader: string;
        minEntryPrice: BigNumber;
        loanDataBytes: string;
        deadline: BigNumber;
        createdTimestamp: BigNumber;
        v: number;
        r: string;
        s: string;
      })[]
    >;

    getTrader(hash: BytesLike, overrides?: CallOverrides): Promise<string>;

    hashesOfCollateralToken(
      collateralToken: string,
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string[]>;

    hashesOfTrader(
      trader: string,
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string[]>;

    /**
     * Replace constructor with initialize function for Upgradable Contracts This function will be called only once by the owner
     */
    initialize(overrides?: CallOverrides): Promise<void>;

    /**
     * Returns true if the caller is the current owner.
     */
    isOwner(overrides?: CallOverrides): Promise<boolean>;

    numberOfAllHashes(overrides?: CallOverrides): Promise<BigNumber>;

    numberOfHashesOfCollateralToken(
      collateralToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    numberOfHashesOfTrader(
      trader: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    orderOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [
        string,
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        string,
        string,
        BigNumber,
        string,
        BigNumber,
        BigNumber,
        number,
        string,
        string
      ] & {
        loanId: string;
        leverageAmount: BigNumber;
        loanTokenAddress: string;
        loanTokenSent: BigNumber;
        collateralTokenSent: BigNumber;
        collateralTokenAddress: string;
        trader: string;
        minEntryPrice: BigNumber;
        loanDataBytes: string;
        deadline: BigNumber;
        createdTimestamp: BigNumber;
        v: number;
        r: string;
        s: string;
      }
    >;

    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: CallOverrides): Promise<string>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "MarginOrderCreated(bytes32,tuple)"(
      hash?: BytesLike | null,
      order?: null
    ): TypedEventFilter<
      [
        string,
        [
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          string,
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          number,
          string,
          string
        ] & {
          loanId: string;
          leverageAmount: BigNumber;
          loanTokenAddress: string;
          loanTokenSent: BigNumber;
          collateralTokenSent: BigNumber;
          collateralTokenAddress: string;
          trader: string;
          minEntryPrice: BigNumber;
          loanDataBytes: string;
          deadline: BigNumber;
          createdTimestamp: BigNumber;
          v: number;
          r: string;
          s: string;
        }
      ],
      {
        hash: string;
        order: [
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          string,
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          number,
          string,
          string
        ] & {
          loanId: string;
          leverageAmount: BigNumber;
          loanTokenAddress: string;
          loanTokenSent: BigNumber;
          collateralTokenSent: BigNumber;
          collateralTokenAddress: string;
          trader: string;
          minEntryPrice: BigNumber;
          loanDataBytes: string;
          deadline: BigNumber;
          createdTimestamp: BigNumber;
          v: number;
          r: string;
          s: string;
        };
      }
    >;

    MarginOrderCreated(
      hash?: BytesLike | null,
      order?: null
    ): TypedEventFilter<
      [
        string,
        [
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          string,
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          number,
          string,
          string
        ] & {
          loanId: string;
          leverageAmount: BigNumber;
          loanTokenAddress: string;
          loanTokenSent: BigNumber;
          collateralTokenSent: BigNumber;
          collateralTokenAddress: string;
          trader: string;
          minEntryPrice: BigNumber;
          loanDataBytes: string;
          deadline: BigNumber;
          createdTimestamp: BigNumber;
          v: number;
          r: string;
          s: string;
        }
      ],
      {
        hash: string;
        order: [
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          string,
          string,
          BigNumber,
          string,
          BigNumber,
          BigNumber,
          number,
          string,
          string
        ] & {
          loanId: string;
          leverageAmount: BigNumber;
          loanTokenAddress: string;
          loanTokenSent: BigNumber;
          collateralTokenSent: BigNumber;
          collateralTokenAddress: string;
          trader: string;
          minEntryPrice: BigNumber;
          loanDataBytes: string;
          deadline: BigNumber;
          createdTimestamp: BigNumber;
          v: number;
          r: string;
          s: string;
        };
      }
    >;

    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;

    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;
  };

  estimateGas: {
    DOMAIN_SEPARATOR(overrides?: CallOverrides): Promise<BigNumber>;

    allHashes(
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    createOrder(
      order: {
        loanId: BytesLike;
        leverageAmount: BigNumberish;
        loanTokenAddress: string;
        loanTokenSent: BigNumberish;
        collateralTokenSent: BigNumberish;
        collateralTokenAddress: string;
        trader: string;
        minEntryPrice: BigNumberish;
        loanDataBytes: BytesLike;
        deadline: BigNumberish;
        createdTimestamp: BigNumberish;
        v: BigNumberish;
        r: BytesLike;
        s: BytesLike;
      },
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getOrders(
      trader: string,
      offset: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getTrader(hash: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    hashesOfCollateralToken(
      collateralToken: string,
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    hashesOfTrader(
      trader: string,
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    /**
     * Replace constructor with initialize function for Upgradable Contracts This function will be called only once by the owner
     */
    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    /**
     * Returns true if the caller is the current owner.
     */
    isOwner(overrides?: CallOverrides): Promise<BigNumber>;

    numberOfAllHashes(overrides?: CallOverrides): Promise<BigNumber>;

    numberOfHashesOfCollateralToken(
      collateralToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    numberOfHashesOfTrader(
      trader: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    orderOfHash(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: CallOverrides): Promise<BigNumber>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    DOMAIN_SEPARATOR(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    allHashes(
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    createOrder(
      order: {
        loanId: BytesLike;
        leverageAmount: BigNumberish;
        loanTokenAddress: string;
        loanTokenSent: BigNumberish;
        collateralTokenSent: BigNumberish;
        collateralTokenAddress: string;
        trader: string;
        minEntryPrice: BigNumberish;
        loanDataBytes: BytesLike;
        deadline: BigNumberish;
        createdTimestamp: BigNumberish;
        v: BigNumberish;
        r: BytesLike;
        s: BytesLike;
      },
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getOrders(
      trader: string,
      offset: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getTrader(
      hash: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    hashesOfCollateralToken(
      collateralToken: string,
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    hashesOfTrader(
      trader: string,
      page: BigNumberish,
      limit: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    /**
     * Replace constructor with initialize function for Upgradable Contracts This function will be called only once by the owner
     */
    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    /**
     * Returns true if the caller is the current owner.
     */
    isOwner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    numberOfAllHashes(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    numberOfHashesOfCollateralToken(
      collateralToken: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    numberOfHashesOfTrader(
      trader: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    orderOfHash(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    /**
     * Returns the address of the current owner.
     */
    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
