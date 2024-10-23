export const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Nat8), 'err' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  return IDL.Service({
    'getAllAvatarIds' : IDL.Func([], [IDL.Vec(IDL.Nat)], ['query']),
    'getAvatar' : IDL.Func([IDL.Nat], [Result_1], ['query']),
    'uploadAvatar' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
