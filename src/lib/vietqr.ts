/**
 * VietQR EMVCo Specification Generator
 * Generates standard EMVCo payload for Vietnamese banking apps (NAPAS 247).
 * Works 100% offline without external network dependency.
 */

// Popular Bank BIN Mapping for Vietnam
export const BANK_BIN_MAP: Record<string, string> = {
  MB: "970422",
  MBBANK: "970422",
  VCB: "970436",
  VIETCOMBANK: "970436",
  TCB: "970407",
  TECHCOMBANK: "970407",
  VPB: "970432",
  VPBANK: "970432",
  ACB: "970416",
  BIDV: "970418",
  VIB: "970441",
  TPB: "970458",
  TPBANK: "970458",
  STB: "970403",
  SACOMBANK: "970403",
  HDB: "970437",
  HDBANK: "970437",
  VBA: "970405",
  AGRIBANK: "970405",
  OCB: "970448",
  MSB: "970426",
  SHB: "970443",
  LPB: "970449",
  LIENVIETPOSTBANK: "970449",
  SEABANK: "970440",
};

/**
 * CRC16-CCITT Checksum Calculation (EMVCo Tag 63)
 */
export function crc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(tag: string, val: string): string {
  const len = String(val.length).padStart(2, "0");
  return tag + len + val;
}

/**
 * Generates official EMVCo VietQR string
 */
export function generateVietQrEmvCo({
  bankId,
  accountNumber,
  amount,
  memo,
}: {
  bankId: string;
  accountNumber: string;
  amount?: number;
  memo?: string;
}): string {
  const cleanBankKey = (bankId || "MB").toUpperCase().trim();
  const bankBin = BANK_BIN_MAP[cleanBankKey] || cleanBankKey;
  const cleanAccountNo = (accountNumber || "836888181").replace(/[\s.-]/g, "");

  // Tag 38: Beneficiary Info
  const napasGuid = tlv("00", "A000000727");
  const benOrg = tlv("00", bankBin) + tlv("01", cleanAccountNo);
  const benInfo = tlv("01", benOrg);
  const service = tlv("02", "QRIBFTTA");
  const tag38 = tlv("38", napasGuid + benInfo + service);

  // Tag 00: Format Indicator (01)
  // Tag 01: Dynamic QR (12) or Static QR (11)
  let payload =
    tlv("00", "01") +
    tlv("01", amount && amount > 0 ? "12" : "11") +
    tag38 +
    tlv("53", "704"); // VND

  if (amount && amount > 0) {
    payload += tlv("54", String(Math.round(amount)));
  }

  payload += tlv("58", "VN");

  if (memo && memo.trim()) {
    payload += tlv("62", tlv("08", memo.trim()));
  }

  // Tag 63: CRC16 Checksum
  payload += "6304";
  const crc = crc16Ccitt(payload);
  return payload + crc;
}
