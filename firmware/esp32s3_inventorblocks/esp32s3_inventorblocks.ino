#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <esp_arduino_version.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// =============================================================
// INVENTORBLOCKS - ESP32-S3 - USB + BLUETOOTH LE
//
// O mesmo protocolo textual funciona nas duas interfaces:
//
//   PING
//   LigarLed D0
//   DesligarLed D0
//   LigarSirene D1
//   DesligarSirene D1
//   LerBotao D2
//   MoverServo9G D3 90
//   LerDistanciaCM
//   LerLuz A-0
//   LerLuz A-1
//   LerMagnetico A-0
//   LerInfravermelho A-1
//   LigarSirene INTERNA5
//   DesligarSirene INTERNA5
//
// HC-SR04: TRIG = GPIO 16 / ECHO = GPIO 17.
// USB: Serial / USB CDC, 115200 baud.
// BLE: serviço tipo UART (Nordic UART Service - NUS).
// =============================================================

enum PortaInventor {
  D0,
  D1,
  D2,
  D3,
  PORTA_INVALIDA
};


enum OrigemComando {
  ORIGEM_USB,
  ORIGEM_BLE
};

// -------------------------------------------------------------
// MAPEAMENTO FÍSICO ESP32-S3
// -------------------------------------------------------------
constexpr uint8_t GPIO_D0 = 15;
constexpr uint8_t GPIO_D1 = 18;
constexpr uint8_t GPIO_D2 = 40;
constexpr uint8_t GPIO_D3 = 39;

// Entradas analógicas do InventorBlocks
constexpr uint8_t GPIO_A0 = 1;  // ESP32-S3 ADC1_CH0
constexpr uint8_t GPIO_A1 = 2;  // ESP32-S3 ADC1_CH1
constexpr uint8_t BUZZER_INTERNO_GPIO = 5;

// Motores
constexpr uint8_t MOTOR_M1_A = 14;
constexpr uint8_t MOTOR_M1_B = 21;
constexpr uint8_t MOTOR_M2_A = 47;
constexpr uint8_t MOTOR_M2_B = 48;

// Sensor ultrassônico HC-SR04 (portas fixas)
constexpr uint8_t HC_SR04_TRIG_GPIO = 16;
constexpr uint8_t HC_SR04_ECHO_GPIO = 17;
constexpr uint32_t HC_SR04_TIMEOUT_US = 40000;
constexpr uint8_t HC_SR04_TENTATIVAS = 3;
constexpr uint16_t HC_SR04_INTERVALO_MS = 60;

constexpr uint32_t SERIAL_BAUD = 115200;
constexpr size_t TAMANHO_MAX_LINHA = 120;

// Servo 9G / SG90: PWM de 50 Hz. Os limites abaixo são conservadores
// e podem ser ajustados futuramente para um modelo específico.
constexpr uint32_t SERVO_FREQ_HZ = 50;
constexpr uint8_t SERVO_RESOLUTION_BITS = 14;
constexpr uint32_t SERVO_MAX_DUTY = (1UL << SERVO_RESOLUTION_BITS) - 1;
constexpr uint16_t SERVO_MIN_US = 500;
constexpr uint16_t SERVO_MAX_US = 2400;
bool servoInicializado[4] = { false, false, false, false };

// -------------------------------------------------------------
// BLUETOOTH LE - Nordic UART Service (NUS)
// RX = navegador escreve no ESP32
// TX = ESP32 envia notificações ao navegador
// -------------------------------------------------------------
constexpr uint8_t OLED_SDA = 8;
constexpr uint8_t OLED_SCL = 13;
constexpr uint8_t OLED_ADDRESS = 0x3C;
constexpr int OLED_WIDTH = 128;
constexpr int OLED_HEIGHT = 64;
constexpr int OLED_RESET = -1;
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET);

String BLE_DEVICE_NAME = "Darwin000";

void gerarNomeBluetoothUnico() {
  // Identificador MAC/eFuse único do ESP32-S3.
  uint64_t mac = ESP.getEfuseMac();

  // 12 bits = exatamente os 3 últimos dígitos hexadecimais.
  uint16_t ultimos12Bits = (uint16_t)(mac & 0x0FFF);
  char sufixo[4];
  snprintf(sufixo, sizeof(sufixo), "%03X", ultimos12Bits);

  BLE_DEVICE_NAME = "Darwin";
  BLE_DEVICE_NAME += sufixo;
}
static const char *BLE_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
static const char *BLE_RX_UUID      = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
static const char *BLE_TX_UUID      = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

