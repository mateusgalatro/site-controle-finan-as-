'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, TrendingUp, TrendingDown, Sparkles, RefreshCw, Loader2 } from 'lucide-react'
import { createInvestment, deleteInvestment, fetchMarketPrice as fetchPrice, listInvestments, updateInvestment } from '@/lib/supabase/data'

const INVESTMENT_TYPES = [
  { value: 'stock', label: 'Ações' },
  { value: 'fixed_income', label: 'Renda Fixa' },
  { value: 'fund', label: 'Fundo' },
  { value: 'crypto', label: 'Criptomoeda' },
  { value: 'other', label: 'Outro' },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function ReturnBadge({ pct }) {
  const positive = pct >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {positive ? '+' : ''}{pct.toFixed(2)}%
    </span>
  )
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pricesRefreshing, setPricesRefreshing] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const [form, setForm] = useState({
    name: '', type: 'stock', ticker: '',
    quantity: '', avg_price: '', date: new Date().toISOString().split('T')[0],
  })

  const [priceData, setPriceData] = useState(null)   // { price, name, changePct, ticker }
  const [priceFetching, setPriceFetching] = useState(false)
  const [priceError, setPriceError] = useState('')
  const tickerDebounceRef = useRef(null)

  async function fetchMarketPrice(ticker) {
    if (!ticker.trim()) { setPriceData(null); setPriceError(''); return }
    setPriceFetching(true)
    setPriceError('')
    setPriceData(null)
    try {
      const data = await fetchPrice(ticker)
      setPriceData(data)
      setForm((f) => ({ ...f, current_price: String(data.price) }))
    } catch (err) {
      setPriceError(err.message || 'Erro ao buscar cotacao')
    } finally {
      setPriceFetching(false)
    }
  }

  function handleTickerChange(value) {
    setForm((f) => ({ ...f, ticker: value }))
    setPriceData(null)
    setPriceError('')
    clearTimeout(tickerDebounceRef.current)
    if (value.trim().length >= 2) {
      tickerDebounceRef.current = setTimeout(() => fetchMarketPrice(value), 700)
    }
  }

  function handleDialogClose(isOpen) {
    setOpen(isOpen)
    if (!isOpen) {
      setPriceData(null)
      setPriceError('')
    }
  }

  async function refreshPrices(list) {
    const withTicker = list.filter(i => i.ticker)
    if (withTicker.length === 0) return
    setPricesRefreshing(true)

    const results = await Promise.allSettled(
      withTicker.map(async (inv) => {
        try {
          const d = await fetchPrice(inv.ticker)
          return { id: inv.id, price: d.price, inv }
        } catch { return null }
      })
    )

    const updates = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)

    if (updates.length > 0) {
      setInvestments(prev => prev.map(inv => {
        const upd = updates.find(u => u.id === inv.id)
        return upd ? { ...inv, current_price: upd.price } : inv
      }))

      // Persist updated prices to DB silently
      updates.forEach(({ id, price, inv }) => {
        updateInvestment(id, { ...inv, current_price: price })
      })
    }

    setPricesRefreshing(false)
  }

  async function loadInvestments() {
    setLoading(true)
    const data = await listInvestments()
    const list = Array.isArray(data) ? data : []
    setInvestments(list)
    setLoading(false)
    refreshPrices(list)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadInvestments() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.type || !form.quantity || !form.avg_price || !form.date) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    if (form.ticker.trim() && priceFetching) {
      setError('Aguarde a cotação ser carregada.')
      return
    }
    setSaving(true)
    const current_price = priceData?.price ?? Number(form.avg_price)
    const invested_amount = Number(form.quantity) * Number(form.avg_price)
    await createInvestment({ ...form, current_price, invested_amount })
    setOpen(false)
    setForm({ name: '', type: 'stock', ticker: '', quantity: '', avg_price: '', date: new Date().toISOString().split('T')[0] })
    setPriceData(null)
    setPriceError('')
    setSaving(false)
    loadInvestments()
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este investimento?')) return
    await deleteInvestment(id)
    loadInvestments()
  }

  async function handleAiAnalysis() {
    setAiAnalysis('')
    setAiError('A analise com IA depende de uma API server-side e fica desativada no GitHub Pages para nao expor a chave.')
    setAiLoading(false)
  }

  const totalInvested = investments.reduce((sum, i) => sum + Number(i.invested_amount), 0)
  const currentTotal = investments.reduce((sum, i) => sum + (Number(i.current_price) * Number(i.quantity)), 0)
  const totalReturnPct = totalInvested > 0 ? ((currentTotal - totalInvested) / totalInvested * 100) : 0
  const totalReturnValue = currentTotal - totalInvested

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investimentos</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 text-sm">Acompanhe sua carteira de investimentos</p>
            {pricesRefreshing && (
              <span className="flex items-center gap-1 text-xs text-indigo-500">
                <Loader2 size={11} className="animate-spin" /> Atualizando preços...
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => { setOpen(true); setPriceData(null); setPriceError('') }} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus size={16} /> Novo Investimento
        </Button>
      </div>

      {/* Resumo da carteira */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Investido</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Valor Atual</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(currentTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Rentabilidade Total</p>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-2xl font-bold ${totalReturnValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReturnValue >= 0 ? '+' : ''}{formatCurrency(totalReturnValue)}
              </p>
              <ReturnBadge pct={totalReturnPct} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de investimentos */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-12 text-gray-400 text-sm">Carregando...</p>
          ) : investments.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-400 text-sm">Nenhum investimento cadastrado.</p>
              <Button onClick={() => { setOpen(true); setPriceData(null); setPriceError('') }} variant="outline" className="mt-4 gap-2">
                <Plus size={16} /> Adicionar primeiro investimento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ativo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qtd</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço Médio</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço Atual</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rentab.</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor Atual</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {investments.map((inv) => {
                    const returnPct = ((Number(inv.current_price) - Number(inv.avg_price)) / Number(inv.avg_price)) * 100
                    const currentValue = Number(inv.current_price) * Number(inv.quantity)
                    const typeLabel = INVESTMENT_TYPES.find((t) => t.value === inv.type)?.label || inv.type
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{inv.name}</p>
                            {inv.ticker && <p className="text-xs text-gray-400 font-mono">{inv.ticker}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700">{Number(inv.quantity).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}</td>
                        <td className="px-4 py-4 text-right text-gray-700">{formatCurrency(Number(inv.avg_price))}</td>
                        <td className="px-4 py-4 text-right text-gray-700">{formatCurrency(Number(inv.current_price))}</td>
                        <td className="px-4 py-4 text-right">
                          <ReturnBadge pct={returnPct} />
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatCurrency(currentValue)}</td>
                        <td className="px-4 py-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                            onClick={() => handleDelete(inv.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise IA */}
      <div className="space-y-3">
        <Button
          onClick={handleAiAnalysis}
          disabled={aiLoading || investments.length === 0}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
        >
          <Sparkles size={16} />
          {aiLoading ? 'Analisando com IA...' : 'Analisar Carteira com IA'}
        </Button>

        {aiLoading && (
          <Card className="border-indigo-100 bg-indigo-50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 text-indigo-600">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-medium">Analisando sua carteira com inteligência artificial...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {aiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{aiError}</div>
        )}

        {aiAnalysis && !aiLoading && (
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-indigo-800">
                <Sparkles size={16} className="text-purple-500" />
                Análise da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {aiAnalysis}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal novo investimento */}
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Investimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-gray-700">Nome *</label>
                <Input placeholder="Ex: Petrobras, Tesouro Direto..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tipo *</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Ticker</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: PETR4, BTC..."
                    value={form.ticker}
                    onChange={(e) => handleTickerChange(e.target.value)}
                    className="flex-1"
                  />
                  {form.ticker.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fetchMarketPrice(form.ticker)}
                      disabled={priceFetching}
                      title="Atualizar cotação"
                    >
                      {priceFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    </Button>
                  )}
                </div>
                {form.ticker.trim() && (
                  <div className="mt-1.5 min-h-[20px]">
                    {priceFetching && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Loader2 size={11} className="animate-spin" /> Buscando cotação...
                      </span>
                    )}
                    {!priceFetching && priceError && (
                      <span className="text-xs text-red-500">{priceError} — verifique o ticker</span>
                    )}
                    {!priceFetching && priceData && (
                      <span className="flex items-center gap-2 text-xs text-gray-600">
                        Cotação atual: <strong className="text-gray-900">{formatCurrency(priceData.price)}</strong>
                        <ReturnBadge pct={priceData.changePct} />
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Quantidade *</label>
                <Input type="number" step="0.000001" min="0" placeholder="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Preço Médio (R$) *</label>
                <Input type="number" step="0.0001" min="0" placeholder="0,00" value={form.avg_price} onChange={(e) => setForm({ ...form, avg_price: e.target.value })} required />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-gray-700">Data *</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>

            {form.quantity && form.avg_price && (
              <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-700">
                Total investido: <strong>{formatCurrency(Number(form.quantity) * Number(form.avg_price))}</strong>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={saving || priceFetching}>
                {saving ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
