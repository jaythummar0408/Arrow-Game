/**
 * Fix Double-Encoded UTF-8 Text in JSON
 * Converts corrupted Gujarati text back to proper Unicode
 */

const fs = require("fs");
const path = require("path");

function fixDoubleEncoding(text) {
  if (!text || typeof text !== "string") return text;

  try {
    // The text is UTF-8 bytes misinterpreted as Latin-1, then encoded as UTF-8 again
    // We need to reverse this: decode from UTF-8, interpret as Latin-1 bytes, decode as UTF-8

    // Convert the string to a buffer treating each char as a byte value
    const bytes = Buffer.from(text, "binary");

    // Now decode those bytes as proper UTF-8
    const fixed = bytes.toString("utf-8");

    // Verify it's actually Gujarati (Unicode range 0x0A80-0x0AFF)
    const hasGujarati = /[\u0A80-\u0AFF]/.test(fixed);

    if (hasGujarati) {
      return fixed;
    }

    return text; // Return original if fix didn't work
  } catch (error) {
    console.error("Error fixing encoding:", error.message);
    return text;
  }
}

async function fixJsonFile() {
  const filePath = path.join(__dirname, "names_for_translation.json");
  const backupPath = path.join(__dirname, "names_for_translation.backup.json");

  console.log("\n🔧 Fixing encoding issues in JSON file...\n");

  // Read file
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  // Create backup
  fs.writeFileSync(backupPath, content, "utf-8");
  console.log(`✅ Backup created: ${path.basename(backupPath)}\n`);

  let fixedCount = 0;
  let failedCount = 0;

  // Process each model
  for (const [modelName, records] of Object.entries(data.models)) {
    console.log(`Processing ${modelName}...`);

    for (const record of records) {
      if (record.name_gj) {
        const original = record.name_gj;
        const fixed = fixDoubleEncoding(original);

        if (fixed !== original) {
          record.name_gj = fixed;
          console.log(`  ✅ ${record.name}`);
          console.log(`     Before: ${original.substring(0, 30)}...`);
          console.log(`     After:  ${fixed}`);
          fixedCount++;
        } else {
          // If couldn't fix, clear it
          if (original.includes("àª") || original.includes("à«")) {
            record.name_gj = "";
            failedCount++;
            console.log(`  ⚠️  Cleared corrupt data for: ${record.name}`);
          }
        }
      }
    }
    console.log("");
  }

  // Save fixed file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

  console.log("═".repeat(60));
  console.log("📊 ENCODING FIX SUMMARY");
  console.log("═".repeat(60));
  console.log(`✅ Successfully fixed: ${fixedCount} records`);
  console.log(`⚠️  Cleared (couldn't fix): ${failedCount} records`);
  console.log(`📁 Backup saved: ${path.basename(backupPath)}`);
  console.log(`📁 Fixed file: ${path.basename(filePath)}`);
  console.log("═".repeat(60));

  if (failedCount > 0) {
    console.log(`\n💡 ${failedCount} records need re-translation.`);
    console.log("   Run: node scripts/translateNamesInJson.js");
  }
}

fixJsonFile().catch(console.error);
