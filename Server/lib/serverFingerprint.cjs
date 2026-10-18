const crypto = require('node:crypto');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
let cached;
function getServerFingerprint() {
  if (cached) return cached;
  if (process.platform !== 'win32') throw new Error('UNSUPPORTED_LICENSE_HOST');
  const command = "$ErrorActionPreference='Stop'; $uuid=(Get-CimInstance Win32_ComputerSystemProduct).UUID; $guid=(Get-ItemProperty -LiteralPath 'HKLM:\\SOFTWARE\\Microsoft\\Cryptography').MachineGuid; @{uuid=$uuid;guid=$guid}|ConvertTo-Json -Compress";
  const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const result = JSON.parse(execFileSync(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8', timeout: 15000, windowsHide: true }).replace(/^\uFEFF/, '').trim());
  const values = [result.uuid, result.guid].map(value => String(value || '').trim().toLowerCase());
  if (values.some(value => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value) || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(value) || /^f{8}-f{4}-f{4}-f{4}-f{12}$/.test(value))) throw new Error('FINGERPRINT_UNAVAILABLE');
  cached = 'GZR1-' + crypto.createHash('sha256').update('gezira-server-v1\n' + values.join('\n')).digest('hex').toUpperCase();
  return cached;
}
module.exports = { getServerFingerprint };
