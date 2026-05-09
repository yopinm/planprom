import type { ReactElement } from 'react'

export function HowItWorks(): ReactElement {
  const steps = [
    {
      step: '1',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      ),
      title: 'ค้นหาสินค้า',
      desc: 'ใส่ชื่อหรือลิงก์สินค้าจาก Shopee/Lazada',
    },
    {
      step: '2',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-3-3V18m-3-3V18M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9V9Z" />
        </svg>
      ),
      title: 'คำนวณโค้ดซ้อน',
      desc: 'รวมคูปองให้แล้ว ไม่ต้องหาเอง',
    },
    {
      step: '3',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75m0 1.5v.75m0 1.5v.75m0 1.5V15m1.5-11.25h.75m1.5 0h.75m1.5 0h.75m1.5 0H13.5m-3 1.5V15m-3 1.5V15m3 1.5V15m3 1.5V15" />
        </svg>
      ),
      title: 'จ่ายถูกที่สุด',
      desc: 'รู้ราคาสุทธิที่ต้องจ่ายจริงก่อนกดซื้อ',
    },
  ]

  return (
    <section className="mt-4 rounded-3xl border border-neutral-200 bg-white/70 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
        วิธีใช้งาน — ง่ายใน 3 ขั้นตอน
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((item) => (
          <div key={item.step} className="group flex flex-col items-center text-center">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition group-hover:bg-orange-50 group-hover:text-orange-600">
              {item.icon}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[9px] font-black text-white">
                {item.step}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-black text-black">{item.title}</h3>
            <p className="mt-1 text-xs leading-5 text-neutral-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
