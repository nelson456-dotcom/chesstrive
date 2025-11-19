$lines = Get-Content 'chessrep-main/frontend/src/components/ChessVariationAnalyzer.js'
$lines[1464] = $lines[1464] + ','
$lines | Set-Content 'chessrep-main/frontend/src/components/ChessVariationAnalyzer.js'
