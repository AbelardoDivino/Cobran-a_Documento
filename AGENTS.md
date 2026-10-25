# AGENTS.md

## SKILL: TOKEN-EFFICIENT-CODING

Prioridade: **MENOS TOKENS → MENOS CONTEXTO → ALTERAÇÃO PRECISA → TESTE → RESULTADO**

### 1. Regra principal
- Não explicar o que não foi solicitado.
- Não repetir código já conhecido, arquivos inteiros, explicações básicas, requisitos já definidos, contexto já disponível nem código não alterado.
- Responder de forma objetiva, em português.

### 2. Antes de alterar código
Determinar: (1) qual arquivo, (2) qual função/componente, (3) qual o problema, (4) qual a menor alteração que resolve. Não analisar o projeto inteiro se não for necessário.

### 3. Leitura de arquivos
Nunca ler arquivos enormes inteiros sem necessidade. Buscar função, variável, rota, classe ou mensagem de erro e ler só o trecho relevante.

### 4. Alterações mínimas
Nunca reescrever arquivo inteiro quando poucas linhas resolvem. Preservar arquitetura, nomes, lógica, estilos, imports, comentários úteis e comportamento existente.

### 5. Não inventar
Não criar arquivos, dependências, abstrações, funções ou componentes duplicados, nem refatorações não solicitadas. Reutilizar o que já funciona.

### 6. Contexto
Usar o contexto já fornecido. Não reperguntar o que já foi informado. Perguntar só quando faltar informação realmente necessária; se há informação suficiente, executar.

### 7. Respostas curtas
Formato ao terminar: *Alterado:* arquivo · *Mudança:* descrição curta · *Teste:* resultado.

### 8. Erros
Identificar a causa mais provável → corrigir só ela → testar → finalizar ou investigar o próximo erro. Não corrigir 10 problemas hipotéticos de uma vez.

### 9. Terminal
Evitar comandos desnecessários; usar apenas o comando diretamente relacionado ao problema. Não instalar "por garantia" nem limpar/reinstalar sem motivo.

### 10. Dependências
Verificar se já existe e se o que já existe resolve antes de instalar. Não adicionar dependências por conveniência.

### 11. Git
Nunca fazer automaticamente `git reset --hard`, apagar arquivos, sobrescrever alterações do usuário, reverter commits ou force push. Preservar alterações existentes.

### 12. Testes
Ciclo curto: alterar → testar → corrigir → testar. Não acumular alterações antes de testar.

### 13. Quando pedirem código
Entregar só a correção pedida. Sem projeto inteiro, tutorial ou arquivos não relacionados.

### 14. Quando pedirem implementação
Passos pequenos: identificar arquivo → implementar → testar → corrigir → finalizar. Sem funcionalidades extras.

### 15. Não refatorar sem pedido
Código que funciona não vira nova arquitetura, novos arquivos, novas abstrações ou novas dependências sem autorização.

### 16. Não gerar texto desnecessário
Sem "Claro!", "Com certeza!", "Vamos analisar detalhadamente...", "Primeiramente...", "Espero que isso ajude..." nem explicações repetitivas. Ir direto ao trabalho.

### 17. Prioridades em conflito
EXECUÇÃO > EXPLANAÇÃO · MENOR ALTERAÇÃO FUNCIONAL · PRESERVAR O CÓDIGO EXISTENTE

### 18. Resumo
LER MENOS · PENSAR NO PROBLEMA · ALTERAR MENOS · TESTAR RÁPIDO · RESPONDER CURTO

Nunca economizar tokens sacrificando segurança ou correção.
