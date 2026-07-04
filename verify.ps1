$body = @{
    sensor_type = "accelerometer"
    values = @(0.05, 0.06, 0.04, 5.8, 6.2, 5.5, 0.05)
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:3000/api/anomalies/score" -Method POST -Body $body -ContentType "application/json"
Write-Host "=== ANOMALY SCORE ===" 
$result | ConvertTo-Json -Depth 5

$body2 = @{
    email = "test@pride.io"
    password = "Test1234!"
    name = "Test User"
} | ConvertTo-Json
$result2 = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $body2 -ContentType "application/json"
Write-Host "`n=== REGISTER USER ===" 
$result2 | ConvertTo-Json -Depth 5

$result3 = Invoke-RestMethod -Uri "http://localhost:3000/api/sensors" -Method GET
Write-Host "`n=== SENSORS ===" 
Write-Host "Total sensors: $($result3.meta.total)"

$result4 = Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/kpi" -Method GET
Write-Host "`n=== KPIs ===" 
$result4.data | ConvertTo-Json -Depth 3
