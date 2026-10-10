$ErrorActionPreference = "stop"
$base = "http://localhost:4188"
$adminJar = "$env:TEMP\test_admin.jar"
$muridJar = "$env:TEMP\test_murid.jar"
Remove-Item $adminJar, $muridJar -ErrorAction SilentlyContinue

function Login($jar, $email, $password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json -Compress
  $bodyFile = "$env:TEMP\login-body.json"
  [IO.File]::WriteAllText($bodyFile, $body, [Text.Encoding]::UTF8)
  $resp = curl.exe -s -c $jar -H "Content-Type: application/json" --data-binary "@$bodyFile" "$base/api/auth/login"
  return ($resp | Out-String)
}

function ApiGet($jar, $path) {
  $outFile = "$env:TEMP\api-get.json"
  curl.exe -s -b $jar -H "Content-Type: application/json" "$base$path" -o $outFile
  return [IO.File]::ReadAllText($outFile)
}

function ApiPost($jar, $path, $body) {
  $bodyFile = "$env:TEMP\post-body.json"
  $outFile = "$env:TEMP\api-post.json"
  [IO.File]::WriteAllText($bodyFile, $body, [Text.Encoding]::UTF8)
  curl.exe -s -b $jar -H "Content-Type: application/json" -X POST --data-binary "@$bodyFile" "$base$path" -o $outFile
  return [IO.File]::ReadAllText($outFile)
}

function ApiPut($jar, $path, $body) {
  $bodyFile = "$env:TEMP\put-body.json"
  $outFile = "$env:TEMP\api-put.json"
  [IO.File]::WriteAllText($bodyFile, $body, [Text.Encoding]::UTF8)
  curl.exe -s -b $jar -H "Content-Type: application/json" -X PUT --data-binary "@$bodyFile" "$base$path" -o $outFile
  return [IO.File]::ReadAllText($outFile)
}

function ApiInvoice($jar, $targetUserId, $title, $periode, $amount) {
  $outFile = "$env:TEMP\api-invoice.json"
  curl.exe -s -b $jar -F "targetUserId=$targetUserId" -F "title=$title" -F "periode=$periode" -F "amount=$amount" -X POST "$base/api/admin/invoice" -o $outFile
  return [IO.File]::ReadAllText($outFile)
}

function Assert($desc, $cond, $payload) {
  if ($cond) {
    Write-Output ("PASS: " + $desc)
  } else {
    Write-Output ("FAIL: " + $desc + "  => " + $payload)
    Write-Output "E2E FAILED"
    exit 1
  }
}

Write-Output "=== 1. Admin login ==="
$adminResp = Login $adminJar "cs.helpeddinda@gmail.com" "dindaadmin"
Write-Output $adminResp
Assert "admin login ok" ($adminResp -match '"ok":true') $adminResp

Write-Output "=== 2. Register a fresh test murid ==="
$stamp = (Get-Date -Format "HHmmss")
$testEmail = "e2e-$stamp@test.local"
$testPw = "TestPass123!"
$regBody = @{ nama = "E2E Test Murid"; email = $testEmail; password = $testPw; kelas = "SMA10"; sekolah = "Test School" } | ConvertTo-Json -Compress
$regResp = ApiPost $adminJar "/api/auth/register" $regBody
Write-Output $regResp
Assert "register murid ok" ($regResp -match '"ok":true') $regResp

Write-Output "=== 3. Get murid by email via admin list ==="
$muridList = ApiGet $adminJar "/api/admin/murid" | ConvertFrom-Json
$murid = @($muridList.data | Where-Object { $_.email -eq $testEmail } | Select-Object -First 1)
$murid = $murid[0]
Assert "murid found" ($null -ne $murid) ("not found for " + $testEmail)
Write-Output ("murid: " + $murid.name + " / " + $murid.userId)

Write-Output "=== 4. Murid login ==="
$muridLogin = Login $muridJar $testEmail $testPw
Write-Output $muridLogin
Assert "murid login ok" ($muridLogin -match '"ok":true') $muridLogin

