'use client'

import dynamic from 'next/dynamic'
import { Loading } from '@/admin/ui'

const AdminShell = dynamic(() => import('@/admin/AdminShell'), {
  ssr: false,
  loading: () => <Loading />,
})

export default function AdminPage() {
  return <AdminShell />
}
