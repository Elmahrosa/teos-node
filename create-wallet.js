 import bs58 from 'bs58'
import fs from 'fs'

const PRIVATE_KEY_BASE58 = "4Xp7mQc9McqxFgHy3P4BwAN36hRmARLGBaxUP7DUokpchSYRTubowSSVkBieuRGVDyeMA3un8nRbsR1YMJ3q4j38" // الصق هنا الـ Private Key من Phantom اللي بيبدأ بحروف

const bytes = bs58.decode(PRIVATE_KEY_BASE58)
fs.writeFileSync('wallet.json', JSON.stringify(Array.from(bytes)))
console.log("✅ wallet.json اتعمل -", bytes.length, "byte")