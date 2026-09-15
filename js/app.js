
function validarBlocosDeLogica() {
  const tipos = [
    "controls_if",
    "logica_comparacao",
    "logic_boolean",
    "logic_operation"
  ];

  const ausentes = tipos.filter(type => !Blockly.Blocks[type]);

  if (ausentes.length) {
    appLog("Blocos de Lógica ausentes: " + ausentes.join(", "));
    console.error("Blocos de Lógica ausentes:", ausentes);
  } else {
    console.log("InventorBlocks: categoria Lógica pronta.");
  }
}


let INVENTOR_THEME = null;

function criarTemaInventorBlocks() {
  try {
    if (!window.Blockly || !Blockly.Theme || typeof Blockly.Theme.defineTheme !== "function") {
      return null;
    }

    return Blockly.Theme.defineTheme("inventorblocks", {
      base: Blockly.Themes && Blockly.Themes.Classic ? Blockly.Themes.Classic : undefined,
      blockStyles: {
        logic_blocks: {
          colourPrimary: "#4C97FF",
          colourSecondary: "#4C97FF",
          colourTertiary: "#4C97FF"
        }
      }
    });
  } catch (error) {
    console.warn("Tema personalizado não pôde ser aplicado; usando tema padrão.", error);
    return null;
  }
}

let workspace;

/* =========================================================
   ESTADO DAS CONEXÕES
   ========================================================= */

// USB / Web Serial
let port = null;
let reader = null;
let writer = null;
let serialBuffer = "";
let serialReading = false;

// Bluetooth LE / Web Bluetooth
const BLE_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const BLE_RX_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // navegador -> ESP32
const BLE_TX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // ESP32 -> navegador

let bleDevice = null;
let bleServer = null;
let bleRxCharacteristic = null;
let bleTxCharacteristic = null;
let bleBuffer = "";

// O canal ativo evita executar um mesmo comando duas vezes quando
// USB e BLE estiverem conectados simultaneamente.
let activeTransport = null; // "usb" | "ble" | null

const pendingResponses = {
  usb: [],
  ble: []
};

let executing = false;
let stopRequested = false;

// Valores das variáveis durante a execução no navegador.
// A chave é o ID interno da variável no Blockly.
const runtimeVariables = new Map();

const consoleEl = document.getElementById("console");
const codeEl = document.getElementById("generatedCode");
const statusUsbEl = document.getElementById("statusUsb");
const statusBleEl = document.getElementById("statusBle");
const statusActiveEl = document.getElementById("statusActive");

const btnConnectUsb = document.getElementById("btnConnectUsb");
const btnDisconnectUsb = document.getElementById("btnDisconnectUsb");
const btnConnectBle = document.getElementById("btnConnectBle");
const btnDisconnectBle = document.getElementById("btnDisconnectBle");
const btnRun = document.getElementById("btnRun");
const btnStop = document.getElementById("btnStop");
const btnClear = document.getElementById("btnClear");
const btnClearConsole = document.getElementById("btnClearConsole");
const toggleRightPanel = document.getElementById("toggleRightPanel");
const mainLayout = document.querySelector("main");

function appLog(message) {
  const now = new Date().toLocaleTimeString();
  consoleEl.textContent += `[${now}] ${message}\n`;
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function usbConnected() {
  return !!(port && writer);
}

function bleConnected() {
  return !!(
    bleDevice &&
    bleDevice.gatt &&
    bleDevice.gatt.connected &&
    bleRxCharacteristic &&
    bleTxCharacteristic
  );
}

function ensureActiveTransport() {
  if (activeTransport === "usb" && usbConnected()) return "usb";
  if (activeTransport === "ble" && bleConnected()) return "ble";

  if (usbConnected()) {
    activeTransport = "usb";
    return "usb";
  }

  if (bleConnected()) {
    activeTransport = "ble";
    return "ble";
  }

  activeTransport = null;
  return null;
}

function setActiveTransport(transport) {
  if (transport === "usb" && !usbConnected()) return;
  if (transport === "ble" && !bleConnected()) return;

  activeTransport = transport;
  updateConnectionUi();
}

function updateConnectionUi() {
  const usb = usbConnected();
  const ble = bleConnected();
  ensureActiveTransport();

  statusUsbEl.textContent = `USB: ${usb ? "conectado" : "desconectado"}${activeTransport === "usb" ? " • ATIVO" : ""}`;
  statusUsbEl.className = "status " + (usb ? "connected" : "disconnected");

  statusBleEl.textContent = `Bluetooth LE: ${ble ? "conectado" : "desconectado"}${activeTransport === "ble" ? " • ATIVO" : ""}`;
  statusBleEl.className = "status " + (ble ? "connected" : "disconnected");

  statusActiveEl.textContent = activeTransport === "usb"
    ? "Canal ativo: USB"
    : activeTransport === "ble"
      ? "Canal ativo: Bluetooth LE"
      : "Canal ativo: nenhum";
  statusActiveEl.className = "status " + (activeTransport ? "connected" : "neutral");

  btnConnectUsb.textContent = usb ? (activeTransport === "usb" ? "USB ativo" : "Usar USB") : "Conectar USB";
  btnConnectUsb.disabled = !("serial" in navigator) || (usb && activeTransport === "usb");
  btnDisconnectUsb.disabled = !usb;

  btnConnectBle.textContent = ble ? (activeTransport === "ble" ? "Bluetooth ativo" : "Usar Bluetooth") : "Conectar Bluetooth";
  btnConnectBle.disabled = !("bluetooth" in navigator) || (ble && activeTransport === "ble");
  btnDisconnectBle.disabled = !ble;
}

function setExecuting(value) {
  executing = value;
  btnRun.disabled = value;
  btnStop.disabled = !value;
}

function rejectPending(transport, message) {
  const queue = pendingResponses[transport];

  while (queue.length > 0) {
    const pending = queue.shift();
    clearTimeout(pending.timeout);
    pending.reject(new Error(message));
  }
}

/* =========================================================
   GERAÇÃO DO CÓDIGO ARDUINO
   ========================================================= */

function getNumberFromInput(block, inputName, fallback = 1000) {
  const target = block.getInputTargetBlock(inputName);

  if (!target) return fallback;

  if (target.type === "math_number" || target.type === "numero_inteiro") {
    const number = Number(target.getFieldValue("NUM"));
    return Number.isFinite(number) ? number : fallback;
  }

  if (target.type === "graus_servo") {
    const angle = Number(target.getFieldValue("ANGLE"));
    return Number.isFinite(angle) ? Math.max(0, Math.min(180, angle)) : fallback;
  }

  return fallback;
}

function variableModelFromBlock(block) {
  if (!block || !workspace) return null;
  const variableId = block.getFieldValue("VAR");
  return variableId ? workspace.getVariableById(variableId) : null;
}

function sanitizeCppIdentifier(name) {
  let result = String(name || "variavel")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_]/g, "_");

  if (!/^[A-Za-z_]/.test(result)) result = "v_" + result;
  if (!result) result = "variavel";

  const reserved = new Set([
    "auto", "break", "case", "char", "const", "continue", "default", "do",
    "double", "else", "enum", "extern", "float", "for", "goto", "if", "int",
    "long", "register", "return", "short", "signed", "sizeof", "static", "struct",
    "switch", "typedef", "union", "unsigned", "void", "volatile", "while", "class",
    "namespace", "new", "delete", "this", "true", "false", "setup", "loop"
  ]);
  if (reserved.has(result)) result = "var_" + result;
  return result;
}

