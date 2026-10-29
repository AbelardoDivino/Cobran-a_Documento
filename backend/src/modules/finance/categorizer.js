const { normalize } = require('./import.parser');

const RULES = [
  ['Impostos', /\bdas\b|simples nacional|imposto|tributo|guia de recolhimento|inss|fgts|irpf|\biss\b/],
  ['Moradia', /aluguel|condominio|energia|luz|agua|gas|internet|telefone|iptu/],
  ['Alimentação', /mercado|supermerc|padaria|restaurante|ifood|lanchonete|acougue|hortifruti|cafe|pizza|delivery/],
  ['Transporte', /uber|99app|combustivel|posto|gasolina|etanol|taxi|estacionamento|pedagio|metro|onibus/],
  ['Saúde', /farmacia|drogaria|hospital|clinica|dentista|plano de saude|laboratorio|exame/],
  ['Educação', /escola|curso|faculdade|universidade|livraria|mensalidade escolar/],
  ['Lazer', /netflix|spotify|cinema|viagem|hotel|jogo|show|bar\b/],
  ['Pessoal', /salario|folha|pro-labore|prolabore|13o|ferias/],
  ['Serviços', /software|assinatura|saas|contabilidade|advogado|marketing|anuncio|google ads|meta ads/],
  ['Taxas', /tarifa|taxa|juros|multa|iof|anuidade/],
];

const TRANSFER = /transferencia|ted|doc|pix/;

function categorize(description, type) {
  const text = normalize(description);
  for (const [category, regex] of RULES) {
    if (regex.test(text)) return category;
  }
  if (TRANSFER.test(text)) return type === 'in' ? 'Entradas' : 'Transferências';
  return type === 'in' ? 'Entradas' : 'Outros';
}

const CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Pessoal',
  'Serviços',
  'Impostos',
  'Taxas',
  'Transferências',
  'Entradas',
  'Outros',
];

module.exports = { categorize, CATEGORIES };
