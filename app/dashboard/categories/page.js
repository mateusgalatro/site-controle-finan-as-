'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Tag } from 'lucide-react'
import { createCategory, deleteCategory, listCategories } from '@/lib/supabase/data'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', icon: '💰', color: '#6366f1' })

  async function loadCategories() {
    setLoading(true)
    const data = await listCategories()
    setCategories(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadCategories() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name) {
      setError('Nome é obrigatório.')
      return
    }
    setSaving(true)
    await createCategory(form)
    setOpen(false)
    setForm({ name: '', icon: '💰', color: '#6366f1' })
    setSaving(false)
    loadCategories()
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    await deleteCategory(id)
    loadCategories()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 text-sm mt-1">Organize suas transações por categoria</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus size={16} /> Nova Categoria
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-gray-400 text-sm">Carregando...</p>
      ) : categories.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-400 text-sm">Nenhuma categoria cadastrada.</p>
          <Button onClick={() => setOpen(true)} variant="outline" className="mt-4 gap-2">
            <Plus size={16} /> Criar primeira categoria
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-5 text-center relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 size={13} />
                </Button>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-3"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  {cat.icon}
                </div>
                <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-gray-400">{cat.color}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal nova categoria */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nome *</label>
              <Input placeholder="Ex: Alimentação, Transporte..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Ícone (emoji)</label>
              <Input placeholder="Cole um emoji: 🍔 🚗 💊" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Cor</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
                />
                <span className="text-sm text-gray-500">{form.color}</span>
                <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: form.color }} />
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-center py-3 bg-gray-50 rounded-xl">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: form.color + '20' }}
              >
                {form.icon || '💰'}
              </div>
              <span className="ml-3 font-semibold text-gray-700">{form.name || 'Nome da categoria'}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Categoria'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