function buildCppVariableNameMap() {
  const map = new Map();
  const used = new Set();
  if (!workspace) return map;

  for (const variable of workspace.getAllVariables()) {
    const base = sanitizeCppIdentifier(variable.name);
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) candidate = `${base}_${suffix++}`;
    used.add(candidate);
    map.set(variable.getId(), candidate);
  }
  return map;
}

function integerFieldValue(block, fieldName = "VALUE", fallback = 0) {
  const value = Number(block && block.getFieldValue(fieldName));
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

function cppNumberExpression(block, cppVariables = new Map(), fallback = "0") {
  if (!block) return fallback;

  if (block.type === "math_number" || block.type === "numero_inteiro") {
    const value = Number(block.getFieldValue("NUM"));
    return Number.isFinite(value) ? String(Math.trunc(value)) : fallback;
  }

  if (block.type === "graus_servo") {
    const value = Number(block.getFieldValue("ANGLE"));
    return Number.isFinite(value) ? String(Math.trunc(Math.max(0, Math.min(180, value)))) : fallback;
  }

  if (block.type === "variavel_valor") {
    const model = variableModelFromBlock(block);
    const cppName = model ? cppVariables.get(model.getId()) : null;
    return cppName || fallback;
  }

  if (block.type === "sortear_numeros") {
    const min = cppNumberExpression(block.getInputTargetBlock("MIN"), cppVariables, "0");
    const max = cppNumberExpression(block.getInputTargetBlock("MAX"), cppVariables, "0");
    return `random(min(${min}, ${max}), max(${min}, ${max}) + 1)`;
  }

  if (block.type === "ler_distancia_hc04") {
    return "LerDistanciaCM()";
  }

  if (block.type === "ler_luz") {
    return `LerLuz("${block.getFieldValue("PORT")}")`;
  }
  if (block.type === "ler_som") {
    return `LerSom("${block.getFieldValue("PORT")}")`;
  }
  if (block.type === "ler_inclinacao") {
    return `LerInclinacao("${block.getFieldValue("PORT")}")`;
  }

  if (block.type === "ler_magnetico") {
    return `LerMagnetico("${block.getFieldValue("PORT")}")`;
  }

  if (block.type === "ler_infravermelho") {
    return `LerInfravermelho("${block.getFieldValue("PORT")}")`;
  }

  if (block.type === "ler_botao") {
    return `(LerBotao(${block.getFieldValue("PORT")}) ? 1 : 0)`;
  }

  return fallback;
}

function arduinoCondition(block, cppVariables = new Map()) {
  if (!block) return "false";

  if (block.type === "logic_boolean") {
    return block.getFieldValue("BOOL") === "TRUE" ? "true" : "false";
  }

  if (block.type === "logica_comparacao") {
    const a = cppNumberExpression(block.getInputTargetBlock("A"), cppVariables, "0");
    const b = cppNumberExpression(block.getInputTargetBlock("B"), cppVariables, "0");
    const opMap = { EQ: "==", NEQ: "!=", GTE: ">=", LTE: "<=", GT: ">", LT: "<" };
    const op = opMap[block.getFieldValue("OP")] || "==";
    return `(${a} ${op} ${b})`;
  }

  if (block.type === "logic_operation") {
    const a = arduinoCondition(block.getInputTargetBlock("A"), cppVariables);
    const b = arduinoCondition(block.getInputTargetBlock("B"), cppVariables);
    const op = block.getFieldValue("OP") === "AND" ? "&&" : "||";
    return `(${a} ${op} ${b})`;
  }

  if (block.type === "ler_botao") {
    return `LerBotao(${block.getFieldValue("PORT")})`;
  }

  return `(${cppNumberExpression(block, cppVariables, "0")} != 0)`;
}

function arduinoForBlock(block, indent = "  ", cppVariables = new Map()) {
  if (!block) return "";

  let line = "";

  switch (block.type) {
    case "ligar_led":
      line = `${indent}LigarLed(${block.getFieldValue("PORT")});\n`;
      break;

    case "desligar_led":
      line = `${indent}DesligarLed(${block.getFieldValue("PORT")});\n`;
      break;

    case "ligar_sirene":
      line = `${indent}LigarSirene(${block.getFieldValue("PORT")});\n`;
      break;

    case "desligar_sirene":
      line = `${indent}DesligarSirene(${block.getFieldValue("PORT")});\n`;
      break;

    case "motor_duplo":
      line = `${indent}Motor("${block.getFieldValue("MOTOR")}", "${block.getFieldValue("ACTION")}");\n`;
      break;

    case "limpar_display": {
      line = `${indent}LimparDisplay();\n`;
      break;
    }

    case "escrever_display": {
      const texto = evaluateTextValue(block.getInputTargetBlock("TEXT"), "");
      line = `${indent}EscreverDisplay(${cppStringLiteral(texto)});\n`;
      break;
    }

    case "mover_servo_9g": {
      const angle = getNumberFromInput(block, "ANGLE", 90);
      line = `${indent}MoverServo9G(${block.getFieldValue("PORT")}, ${angle});\n`;
      break;
    }

    case "atribuir_inteiro": {
      const model = variableModelFromBlock(block);
      const cppName = model ? cppVariables.get(model.getId()) : null;
      const valueBlock = block.getInputTargetBlock("VALUE");
      const legacyValue = integerFieldValue(block, "VALUE", 0);
      const expression = valueBlock
        ? cppNumberExpression(valueBlock, cppVariables, "0")
        : String(legacyValue);
      line = cppName
        ? `${indent}${cppName} = ${expression};\n`
        : `${indent}// Selecione uma variável para receber ${expression}.\n`;
      break;
    }

    case "exibir_variavel": {
      const model = variableModelFromBlock(block);
      const cppName = model ? cppVariables.get(model.getId()) : null;
      line = cppName
        ? `${indent}Serial.println(${cppName});\n`
        : `${indent}// Selecione uma variável para exibir.\n`;
      break;
    }

    case "controls_if": {
      let out = "";
      let i = 0;

      while (block.getInput("IF" + i)) {
        const condition = arduinoCondition(
          block.getInputTargetBlock("IF" + i),
          cppVariables
        );

        out += i === 0
          ? `${indent}if (${condition}) {\n`
          : `${indent}else if (${condition}) {\n`;

        out += arduinoForBlock(
          block.getInputTargetBlock("DO" + i),
          indent + "  ",
          cppVariables
        );
        out += `${indent}}\n`;
        i++;
      }

      if (block.getInput("ELSE")) {
        out += `${indent}else {\n`;
        out += arduinoForBlock(
          block.getInputTargetBlock("ELSE"),
          indent + "  ",
          cppVariables
        );
        out += `${indent}}\n`;
      }

      line = out;
      break;
    }

    case "para_variavel": {
      const model = variableModelFromBlock(block);
      const cppName = model ? cppVariables.get(model.getId()) : null;
      const inicio = cppNumberExpression(block.getInputTargetBlock("FROM"), cppVariables, "0");
      const fim = cppNumberExpression(block.getInputTargetBlock("TO"), cppVariables, "0");
      const passo = cppNumberExpression(block.getInputTargetBlock("BY"), cppVariables, "1");
      if (!cppName) {
        line = `${indent}// Selecione uma variável para o laço Para.\n`;
        break;
      }
      line = `${indent}for (${cppName} = ${inicio}; (${passo}) >= 0 ? ${cppName} <= ${fim} : ${cppName} >= ${fim}; ${cppName} += (${passo})) {\n`;
      line += arduinoForBlock(block.getInputTargetBlock("DO"), indent + "  ", cppVariables);
      line += `${indent}}\n`;
      break;
    }

    case "repita_enquanto": {
      const condition = arduinoCondition(block.getInputTargetBlock("COND"), cppVariables);
      line = `${indent}while (${condition}) {\n`;
      line += arduinoForBlock(block.getInputTargetBlock("DO"), indent + "  ", cppVariables);
      line += `${indent}}\n`;
      break;
    }

    case "repita_vezes": {
      const times = Math.max(0, Math.trunc(getNumberFromInput(block, "TIMES", 2)));
      line = `${indent}for (int repeticao = 0; repeticao < ${times}; repeticao++) {\n`;
      line += arduinoForBlock(block.getInputTargetBlock("DO"), indent + "  ", cppVariables);
      line += `${indent}}\n`;
      break;
    }

    case "esperar_ms":
      line = `${indent}delay(${Math.max(0, getNumberFromInput(block, "TIME", 1)) * 1000});\n`;
      break;

    default:
      line = `${indent}// Bloco não reconhecido: ${block.type}\n`;
      break;
  }

  return line + arduinoForBlock(block.getNextBlock(), indent, cppVariables);
}

function findStartBlock() {
  return workspace.getTopBlocks(true).find(block => block.type === "inicio") || null;
}

function generateArduinoCode() {
  const start = findStartBlock();

  if (!start) {
    return `void setup() {
}

void loop() {
  // Adicione o bloco "Início".
}
`;
  }

  const first = start.getInputTargetBlock("DO");
  const cppVariables = buildCppVariableNameMap();
  const loopBody = arduinoForBlock(first, "  ", cppVariables);
  const variableDeclarations = Array.from(cppVariables.values())
    .map(name => `  static int ${name} = 0;`)
    .join("\n");

  return `void setup() {
  analogReadResolution(12);
}

void loop() {
${variableDeclarations ? variableDeclarations + "\n" : ""}${loopBody || "  // Conecte os comandos dentro do bloco Início.\n"}}
`;
}

function updateGeneratedCode() {
  codeEl.textContent = generateArduinoCode();
}

/* =========================================================
   PROTOCOLO DE RESPOSTA COMUM
   ========================================================= */

function comandoDeSensorSilencioso(command) {
  return /^(LerBotao|LerDistanciaCM|LerLuz|LerInclinacao|LerMagnetico|LerInfravermelho|LerSom)(?:\s|$)/.test(
    String(command || "").trim()
  );
}

function handleIncomingLine(line, transport) {
  line = line.replace("\r", "").trim();
  if (!line) return;

  const label = transport === "usb" ? "USB" : "BLE";

  // Associa OK/ERR ao comando pendente antes de decidir se mostra no console.
  const isResponse = line.startsWith("OK") || line.startsWith("ERR");
  const pendingPreview =
    isResponse && pendingResponses[transport].length > 0
      ? pendingResponses[transport][0]
      : null;

  const silent = Boolean(pendingPreview && pendingPreview.silent);

  if (!silent) {
    appLog(`← ${label} ${line}`);
  }

  if (line.startsWith("READY")) return;

  if (isResponse && pendingResponses[transport].length > 0) {
    const pending = pendingResponses[transport].shift();
    clearTimeout(pending.timeout);

    if (line.startsWith("OK")) {
      pending.resolve(line);
    } else {
      pending.reject(new Error(line));
    }
  }
}

function consumeTextBuffer(text, transport) {
  if (transport === "usb") {
    serialBuffer += text;

    let pos;
    while ((pos = serialBuffer.indexOf("\n")) >= 0) {
      const line = serialBuffer.slice(0, pos);
      serialBuffer = serialBuffer.slice(pos + 1);
      handleIncomingLine(line, "usb");
    }
    return;
  }

  bleBuffer += text;

  let pos;
  while ((pos = bleBuffer.indexOf("\n")) >= 0) {
    const line = bleBuffer.slice(0, pos);
    bleBuffer = bleBuffer.slice(pos + 1);
    handleIncomingLine(line, "ble");
  }
}

/* =========================================================
   USB / WEB SERIAL
   ========================================================= */

async function connectSerial() {
  if (usbConnected()) {
    setActiveTransport("usb");
    appLog("USB selecionado como canal ativo.");
    return;
  }

  if (!("serial" in navigator)) {
    throw new Error("Web Serial não está disponível neste navegador.");
  }

  port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  writer = port.writable.getWriter();
  reader = port.readable.getReader();

  serialReading = true;
  activeTransport = "usb";
  updateConnectionUi();
  appLog("USB conectado em 115200 baud e selecionado como canal ativo.");

  readSerialLoop();

  await waitMs(400);

  try {
    await sendCommandVia("usb", "PING", 1500);
  } catch (error) {
    appLog("Aviso: ESP32-S3 não respondeu ao PING pelo USB.");
  }
}

async function disconnectSerial() {
  serialReading = false;
  rejectPending("usb", "USB desconectado.");

  try {
    if (reader) {
      await reader.cancel();
      reader.releaseLock();
    }
  } catch (e) {}

  try {
    if (writer) writer.releaseLock();
  } catch (e) {}

  try {
    if (port) await port.close();
  } catch (e) {}

  reader = null;
  writer = null;
  port = null;
  serialBuffer = "";

  if (activeTransport === "usb") activeTransport = null;
  ensureActiveTransport();
  updateConnectionUi();
  appLog("USB desconectado.");
}

async function readSerialLoop() {
  const decoder = new TextDecoder();

  try {
    while (serialReading && reader) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      consumeTextBuffer(decoder.decode(value, { stream: true }), "usb");
    }
  } catch (error) {
    if (serialReading) {
      appLog("Erro de leitura USB: " + error.message);
    }
  }
}

