# Run once as Administrator so Vite can use http://localhost:5173
# Windows Hyper-V often reserves TCP 5141-5240, which blocks 5173.
Requires -RunAsAdministrator

net stop winnat
netsh int ipv4 set dynamicport tcp start=49152 num=16384
netsh int ipv4 set dynamicport udp start=49152 num=16384
net start winnat

Write-Host "`nExcluded ranges (5173 should NOT appear in 5141-5240):"
netsh interface ipv4 show excludedportrange protocol=tcp
