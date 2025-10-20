import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'

const cairo = Cairo({ 
  subsets: ['arabic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'نظام إدارة المخزون',
  description: 'نظام متكامل لإدارة المخازن والمبيعات والمشتريات',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className} suppressHydrationWarning>{children}</body>
    </html>
  )
}

