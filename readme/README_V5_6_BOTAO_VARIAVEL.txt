INVENTORBLOCKS v5.6 - BOTÃO COMO VALOR DE VARIÁVEL

NOVO COMPORTAMENTO
- O bloco "Ler botão [D0-D3]" agora retorna um valor utilizável em entradas numéricas:
    pressionado = 1
    solto       = 0
- Pode ser encaixado diretamente no bloco:
    Atribuir [variável] = [Ler botão D0]
- O mesmo bloco continua compatível com o bloco SE/Então.

PORTAS ATUAIS
D0 = GPIO 15
D1 = GPIO 18
D2 = GPIO 40
D3 = GPIO 39

LIGAÇÃO DO BOTÃO
- O firmware usa INPUT_PULLUP.
- Ligue o botão entre a porta selecionada e GND.
- Não é necessário resistor pull-up externo para esse uso básico.

EXEMPLO
Criar variável: botao
Atribuir botao = Ler botão D2
Exibir botao

Resultado:
- pressionado: botao = 1
- solto:       botao = 0

RECURSOS ANTERIORES PRESERVADOS
- USB Web Serial
- Bluetooth LE
- LED e sirene
- SE/Então
- Servo 9G
- Matemática/variáveis
- Exibir
- HC-SR04: TRIG GPIO16 / ECHO GPIO17
