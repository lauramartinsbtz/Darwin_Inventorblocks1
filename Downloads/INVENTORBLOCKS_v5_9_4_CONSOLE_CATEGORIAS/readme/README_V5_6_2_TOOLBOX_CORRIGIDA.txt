INVENTORBLOCKS v5.6.2 - TOOLBOX / CSS CORRIGIDOS

Correções:
- Barra lateral de categorias do Blockly restaurada.
- Removido flyout.setScale(), evitando interferência na toolbox.
- Removidos parâmetros ?v=... dos arquivos locais JS/CSS para melhor compatibilidade com file://.
- Removido CSS completo duplicado dentro do index.html.
- Mantido apenas CSS crítico mínimo no HTML.
- css/style.css é novamente a folha de estilos principal.
- Toolbox recebe regras explícitas de visibilidade e rolagem.
- Blockly.svgResize(workspace) executado após a inicialização e ao redimensionar a janela.

Recursos preservados:
USB, BLE, LED, sirene, botão D0-D3 em variável, SE/Então,
Matemática, variáveis, Exibir, HC-SR04 e Servo 9G.

Portas:
D0 = GPIO15
D1 = GPIO18
D2 = GPIO40
D3 = GPIO39

HC-SR04:
TRIG = GPIO16
ECHO = GPIO17
