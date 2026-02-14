import { PublicHeader } from "@/components/public/PublicHeader"
import { PublicFooter } from "@/components/public/PublicFooter"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Termos de Uso</h1>
            <p className="text-muted-foreground">Última atualização: Janeiro 2026</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h3>1. Termos</h3>
            <p>
              Ao acessar o site <strong>Regula</strong>, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.
            </p>

            <h3>2. Uso de Licença</h3>
            <p>
              É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site Regula , apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:
            </p>
            <ul>
              <li>modificar ou copiar os materiais;</li>
              <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);</li>
              <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido no site Regula;</li>
              <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
              <li>transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</li>
            </ul>
            <p>
              Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por Regula a qualquer momento. Ao encerrar a visualização desses materiais ou após o término desta licença, você deve apagar todos os materiais baixados em sua posse, seja em formato eletrônico ou impresso.
            </p>

            <h3>3. Isenção de responsabilidade</h3>
            <p>
              Os materiais no site da Regula são fornecidos 'como estão'. Regula não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.
            </p>

            <h3>4. Limitações</h3>
            <p>
              Em nenhum caso o Regula ou seus fornecedores serão responsáveis ​​por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em Regula, mesmo que Regula ou um representante autorizado da Regula tenha sido notificado oralmente ou por escrito da possibilidade de tais danos.
            </p>

            <h3>5. Precisão dos materiais</h3>
            <p>
              Os materiais exibidos no site da Regula podem incluir erros técnicos, tipográficos ou fotográficos. Regula não garante que qualquer material em seu site seja preciso, completo ou atual. Regula pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, Regula não se compromete a atualizar os materiais.
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
