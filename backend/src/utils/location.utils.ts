import type { LocationStatus } from "../types/lead.type.js";

/**
 * 77 จังหวัด (ไทย|อังกฤษ) — ระบบนี้ใช้กับตลาดไทย ที่อยู่ที่ Google Places คืนมาเป็นภาษาไทย
 * แต่ผู้ใช้พิมพ์ location มาเป็นอังกฤษได้ จึงเก็บทั้งสองชื่อ
 */
const provinces = [
  "กรุงเทพมหานคร|Bangkok", "กระบี่|Krabi", "กาญจนบุรี|Kanchanaburi", "กาฬสินธุ์|Kalasin",
  "กำแพงเพชร|Kamphaeng Phet", "ขอนแก่น|Khon Kaen", "จันทบุรี|Chanthaburi", "ฉะเชิงเทรา|Chachoengsao",
  "ชลบุรี|Chonburi", "ชัยนาท|Chai Nat", "ชัยภูมิ|Chaiyaphum", "ชุมพร|Chumphon",
  "เชียงราย|Chiang Rai", "เชียงใหม่|Chiang Mai", "ตรัง|Trang", "ตราด|Trat", "ตาก|Tak",
  "นครนายก|Nakhon Nayok", "นครปฐม|Nakhon Pathom", "นครพนม|Nakhon Phanom",
  "นครราชสีมา|Nakhon Ratchasima", "นครศรีธรรมราช|Nakhon Si Thammarat", "นครสวรรค์|Nakhon Sawan",
  "นนทบุรี|Nonthaburi", "นราธิวาส|Narathiwat", "น่าน|Nan", "บึงกาฬ|Bueng Kan", "บุรีรัมย์|Buriram",
  "ปทุมธานี|Pathum Thani", "ประจวบคีรีขันธ์|Prachuap Khiri Khan", "ปราจีนบุรี|Prachinburi",
  "ปัตตานี|Pattani", "พระนครศรีอยุธยา|Ayutthaya", "พะเยา|Phayao", "พังงา|Phang Nga",
  "พัทลุง|Phatthalung", "พิจิตร|Phichit", "พิษณุโลก|Phitsanulok", "เพชรบุรี|Phetchaburi",
  "เพชรบูรณ์|Phetchabun", "แพร่|Phrae", "ภูเก็ต|Phuket", "มหาสารคาม|Maha Sarakham",
  "มุกดาหาร|Mukdahan", "แม่ฮ่องสอน|Mae Hong Son", "ยโสธร|Yasothon", "ยะลา|Yala", "ร้อยเอ็ด|Roi Et",
  "ระนอง|Ranong", "ระยอง|Rayong", "ราชบุรี|Ratchaburi", "ลพบุรี|Lopburi", "ลำปาง|Lampang",
  "ลำพูน|Lamphun", "เลย|Loei", "ศรีสะเกษ|Sisaket", "สกลนคร|Sakon Nakhon", "สงขลา|Songkhla",
  "สตูล|Satun", "สมุทรปราการ|Samut Prakan", "สมุทรสงคราม|Samut Songkhram", "สมุทรสาคร|Samut Sakhon",
  "สระแก้ว|Sa Kaeo", "สระบุรี|Saraburi", "สิงห์บุรี|Sing Buri", "สุโขทัย|Sukhothai",
  "สุพรรณบุรี|Suphan Buri", "สุราษฎร์ธานี|Surat Thani", "สุรินทร์|Surin", "หนองคาย|Nong Khai",
  "หนองบัวลำภู|Nong Bua Lamphu", "อ่างทอง|Ang Thong", "อำนาจเจริญ|Amnat Charoen",
  "อุดรธานี|Udon Thani", "อุตรดิตถ์|Uttaradit", "อุทัยธานี|Uthai Thani", "อุบลราชธานี|Ubon Ratchathani"
].map((entry) => entry.split("|") as [string, string]);

/** ตัดคำนำหน้าที่ไม่ช่วยเทียบ (จังหวัด/จ./อ./ต.) แล้วยุบช่องว่าง — ทำให้ "จ.ขอนแก่น" กับ "ขอนแก่น" เท่ากัน */
function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/จังหวัด|อำเภอ|ตำบล|แขวง|เขต|จ\.|อ\.|ต\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * "ชื่อจังหวัดนี้ถูกใช้ในฐานะจังหวัดจริง ๆ" ไม่ใช่บังเอิญเป็นส่วนหนึ่งของชื่อถนน
 * สัญญาณที่เชื่อได้: ตามด้วยรหัสไปรษณีย์ 5 หลัก หรือมี "จังหวัด"/"จ." นำหน้า หรืออยู่ท้ายที่อยู่
 *
 * จำเป็นเพราะที่อยู่กรุงเทพบน "ถนนตากสิน" จะ match จังหวัด "ตาก" ถ้าเทียบด้วย substring เฉย ๆ
 * แล้วเราจะไปตัดธุรกิจทิ้งผิดตัว
 */
function mentionsProvince(rawAddress: string, thai: string, english: string) {
  const name = `(?:${escapeRegExp(thai)}|${escapeRegExp(english.toLowerCase())})`;

  return new RegExp(`(?:จังหวัด\\s*|จ\\.\\s*)${name}|${name}\\s*\\d{5}|${name}\\s*$`, "i").test(rawAddress);
}

/**
 * ตรวจว่าธุรกิจอยู่ในพื้นที่ที่ขอจริงไหม — เทียบจาก **ที่อยู่ของธุรกิจ** เท่านั้น
 * ไม่ใช่จากการที่หน้าเว็บพูดถึงจังหวัดนั้น หรือจากการที่คำค้นมีชื่อจังหวัดอยู่
 *
 * ไม่ได้ระบุ `requested` = ไม่มีเงื่อนไขพื้นที่ → ผ่านทุกราย
 */
export function verifyLocation(address: string | null, requested?: string): LocationStatus {
  if (!requested?.trim()) return "verified";
  if (!address?.trim()) return "unknown";

  const wanted = normalize(requested);
  const found = normalize(address);

  // ผู้ใช้พิมพ์ "Khon Kaen" ได้ แต่ที่อยู่จาก Google เป็นไทย — จับคู่ชื่อไทย/อังกฤษก่อนเทียบ
  // ถ้า location ที่ขอไม่ใช่ชื่อจังหวัด (เช่นอำเภอหรือย่าน) ก็เทียบด้วยคำนั้นตรง ๆ
  const province = provinces.find(([thai, english]) => [normalize(thai), normalize(english)].includes(wanted));
  const aliases = (province ? [normalize(province[0]), normalize(province[1])] : [wanted]).filter(Boolean);

  if (aliases.some((alias) => found.includes(alias))) return "verified";

  // ไม่เจอที่ขอ แต่เจอจังหวัด "อื่น" แบบมีสัญญาณชัด = อยู่คนละที่แน่นอน
  const elsewhere = provinces.some(([thai, english]) => {
    if ([normalize(thai), normalize(english)].some((name) => aliases.includes(name))) return false;

    return mentionsProvince(found, normalize(thai), english);
  });

  return elsewhere ? "outside_location" : "unknown";
}
