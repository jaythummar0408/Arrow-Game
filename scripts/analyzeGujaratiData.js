require("dotenv").config();
const fs = require("fs");
const path = require("path");

function isProperGujarati(text) {
  if (!text || text.trim() === "") return false;

  // Check if text contains corrupted encoding patterns
  const hasCorruption =
    text.includes("à") ||
    text.includes("«") ||
    /[À-ÿ]/.test(text) || // Latin extended characters
    /\\u[0-9a-f]{4}/i.test(text); // Escaped unicode

  // Check if it has proper Gujarati Unicode (0x0A80-0x0AFF)
  const hasGujarati = /[\u0A80-\u0AFF]/.test(text);

  return hasGujarati && !hasCorruption;
}

function analyzeData() {
  const filePath = path.join(__dirname, "commodity_variety_grade_data.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  console.log("\n🔍 ANALYZING GUJARATI NAMES\n");
  console.log("=".repeat(70));

  const stats = {
    commodity: { total: 0, correct: 0, corrupted: 0, empty: 0 },
    variety: { total: 0, correct: 0, corrupted: 0, empty: 0 },
    grade: { total: 0, correct: 0, corrupted: 0, empty: 0 },
  };

  const corrupted = { commodity: [], variety: [], grade: [] };
  const correct = { commodity: [], variety: [], grade: [] };

  // Analyze each model
  for (const [modelName, records] of Object.entries(data.models)) {
    stats[modelName].total = records.length;

    for (const record of records) {
      if (!record.name_gj || record.name_gj.trim() === "") {
        stats[modelName].empty++;
      } else if (isProperGujarati(record.name_gj)) {
        stats[modelName].correct++;
        correct[modelName].push(record);
      } else {
        stats[modelName].corrupted++;
        corrupted[modelName].push(record);
      }
    }
  }

  // Print Statistics
  console.log("\n📊 STATISTICS\n");

  for (const [model, stat] of Object.entries(stats)) {
    console.log(`${model.toUpperCase()}:`);
    console.log(`  Total: ${stat.total}`);
    console.log(
      `  ✅ Correct: ${stat.correct} (${((stat.correct / stat.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  ❌ Corrupted: ${stat.corrupted} (${((stat.corrupted / stat.total) * 100).toFixed(1)}%)`,
    );
    console.log(`  ⚪ Empty: ${stat.empty}`);
    console.log("");
  }

  console.log("=".repeat(70));

  // Show some examples
  console.log("\n✅ EXAMPLES OF CORRECT GUJARATI:");
  console.log("-".repeat(70));
  for (const [model, records] of Object.entries(correct)) {
    if (records.length > 0) {
      console.log(`\n${model.toUpperCase()}:`);
      records.slice(0, 5).forEach((r) => {
        console.log(`  ${r.name} → ${r.name_gj}`);
      });
    }
  }

  console.log("\n\n❌ EXAMPLES OF CORRUPTED DATA:");
  console.log("-".repeat(70));
  for (const [model, records] of Object.entries(corrupted)) {
    if (records.length > 0) {
      console.log(`\n${model.toUpperCase()}:`);
      records.slice(0, 5).forEach((r) => {
        console.log(`  ${r.name}`);
        console.log(`    Current: ${r.name_gj.substring(0, 50)}...`);
      });
    }
  }

  console.log("\n\n" + "=".repeat(70));
  console.log("💡 RECOMMENDATION:");
  console.log("=".repeat(70));

  const totalCorrupted =
    stats.commodity.corrupted + stats.variety.corrupted + stats.grade.corrupted;
  const totalCorrect =
    stats.commodity.correct + stats.variety.correct + stats.grade.correct;

  if (totalCorrupted > 0) {
    console.log(`\n${totalCorrupted} records have corrupted Gujarati text.`);
    console.log(
      `${totalCorrect} records already have correct Gujarati text.\n`,
    );
    console.log("Options:");
    console.log("1. Clear corrupted data and re-translate");
    console.log("2. Use Google Translate API to get fresh translations");
    console.log("3. Manually copy-paste proper Gujarati names\n");
  } else {
    console.log("\n✨ All Gujarati names are properly formatted!\n");
  }

  // Export lists for easy reference
  const exportData = {
    summary: stats,
    corrupted: corrupted,
    correct: correct,
  };

  const outputPath = path.join(__dirname, "gujarati_analysis.json");
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8");
  console.log(`📁 Detailed analysis saved to: ${path.basename(outputPath)}\n`);
}

analyzeData();
