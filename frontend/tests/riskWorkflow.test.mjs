import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

test("Risk CDSS: All specialized clinical risk components exist", () => {
  const components = [
    "RiskLevelBadge.tsx",
    "ClinicalInputField.tsx",
    "PredictionConfidence.tsx",
    "PredictionExplanation.tsx",
    "RiskResultCard.tsx",
    "RiskTimeline.tsx",
    "ModelComparisonTable.tsx",
    "ClinicalReviewPanel.tsx",
    "DataQualityIndicator.tsx",
    "UncertaintyIndicator.tsx",
    "ClinicalAlert.tsx",
    "ModelInformation.tsx",
    "RiskAssessmentForm.tsx",
  ];

  for (const comp of components) {
    const p = path.join(projectRoot, "src", "components", "risk", comp);
    assert.ok(fs.existsSync(p), `Missing component: ${comp}`);
  }
});

test("Risk CDSS Theme Policy: Zero dark-mode classes in risk components", () => {
  const riskDir = path.join(projectRoot, "src", "components", "risk");
  const files = fs.readdirSync(riskDir).filter((f) => f.endsWith(".tsx"));

  for (const file of files) {
    const content = fs.readFileSync(path.join(riskDir, file), "utf-8");
    assert.doesNotMatch(
      content,
      /\bdark:/,
      `Component ${file} contains dark: theme class, violating strict white/light theme policy.`
    );
  }
});

test("Risk API Client: Typed service exists with required contract methods", () => {
  const apiPath = path.join(projectRoot, "src", "services", "risk", "riskApi.ts");
  assert.ok(fs.existsSync(apiPath), "riskApi.ts must exist");
  const content = fs.readFileSync(apiPath, "utf-8");

  const requiredMethods = [
    "createPrediction",
    "getPrediction",
    "getPatientRisk",
    "listPredictions",
    "listModels",
    "listEvaluations",
    "listFeatures",
    "listRules",
    "recordReview",
    "getDriftTelemetry",
  ];

  for (const method of requiredMethods) {
    assert.ok(
      content.includes(method),
      `riskApi missing required API contract method: ${method}`
    );
  }
});

test("Risk CDSS Clinical Safety: Mandatory human review and non-autonomous disclaimers", () => {
  const resultCardPath = path.join(projectRoot, "src", "components", "risk", "RiskResultCard.tsx");
  const content = fs.readFileSync(resultCardPath, "utf-8");
  assert.ok(
    content.includes("decision support only") || content.includes("Clinical Decision Support is intended solely to aid authorized clinicians"),
    "RiskResultCard must display mandatory non-autonomous clinical safety disclaimer."
  );
});
