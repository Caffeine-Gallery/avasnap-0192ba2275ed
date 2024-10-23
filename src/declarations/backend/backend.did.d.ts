import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Result = { 'ok' : bigint } |
  { 'err' : string };
export type Result_1 = { 'ok' : Uint8Array | number[] } |
  { 'err' : string };
export interface _SERVICE {
  'getAllAvatarIds' : ActorMethod<[], Array<bigint>>,
  'getAvatar' : ActorMethod<[bigint], Result_1>,
  'uploadAvatar' : ActorMethod<[Uint8Array | number[]], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
