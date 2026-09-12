INVENTORBLOCKS v5 - ESP32-S3 - USB + BLE + SERVO 9G

Novidades desta versão:
- Bloco "Mover Servo 9G" com seletor de porta D0, D1, D2 ou D3.
- Bloco avulso "Ângulo" para informar valores de 0 a 180 graus.
- Firmware recebe o comando: MoverServo9G Dn ANGULO.
- Controle do servo por PWM LEDC nativo do ESP32-S3 em 50 Hz, sem biblioteca externa de servo.
- Compatibilidade de código com Arduino-ESP32 2.x e 3.x para o LEDC.
- USB e Bluetooth LE continuam usando o mesmo protocolo.
- Blocos exibidos nas categorias da caixa de ferramentas aparecem em escala reduzida.

Mapeamento físico:
D0 -> GPIO 15
D1 -> GPIO 18
D2 -> GPIO 40
D3 -> GPIO 39

Servo 9G / SG90:
- Sinal: uma das portas D0-D3 selecionada no bloco.
- Alimentação do servo deve ser adequada; não alimente o motor diretamente de um GPIO.
- Recomenda-se GND comum entre a fonte do servo e o ESP32-S3.
