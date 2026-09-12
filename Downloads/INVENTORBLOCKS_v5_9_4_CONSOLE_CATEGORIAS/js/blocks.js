const INVENTOR_PORTS = [
  ["D0", "D0"],
  ["D1", "D1"],
  ["D2", "D2"],
  ["D3", "D3"]
];

const INVENTOR_ANALOG_PORTS = [
  ["A-0", "A-0"],
  ["A-1", "A-1"]
];

Blockly.Blocks["inicio"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Início");
    this.appendStatementInput("DO")
      .appendField("executar em loop");
    this.setColour("#FFAB19");
    this.setTooltip("Ponto inicial do programa. Os blocos internos são repetidos continuamente.");
    this.setDeletable(true);
  }
};




// =========================================================
// LÓGICA - comparador personalizado
// O IF, verdadeiro/falso e E/OU usam blocos nativos do Blockly.
// =========================================================
Blockly.Blocks["logica_comparacao"] = {
  init: function() {
    this.appendValueInput("A")
      .setCheck("Number");
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ["==", "EQ"],
        ["≠", "NEQ"],
        ["≥", "GTE"],
        ["≤", "LTE"],
        [">", "GT"],
        ["<", "LT"]
      ]), "OP");
    this.appendValueInput("B")
      .setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour("#5B80A5");
    this.setTooltip("Compara dois valores.");
  }
};

// Comparação: ==, ≠, ≥, ≤, >, <
// Verdadeiro / falso
// E / OU
// IF principal com mutator padrão do Blockly.
function criarBlocoSaida(tipo, nome, cor) {
  Blockly.Blocks[tipo] = {
    init: function() {
      this.appendDummyInput()
        .appendField(nome)
        .appendField(new Blockly.FieldDropdown(INVENTOR_PORTS), "PORT");

      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(cor);
    }
  };
}

criarBlocoSaida("ligar_led", "LigarLed", "#4C97FF");
criarBlocoSaida("desligar_led", "DesligarLed", "#4C97FF");
criarBlocoSaida("ligar_sirene", "LigarSirene", "#CF63CF");
criarBlocoSaida("desligar_sirene", "DesligarSirene", "#CF63CF");

Blockly.Blocks["esperar_ms"] = {
  init: function() {
    this.appendValueInput("TIME")
      .setCheck("Number")
      .appendField("Esperar");

    this.appendDummyInput()
      .appendField("ms");

    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#5CA65C");
    this.setTooltip("Pausa a execução pelo tempo informado.");
  }
};


// Entrada digital: retorna 1 quando pressionado e 0 quando solto.
// O bloco pode ser usado tanto em condições (SE) quanto em entradas numéricas,
// como no bloco "Atribuir".
Blockly.Blocks["ler_botao"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("LerBotao")
      .appendField(new Blockly.FieldDropdown(INVENTOR_PORTS), "PORT");
    this.setOutput(true, ["Boolean", "Number"]);
    this.setColour("#5CB1D6");
    this.setTooltip("Retorna 1 quando o botão está pressionado e 0 quando está solto. Selecione D0, D1, D2 ou D3.");
  }
};

// Estrutura condicional simplificada para uso educacional.


// =========================================================
// SERVO-MOTOR 9G
// =========================================================
Blockly.Blocks["mover_servo_9g"] = {
  init: function() {
    this.appendValueInput("ANGLE")
      .setCheck("Number")
      .appendField("Mover Servo 9G")
      .appendField(new Blockly.FieldDropdown(INVENTOR_PORTS), "PORT")
      .appendField("para");

    this.appendDummyInput()
      .appendField("graus");

    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#9966FF");
    this.setTooltip("Move um servo 9G conectado à porta selecionada para um ângulo entre 0 e 180 graus.");
  }
};

Blockly.Blocks["graus_servo"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Ângulo")
      .appendField(new Blockly.FieldNumber(90, 0, 180, 1), "ANGLE")
      .appendField("°");
    this.setOutput(true, "Number");
    this.setColour("#9966FF");
    this.setTooltip("Valor do ângulo do servo, de 0 a 180 graus.");
  }
};


// =========================================================
// MATEMÁTICA / VARIÁVEIS
// =========================================================
// A criação da variável é feita pelo botão nativo do Blockly na toolbox,
// que abre uma caixa perguntando o nome. Este bloco atribui um inteiro.
Blockly.Blocks["atribuir_inteiro"] = {
  init: function() {
    this.appendValueInput("VALUE")
      .setCheck("Number")
      .appendField("Atribuir")
      .appendField(new Blockly.FieldVariable("variável"), "VAR")
      .appendField("=");

    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#5C81A6");
    this.setTooltip("Atribui à variável um valor inteiro ou uma leitura numérica, como a distância em cm.");
  }
};

Blockly.Blocks["numero_inteiro"] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldNumber(0, null, null, 1), "NUM");
    this.setOutput(true, "Number");
    this.setColour("#5C81A6");
    this.setTooltip("Valor numérico inteiro.");
  }
};

// =========================================================
// SENSOR DE DISTÂNCIA HC-SR04
// TRIG = GPIO 16 / ECHO = GPIO 17
// =========================================================
Blockly.Blocks["ler_distancia_hc04"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("LerDistancia");
    this.setOutput(true, "Number");
    this.setColour("#2E8B57");
    this.setTooltip("Lê a distância do HC-SR04 em centímetros. TRIG no GPIO 16 e ECHO no GPIO 17.");
  }
};



// =========================================================
// =========================================================
// SENSOR ANALÓGICO DE LUZ
// A-0 = GPIO 1 / A-1 = GPIO 2
// =========================================================
Blockly.Blocks["ler_luz"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("LerLuz")
      .appendField(new Blockly.FieldDropdown(INVENTOR_ANALOG_PORTS), "PORT");
    this.setOutput(true, "Number");
    this.setColour("#2E8B57");
    this.setTooltip("Lê o valor analógico do sensor de luz. A-0 = GPIO 1 e A-1 = GPIO 2.");
  }
};
Blockly.Blocks["ler_inclinacao"] = {
  init: function() {
    this.appendDummyInput().appendField("LerInclinacao")
      .appendField(new Blockly.FieldDropdown(INVENTOR_ANALOG_PORTS), "PORT");
    this.setOutput(true, "Number");
    this.setColour("#2E8B57");
    this.setTooltip("Lê o SW-520D em A-0 (GPIO 1) ou A-1 (GPIO 2), retornando 0 ou 1.");
  }
};


Blockly.Blocks["exibir_variavel"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Exibir")
      .appendField(new Blockly.FieldVariable("variável"), "VAR");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#5C81A6");
    this.setTooltip("Exibe no console do InventorBlocks o valor atual da variável selecionada.");
  }
};