/* =========================================================
   BLUETOOTH LE / WEB BLUETOOTH
   ========================================================= */

function handleBleNotification(event) {
  const value = event.target.value;
  const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  consumeTextBuffer(new TextDecoder().decode(bytes), "ble");
}

function handleBleDisconnected() {
  rejectPending("ble", "Bluetooth LE desconectado.");

  if (bleTxCharacteristic) {
    try {
      bleTxCharacteristic.removeEventListener("characteristicvaluechanged", handleBleNotification);
    } catch (e) {}
  }

  bleServer = null;
  bleRxCharacteristic = null;
  bleTxCharacteristic = null;
  bleBuffer = "";

  if (activeTransport === "ble") activeTransport = null;
  ensureActiveTransport();
  updateConnectionUi();
  appLog("Bluetooth LE desconectado.");
}

async function connectBluetooth() {
  if (bleConnected()) {
    setActiveTransport("ble");
    appLog("Bluetooth LE selecionado como canal ativo.");
    return;
  }

  if (!("bluetooth" in navigator)) {
    throw new Error("Web Bluetooth não está disponível neste navegador.");
  }

  if (!window.isSecureContext) {
    throw new Error("Bluetooth no navegador exige uma página em contexto seguro (HTTPS)." );
  }

  bleDevice = await navigator.bluetooth.requestDevice({
    filters: [
      { services: [BLE_SERVICE_UUID] }
    ],
    optionalServices: [BLE_SERVICE_UUID]
  });

  bleDevice.addEventListener("gattserverdisconnected", handleBleDisconnected);

  bleServer = await bleDevice.gatt.connect();
  const service = await bleServer.getPrimaryService(BLE_SERVICE_UUID);
  bleRxCharacteristic = await service.getCharacteristic(BLE_RX_UUID);
  bleTxCharacteristic = await service.getCharacteristic(BLE_TX_UUID);

  await bleTxCharacteristic.startNotifications();
  bleTxCharacteristic.addEventListener("characteristicvaluechanged", handleBleNotification);

  activeTransport = "ble";
  updateConnectionUi();
  appLog(`Bluetooth LE conectado a ${bleDevice.name || "ESP32-S3"} e selecionado como canal ativo.`);

  await waitMs(150);

  try {
    await sendCommandVia("ble", "PING", 2000);
  } catch (error) {
    appLog("Aviso: ESP32-S3 não respondeu ao PING pelo Bluetooth LE.");
  }
}

