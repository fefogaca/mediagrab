const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/admin/make-admin/route.ts',
  'src/app/api/payment/complete/route.ts',
  'src/app/api/user/change-email/route.ts',
  'src/app/api/user/update-profile/route.ts',
  'src/app/api/dashboard/my-api-keys/route.ts',
  'src/app/api/dashboard/api-keys/route.ts',
  'src/app/api/admin/settings/database/route.ts',
  'src/app/api/dashboard/my-downloads-over-time/route.ts',
  'src/app/api/user/change-password/route.ts',
  'src/app/api/admin/notifications/route.ts',
  'src/app/api/dashboard/api-keys/[id]/route.ts',
  'src/app/api/dashboard/notifications/route.ts',
  'src/app/api/dashboard/my-recent-downloads/route.ts',
  'src/app/api/dashboard/my-stats/route.ts',
  'src/app/api/user/update-plan/route.ts',
  'src/app/api/admin/settings/toggle/route.ts',
  'src/app/api/payment/stripe/checkout/route.ts',
];

files.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;

  // Verificar se já tem o import
  const hasImport = content.includes('getJWTSecret');
  
  // Substituir declarações de JWT_SECRET
  const patterns = [
    /const JWT_SECRET:\s*string\s*=\s*process\.env\.JWT_SECRET\s+as\s+string;/g,
    /const JWT_SECRET\s*=\s*process\.env\.JWT_SECRET\s*\|\|\s*['"]/g,
    /const JWT_SECRET\s*=\s*process\.env\.JWT_SECRET\s+as\s+string;/g,
  ];

  patterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, 'const JWT_SECRET = getJWTSecret();');
      modified = true;
    }
  });

  // Adicionar import se necessário
  if (modified && !hasImport) {
    // Encontrar a linha de import do jwt ou database
    const importLines = content.match(/^import .* from ['"].*['"];?$/gm) || [];
    if (importLines.length > 0) {
      const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
      const insertIndex = content.indexOf('\n', lastImportIndex) + 1;
      content = content.slice(0, insertIndex) + 
                "import { getJWTSecret } from '@backend/lib/secrets';\n" + 
                content.slice(insertIndex);
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Atualizado: ${filePath}`);
  } else if (hasImport) {
    console.log(`✓ Já atualizado: ${filePath}`);
  } else {
    console.log(`⚠️  Padrão não encontrado em: ${filePath}`);
  }
});

console.log('\n✅ Processo concluído!');