BLEServer *bleServer = nullptr;
BLECharacteristic *bleTx = nullptr;
BLECharacteristic *bleRx = nullptr;
volatile bool bleConectado = false;

String linhaUsb;
String linhaBle;

// =============================================================
// CONVERSÃO DE PORTA
// =============================================================

uint8_t gpioDaPorta(PortaInventor porta) {
  switch (porta) {
    case D0: return GPIO_D0;
    case D1: return GPIO_D1;
    case D2: return GPIO_D2;
    case D3: return GPIO_D3;
    default: return 255;
  }
}

PortaInventor textoParaPorta(const String &texto) {
  if (texto == "D0") return D0;
  if (texto == "D1") return D1;
  if (texto == "D2") return D2;
  if (texto == "D3") return D3;
  return PORTA_INVALIDA;
}

uint8_t gpioDaPortaAnalogica(const String &porta) {
  if (porta == "A-0") return GPIO_A0;
  if (porta == "A-1") return GPIO_A1;
  return 255;
}

// =============================================================
// FUNÇÕES INVENTORBLOCKS
// =============================================================

int indiceDaPorta(PortaInventor porta) {
  switch (porta) {
    case D0: return 0;
    case D1: return 1;
    case D2: return 2;
    case D3: return 3;
    default: return -1;
  }
}

void desativarServoNaPorta(PortaInventor porta) {
  int indice = indiceDaPorta(porta);
  uint8_t gpio = gpioDaPorta(porta);
  if (indice < 0 || gpio == 255 || !servoInicializado[indice]) return;

#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcDetach(gpio);
#else
  ledcDetachPin(gpio);
#endif
  servoInicializado[indice] = false;
}

bool prepararServoNaPorta(PortaInventor porta) {
  int indice = indiceDaPorta(porta);
  uint8_t gpio = gpioDaPorta(porta);
  if (indice < 0 || gpio == 255) return false;
  if (servoInicializado[indice]) return true;

#if ESP_ARDUINO_VERSION_MAJOR >= 3
  bool ok = ledcAttachChannel(gpio, SERVO_FREQ_HZ, SERVO_RESOLUTION_BITS, indice);
#else
  double freqReal = ledcSetup(indice, SERVO_FREQ_HZ, SERVO_RESOLUTION_BITS);
  bool ok = freqReal > 0;
  if (ok) ledcAttachPin(gpio, indice);
#endif

  servoInicializado[indice] = ok;
  return ok;
}

bool MoverServo9G(PortaInventor porta, int angulo) {
  uint8_t gpio = gpioDaPorta(porta);
  int indice = indiceDaPorta(porta);
  if (gpio == 255 || indice < 0) return false;

  angulo = constrain(angulo, 0, 180);
  if (!prepararServoNaPorta(porta)) return false;

  uint32_t pulsoUs = map(angulo, 0, 180, SERVO_MIN_US, SERVO_MAX_US);
  uint32_t duty = (pulsoUs * SERVO_MAX_DUTY) / 20000UL;

#if ESP_ARDUINO_VERSION_MAJOR >= 3
  return ledcWrite(gpio, duty);
#else
  ledcWrite(indice, duty);
  return true;
#endif
}

void LigarLed(PortaInventor porta) {
  desativarServoNaPorta(porta);
  uint8_t gpio = gpioDaPorta(porta);
  if (gpio == 255) return;

  pinMode(gpio, OUTPUT);
  digitalWrite(gpio, HIGH);
}

void DesligarLed(PortaInventor porta) {
  desativarServoNaPorta(porta);
  uint8_t gpio = gpioDaPorta(porta);
  if (gpio == 255) return;

  pinMode(gpio, OUTPUT);
  digitalWrite(gpio, LOW);
}

void LigarSirene(PortaInventor porta) {
  desativarServoNaPorta(porta);
  uint8_t gpio = gpioDaPorta(porta);
  if (gpio == 255) return;

  pinMode(gpio, OUTPUT);
  digitalWrite(gpio, HIGH);
}

