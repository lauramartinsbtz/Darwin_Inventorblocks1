INVENTORBLOCKS v5.9.2 - LÓGICA ESTÁVEL

Correção da categoria Lógica vazia.

Causa encontrada:
O blocks.js da v5.9.1 continha definições duplicadas dos blocos de lógica,
inclusive duas versões do IF com mutator. Isso podia fazer a flyout inteira
da categoria Lógica falhar.

Solução:
- removidas as definições duplicadas;
- o IF agora usa o bloco nativo controls_if do Blockly 10.4.2;
- esse IF já suporta múltiplos 'senão se' e um 'senão' final;
- verdadeiro/falso usa logic_boolean nativo;
- E/OU usa logic_operation nativo;
- somente o comparador é personalizado para mostrar:
  ==, ≠, ≥, ≤, >, <
- executor e prévia Arduino atualizados para os tipos nativos;
- menu lateral de segurança atualizado.
