/**
 * Tooltips explicativos para campos de formulário
 * Ajuda usuários leigos a entender o que cada campo significa
 */

export const FORM_TOOLTIPS = {
  // ==========================================
  // DADOS PESSOAIS / CIDADÃO
  // ==========================================
  citizen: {
    name: "Nome completo do cidadão conforme documento oficial (RG ou Certidão de Nascimento)",
    socialName: "Nome pelo qual a pessoa prefere ser chamada, diferente do nome de registro. Usado para pessoas trans ou que usam apelidos",
    cpf: "Cadastro de Pessoa Física - documento com 11 dígitos. Ex: 123.456.789-00",
    rg: "Registro Geral - número da carteira de identidade emitida pelo estado",
    cns: "Cartão Nacional de Saúde (Cartão SUS) - número com 15 dígitos que identifica o cidadão no sistema de saúde",
    birthDate: "Data de nascimento do cidadão. Importante para calcular idade e verificar elegibilidade",
    sex: "Sexo biológico conforme documento oficial: Masculino, Feminino ou Outro",
    motherName: "Nome completo da mãe conforme documento. Usado para identificação do cidadão",
    fatherName: "Nome completo do pai, se conhecido. Campo opcional",
    phone: "Telefone para contato com DDD. Ex: (11) 99999-9999",
    email: "Endereço de e-mail para comunicações e notificações",
    address: "Endereço completo de residência do cidadão",
    postalCode: "CEP - Código de Endereçamento Postal com 8 dígitos. Ex: 01310-100",
    city: "Cidade/município de residência",
    neighborhood: "Bairro de residência",
    state: "Estado/UF de residência",
    number: "Número da residência ou 'S/N' se não houver",
    complement: "Complemento do endereço: apartamento, bloco, casa, etc.",
  },

  // ==========================================
  // REGULAÇÃO / SOLICITAÇÃO
  // ==========================================
  regulation: {
    protocol: "Número único gerado automaticamente para identificar esta solicitação",
    priority: "Nível de urgência: Eletivo (pode aguardar), Urgência (precisa de atenção) ou Emergência (imediato)",
    care: "Tipo de procedimento, exame ou consulta sendo solicitado",
    folder: "Pasta/categoria para organizar a regulação. Ex: Cardiologia, Ortopedia",
    group: "Grupo de especialidade médica relacionado ao procedimento",
    unit: "Unidade de saúde de origem que está fazendo a solicitação",
    professional: "Médico ou profissional de saúde responsável pela solicitação",
    description: "Descrição detalhada do motivo da solicitação e quadro clínico do paciente",
    status: "Situação atual da solicitação: Agendado, Em Análise, Aprovado, Negado, etc.",
    deadline: "Data limite para realização do procedimento",
    notes: "Observações adicionais que podem ajudar na análise da solicitação",
    attachments: "Documentos anexados: laudos, exames, encaminhamentos, etc.",
    cid: "Código Internacional de Doenças - classificação da condição de saúde. Ex: J06.9",
    justification: "Motivo pelo qual o procedimento está sendo solicitado",
  },

  // ==========================================
  // AGENDAMENTO
  // ==========================================
  schedule: {
    date: "Data em que o procedimento será realizado",
    time: "Horário agendado para atendimento",
    professional: "Profissional que irá realizar o atendimento",
    unit: "Unidade de saúde onde será realizado o atendimento",
    status: "Situação do agendamento: Agendado, Confirmado, Realizado, Faltou, etc.",
    notes: "Observações sobre o agendamento, instruções de preparo, etc.",
    recurrence: "Se o agendamento deve se repetir: Único, Semanal, Mensal, etc.",
  },

  // ==========================================
  // UNIDADE DE SAÚDE
  // ==========================================
  unit: {
    name: "Nome oficial da unidade de saúde",
    cnes: "Código Nacional de Estabelecimento de Saúde - identificação única da unidade no sistema nacional",
    type: "Tipo da unidade: UBS, Hospital, Clínica, CAPS, etc.",
    phone: "Telefone de contato da unidade",
    email: "E-mail institucional da unidade",
    address: "Endereço completo da unidade de saúde",
  },

  // ==========================================
  // PROFISSIONAL / USUÁRIO
  // ==========================================
  professional: {
    name: "Nome completo do profissional",
    cpf: "CPF do profissional - usado para identificação",
    email: "E-mail para acesso ao sistema e notificações",
    phone: "Telefone de contato do profissional",
    role: "Perfil de acesso no sistema: Administrador, Médico, Digitador, etc.",
    registryType: "Tipo de registro profissional: CRM, CRO, COREN, etc.",
    registryNumber: "Número do registro no conselho profissional",
    registryState: "Estado/UF do registro profissional",
    specialty: "Especialidade médica ou área de atuação",
  },

  // ==========================================
  // FORNECEDOR
  // ==========================================
  supplier: {
    name: "Razão social ou nome fantasia do fornecedor",
    cnpj: "CNPJ do fornecedor - Cadastro Nacional de Pessoa Jurídica",
    email: "E-mail de contato comercial",
    phone: "Telefone de contato",
    contactName: "Nome da pessoa de contato no fornecedor",
    address: "Endereço comercial do fornecedor",
    services: "Serviços ou produtos oferecidos pelo fornecedor",
  },

  // ==========================================
  // CUIDADO / PROCEDIMENTO
  // ==========================================
  care: {
    name: "Nome do procedimento, exame ou consulta",
    code: "Código SIGTAP ou interno do procedimento",
    group: "Grupo de classificação do procedimento",
    subGroup: "Subgrupo para classificação mais específica",
    complexity: "Nível de complexidade: Baixa, Média ou Alta",
    gender: "Sexo para o qual o procedimento se aplica, se houver restrição",
    minAge: "Idade mínima para realizar o procedimento",
    maxAge: "Idade máxima para realizar o procedimento",
    description: "Descrição detalhada do que é o procedimento",
  },

  // ==========================================
  // GRUPO / PASTA
  // ==========================================
  group: {
    name: "Nome do grupo de especialidade. Ex: Cardiologia, Neurologia",
    code: "Código identificador do grupo",
    description: "Descrição do que o grupo abrange",
  },

  folder: {
    name: "Nome da pasta para organização. Ex: Exames de Imagem",
    responsible: "Profissional responsável pela pasta",
    description: "Descrição do conteúdo da pasta",
  },

  // ==========================================
  // TEMPLATE / DOCUMENTO
  // ==========================================
  template: {
    name: "Nome do modelo de documento",
    category: "Categoria do documento: Laudo, Encaminhamento, Receita, etc.",
    content: "Conteúdo do modelo com variáveis que serão substituídas",
    variables: "Variáveis disponíveis para usar no modelo. Ex: {{nome_paciente}}",
  },

  // ==========================================
  // ASSINANTE / MUNICÍPIO
  // ==========================================
  subscriber: {
    name: "Nome do órgão ou secretaria de saúde",
    municipalityName: "Nome do município",
    cnpj: "CNPJ do órgão público",
    email: "E-mail institucional para comunicações",
    phone: "Telefone de contato",
    subscriptionStatus: "Status da assinatura: Ativo (em dia), Atrasado, Desbloqueio Temporário ou Bloqueado",
  },

  // ==========================================
  // ESTOQUE
  // ==========================================
  stock: {
    name: "Nome do item/medicamento",
    barcode: "Código de barras do produto",
    lot: "Número do lote do fabricante",
    expiryDate: "Data de validade do lote",
    quantity: "Quantidade em estoque ou sendo movimentada",
    minStock: "Quantidade mínima para alertar reposição",
    unitMeasure: "Unidade de medida: comprimido, ml, mg, etc.",
    supplier: "Fornecedor do item",
  },

  // ==========================================
  // WHATSAPP / NOTIFICAÇÃO
  // ==========================================
  whatsapp: {
    name: "Nome para identificar esta mensagem programada",
    triggerType: "Quando a mensagem deve ser enviada: Mudança de status, Lembrete, etc.",
    bodyText: "Texto da mensagem que será enviada. Use variáveis como {{nome}}",
    delayMinutes: "Tempo de espera antes de enviar a mensagem (em minutos)",
  },
} as const

// Tipo helper para autocomplete
export type FormTooltipCategory = keyof typeof FORM_TOOLTIPS
export type FormTooltipField<T extends FormTooltipCategory> = keyof typeof FORM_TOOLTIPS[T]