void DesligarSirene(PortaInventor porta) {
  desativarServoNaPorta(porta);
  uint8_t gpio = gpioDaPorta(porta);
  if (gpio == 255) return;

  pinMode(gpio, OUTPUT);
  digitalWrite(gpio, LOW);
}

bool LerBotao(PortaInventor porta) {
  desativarServoNaPorta(porta);
  uint8_t gpio = gpioDaPorta(porta);
  if (gpio == 255) return false;

  // Botão entre a porta e GND. O pull-up interno mantém HIGH quando solto.
  pinMode(gpio, INPUT_PULLUP);
  return digitalRead(gpio) == LOW;
}

int LerLuz(const String &porta) {
  uint8_t gpio = porta == "INTERNA41" ? 41 : gpioDaPortaAnalogica(porta);
  if (gpio == 255) return -1;
  pinMode(gpio, INPUT);
  return constrain(analogRead(gpio), 0, 4095);
}

int LerSom(const String &porta) {
  uint8_t gpio = gpioDaPortaAnalogica(porta);
  if (gpio == 255) return -1;
  pinMode(gpio, INPUT);
  return constrain(analogRead(gpio), 0, 4095);
}

int LerMagnetico(const String &porta) {
  uint8_t gpio = gpioDaPortaAnalogica(porta);
  if (gpio == 255) return -1;

  pinMode(gpio, INPUT);
  int valor = analogRead(gpio);
  return constrain(valor, 0, 4095);
}

int LerInfravermelho(const String &porta) {
  uint8_t gpio = gpioDaPortaAnalogica(porta);
  if (gpio == 255) return -1;

  pinMode(gpio, INPUT);
  int valor = analogRead(gpio);
  return constrain(valor, 0, 4095);
}
int LerInclinacao(const String &porta) {
  uint8_t gpio = gpioDaPortaAnalogica(porta);
  if (gpio == 255) return -1;
  pinMode(gpio, INPUT);
  return digitalRead(gpio) == HIGH ? 1 : 0;
}

int LerDistanciaCM() {
  pinMode(HC_SR04_TRIG_GPIO, OUTPUT);
  pinMode(HC_SR04_ECHO_GPIO, INPUT);
  digitalWrite(HC_SR04_TRIG_GPIO, LOW);

  // Dá tempo para o sensor e a linha de ECHO estabilizarem.
  delayMicroseconds(5);

  for (uint8_t tentativa = 0; tentativa < HC_SR04_TENTATIVAS; tentativa++) {
    // Se ainda houver um eco antigo, aguarda a linha retornar a LOW.
    unsigned long inicioEspera = micros();
    while (digitalRead(HC_SR04_ECHO_GPIO) == HIGH &&
           (micros() - inicioEspera) < HC_SR04_TIMEOUT_US) {
      delayMicroseconds(2);
    }

    // O datasheet pede pelo menos 10 us em HIGH. Usamos 12 us para margem.
    digitalWrite(HC_SR04_TRIG_GPIO, LOW);
    delayMicroseconds(4);
    digitalWrite(HC_SR04_TRIG_GPIO, HIGH);
    delayMicroseconds(12);
    digitalWrite(HC_SR04_TRIG_GPIO, LOW);

    unsigned long duracao = pulseIn(HC_SR04_ECHO_GPIO, HIGH, HC_SR04_TIMEOUT_US);

    if (duracao > 0) {
      float distancia = (duracao * 0.0343f) / 2.0f;
      int distanciaCM = (int)(distancia + 0.5f);

      // Faixa prática do HC-SR04. Valores fora dela são descartados.
      if (distanciaCM >= 2 && distanciaCM <= 400) {
        return distanciaCM;
      }
    }

    // Evita que um disparo interfira no seguinte.
    if (tentativa + 1 < HC_SR04_TENTATIVAS) {
      delay(HC_SR04_INTERVALO_MS);
    }
  }

  return -1;
}

