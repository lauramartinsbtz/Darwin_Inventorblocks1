INVENTORBLOCKS v5.7.1 - TOOLBOX ESTÁVEL

Correções específicas do menu lateral:
- Removida a toolbox XML duplicada do index.html.
- Blockly.inject() agora usa diretamente INVENTOR_TOOLBOX, definido em js/toolbox.js.
- Adicionada função garantirToolboxVisivel().
- Se o workspace abrir sem a barra lateral, updateToolbox(INVENTOR_TOOLBOX) é aplicado automaticamente.
- Reaplicação após o primeiro ciclo de renderização e após redimensionamento.
- Removido display:block forçado da classe .blocklyToolboxDiv, evitando conflito com o posicionamento interno do Blockly.
- CSS principal continua embutido no index.html.

Recursos preservados:
- LerLuz A0/A1
- Botão 0/1 em variável
- HC-SR04
- Servo 9G
- Matemática e variáveis
- Exibir
- LED e sirene
- USB Web Serial
- Bluetooth LE

Mapeamento:
D0 = GPIO15
D1 = GPIO18
D2 = GPIO40
D3 = GPIO39
A0 = GPIO1
A1 = GPIO2
HC-SR04 TRIG = GPIO16
HC-SR04 ECHO = GPIO17
