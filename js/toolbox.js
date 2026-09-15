const INVENTOR_TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Controle",
      colour: "#FF9F1C",
      contents: [
        { kind: "block", type: "inicio" },
        {
          kind: "block",
          type: "esperar_ms",
          inputs: {
            TIME: { shadow: { type: "math_number", fields: { NUM: 1 } } }
          }
        }
      ]
    },
    {
      kind: "category",
      name: "Sensores",
      colour: "#FF6FAE",
      contents: [
        { kind: "block", type: "ler_botao" },
        { kind: "block", type: "ler_distancia_hc04" },
        { kind: "block", type: "ler_inclinacao" },
        { kind: "block", type: "ler_luz" },
        { kind: "block", type: "ler_som" },
        { kind: "block", type: "ler_magnetico" },
        { kind: "block", type: "ler_infravermelho" }
      ]
    },
    {
      kind: "category",
      name: "Atuadores",
      colour: "#7ED957",
      contents: [
        { kind: "block", type: "ligar_led" },
        { kind: "block", type: "desligar_led" },
        { kind: "block", type: "ligar_sirene" },
        { kind: "block", type: "desligar_sirene" },
        { kind: "block", type: "motor_duplo" },
        {
          kind: "block",
          type: "mover_servo_9g",
          inputs: {
            ANGLE: { block: { type: "graus_servo", fields: { ANGLE: 90 } } }
          }
        },
        { kind: "block", type: "graus_servo" },
        { kind: "block", type: "escrever_display",
          inputs: { TEXT: { shadow: { type: "texto_display", fields: { TEXT: "teste" } } } }
        },
        { kind: "block", type: "limpar_display" },
        { kind: "block", type: "texto_display" }
      ]
    },
    {
      kind: "category",
      name: "Lógica",
      colour: "#4C97FF",
      contents: [
        { kind: "block", type: "controls_if" },
        {
          kind: "block",
          type: "logica_comparacao",
          inputs: {
            A: { shadow: { type: "numero_inteiro", fields: { NUM: 0 } } },
            B: { shadow: { type: "numero_inteiro", fields: { NUM: 0 } } }
          }
        },
        { kind: "block", type: "logic_boolean" },
        { kind: "block", type: "logic_operation" },
        { kind: "block", type: "repita_enquanto" },
        { kind: "block", type: "para_variavel",
          inputs: {
            FROM: { shadow: { type: "numero_inteiro", fields: { NUM: 0 } } },
            TO: { shadow: { type: "numero_inteiro", fields: { NUM: 10 } } },
            BY: { shadow: { type: "numero_inteiro", fields: { NUM: 1 } } }
          }
        },
        { kind: "block", type: "repita_vezes", inputs: { TIMES: { shadow: { type: "numero_inteiro", fields: { NUM: 2 } } } } }
      ]
    },
    {
      kind: "category",
      name: "Matemática",
      colour: "#2F5DA8",
      contents: [
        { kind: "button", text: "Criar nova variável", callbackKey: "CREATE_VARIABLE" },
        {
          kind: "block",
          type: "atribuir_inteiro",
          inputs: {
            VALUE: { block: { type: "numero_inteiro", fields: { NUM: 0 } } }
          }
        },
        { kind: "block", type: "numero_inteiro" },
        { kind: "block", type: "sortear_numeros", inputs: { MIN: { shadow: { type: "numero_inteiro", fields: { NUM: 1 } } }, MAX: { shadow: { type: "numero_inteiro", fields: { NUM: 10 } } } } },
        { kind: "block", type: "variavel_valor" },
        { kind: "block", type: "exibir_variavel" }
      ]
    }
  ]
};
