const INVENTOR_PORTS = [
  ["D0", "D0"],
  ["D1", "D1"],
  ["D2", "D2"],
  ["D3", "D3"]
];

const INVENTOR_LED_PORTS = [
  ["D0", "D0"], ["D1", "D1"], ["D2", "D2"], ["D3", "D3"],
  ["Interna 4", "INTERNA4"]
];

const INVENTOR_SIRENE_PORTS = [
  ["D0", "D0"],
  ["D1", "D1"],
  ["D2", "D2"],
  ["D3", "D3"],
  ["Interna 5", "INTERNA5"]
];

const INVENTOR_LUZ_PORTS = [
  ["A-0", "A-0"], ["A-1", "A-1"], ["Interna 41", "INTERNA41"]
];

const INVENTOR_ANALOG_PORTS = [
  ["A-0", "A-0"],
  ["A-1", "A-1"]
];

Blockly.Blocks["inicio"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Início");
    this.appendStatementInput("DO");
    this.setColour("#FF9F1C");
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
        ["=", "EQ"],
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
    this.setColour("#4C97FF");
    this.setTooltip("Compara dois valores.");
  }
};

// Comparação: ==, ≠, ≥, ≤, >, <
// Verdadeiro / falso
// E / OU
// IF principal com mutator padrão do Blockly.

// =========================================================
// LÓGICA - REPETIÇÃO
// =========================================================
Blockly.Blocks["repita_vezes"] = {
  init: function() {
    this.appendValueInput("TIMES")
      .setCheck("Number")
      .appendField("Repita");
    this.appendStatementInput("DO")
      .appendField("vezes");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C97FF");
    this.setTooltip("Repete os comandos internos pelo número de vezes informado.");
  }
};


Blockly.Blocks["repita_enquanto"] = {
  init: function() {
    this.appendValueInput("COND").setCheck("Boolean").appendField("Repita enquanto");
    this.appendStatementInput("DO").appendField("faça");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C97FF");
    this.setTooltip("Repete os comandos enquanto a condição for verdadeira.");
  }
};

Blockly.Blocks["para_variavel"] = {
  init: function() {
    this.appendValueInput("FROM")
      .setCheck("Number")
      .appendField("Para")
      .appendField(new Blockly.FieldVariable("i"), "VAR")
      .appendField("de");
    this.appendValueInput("TO")
      .setCheck("Number")
      .appendField("até");
    this.appendValueInput("BY")
      .setCheck("Number")
      .appendField("passo");
    this.appendStatementInput("DO")
      .appendField("faça");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#4C97FF");
    this.setTooltip("Laço FOR: atribui a variável, percorre do valor inicial ao final usando o passo informado.");
  }
};

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

Blockly.Blocks["ligar_led"] = {
  init: function() {
    this.appendDummyInput().appendField("LigarLed").appendField(new Blockly.FieldDropdown(INVENTOR_LED_PORTS), "PORT");
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#7ED957");
  }
};
Blockly.Blocks["desligar_led"] = {
  init: function() {
    this.appendDummyInput().appendField("DesligarLed").appendField(new Blockly.FieldDropdown(INVENTOR_LED_PORTS), "PORT");
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#7ED957");
  }
};


Blockly.Blocks["texto_display"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Texto")
      .appendField(new Blockly.FieldTextInput("teste"), "TEXT");
    this.setOutput(true, "String");
    this.setColour("#7ED957");
    this.setTooltip("Texto que será enviado ao display OLED.");
  }
};

Blockly.Blocks["escrever_display"] = {
  init: function() {
    this.appendValueInput("TEXT")
      .setCheck("String")
      .appendField("EscreverDisplay");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#7ED957");
    this.setTooltip("Escreve uma linha de texto no display OLED.");
  }
};
Blockly.Blocks["limpar_display"] = {
  init: function() {
    this.appendDummyInput().appendField("LimparDisplay");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#7ED957");
    this.setTooltip("Limpa completamente o display OLED.");
  }
};


Blockly.Blocks["ligar_sirene"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("LigarSirene")
      .appendField(new Blockly.FieldDropdown(INVENTOR_SIRENE_PORTS), "PORT");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#7ED957");
    this.setTooltip("Liga a sirene em D0-D3 ou o buzzer interno no GPIO 5.");
  }
};

Blockly.Blocks["desligar_sirene"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("DesligarSirene")
      .appendField(new Blockly.FieldDropdown(INVENTOR_SIRENE_PORTS), "PORT");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#7ED957");
    this.setTooltip("Desliga a sirene em D0-D3 ou o buzzer interno no GPIO 5.");
  }
};

Blockly.Blocks["esperar_ms"] = {
  init: function() {
    this.appendValueInput("TIME")
      .setCheck("Number")
      .appendField("Esperar");

    this.appendDummyInput()
      .appendField("segundos");

    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#FF9F1C");
    this.setTooltip("Pausa a execução pelo número de segundos informado.");
  }
};


