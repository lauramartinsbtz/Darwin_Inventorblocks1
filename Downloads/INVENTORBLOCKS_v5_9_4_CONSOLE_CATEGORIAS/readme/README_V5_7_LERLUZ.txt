INVENTORBLOCKS v5.7 - SENSOR ANALÓGICO LERLUZ

NOVO BLOCO
- Categoria: Sensores
- Bloco: LerLuz [A0/A1]
- A0 = GPIO 1
- A1 = GPIO 2
- O bloco retorna um valor numérico analógico.
- Com resolução de 12 bits, a leitura bruta esperada é de 0 a 4095.
- Pode ser encaixado diretamente no bloco Atribuir.

EXEMPLO
Criar variável: luz
Atribuir luz = LerLuz A0
Exibir luz

PROTOCOLO
Navegador envia:
  LerLuz A0
ou:
  LerLuz A1

ESP32-S3 responde, por exemplo:
  OK 2387

MAPEAMENTO DIGITAL PRESERVADO
D0 = GPIO 15
D1 = GPIO 18
D2 = GPIO 40
D3 = GPIO 39

HC-SR04 PRESERVADO
TRIG = GPIO 16
ECHO = GPIO 17

ATENÇÃO ELÉTRICA
A entrada analógica do ESP32-S3 não deve receber 5 V.
Use sinais compatíveis com 3,3 V.

RECURSOS PRESERVADOS
- USB Web Serial
- Bluetooth LE
- LED
- Sirene
- Botão em variável (0/1)
- SE/Então
- Matemática/variáveis
- Exibir
- HC-SR04
- Servo 9G
