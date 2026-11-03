import pathlib
p = pathlib.Path('lib/i18n.ts')
raw = p.read_bytes().decode('utf-8', errors='ignore')

# حاول يفك التشفير المزدوج
try:
    fixed = raw.encode('windows-1252').decode('utf-8')
except:
    fixed = raw

# صلح الرموز
fixed = fixed.replace('â€¢', '•').replace('â€“', '-').replace('â€”', '-').replace('Â', '')

p.write_bytes(fixed.encode('utf-8'))
print('FIXED OK')
print(fixed[1000:1500])