async function disconnectBluetooth() {
  rejectPending("ble", "Bluetooth LE desconectado.");

  if (bleTxCharacteristic) {
    try {
      bleTxCharacteristic.removeEventListener("characteristicvaluechanged", handleBleNotification);
    } catch (e) {}
  }

  try {
    if (bleDevice && bleDevice.gatt && bleDevice.gatt.connected) {
      bleDevice.gatt.disconnect();
    }
  } catch (e) {}

  bleServer = null;
  bleRxCharacteristic = null;
  bleTxCharacteristic = null;
  bleBuffer = "";

  if (activeTransport === "ble") activeTransport = null;
  ensureActiveTransport();
  updateConnectionUi();
  appLog("Bluetooth LE desconectado.");
}

/* =========================================================
   ENVIO DE COMANDOS - USB OU BLE
   ========================================================= */

async function writeTransport(transport, command) {
  const data = new TextEncoder().encode(command + "\n");

  if (transport === "usb") {
    if (!writer) throw new Error("USB não está conectado.");
    await writer.write(data);
    return;
  }

  if (transport === "ble") {
    if (!bleRxCharacteristic || !bleConnected()) {
      throw new Error("Bluetooth LE não está conectado.");
    }

    if (typeof bleRxCharacteristic.writeValueWithoutResponse === "function") {
      await bleRxCharacteristic.writeValueWithoutResponse(data);
    } else {
      await bleRxCharacteristic.writeValue(data);
    }
    return;
  }

  throw new Error("Canal de comunicação inválido.");
}

