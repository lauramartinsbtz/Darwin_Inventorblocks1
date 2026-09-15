INVENTORBLOCKS v5.4 - SENSOR DE DISTÂNCIA HC-SR04

NOVO BLOCO
- Categoria Sensores
- Bloco: Ler distância HC-SR04 em cm
- O bloco retorna um valor numérico e pode ser encaixado no bloco Atribuir.

VARIÁVEIS
- O bloco Atribuir agora possui uma entrada numérica.
- Pode receber o bloco Número inteiro ou o bloco Ler distância HC-SR04 em cm.
- Exemplo: Atribuir distancia = Ler distância HC-SR04 em cm

LIGAÇÃO HC-SR04
- VCC: alimentação adequada ao HC-SR04
- GND: GND comum com o ESP32-S3
- TRIG: GPIO 16 do ESP32-S3
- ECHO: GPIO 17 do ESP32-S3 ATRAVÉS DE DIVISOR RESISTIVO OU CONVERSOR DE NÍVEL

ATENÇÃO ELÉTRICA
O ECHO de módulos HC-SR04 alimentados em 5 V pode apresentar nível lógico de aproximadamente 5 V.
Não aplique 5 V diretamente ao GPIO 17 do ESP32-S3. Use divisor resistivo ou conversor de nível para 3,3 V.

PROTOCOLO
O navegador envia:
  LerDistanciaCM
O firmware responde:
  OK 37
ou, se não houver eco dentro do timeout:
  ERR HC_SR04_SEM_ECO

A leitura é arredondada para centímetros inteiros para manter compatibilidade com as variáveis inteiras atuais.
