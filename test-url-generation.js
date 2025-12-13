// Teste rápido para verificar a lógica de geração de URL
const testCases = [
  {
    name: "Com NEXT_PUBLIC_API_BASE_URL",
    env: { NEXT_PUBLIC_API_BASE_URL: "http://api.felipefogaca.net" },
    request: { nextUrl: { origin: "https://0.0.0.0:3000" }, headers: { get: () => "0.0.0.0:3000" }, url: "https://0.0.0.0:3000/api/download" },
    expected: "http://api.felipefogaca.net"
  },
  {
    name: "Com host válido (não 0.0.0.0)",
    env: {},
    request: { nextUrl: { origin: "https://0.0.0.0:3000" }, headers: { get: (key) => key === "host" ? "api.felipefogaca.net" : null }, url: "https://api.felipefogaca.net/api/download" },
    expected: "https://api.felipefogaca.net"
  },
  {
    name: "Com origin válido (não 0.0.0.0)",
    env: {},
    request: { nextUrl: { origin: "http://api.felipefogaca.net" }, headers: { get: () => "0.0.0.0:3000" }, url: "http://api.felipefogaca.net/api/download" },
    expected: "http://api.felipefogaca.net"
  },
  {
    name: "Fallback para localhost em dev",
    env: {},
    request: { nextUrl: { origin: "https://0.0.0.0:3000" }, headers: { get: () => "0.0.0.0:3000" }, url: "https://0.0.0.0:3000/api/download" },
    expected: "http://localhost:3000"
  }
];

function getBaseUrlFromRequest(request, env = {}) {
  // Simular process.env
  const processEnv = { ...process.env, ...env };
  
  // Prioridade 1: Variáveis de ambiente
  if (processEnv.NEXT_PUBLIC_API_BASE_URL) {
    return processEnv.NEXT_PUBLIC_API_BASE_URL;
  }
  if (processEnv.NEXT_PUBLIC_APP_URL) {
    return processEnv.NEXT_PUBLIC_APP_URL;
  }
  
  // Prioridade 2: Usar o host da requisição (mais confiável que origin)
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 
                   (request.url.startsWith('https') ? 'https' : 'http');
  
  if (host && !host.includes('0.0.0.0') && !host.includes('localhost')) {
    return `${protocol}://${host}`;
  }
  
  // Prioridade 3: Usar origin se não for 0.0.0.0
  const origin = request.nextUrl.origin;
  if (origin && !origin.includes('0.0.0.0')) {
    return origin;
  }
  
  // Fallback: usar configuração padrão
  return processEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

console.log("🧪 Testando lógica de geração de URL base...\n");

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = getBaseUrlFromRequest(testCase.request, testCase.env);
  const success = result === testCase.expected;
  
  if (success) {
    console.log(`✅ Teste ${index + 1}: ${testCase.name}`);
    console.log(`   Resultado: ${result}`);
    passed++;
  } else {
    console.log(`❌ Teste ${index + 1}: ${testCase.name}`);
    console.log(`   Esperado: ${testCase.expected}`);
    console.log(`   Obtido: ${result}`);
    failed++;
  }
  console.log();
});

console.log(`\n📊 Resultado: ${passed} passaram, ${failed} falharam`);

if (failed > 0) {
  process.exit(1);
}


