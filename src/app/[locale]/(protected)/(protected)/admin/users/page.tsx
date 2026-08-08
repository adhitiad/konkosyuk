'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, Edit01Icon, Delete01Icon } from '@hugeicons/core-free-icons'
import { toast } from '@/components/ui/toast'

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

interface UsersResponse {
  data: User[]
  meta: {
    total: number
  }
}

const roleOptions = [
  { value: 'cust', label: 'Customer' },
  { value: 'owner', label: 'Owner' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
]

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const limit = 10

  const { data, isLoading, isError, error, refetch } = useQuery<UsersResponse>({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)

      const res = await fetch(`/api/users?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      const json = await res.json()
      return { data: json.data?.data, meta: json.data?.meta }
    },
    staleTime: 30000,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ userId, name, role }: { userId: string; name?: string; role?: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to update user')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast({ title: 'User updated', description: 'User data has been changed.', type: 'success' })
      setSelectedUser(null)
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal mengubah user.', type: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to delete user')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast({ title: 'User deleted', description: 'User has been removed.', type: 'success' })
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal menghapus user.', type: 'error' })
    },
  })

  const users = Array.isArray(data?.data) ? data.data : []
  const total = data?.meta?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  const openEdit = (user: User) => {
    setSelectedUser(user)
    setEditName(user.name)
    setEditRole(user.role)
  }

  const handleSaveEdit = () => {
    if (!selectedUser) return
    updateMutation.mutate({
      userId: selectedUser.id,
      name: editName !== selectedUser.name ? editName : undefined,
      role: editRole !== selectedUser.role ? editRole : undefined,
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
        <p className="text-muted-foreground">Kelola semua user di sistem</p>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Gagal memuat data user.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-sm"
        />
        <Select<string> value={roleFilter} onValueChange={(v) => { setRoleFilter(v ?? ''); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Role</SelectItem>
            {roleOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Tidak ada user untuk filter ini.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'staff' ? 'secondary' : user.role === 'owner' ? 'default' : 'outline'} className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(user)}
                          >
                            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select<string> value={editRole} onValueChange={(v) => v && setEditRole(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>Batal</Button>
                <Button disabled={updateMutation.isPending} onClick={handleSaveEdit}>
                  {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Apakah kamu yakin ingin menghapus user &quot;{deleteTarget.name}&quot;? Aksi ini tidak bisa dibatalkan.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
                <Button variant="destructive" disabled={deleteMutation.isPending} onClick={handleDelete}>
                  {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
