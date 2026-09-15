INVENTORBLOCKS v5.7.2

Portas analógicas renomeadas:
A-0 -> GPIO 1
A-1 -> GPIO 2

O hífen aparece no Blockly e também é usado no protocolo textual:
LerLuz A-0
LerLuz A-1

No firmware, A-0 e A-1 NÃO são identificadores C++.
São textos convertidos internamente para GPIO 1 e GPIO 2.
Isso evita conflito com as definições A0/A1 do core Arduino ESP32.

Exemplo:
Atribuir luz = LerLuz A-0
Exibir luz
