export interface CategoryKeyword {
  regex: RegExp
  category: string
}

export const CATEGORY_KEYWORDS: CategoryKeyword[] = [
  { regex: /มือถือ|โทรศัพท์|smartphone|iphone|samsung|xiaomi|oppo|vivo|realme|redmi|galaxy/i, category: 'มือถือ' },
  { regex: /กีฬา|รองเท้า|nike|adidas|puma|ลู่วิ่ง|ฟิตเนส|yoga|บาส|ฟุตบอล/i, category: 'กีฬา' },
  { regex: /หูฟัง|earphone|earbuds|headphone|sony|jbl|airpods|tws/i, category: 'อิเล็กทรอนิกส์' },
  { regex: /laptop|โน้ตบุ๊ค|โน้ตบุ๊ก|คอมพิวเตอร์|คอม|macbook|asus|lenovo|dell|acer/i, category: 'อิเล็กทรอนิกส์' },
  { regex: /กล้อง|camera|canon|nikon|fuji|gopro|drone/i, category: 'อิเล็กทรอนิกส์' },
  { regex: /เสื้อ|กางเกง|กระเป๋า|แฟชั่น|เดรส|รองเท้าแฟชั่น/i, category: 'แฟชั่น' },
  { regex: /ครีม|สกินแคร์|เซรั่ม|น้ำหอม|เครื่องสำอาง|ลิปสติก|มาสก์/i, category: 'ความงาม' },
  { regex: /โซฟา|เฟอร์นิเจอร์|บ้าน|ชั้นวาง|ที่นอน|หมอน|ผ้าม่าน/i, category: 'บ้านและสวน' },
  { regex: /หนังสือ|book|manga|มังงะ/i, category: 'หนังสือ' },
]

export function detectCategory(input: string): string | undefined {
  const normalized = input.replace(/[-_]/g, ' ')

  for (const keyword of CATEGORY_KEYWORDS) {
    if (keyword.regex.test(normalized)) return keyword.category
  }

  return undefined
}
