import { PublicHeader } from "@/components/public/PublicHeader"
import { PublicFooter } from "@/components/public/PublicFooter"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Política de Privacidade</h1>
            <p className="text-muted-foreground">Última atualização: Janeiro 2026</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p>
              A sua privacidade é importante para nós. É política do <strong>Regula</strong> respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Regula e outros sites que possuímos e operamos.
            </p>

            <h3>1. Informações que coletamos</h3>
            <p>
              Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
            </p>
            <p>
              Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
            </p>

            <h3>2. Compartilhamento de dados</h3>
            <p>
              Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
            </p>

            <h3>3. Cookies</h3>
            <p>
              O nosso site usa cookies para melhorar a experiência do usuário. Ao continuar a usar nosso site, você concorda com o uso de cookies.
            </p>

            <h3>4. Compromisso do Usuário</h3>
            <p>
              O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o Regula oferece no site e com caráter enunciativo, mas não limitativo:
            </p>
            <ul>
              <li>A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé e à ordem pública;</li>
              <li>B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</li>
              <li>C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do Regula, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.</li>
            </ul>

            <h3>5. LGPD</h3>
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir e excluir seus dados pessoais. Para exercer seus direitos, entre em contato conosco.
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