async function sendCommandVia(transport, command, timeoutMs = 2000) {
  const connected = transport === "usb" ? usbConnected() : bleConnected();

  if (!connected) {
    throw new Error(`${transport === "usb" ? "USB" : "Bluetooth LE"} não está conectado.`);
  }

  const label = transport === "usb" ? "USB" : "BLE";
  const silent = comandoDeSensorSilencioso(command);

  if (!silent) {
    appLog(`→ ${label} ${command}`);
  }

  let pending;

  const response = new Promise((resolve, reject) => {
    pending = {
      resolve,
      reject,
      silent,
      timeout: setTimeout(() => {
        const queue = pendingResponses[transport];
        const index = queue.indexOf(pending);
        if (index >= 0) queue.splice(index, 1);
        reject(new Error(`ESP32-S3 não respondeu via ${label}: ${command}`));
      }, timeoutMs)
    };

    pendingResponses[transport].push(pending);
  });

  try {
    await writeTransport(transport, command);
  } catch (error) {
    const queue = pendingResponses[transport];
    const index = queue.indexOf(pending);
    if (index >= 0) queue.splice(index, 1);
    clearTimeout(pending.timeout);
    throw error;
  }

  return response;
}

async function sendCommand(command, timeoutMs = 2000) {
  const transport = ensureActiveTransport();
  updateConnectionUi();

  if (!transport) {
    throw new Error("ESP32-S3 não está conectado por USB nem por Bluetooth LE.");
  }

  return sendCommandVia(transport, command, timeoutMs);
}

/* =========================================================
   EXECUÇÃO DOS BLOCOS NO NAVEGADOR
   ========================================================= */

function waitMs(ms) {
  return new Promise(resolve => {
    const inicio = Date.now();
    const verificar = () => {
      if (stopRequested || Date.now() - inicio >= ms) {
        resolve();
        return;
      }
      setTimeout(verificar, Math.min(25, Math.max(1, ms - (Date.now() - inicio))));
    };
    verificar();
  });
}


function evaluateTextValue(block, fallback = "") {
  if (!block) return fallback;
  if (block.type === "texto_display") {
    return String(block.getFieldValue("TEXT") ?? fallback);
  }
  if (block.type === "text") {
    return String(block.getFieldValue("TEXT") ?? fallback);
  }
  return fallback;
}

function cppStringLiteral(value) {
  return JSON.stringify(String(value ?? ""));
}

async function evaluateCondition(block) {
  if (!block) return false;

  if (block.type === "ler_botao") {
    const response = await sendCommand(`LerBotao ${block.getFieldValue("PORT")}`);
    const value = response.trim().split(/\s+/).pop();
    return value === "1" || value.toUpperCase() === "HIGH" || value.toUpperCase() === "TRUE";
  }

  return false;
}

