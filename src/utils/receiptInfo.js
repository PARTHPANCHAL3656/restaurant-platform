// The restaurant details printed on a bill.
//
// A bill keeps the legal details it was issued with (name, GSTIN, SAC/HSN...)
// so reprinting it later can never show different numbers. The one exception
// is the FSSAI line: whether it is shown follows the live "My restaurant has
// an FSSAI licence" switch in Settings, so turning it off removes it from
// every bill - new and old, on the customer's phone and on the staff screen -
// the moment Settings are saved. Turning it back on brings it back.
export function resolveReceiptInfo(liveInfo, snapshot) {
  if (!snapshot) return liveInfo;
  return {
    ...liveInfo,
    ...snapshot,
    fssaiEnabled: liveInfo.fssaiEnabled !== false,
    fssai: snapshot.fssai || liveInfo.fssai
  };
}