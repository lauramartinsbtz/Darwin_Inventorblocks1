INVENTORBLOCKS v5.12

Novidades:
- PARAR interrompe a cadeia de blocos e esperas imediatamente.
- PararTudo no firmware desliga D0-D3, LED interno GPIO4, sirene GPIO5 e motores.
- Ao parar, o OLED apaga o texto do programa e volta a mostrar BLE_DEVICE_NAME.
- Novo bloco de Lógica: Para [variável] de [início] até [fim] passo [passo] faça.
- Novo atuador EscreverDisplay, ligado a um bloco Texto.
- OLED SSD1306: SDA GPIO8, SCL GPIO13, endereço 0x3C.

Bibliotecas Arduino:
- Adafruit SSD1306
- Adafruit GFX Library
- Wire (incluída no core ESP32)
