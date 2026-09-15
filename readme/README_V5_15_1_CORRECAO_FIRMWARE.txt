INVENTORBLOCKS v5.15.1

Correção do firmware:
- removido trecho LimparDisplay que havia sido inserido incorretamente depois do fechamento de void loop();
- LimparDisplay agora é interpretado corretamente como comando sem argumentos;
- PararTudo também é interpretado antes da validação de comandos com argumentos;
- adicionadas declarações antecipadas de LimparDisplay e EscreverDisplay.
