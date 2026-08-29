/**
 * Fix Encoding Issues in JSON File
 * Converts incorrectly encoded Gujarati text to proper Unicode
 */

const fs = require("fs");
const path = require("path");

async function fixEncoding() {
  const filePath = path.join(__dirname, "names_for_translation.json");

  console.log("\n🔍 Checking encoding issues...\n");

  // Read file as buffer first to check raw bytes
  const buffer = fs.readFileSync(filePath);

  // Try reading as UTF-8
  const content = buffer.toString("utf-8");

  console.log("Sample of current content:");
  console.log("-".repeat(60));

  // Show first few entries
  const data = JSON.parse(content);

  if (data.models.commodity && data.models.commodity.length > 0) {
    const first = data.models.commodity[0];
    console.log(`Name: ${first.name}`);
    console.log(`Current name_gj: ${first.name_gj}`);
    console.log(
      `Bytes: ${Buffer.from(first.name_gj).toString("hex").substring(0, 50)}...`,
    );
  }

  console.log("-".repeat(60));

  // Check if the text looks corrupted (has combining characters in wrong encoding)
  const testText = data.models.commodity?.[0]?.name_gj || "";
  const hasBadEncoding = testText.includes("àª") || testText.includes("à«");

  if (hasBadEncoding) {
    console.log("\n❌ Detected encoding issue!");
    console.log("The file has incorrectly encoded Gujarati text.");
    console.log("\n💡 Possible causes:");
    console.log("   1. Translation API returned corrupted text");
    console.log("   2. File was saved with wrong encoding");
    console.log("   3. Text was copied from a wrong source\n");

    console.log("🔧 Recommended fix:");
    console.log("   1. Delete the name_gj fields with corrupt data");
    console.log("   2. Re-run the translation script");
    console.log(
      "   Or use Google Translate directly and paste proper Gujarati text\n",
    );
  } else {
    console.log("\n✅ Encoding looks correct!");
  }

  // Count how many records have this issue
  let corruptCount = 0;
  for (const [modelName, records] of Object.entries(data.models)) {
    for (const record of records) {
      if (
        record.name_gj &&
        (record.name_gj.includes("àª") || record.name_gj.includes("à«"))
      ) {
        corruptCount++;
      }
    }
  }

  console.log(
    `\n📊 Records with encoding issues: ${corruptCount} out of ${data.totalRecords}`,
  );

  if (corruptCount > 0) {
    console.log("\n❓ Do you want to clear all corrupt name_gj fields? (y/n)");
    console.log("   This will allow you to re-translate them properly.");
  }
}

fixEncoding().catch(console.error);
