$file = 'C:\Users\000\.openclaw\workspace\cfp-malaysia\app\insurance\page.tsx'
$lines = [System.IO.File]::ReadAllLines($file)
$output = @()
$changed = $false

foreach ($line in $lines) {
    $orig = $line
    # Fix: msg.message && <p className="text-sm text-gray-700">{msg.message}</p>
    if ($line -match '\{msg\.message && <p className="text-sm text-gray-700">\{msg\.message\}</p>\}') {
        $line = $line -replace '\{msg\.message && <p className="text-sm text-gray-700">\{msg\.message\}</p>\}', '{msg.message ? <p className="text-sm text-gray-700">{msg.message}</p> : null}'
        $changed = $true
    }
    # Fix: msg.notes && <ul className="space-y-1">... (text-gray-600, text-blue-400)
    if ($line -match '\{msg\.notes && <ul className="space-y-1">\{\(\(msg\.notes as string\[\]\) \|\| \[\]\)\.map\(\(n, i\) => <li key=\{i\} className="text-xs text-gray-600') {
        $line = $line -replace '\{msg\.notes && <ul className="space-y-1">\{\(\(msg\.notes as string\[\]\) \|\| \[\]\)\.map\(\(n, i\) => <li key=\{i\} className="text-xs text-gray-600 flex gap-2"><span className="text-blue-400">•</span><span className="whitespace-pre-line">\{n\}</span></li>\)\}</ul>\}', '{msg.notes ? <ul className="space-y-1">{((msg.notes as string[])||[]).map((n,i)=><li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-blue-400">•</span><span className="whitespace-pre-line">{n}</span></li>)}</ul> : null}'
        $changed = $true
    }
    # Fix: msg.conditions && <ul className="space-y-1">... (text-green-400)
    if ($line -match '\{msg\.conditions && <ul className="space-y-1">\{\(\(msg\.conditions as string\[\]\) \|\| \[\]\)\.map\(\(c, i\) => <li key=\{i\} className="text-xs text-gray-600 flex gap-2"><span className="text-green-400">•</span>\{c\}</li>\)\}</ul>\}') {
        $line = $line -replace '\{msg\.conditions && <ul className="space-y-1">\{\(\(msg\.conditions as string\[\]\) \|\| \[\]\)\.map\(\(c, i\) => <li key=\{i\} className="text-xs text-gray-600 flex gap-2"><span className="text-green-400">•</span>\{c\}</li>\)\}</ul>\}', '{msg.conditions ? <ul className="space-y-1">{((msg.conditions as string[])||[]).map((c,i)=><li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-green-400">•</span>{c}</li>)}</ul> : null}'
        $changed = $true
    }
    # Fix: msg.year && <div className="text-center py-3 bg-indigo-50 rounded-xl">
    if ($line -match '\{msg\.year && <div className="text-center py-3 bg-indigo-50 rounded-xl">') {
        $line = $line -replace '\{msg\.year && <div className="text-center py-3 bg-indigo-50 rounded-xl"><p className="text-xs text-indigo-500 font-medium">Guaranteed Breakeven</p><p className="text-2xl font-bold text-indigo-700">Year \{msg\.year\}</p></div>\}', '{msg.year ? <div className="text-center py-3 bg-indigo-50 rounded-xl"><p className="text-xs text-indigo-500 font-medium">Guaranteed Breakeven</p><p className="text-2xl font-bold text-indigo-700">Year {msg.year}</p></div> : null}'
        $changed = $true
    }
    # Fix: msg.conditions && <ul className="space-y-1">... (text-blue-400) - expat
    if ($line -match '\{msg\.conditions && <ul className="space-y-1">\{\(\(msg\.conditions as string\[\]\) \|\| \[\]\)\.map\(\(c, i\) => <li key=\{i\} className="text-xs text-gray-600 flex gap-2"><span className="text-blue-400">•</span>\{c\}</li>\)\}</ul>\}') {
        $line = $line -replace '\{msg\.conditions && <ul className="space-y-1">\{\(\(msg\.conditions as string\[\]\) \|\| \[\]\)\.map\(\(c, i\) => <li key=\{i\} className="text-xs text-gray-600 flex gap-2"><span className="text-blue-400">•</span>\{c\}</li>\)\}</ul>\}', '{msg.conditions ? <ul className="space-y-1">{((msg.conditions as string[])||[]).map((c,i)=><li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-blue-400">•</span>{c}</li>)}</ul> : null}'
        $changed = $true
    }
    # Fix: msg.notes && <ul className="space-y-1">... (text-indigo-300) - coverage_age
    if ($line -match '\{msg\.notes && <ul className="space-y-1">\{\(\(msg\.notes as string\[\]\) \|\| \[\]\)\.map\(\(n, i\) => <li key=\{i\} className="text-xs text-gray-600 flex gap-2"><span className="text-indigo-300">•</span><span className="whitespace-pre-line">\{n\}</span></li>\)\}</ul>\}') {
        $line = $line -replace '\{msg\.notes && <ul className="space-y-1">\{\(\(msg\.notes as string\[\]\) \|\| \[\]\)\.map\(\(n, i\) => <li key=\{i\} className="text-xs text-gray-600 flex gap-2"><span className="text-indigo-300">•</span><span className="whitespace-pre-line">\{n\}</span></li>\)\}</ul>\}', '{msg.notes ? <ul className="space-y-1">{((msg.notes as string[])||[]).map((n,i)=><li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-indigo-300">•</span><span className="whitespace-pre-line">{n}</span></li>)}</ul> : null}'
        $changed = $true
    }
    # Fix: msg.notes && <ul className="space-y-1">... (text-blue-300) - coinsurance
    if ($line -match '\{msg\.notes && <ul className="space-y-1">\{\(\(msg\.notes as string\[\]\) \|\| \[\]\)\.map\(\(n, i\) => <li key=\{i\} className="text-xs text-gray-500 flex gap-2"><span className="text-blue-300">•</span>\{n\}</li>\)\}</ul>\}') {
        $line = $line -replace '\{msg\.notes && <ul className="space-y-1">\{\(\(msg\.notes as string\[\]\) \|\| \[\]\)\.map\(\(n, i\) => <li key=\{i\} className="text-xs text-gray-500 flex gap-2"><span className="text-blue-300">•</span>\{n\}</li>\)\}</ul>\}', '{msg.notes ? <ul className="space-y-1">{((msg.notes as string[])||[]).map((n,i)=><li key={i} className="text-xs text-gray-500 flex gap-2"><span className="text-blue-300">•</span>{n}</li>)}</ul> : null}'
        $changed = $true
    }
    # Fix: msg.response &&
    if ($line -match '\{msg\.response && <p className="text-sm text-gray-700 whitespace-pre-line">\{msg\.response\}</p>\}') {
        $line = $line -replace '\{msg\.response && <p className="text-sm text-gray-700 whitespace-pre-line">\{msg\.response\}</p>\}', '{msg.response ? <p className="text-sm text-gray-700 whitespace-pre-line">{msg.response}</p> : null}'
        $changed = $true
    }
    # Fix: msg.suggestions && (
    if ($line -match '\{msg\.suggestions && \(\s*$') {
        # Multi-line: this is the opening line. Replace with ternary and opening div
        $line = $line -replace '\{msg\.suggestions && \(', '{msg.suggestions ? ('
        $changed = $true
    }
    # Fix closing of msg.suggestions block
    if ($line -match '^\s+\)\s*$' -and $output[-1] -match '\{msg\.suggestions \? \(') {
        $line = ' ) : null}'
        $changed = $true
    }
    # Fix: msg.content &&
    if ($line -match '\{msg\.content && <p className="text-sm text-gray-700 whitespace-pre-line">\{msg\.content as string\}</p>\}') {
        $line = $line -replace '\{msg\.content && <p className="text-sm text-gray-700 whitespace-pre-line">\{msg\.content as string\}</p>\}', '{msg.content ? <p className="text-sm text-gray-700 whitespace-pre-line">{msg.content as string}</p> : null}'
        $changed = $true
    }
    $output += $line
}

if ($changed) {
    [System.IO.File]::WriteAllLines($file, $output, [System.Text.Encoding]::UTF8)
    Write-Output "File updated with fixes"
} else {
    Write-Output "No changes made"
}
