import Image from 'next/image'
import { ExternalLink, Gamepad2, BarChart3, Globe } from 'lucide-react'

const projects = [
  {
    title: 'Quinta Rota',
    description: 'Projeto de gamificação para treinamento corporativo da Cielo.',
    href: 'https://git.inteli.edu.br/graduacao/2026-1a/t28/g07',
    icon: Gamepad2,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'FinApp',
    description: 'Aplicação web para controle e gestão de finanças pessoais com dashboard interativo.',
    href: 'https://github.com/mateusgalatro/site-controle-finan-as-.git',
    icon: BarChart3,
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    title: 'LinkedIn',
    description: 'Perfil profissional com experiências, habilidades e conexões.',
    href: 'https://www.linkedin.com/in/mateus-galatro/',
    icon: Globe,
    color: 'bg-blue-50 text-blue-600',
  },
]

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function PortfolioPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-indigo-100 shrink-0">
            <Image
              src={`${BASE}/foto-perfil.jpeg`}
              alt="Foto de perfil de Mateus Galatro"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mateus Galatro</h1>
            <p className="text-indigo-600 font-medium text-lg mb-4">Estudante de Engenharia da Computação</p>
            <p className="text-gray-600 leading-relaxed max-w-lg">
              Estudante de Engenharia da Computação no Inteli, apaixonado pelo mercado financeiro e soluções digitais
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Experiência</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 shrink-0">
            <Image
              src={`${BASE}/inteli_finance_logo.jpg`}
              alt="Inteli Finance logo"
              fill
              className="object-contain rounded-lg"
            />
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/company/inteli-finance/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-900 hover:text-indigo-700 transition-colors"
            >
              Inteli Finance
            </a>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">Membro da célula de M&amp;A</span>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <div className="relative w-12 h-12 shrink-0">
            <Image
              src={`${BASE}/agroTech.jpg`}
              alt="AgroTech Inteli logo"
              fill
              className="object-contain rounded-lg"
            />
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/company/agrotech-inteli/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-900 hover:text-indigo-700 transition-colors"
            >
              AgroTech Inteli
            </a>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">Trainee</span>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <div className="relative w-12 h-12 shrink-0">
            <Image
              src={`${BASE}/techgears.jpg`}
              alt="TechGears logo"
              fill
              className="object-contain rounded-lg"
            />
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/company/tech-gears01/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-900 hover:text-indigo-700 transition-colors"
            >
              TechGears
            </a>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">Diretor de pesquisa</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Projetos</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {projects.map(({ title, description, href, icon: Icon, color }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{description}</p>
            <div className="flex items-center gap-1 text-indigo-600 text-sm font-medium">
              <span>Visitar</span>
              <ExternalLink size={14} />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
