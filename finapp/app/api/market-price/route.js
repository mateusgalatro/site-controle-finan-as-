import { NextResponse } from 'next/server'

// Maps common B3 tickers to Yahoo Finance format automatically
function toYahooSymbol(ticker) {
  const t = ticker.trim().toUpperCase()
  // If already has a dot (e.g. PETR4.SA, BTC-USD) — use as-is
  if (t.includes('.') || t.includes('-')) return t
  // Crypto shorthand
  const cryptoMap = { BTC: 'BTC-USD', ETH: 'ETH-USD', SOL: 'SOL-USD', BNB: 'BNB-USD' }
  if (cryptoMap[t]) return cryptoMap[t]
  // Default: B3 stock → append .SA
  return `${t}.SA`
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'Ticker obrigatório' }, { status: 400 })

  const symbol = toYahooSymbol(ticker)

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 60 },
      }
    )

    if (!res.ok) return NextResponse.json({ error: 'Ativo não encontrado' }, { status: 404 })

    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) {
      return NextResponse.json({ error: 'Preço não disponível para este ticker' }, { status: 404 })
    }

    const currency = meta.currency === 'BRL' ? 'BRL' : meta.currency
    const previousClose = meta.chartPreviousClose || meta.previousClose
    const price = meta.regularMarketPrice
    const changePct = previousClose ? ((price - previousClose) / previousClose) * 100 : 0

    return NextResponse.json({
      ticker: meta.symbol,
      name: meta.longName || meta.shortName || symbol,
      price,
      currency,
      changePct,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar cotação' }, { status: 500 })
  }
}
