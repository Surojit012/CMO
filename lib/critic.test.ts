/**
 * Critic Pass Test
 * 
 * Documents the exact hallucination bug: an agent referred to
 * the product as "Strategist Agent" instead of "CMO".
 * 
 * Run with: npx tsx lib/critic.test.ts
 * (Requires GROQ_API_KEY in .env.local)
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runCriticPass } from "./critic";
import type { SpecializedAgentOutputs } from "./agents";

async function runTest() {
  const productName = "CMO";
  const url = "https://cmo.example.com";

  const websiteContent = `
    Website URL: https://cmo.example.com
    Title: CMO - AI Growth Engine for Startups
    Meta description: CMO analyzes your startup and gives you a full growth plan.
    
    CMO is an autonomous AI marketing system that runs 6 specialized agents
    to audit your website and deliver actionable growth strategies. Built for
    founders doing $1M-$10M ARR who need CMO-level marketing intelligence
    without hiring a CMO.
  `;

  // Simulate the hallucination bug: copywriter calls the product "Strategist Agent"
  const mockAgentOutputs: SpecializedAgentOutputs = {
    strategist: `CMO has a strong value proposition. The positioning targets indie founders 
      well. Recommendation: Sharpen the hero headline to mention "AI CMO" explicitly.`,
    copywriter: `Strategist Agent is a powerful tool that helps businesses grow. 
      The Strategist Agent platform should focus on building social proof. 
      Recommendation: Change CTA to "Try Strategist Agent Free".`,
    seo: `CMO should target "ai marketing tool for startups" as primary keyword. 
      Secondary: "automated growth analysis". Both have medium search volume.`,
    conversion: `CMO's landing page CTA says "Get Started" which is too generic. 
      Rewrite to: "Analyze My Startup in 15 Seconds". This increases specificity.`,
    distribution: `CMO should post in r/SaaS, r/startups, and Indie Hackers. 
      Thread angle: "I built an AI that replaced my marketing team."`,
    reddit: `Found relevant subreddits for CMO:
      - r/SaaS (450k users, high engagement)
      - r/startups (1.2M users)
      Sample comment: "We built CMO exactly for this pain point..."`,
  };

  console.log("─── Critic Pass Test ───");
  console.log(`Product Name: ${productName}`);
  console.log(`URL: ${url}`);
  console.log("Bug: Copywriter agent refers to product as 'Strategist Agent'\n");

  const result = await runCriticPass(mockAgentOutputs, websiteContent, productName, url);

  console.log("\n─── Results ───");
  console.log(JSON.stringify(result, null, 2));

  // Assertions
  let passed = 0;
  let failed = 0;

  // Test 1: Copywriter should NOT be approved
  if (!result.copywriter.approved) {
    console.log("\n✅ TEST 1 PASSED: Copywriter is NOT approved");
    passed++;
  } else {
    console.log("\n❌ TEST 1 FAILED: Copywriter was approved (should be rejected)");
    failed++;
  }

  // Test 2: Hallucinations should mention "Strategist Agent"
  const hasHallucination = result.copywriter.hallucinations.some((h) =>
    h.toLowerCase().includes("strategist agent")
  );
  if (hasHallucination) {
    console.log("✅ TEST 2 PASSED: Hallucination detected for 'Strategist Agent'");
    passed++;
  } else {
    console.log("❌ TEST 2 FAILED: No hallucination flagged for 'Strategist Agent'");
    console.log("   Hallucinations found:", result.copywriter.hallucinations);
    failed++;
  }

  // Test 3: Copywriter confidence should be < 6
  if (result.copywriter.confidence < 6) {
    console.log(`✅ TEST 3 PASSED: Copywriter confidence is ${result.copywriter.confidence} (< 6)`);
    passed++;
  } else {
    console.log(`❌ TEST 3 FAILED: Copywriter confidence is ${result.copywriter.confidence} (expected < 6)`);
    failed++;
  }

  // Test 4: Other agents should generally be approved
  const approvedAgents = ["strategist", "seo", "conversion", "distribution", "reddit"] as const;
  const othersPassed = approvedAgents.filter((a) => result[a].approved).length;
  if (othersPassed >= 4) {
    console.log(`✅ TEST 4 PASSED: ${othersPassed}/5 other agents approved (expected most to pass)`);
    passed++;
  } else {
    console.log(`❌ TEST 4 FAILED: Only ${othersPassed}/5 other agents approved`);
    failed++;
  }

  console.log(`\n─── Summary: ${passed}/${passed + failed} tests passed ───`);
  process.exit(failed > 0 ? 1 : 0);
}

runTest().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
