import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

async function getAuthUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function POST() {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: investments, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!investments || investments.length === 0) {
    return NextResponse.json({ analysis: 'Você não possui investimentos cadastrados para analisar.' })
  }

  const totalInvested = investments.reduce((sum, i) => sum + Number(i.invested_amount), 0)
  const currentTotal = investments.reduce((sum, i) => sum + (Number(i.current_price) * Number(i.quantity)), 0)
  const totalReturn = ((currentTotal - totalInvested) / totalInvested * 100).toFixed(2)

  const byType = investments.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + Number(i.invested_amount)
    return acc
  }, {})

  const context = `
Carteira de Investimentos:
- Total investido: R$ ${totalInvested.toFixed(2)}
- Valor atual total: R$ ${currentTotal.toFixed(2)}
- Rentabilidade total: ${totalReturn}%

Distribuição por tipo:
${Object.entries(byType).map(([type, value]) => `  - ${type}: R$ ${value.toFixed(2)} (${((value / totalInvested) * 100).toFixed(1)}%)`).join('\n')}

Ativos individuais:
${investments.map((i) => {
    const currentValue = Number(i.current_price) * Number(i.quantity)
    const returnPct = ((Number(i.current_price) - Number(i.avg_price)) / Number(i.avg_price) * 100).toFixed(2)
    return `  - ${i.name}${i.ticker ? ` (${i.ticker})` : ''}: ${i.quantity} unidades | Preço médio: R$ ${Number(i.avg_price).toFixed(2)} | Preço atual: R$ ${Number(i.current_price).toFixed(2)} | Rentabilidade: ${returnPct}%`
  }).join('\n')}
`

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [
      {
        role: 'system',
        content: 'Você é um analista financeiro brasileiro especializado em investimentos. Analise a carteira apresentada e forneça: 1) Avaliação geral da diversificação, 2) Identificação de concentrações de risco, 3) Desempenho geral (positivo/negativo), 4) Duas sugestões práticas de melhoria. Seja direto e objetivo. Responda em português.',
      },
      {
        role: 'user',
        content: context,
      },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  })

  const analysis = completion.choices[0]?.message?.content || 'Não foi possível gerar a análise.'
  return NextResponse.json({ analysis })
}
