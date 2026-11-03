'use client'
import { useEffect, useState } from 'react'

export default function Founder() {
  const [total, setTotal] = useState(0)
  const [countries, setCountries] = useState<any>({})

  useEffect(() => {
    fetch('/api/visits').then(r => r.json()).then(d => {
      setTotal(d.total || 0)
      setCountries(d.byCountry || {})
    })
  }, [])

  const countriesCount = Object.keys(countries).length

  return (
    <div style={{ padding: 20, background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1>لوحة الفاوندر - حقيقي 100%</h1>
      <div style={{ fontSize: 60, fontWeight: 900, textAlign: 'center', margin: '20px 0' }}>
        {total}
        <div style={{ fontSize: 16, fontWeight: 400 }}>إجمالي الزوار الحقيقيين</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 22, marginBottom: 20 }}>
        {countriesCount} / 125 دولة دخلت
      </div>
      <div style={{ textAlign: 'center', opacity: 0.6 }}>
        {countriesCount === 0 ? 'لسه مفيش زوار حقيقيين... العداد صفر' : JSON.stringify(countries)}
      </div>
    </div>
  )
}