void Motor(const String &motor, const String &acao) {
  uint8_t pinoA;
  uint8_t pinoB;

  if (motor == "M1") {
    pinoA = MOTOR_M1_A;
    pinoB = MOTOR_M1_B;
  } else if (motor == "M2") {
    pinoA = MOTOR_M2_A;
    pinoB = MOTOR_M2_B;
  } else {
    return;
  }

  pinMode(pinoA, OUTPUT);
  pinMode(pinoB, OUTPUT);

  if (acao == "FRENTE") {
    digitalWrite(pinoA, HIGH);
    digitalWrite(pinoB, LOW);
  } else if (acao == "RE") {
    digitalWrite(pinoA, LOW);
    digitalWrite(pinoB, HIGH);
  } else {
    digitalWrite(pinoA, LOW);
    digitalWrite(pinoB, LOW);
  }
}

void mostrarNomeBluetoothNoDisplay();

void PararTudo() {
  // D0-D3: cancela PWM/servo e força nível baixo.
  for (int i = 0; i < 4; i++) {
    PortaInventor porta = (PortaInventor)i;
    desativarServoNaPorta(porta);
    uint8_t gpio = gpioDaPorta(porta);
    if (gpio != 255) {
      pinMode(gpio, OUTPUT);
      digitalWrite(gpio, LOW);
    }
  }

  // LED interno.
  pinMode(4, OUTPUT);
  digitalWrite(4, LOW);

  // Sirene interna.
  pinMode(5, OUTPUT);
  digitalWrite(5, LOW);

  // Motores: ambos os terminais LOW = PARAR.
  pinMode(MOTOR_M1_A, OUTPUT);
  pinMode(MOTOR_M1_B, OUTPUT);
  pinMode(MOTOR_M2_A, OUTPUT);
  pinMode(MOTOR_M2_B, OUTPUT);
  digitalWrite(MOTOR_M1_A, LOW);
  digitalWrite(MOTOR_M1_B, LOW);
  digitalWrite(MOTOR_M2_A, LOW);
  digitalWrite(MOTOR_M2_B, LOW);

  // OLED: remove qualquer mensagem do programa e restaura o nome Bluetooth.
  mostrarNomeBluetoothNoDisplay();
}

// =============================================================
// RESPOSTAS USB / BLE
// =============================================================

void enviarLinhaBle(const String &linha) {
  if (!bleConectado || bleTx == nullptr) return;

  String pacote = linha + "\n";
  bleTx->setValue((uint8_t *)pacote.c_str(), pacote.length());
  bleTx->notify();
}

void enviarResposta(OrigemComando origem, const String &linha) {
  if (origem == ORIGEM_USB) {
    Serial.println(linha);
  } else {
    enviarLinhaBle(linha);
  }
}

void responderOK(OrigemComando origem, const String &mensagem) {
  enviarResposta(origem, "OK " + mensagem);
}

void responderErro(OrigemComando origem, const String &mensagem) {
  enviarResposta(origem, "ERR " + mensagem);
}

void LimparDisplay();
void EscreverDisplay(const String &texto);

// =============================================================
// INTERPRETADOR COMUM ÀS DUAS INTERFACES
// =============================================================

