// ==========================================
// DADOS DO SIGTAP - Sistema de Gerenciamento da Tabela de Procedimentos
// ==========================================
// Fonte: DATASUS - Tabela Unificada de Procedimentos, Medicamentos e OPM do SUS
// Estrutura: Grupo > SubGrupo > Procedimento

export interface SigtapGroup {
  code: string
  name: string
  subGroups: SigtapSubGroup[]
}

export interface SigtapSubGroup {
  code: string
  name: string
  procedures: SigtapProcedure[]
}

export interface SigtapProcedure {
  code: string
  name: string
  complexity?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'NAO_SE_APLICA'
  financingType?: 'MAC' | 'FAEC' | 'PAB' | 'INCENTIVO'
  instrument?: string
  gender?: 'M' | 'F' | 'AMBOS'
  minAge?: number
  maxAge?: number
  stayTime?: number
  quantityPoints?: number
  value?: number
}

// ==========================================
// GRUPOS E SUBGRUPOS DO SIGTAP
// ==========================================

export const SIGTAP_DATA: SigtapGroup[] = [
  // ==========================================
  // GRUPO 01 - AÇÕES DE PROMOÇÃO E PREVENÇÃO EM SAÚDE
  // ==========================================
  {
    code: '01',
    name: 'Ações de Promoção e Prevenção em Saúde',
    subGroups: [
      {
        code: '01.01',
        name: 'Ações Coletivas/Individuais em Saúde',
        procedures: [
          { code: '0101010010', name: 'ATIVIDADE EDUCATIVA / ORIENTAÇÃO EM GRUPO NA ATENÇÃO BÁSICA', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0101010028', name: 'ATIVIDADE EDUCATIVA / ORIENTAÇÃO EM GRUPO NA ATENÇÃO ESPECIALIZADA', complexity: 'NAO_SE_APLICA', financingType: 'MAC' },
          { code: '0101010036', name: 'PRATICA CORPORAL / ATIVIDADE FISICA EM GRUPO', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0101010044', name: 'PRATICAS CORPORAIS EM MEDICINA TRADICIONAL CHINESA', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0101010052', name: 'TERAPIA COMUNITÁRIA', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0101010060', name: 'AÇÃO COLETIVA DE ESCOVAÇÃO DENTAL SUPERVISIONADA', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0101010079', name: 'AÇÃO COLETIVA DE APLICAÇÃO TÓPICA DE FLÚOR GEL', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0101010087', name: 'AÇÃO COLETIVA DE BOCHECHO FLUORADO', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0101010095', name: 'AÇÃO COLETIVA DE EXAME BUCAL COM FINALIDADE EPIDEMIOLÓGICA', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
        ]
      },
      {
        code: '01.02',
        name: 'Ações de Vigilância em Saúde',
        procedures: [
          { code: '0102010013', name: 'COLETA DE MATERIAL P/ EXAME CITOPATOLÓGICO DE COLO DE ÚTERO', complexity: 'NAO_SE_APLICA', financingType: 'PAB', gender: 'F' },
          { code: '0102010021', name: 'TESTE RÁPIDO P/ DETECÇÃO DE INFECÇÃO PELO HIV', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0102010030', name: 'TESTE RÁPIDO P/ HEPATITE B', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0102010048', name: 'TESTE RÁPIDO P/ HEPATITE C', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0102010056', name: 'TESTE RÁPIDO P/ SÍFILIS', complexity: 'NAO_SE_APLICA', financingType: 'PAB' },
          { code: '0102010064', name: 'TESTE RÁPIDO DE GRAVIDEZ', complexity: 'NAO_SE_APLICA', financingType: 'PAB', gender: 'F' },
        ]
      },
    ]
  },

  // ==========================================
  // GRUPO 02 - PROCEDIMENTOS COM FINALIDADE DIAGNÓSTICA
  // ==========================================
  {
    code: '02',
    name: 'Procedimentos com Finalidade Diagnóstica',
    subGroups: [
      {
        code: '02.01',
        name: 'Coleta de Material',
        procedures: [
          { code: '0201010011', name: 'COLETA DE ESCARRO PARA DIAGNÓSTICO DE TUBERCULOSE', complexity: 'BAIXA', financingType: 'PAB' },
          { code: '0201010020', name: 'COLETA DE MATERIAL P/ EXAME LABORATORIAL', complexity: 'BAIXA', financingType: 'PAB' },
          { code: '0201010038', name: 'COLETA DE SANGUE P/ TRIAGEM NEONATAL', complexity: 'BAIXA', financingType: 'PAB' },
        ]
      },
      {
        code: '02.02',
        name: 'Diagnóstico em Laboratório Clínico',
        procedures: [
          { code: '0202010015', name: 'DOSAGEM DE COLESTEROL HDL', complexity: 'BAIXA', financingType: 'MAC', value: 3.51 },
          { code: '0202010023', name: 'DOSAGEM DE COLESTEROL LDL', complexity: 'BAIXA', financingType: 'MAC', value: 3.51 },
          { code: '0202010031', name: 'DOSAGEM DE COLESTEROL TOTAL', complexity: 'BAIXA', financingType: 'MAC', value: 1.85 },
          { code: '0202010058', name: 'DOSAGEM DE GLICOSE', complexity: 'BAIXA', financingType: 'MAC', value: 1.85 },
          { code: '0202010066', name: 'DOSAGEM DE HEMOGLOBINA GLICADA', complexity: 'BAIXA', financingType: 'MAC', value: 7.86 },
          { code: '0202010074', name: 'DOSAGEM DE TRIGLICERÍDEOS', complexity: 'BAIXA', financingType: 'MAC', value: 3.51 },
          { code: '0202010082', name: 'DOSAGEM DE URÉIA', complexity: 'BAIXA', financingType: 'MAC', value: 1.85 },
          { code: '0202010090', name: 'DOSAGEM DE CREATININA', complexity: 'BAIXA', financingType: 'MAC', value: 1.85 },
          { code: '0202010104', name: 'DOSAGEM DE ÁCIDO ÚRICO', complexity: 'BAIXA', financingType: 'MAC', value: 1.85 },
          { code: '0202010112', name: 'DOSAGEM DE BILIRRUBINAS', complexity: 'BAIXA', financingType: 'MAC', value: 2.01 },
          { code: '0202010120', name: 'DOSAGEM DE CÁLCIO', complexity: 'BAIXA', financingType: 'MAC', value: 1.85 },
          { code: '0202010139', name: 'DOSAGEM DE FÓSFORO', complexity: 'BAIXA', financingType: 'MAC', value: 1.85 },
          { code: '0202010147', name: 'DOSAGEM DE POTÁSSIO', complexity: 'BAIXA', financingType: 'MAC', value: 1.85 },
          { code: '0202010155', name: 'DOSAGEM DE SÓDIO', complexity: 'BAIXA', financingType: 'MAC', value: 1.85 },
          { code: '0202010163', name: 'DOSAGEM DE MAGNÉSIO', complexity: 'BAIXA', financingType: 'MAC', value: 2.01 },
          { code: '0202010171', name: 'DOSAGEM DE FERRO SÉRICO', complexity: 'BAIXA', financingType: 'MAC', value: 3.51 },
          { code: '0202010180', name: 'DOSAGEM DE FERRITINA', complexity: 'MEDIA', financingType: 'MAC', value: 15.59 },
          { code: '0202010198', name: 'DOSAGEM DE TRANSFERRINA', complexity: 'MEDIA', financingType: 'MAC', value: 4.12 },
          { code: '0202020010', name: 'HEMOGRAMA COMPLETO', complexity: 'BAIXA', financingType: 'MAC', value: 4.11 },
          { code: '0202020029', name: 'CONTAGEM DE PLAQUETAS', complexity: 'BAIXA', financingType: 'MAC', value: 2.73 },
          { code: '0202020037', name: 'CONTAGEM DE RETICULÓCITOS', complexity: 'BAIXA', financingType: 'MAC', value: 2.73 },
          { code: '0202020045', name: 'DETERMINAÇÃO DE VELOCIDADE DE HEMOSSEDIMENTAÇÃO (VHS)', complexity: 'BAIXA', financingType: 'MAC', value: 2.73 },
          { code: '0202030016', name: 'TEMPO DE PROTROMBINA', complexity: 'BAIXA', financingType: 'MAC', value: 2.73 },
          { code: '0202030024', name: 'TEMPO DE TROMBOPLASTINA PARCIAL ATIVADA (TTPA)', complexity: 'BAIXA', financingType: 'MAC', value: 5.62 },
          { code: '0202040011', name: 'DOSAGEM DE TSH', complexity: 'MEDIA', financingType: 'MAC', value: 8.96 },
          { code: '0202040020', name: 'DOSAGEM DE T3 LIVRE', complexity: 'MEDIA', financingType: 'MAC', value: 8.76 },
          { code: '0202040038', name: 'DOSAGEM DE T4 LIVRE', complexity: 'MEDIA', financingType: 'MAC', value: 8.76 },
          { code: '0202050017', name: 'ANÁLISE DE CARACTERES FÍSICOS, ELEMENTOS E SEDIMENTO DA URINA', complexity: 'BAIXA', financingType: 'MAC', value: 3.70 },
          { code: '0202050025', name: 'UROCULTURA COM CONTAGEM DE COLÔNIAS', complexity: 'BAIXA', financingType: 'MAC', value: 5.62 },
          { code: '0202050033', name: 'PARASITOLÓGICO DE FEZES', complexity: 'BAIXA', financingType: 'MAC', value: 1.65 },
          { code: '0202050041', name: 'PESQUISA DE SANGUE OCULTO NAS FEZES', complexity: 'BAIXA', financingType: 'MAC', value: 1.65 },
          { code: '0202060012', name: 'DOSAGEM DE PSA', complexity: 'MEDIA', financingType: 'MAC', value: 16.42, gender: 'M' },
          { code: '0202060020', name: 'DOSAGEM DE BETA-HCG', complexity: 'MEDIA', financingType: 'MAC', value: 7.85, gender: 'F' },
        ]
      },
      {
        code: '02.03',
        name: 'Diagnóstico por Anatomia Patológica e Citopatologia',
        procedures: [
          { code: '0203010019', name: 'EXAME CITOPATOLÓGICO CERVICO-VAGINAL/MICROFLORA', complexity: 'MEDIA', financingType: 'MAC', value: 7.30, gender: 'F' },
          { code: '0203010027', name: 'EXAME ANATOMO-PATOLÓGICO DE PEÇA CIRÚRGICA', complexity: 'MEDIA', financingType: 'MAC', value: 21.86 },
          { code: '0203010035', name: 'EXAME ANATOMO-PATOLÓGICO DO COLO UTERINO - BIÓPSIA', complexity: 'MEDIA', financingType: 'MAC', value: 21.86, gender: 'F' },
        ]
      },
      {
        code: '02.04',
        name: 'Diagnóstico por Radiologia',
        procedures: [
          { code: '0204010012', name: 'RADIOGRAFIA DE CRÂNIO (PA + LATERAL + BRETTON)', complexity: 'BAIXA', financingType: 'MAC', value: 8.43 },
          { code: '0204010020', name: 'RADIOGRAFIA DE SEIOS DA FACE (FN + MN + LATERAL + HIRTZ)', complexity: 'BAIXA', financingType: 'MAC', value: 8.19 },
          { code: '0204010039', name: 'RADIOGRAFIA DE COLUNA CERVICAL (AP + LATERAL + TO + OBLÍQUAS)', complexity: 'BAIXA', financingType: 'MAC', value: 8.19 },
          { code: '0204010047', name: 'RADIOGRAFIA DE COLUNA DORSAL (AP + LATERAL)', complexity: 'BAIXA', financingType: 'MAC', value: 7.14 },
          { code: '0204010055', name: 'RADIOGRAFIA DE COLUNA LOMBO-SACRA (AP + LATERAL)', complexity: 'BAIXA', financingType: 'MAC', value: 7.14 },
          { code: '0204010063', name: 'RADIOGRAFIA DE TÓRAX (PA E PERFIL)', complexity: 'BAIXA', financingType: 'MAC', value: 9.50 },
          { code: '0204010071', name: 'RADIOGRAFIA DE ABDOME SIMPLES', complexity: 'BAIXA', financingType: 'MAC', value: 7.17 },
          { code: '0204010080', name: 'RADIOGRAFIA DE BACIA', complexity: 'BAIXA', financingType: 'MAC', value: 7.14 },
          { code: '0204010098', name: 'RADIOGRAFIA DE QUADRIL (AP + LATERAL)', complexity: 'BAIXA', financingType: 'MAC', value: 7.14 },
          { code: '0204010101', name: 'RADIOGRAFIA DE JOELHO (AP + LATERAL)', complexity: 'BAIXA', financingType: 'MAC', value: 7.14 },
          { code: '0204010110', name: 'RADIOGRAFIA DE TORNOZELO (AP + LATERAL)', complexity: 'BAIXA', financingType: 'MAC', value: 6.07 },
          { code: '0204010128', name: 'RADIOGRAFIA DE PÉ (AP + LATERAL + OBLÍQUA)', complexity: 'BAIXA', financingType: 'MAC', value: 6.07 },
          { code: '0204010136', name: 'RADIOGRAFIA DE OMBRO (AP + AXILAR)', complexity: 'BAIXA', financingType: 'MAC', value: 7.14 },
          { code: '0204010144', name: 'RADIOGRAFIA DE COTOVELO (AP + LATERAL)', complexity: 'BAIXA', financingType: 'MAC', value: 6.07 },
          { code: '0204010152', name: 'RADIOGRAFIA DE PUNHO (AP + LATERAL + OBLÍQUA)', complexity: 'BAIXA', financingType: 'MAC', value: 6.07 },
          { code: '0204010160', name: 'RADIOGRAFIA DE MÃO (AP + LATERAL + OBLÍQUA)', complexity: 'BAIXA', financingType: 'MAC', value: 6.07 },
          { code: '0204020018', name: 'MAMOGRAFIA BILATERAL', complexity: 'MEDIA', financingType: 'MAC', value: 45.00, gender: 'F', minAge: 40, maxAge: 69 },
        ]
      },
      {
        code: '02.05',
        name: 'Diagnóstico por Ultrassonografia',
        procedures: [
          { code: '0205010016', name: 'ULTRASSONOGRAFIA DE ABDOME TOTAL', complexity: 'MEDIA', financingType: 'MAC', value: 37.95 },
          { code: '0205010024', name: 'ULTRASSONOGRAFIA DE ABDOME SUPERIOR', complexity: 'MEDIA', financingType: 'MAC', value: 24.20 },
          { code: '0205010032', name: 'ULTRASSONOGRAFIA PÉLVICA', complexity: 'MEDIA', financingType: 'MAC', value: 24.20 },
          { code: '0205010040', name: 'ULTRASSONOGRAFIA TRANSVAGINAL', complexity: 'MEDIA', financingType: 'MAC', value: 24.20, gender: 'F' },
          { code: '0205010059', name: 'ULTRASSONOGRAFIA MAMÁRIA BILATERAL', complexity: 'MEDIA', financingType: 'MAC', value: 24.20, gender: 'F' },
          { code: '0205010067', name: 'ULTRASSONOGRAFIA DE TIREOIDE', complexity: 'MEDIA', financingType: 'MAC', value: 24.20 },
          { code: '0205010075', name: 'ULTRASSONOGRAFIA DE PRÓSTATA POR VIA ABDOMINAL', complexity: 'MEDIA', financingType: 'MAC', value: 24.20, gender: 'M' },
          { code: '0205010083', name: 'ULTRASSONOGRAFIA OBSTÉTRICA', complexity: 'MEDIA', financingType: 'MAC', value: 24.20, gender: 'F' },
          { code: '0205010091', name: 'ULTRASSONOGRAFIA OBSTÉTRICA C/ DOPPLER COLORIDO', complexity: 'MEDIA', financingType: 'MAC', value: 39.94, gender: 'F' },
          { code: '0205010105', name: 'ECODOPPLERCARDIOGRAMA', complexity: 'MEDIA', financingType: 'MAC', value: 39.94 },
        ]
      },
      {
        code: '02.06',
        name: 'Diagnóstico por Tomografia',
        procedures: [
          { code: '0206010010', name: 'TOMOGRAFIA COMPUTADORIZADA DE CRÂNIO', complexity: 'ALTA', financingType: 'MAC', value: 136.00 },
          { code: '0206010028', name: 'TOMOGRAFIA COMPUTADORIZADA DE COLUNA CERVICAL', complexity: 'ALTA', financingType: 'MAC', value: 136.00 },
          { code: '0206010036', name: 'TOMOGRAFIA COMPUTADORIZADA DE TÓRAX', complexity: 'ALTA', financingType: 'MAC', value: 136.00 },
          { code: '0206010044', name: 'TOMOGRAFIA COMPUTADORIZADA DE ABDOME SUPERIOR', complexity: 'ALTA', financingType: 'MAC', value: 138.63 },
          { code: '0206010052', name: 'TOMOGRAFIA COMPUTADORIZADA DE PELVE / BACIA', complexity: 'ALTA', financingType: 'MAC', value: 136.00 },
        ]
      },
      {
        code: '02.07',
        name: 'Diagnóstico por Ressonância Magnética',
        procedures: [
          { code: '0207010013', name: 'RESSONÂNCIA MAGNÉTICA DE CRÂNIO', complexity: 'ALTA', financingType: 'MAC', value: 268.75 },
          { code: '0207010021', name: 'RESSONÂNCIA MAGNÉTICA DE COLUNA CERVICAL', complexity: 'ALTA', financingType: 'MAC', value: 268.75 },
          { code: '0207010030', name: 'RESSONÂNCIA MAGNÉTICA DE COLUNA LOMBAR', complexity: 'ALTA', financingType: 'MAC', value: 268.75 },
          { code: '0207010048', name: 'RESSONÂNCIA MAGNÉTICA DE JOELHO', complexity: 'ALTA', financingType: 'MAC', value: 268.75 },
          { code: '0207010056', name: 'RESSONÂNCIA MAGNÉTICA DE OMBRO', complexity: 'ALTA', financingType: 'MAC', value: 268.75 },
        ]
      },
      {
        code: '02.08',
        name: 'Diagnóstico por Endoscopia',
        procedures: [
          { code: '0208010015', name: 'ENDOSCOPIA DIGESTIVA ALTA', complexity: 'MEDIA', financingType: 'MAC', value: 49.19 },
          { code: '0208010023', name: 'COLONOSCOPIA', complexity: 'MEDIA', financingType: 'MAC', value: 113.27 },
          { code: '0208010031', name: 'RETOSSIGMOIDOSCOPIA', complexity: 'MEDIA', financingType: 'MAC', value: 30.42 },
          { code: '0208010040', name: 'BRONCOSCOPIA', complexity: 'MEDIA', financingType: 'MAC', value: 61.88 },
          { code: '0208010058', name: 'LARINGOSCOPIA', complexity: 'MEDIA', financingType: 'MAC', value: 25.00 },
          { code: '0208010066', name: 'CISTOSCOPIA', complexity: 'MEDIA', financingType: 'MAC', value: 35.36 },
          { code: '0208010074', name: 'HISTEROSCOPIA DIAGNÓSTICA', complexity: 'MEDIA', financingType: 'MAC', value: 70.51, gender: 'F' },
        ]
      },
      {
        code: '02.09',
        name: 'Diagnóstico por Métodos Gráficos Dinâmicos',
        procedures: [
          { code: '0209010010', name: 'ELETROCARDIOGRAMA', complexity: 'BAIXA', financingType: 'MAC', value: 5.15 },
          { code: '0209010029', name: 'ELETROENCEFALOGRAMA', complexity: 'MEDIA', financingType: 'MAC', value: 18.01 },
          { code: '0209010037', name: 'ELETRONEUROMIOGRAFIA', complexity: 'MEDIA', financingType: 'MAC', value: 85.00 },
          { code: '0209010045', name: 'TESTE DE ESFORÇO / TESTE ERGOMÉTRICO', complexity: 'MEDIA', financingType: 'MAC', value: 30.00 },
          { code: '0209010053', name: 'HOLTER 24 HORAS', complexity: 'MEDIA', financingType: 'MAC', value: 30.09 },
          { code: '0209010061', name: 'MAPA - MONITORIZAÇÃO AMBULATORIAL DE PRESSÃO ARTERIAL', complexity: 'MEDIA', financingType: 'MAC', value: 35.00 },
          { code: '0209010070', name: 'ESPIROMETRIA', complexity: 'BAIXA', financingType: 'MAC', value: 15.65 },
          { code: '0209010088', name: 'POLISSONOGRAFIA', complexity: 'ALTA', financingType: 'MAC', value: 297.60 },
          { code: '0209010096', name: 'AUDIOMETRIA', complexity: 'BAIXA', financingType: 'MAC', value: 19.87 },
          { code: '0209010100', name: 'IMPEDANCIOMETRIA', complexity: 'BAIXA', financingType: 'MAC', value: 11.00 },
        ]
      },
    ]
  },

  // ==========================================
  // GRUPO 03 - PROCEDIMENTOS CLÍNICOS
  // ==========================================
  {
    code: '03',
    name: 'Procedimentos Clínicos',
    subGroups: [
      {
        code: '03.01',
        name: 'Consultas / Atendimentos / Acompanhamentos',
        procedures: [
          { code: '0301010013', name: 'CONSULTA MÉDICA EM ATENÇÃO BÁSICA', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 10.00 },
          { code: '0301010021', name: 'CONSULTA MÉDICA EM ATENÇÃO ESPECIALIZADA', complexity: 'MEDIA', financingType: 'MAC', value: 10.00 },
          { code: '0301010030', name: 'CONSULTA DE ENFERMAGEM', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 6.30 },
          { code: '0301010048', name: 'CONSULTA DE PROFISSIONAIS DE NÍVEL SUPERIOR NA ATENÇÃO BÁSICA', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 6.30 },
          { code: '0301010056', name: 'CONSULTA ODONTOLÓGICA', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 10.00 },
          { code: '0301010064', name: 'ATENDIMENTO DE URGÊNCIA EM ATENÇÃO BÁSICA', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 10.00 },
          { code: '0301010072', name: 'ATENDIMENTO DE URGÊNCIA / EMERGÊNCIA', complexity: 'MEDIA', financingType: 'MAC', value: 10.00 },
          { code: '0301010080', name: 'VISITA DOMICILIAR POR PROFISSIONAL DE NÍVEL SUPERIOR', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 10.00 },
          { code: '0301010099', name: 'VISITA DOMICILIAR POR PROFISSIONAL DE NÍVEL MÉDIO', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 5.00 },
          { code: '0301010102', name: 'ATENDIMENTO PRÉ-NATAL', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 10.00, gender: 'F' },
          { code: '0301010110', name: 'CONSULTA PUERPERAL', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 10.00, gender: 'F' },
          { code: '0301010129', name: 'CONSULTA DE PUERICULTURA', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 10.00, maxAge: 5 },
        ]
      },
      {
        code: '03.02',
        name: 'Tratamentos Clínicos (Outras Especialidades)',
        procedures: [
          { code: '0302010015', name: 'ATENDIMENTO FISIOTERÁPICO', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 4.67 },
          { code: '0302010023', name: 'SESSÃO DE FISIOTERAPIA', complexity: 'MEDIA', financingType: 'MAC', value: 4.67 },
          { code: '0302010031', name: 'ATENDIMENTO / ACOMPANHAMENTO EM SAÚDE MENTAL', complexity: 'NAO_SE_APLICA', financingType: 'MAC', value: 6.30 },
          { code: '0302010040', name: 'ATENDIMENTO PSICOLÓGICO', complexity: 'NAO_SE_APLICA', financingType: 'MAC', value: 6.30 },
          { code: '0302010058', name: 'PSICOTERAPIA INDIVIDUAL', complexity: 'MEDIA', financingType: 'MAC', value: 22.83 },
          { code: '0302010066', name: 'PSICOTERAPIA DE GRUPO', complexity: 'MEDIA', financingType: 'MAC', value: 3.72 },
          { code: '0302010074', name: 'ATENDIMENTO / ACOMPANHAMENTO DE PACIENTE EM REABILITAÇÃO', complexity: 'NAO_SE_APLICA', financingType: 'MAC', value: 6.30 },
          { code: '0302010082', name: 'ATENDIMENTO FONOAUDIOLÓGICO', complexity: 'NAO_SE_APLICA', financingType: 'MAC', value: 6.30 },
          { code: '0302010090', name: 'SESSÃO DE FONOAUDIOLOGIA', complexity: 'MEDIA', financingType: 'MAC', value: 6.30 },
          { code: '0302010104', name: 'ATENDIMENTO DE TERAPIA OCUPACIONAL', complexity: 'NAO_SE_APLICA', financingType: 'MAC', value: 6.30 },
          { code: '0302010112', name: 'ATENDIMENTO NUTRICIONAL', complexity: 'NAO_SE_APLICA', financingType: 'MAC', value: 6.30 },
          { code: '0302010120', name: 'ATENDIMENTO DE ASSISTENTE SOCIAL', complexity: 'NAO_SE_APLICA', financingType: 'MAC', value: 6.30 },
        ]
      },
      {
        code: '03.03',
        name: 'Tratamentos Odontológicos',
        procedures: [
          { code: '0303010010', name: 'RESTAURAÇÃO DE DENTE DECÍDUO', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 11.41 },
          { code: '0303010029', name: 'RESTAURAÇÃO DE DENTE PERMANENTE ANTERIOR', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 11.41 },
          { code: '0303010037', name: 'RESTAURAÇÃO DE DENTE PERMANENTE POSTERIOR', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 11.41 },
          { code: '0303010045', name: 'EXODONTIA DE DENTE DECÍDUO', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 5.77 },
          { code: '0303010053', name: 'EXODONTIA DE DENTE PERMANENTE', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 11.54 },
          { code: '0303010061', name: 'RASPAGEM ALISAMENTO E POLIMENTO SUPRAGENGIVAL', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 2.23 },
          { code: '0303010070', name: 'RASPAGEM ALISAMENTO E POLIMENTO SUBGENGIVAL', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 4.45 },
          { code: '0303010088', name: 'SELAMENTO PROVISÓRIO DE CAVIDADE DENTÁRIA', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 5.77 },
          { code: '0303010096', name: 'APLICAÇÃO DE CARIOSTÁTICO', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 3.17 },
          { code: '0303010100', name: 'APLICAÇÃO DE SELANTE', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 4.03 },
          { code: '0303010118', name: 'APLICAÇÃO TÓPICA DE FLÚOR - INDIVIDUAL', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 3.08 },
          { code: '0303010126', name: 'TRATAMENTO DE ALVEOLITE', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 3.17 },
          { code: '0303010134', name: 'ULOTOMIA/ULECTOMIA', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 2.71 },
          { code: '0303010142', name: 'PULPOTOMIA DENTÁRIA', complexity: 'NAO_SE_APLICA', financingType: 'PAB', value: 15.39 },
          { code: '0303010150', name: 'TRATAMENTO ENDODÔNTICO DE DENTE PERMANENTE UNIRRADICULAR', complexity: 'MEDIA', financingType: 'MAC', value: 41.33 },
          { code: '0303010169', name: 'TRATAMENTO ENDODÔNTICO DE DENTE PERMANENTE BIRRADICULAR', complexity: 'MEDIA', financingType: 'MAC', value: 56.72 },
          { code: '0303010177', name: 'TRATAMENTO ENDODÔNTICO DE DENTE PERMANENTE TRIRRADICULAR', complexity: 'MEDIA', financingType: 'MAC', value: 70.08 },
        ]
      },
      {
        code: '03.04',
        name: 'Tratamentos em Nefrologia',
        procedures: [
          { code: '0304010014', name: 'HEMODIÁLISE', complexity: 'ALTA', financingType: 'FAEC', value: 211.41 },
          { code: '0304010022', name: 'DIÁLISE PERITONEAL AMBULATORIAL CONTÍNUA', complexity: 'ALTA', financingType: 'FAEC', value: 130.00 },
          { code: '0304010030', name: 'DIÁLISE PERITONEAL AUTOMÁTICA', complexity: 'ALTA', financingType: 'FAEC', value: 135.00 },
        ]
      },
      {
        code: '03.05',
        name: 'Tratamentos em Oncologia',
        procedures: [
          { code: '0305010016', name: 'QUIMIOTERAPIA PALIATIVA - ADULTO', complexity: 'ALTA', financingType: 'FAEC', value: 350.00 },
          { code: '0305010024', name: 'QUIMIOTERAPIA ADJUVANTE - MAMA ESTÁDIO I', complexity: 'ALTA', financingType: 'FAEC', value: 800.00, gender: 'F' },
          { code: '0305010032', name: 'RADIOTERAPIA COM ACELERADOR LINEAR', complexity: 'ALTA', financingType: 'FAEC', value: 180.00 },
          { code: '0305010040', name: 'BRAQUITERAPIA', complexity: 'ALTA', financingType: 'FAEC', value: 750.00 },
        ]
      },
    ]
  },

  // ==========================================
  // GRUPO 04 - PROCEDIMENTOS CIRÚRGICOS
  // ==========================================
  {
    code: '04',
    name: 'Procedimentos Cirúrgicos',
    subGroups: [
      {
        code: '04.01',
        name: 'Pequenas Cirurgias e Cirurgias de Pele, Tecido Subcutâneo e Mucosa',
        procedures: [
          { code: '0401010015', name: 'BIÓPSIA DE PELE', complexity: 'BAIXA', financingType: 'MAC', value: 20.00 },
          { code: '0401010023', name: 'EXÉRESE DE LESÃO DE PELE', complexity: 'BAIXA', financingType: 'MAC', value: 30.00 },
          { code: '0401010031', name: 'SUTURA SIMPLES', complexity: 'BAIXA', financingType: 'MAC', value: 15.00 },
          { code: '0401010040', name: 'DRENAGEM DE ABSCESSO', complexity: 'BAIXA', financingType: 'MAC', value: 25.00 },
          { code: '0401010058', name: 'RETIRADA DE CORPO ESTRANHO DE TECIDO SUBCUTÂNEO', complexity: 'BAIXA', financingType: 'MAC', value: 25.00 },
          { code: '0401010066', name: 'CURETAGEM DE LESÃO DE PELE', complexity: 'BAIXA', financingType: 'MAC', value: 15.00 },
          { code: '0401010074', name: 'CAUTERIZAÇÃO QUÍMICA DE LESÃO', complexity: 'BAIXA', financingType: 'MAC', value: 10.00 },
          { code: '0401010082', name: 'CANTOPLASTIA', complexity: 'MEDIA', financingType: 'MAC', value: 150.00 },
          { code: '0401010090', name: 'EXÉRESE DE CISTO SEBÁCEO', complexity: 'BAIXA', financingType: 'MAC', value: 75.00 },
          { code: '0401010104', name: 'EXÉRESE DE LIPOMA', complexity: 'BAIXA', financingType: 'MAC', value: 75.00 },
          { code: '0401010112', name: 'EXÉRESE DE UNHA', complexity: 'BAIXA', financingType: 'MAC', value: 30.00 },
          { code: '0401010120', name: 'TRATAMENTO CIRÚRGICO DE UNHA ENCRAVADA', complexity: 'BAIXA', financingType: 'MAC', value: 60.00 },
        ]
      },
      {
        code: '04.02',
        name: 'Cirurgias do Sistema Nervoso Central e Periférico',
        procedures: [
          { code: '0402010017', name: 'CRANIOTOMIA PARA DRENAGEM DE HEMATOMA', complexity: 'ALTA', financingType: 'MAC', value: 1200.00, stayTime: 5 },
          { code: '0402010025', name: 'TRATAMENTO CIRÚRGICO DE TUMOR CEREBRAL', complexity: 'ALTA', financingType: 'MAC', value: 2500.00, stayTime: 7 },
          { code: '0402010033', name: 'TRATAMENTO CIRÚRGICO DE HÉRNIA DISCAL', complexity: 'ALTA', financingType: 'MAC', value: 700.00, stayTime: 3 },
          { code: '0402010041', name: 'DESCOMPRESSÃO DE NERVO PERIFÉRICO', complexity: 'MEDIA', financingType: 'MAC', value: 450.00, stayTime: 1 },
        ]
      },
      {
        code: '04.03',
        name: 'Cirurgias das Vias Aéreas Superiores, da Face, da Cabeça e do Pescoço',
        procedures: [
          { code: '0403010010', name: 'AMIGDALECTOMIA', complexity: 'MEDIA', financingType: 'MAC', value: 234.58, stayTime: 1 },
          { code: '0403010028', name: 'ADENOIDECTOMIA', complexity: 'MEDIA', financingType: 'MAC', value: 199.19, stayTime: 1 },
          { code: '0403010036', name: 'ADENOAMIGDALECTOMIA', complexity: 'MEDIA', financingType: 'MAC', value: 273.06, stayTime: 1 },
          { code: '0403010044', name: 'SEPTOPLASTIA', complexity: 'MEDIA', financingType: 'MAC', value: 234.58, stayTime: 1 },
          { code: '0403010052', name: 'TURBINECTOMIA', complexity: 'MEDIA', financingType: 'MAC', value: 153.49, stayTime: 1 },
          { code: '0403010060', name: 'TIREOIDECTOMIA TOTAL', complexity: 'ALTA', financingType: 'MAC', value: 575.28, stayTime: 3 },
          { code: '0403010079', name: 'TIREOIDECTOMIA PARCIAL', complexity: 'MEDIA', financingType: 'MAC', value: 460.95, stayTime: 2 },
          { code: '0403010087', name: 'PAROTIDECTOMIA', complexity: 'ALTA', financingType: 'MAC', value: 665.26, stayTime: 3 },
        ]
      },
      {
        code: '04.04',
        name: 'Cirurgias do Aparelho da Visão',
        procedures: [
          { code: '0404010016', name: 'FACECTOMIA COM IMPLANTE DE LENTE INTRAOCULAR', complexity: 'MEDIA', financingType: 'MAC', value: 643.00, stayTime: 1 },
          { code: '0404010024', name: 'TRATAMENTO CIRÚRGICO DE PTERÍGIO', complexity: 'BAIXA', financingType: 'MAC', value: 145.56, stayTime: 0 },
          { code: '0404010032', name: 'VITRECTOMIA', complexity: 'ALTA', financingType: 'MAC', value: 862.00, stayTime: 1 },
          { code: '0404010040', name: 'TRATAMENTO CIRÚRGICO DE GLAUCOMA', complexity: 'MEDIA', financingType: 'MAC', value: 375.10, stayTime: 1 },
          { code: '0404010059', name: 'CORREÇÃO DE ESTRABISMO', complexity: 'MEDIA', financingType: 'MAC', value: 376.95, stayTime: 1 },
          { code: '0404010067', name: 'TRANSPLANTE DE CÓRNEA', complexity: 'ALTA', financingType: 'FAEC', value: 2424.79, stayTime: 2 },
        ]
      },
      {
        code: '04.05',
        name: 'Cirurgias do Aparelho Circulatório',
        procedures: [
          { code: '0405010017', name: 'REVASCULARIZAÇÃO MIOCÁRDICA COM USO DE CIRCULAÇÃO EXTRACORPÓREA', complexity: 'ALTA', financingType: 'MAC', value: 9500.00, stayTime: 10 },
          { code: '0405010025', name: 'IMPLANTE DE MARCA-PASSO CARDÍACO PERMANENTE', complexity: 'ALTA', financingType: 'FAEC', value: 1350.00, stayTime: 3 },
          { code: '0405010033', name: 'TROCA DE VÁLVULA CARDÍACA', complexity: 'ALTA', financingType: 'MAC', value: 7500.00, stayTime: 10 },
          { code: '0405010041', name: 'CORREÇÃO DE CARDIOPATIA CONGÊNITA', complexity: 'ALTA', financingType: 'MAC', value: 6500.00, stayTime: 10 },
          { code: '0405010050', name: 'ANGIOPLASTIA CORONARIANA', complexity: 'ALTA', financingType: 'MAC', value: 2600.00, stayTime: 2 },
          { code: '0405010068', name: 'TRATAMENTO CIRÚRGICO DE VARIZES', complexity: 'MEDIA', financingType: 'MAC', value: 247.22, stayTime: 1 },
          { code: '0405010076', name: 'FÍSTULA ARTERIOVENOSA P/ HEMODIÁLISE', complexity: 'MEDIA', financingType: 'MAC', value: 359.37, stayTime: 1 },
        ]
      },
      {
        code: '04.06',
        name: 'Cirurgias do Aparelho Digestivo, Órgãos Anexos e Parede Abdominal',
        procedures: [
          { code: '0406010019', name: 'COLECISTECTOMIA POR VIDEOLAPAROSCOPIA', complexity: 'MEDIA', financingType: 'MAC', value: 569.27, stayTime: 2 },
          { code: '0406010027', name: 'COLECISTECTOMIA', complexity: 'MEDIA', financingType: 'MAC', value: 381.99, stayTime: 3 },
          { code: '0406010035', name: 'APENDICECTOMIA', complexity: 'MEDIA', financingType: 'MAC', value: 339.72, stayTime: 2 },
          { code: '0406010043', name: 'HERNIORRAFIA INGUINAL / CRURAL', complexity: 'MEDIA', financingType: 'MAC', value: 243.70, stayTime: 1 },
          { code: '0406010051', name: 'HERNIORRAFIA UMBILICAL', complexity: 'BAIXA', financingType: 'MAC', value: 243.70, stayTime: 1 },
          { code: '0406010060', name: 'HERNIORRAFIA INCISIONAL', complexity: 'MEDIA', financingType: 'MAC', value: 323.45, stayTime: 2 },
          { code: '0406010078', name: 'HEMORROIDECTOMIA', complexity: 'BAIXA', financingType: 'MAC', value: 167.87, stayTime: 1 },
          { code: '0406010086', name: 'FISTULECTOMIA / FISTULOTOMIA ANAL', complexity: 'BAIXA', financingType: 'MAC', value: 126.77, stayTime: 1 },
          { code: '0406010094', name: 'GASTRECTOMIA', complexity: 'ALTA', financingType: 'MAC', value: 808.25, stayTime: 7 },
          { code: '0406010108', name: 'COLECTOMIA', complexity: 'ALTA', financingType: 'MAC', value: 808.25, stayTime: 7 },
          { code: '0406010116', name: 'RETOSSIGMOIDECTOMIA', complexity: 'ALTA', financingType: 'MAC', value: 808.25, stayTime: 7 },
          { code: '0406010124', name: 'GASTROPLASTIA (CIRURGIA BARIÁTRICA)', complexity: 'ALTA', financingType: 'MAC', value: 4612.20, stayTime: 5 },
        ]
      },
      {
        code: '04.07',
        name: 'Cirurgias do Sistema Osteomuscular',
        procedures: [
          { code: '0407010012', name: 'TRATAMENTO CIRÚRGICO DE FRATURA DE FÊMUR', complexity: 'ALTA', financingType: 'MAC', value: 755.14, stayTime: 5 },
          { code: '0407010020', name: 'TRATAMENTO CIRÚRGICO DE FRATURA DE TÍBIA', complexity: 'MEDIA', financingType: 'MAC', value: 573.49, stayTime: 3 },
          { code: '0407010039', name: 'ARTROPLASTIA TOTAL DE QUADRIL', complexity: 'ALTA', financingType: 'FAEC', value: 2104.32, stayTime: 5 },
          { code: '0407010047', name: 'ARTROPLASTIA TOTAL DE JOELHO', complexity: 'ALTA', financingType: 'FAEC', value: 2104.32, stayTime: 5 },
          { code: '0407010055', name: 'ARTROSCOPIA', complexity: 'MEDIA', financingType: 'MAC', value: 485.00, stayTime: 1 },
          { code: '0407010063', name: 'TRATAMENTO CIRÚRGICO DE SÍNDROME DO TÚNEL DO CARPO', complexity: 'BAIXA', financingType: 'MAC', value: 134.53, stayTime: 0 },
          { code: '0407010071', name: 'ARTRODESE DE COLUNA', complexity: 'ALTA', financingType: 'MAC', value: 2000.00, stayTime: 5 },
          { code: '0407010080', name: 'AMPUTAÇÃO DE MEMBRO INFERIOR', complexity: 'ALTA', financingType: 'MAC', value: 437.51, stayTime: 7 },
        ]
      },
      {
        code: '04.08',
        name: 'Cirurgias do Sistema Geniturinário',
        procedures: [
          { code: '0408010011', name: 'PROSTATECTOMIA', complexity: 'ALTA', financingType: 'MAC', value: 649.29, stayTime: 5, gender: 'M' },
          { code: '0408010020', name: 'NEFRECTOMIA', complexity: 'ALTA', financingType: 'MAC', value: 805.00, stayTime: 5 },
          { code: '0408010038', name: 'LITOTRIPSIA EXTRACORPÓREA', complexity: 'MEDIA', financingType: 'MAC', value: 357.00, stayTime: 0 },
          { code: '0408010046', name: 'CISTECTOMIA', complexity: 'ALTA', financingType: 'MAC', value: 1200.00, stayTime: 7 },
          { code: '0408010054', name: 'RESSECÇÃO TRANSURETRAL DE PRÓSTATA', complexity: 'MEDIA', financingType: 'MAC', value: 469.84, stayTime: 3, gender: 'M' },
          { code: '0408010062', name: 'ORQUIECTOMIA', complexity: 'MEDIA', financingType: 'MAC', value: 249.01, stayTime: 1, gender: 'M' },
          { code: '0408010070', name: 'POSTECTOMIA', complexity: 'BAIXA', financingType: 'MAC', value: 112.68, stayTime: 0, gender: 'M' },
          { code: '0408010089', name: 'VASECTOMIA', complexity: 'BAIXA', financingType: 'MAC', value: 75.00, stayTime: 0, gender: 'M' },
          { code: '0408010097', name: 'CORREÇÃO DE HIDROCELE', complexity: 'BAIXA', financingType: 'MAC', value: 157.09, stayTime: 0, gender: 'M' },
          { code: '0408020017', name: 'HISTERECTOMIA TOTAL', complexity: 'ALTA', financingType: 'MAC', value: 489.77, stayTime: 3, gender: 'F' },
          { code: '0408020025', name: 'HISTERECTOMIA SUBTOTAL', complexity: 'MEDIA', financingType: 'MAC', value: 423.48, stayTime: 3, gender: 'F' },
          { code: '0408020033', name: 'MIOMECTOMIA', complexity: 'MEDIA', financingType: 'MAC', value: 388.89, stayTime: 2, gender: 'F' },
          { code: '0408020041', name: 'OOFORECTOMIA', complexity: 'MEDIA', financingType: 'MAC', value: 278.23, stayTime: 2, gender: 'F' },
          { code: '0408020050', name: 'SALPINGECTOMIA', complexity: 'MEDIA', financingType: 'MAC', value: 278.23, stayTime: 2, gender: 'F' },
          { code: '0408020068', name: 'LAQUEADURA TUBÁRIA', complexity: 'BAIXA', financingType: 'MAC', value: 188.08, stayTime: 1, gender: 'F' },
          { code: '0408020076', name: 'CURETAGEM SEMIÓTICA', complexity: 'BAIXA', financingType: 'MAC', value: 79.65, stayTime: 0, gender: 'F' },
          { code: '0408020084', name: 'CURETAGEM PÓS-ABORTO', complexity: 'BAIXA', financingType: 'MAC', value: 79.65, stayTime: 0, gender: 'F' },
          { code: '0408020092', name: 'CONIZAÇÃO DE COLO DE ÚTERO', complexity: 'MEDIA', financingType: 'MAC', value: 190.05, stayTime: 0, gender: 'F' },
          { code: '0408020106', name: 'CESARIANA', complexity: 'MEDIA', financingType: 'MAC', value: 555.00, stayTime: 2, gender: 'F' },
          { code: '0408020114', name: 'PARTO NORMAL', complexity: 'BAIXA', financingType: 'MAC', value: 443.40, stayTime: 2, gender: 'F' },
          { code: '0408020122', name: 'CORREÇÃO DE PROLAPSO GENITAL', complexity: 'MEDIA', financingType: 'MAC', value: 382.00, stayTime: 2, gender: 'F' },
        ]
      },
    ]
  },

  // ==========================================
  // GRUPO 05 - TRANSPLANTES DE ÓRGÃOS, TECIDOS E CÉLULAS
  // ==========================================
  {
    code: '05',
    name: 'Transplantes de Órgãos, Tecidos e Células',
    subGroups: [
      {
        code: '05.01',
        name: 'Coleta e Exames para Fins de Doação de Órgãos',
        procedures: [
          { code: '0501010010', name: 'MANUTENÇÃO DE POTENCIAL DOADOR DE ÓRGÃOS E TECIDOS', complexity: 'ALTA', financingType: 'FAEC', value: 850.00, stayTime: 3 },
          { code: '0501010029', name: 'CAPTAÇÃO DE ÓRGÃOS DE DOADOR EM MORTE ENCEFÁLICA', complexity: 'ALTA', financingType: 'FAEC', value: 2500.00 },
        ]
      },
      {
        code: '05.02',
        name: 'Transplante de Órgãos e Tecidos',
        procedures: [
          { code: '0502010017', name: 'TRANSPLANTE DE RIM', complexity: 'ALTA', financingType: 'FAEC', value: 30000.00, stayTime: 15 },
          { code: '0502010025', name: 'TRANSPLANTE DE FÍGADO', complexity: 'ALTA', financingType: 'FAEC', value: 70000.00, stayTime: 20 },
          { code: '0502010033', name: 'TRANSPLANTE DE CORAÇÃO', complexity: 'ALTA', financingType: 'FAEC', value: 75000.00, stayTime: 20 },
          { code: '0502010041', name: 'TRANSPLANTE DE PULMÃO', complexity: 'ALTA', financingType: 'FAEC', value: 65000.00, stayTime: 20 },
          { code: '0502010050', name: 'TRANSPLANTE DE PÂNCREAS', complexity: 'ALTA', financingType: 'FAEC', value: 45000.00, stayTime: 15 },
          { code: '0502010068', name: 'TRANSPLANTE DE MEDULA ÓSSEA - ALOGÊNICO', complexity: 'ALTA', financingType: 'FAEC', value: 60000.00, stayTime: 30 },
          { code: '0502010076', name: 'TRANSPLANTE DE MEDULA ÓSSEA - AUTOGÊNICO', complexity: 'ALTA', financingType: 'FAEC', value: 40000.00, stayTime: 20 },
        ]
      },
    ]
  },

  // ==========================================
  // GRUPO 06 - MEDICAMENTOS
  // ==========================================
  {
    code: '06',
    name: 'Medicamentos',
    subGroups: [
      {
        code: '06.01',
        name: 'Medicamentos do Componente Especializado',
        procedures: [
          { code: '0601010015', name: 'ADALIMUMABE 40MG INJETÁVEL', complexity: 'ALTA', financingType: 'FAEC' },
          { code: '0601010023', name: 'ETANERCEPTE 25MG INJETÁVEL', complexity: 'ALTA', financingType: 'FAEC' },
          { code: '0601010031', name: 'INFLIXIMABE 100MG INJETÁVEL', complexity: 'ALTA', financingType: 'FAEC' },
          { code: '0601010040', name: 'INSULINA GLARGINA 100UI/ML', complexity: 'ALTA', financingType: 'FAEC' },
          { code: '0601010058', name: 'INSULINA ASPART 100UI/ML', complexity: 'ALTA', financingType: 'FAEC' },
          { code: '0601010066', name: 'IMUNOGLOBULINA HUMANA', complexity: 'ALTA', financingType: 'FAEC' },
          { code: '0601010074', name: 'METOTREXATO 2,5MG COMPRIMIDO', complexity: 'MEDIA', financingType: 'MAC' },
          { code: '0601010082', name: 'CICLOSPORINA 50MG CÁPSULA', complexity: 'ALTA', financingType: 'FAEC' },
        ]
      },
      {
        code: '06.02',
        name: 'Medicamentos para Saúde Mental',
        procedures: [
          { code: '0602010012', name: 'CLOZAPINA 100MG COMPRIMIDO', complexity: 'MEDIA', financingType: 'MAC' },
          { code: '0602010020', name: 'OLANZAPINA 10MG COMPRIMIDO', complexity: 'MEDIA', financingType: 'MAC' },
          { code: '0602010039', name: 'RISPERIDONA 2MG COMPRIMIDO', complexity: 'MEDIA', financingType: 'MAC' },
          { code: '0602010047', name: 'QUETIAPINA 200MG COMPRIMIDO', complexity: 'MEDIA', financingType: 'MAC' },
          { code: '0602010055', name: 'LÍTIO 300MG COMPRIMIDO', complexity: 'BAIXA', financingType: 'MAC' },
          { code: '0602010063', name: 'ÁCIDO VALPRÓICO 500MG COMPRIMIDO', complexity: 'BAIXA', financingType: 'MAC' },
        ]
      },
    ]
  },

  // ==========================================
  // GRUPO 07 - ÓRTESES, PRÓTESES E MATERIAIS ESPECIAIS
  // ==========================================
  {
    code: '07',
    name: 'Órteses, Próteses e Materiais Especiais',
    subGroups: [
      {
        code: '07.01',
        name: 'Órteses e Próteses Não Relacionadas a Ato Cirúrgico',
        procedures: [
          { code: '0701010011', name: 'APARELHO AUDITIVO INTRA-AURICULAR', complexity: 'MEDIA', financingType: 'FAEC', value: 425.00 },
          { code: '0701010020', name: 'APARELHO AUDITIVO RETROAURICULAR', complexity: 'MEDIA', financingType: 'FAEC', value: 425.00 },
          { code: '0701010038', name: 'ÓCULOS PARA VISÃO SUBNORMAL', complexity: 'BAIXA', financingType: 'MAC', value: 100.00 },
          { code: '0701010046', name: 'CADEIRA DE RODAS ADULTO', complexity: 'BAIXA', financingType: 'FAEC', value: 583.00 },
          { code: '0701010054', name: 'CADEIRA DE RODAS INFANTIL', complexity: 'BAIXA', financingType: 'FAEC', value: 583.00 },
          { code: '0701010062', name: 'MULETA AXILAR', complexity: 'BAIXA', financingType: 'MAC', value: 46.00 },
          { code: '0701010070', name: 'BENGALA', complexity: 'BAIXA', financingType: 'MAC', value: 15.00 },
          { code: '0701010089', name: 'ANDADOR', complexity: 'BAIXA', financingType: 'MAC', value: 132.00 },
          { code: '0701010097', name: 'PRÓTESE PARA MEMBRO INFERIOR', complexity: 'MEDIA', financingType: 'FAEC', value: 1500.00 },
          { code: '0701010100', name: 'PRÓTESE PARA MEMBRO SUPERIOR', complexity: 'MEDIA', financingType: 'FAEC', value: 1200.00 },
          { code: '0701010119', name: 'ÓRTESE PARA COLUNA VERTEBRAL', complexity: 'BAIXA', financingType: 'MAC', value: 350.00 },
          { code: '0701010127', name: 'ÓRTESE PARA MEMBRO INFERIOR', complexity: 'BAIXA', financingType: 'MAC', value: 280.00 },
          { code: '0701010135', name: 'ÓRTESE PARA MEMBRO SUPERIOR', complexity: 'BAIXA', financingType: 'MAC', value: 180.00 },
          { code: '0701010143', name: 'PALMILHA', complexity: 'BAIXA', financingType: 'MAC', value: 35.00 },
          { code: '0701010151', name: 'CALÇADO ORTOPÉDICO', complexity: 'BAIXA', financingType: 'MAC', value: 125.00 },
          { code: '0701010160', name: 'PRÓTESE MAMÁRIA EXTERNA', complexity: 'BAIXA', financingType: 'MAC', value: 61.00, gender: 'F' },
          { code: '0701010178', name: 'BOLSA DE COLOSTOMIA', complexity: 'BAIXA', financingType: 'FAEC', value: 25.00 },
        ]
      },
      {
        code: '07.02',
        name: 'Órteses e Próteses Relacionadas ao Ato Cirúrgico',
        procedures: [
          { code: '0702010014', name: 'PRÓTESE TOTAL DE QUADRIL', complexity: 'ALTA', financingType: 'FAEC', value: 1600.00 },
          { code: '0702010022', name: 'PRÓTESE TOTAL DE JOELHO', complexity: 'ALTA', financingType: 'FAEC', value: 2000.00 },
          { code: '0702010030', name: 'LENTE INTRAOCULAR', complexity: 'MEDIA', financingType: 'MAC', value: 200.00 },
          { code: '0702010049', name: 'MARCA-PASSO CARDÍACO', complexity: 'ALTA', financingType: 'FAEC', value: 5000.00 },
          { code: '0702010057', name: 'STENT CORONARIANO', complexity: 'ALTA', financingType: 'FAEC', value: 2500.00 },
          { code: '0702010065', name: 'PRÓTESE VALVAR CARDÍACA', complexity: 'ALTA', financingType: 'FAEC', value: 8000.00 },
          { code: '0702010073', name: 'TELA PARA HERNIORRAFIA', complexity: 'BAIXA', financingType: 'MAC', value: 150.00 },
          { code: '0702010081', name: 'PARAFUSOS E PLACAS ORTOPÉDICAS', complexity: 'MEDIA', financingType: 'MAC', value: 500.00 },
          { code: '0702010090', name: 'HASTES INTRAMEDULARES', complexity: 'MEDIA', financingType: 'MAC', value: 800.00 },
        ]
      },
    ]
  },

  // ==========================================
  // GRUPO 08 - AÇÕES COMPLEMENTARES DA ATENÇÃO À SAÚDE
  // ==========================================
  {
    code: '08',
    name: 'Ações Complementares da Atenção à Saúde',
    subGroups: [
      {
        code: '08.01',
        name: 'Ações Relacionadas ao Atendimento',
        procedures: [
          { code: '0801010015', name: 'DIÁRIA DE INTERNAÇÃO EM CLÍNICA MÉDICA', complexity: 'MEDIA', financingType: 'MAC', value: 30.00, stayTime: 1 },
          { code: '0801010023', name: 'DIÁRIA DE INTERNAÇÃO EM CLÍNICA CIRÚRGICA', complexity: 'MEDIA', financingType: 'MAC', value: 35.00, stayTime: 1 },
          { code: '0801010031', name: 'DIÁRIA DE INTERNAÇÃO EM UTI ADULTO', complexity: 'ALTA', financingType: 'MAC', value: 470.00, stayTime: 1 },
          { code: '0801010040', name: 'DIÁRIA DE INTERNAÇÃO EM UTI PEDIÁTRICA', complexity: 'ALTA', financingType: 'MAC', value: 470.00, stayTime: 1, maxAge: 12 },
          { code: '0801010058', name: 'DIÁRIA DE INTERNAÇÃO EM UTI NEONATAL', complexity: 'ALTA', financingType: 'MAC', value: 470.00, stayTime: 1, maxAge: 0 },
          { code: '0801010066', name: 'DIÁRIA DE INTERNAÇÃO OBSTÉTRICA', complexity: 'MEDIA', financingType: 'MAC', value: 32.00, stayTime: 1, gender: 'F' },
          { code: '0801010074', name: 'DIÁRIA DE HOSPITAL-DIA', complexity: 'MEDIA', financingType: 'MAC', value: 80.00, stayTime: 0 },
          { code: '0801010082', name: 'DIÁRIA DE UNIDADE DE CUIDADOS INTERMEDIÁRIOS', complexity: 'MEDIA', financingType: 'MAC', value: 180.00, stayTime: 1 },
        ]
      },
      {
        code: '08.02',
        name: 'Autorização / Regulação',
        procedures: [
          { code: '0802010018', name: 'AUTORIZAÇÃO DE PROCEDIMENTO DE ALTA COMPLEXIDADE', complexity: 'NAO_SE_APLICA', financingType: 'MAC' },
          { code: '0802010026', name: 'REGULAÇÃO DE VAGA DE INTERNAÇÃO', complexity: 'NAO_SE_APLICA', financingType: 'MAC' },
          { code: '0802010034', name: 'REGULAÇÃO DE CONSULTA ESPECIALIZADA', complexity: 'NAO_SE_APLICA', financingType: 'MAC' },
        ]
      },
    ]
  },
]

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Obtém todos os grupos
 */
export function getAllGroups(): { code: string; name: string }[] {
  return SIGTAP_DATA.map(g => ({ code: g.code, name: g.name }))
}

/**
 * Obtém todos os subgrupos de um grupo
 */
export function getSubGroupsByGroup(groupCode: string): { code: string; name: string }[] {
  const group = SIGTAP_DATA.find(g => g.code === groupCode)
  if (!group) return []
  return group.subGroups.map(sg => ({ code: sg.code, name: sg.name }))
}

/**
 * Obtém todos os procedimentos de um subgrupo
 */
export function getProceduresBySubGroup(subGroupCode: string): SigtapProcedure[] {
  for (const group of SIGTAP_DATA) {
    const subGroup = group.subGroups.find(sg => sg.code === subGroupCode)
    if (subGroup) {
      return subGroup.procedures
    }
  }
  return []
}

/**
 * Obtém todos os procedimentos de um grupo
 */
export function getProceduresByGroup(groupCode: string): SigtapProcedure[] {
  const group = SIGTAP_DATA.find(g => g.code === groupCode)
  if (!group) return []
  return group.subGroups.flatMap(sg => sg.procedures)
}

/**
 * Obtém todos os procedimentos
 */
export function getAllProcedures(): SigtapProcedure[] {
  return SIGTAP_DATA.flatMap(g => g.subGroups.flatMap(sg => sg.procedures))
}

/**
 * Conta total de procedimentos
 */
export function getTotalProceduresCount(): number {
  return getAllProcedures().length
}

/**
 * Busca procedimento por código
 */
export function getProcedureByCode(code: string): SigtapProcedure | undefined {
  for (const group of SIGTAP_DATA) {
    for (const subGroup of group.subGroups) {
      const procedure = subGroup.procedures.find(p => p.code === code)
      if (procedure) return procedure
    }
  }
  return undefined
}

/**
 * Obtém grupo e subgrupo de um procedimento
 */
export function getGroupAndSubGroupByProcedure(procedureCode: string): { group: SigtapGroup; subGroup: SigtapSubGroup } | null {
  for (const group of SIGTAP_DATA) {
    for (const subGroup of group.subGroups) {
      if (subGroup.procedures.some(p => p.code === procedureCode)) {
        return { group, subGroup }
      }
    }
  }
  return null
}
