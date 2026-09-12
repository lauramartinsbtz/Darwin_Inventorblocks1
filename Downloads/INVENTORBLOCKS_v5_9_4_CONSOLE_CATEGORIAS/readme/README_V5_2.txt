INVENTORBLOCKS v5.2 ESTÁVEL

Correções desta versão:
- CSS refeito e responsivo para desktop, celular e tablet.
- Fallback de layout embutido no index.html caso o CSS externo não seja carregado.
- Cache-busting nos arquivos CSS/JS.
- Blockly fixado na versão 10.4.3 para evitar quebra por atualizações automáticas do CDN.
- Removido plugin personalizado de flyout que podia quebrar dropdowns e campos numéricos.
- Escala menor do flyout aplicada somente uma vez, após a criação do workspace.
- Dropdowns D0-D3 permanecem clicáveis.
- Campo Ângulo do Servo 9G permanece editável de 0 a 180 graus.
- USB Web Serial, Bluetooth LE, LerBotao, SE/Então e Servo 9G mantidos.
- Firmware ESP32-S3 mantido com D0=GPIO4, D1=GPIO5, D2=GPIO6 e D3=GPIO7.

Observação Bluetooth:
Web Bluetooth exige contexto seguro (HTTPS) nos navegadores que implementam essa API.
