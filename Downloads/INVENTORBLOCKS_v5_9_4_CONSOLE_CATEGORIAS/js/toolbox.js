const INVENTOR_TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Controle",
      colour: "#FFAB19",
      contents: [
        { kind: "block", type: "inicio" },
        {
          kind: "block",
          type: "esperar_ms",
          inputs: {
            TIME: {
              shadow: {
                type: "math_number",
                fields: { NUM: 1000 }
              }
            }
          }
        }
      ]
    },
    {
      kind: "category",
      name: "Lógica",
      colour: "#5B80A5",
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
        { kind: "block", type: "logic_operation" }
      ]
    },
    {
      kind: "category",
      name: "Atuadores",
      colour: "#4C97FF",
      contents: [
        { kind: "block", type: "ligar_led" },
        { kind: "block", type: "desligar_led" },
        { kind: "block", type: "ligar_sirene" },
        { kind: "block", type: "desligar_sirene" }
      ]
    },
    {
      kind: "category",
      name: "Matemática",
      colour: "#5C81A6",
      contents: [
        {
          kind: "button",
          text: "Criar nova variável",
          callbackKey: "CREATE_VARIABLE"
        },
        {
          kind: "block",
          type: "atribuir_inteiro",
          inputs: {
            VALUE: {
              block: {
                type: "numero_inteiro",
                fields: { NUM: 0 }
              }
            }
          }
        },
        { kind: "block", type: "numero_inteiro" },
        { kind: "block", type: "exibir_variavel" }
      ]
    },
    {
      kind: "category",
      name: "Sensores",
      colour: "#2E8B57",
      contents: [
        { kind: "block", type: "ler_botao" },
        { kind: "block", type: "ler_distancia_hc04" },
        { kind: "block", type: "ler_inclinacao" },
        { kind: "block", type: "ler_luz" }
      ]
    },
    {
      kind: "category",
      name: "Servo",
      colour: "#9966FF",
      contents: [
        {
          kind: "block",
          type: "mover_servo_9g",
          inputs: {
            ANGLE: {
              block: {
                type: "graus_servo",
                fields: { ANGLE: 90 }
              }
            }
          }
        },
        { kind: "block", type: "graus_servo" }
      ]
    }
  ]
};
