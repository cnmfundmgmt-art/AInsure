$ErrorActionPreference = 'SilentlyContinue'
$con = New-Object System.Data.SQLite.SQLiteConnection
$con.ConnectionString = "Data Source=C:\Users\000\.openclaw\workspace\cfp-malaysia\data\cfp_local.db"
$con.Open()
$cmd = $con.CreateCommand()
$cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
$rdr = $cmd.ExecuteReader()
while ($rdr.Read()) { $rdr[0] }
$rdr.Close()
$con.Close()