void executarComando(String comando, OrigemComando origem) {
  comando.trim();

  if (comando.length() == 0) return;

  if (comando == "PING") {
    responderOK(origem, "PONG");
    return;
  }

  if (comando == "LerDistanciaCM") {
    int distancia = LerDistanciaCM();
    if (distancia < 0) {
      responderErro(origem, "HC_SR04_SEM_ECO GPIO17=" + String(digitalRead(HC_SR04_ECHO_GPIO)));
    } else {
      responderOK(origem, String(distancia));
    }
    return;
  }

  // Comandos sem argumentos devem ser tratados antes da validação do separador.
  if (comando == "PararTudo") {
    PararTudo();
    responderOK(origem, "PARADO");
    return;
  }

  if (comando == "LimparDisplay") {
    LimparDisplay();
    responderOK(origem, "DISPLAY_LIMPO");
    return;
  }

  int separador = comando.indexOf(' ');

  if (separador < 0) {
    responderErro(origem, "FORMATO_INVALIDO");
    return;
  }

  String funcao = comando.substring(0, separador);
  String argumentos = comando.substring(separador + 1);
  argumentos.trim();

  if (funcao == "EscreverDisplay") {
    EscreverDisplay(argumentos);
    responderOK(origem, "DISPLAY");
    return;
  }

  int segundoSeparador = argumentos.indexOf(' ');
  String textoPorta = segundoSeparador >= 0 ? argumentos.substring(0, segundoSeparador) : argumentos;
  String argumentoExtra = segundoSeparador >= 0 ? argumentos.substring(segundoSeparador + 1) : "";
  textoPorta.trim();
  argumentoExtra.trim();

  if (funcao == "LerLuz") {
    uint8_t gpioAnalogico = textoPorta == "INTERNA41" ? 41 : gpioDaPortaAnalogica(textoPorta);
    if (gpioAnalogico == 255) {
      responderErro(origem, "PORTA_ANALOGICA_INVALIDA");
      return;
    }

    int valorLuz = LerLuz(textoPorta);
    if (valorLuz < 0) {
      responderErro(origem, "LEITURA_ANALOGICA_FALHOU");
      return;
    }

    responderOK(origem, String(valorLuz));
    return;
  }
  if (funcao == "LerSom") {
    if (gpioDaPortaAnalogica(textoPorta) == 255) {
      responderErro(origem, "PORTA_SOM_INVALIDA");
      return;
    }
    responderOK(origem, String(LerSom(textoPorta)));
    return;
  }

  if (funcao == "LerInclinacao") {
    if (gpioDaPortaAnalogica(textoPorta) == 255) {
      responderErro(origem, "PORTA_INCLINACAO_INVALIDA");
      return;
    }
    responderOK(origem, String(LerInclinacao(textoPorta)));
    return;
  }

  if (funcao == "LerMagnetico") {
    if (gpioDaPortaAnalogica(textoPorta) == 255) {
      responderErro(origem, "PORTA_MAGNETICO_INVALIDA");
      return;
    }
    responderOK(origem, String(LerMagnetico(textoPorta)));
    return;
  }

  if (funcao == "LerInfravermelho") {
    if (gpioDaPortaAnalogica(textoPorta) == 255) {
      responderErro(origem, "PORTA_INFRAVERMELHO_INVALIDA");
      return;
    }
    responderOK(origem, String(LerInfravermelho(textoPorta)));
    return;
  }

  if (funcao == "Motor") {
    if (textoPorta != "M1" && textoPorta != "M2") {
      responderErro(origem, "MOTOR_INVALIDO");
      return;
    }
    if (argumentoExtra != "FRENTE" && argumentoExtra != "RE" && argumentoExtra != "PARAR") {
      responderErro(origem, "ACAO_MOTOR_INVALIDA");
      return;
    }
    Motor(textoPorta, argumentoExtra);
    responderOK(origem, "Motor " + textoPorta + " " + argumentoExtra);
    return;
  }

  if ((funcao == "LigarLed" || funcao == "DesligarLed") && textoPorta == "INTERNA4") {
    pinMode(4, OUTPUT);
    digitalWrite(4, funcao == "LigarLed" ? HIGH : LOW);
    responderOK(origem, funcao + " INTERNA4");
    return;
  }

  if ((funcao == "LigarSirene" || funcao == "DesligarSirene") && textoPorta == "INTERNA5") {
    pinMode(BUZZER_INTERNO_GPIO, OUTPUT);
    digitalWrite(BUZZER_INTERNO_GPIO, funcao == "LigarSirene" ? HIGH : LOW);
    responderOK(origem, funcao + " INTERNA5");
    return;
  }

  PortaInventor porta = textoParaPorta(textoPorta);

  if (porta == PORTA_INVALIDA) {
    responderErro(origem, "PORTA_INVALIDA");
    return;
  }

  if (funcao == "MoverServo9G") {
    if (argumentoExtra.length() == 0) {
      responderErro(origem, "ANGULO_AUSENTE");
      return;
    }

    int angulo = argumentoExtra.toInt();
    if (angulo < 0 || angulo > 180) {
      responderErro(origem, "ANGULO_INVALIDO");
      return;
    }

    if (!MoverServo9G(porta, angulo)) {
      responderErro(origem, "SERVO_PWM_FALHOU");
      return;
    }

    responderOK(origem, "MoverServo9G " + textoPorta + " " + String(angulo));
    return;
  }

  if (funcao == "LigarLed") {
    LigarLed(porta);
    responderOK(origem, "LigarLed " + textoPorta);
    return;
  }

  if (funcao == "DesligarLed") {
    DesligarLed(porta);
    responderOK(origem, "DesligarLed " + textoPorta);
    return;
  }

  if (funcao == "LigarSirene") {
    LigarSirene(porta);
    responderOK(origem, "LigarSirene " + textoPorta);
    return;
  }

  if (funcao == "DesligarSirene") {
    DesligarSirene(porta);
    responderOK(origem, "DesligarSirene " + textoPorta);
    return;
  }

  if (funcao == "LerBotao") {
    responderOK(origem, LerBotao(porta) ? "1" : "0");
    return;
  }

  responderErro(origem, "COMANDO_DESCONHECIDO");
}

