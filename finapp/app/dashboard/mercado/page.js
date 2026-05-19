'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TradingViewWidget from '@/components/TradingViewWidget'
import { TrendingUp, BarChart3, Search } from 'lucide-react'

const FEATURED_STOCKS = [
  { symbol: 'BMFBOVESPA:PETR4', label: 'PETR4', name: 'Petrobras' },
  { symbol: 'BMFBOVESPA:VALE3', label: 'VALE3', name: 'Vale' },
  { symbol: 'BMFBOVESPA:ITUB4', label: 'ITUB4', name: 'Itaú Unibanco' },
  { symbol: 'BMFBOVESPA:BBDC4', label: 'BBDC4', name: 'Bradesco' },
  { symbol: 'BMFBOVESPA:ABEV3', label: 'ABEV3', name: 'Ambev' },
  { symbol: 'BMFBOVESPA:WEGE3', label: 'WEGE3', name: 'WEG' },
  { symbol: 'BMFBOVESPA:BBAS3', label: 'BBAS3', name: 'Banco do Brasil' },
  { symbol: 'BMFBOVESPA:RENT3', label: 'RENT3', name: 'Localiza' },
]

const TICKER_TAPE_CONFIG = {
  symbols: [
    { proName: 'BMFBOVESPA:IBOV', title: 'IBOVESPA' },
    { proName: 'BMFBOVESPA:PETR4', title: 'Petrobras' },
    { proName: 'BMFBOVESPA:VALE3', title: 'Vale' },
    { proName: 'BMFBOVESPA:ITUB4', title: 'Itaú' },
    { proName: 'BMFBOVESPA:BBDC4', title: 'Bradesco' },
    { proName: 'BMFBOVESPA:ABEV3', title: 'Ambev' },
    { proName: 'BMFBOVESPA:WEGE3', title: 'WEG' },
    { proName: 'BMFBOVESPA:BBAS3', title: 'Banco do Brasil' },
    { proName: 'BMFBOVESPA:RENT3', title: 'Localiza' },
    { proName: 'BMFBOVESPA:MGLU3', title: 'Mag Luiza' },
    { proName: 'BMFBOVESPA:LREN3', title: 'Lojas Renner' },
    { proName: 'BMFBOVESPA:SUZB3', title: 'Suzano' },
    { proName: 'FOREXCOM:USDBRL', title: 'USD/BRL' },
    { proName: 'TVC:GOLD', title: 'Ouro' },
  ],
  showSymbolLogo: true,
  isTransparent: false,
  displayMode: 'adaptive',
  colorTheme: 'light',
  locale: 'br',
}

const MARKET_OVERVIEW_CONFIG = {
  colorTheme: 'light',
  dateRange: '1D',
  showChart: true,
  locale: 'br',
  width: '100%',
  height: 600,
  largeChartUrl: '',
  isTransparent: false,
  showSymbolLogo: true,
  showFloatingTooltip: true,
  plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
  plotLineColorFalling: 'rgba(220, 38, 38, 1)',
  gridLineColor: 'rgba(209, 213, 219, 0.5)',
  scaleFontColor: 'rgba(75, 85, 99, 1)',
  belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.08)',
  belowLineFillColorFalling: 'rgba(220, 38, 38, 0.08)',
  symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
  tabs: [
    {
      title: 'Índices',
      symbols: [
        { s: 'BMFBOVESPA:IBOV', d: 'IBOVESPA' },
        { s: 'BMFBOVESPA:BOVA11', d: 'BOVA11' },
        { s: 'BMFBOVESPA:SMLL11', d: 'Small Caps' },
        { s: 'BMFBOVESPA:IVBX2', d: 'IVBX-2' },
        { s: 'SP:SPX', d: 'S&P 500' },
        { s: 'NASDAQ:NDX', d: 'Nasdaq 100' },
      ],
      originalTitle: 'Indices',
    },
    {
      title: 'Ações BR',
      symbols: [
        { s: 'BMFBOVESPA:PETR4', d: 'Petrobras' },
        { s: 'BMFBOVESPA:VALE3', d: 'Vale' },
        { s: 'BMFBOVESPA:ITUB4', d: 'Itaú' },
        { s: 'BMFBOVESPA:BBDC4', d: 'Bradesco' },
        { s: 'BMFBOVESPA:ABEV3', d: 'Ambev' },
        { s: 'BMFBOVESPA:WEGE3', d: 'WEG' },
        { s: 'BMFBOVESPA:BBAS3', d: 'Banco do Brasil' },
        { s: 'BMFBOVESPA:RENT3', d: 'Localiza' },
      ],
      originalTitle: 'Stocks',
    },
    {
      title: 'Câmbio & Cripto',
      symbols: [
        { s: 'FOREXCOM:USDBRL', d: 'USD/BRL' },
        { s: 'FOREXCOM:EURBRL', d: 'EUR/BRL' },
        { s: 'BITSTAMP:BTCUSD', d: 'Bitcoin' },
        { s: 'BITSTAMP:ETHUSD', d: 'Ethereum' },
        { s: 'TVC:GOLD', d: 'Ouro' },
        { s: 'TVC:USOIL', d: 'Petróleo WTI' },
      ],
      originalTitle: 'Forex & Crypto',
    },
  ],
}

const SCREENER_CONFIG = {
  width: '100%',
  height: 550,
  defaultColumn: 'overview',
  defaultScreen: 'most_capitalized',
  market: 'brazil',
  showToolbar: true,
  colorTheme: 'light',
  locale: 'br',
}

function getChartConfig(symbol) {
  return {
    autosize: true,
    symbol,
    interval: 'D',
    timezone: 'America/Sao_Paulo',
    theme: 'light',
    style: '1',
    locale: 'br',
    toolbar_bg: '#f1f3fa',
    enable_publishing: false,
    allow_symbol_change: true,
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    calendar: false,
    hide_volume: false,
  }
}

export default function MercadoPage() {
  const [selectedStock, setSelectedStock] = useState(FEATURED_STOCKS[0])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mercado</h1>
        <p className="text-gray-500 text-sm mt-1">
          Acompanhe as principais ações, índices e ativos do mercado brasileiro
        </p>
      </div>

      {/* Ticker tape */}
      <Card className="overflow-hidden p-0">
        <TradingViewWidget
          src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
          config={TICKER_TAPE_CONFIG}
          height={56}
        />
      </Card>

      {/* Chart + featured stocks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main chart */}
        <Card className="xl:col-span-2 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-600" />
                Gráfico — {selectedStock.name} ({selectedStock.label})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TradingViewWidget
              key={selectedStock.symbol}
              src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
              config={getChartConfig(selectedStock.symbol)}
              height={420}
            />
          </CardContent>
        </Card>

        {/* Featured stocks list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              Principais Ações BR
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {FEATURED_STOCKS.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-indigo-50 transition-colors ${
                    selectedStock.symbol === stock.symbol ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{stock.label}</p>
                    <p className="text-xs text-gray-500">{stock.name}</p>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Ver →</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market overview */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-600" />
            Visão Geral do Mercado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TradingViewWidget
            src="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
            config={MARKET_OVERVIEW_CONFIG}
            height={620}
          />
        </CardContent>
      </Card>

      {/* Stock screener */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Search size={18} className="text-indigo-600" />
            Screener de Ações — Mercado Brasileiro
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TradingViewWidget
            src="https://s3.tradingview.com/external-embedding/embed-widget-screener.js"
            config={SCREENER_CONFIG}
            height={570}
          />
        </CardContent>
      </Card>
    </div>
  )
}
