INVENTORBLOCKS v5.6.3 - CSS EMBUTIDO

Correção principal:
- O index.html NÃO depende mais de css/style.css para exibir a interface.
- Todo o CSS principal está embutido dentro do próprio index.html.
- A pasta css/style.css permanece apenas como cópia de manutenção.
- Isso elimina falhas de caminho relativo, cache ou carregamento de CSS ao abrir via file://.

Também preservado:
- Toolbox do Blockly e categorias laterais
- USB Web Serial e BLE
- LED e sirene
- Botão D0-D3 em variável (0/1)
- SE/Então
- Matemática, variáveis e Exibir
- HC-SR04 (TRIG GPIO16 / ECHO GPIO17)
- Servo 9G

Portas:
D0=GPIO15
D1=GPIO18
D2=GPIO40
D3=GPIO39
