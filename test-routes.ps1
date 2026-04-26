$routes = @(
  '/api/auth/me',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register-with-id',
  '/api/client/me',
  '/api/client/status',
  '/api/client/profile',
  '/api/financial/snapshot',
  '/api/financial/profile',
  '/api/financial/assets',
  '/api/financial/liabilities',
  '/api/admin/me',
  '/api/admin/stats',
  '/api/admin/audit',
  '/api/admin/advisors',
  '/api/admin/registrations',
  '/api/admin/verifications',
  '/api/insurance/analyze',
  '/api/insurance/chat',
  '/api/insurance/clients',
  '/api/insurance/products',
  '/api/insurance/recommend',
  '/api/insurance/sessions',
  '/api/verification/ocr',
  '/api/verification/face'
)

foreach ($r in $routes) {
  try {
    $code = (Invoke-WebRequest -Uri ('http://localhost:3003' + $r) -UseBasicParsing -TimeoutSec 3 -Method GET).StatusCode
    Write-Host ('[OK]  ' + $r + ' -> ' + $code)
  } catch {
    $code = $_.Exception.Response.StatusCode
    Write-Host ('[ERR] ' + $r + ' -> ' + $code)
  }
}