async function evaluateNumberValue(block, fallback = 0) {
  if (!block) return fallback;

  if (block.type === "math_number" || block.type === "numero_inteiro") {
    const value = Number(block.getFieldValue("NUM"));
    return Number.isFinite(value) ? Math.trunc(value) : fallback;
  }

  if (block.type === "ler_botao") {
    const response = await sendCommand(`LerBotao ${block.getFieldValue("PORT")}`);
    const value = response.trim().split(/\s+/).pop();
    return (value === "1" || value.toUpperCase() === "HIGH" || value.toUpperCase() === "TRUE") ? 1 : 0;
  }

  if (block.type === "graus_servo") {
    const value = Number(block.getFieldValue("ANGLE"));
    return Number.isFinite(value)
      ? Math.trunc(Math.max(0, Math.min(180, value)))
      : fallback;
  }

  if (block.type === "variavel_valor") {
    const model = variableModelFromBlock(block);
    if (!model) return fallback;
    return runtimeVariables.has(model.getId())
      ? runtimeVariables.get(model.getId())
      : fallback;
  }

  if (block.type === "sortear_numeros") {
    const x = Math.trunc(await evaluateNumberValue(block.getInputTargetBlock("MIN"), 0));
    const y = Math.trunc(await evaluateNumberValue(block.getInputTargetBlock("MAX"), 0));
    const min = Math.min(x, y);
    const max = Math.max(x, y);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  if (block.type === "ler_distancia_hc04") {
    const response = await sendCommand("LerDistanciaCM", 2500);
    const value = Number(response.trim().split(/\s+/).pop());
    if (!Number.isFinite(value)) {
      throw new Error("Leitura inválida recebida do HC-SR04.");
    }
    return Math.trunc(value);
  }

  if (block.type === "ler_luz") {
    const response = await sendCommand(`LerLuz ${block.getFieldValue("PORT")}`, 2000);
    const value = Number(response.trim().split(/\s+/).pop());
    if (!Number.isFinite(value)) {
      throw new Error("Leitura analógica inválida recebida do sensor de luz.");
    }
    return Math.trunc(value);
  }
  if (block.type === "ler_som") {
    const response = await sendCommand(`LerSom ${block.getFieldValue("PORT")}`, 2000);
    const value = Number(response.trim().split(/\s+/).pop());
    if (!Number.isFinite(value)) throw new Error("Leitura inválida do sensor de som.");
    return Math.max(0, Math.min(4095, Math.trunc(value)));
  }

  if (block.type === "ler_inclinacao") {
    const response = await sendCommand(`LerInclinacao ${block.getFieldValue("PORT")}`, 2000);
    const value = Number(response.trim().split(/\s+/).pop());
    if (!Number.isFinite(value)) throw new Error("Leitura inválida do sensor de inclinação.");
    return Math.trunc(value);
  }

  if (block.type === "ler_magnetico") {
    const response = await sendCommand(`LerMagnetico ${block.getFieldValue("PORT")}`, 2000);
    const value = Number(response.trim().split(/\s+/).pop());
    if (!Number.isFinite(value)) throw new Error("Leitura inválida do sensor magnético.");
    return Math.max(0, Math.min(4095, Math.trunc(value)));
  }

  if (block.type === "ler_infravermelho") {
    const response = await sendCommand(`LerInfravermelho ${block.getFieldValue("PORT")}`, 2000);
    const value = Number(response.trim().split(/\s+/).pop());
    if (!Number.isFinite(value)) throw new Error("Leitura inválida do sensor infravermelho.");
    return Math.max(0, Math.min(4095, Math.trunc(value)));
  }

  return fallback;
}


async function evaluateBooleanBlock(block) {
  if (!block) return false;

  if (block.type === "logic_boolean") {
    return block.getFieldValue("BOOL") === "TRUE";
  }

  if (block.type === "logica_comparacao") {
    const a = await evaluateNumberValue(block.getInputTargetBlock("A"));
    const b = await evaluateNumberValue(block.getInputTargetBlock("B"));
    switch (block.getFieldValue("OP")) {
      case "EQ": return a === b;
      case "NEQ": return a !== b;
      case "GTE": return a >= b;
      case "LTE": return a <= b;
      case "GT": return a > b;
      case "LT": return a < b;
      default: return false;
    }
  }

  if (block.type === "logic_operation") {
    const a = await evaluateBooleanBlock(block.getInputTargetBlock("A"));
    if (block.getFieldValue("OP") === "AND") {
      if (!a) return false;
      return await evaluateBooleanBlock(block.getInputTargetBlock("B"));
    }
    if (a) return true;
    return await evaluateBooleanBlock(block.getInputTargetBlock("B"));
  }

  if (block.type === "ler_botao") {
    const response = await sendCommand(`LerBotao ${block.getFieldValue("PORT")}`);
    const value = response.trim().split(/\s+/).pop();
    return value === "1" || value.toUpperCase() === "HIGH" || value.toUpperCase() === "TRUE";
  }

  return Number(await evaluateNumberValue(block)) !== 0;
}

async function executeStatementChain(firstBlock) {
  let current = firstBlock;
  while (current && !stopRequested) {
    await executeBlock(current);
    if (stopRequested) break;
    current = current.getNextBlock();
  }
}

async function executeBlock(block) {
  if (stopRequested || !block) return;
  if (!block || stopRequested) return;

  switch (block.type) {
    case "ligar_led":
      await sendCommand(`LigarLed ${block.getFieldValue("PORT")}`);
      break;

    case "desligar_led":
      await sendCommand(`DesligarLed ${block.getFieldValue("PORT")}`);
      break;

    case "ligar_sirene":
      await sendCommand(`LigarSirene ${block.getFieldValue("PORT")}`);
      break;

    case "desligar_sirene":
      await sendCommand(`DesligarSirene ${block.getFieldValue("PORT")}`);
      break;

    case "motor_duplo":
      await sendCommand(`Motor ${block.getFieldValue("MOTOR")} ${block.getFieldValue("ACTION")}`);
      break;

    case "limpar_display": {
      await sendCommand("LimparDisplay");
      break;
    }

    case "escrever_display": {
      const texto = evaluateTextValue(block.getInputTargetBlock("TEXT"), "");
      await sendCommand(`EscreverDisplay ${texto.replace(/[\r\n]+/g, " ")}`);
      break;
    }

    case "mover_servo_9g": {
      const angle = getNumberFromInput(block, "ANGLE", 90);
      await sendCommand(`MoverServo9G ${block.getFieldValue("PORT")} ${angle}`);
      break;
    }

    case "atribuir_inteiro": {
      const model = variableModelFromBlock(block);
      if (!model) {
        appLog("Selecione uma variável no bloco Atribuir.");
        break;
      }

      const valueBlock = block.getInputTargetBlock("VALUE");
      const legacyValue = integerFieldValue(block, "VALUE", 0);
      const value = valueBlock
        ? await evaluateNumberValue(valueBlock, 0)
        : legacyValue;

      runtimeVariables.set(model.getId(), Math.trunc(value));
      break;
    }

    case "exibir_variavel": {
      const model = variableModelFromBlock(block);
      if (!model) {
        appLog("Selecione uma variável no bloco Exibir.");
        break;
      }
      const value = runtimeVariables.has(model.getId()) ? runtimeVariables.get(model.getId()) : 0;
      appLog(`${model.name} = ${value}`);
      break;
    }

    case "controls_if": {
      let executed = false;
      let i = 0;

      while (block.getInput("IF" + i)) {
        if (!executed) {
          const condition = await evaluateBooleanBlock(
            block.getInputTargetBlock("IF" + i)
          );

          if (condition) {
            await executeStatementChain(
              block.getInputTargetBlock("DO" + i)
            );
            executed = true;
          }
        }
        i++;
      }

      if (!executed && block.getInput("ELSE")) {
        await executeStatementChain(
          block.getInputTargetBlock("ELSE")
        );
      }
      break;
    }

    case "para_variavel": {
      const model = variableModelFromBlock(block);
      if (!model) break;

      const inicio = Math.trunc(await evaluateNumberValue(block.getInputTargetBlock("FROM"), 0));
      const fim = Math.trunc(await evaluateNumberValue(block.getInputTargetBlock("TO"), 0));
      let passo = Math.trunc(await evaluateNumberValue(block.getInputTargetBlock("BY"), 1));
      if (passo === 0) passo = inicio <= fim ? 1 : -1;

      const continua = passo > 0
        ? (valor) => valor <= fim
        : (valor) => valor >= fim;

      for (let valor = inicio; continua(valor) && !stopRequested; valor += passo) {
        runtimeVariables.set(model.getId(), valor);
        await executeStatementChain(block.getInputTargetBlock("DO"));
      }
      break;
    }

    case "repita_enquanto": {
      while (!stopRequested && await evaluateBooleanBlock(block.getInputTargetBlock("COND"))) {
        await executeStatementChain(block.getInputTargetBlock("DO"));
      }
      break;
    }

    case "repita_vezes": {
      const times = Math.max(0, Math.trunc(await evaluateNumberValue(block.getInputTargetBlock("TIMES"), 2)));
      for (let i = 0; i < times && !stopRequested; i++) {
        await executeStatementChain(block.getInputTargetBlock("DO"));
      }
      break;
    }

    case "esperar_ms":
      await waitMs(Math.max(0, getNumberFromInput(block, "TIME", 1)) * 1000);
      break;
  }
}

async function executeSequence(firstBlock) {
  let current = firstBlock;

  while (current && !stopRequested) {
    await executeBlock(current);
    current = current.getNextBlock();
  }
}

async function executeProgram() {
  if (!ensureActiveTransport()) {
    appLog("Conecte o ESP32-S3 por USB ou Bluetooth LE antes de executar.");
    return;
  }

  const start = findStartBlock();

  if (!start) {
    appLog('Adicione o bloco "Início" ao programa.');
    return;
  }

  const first = start.getInputTargetBlock("DO");

  if (!first) {
    appLog('Conecte comandos dentro do bloco "Início".');
    return;
  }

  stopRequested = false;
  runtimeVariables.clear();
  setExecuting(true);

  appLog(`Programa iniciado em loop via ${activeTransport === "usb" ? "USB" : "Bluetooth LE"}.`);

  try {
    while (!stopRequested) {
      await executeSequence(first);
      await waitMs(0);
    }
  } catch (error) {
    appLog("Erro de execução: " + error.message);
  } finally {
    setExecuting(false);

    if (stopRequested) {
      appLog("Programa interrompido.");
    }
  }
}

/* =========================================================
   INTERFACE
   ========================================================= */

// A escala do flyout é aplicada apenas uma vez após a criação do workspace.
// Isso preserva os eventos de clique dos dropdowns e campos numéricos.



function toolboxNativaEstaVisivel() {
  const toolboxDiv = document.querySelector(".blocklyToolboxDiv");
  if (!toolboxDiv) return false;

  const rect = toolboxDiv.getBoundingClientRect();
  const style = window.getComputedStyle(toolboxDiv);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity || "1") > 0 &&
    rect.width > 40 &&
    rect.height > 80
  );
}

