INVENTORBLOCKS v5.9.4

CORREÇÕES
1. Leituras internas de sensores não aparecem mais no console:
   - LerBotao
   - LerDistanciaCM
   - LerInclinacao
   - LerLuz
   As linhas de protocolo "-> USB ..." e "<- USB OK valor" ficam ocultas.
   O mesmo vale para BLE.

2. O bloco Atribuir não imprime mais automaticamente "Variável x = valor".
   O valor só é mostrado quando o usuário usa o bloco Exibir.

3. Nomes visuais:
   - Ler botão -> LerBotao
   - Ler distância HC-SR04 -> LerDistancia

4. Categorias:
   Controle:
     - Início
     - Esperar

   Atuadores:
     - LigarLed
     - DesligarLed
     - LigarSirene
     - DesligarSirene

   Sensores:
     - LerBotao
     - LerDistancia
     - LerInclinacao
     - LerLuz

   Lógica, Matemática e Servo permanecem em suas respectivas categorias.

Todos os demais recursos anteriores foram preservados.
