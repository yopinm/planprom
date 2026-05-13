'use client'

import type { FormField, FormFieldType } from '@/lib/engine-form-types'

interface PaletteItem {
  type: FormFieldType
  label: string
  icon: string
  preset?: Partial<FormField>
}

const PALETTE_GROUPS: { name: string; items: PaletteItem[] }[] = [
  {
    name: 'ข้อความ',
    items: [
      { type: 'text',      icon: '✏️', label: 'ข้อความบรรทัดเดียว' },
      { type: 'multiline', icon: '📄', label: 'ข้อความหลายบรรทัด' },
      { type: 'email',     icon: '✉️', label: 'อีเมล' },
      { type: 'number',    icon: '🔢', label: 'ตัวเลข' },
      { type: 'currency',  icon: '💲', label: 'จำนวนเงิน (฿)' },
    ],
  },
  {
    name: 'วันที่',
    items: [
      { type: 'date',       icon: '📅', label: 'วันที่' },
      { type: 'date_range', icon: '📆', label: 'ช่วงวันที่' },
    ],
  },
  {
    name: 'ตัวเลือก',
    items: [
      { type: 'checkbox',   icon: '☑️', label: 'Checkbox' },
      { type: 'radio',      icon: '🔘', label: 'Radio Button' },
      { type: 'dropdown',   icon: '▾',  label: 'Dropdown' },
      { type: 'inspection', icon: '✅', label: 'ผ่าน / ไม่ผ่าน / แก้ไข' },
    ],
  },
  {
    name: 'พิเศษ',
    items: [
      { type: 'signature',      icon: '🖊️', label: 'ลายเซ็น' },
      { type: 'logo',           icon: '🏷️', label: 'โลโก้ / ตราองค์กร' },
      { type: 'running_number', icon: '🔢', label: 'เลขที่เอกสาร' },
      { type: 'id_card',        icon: '🪪', label: 'เลขบัตรประชาชน 13 หลัก' },
      { type: 'photo_upload',   icon: '📸', label: 'แนบรูปภาพ / หลักฐาน' },
      { type: 'barcode',        icon: '📊', label: 'Barcode / QR Code' },
      { type: 'gps',            icon: '📍', label: 'พิกัด GPS' },
      { type: 'dimension',      icon: '📐', label: 'ขนาด กว้าง×ยาว×สูง' },
      { type: 'weight_height',  icon: '⚖️', label: 'น้ำหนัก / ส่วนสูง' },
      { type: 'table',          icon: '🗃️', label: 'ตาราง' },
    ],
  },
  {
    name: 'โครงสร้าง',
    items: [
      { type: 'section_header', icon: '📌', label: 'หัวข้อส่วน' },
      { type: 'divider',        icon: '➖', label: 'เส้นคั่น' },
      { type: 'row_break',      icon: '↵',  label: 'ขึ้นบรรทัดใหม่' },
      { type: 'page_break',     icon: '📃', label: 'ขึ้นหน้าใหม่' },
    ],
  },
  {
    name: '💰 การเงิน',
    items: [
      { type: 'currency', icon: '💲', label: 'จำนวนเงิน',      preset: { label: 'จำนวนเงิน', sampleValue: '1,500.00' } },
      { type: 'text',     icon: '🏦', label: 'เลขบัญชี',       preset: { label: 'เลขบัญชีธนาคาร', placeholder: 'XXX-X-XXXXX-X', sampleValue: '123-4-56789-0' } },
      { type: 'text',     icon: '🧾', label: 'เลขผู้เสียภาษี', preset: { label: 'เลขประจำตัวผู้เสียภาษี (13 หลัก)', sampleValue: '1234567890123' } },
      { type: 'radio',    icon: '💳', label: 'วิธีชำระเงิน',   preset: { label: 'วิธีชำระเงิน', options: ['เงินสด', 'โอนเงิน', 'เช็ค', 'บัตรเครดิต'], sampleValue: 'โอนเงิน' } },
      { type: 'text',     icon: '📝', label: 'รายละเอียดเช็ค', preset: { label: 'รายละเอียดเช็ค (เลขที่ / ธนาคาร / วันที่)', sampleValue: '001234 / ธ.กสิกรไทย / 15 พ.ค. 68' } },
      { type: 'text',     icon: '🗂️', label: 'รหัสงบประมาณ',  preset: { label: 'รหัสงบประมาณ', sampleValue: 'B-2568-001' } },
      { type: 'dropdown', icon: '📉', label: 'หัก ณ ที่จ่าย',  preset: { label: 'หัก ณ ที่จ่าย', options: ['1%', '3%', '5%', 'ไม่หัก'], sampleValue: '3%' } },
      { type: 'text',     icon: '🏷️', label: 'ส่วนลด',         preset: { label: 'ส่วนลด', placeholder: '% หรือ บาท', sampleValue: '10%' } },
      { type: 'text',     icon: '💰', label: 'ยอดมัดจำ',       preset: { label: 'ยอดมัดจำ / ยอดที่เหลือ', sampleValue: 'มัดจำ ฿500 / คงเหลือ ฿1,000' } },
    ],
  },
  {
    name: '🏥 การแพทย์',
    items: [
      { type: 'dropdown',      icon: '🩸', label: 'หมู่เลือด',          preset: { label: 'หมู่เลือด', options: ['A', 'B', 'AB', 'O', 'ไม่ทราบ'], sampleValue: 'O' } },
      { type: 'multiline',     icon: '⚠️', label: 'รายการแพ้',          preset: { label: 'รายการแพ้ (ยา / อาหาร)', placeholder: 'ระบุรายการที่แพ้', sampleValue: 'แพ้ยา Penicillin' } },
      { type: 'multiline',     icon: '📋', label: 'ประวัติการรักษา',     preset: { label: 'ประวัติการรักษา', sampleValue: 'ผ่าตัดไส้ติ่ง ปี 2560' } },
      { type: 'weight_height', icon: '⚖️', label: 'น้ำหนัก / ส่วนสูง',  preset: { label: 'น้ำหนัก / ส่วนสูง', sampleValue: '65 กก. / 170 ซม.' } },
      { type: 'text',          icon: '🩺', label: 'Vital Signs',         preset: { label: 'Vital Signs', placeholder: 'ความดัน / ชีพจร / อุณหภูมิ', sampleValue: '120/80 mmHg / 72 bpm / 36.8°C' } },
      { type: 'text',          icon: '💊', label: 'ขนาดยา',              preset: { label: 'ขนาดยาและความถี่', placeholder: 'เช่น 500mg วันละ 2 ครั้ง', sampleValue: 'Paracetamol 500mg วันละ 3 ครั้ง' } },
      { type: 'text',          icon: '🔬', label: 'ICD Code',            preset: { label: 'ICD Code', placeholder: 'เช่น J06.9', sampleValue: 'J06.9' } },
      { type: 'text',          icon: '📜', label: 'เลขใบประกอบวิชาชีพ',  preset: { label: 'เลขใบประกอบวิชาชีพแพทย์', sampleValue: 'ว.12345' } },
    ],
  },
  {
    name: '🏗️ วิศวกรรม',
    items: [
      { type: 'dimension',   icon: '📐', label: 'ขนาด W×L×H',         preset: { label: 'ขนาด (กว้าง × ยาว × สูง)', sampleValue: '2.50 × 1.80 × 3.00 ม.' } },
      { type: 'dropdown',    icon: '📏', label: 'หน่วยวัด',            preset: { label: 'หน่วยวัด', options: ['เมตร', 'เซนติเมตร', 'นิ้ว', 'ฟุต', 'มิลลิเมตร'], sampleValue: 'เมตร' } },
      { type: 'text',        icon: '🗺️', label: 'เลขที่แบบ',           preset: { label: 'เลขที่แบบ / Revision', placeholder: 'เช่น DWG-001 Rev.A', sampleValue: 'DWG-001 Rev.A' } },
      { type: 'table',       icon: '📦', label: 'รายการวัสดุ',          preset: { label: 'รายการวัสดุ', tableColumns: ['รายการ', 'ปริมาณ', 'หน่วย', 'หมายเหตุ'], tableRows: 5 } },
      { type: 'inspection',  icon: '✅', label: 'ผ่าน/ไม่ผ่าน/แก้ไข',  preset: { label: 'ผลการตรวจสอบ', sampleValue: 'ผ่าน' } },
      { type: 'gps',         icon: '📍', label: 'พิกัด GPS',            preset: { label: 'พิกัดสถานที่ก่อสร้าง', sampleValue: '13.7563, 100.5018' } },
      { type: 'photo_upload',icon: '📸', label: 'รูปหน้างาน',           preset: { label: 'รูปภาพหน้างาน / หลักฐาน' } },
      { type: 'text',        icon: '🏗️', label: 'As-Built Reference',   preset: { label: 'อ้างอิงแบบก่อสร้างจริง', sampleValue: 'AS-BUILT-2568-001' } },
    ],
  },
  {
    name: '⚖️ กฎหมาย',
    items: [
      { type: 'id_card',   icon: '🪪', label: 'เลขบัตรประชาชน',    preset: { label: 'เลขบัตรประชาชน 13 หลัก', sampleValue: '1 2345 67890 12 3' } },
      { type: 'text',      icon: '🛂', label: 'เลขพาสปอร์ต',       preset: { label: 'เลขพาสปอร์ต', sampleValue: 'AA1234567' } },
      { type: 'text',      icon: '👥', label: 'ชื่อพยาน',           preset: { label: 'ชื่อพยาน', sampleValue: 'นายสมหมาย รักดี' } },
      { type: 'text',      icon: '🔏', label: 'ผู้รับรองเอกสาร',    preset: { label: 'ผู้รับรองเอกสาร', sampleValue: 'นายกวิน ชัยชนะ' } },
      { type: 'date_range',icon: '📅', label: 'ระยะเวลาสัญญา',     preset: { label: 'ระยะเวลาสัญญา (วันเริ่ม – สิ้นสุด)', sampleValue: '1 ม.ค. – 31 ธ.ค. 2568' } },
      { type: 'multiline', icon: '⚠️', label: 'ค่าปรับ / เงื่อนไข', preset: { label: 'ค่าปรับและเงื่อนไข', sampleValue: 'ค่าปรับวันละ 0.1% ของมูลค่าสัญญา' } },
      { type: 'dropdown',  icon: '🏛️', label: 'ศาลที่มีอำนาจ',     preset: { label: 'ศาลที่มีอำนาจ', options: ['ศาลแพ่ง', 'ศาลอาญา', 'ศาลแรงงาน', 'ศาลปกครอง'], sampleValue: 'ศาลแพ่ง' } },
      { type: 'text',      icon: '📝', label: 'ช่องแก้ไขสัญญา',    preset: { label: 'การแก้ไขสัญญา + วันที่', sampleValue: 'แก้ไขครั้งที่ 1 วันที่ 15 พ.ค. 2568' } },
    ],
  },
  {
    name: '🚚 โลจิสติกส์',
    items: [
      { type: 'text',     icon: '📦', label: 'หมายเลขพัสดุ',       preset: { label: 'หมายเลขพัสดุ (Tracking)', sampleValue: 'TH12345678901' } },
      { type: 'barcode',  icon: '📊', label: 'Barcode / QR Code',   preset: { label: 'Barcode / QR Code', sampleValue: 'TH12345678901' } },
      { type: 'text',     icon: '⚖️', label: 'น้ำหนัก/ขนาดพัสดุ',  preset: { label: 'น้ำหนัก / ขนาดพัสดุ', placeholder: 'น้ำหนัก (kg) / ขนาด (ซม.)', sampleValue: '2.5 kg / 30×20×15 ซม.' } },
      { type: 'text',     icon: '🗺️', label: 'ต้นทาง → ปลายทาง',  preset: { label: 'ต้นทาง → ปลายทาง', sampleValue: 'กรุงเทพฯ → เชียงใหม่' } },
      { type: 'text',     icon: '🚗', label: 'ทะเบียนรถ',           preset: { label: 'ทะเบียนรถ', sampleValue: 'กข-1234 กรุงเทพฯ' } },
      { type: 'text',     icon: '🪪', label: 'ใบขับขี่คนขับ',       preset: { label: 'เลขที่ใบขับขี่', sampleValue: '12-1234567' } },
      { type: 'dropdown', icon: '🚚', label: 'สถานะการจัดส่ง',     preset: { label: 'สถานะการจัดส่ง', options: ['รอจัดส่ง', 'อยู่ระหว่างจัดส่ง', 'จัดส่งแล้ว', 'ไม่สำเร็จ'], sampleValue: 'อยู่ระหว่างจัดส่ง' } },
      { type: 'text',     icon: '🌡️', label: 'อุณหภูมิ Cold Chain', preset: { label: 'อุณหภูมิ Cold Chain', placeholder: '°C', sampleValue: '-18°C' } },
      { type: 'text',     icon: '🛃', label: 'HS Code',              preset: { label: 'พิกัดศุลกากร (HS Code)', sampleValue: '8471.30.00' } },
    ],
  },
  {
    name: '🎓 การศึกษา',
    items: [
      { type: 'text',     icon: '🎓', label: 'รหัสนักเรียน/นศ.',   preset: { label: 'รหัสนักเรียน / นักศึกษา', sampleValue: 'STD-2568-001' } },
      { type: 'text',     icon: '📊', label: 'คะแนน / เกรด',       preset: { label: 'คะแนน / เกรด', placeholder: 'เช่น 85 / A', sampleValue: '85 / A' } },
      { type: 'text',     icon: '📈', label: 'GPA',                preset: { label: 'เกรดเฉลี่ย (GPA)', placeholder: '0.00 – 4.00', sampleValue: '3.75' } },
      { type: 'text',     icon: '📚', label: 'รหัสวิชา',            preset: { label: 'รหัสวิชา', sampleValue: 'CS101' } },
      { type: 'text',     icon: '📅', label: 'ปีการศึกษา',          preset: { label: 'ปีการศึกษา / ภาคเรียน', placeholder: 'เช่น 2567/1', sampleValue: '2567/1' } },
      { type: 'text',     icon: '👨‍👩‍👧', label: 'ข้อมูลผู้ปกครอง',    preset: { label: 'ชื่อ-นามสกุลผู้ปกครอง', sampleValue: 'นางสาวมาลี ใจดี' } },
      { type: 'dropdown', icon: '🏆', label: 'ประเภททุน',           preset: { label: 'ประเภททุนการศึกษา', options: ['ทุนเรียนดี', 'ทุนขาดแคลน', 'ทุนกู้ยืม', 'ทุนผู้พิการ'], sampleValue: 'ทุนเรียนดี' } },
      { type: 'text',     icon: '📋', label: 'อ้างอิง Transcript',  preset: { label: 'เลขที่ Transcript', sampleValue: 'TR-2568-12345' } },
    ],
  },
  {
    name: '🏨 โรงแรม/บริการ',
    items: [
      { type: 'text',      icon: '🎫', label: 'หมายเลขการจอง',       preset: { label: 'หมายเลขการจอง (Booking Ref.)', sampleValue: 'BK-2568-001' } },
      { type: 'date_range',icon: '🗓️', label: 'Check-in / Check-out', preset: { label: 'Check-in / Check-out', sampleValue: '15–17 พ.ค. 2568' } },
      { type: 'dropdown',  icon: '🛏️', label: 'ประเภทห้อง',           preset: { label: 'ประเภทห้อง', options: ['Standard', 'Deluxe', 'Suite', 'Family'], sampleValue: 'Deluxe' } },
      { type: 'number',    icon: '👥', label: 'จำนวนผู้เข้าพัก',      preset: { label: 'จำนวนผู้เข้าพัก', sampleValue: '2' } },
      { type: 'dropdown',  icon: '🍽️', label: 'ความต้องการอาหาร',     preset: { label: 'ความต้องการด้านอาหาร', options: ['ทั่วไป', 'มังสวิรัติ', 'อาหารฮาลาล', 'ไม่กินหมู'], sampleValue: 'ทั่วไป' } },
      { type: 'dropdown',  icon: '🌏', label: 'สัญชาติ',              preset: { label: 'สัญชาติ', options: ['ไทย', 'จีน', 'ญี่ปุ่น', 'เกาหลี', 'อื่นๆ'], sampleValue: 'ไทย' } },
      { type: 'text',      icon: '💳', label: 'เลขสมาชิก',            preset: { label: 'เลขสมาชิก (Loyalty Card)', sampleValue: 'MBR-00123' } },
    ],
  },
  {
    name: '🏛️ ราชการ',
    items: [
      { type: 'text',     icon: '🏛️', label: 'รหัสหน่วยงาน',     preset: { label: 'รหัสหน่วยงาน', sampleValue: 'กรม-2568-001' } },
      { type: 'text',     icon: '📅', label: 'ปีงบประมาณ',        preset: { label: 'ปีงบประมาณ พ.ศ.', placeholder: 'พ.ศ. 2568', sampleValue: 'พ.ศ. 2568' } },
      { type: 'dropdown', icon: '🛒', label: 'วิธีจัดซื้อจัดจ้าง', preset: { label: 'วิธีจัดซื้อจัดจ้าง', options: ['วิธีเฉพาะเจาะจง', 'วิธีคัดเลือก', 'วิธีประกวดราคา'], sampleValue: 'วิธีเฉพาะเจาะจง' } },
      { type: 'dropdown', icon: '🔒', label: 'ระดับความลับ',      preset: { label: 'ระดับความลับ', options: ['ปกติ', 'ลับ', 'ลับมาก'], sampleValue: 'ปกติ' } },
      { type: 'text',     icon: '👔', label: 'ตำแหน่งราชการ',     preset: { label: 'ตำแหน่งราชการ', sampleValue: 'นักวิเคราะห์นโยบายและแผน' } },
      { type: 'text',     icon: '🏢', label: 'กระทรวง / กรม',     preset: { label: 'กระทรวง / กรม / หน่วยงาน', sampleValue: 'กระทรวงการคลัง' } },
    ],
  },
  {
    name: '🛒 อีคอมเมิร์ซ',
    items: [
      { type: 'text',     icon: '🏷️', label: 'รหัสสินค้า (SKU)',   preset: { label: 'รหัสสินค้า (SKU)', placeholder: 'SKU-XXXXX', sampleValue: 'SKU-00001' } },
      { type: 'number',   icon: '🔢', label: 'จำนวนสินค้า',        preset: { label: 'จำนวนสินค้า', sampleValue: '3' } },
      { type: 'dropdown', icon: '🎨', label: 'สี / ไซส์',          preset: { label: 'สี / ไซส์', options: ['S', 'M', 'L', 'XL', 'XXL'], sampleValue: 'L' } },
      { type: 'text',     icon: '🛡️', label: 'ระยะเวลารับประกัน',  preset: { label: 'ระยะเวลารับประกัน', placeholder: 'เช่น 1 ปี', sampleValue: '1 ปี' } },
      { type: 'text',     icon: '🔢', label: 'Serial Number',      preset: { label: 'หมายเลขเครื่อง (S/N)', sampleValue: 'SN-20680515-001' } },
      { type: 'dropdown', icon: '↩️', label: 'เหตุผลคืนสินค้า',   preset: { label: 'เหตุผลคืนสินค้า', options: ['เปลี่ยนใจ', 'ชำรุด/เสียหาย', 'ผิดสินค้า', 'อื่นๆ'], sampleValue: 'ชำรุด/เสียหาย' } },
      { type: 'text',     icon: '🎁', label: 'รหัสโปรโมชั่น',     preset: { label: 'รหัสโปรโมชั่น', placeholder: 'PROMO-XXXX', sampleValue: 'PROMO-2568' } },
      { type: 'number',   icon: '⭐', label: 'แต้มสะสม',           preset: { label: 'แต้มสะสม', sampleValue: '1500' } },
    ],
  },
  {
    name: '🔧 ซ่อมบำรุง/QC',
    items: [
      { type: 'text',         icon: '🔧', label: 'รหัสทรัพย์สิน',     preset: { label: 'รหัสทรัพย์สิน / ครุภัณฑ์', sampleValue: 'ASSET-2568-001' } },
      { type: 'dropdown',     icon: '🛠️', label: 'ประเภทงานซ่อม',     preset: { label: 'ประเภทงานซ่อม', options: ['ซ่อม', 'ตรวจสอบ', 'เปลี่ยนอะไหล่', 'PM ประจำงวด'], sampleValue: 'ตรวจสอบ' } },
      { type: 'multiline',    icon: '📝', label: 'อาการเสีย',          preset: { label: 'อาการเสีย / ข้อบกพร่อง', sampleValue: 'เครื่องไม่ติด มีกลิ่นไหม้' } },
      { type: 'photo_upload', icon: '📸', label: 'รูปก่อน-หลังซ่อม',  preset: { label: 'รูปก่อน / หลังซ่อม' } },
      { type: 'text',         icon: '👨‍🔧', label: 'รหัสช่าง',           preset: { label: 'รหัสช่าง / ผู้ซ่อม', sampleValue: 'TECH-001' } },
      { type: 'table',        icon: '📋', label: 'อะไหล่ที่ใช้',       preset: { label: 'อะไหล่ที่ใช้', tableColumns: ['รายการ', 'จำนวน', 'หน่วย'], tableRows: 4 } },
      { type: 'date',         icon: '📅', label: 'วันนัดซ่อมถัดไป',    preset: { label: 'วันนัดซ่อมถัดไป', sampleValue: '20 พ.ค. 2568' } },
      { type: 'inspection',   icon: '✅', label: 'ผลตรวจสอบ QC',      preset: { label: 'ผลตรวจสอบ QC', sampleValue: 'ผ่าน' } },
    ],
  },
]

interface Props {
  onAdd: (type: FormFieldType, preset?: Partial<FormField>) => void
}

export function FieldPalette({ onAdd }: Props) {
  return (
    <div className="w-56 shrink-0 bg-white border border-gray-200 rounded-lg overflow-y-auto max-h-[calc(100vh-160px)]">
      <div className="px-3 py-2 border-b border-gray-100 bg-amber-50">
        <p className="text-xs font-bold text-amber-800">Field Types</p>
        <p className="text-xs text-amber-600">คลิกเพื่อเพิ่มลงฟอร์ม</p>
      </div>
      {PALETTE_GROUPS.map(g => (
        <div key={g.name} className="px-2 py-2 border-b border-gray-100 last:border-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">{g.name}</p>
          {g.items.map((item, idx) => (
            <button
              key={`${item.type}-${idx}`}
              onClick={() => onAdd(item.type, item.preset)}
              className="w-full text-left px-2 py-1.5 rounded text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition-colors"
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