// Entrada digital: retorna 1 quando pressionado e 0 quando solto.
// O bloco pode ser usado tanto em condições (SE) quanto em entradas numéricas,
// como no bloco "Atribuir".
Blockly.Blocks["ler_botao"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("LerBotão")
      .appendField(new Blockly.FieldDropdown(INVENTOR_PORTS), "PORT");
    this.setOutput(true, ["Boolean", "Number"]);
    this.setColour("#FF6FAE");
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
      .appendField("MoverServo")
      .appendField(new Blockly.FieldDropdown(INVENTOR_PORTS), "PORT")
      .appendField("para");

    this.appendDummyInput()
      .appendField("graus");

    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#7ED957");
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
    this.setColour("#7ED957");
    this.setTooltip("Valor do ângulo do servo, de 0 a 180 graus.");
  }
};



// =========================================================
// MOTORES M1 / M2
// M1 = GPIO 14/21 | M2 = GPIO 47/48
// =========================================================
Blockly.Blocks["motor_duplo"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Motor")
      .appendField(new Blockly.FieldDropdown([
        ["M1", "M1"],
        ["M2", "M2"]
      ]), "MOTOR")
      .appendField(new Blockly.FieldDropdown([
        ["Frente", "FRENTE"],
        ["Ré", "RE"],
        ["Parar", "PARAR"]
      ]), "ACTION");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#7ED957");
    this.setTooltip("Controla M1 (GPIO 14/21) ou M2 (GPIO 47/48): Frente, Ré ou Parar.");
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
    this.setColour("#2F5DA8");
    this.setTooltip("Atribui à variável um valor inteiro ou uma leitura numérica, como a distância em cm.");
  }
};


Blockly.Blocks["variavel_valor"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Variável")
      .appendField(new Blockly.FieldVariable("variável"), "VAR");
    this.setOutput(true, "Number");
    this.setColour("#2F5DA8");
    this.setTooltip("Usa o valor atual da variável como entrada de outro bloco.");
  }
};


Blockly.Blocks["sortear_numeros"] = {
  init: function() {
    this.appendValueInput("MIN").setCheck("Number").appendField("SortearNúmeros");
    this.appendValueInput("MAX").setCheck("Number").appendField("até");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour("#2F5DA8");
    this.setTooltip("Sorteia um número inteiro entre os dois valores, inclusive.");
  }
};
Blockly.Blocks["numero_inteiro"] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldNumber(0, null, null, 1), "NUM");
    this.setOutput(true, "Number");
    this.setColour("#2F5DA8");
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
      .appendField("LerDistância");
    this.setOutput(true, "Number");
    this.setColour("#FF6FAE");
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
      .appendField(new Blockly.FieldDropdown(INVENTOR_LUZ_PORTS), "PORT");
    this.setOutput(true, "Number");
    this.setColour("#FF6FAE");
    this.setTooltip("Lê o valor analógico do sensor de luz. A-0 = GPIO 1 e A-1 = GPIO 2.");
  }
};
Blockly.Blocks["ler_inclinacao"] = {
  init: function() {
    this.appendDummyInput().appendField("LerInclinação")
      .appendField(new Blockly.FieldDropdown(INVENTOR_ANALOG_PORTS), "PORT");
    this.setOutput(true, "Number");
    this.setColour("#FF6FAE");
    this.setTooltip("Lê o SW-520D em A-0 (GPIO 1) ou A-1 (GPIO 2), retornando 0 ou 1.");
  }
};




Blockly.Blocks["ler_som"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("LerSom")
      .appendField(new Blockly.FieldDropdown(INVENTOR_ANALOG_PORTS), "PORT");
    this.setOutput(true, "Number");
    this.setColour("#FF6FAE");
    this.setTooltip("Lê o sensor de som em A-0 ou A-1. Faixa: 0 a 4095.");
  }
};
Blockly.Blocks["ler_magnetico"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("LerMagnético")
      .appendField(new Blockly.FieldDropdown(INVENTOR_ANALOG_PORTS), "PORT");
    this.setOutput(true, "Number");
    this.setColour("#FF6FAE");
    this.setTooltip("Lê o sensor magnético em A-0 ou A-1. Faixa: 0 a 4095.");
  }
};

Blockly.Blocks["ler_infravermelho"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("LerInfravermelho")
      .appendField(new Blockly.FieldDropdown(INVENTOR_ANALOG_PORTS), "PORT");
    this.setOutput(true, "Number");
    this.setColour("#FF6FAE");
    this.setTooltip("Lê o sensor infravermelho em A-0 ou A-1. Faixa: 0 a 4095.");
  }
};

Blockly.Blocks["exibir_variavel"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Exibir")
      .appendField(new Blockly.FieldVariable("variável"), "VAR");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#2F5DA8");
    this.setTooltip("Exibe no console do InventorBlocks o valor atual da variável selecionada.");
  }
};