function ativarMenuLateralDeSeguranca() {
  const area = document.querySelector(".workspace-area");
  if (!area) return;

  area.classList.add("fallback-toolbox-active");

  if (workspace && window.Blockly) {
    try { Blockly.svgResize(workspace); } catch (_) {}
  }
}

function desativarMenuLateralDeSeguranca() {
  const area = document.querySelector(".workspace-area");
  if (!area) return;

  area.classList.remove("fallback-toolbox-active");

  if (workspace && window.Blockly) {
    try { Blockly.svgResize(workspace); } catch (_) {}
  }
}

function criarBlocoNoWorkspace(type) {
  if (!workspace || !type || !Blockly.Blocks[type]) return;

  try {
    const block = workspace.newBlock(type);

    // Valores iniciais úteis para os blocos que possuem entrada numérica.
    if (type === "esperar_ms") {
      const shadow = workspace.newBlock("math_number");
      shadow.setFieldValue(1, "NUM");
      shadow.setShadow(true);
      shadow.initSvg();
      shadow.render();
      block.getInput("TIME").connection.connect(shadow.outputConnection);
    } else if (type === "repita_vezes") {
      const shadow = workspace.newBlock("numero_inteiro");
      shadow.setFieldValue(2, "NUM");
      shadow.setShadow(true);
      shadow.initSvg();
      shadow.render();
      block.getInput("TIMES").connection.connect(shadow.outputConnection);
    } else if (type === "atribuir_inteiro") {
      const value = workspace.newBlock("numero_inteiro");
      value.setFieldValue(0, "NUM");
      value.initSvg();
      value.render();
      block.getInput("VALUE").connection.connect(value.outputConnection);
    } else if (type === "mover_servo_9g") {
      const angle = workspace.newBlock("graus_servo");
      angle.setFieldValue(90, "ANGLE");
      angle.initSvg();
      angle.render();
      block.getInput("ANGLE").connection.connect(angle.outputConnection);
    }

    block.initSvg();
    block.render();

    // Coloca o bloco em uma área visível, deslocando os novos blocos.
    const existing = workspace.getTopBlocks(false);
    const index = Math.max(0, existing.length - 1);
    block.moveBy(36 + (index % 5) * 24, 36 + (index % 8) * 34);

    block.select();
    Blockly.svgResize(workspace);
  } catch (error) {
    appLog("Erro ao adicionar bloco " + type + ": " + error.message);
  }
}

function configurarMenuLateralDeSeguranca() {
  const menu = document.getElementById("fallbackToolbox");
  if (!menu) return;

  menu.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.action === "create-variable") {
      if (workspace) Blockly.Variables.createVariableButtonHandler(workspace);
      return;
    }

    if (button.dataset.blockType) {
      criarBlocoNoWorkspace(button.dataset.blockType);
    }
  });
}

function verificarMenuLateral() {
  if (!workspace) return;

  // Primeiro tenta recuperar a toolbox nativa somente se ela não existir.
  // Não atualizamos a toolbox só porque o layout ainda está calculando,
  // pois isso pode interromper a abertura do flyout.
  try {
    const nativeToolbox = workspace.getToolbox ? workspace.getToolbox() : null;
    if (!nativeToolbox) {
      workspace.updateToolbox(INVENTOR_TOOLBOX);
      Blockly.svgResize(workspace);
    }
  } catch (_) {}

  // Depois de o navegador concluir o layout, usa o fallback se necessário.
  setTimeout(() => {
    if (!workspace) return;
    if (toolboxNativaEstaVisivel()) {
      desativarMenuLateralDeSeguranca();
    } else {
      ativarMenuLateralDeSeguranca();
    }
  }, 300);
}

function garantirToolboxVisivel() {
  if (!workspace || typeof INVENTOR_TOOLBOX === "undefined") return;

  try {
    const toolbox = workspace.getToolbox ? workspace.getToolbox() : null;

    // Se o Blockly criou o workspace mas a toolbox ficou vazia/ausente,
    // força a reaplicação da definição JSON.
    if (!toolbox) {
      workspace.updateToolbox(INVENTOR_TOOLBOX);
    }

    Blockly.svgResize(workspace);

    // Segundo ciclo apenas para redimensionar. Reaplicar a toolbox toda vez
    // pode fechar o flyout logo após o clique da categoria em alguns navegadores.
    requestAnimationFrame(() => {
      if (!workspace) return;
      try { Blockly.svgResize(workspace); } catch (_) {}
    });
  } catch (error) {
    console.error("Falha ao restaurar toolbox:", error);
  }
}