// =============================================================
// RECEPÇÃO EM LINHAS
// =============================================================

void receberCaractere(char caractere, String &buffer, OrigemComando origem) {
  if (caractere == '\n') {
    executarComando(buffer, origem);
    buffer = "";
    return;
  }

  if (caractere == '\r') return;

  buffer += caractere;

  if (buffer.length() > TAMANHO_MAX_LINHA) {
    buffer = "";
    responderErro(origem, "LINHA_MUITO_LONGA");
  }
}

// =============================================================
// CALLBACKS BLUETOOTH LE
// =============================================================

class InventorServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    bleConectado = true;
    Serial.println("BLE CLIENT CONNECTED");
  }

  void onDisconnect(BLEServer *server) override {
    bleConectado = false;
    linhaBle = "";
    Serial.println("BLE CLIENT DISCONNECTED");

    // Mantém a placa visível para uma nova conexão.
    BLEDevice::startAdvertising();
  }
};

class InventorRxCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    String valor = characteristic->getValue();

    for (size_t i = 0; i < valor.length(); i++) {
      receberCaractere(valor[i], linhaBle, ORIGEM_BLE);
    }
  }
};

void iniciarBluetoothLe() {
  BLEDevice::init(BLE_DEVICE_NAME.c_str());

  bleServer = BLEDevice::createServer();
  bleServer->setCallbacks(new InventorServerCallbacks());
  bleServer->advertiseOnDisconnect(true);

  BLEService *service = bleServer->createService(BLE_SERVICE_UUID);

  bleTx = service->createCharacteristic(
    BLE_TX_UUID,
    BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ
  );
  bleTx->addDescriptor(new BLE2902());

  bleRx = service->createCharacteristic(
    BLE_RX_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  bleRx->setCallbacks(new InventorRxCallbacks());

  service->start();

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(BLE_SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->setMinPreferred(0x06);
  advertising->setMaxPreferred(0x12);

  BLEDevice::startAdvertising();
}

bool oledDisponivel = false;

void mostrarNomeBluetoothNoDisplay() {
  if (!oledDisponivel) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 28);
  display.print(BLE_DEVICE_NAME);
  display.display();
}

void LimparDisplay() {
  if (!oledDisponivel) return;
  display.clearDisplay();
  display.display();
}

void EscreverDisplay(const String &texto) {
  if (!oledDisponivel) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 28);
  display.print(texto);
  display.display();
}

void iniciarDisplayBluetooth() {
  Wire.begin(OLED_SDA, OLED_SCL);
  oledDisponivel = display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
  if (!oledDisponivel) {
    Serial.println("AVISO: OLED SSD1306 nao encontrado.");
    return;
  }
  mostrarNomeBluetoothNoDisplay();
}

// =============================================================
// ARDUINO
// =============================================================

void setup() {
  Serial.begin(SERIAL_BAUD);
  analogReadResolution(12);
  delay(300);

  Serial.println("READY INVENTORBLOCKS USB");

  gerarNomeBluetoothUnico();
  Serial.print("Bluetooth: ");
  Serial.println(BLE_DEVICE_NAME);

  iniciarDisplayBluetooth();
  iniciarBluetoothLe();

  Serial.print("READY INVENTORBLOCKS BLE: ");
  Serial.println(BLE_DEVICE_NAME);
}

void loop() {
  // USB CDC / Web Serial
  while (Serial.available() > 0) {
    char caractere = (char)Serial.read();
    receberCaractere(caractere, linhaUsb, ORIGEM_USB);
  }

  delay(1);
}
