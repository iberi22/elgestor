# Script para configurar la base de datos de Supabase
# Ejecutar este script después de configurar las variables de entorno

Write-Host "🚀 Configurando base de datos de Supabase..." -ForegroundColor Green

# Verificar si existe el archivo .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: No se encontró el archivo .env.local" -ForegroundColor Red
    Write-Host "Por favor, crea el archivo .env.local con las siguientes variables:" -ForegroundColor Yellow
    Write-Host "NEXT_PUBLIC_SUPABASE_URL=TU_URL_DE_SUPABASE" -ForegroundColor Cyan
    Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY_DE_SUPABASE" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para obtener estas credenciales:" -ForegroundColor Yellow
    Write-Host "1. Ve a https://supabase.com" -ForegroundColor White
    Write-Host "2. Crea un nuevo proyecto o selecciona uno existente" -ForegroundColor White
    Write-Host "3. Ve a Settings > API" -ForegroundColor White
    Write-Host "4. Copia la URL y la anon key" -ForegroundColor White
    exit 1
}

Write-Host "✅ Archivo .env.local encontrado" -ForegroundColor Green

# Verificar si las migraciones existen
$migrationsPath = "supabase/migrations"
if (-not (Test-Path $migrationsPath)) {
    Write-Host "❌ Error: No se encontró el directorio de migraciones" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Directorio de migraciones encontrado" -ForegroundColor Green

# Listar las migraciones disponibles
Write-Host "📋 Migraciones disponibles:" -ForegroundColor Blue
Get-ChildItem "$migrationsPath/*.sql" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor White
}

Write-Host ""
Write-Host "📝 Para ejecutar las migraciones:" -ForegroundColor Yellow
Write-Host "1. Ve al SQL Editor en tu dashboard de Supabase" -ForegroundColor White
Write-Host "2. Ejecuta las migraciones en este orden:" -ForegroundColor White
Write-Host "   a) 20240726000000_initial_schema.sql" -ForegroundColor Cyan
Write-Host "   b) 20240726000001_add_indexes_and_constraints.sql" -ForegroundColor Cyan
Write-Host "   c) 20240726000002_seed_initial_data.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. O usa el CLI de Supabase si lo tienes instalado:" -ForegroundColor White
Write-Host "   supabase db push" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 ¡Después de ejecutar las migraciones, tu aplicación estará lista!" -ForegroundColor Green