window.addEventListener("load", () => {
  configurarMenuLateralDeSeguranca();
  const blocklyError = document.getElementById("blocklyError");
  if (typeof Blockly === "undefined") {
    ativarMenuLateralDeSeguranca();
    blocklyError.style.display = "block";
    blocklyError.textContent = "O núcleo do Blockly não carregou. Verifique a conexão com a internet e reabra o index.html.";
    return;
  }

  try {
    validarBlocosDeLogica();
    INVENTOR_THEME = criarTemaInventorBlocks();

    const injectOptions = {
      toolbox: INVENTOR_TOOLBOX,
      trashcan: true,
    scrollbars: true,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 0.95,
      minScale: 0.4,
      maxScale: 2
    }
  };

  if (INVENTOR_THEME) {
    injectOptions.theme = INVENTOR_THEME;
  }

  workspace = Blockly.inject("blocklyDiv", injectOptions);

  // Confirma que a barra lateral de categorias foi criada.
  garantirToolboxVisivel();

  // Botão da categoria Matemática: usa o diálogo nativo do Blockly
  // para perguntar ao usuário o nome da nova variável.
  workspace.registerButtonCallback("CREATE_VARIABLE", button => {
    Blockly.Variables.createVariableButtonHandler(button.getTargetWorkspace());
  });

  verificarMenuLateral();

  // Recalcula o SVG depois que o layout estiver pronto e quando a janela mudar.
  requestAnimationFrame(() => Blockly.svgResize(workspace));
  window.addEventListener("resize", () => {
    if (workspace) {
      Blockly.svgResize(workspace);
      garantirToolboxVisivel();
      verificarMenuLateral();
    }
  });

  workspace.addChangeListener(updateGeneratedCode);
  updateGeneratedCode();
  updateConnectionUi();

  setTimeout(() => {
    garantirToolboxVisivel();
    verificarMenuLateral();
  }, 250);

  const usbAvailable = "serial" in navigator;
  const bleAvailable = "bluetooth" in navigator;

  appLog("INVENTORBLOCKS pronto para USB e Bluetooth LE.");
  appLog(`Web Serial: ${usbAvailable ? "disponível" : "indisponível"}. Web Bluetooth: ${bleAvailable ? "disponível" : "indisponível"}.`);

  if (bleAvailable && !window.isSecureContext) {
    appLog("Bluetooth LE requer abrir o InventorBlocks em HTTPS no navegador.");
  }
  } catch (error) {
    console.error("Falha ao inicializar Blockly:", error);
    blocklyError.style.display = "block";
    blocklyError.textContent = "Falha ao inicializar o menu de blocos: " + error.message;
  }
});


document.querySelectorAll(".card-toggle").forEach(button => {
  button.addEventListener("click", () => {
    const card = document.getElementById(button.dataset.card);
    if (!card) return;
    const collapsed = card.classList.toggle("collapsed");
    button.textContent = collapsed ? "+" : "−";
    button.setAttribute("aria-expanded", collapsed ? "false" : "true");
  });
});


function setRightPanelCollapsed(collapsed) {
  if (!mainLayout || !toggleRightPanel) return;

  mainLayout.classList.toggle("right-panel-collapsed", collapsed);
  toggleRightPanel.textContent = collapsed ? "‹" : "›";
  toggleRightPanel.setAttribute("aria-expanded", collapsed ? "false" : "true");
  toggleRightPanel.setAttribute(
    "aria-label",
    collapsed ? "Maximizar painel lateral" : "Minimizar painel lateral"
  );
  toggleRightPanel.title = collapsed
    ? "Maximizar painel lateral"
    : "Minimizar painel lateral";

  if (workspace && typeof Blockly !== "undefined") {
    requestAnimationFrame(() => Blockly.svgResize(workspace));
    setTimeout(() => {
      if (workspace) Blockly.svgResize(workspace);
    }, 240);
  }
}

if (toggleRightPanel) {
  toggleRightPanel.addEventListener("click", () => {
    const collapsed = !mainLayout.classList.contains("right-panel-collapsed");
    setRightPanelCollapsed(collapsed);
  });
}

btnConnectUsb.addEventListener("click", async () => {
  try {
    await connectSerial();
  } catch (error) {
    appLog("Erro ao conectar USB: " + error.message);
    updateConnectionUi();
  }
});

btnDisconnectUsb.addEventListener("click", disconnectSerial);

btnConnectBle.addEventListener("click", async () => {
  try {
    await connectBluetooth();
  } catch (error) {
    appLog("Erro ao conectar Bluetooth LE: " + error.message);
    updateConnectionUi();
  }
});

btnDisconnectBle.addEventListener("click", disconnectBluetooth);
btnRun.addEventListener("click", executeProgram);


async function emergencyStopHardware() {
  const payload = new TextEncoder().encode("PararTudo\n");

  // Não usa sendCommand(): o STOP não pode ficar esperando uma leitura,
  // delay, sensor ou outro comando anterior terminar no navegador.
  const jobs = [];

  if (writer) {
    jobs.push(writer.write(payload).catch(() => {}));
  }

  if (BLE_RX_UUID) {
    jobs.push(BLE_RX_UUID.writeValue(payload).catch(() => {}));
  }

  await Promise.allSettled(jobs);
}

btnStop.addEventListener("click", async () => {
  // Primeiro trava toda a execução local; nenhum próximo bloco será iniciado.
  stopRequested = true;

  // Em paralelo, manda a parada de emergência diretamente ao ESP32-S3.
  // Assim sirene/motores/LEDs são desligados mesmo se houver um comando pendente.
  await emergencyStopHardware();

  appLog("Execução parada: saídas desligadas e display restaurado.");
});

btnClear.addEventListener("click", () => {
  workspace.clear();
  appLog("Blocos removidos.");
});

btnClearConsole.addEventListener("click", () => {
  consoleEl.textContent = "";
});