Write-Output "=== 5. Before invoice: no invoice visible, no payment, locked (new murid) ==="
$inv0 = (ApiGet $muridJar "/api/invoice" | ConvertFrom-Json).data
$myInv0 = @($inv0 | Where-Object { $_.title -like "Invoice November 2026*" -or $_.title -like "Invoice December 2026*" })
Assert "no targeted invoice before" ($myInv0.Count -eq 0) ("count=" + $myInv0.Count)
$prof0 = ApiGet $muridJar "/api/profile" | ConvertFrom-Json
Write-Output ("paymentUnlocked before = " + $prof0.paymentUnlocked)
Assert "new murid starts locked (no confirmed payment)" ($prof0.paymentUnlocked -eq $false) $prof0.paymentUnlocked
$materiNew = (ApiGet $muridJar "/api/materi" | ConvertFrom-Json)
Assert "materi blocked for new murid" (-not $materiNew.ok) ($materiNew | ConvertTo-Json -Compress)

Write-Output "=== 6. Admin sends invoice #1 (period 2026-11) ==="
$title1 = "Invoice November 2026"
$invResp1 = ApiInvoice $adminJar $murid.userId $title1 "2026-11" "500000"
Write-Output $invResp1
Assert "invoice #1 created" ($invResp1 -match '"ok":true') $invResp1

Write-Output "=== 7. Murid now sees invoice + payment locked ==="
$inv1 = (ApiGet $muridJar "/api/invoice" | ConvertFrom-Json).data
$myInv1 = @($inv1 | Where-Object { $_.title -eq $title1 })
Assert "invoice #1 visible" ($myInv1.Count -ge 1) ("count=" + $myInv1.Count)
$pay1 = ApiGet $muridJar "/api/payments" | ConvertFrom-Json
Write-Output ("billStatus=" + $pay1.billStatus + " billAmount=" + $pay1.billAmount + " billPeriode=" + $pay1.billPeriode)
Assert "bill pending" ($pay1.billStatus -eq "PENDING") $pay1.billStatus
Assert "bill periode 2026-11" ($pay1.billPeriode -eq "2026-11") $pay1.billPeriode
Assert "bill amount 500000" ($pay1.billAmount -eq 500000) $pay1.billAmount
$prof1 = ApiGet $muridJar "/api/profile" | ConvertFrom-Json
Write-Output ("paymentUnlocked after invoice = " + $prof1.paymentUnlocked)
Assert "locked after invoice" ($prof1.paymentUnlocked -eq $false) $prof1.paymentUnlocked

Write-Output "=== 8. Murid blocked from materi/jadwal/quiz while unpaid ==="
$materiBlocked = (ApiGet $muridJar "/api/materi" | ConvertFrom-Json)
Assert "materi blocked" (-not $materiBlocked.ok) $materiBlocked
$jadwalBlocked = (ApiGet $muridJar "/api/portal/jadwal" | ConvertFrom-Json)
Assert "jadwal blocked" (-not $jadwalBlocked.ok) $jadwalBlocked
$quizBlocked = (ApiGet $muridJar "/api/quiz" | ConvertFrom-Json)
Assert "quiz blocked" (-not $quizBlocked.ok) $quizBlocked

Write-Output "=== 9. Admin confirms payment SUCCESS ==="
$payList = (ApiGet $adminJar "/api/admin/pembayaran" | ConvertFrom-Json).data
$target = @($payList | Where-Object { $_.murid -eq "E2E Test Murid" -and $_.status -eq "PENDING" } | Select-Object -First 1)
$target = $target[0]
Assert "pending payment exists" ($null -ne $target) ("none for " + $testEmail)
Write-Output ("payment: " + $target.orderId + " amount=" + $target.amount)
$confirmBody = @{ id = $target.id; status = "SUCCESS" } | ConvertTo-Json -Compress
$confirmResp = ApiPut $adminJar "/api/admin/pembayaran" $confirmBody
Write-Output $confirmResp
Assert "confirmation ok" ($confirmResp -match '"ok":true') $confirmResp

