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
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface TestSovrynSwapInterface extends ethers.utils.Interface {
  functions: {
    "addressOf(bytes32)": FunctionFragment;
    "conversionPath(address,address)": FunctionFragment;
    "convertByPath(address[],uint256,uint256,address,address,uint256)": FunctionFragment;
    "priceFeeds()": FunctionFragment;
    "rateByPath(address[],uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "addressOf",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "conversionPath",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "convertByPath",
    values: [string[], BigNumberish, BigNumberish, string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "priceFeeds",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "rateByPath",
    values: [string[], BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "addressOf", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "conversionPath",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "convertByPath",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "priceFeeds", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "rateByPath", data: BytesLike): Result;

  events: {};
}

export class TestSovrynSwap extends BaseContract {
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

  interface: TestSovrynSwapInterface;

  functions: {
    addressOf(
      contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    conversionPath(
      _sourceToken: string,
      _targetToken: string,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    convertByPath(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    priceFeeds(overrides?: CallOverrides): Promise<[string]>;

    rateByPath(
      _path: string[],
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;
  };

  addressOf(
    contractName: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  conversionPath(
    _sourceToken: string,
    _targetToken: string,
    overrides?: CallOverrides
  ): Promise<string[]>;

  convertByPath(
    _path: string[],
    _amount: BigNumberish,
    _minReturn: BigNumberish,
    _beneficiary: string,
    _affiliateAccount: string,
    _affiliateFee: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  priceFeeds(overrides?: CallOverrides): Promise<string>;

  rateByPath(
    _path: string[],
    _amount: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  callStatic: {
    addressOf(
      contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    conversionPath(
      _sourceToken: string,
      _targetToken: string,
      overrides?: CallOverrides
    ): Promise<string[]>;

    convertByPath(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    priceFeeds(overrides?: CallOverrides): Promise<string>;

    rateByPath(
      _path: string[],
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    addressOf(
      contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    conversionPath(
      _sourceToken: string,
      _targetToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    convertByPath(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    priceFeeds(overrides?: CallOverrides): Promise<BigNumber>;

    rateByPath(
      _path: string[],
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    addressOf(
      contractName: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    conversionPath(
      _sourceToken: string,
      _targetToken: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    convertByPath(
      _path: string[],
      _amount: BigNumberish,
      _minReturn: BigNumberish,
      _beneficiary: string,
      _affiliateAccount: string,
      _affiliateFee: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    priceFeeds(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    rateByPath(
      _path: string[],
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}