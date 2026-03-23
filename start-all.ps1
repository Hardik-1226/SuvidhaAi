Start-Process npm -ArgumentList "run","dev" -WorkingDirectory "backend"
Start-Process npm -ArgumentList "run","dev" -WorkingDirectory "frontend"
Start-Process "..\.venv\Scripts\python.exe" -ArgumentList "main.py" -WorkingDirectory "ai-service"