Write-Output "=== 10. Invoice auto-hidden for murid after confirmation ==="
$invAfter = (ApiGet $muridJar "/api/invoice" | ConvertFrom-Json).data
$myInvAfter = @($invAfter | Where-Object { $_.title -eq $title1 })
Assert "invoice #1 hidden" ($myInvAfter.Count -eq 0) ("count=" + $myInvAfter.Count)
$payAfter = ApiGet $muridJar "/api/payments" | ConvertFrom-Json
Write-Output ("billStatus after = " + $payAfter.billStatus)
Assert "bill status SUCCESS" ($payAfter.billStatus -eq "SUCCESS") $payAfter.billStatus
$profAfter = ApiGet $muridJar "/api/profile" | ConvertFrom-Json
Assert "unlocked after confirm" ($profAfter.paymentUnlocked -eq $true) $profAfter.paymentUnlocked

Write-Output "=== 11. Murid completes onboarding then has access to materi ==="
$onbBody = @{ category = "SMA" } | ConvertTo-Json -Compress
$onbResp = ApiPut $muridJar "/api/murid/onboarding" $onbBody
Write-Output $onbResp
Assert "onboarding ok" ($onbResp -match '"ok":true') $onbResp
$materiOk = (ApiGet $muridJar "/api/materi" | ConvertFrom-Json)
Assert "materi accessible" $materiOk.ok ($materiOk | ConvertTo-Json -Compress)

Write-Output "=== 12. Repeat invoice flow: admin sends invoice #2 (period 2026-12) ==="
$title2 = "Invoice December 2026"
$invResp2 = ApiInvoice $adminJar $murid.userId $title2 "2026-12" "600000"
Write-Output $invResp2
Assert "invoice #2 created" ($invResp2 -match '"ok":true') $invResp2

$inv2 = (ApiGet $muridJar "/api/invoice" | ConvertFrom-Json).data
$myInv2 = @($inv2 | Where-Object { $_.title -eq $title2 })
Assert "invoice #2 visible (repeat)" ($myInv2.Count -ge 1) ("count=" + $myInv2.Count)
$pay2 = ApiGet $muridJar "/api/payments" | ConvertFrom-Json
Write-Output ("billStatus #2 = " + $pay2.billStatus + " periode=" + $pay2.billPeriode)
Assert "invoice #2 locks again" ($pay2.billStatus -eq "PENDING") $pay2.billStatus
$prof2 = ApiGet $muridJar "/api/profile" | ConvertFrom-Json
Assert "locked again after repeat invoice" ($prof2.paymentUnlocked -eq $false) $prof2.paymentUnlocked
$materiBlocked2 = (ApiGet $muridJar "/api/materi" | ConvertFrom-Json)
Assert "materi blocked again" (-not $materiBlocked2.ok) ($materiBlocked2 | ConvertTo-Json -Compress)

Write-Output "=== 13. Confirm repeat payment -> re-unlocked ==="
$payList2 = (ApiGet $adminJar "/api/admin/pembayaran" | ConvertFrom-Json).data
$target2 = @($payList2 | Where-Object { $_.murid -eq "E2E Test Murid" -and $_.status -eq "PENDING" } | Select-Object -First 1)
$target2 = $target2[0]
Assert "repeat pending payment exists" ($null -ne $target2) "none"
$confirmBody2 = @{ id = $target2.id; status = "SUCCESS" } | ConvertTo-Json -Compress
$confirmResp2 = ApiPut $adminJar "/api/admin/pembayaran" $confirmBody2
Write-Output $confirmResp2
Assert "repeat confirmation ok" ($confirmResp2 -match '"ok":true') $confirmResp2

$inv3 = (ApiGet $muridJar "/api/invoice" | ConvertFrom-Json).data
$myInv3 = @($inv3 | Where-Object { $_.title -eq $title2 })
Assert "invoice #2 hidden after confirm" ($myInv3.Count -eq 0) ("count=" + $myInv3.Count)
$prof3 = ApiGet $muridJar "/api/profile" | ConvertFrom-Json
Assert "re-unlocked after confirm" ($prof3.paymentUnlocked -eq $true) $prof3.paymentUnlocked

Write-Output ""
Write-Output "=== E2E ALL PASS ==="