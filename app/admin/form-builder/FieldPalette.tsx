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
      { type: 'page_break',     icon: '📃', label: 'ขึ้นหน้าใหม่' },
    ],
  },
  {
    name: '💰 การเงิน',
    items: [
      { type: 'currency', icon: '💲', label: 'จำนวนเงิน',    preset: { label: 'จำนวนเงิน' } },
      { type: 'text',     icon: '🏦', label: 'เลขบัญชี',     preset: { label: 'เลขบัญชีธนาคาร', placeholder: 'XXX-X-XXXXX-X' } },
      { type: 'text',     icon: '🧾', label: 'เลขผู้เสียภาษี', preset: { label: 'เลขประจำตัวผู้เสียภาษี (13 หลัก)' } },
      { type: 'radio',    icon: '💳', label: 'วิธีชำระเงิน', preset: { label: 'วิธีชำระเงิน', options: ['เงินสด', 'โอนเงิน', 'เช็ค', 'บัตรเครดิต'] } },
      { type: 'text',     icon: '📝', label: 'รายละเอียดเช็ค', preset: { label: 'รายละเอียดเช็ค (เลขที่ / ธนาคาร / วันที่)' } },
      { type: 'text',     icon: '🗂️', label: 'รหัสงบประมาณ', preset: { label: 'รหัสงบประมาณ' } },
      { type: 'dropdown', icon: '📉', label: 'หัก ณ ที่จ่าย', preset: { label: 'หัก ณ ที่จ่าย', options: ['1%', '3%', '5%', 'ไม่หัก'] } },
      { type: 'text',     icon: '🏷️', label: 'ส่วนลด',        preset: { label: 'ส่วนลด', placeholder: '% หรือ บาท' } },
      { type: 'text',     icon: '💰', label: 'ยอดมัดจำ',      preset: { label: 'ยอดมัดจำ / ยอดที่เหลือ' } },
    ],
  },
  {
    name: '🏥 การแพทย์',
    items: [
      { type: 'dropdown',      icon: '🩸', label: 'หมู่เลือด',         preset: { label: 'หมู่เลือด', options: ['A', 'B', 'AB', 'O', 'ไม่ทราบ'] } },
      { type: 'multiline',     icon: '⚠️', label: 'รายการแพ้',         preset: { label: 'รายการแพ้ (ยา / อาหาร)', placeholder: 'ระบุรายการที่แพ้' } },
      { type: 'multiline',     icon: '📋', label: 'ประวัติการรักษา',    preset: { label: 'ประวัติการรักษา' } },
      { type: 'weight_height', icon: '⚖️', label: 'น้ำหนัก / ส่วนสูง', preset: { label: 'น้ำหนัก / ส่วนสูง' } },
      { type: 'text',          icon: '🩺', label: 'Vital Signs',        preset: { label: 'Vital Signs', placeholder: 'ความดัน / ชีพจร / อุณหภูมิ' } },
      { type: 'text',          icon: '💊', label: 'ขนาดยา',             preset: { label: 'ขนาดยาและความถี่', placeholder: 'เช่น 500mg วันละ 2 ครั้ง' } },
      { type: 'text',          icon: '🔬', label: 'ICD Code',           preset: { label: 'ICD Code', placeholder: 'เช่น J06.9' } },
      { type: 'text',          icon: '📜', label: 'เลขใบประกอบวิชาชีพ', preset: { label: 'เลขใบประกอบวิชาชีพแพทย์' } },
    ],
  },
  {
    name: '🏗️ วิศวกรรม',
    items: [
      { type: 'dimension',  icon: '📐', label: 'ขนาด W×L×H',        preset: { label: 'ขนาด (กว้าง × ยาว × สูง)' } },
      { type: 'dropdown',   icon: '📏', label: 'หน่วยวัด',           preset: { label: 'หน่วยวัด', options: ['เมตร', 'เซนติเมตร', 'นิ้ว', 'ฟุต', 'มิลลิเมตร'] } },
      { type: 'text',       icon: '🗺️', label: 'เลขที่แบบ',          preset: { label: 'เลขที่แบบ / Revision', placeholder: 'เช่น DWG-001 Rev.A' } },
      { type: 'table',      icon: '📦', label: 'รายการวัสดุ',         preset: { label: 'รายการวัสดุ', tableColumns: ['รายการ', 'ปริมาณ', 'หน่วย', 'หมายเหตุ'], tableRows: 5 } },
      { type: 'inspection', icon: '✅', label: 'ผ่าน/ไม่ผ่าน/แก้ไข', preset: { label: 'ผลการตรวจสอบ' } },
      { type: 'gps',        icon: '📍', label: 'พิกัด GPS',           preset: { label: 'พิกัดสถานที่ก่อสร้าง' } },
      { type: 'photo_upload',icon: '📸', label: 'รูปหน้างาน',          preset: { label: 'รูปภาพหน้างาน / หลักฐาน' } },
      { type: 'text',       icon: '🏗️', label: 'As-Built Reference',  preset: { label: 'อ้างอิงแบบก่อสร้างจริง' } },
    ],
  },
  {
    name: '⚖️ กฎหมาย',
    items: [
      { type: 'id_card',   icon: '🪪', label: 'เลขบัตรประชาชน',   preset: { label: 'เลขบัตรประชาชน 13 หลัก' } },
      { type: 'text',      icon: '🛂', label: 'เลขพาสปอร์ต',      preset: { label: 'เลขพาสปอร์ต' } },
      { type: 'text',      icon: '👥', label: 'ชื่อพยาน',          preset: { label: 'ชื่อพยาน' } },
      { type: 'text',      icon: '🔏', label: 'ผู้รับรองเอกสาร',   preset: { label: 'ผู้รับรองเอกสาร' } },
      { type: 'date_range',icon: '📅', label: 'ระยะเวลาสัญญา',    preset: { label: 'ระยะเวลาสัญญา (วันเริ่ม – สิ้นสุด)' } },
      { type: 'multiline', icon: '⚠️', label: 'ค่าปรับ / เงื่อนไข',preset: { label: 'ค่าปรับและเงื่อนไข' } },
      { type: 'dropdown',  icon: '🏛️', label: 'ศาลที่มีอำนาจ',    preset: { label: 'ศาลที่มีอำนาจ', options: ['ศาลแพ่ง', 'ศาลอาญา', 'ศาลแรงงาน', 'ศาลปกครอง'] } },
      { type: 'text',      icon: '📝', label: 'ช่องแก้ไขสัญญา',   preset: { label: 'การแก้ไขสัญญา + วันที่' } },
    ],
  },
  {
    name: '🚚 โลจิสติกส์',
    items: [
      { type: 'text',     icon: '📦', label: 'หมายเลขพัสดุ',      preset: { label: 'หมายเลขพัสดุ (Tracking)' } },
      { type: 'barcode',  icon: '📊', label: 'Barcode / QR Code',  preset: { label: 'Barcode / QR Code' } },
      { type: 'text',     icon: '⚖️', label: 'น้ำหนัก/ขนาดพัสดุ', preset: { label: 'น้ำหนัก / ขนาดพัสดุ', placeholder: 'น้ำหนัก (kg) / ขนาด (ซม.)' } },
      { type: 'text',     icon: '🗺️', label: 'ต้นทาง → ปลายทาง', preset: { label: 'ต้นทาง → ปลายทาง' } },
      { type: 'text',     icon: '🚗', label: 'ทะเบียนรถ',          preset: { label: 'ทะเบียนรถ' } },
      { type: 'text',     icon: '🪪', label: 'ใบขับขี่คนขับ',      preset: { label: 'เลขที่ใบขับขี่' } },
      { type: 'dropdown', icon: '🚚', label: 'สถานะการจัดส่ง',    preset: { label: 'สถานะการจัดส่ง', options: ['รอจัดส่ง', 'อยู่ระหว่างจัดส่ง', 'จัดส่งแล้ว', 'ไม่สำเร็จ'] } },
      { type: 'text',     icon: '🌡️', label: 'อุณหภูมิ Cold Chain',preset: { label: 'อุณหภูมิ Cold Chain', placeholder: '°C' } },
      { type: 'text',     icon: '🛃', label: 'HS Code',             preset: { label: 'พิกัดศุลกากร (HS Code)' } },
    ],
  },
  {
    name: '🎓 การศึกษา',
    items: [
      { type: 'text',     icon: '🎓', label: 'รหัสนักเรียน/นศ.',  preset: { label: 'รหัสนักเรียน / นักศึกษา' } },
      { type: 'text',     icon: '📊', label: 'คะแนน / เกรด',      preset: { label: 'คะแนน / เกรด', placeholder: 'เช่น 85 / A' } },
      { type: 'text',     icon: '📈', label: 'GPA',               preset: { label: 'เกรดเฉลี่ย (GPA)', placeholder: '0.00 – 4.00' } },
      { type: 'text',     icon: '📚', label: 'รหัสวิชา',           preset: { label: 'รหัสวิชา' } },
      { type: 'text',     icon: '📅', label: 'ปีการศึกษา',         preset: { label: 'ปีการศึกษา / ภาคเรียน', placeholder: 'เช่น 2567/1' } },
      { type: 'text',     icon: '👨‍👩‍👧', label: 'ข้อมูลผู้ปกครอง',   preset: { label: 'ชื่อ-นามสกุลผู้ปกครอง' } },
      { type: 'dropdown', icon: '🏆', label: 'ประเภททุน',          preset: { label: 'ประเภททุนการศึกษา', options: ['ทุนเรียนดี', 'ทุนขาดแคลน', 'ทุนกู้ยืม', 'ทุนผู้พิการ'] } },
      { type: 'text',     icon: '📋', label: 'อ้างอิง Transcript', preset: { label: 'เลขที่ Transcript' } },
    ],
  },
  {
    name: '🏨 โรงแรม/บริการ',
    items: [
      { type: 'text',      icon: '🎫', label: 'หมายเลขการจอง',      preset: { label: 'หมายเลขการจอง (Booking Ref.)' } },
      { type: 'date_range',icon: '🗓️', label: 'Check-in / Check-out',preset: { label: 'Check-in / Check-out' } },
      { type: 'dropdown',  icon: '🛏️', label: 'ประเภทห้อง',          preset: { label: 'ประเภทห้อง', options: ['Standard', 'Deluxe', 'Suite', 'Family'] } },
      { type: 'number',    icon: '👥', label: 'จำนวนผู้เข้าพัก',     preset: { label: 'จำนวนผู้เข้าพัก' } },
      { type: 'dropdown',  icon: '🍽️', label: 'ความต้องการอาหาร',    preset: { label: 'ความต้องการด้านอาหาร', options: ['ทั่วไป', 'มังสวิรัติ', 'อาหารฮาลาล', 'ไม่กินหมู'] } },
      { type: 'dropdown',  icon: '🌏', label: 'สัญชาติ',             preset: { label: 'สัญชาติ', options: ['ไทย', 'จีน', 'ญี่ปุ่น', 'เกาหลี', 'อื่นๆ'] } },
      { type: 'text',      icon: '💳', label: 'เลขสมาชิก',           preset: { label: 'เลขสมาชิก (Loyalty Card)' } },
    ],
  },
  {
    name: '🏛️ ราชการ',
    items: [
      { type: 'text',     icon: '🏛️', label: 'รหัสหน่วยงาน',    preset: { label: 'รหัสหน่วยงาน' } },
      { type: 'text',     icon: '📅', label: 'ปีงบประมาณ',       preset: { label: 'ปีงบประมาณ พ.ศ.', placeholder: 'พ.ศ. 2568' } },
      { type: 'dropdown', icon: '🛒', label: 'วิธีจัดซื้อจัดจ้าง',preset: { label: 'วิธีจัดซื้อจัดจ้าง', options: ['วิธีเฉพาะเจาะจง', 'วิธีคัดเลือก', 'วิธีประกวดราคา'] } },
      { type: 'dropdown', icon: '🔒', label: 'ระดับความลับ',     preset: { label: 'ระดับความลับ', options: ['ปกติ', 'ลับ', 'ลับมาก'] } },
      { type: 'text',     icon: '👔', label: 'ตำแหน่งราชการ',    preset: { label: 'ตำแหน่งราชการ' } },
      { type: 'text',     icon: '🏢', label: 'กระทรวง / กรม',    preset: { label: 'กระทรวง / กรม / หน่วยงาน' } },
    ],
  },
  {
    name: '🛒 อีคอมเมิร์ซ',
    items: [
      { type: 'text',     icon: '🏷️', label: 'รหัสสินค้า (SKU)',  preset: { label: 'รหัสสินค้า (SKU)', placeholder: 'SKU-XXXXX' } },
      { type: 'number',   icon: '🔢', label: 'จำนวนสินค้า',       preset: { label: 'จำนวนสินค้า' } },
      { type: 'dropdown', icon: '🎨', label: 'สี / ไซส์',         preset: { label: 'สี / ไซส์', options: ['S', 'M', 'L', 'XL', 'XXL'] } },
      { type: 'text',     icon: '🛡️', label: 'ระยะเวลารับประกัน', preset: { label: 'ระยะเวลารับประกัน', placeholder: 'เช่น 1 ปี' } },
      { type: 'text',     icon: '🔢', label: 'Serial Number',     preset: { label: 'หมายเลขเครื่อง (S/N)' } },
      { type: 'dropdown', icon: '↩️', label: 'เหตุผลคืนสินค้า',  preset: { label: 'เหตุผลคืนสินค้า', options: ['เปลี่ยนใจ', 'ชำรุด/เสียหาย', 'ผิดสินค้า', 'อื่นๆ'] } },
      { type: 'text',     icon: '🎁', label: 'รหัสโปรโมชั่น',    preset: { label: 'รหัสโปรโมชั่น', placeholder: 'PROMO-XXXX' } },
      { type: 'number',   icon: '⭐', label: 'แต้มสะสม',          preset: { label: 'แต้มสะสม' } },
    ],
  },
  {
    name: '🔧 ซ่อมบำรุง/QC',
    items: [
      { type: 'text',         icon: '🔧', label: 'รหัสทรัพย์สิน',    preset: { label: 'รหัสทรัพย์สิน / ครุภัณฑ์' } },
      { type: 'dropdown',     icon: '🛠️', label: 'ประเภทงานซ่อม',    preset: { label: 'ประเภทงานซ่อม', options: ['ซ่อม', 'ตรวจสอบ', 'เปลี่ยนอะไหล่', 'PM ประจำงวด'] } },
      { type: 'multiline',    icon: '📝', label: 'อาการเสีย',         preset: { label: 'อาการเสีย / ข้อบกพร่อง' } },
      { type: 'photo_upload', icon: '📸', label: 'รูปก่อน-หลังซ่อม', preset: { label: 'รูปก่อน / หลังซ่อม' } },
      { type: 'text',         icon: '👨‍🔧', label: 'รหัสช่าง',          preset: { label: 'รหัสช่าง / ผู้ซ่อม' } },
      { type: 'table',        icon: '📋', label: 'อะไหล่ที่ใช้',      preset: { label: 'อะไหล่ที่ใช้', tableColumns: ['รายการ', 'จำนวน', 'หน่วย'], tableRows: 4 } },
      { type: 'date',         icon: '📅', label: 'วันนัดซ่อมถัดไป',   preset: { label: 'วันนัดซ่อมถัดไป' } },
      { type: 'inspection',   icon: '✅', label: 'ผลตรวจสอบ QC',     preset: { label: 'ผลตรวจสอบ QC' } },
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
