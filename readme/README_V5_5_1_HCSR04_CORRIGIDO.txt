INVENTORBLOCKS v5.5.1 - CORREÇÃO HC-SR04

HC-SR04:
- TRIG = GPIO 16
- ECHO = GPIO 17
- 3 tentativas por leitura
- 60 ms entre tentativas
- timeout de 40 ms
- pulso TRIG de 12 us
- aguarda ECHO voltar a LOW antes de novo disparo
- rejeita leituras fora da faixa 2..400 cm

Diagnóstico:
Se não houver eco, o firmware responde:
ERR HC_SR04_SEM_ECO GPIO17=0
ou
ERR HC_SR04_SEM_ECO GPIO17=1

GPIO17=0 normalmente indica que nenhum pulso HIGH chegou ao ESP32-S3.
GPIO17=1 indica que a linha ECHO ficou presa em HIGH.

IMPORTANTE:
- HC-SR04 padrão deve ser alimentado com 5 V.
- GND do sensor e GND do ESP32-S3 devem ser comuns.
- ECHO de 5 V deve passar por divisor resistivo/conversor de nível antes do GPIO17.
- Exemplo de divisor: 1 kOhm entre ECHO e GPIO17 e 2 kOhm entre GPIO17 e GND.
