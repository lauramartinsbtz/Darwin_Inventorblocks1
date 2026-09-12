INVENTORBLOCKS v5.9.3 - EXECUÇÃO LÓGICA CORRIGIDA

Correção:
- evaluateNumberBlock() não existia.
- Todas as chamadas foram substituídas por evaluateNumberValue(),
  que é o avaliador numérico já existente no InventorBlocks.

Isso corrige condições como:
- LerLuz A-0 >= 2000
- LerInclinacao A-1 == 1
- variavel < 30
- combinações com E / OU

Todos os recursos anteriores foram preservados.
