// lib/field-registry.ts — Single source of truth for all field types (EF-registry)
import type { FormField, FormFieldType } from './engine-form-types'

export type FieldDef = {
  type: FormFieldType
  shortLabel: string      // badge in FieldCard
  paletteLabel: string    // button text in palette
  icon: string
  group: string
  preset?: Partial<FormField>
}

export const FIELD_REGISTRY: FieldDef[] = [
  // ── ข้อความ ──────────────────────────────────────────────────────────────
  { type: 'text',      shortLabel: 'ข้อความ',      paletteLabel: 'ข้อความบรรทัดเดียว', icon: '✏️', group: 'ข้อความ',   preset: { label: 'ชื่อ-นามสกุล' } },
  { type: 'multiline', shortLabel: 'หลายบรรทัด',   paletteLabel: 'ข้อความหลายบรรทัด',  icon: '📄', group: 'ข้อความ',   preset: { label: 'รายละเอียด' } },
  { type: 'email',     shortLabel: 'อีเมล',         paletteLabel: 'อีเมล',              icon: '✉️', group: 'ข้อความ',   preset: { label: 'อีเมล' } },
  { type: 'number',    shortLabel: 'ตัวเลข',        paletteLabel: 'ตัวเลข',             icon: '🔢', group: 'ข้อความ',   preset: { label: 'จำนวน' } },
  { type: 'currency',  shortLabel: 'จำนวนเงิน',    paletteLabel: 'จำนวนเงิน (฿)',      icon: '💲', group: 'ข้อความ',   preset: { label: 'จำนวนเงิน', placeholder: '0.00' } },

  // ── วันที่ ────────────────────────────────────────────────────────────────
  { type: 'date',       shortLabel: 'วันที่',       paletteLabel: 'วันที่',             icon: '📅', group: 'วันที่',    preset: { label: 'วันที่' } },
  { type: 'date_range', shortLabel: 'ช่วงวันที่',   paletteLabel: 'ช่วงวันที่',         icon: '📆', group: 'วันที่',    preset: { label: 'ช่วงวันที่' } },

  // ── ตัวเลือก ──────────────────────────────────────────────────────────────
  { type: 'checkbox',   shortLabel: 'Checkbox',     paletteLabel: 'Checkbox',           icon: '☑️', group: 'ตัวเลือก', preset: { label: 'เลือกรายการ',    options: ['ตัวเลือก 1', 'ตัวเลือก 2'] } },
  { type: 'radio',      shortLabel: 'Radio',        paletteLabel: 'Radio Button',       icon: '🔘', group: 'ตัวเลือก', preset: { label: 'เลือกหนึ่งรายการ', options: ['ตัวเลือก 1', 'ตัวเลือก 2'] } },
  { type: 'dropdown',   shortLabel: 'Dropdown',     paletteLabel: 'Dropdown',           icon: '▾',  group: 'ตัวเลือก', preset: { label: 'เลือกจากรายการ', options: ['ตัวเลือก 1', 'ตัวเลือก 2'] } },
  { type: 'inspection', shortLabel: 'ผ่าน/ไม่ผ่าน', paletteLabel: 'ผ่าน / ไม่ผ่าน / แก้ไข', icon: '✅', group: 'ตัวเลือก', preset: { label: 'ผลการตรวจสอบ', options: ['ผ่าน', 'ไม่ผ่าน', 'แก้ไข'] } },

  // ── พิเศษ ─────────────────────────────────────────────────────────────────
  { type: 'signature',      shortLabel: 'ลายเซ็น',         paletteLabel: 'ลายเซ็น',                   icon: '🖊️', group: 'พิเศษ', preset: { label: 'ลายเซ็นผู้ขอ' } },
  { type: 'logo',           shortLabel: 'โลโก้',           paletteLabel: 'โลโก้ / ตราองค์กร',         icon: '🏷️', group: 'พิเศษ', preset: { label: 'โลโก้ / ตราองค์กร' } },
  { type: 'running_number', shortLabel: 'เลขที่เอกสาร',    paletteLabel: 'เลขที่เอกสาร',              icon: '🔢', group: 'พิเศษ', preset: { label: 'เลขที่เอกสาร' } },
  { type: 'id_card',        shortLabel: 'บัตรประชาชน',     paletteLabel: 'เลขบัตรประชาชน 13 หลัก',   icon: '🪪', group: 'พิเศษ', preset: { label: 'เลขบัตรประชาชน' } },
  { type: 'photo_upload',   shortLabel: 'รูปภาพ',          paletteLabel: 'แนบรูปภาพ / หลักฐาน',      icon: '📸', group: 'พิเศษ', preset: { label: 'รูปภาพ / หลักฐาน' } },
  { type: 'barcode',        shortLabel: 'Barcode/QR',      paletteLabel: 'Barcode / QR Code',         icon: '📊', group: 'พิเศษ', preset: { label: 'Barcode / QR Code' } },
  { type: 'gps',            shortLabel: 'พิกัด GPS',       paletteLabel: 'พิกัด GPS',                 icon: '📍', group: 'พิเศษ', preset: { label: 'พิกัด GPS' } },
  { type: 'dimension',      shortLabel: 'ขนาด W×L×H',      paletteLabel: 'ขนาด กว้าง×ยาว×สูง',      icon: '📐', group: 'พิเศษ', preset: { label: 'ขนาด (กว้าง × ยาว × สูง)' } },
  { type: 'weight_height',  shortLabel: 'น้ำหนัก/สูง',     paletteLabel: 'น้ำหนัก / ส่วนสูง',        icon: '⚖️', group: 'พิเศษ', preset: { label: 'น้ำหนัก / ส่วนสูง' } },
  { type: 'table',          shortLabel: 'ตาราง',            paletteLabel: 'ตาราง',                     icon: '🗃️', group: 'พิเศษ', preset: { label: 'ตาราง', tableColumns: ['รายการ', 'จำนวน', 'หมายเหตุ'], tableRows: 3 } },

  // ── โครงสร้าง ─────────────────────────────────────────────────────────────
  { type: 'section_header', shortLabel: 'หัวข้อส่วน',    paletteLabel: 'หัวข้อส่วน',    icon: '📌', group: 'โครงสร้าง', preset: { label: 'หัวข้อส่วน' } },
  { type: 'divider',        shortLabel: 'เส้นคั่น',      paletteLabel: 'เส้นคั่น',      icon: '➖', group: 'โครงสร้าง', preset: { label: 'เส้นคั่น' } },
  { type: 'row_break',      shortLabel: 'ขึ้นบรรทัดใหม่', paletteLabel: 'ขึ้นบรรทัดใหม่', icon: '↵', group: 'โครงสร้าง', preset: { label: '' } },
  { type: 'page_break',     shortLabel: 'ขึ้นหน้าใหม่',  paletteLabel: 'ขึ้นหน้าใหม่',  icon: '📃', group: 'โครงสร้าง', preset: { label: '' } },

  // ── 💰 การเงิน ────────────────────────────────────────────────────────────
  { type: 'currency', shortLabel: 'จำนวนเงิน',  paletteLabel: 'จำนวนเงิน',      icon: '💲', group: '💰 การเงิน', preset: { label: 'จำนวนเงิน', sampleValue: '1,500.00' } },
  { type: 'text',     shortLabel: 'ข้อความ',     paletteLabel: 'เลขบัญชี',       icon: '🏦', group: '💰 การเงิน', preset: { label: 'เลขบัญชีธนาคาร', placeholder: 'XXX-X-XXXXX-X', sampleValue: '123-4-56789-0' } },
  { type: 'text',     shortLabel: 'ข้อความ',     paletteLabel: 'เลขผู้เสียภาษี', icon: '🧾', group: '💰 การเงิน', preset: { label: 'เลขประจำตัวผู้เสียภาษี (13 หลัก)', sampleValue: '1234567890123' } },
  { type: 'radio',    shortLabel: 'Radio',       paletteLabel: 'วิธีชำระเงิน',   icon: '💳', group: '💰 การเงิน', preset: { label: 'วิธีชำระเงิน', options: ['เงินสด', 'โอนเงิน', 'เช็ค', 'บัตรเครดิต'], sampleValue: 'โอนเงิน' } },
  { type: 'text',     shortLabel: 'ข้อความ',     paletteLabel: 'รายละเอียดเช็ค', icon: '📝', group: '💰 การเงิน', preset: { label: 'รายละเอียดเช็ค (เลขที่ / ธนาคาร / วันที่)', sampleValue: '001234 / ธ.กสิกรไทย / 15 พ.ค. 68' } },
  { type: 'text',     shortLabel: 'ข้อความ',     paletteLabel: 'รหัสงบประมาณ',  icon: '🗂️', group: '💰 การเงิน', preset: { label: 'รหัสงบประมาณ', sampleValue: 'B-2568-001' } },
  { type: 'dropdown', shortLabel: 'Dropdown',    paletteLabel: 'หัก ณ ที่จ่าย',  icon: '📉', group: '💰 การเงิน', preset: { label: 'หัก ณ ที่จ่าย', options: ['1%', '3%', '5%', 'ไม่หัก'], sampleValue: '3%' } },
  { type: 'text',     shortLabel: 'ข้อความ',     paletteLabel: 'ส่วนลด',         icon: '🏷️', group: '💰 การเงิน', preset: { label: 'ส่วนลด', placeholder: '% หรือ บาท', sampleValue: '10%' } },
  { type: 'text',     shortLabel: 'ข้อความ',     paletteLabel: 'ยอดมัดจำ',       icon: '💰', group: '💰 การเงิน', preset: { label: 'ยอดมัดจำ / ยอดที่เหลือ', sampleValue: 'มัดจำ ฿500 / คงเหลือ ฿1,000' } },

  // ── 🏥 การแพทย์ ──────────────────────────────────────────────────────────
  { type: 'dropdown',      shortLabel: 'Dropdown',    paletteLabel: 'หมู่เลือด',          icon: '🩸', group: '🏥 การแพทย์', preset: { label: 'หมู่เลือด', options: ['A', 'B', 'AB', 'O', 'ไม่ทราบ'], sampleValue: 'O' } },
  { type: 'multiline',     shortLabel: 'หลายบรรทัด', paletteLabel: 'รายการแพ้',          icon: '⚠️', group: '🏥 การแพทย์', preset: { label: 'รายการแพ้ (ยา / อาหาร)', placeholder: 'ระบุรายการที่แพ้', sampleValue: 'แพ้ยา Penicillin' } },
  { type: 'multiline',     shortLabel: 'หลายบรรทัด', paletteLabel: 'ประวัติการรักษา',     icon: '📋', group: '🏥 การแพทย์', preset: { label: 'ประวัติการรักษา', sampleValue: 'ผ่าตัดไส้ติ่ง ปี 2560' } },
  { type: 'weight_height', shortLabel: 'น้ำหนัก/สูง', paletteLabel: 'น้ำหนัก / ส่วนสูง', icon: '⚖️', group: '🏥 การแพทย์', preset: { label: 'น้ำหนัก / ส่วนสูง', sampleValue: '65 กก. / 170 ซม.' } },
  { type: 'text',          shortLabel: 'ข้อความ',     paletteLabel: 'Vital Signs',         icon: '🩺', group: '🏥 การแพทย์', preset: { label: 'Vital Signs', placeholder: 'ความดัน / ชีพจร / อุณหภูมิ', sampleValue: '120/80 mmHg / 72 bpm / 36.8°C' } },
  { type: 'text',          shortLabel: 'ข้อความ',     paletteLabel: 'ขนาดยา',              icon: '💊', group: '🏥 การแพทย์', preset: { label: 'ขนาดยาและความถี่', placeholder: 'เช่น 500mg วันละ 2 ครั้ง', sampleValue: 'Paracetamol 500mg วันละ 3 ครั้ง' } },
  { type: 'text',          shortLabel: 'ข้อความ',     paletteLabel: 'ICD Code',            icon: '🔬', group: '🏥 การแพทย์', preset: { label: 'ICD Code', placeholder: 'เช่น J06.9', sampleValue: 'J06.9' } },
  { type: 'text',          shortLabel: 'ข้อความ',     paletteLabel: 'เลขใบประกอบวิชาชีพ', icon: '📜', group: '🏥 การแพทย์', preset: { label: 'เลขใบประกอบวิชาชีพแพทย์', sampleValue: 'ว.12345' } },

  // ── 🏗️ วิศวกรรม ──────────────────────────────────────────────────────────
  { type: 'dimension',   shortLabel: 'ขนาด W×L×H',  paletteLabel: 'ขนาด W×L×H',         icon: '📐', group: '🏗️ วิศวกรรม', preset: { label: 'ขนาด (กว้าง × ยาว × สูง)', sampleValue: '2.50 × 1.80 × 3.00 ม.' } },
  { type: 'dropdown',    shortLabel: 'Dropdown',    paletteLabel: 'หน่วยวัด',            icon: '📏', group: '🏗️ วิศวกรรม', preset: { label: 'หน่วยวัด', options: ['เมตร', 'เซนติเมตร', 'นิ้ว', 'ฟุต', 'มิลลิเมตร'], sampleValue: 'เมตร' } },
  { type: 'text',        shortLabel: 'ข้อความ',     paletteLabel: 'เลขที่แบบ',           icon: '🗺️', group: '🏗️ วิศวกรรม', preset: { label: 'เลขที่แบบ / Revision', placeholder: 'เช่น DWG-001 Rev.A', sampleValue: 'DWG-001 Rev.A' } },
  { type: 'table',       shortLabel: 'ตาราง',        paletteLabel: 'รายการวัสดุ',          icon: '📦', group: '🏗️ วิศวกรรม', preset: { label: 'รายการวัสดุ', tableColumns: ['รายการ', 'ปริมาณ', 'หน่วย', 'หมายเหตุ'], tableRows: 5 } },
  { type: 'inspection',  shortLabel: 'ผ่าน/ไม่ผ่าน', paletteLabel: 'ผ่าน/ไม่ผ่าน/แก้ไข', icon: '✅', group: '🏗️ วิศวกรรม', preset: { label: 'ผลการตรวจสอบ', sampleValue: 'ผ่าน' } },
  { type: 'gps',         shortLabel: 'พิกัด GPS',    paletteLabel: 'พิกัด GPS',            icon: '📍', group: '🏗️ วิศวกรรม', preset: { label: 'พิกัดสถานที่ก่อสร้าง', sampleValue: '13.7563, 100.5018' } },
  { type: 'photo_upload',shortLabel: 'รูปภาพ',       paletteLabel: 'รูปหน้างาน',           icon: '📸', group: '🏗️ วิศวกรรม', preset: { label: 'รูปภาพหน้างาน / หลักฐาน' } },
  { type: 'text',        shortLabel: 'ข้อความ',     paletteLabel: 'As-Built Reference',   icon: '🏗️', group: '🏗️ วิศวกรรม', preset: { label: 'อ้างอิงแบบก่อสร้างจริง', sampleValue: 'AS-BUILT-2568-001' } },

  // ── ⚖️ กฎหมาย ────────────────────────────────────────────────────────────
  { type: 'id_card',   shortLabel: 'บัตรประชาชน', paletteLabel: 'เลขบัตรประชาชน',    icon: '🪪', group: '⚖️ กฎหมาย', preset: { label: 'เลขบัตรประชาชน 13 หลัก', sampleValue: '1 2345 67890 12 3' } },
  { type: 'text',      shortLabel: 'ข้อความ',     paletteLabel: 'เลขพาสปอร์ต',       icon: '🛂', group: '⚖️ กฎหมาย', preset: { label: 'เลขพาสปอร์ต', sampleValue: 'AA1234567' } },
  { type: 'text',      shortLabel: 'ข้อความ',     paletteLabel: 'ชื่อพยาน',           icon: '👥', group: '⚖️ กฎหมาย', preset: { label: 'ชื่อพยาน', sampleValue: 'นายสมหมาย รักดี' } },
  { type: 'text',      shortLabel: 'ข้อความ',     paletteLabel: 'ผู้รับรองเอกสาร',    icon: '🔏', group: '⚖️ กฎหมาย', preset: { label: 'ผู้รับรองเอกสาร', sampleValue: 'นายกวิน ชัยชนะ' } },
  { type: 'date_range',shortLabel: 'ช่วงวันที่',  paletteLabel: 'ระยะเวลาสัญญา',     icon: '📅', group: '⚖️ กฎหมาย', preset: { label: 'ระยะเวลาสัญญา (วันเริ่ม – สิ้นสุด)', sampleValue: '1 ม.ค. – 31 ธ.ค. 2568' } },
  { type: 'multiline', shortLabel: 'หลายบรรทัด', paletteLabel: 'ค่าปรับ / เงื่อนไข', icon: '⚠️', group: '⚖️ กฎหมาย', preset: { label: 'ค่าปรับและเงื่อนไข', sampleValue: 'ค่าปรับวันละ 0.1% ของมูลค่าสัญญา' } },
  { type: 'dropdown',  shortLabel: 'Dropdown',   paletteLabel: 'ศาลที่มีอำนาจ',     icon: '🏛️', group: '⚖️ กฎหมาย', preset: { label: 'ศาลที่มีอำนาจ', options: ['ศาลแพ่ง', 'ศาลอาญา', 'ศาลแรงงาน', 'ศาลปกครอง'], sampleValue: 'ศาลแพ่ง' } },
  { type: 'text',      shortLabel: 'ข้อความ',     paletteLabel: 'ช่องแก้ไขสัญญา',    icon: '📝', group: '⚖️ กฎหมาย', preset: { label: 'การแก้ไขสัญญา + วันที่', sampleValue: 'แก้ไขครั้งที่ 1 วันที่ 15 พ.ค. 2568' } },

  // ── 🚚 โลจิสติกส์ ────────────────────────────────────────────────────────
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'หมายเลขพัสดุ',       icon: '📦', group: '🚚 โลจิสติกส์', preset: { label: 'หมายเลขพัสดุ (Tracking)', sampleValue: 'TH12345678901' } },
  { type: 'barcode',  shortLabel: 'Barcode/QR', paletteLabel: 'Barcode / QR Code',  icon: '📊', group: '🚚 โลจิสติกส์', preset: { label: 'Barcode / QR Code', sampleValue: 'TH12345678901' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'น้ำหนัก/ขนาดพัสดุ', icon: '⚖️', group: '🚚 โลจิสติกส์', preset: { label: 'น้ำหนัก / ขนาดพัสดุ', placeholder: 'น้ำหนัก (kg) / ขนาด (ซม.)', sampleValue: '2.5 kg / 30×20×15 ซม.' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'ต้นทาง → ปลายทาง',  icon: '🗺️', group: '🚚 โลจิสติกส์', preset: { label: 'ต้นทาง → ปลายทาง', sampleValue: 'กรุงเทพฯ → เชียงใหม่' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'ทะเบียนรถ',           icon: '🚗', group: '🚚 โลจิสติกส์', preset: { label: 'ทะเบียนรถ', sampleValue: 'กข-1234 กรุงเทพฯ' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'ใบขับขี่คนขับ',       icon: '🪪', group: '🚚 โลจิสติกส์', preset: { label: 'เลขที่ใบขับขี่', sampleValue: '12-1234567' } },
  { type: 'dropdown', shortLabel: 'Dropdown', paletteLabel: 'สถานะการจัดส่ง',     icon: '🚚', group: '🚚 โลจิสติกส์', preset: { label: 'สถานะการจัดส่ง', options: ['รอจัดส่ง', 'อยู่ระหว่างจัดส่ง', 'จัดส่งแล้ว', 'ไม่สำเร็จ'], sampleValue: 'อยู่ระหว่างจัดส่ง' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'อุณหภูมิ Cold Chain', icon: '🌡️', group: '🚚 โลจิสติกส์', preset: { label: 'อุณหภูมิ Cold Chain', placeholder: '°C', sampleValue: '-18°C' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'HS Code',              icon: '🛃', group: '🚚 โลจิสติกส์', preset: { label: 'พิกัดศุลกากร (HS Code)', sampleValue: '8471.30.00' } },

  // ── 🎓 การศึกษา ──────────────────────────────────────────────────────────
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'รหัสนักเรียน/นศ.',   icon: '🎓', group: '🎓 การศึกษา', preset: { label: 'รหัสนักเรียน / นักศึกษา', sampleValue: 'STD-2568-001' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'คะแนน / เกรด',       icon: '📊', group: '🎓 การศึกษา', preset: { label: 'คะแนน / เกรด', placeholder: 'เช่น 85 / A', sampleValue: '85 / A' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'GPA',                icon: '📈', group: '🎓 การศึกษา', preset: { label: 'เกรดเฉลี่ย (GPA)', placeholder: '0.00 – 4.00', sampleValue: '3.75' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'รหัสวิชา',            icon: '📚', group: '🎓 การศึกษา', preset: { label: 'รหัสวิชา', sampleValue: 'CS101' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'ปีการศึกษา',          icon: '📅', group: '🎓 การศึกษา', preset: { label: 'ปีการศึกษา / ภาคเรียน', placeholder: 'เช่น 2567/1', sampleValue: '2567/1' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'ข้อมูลผู้ปกครอง',    icon: '👨‍👩‍👧', group: '🎓 การศึกษา', preset: { label: 'ชื่อ-นามสกุลผู้ปกครอง', sampleValue: 'นางสาวมาลี ใจดี' } },
  { type: 'dropdown', shortLabel: 'Dropdown', paletteLabel: 'ประเภททุน',           icon: '🏆', group: '🎓 การศึกษา', preset: { label: 'ประเภททุนการศึกษา', options: ['ทุนเรียนดี', 'ทุนขาดแคลน', 'ทุนกู้ยืม', 'ทุนผู้พิการ'], sampleValue: 'ทุนเรียนดี' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'อ้างอิง Transcript',  icon: '📋', group: '🎓 การศึกษา', preset: { label: 'เลขที่ Transcript', sampleValue: 'TR-2568-12345' } },

  // ── 🏨 โรงแรม/บริการ ─────────────────────────────────────────────────────
  { type: 'text',      shortLabel: 'ข้อความ',  paletteLabel: 'หมายเลขการจอง',       icon: '🎫', group: '🏨 โรงแรม/บริการ', preset: { label: 'หมายเลขการจอง (Booking Ref.)', sampleValue: 'BK-2568-001' } },
  { type: 'date_range',shortLabel: 'ช่วงวันที่', paletteLabel: 'Check-in / Check-out', icon: '🗓️', group: '🏨 โรงแรม/บริการ', preset: { label: 'Check-in / Check-out', sampleValue: '15–17 พ.ค. 2568' } },
  { type: 'dropdown',  shortLabel: 'Dropdown', paletteLabel: 'ประเภทห้อง',           icon: '🛏️', group: '🏨 โรงแรม/บริการ', preset: { label: 'ประเภทห้อง', options: ['Standard', 'Deluxe', 'Suite', 'Family'], sampleValue: 'Deluxe' } },
  { type: 'number',    shortLabel: 'ตัวเลข',   paletteLabel: 'จำนวนผู้เข้าพัก',      icon: '👥', group: '🏨 โรงแรม/บริการ', preset: { label: 'จำนวนผู้เข้าพัก', sampleValue: '2' } },
  { type: 'dropdown',  shortLabel: 'Dropdown', paletteLabel: 'ความต้องการอาหาร',     icon: '🍽️', group: '🏨 โรงแรม/บริการ', preset: { label: 'ความต้องการด้านอาหาร', options: ['ทั่วไป', 'มังสวิรัติ', 'อาหารฮาลาล', 'ไม่กินหมู'], sampleValue: 'ทั่วไป' } },
  { type: 'dropdown',  shortLabel: 'Dropdown', paletteLabel: 'สัญชาติ',              icon: '🌏', group: '🏨 โรงแรม/บริการ', preset: { label: 'สัญชาติ', options: ['ไทย', 'จีน', 'ญี่ปุ่น', 'เกาหลี', 'อื่นๆ'], sampleValue: 'ไทย' } },
  { type: 'text',      shortLabel: 'ข้อความ',  paletteLabel: 'เลขสมาชิก',            icon: '💳', group: '🏨 โรงแรม/บริการ', preset: { label: 'เลขสมาชิก (Loyalty Card)', sampleValue: 'MBR-00123' } },

  // ── 🏛️ ราชการ ─────────────────────────────────────────────────────────────
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'รหัสหน่วยงาน',     icon: '🏛️', group: '🏛️ ราชการ', preset: { label: 'รหัสหน่วยงาน', sampleValue: 'กรม-2568-001' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'ปีงบประมาณ',        icon: '📅', group: '🏛️ ราชการ', preset: { label: 'ปีงบประมาณ พ.ศ.', placeholder: 'พ.ศ. 2568', sampleValue: 'พ.ศ. 2568' } },
  { type: 'dropdown', shortLabel: 'Dropdown', paletteLabel: 'วิธีจัดซื้อจัดจ้าง', icon: '🛒', group: '🏛️ ราชการ', preset: { label: 'วิธีจัดซื้อจัดจ้าง', options: ['วิธีเฉพาะเจาะจง', 'วิธีคัดเลือก', 'วิธีประกวดราคา'], sampleValue: 'วิธีเฉพาะเจาะจง' } },
  { type: 'dropdown', shortLabel: 'Dropdown', paletteLabel: 'ระดับความลับ',      icon: '🔒', group: '🏛️ ราชการ', preset: { label: 'ระดับความลับ', options: ['ปกติ', 'ลับ', 'ลับมาก'], sampleValue: 'ปกติ' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'ตำแหน่งราชการ',     icon: '👔', group: '🏛️ ราชการ', preset: { label: 'ตำแหน่งราชการ', sampleValue: 'นักวิเคราะห์นโยบายและแผน' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'กระทรวง / กรม',     icon: '🏢', group: '🏛️ ราชการ', preset: { label: 'กระทรวง / กรม / หน่วยงาน', sampleValue: 'กระทรวงการคลัง' } },

  // ── 🛒 อีคอมเมิร์ซ ───────────────────────────────────────────────────────
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'รหัสสินค้า (SKU)',   icon: '🏷️', group: '🛒 อีคอมเมิร์ซ', preset: { label: 'รหัสสินค้า (SKU)', placeholder: 'SKU-XXXXX', sampleValue: 'SKU-00001' } },
  { type: 'number',   shortLabel: 'ตัวเลข',   paletteLabel: 'จำนวนสินค้า',        icon: '🔢', group: '🛒 อีคอมเมิร์ซ', preset: { label: 'จำนวนสินค้า', sampleValue: '3' } },
  { type: 'dropdown', shortLabel: 'Dropdown', paletteLabel: 'สี / ไซส์',          icon: '🎨', group: '🛒 อีคอมเมิร์ซ', preset: { label: 'สี / ไซส์', options: ['S', 'M', 'L', 'XL', 'XXL'], sampleValue: 'L' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'ระยะเวลารับประกัน',  icon: '🛡️', group: '🛒 อีคอมเมิร์ซ', preset: { label: 'ระยะเวลารับประกัน', placeholder: 'เช่น 1 ปี', sampleValue: '1 ปี' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'Serial Number',      icon: '🔢', group: '🛒 อีคอมเมิร์ซ', preset: { label: 'หมายเลขเครื่อง (S/N)', sampleValue: 'SN-20680515-001' } },
  { type: 'dropdown', shortLabel: 'Dropdown', paletteLabel: 'เหตุผลคืนสินค้า',   icon: '↩️', group: '🛒 อีคอมเมิร์ซ', preset: { label: 'เหตุผลคืนสินค้า', options: ['เปลี่ยนใจ', 'ชำรุด/เสียหาย', 'ผิดสินค้า', 'อื่นๆ'], sampleValue: 'ชำรุด/เสียหาย' } },
  { type: 'text',     shortLabel: 'ข้อความ',  paletteLabel: 'รหัสโปรโมชั่น',     icon: '🎁', group: '🛒 อีคอมเมิร์ซ', preset: { label: 'รหัสโปรโมชั่น', placeholder: 'PROMO-XXXX', sampleValue: 'PROMO-2568' } },
  { type: 'number',   shortLabel: 'ตัวเลข',   paletteLabel: 'แต้มสะสม',           icon: '⭐', group: '🛒 อีคอมเมิร์ซ', preset: { label: 'แต้มสะสม', sampleValue: '1500' } },

  // ── 🔧 ซ่อมบำรุง/QC ──────────────────────────────────────────────────────
  { type: 'text',         shortLabel: 'ข้อความ',     paletteLabel: 'รหัสทรัพย์สิน',     icon: '🔧', group: '🔧 ซ่อมบำรุง/QC', preset: { label: 'รหัสทรัพย์สิน / ครุภัณฑ์', sampleValue: 'ASSET-2568-001' } },
  { type: 'dropdown',     shortLabel: 'Dropdown',    paletteLabel: 'ประเภทงานซ่อม',     icon: '🛠️', group: '🔧 ซ่อมบำรุง/QC', preset: { label: 'ประเภทงานซ่อม', options: ['ซ่อม', 'ตรวจสอบ', 'เปลี่ยนอะไหล่', 'PM ประจำงวด'], sampleValue: 'ตรวจสอบ' } },
  { type: 'multiline',    shortLabel: 'หลายบรรทัด', paletteLabel: 'อาการเสีย',          icon: '📝', group: '🔧 ซ่อมบำรุง/QC', preset: { label: 'อาการเสีย / ข้อบกพร่อง', sampleValue: 'เครื่องไม่ติด มีกลิ่นไหม้' } },
  { type: 'photo_upload', shortLabel: 'รูปภาพ',      paletteLabel: 'รูปก่อน-หลังซ่อม',  icon: '📸', group: '🔧 ซ่อมบำรุง/QC', preset: { label: 'รูปก่อน / หลังซ่อม' } },
  { type: 'text',         shortLabel: 'ข้อความ',     paletteLabel: 'รหัสช่าง',           icon: '👨‍🔧', group: '🔧 ซ่อมบำรุง/QC', preset: { label: 'รหัสช่าง / ผู้ซ่อม', sampleValue: 'TECH-001' } },
  { type: 'table',        shortLabel: 'ตาราง',        paletteLabel: 'อะไหล่ที่ใช้',       icon: '📋', group: '🔧 ซ่อมบำรุง/QC', preset: { label: 'อะไหล่ที่ใช้', tableColumns: ['รายการ', 'จำนวน', 'หน่วย'], tableRows: 4 } },
  { type: 'date',         shortLabel: 'วันที่',       paletteLabel: 'วันนัดซ่อมถัดไป',    icon: '📅', group: '🔧 ซ่อมบำรุง/QC', preset: { label: 'วันนัดซ่อมถัดไป', sampleValue: '20 พ.ค. 2568' } },
  { type: 'inspection',   shortLabel: 'ผ่าน/ไม่ผ่าน', paletteLabel: 'ผลตรวจสอบ QC',      icon: '✅', group: '🔧 ซ่อมบำรุง/QC', preset: { label: 'ผลตรวจสอบ QC', sampleValue: 'ผ่าน' } },
]

// type → shortLabel (first match per type = base type)
export const FIELD_SHORT_LABEL: Record<string, string> = Object.fromEntries(
  FIELD_REGISTRY.reduce<Map<string, string>>((acc, d) => {
    if (!acc.has(d.type)) acc.set(d.type, d.shortLabel)
    return acc
  }, new Map())
)

// groups for palette (preserves insertion order)
export const PALETTE_GROUPS_FROM_REGISTRY: { name: string; items: FieldDef[] }[] = Array.from(
  FIELD_REGISTRY.reduce<Map<string, FieldDef[]>>((acc, d) => {
    if (!acc.has(d.group)) acc.set(d.group, [])
    acc.get(d.group)!.push(d)
    return acc
  }, new Map())
).map(([name, items]) => ({ name, items }))

// base defaults for makeField (first match per type)
export function getFieldDefaults(type: FormFieldType): Partial<import('./engine-form-types').FormField> {
  return FIELD_REGISTRY.find(d => d.type === type)?.preset ?? {}
}
