export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getAllAvatarIds' : IDL.Func([], [IDL.Vec(IDL.Nat)], ['query']),
    'getAvatar' : IDL.Func([IDL.Nat], [IDL.Opt(IDL.Vec(IDL.Nat8))], ['query']),
    'uploadAvatar' : IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Nat], []),
  });
};
export const init = ({ IDL }) => { return []; };
