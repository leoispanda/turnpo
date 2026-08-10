import { WorkflowEntrypoint } from "cloudflare:workers";
import {
  stockPdcWorkflowAdvance,
  stockPdcWorkflowMark,
  stockPdcWorkflowRead,
  stockPdcWorkflowVerify
} from "../../functions/stock-pdc/[[path]].js";

const MODE_PATTERN = /^(official|demo)$/;
const RUN_ID_PATTERN = /^[a-f0-9-]{36}$/i;
const BATCH_SIZE = 30;

function noRetryStepConfig(timeout = "") {
  // Cloudflare requires delay whenever a retry policy is supplied, including
  // limit: 0. Every PDC action already persists its own idempotent audit state,
  // so a failed model call must be recorded once rather than silently retried.
  return {
    retries: { limit: 0, delay: "1 second", backoff: "constant" },
    ...(timeout ? { timeout } : {})
  };
}

function text(value, limit = 320) {
  return String(value || "").trim().slice(0, limit);
}

function workflowError(message, code = "PDC_WORKFLOW_BLOCKED") {
  const error = new Error(text(message));
  error.code = code;
  return error;
}

function reviewFor(member, stage) {
  return stage === "round-one" ? member?.roundOne : member?.roundTwo;
}

function reviewComplete(review) {
  return review?.status === "COMPLETE" && review?.integrity?.status === "COMPLETE";
}

async function advanceStage(env, runId, mode, stage, memberId = "") {
  const result = await stockPdcWorkflowAdvance(env, runId, stage, memberId, mode);
  if (!result.ok) throw workflowError(result.error || `${stage} did not complete.`);
  return result.run;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/start") return new Response("Not found", { status: 404 });
    if (!env.ORCHESTRATOR_SHARED_SECRET || request.headers.get("x-turnpo-orchestrator-key") !== env.ORCHESTRATOR_SHARED_SECRET) {
      return Response.json({ ok: false, error: "Unauthorized Stock PDC Workflow dispatch." }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const runId = text(body?.runId, 80);
    const mode = text(body?.mode, 16) || "official";
    if (!RUN_ID_PATTERN.test(runId) || !MODE_PATTERN.test(mode)) {
      return Response.json({ ok: false, error: "Invalid Stock PDC Workflow request." }, { status: 400 });
    }
    const workflowId = `stock-pdc-${mode}-${runId}`;
    try {
      const instance = await env.STOCK_PDC_WORKFLOW.create({ id: workflowId, params: { runId, mode } });
      return Response.json({ ok: true, workflowId: instance.id || workflowId }, { status: 202 });
    } catch (caught) {
      return Response.json({ ok: false, error: text(caught?.message || "Could not create Stock PDC Workflow.") }, { status: 502 });
    }
  }
};

export class StockPdcDecisionWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const runId = text(event.payload?.runId, 80);
    const mode = text(event.payload?.mode, 16) || "official";
    if (!RUN_ID_PATTERN.test(runId) || !MODE_PATTERN.test(mode)) throw workflowError("Workflow payload is invalid.", "PDC_WORKFLOW_INVALID");

    const finish = async (status, error = "", runStatus = "") => step.do(`execution:${status.toLowerCase()}`, noRetryStepConfig(), () => stockPdcWorkflowMark(this.env, runId, mode, {
      status,
      runStatus,
      completedAt: status === "COMPLETE" || status === "FAILED" || status === "BLOCKED" ? new Date().toISOString() : "",
      error
    }));

    try {
      await step.do("execution:running", noRetryStepConfig(), () => stockPdcWorkflowMark(this.env, runId, mode, {
        status: "RUNNING",
        startedAt: new Date().toISOString(),
        error: ""
      }));

      const verification = await step.do("verify:all-models", noRetryStepConfig("15 minutes"), () => stockPdcWorkflowVerify(this.env, runId, mode));
      if (!verification.ok) throw workflowError(verification.error || "At least one required PDC model verification failed.");

      const runAfterVerification = await step.do("read:after-verification", () => stockPdcWorkflowRead(this.env, runId, mode));
      for (const member of runAfterVerification.members || []) {
        const maxBatches = Math.max(1, Math.ceil((runAfterVerification.snapshot?.candidateCount || 0) / BATCH_SIZE));
        for (let batch = 1; batch <= maxBatches; batch += 1) {
          const before = await step.do(`read:round-one:${member.id}:${batch}`, () => stockPdcWorkflowRead(this.env, runId, mode));
          const current = before.members?.find((item) => item.id === member.id);
          if (reviewComplete(reviewFor(current, "round-one"))) break;
          const updated = await step.do(`round-one:${member.id}:batch:${batch}`, noRetryStepConfig("15 minutes"), () => advanceStage(this.env, runId, mode, "round-one", member.id));
          const updatedMember = updated.members?.find((item) => item.id === member.id);
          if (reviewComplete(reviewFor(updatedMember, "round-one"))) break;
          if (batch === maxBatches) throw workflowError(`${member.label} round one did not return every Hawkeye candidate.`);
        }
      }

      await step.do("merge:top-20", noRetryStepConfig(), () => advanceStage(this.env, runId, mode, "merge"));
      const runAfterMerge = await step.do("read:after-merge", () => stockPdcWorkflowRead(this.env, runId, mode));
      for (const member of runAfterMerge.members || []) {
        const maxBatches = Math.max(1, Math.ceil((runAfterMerge.pool?.length || 0) / BATCH_SIZE));
        for (let batch = 1; batch <= maxBatches; batch += 1) {
          const before = await step.do(`read:round-two:${member.id}:${batch}`, () => stockPdcWorkflowRead(this.env, runId, mode));
          const current = before.members?.find((item) => item.id === member.id);
          if (reviewComplete(reviewFor(current, "round-two"))) break;
          const updated = await step.do(`round-two:${member.id}:batch:${batch}`, noRetryStepConfig("15 minutes"), () => advanceStage(this.env, runId, mode, "round-two", member.id));
          const updatedMember = updated.members?.find((item) => item.id === member.id);
          if (reviewComplete(reviewFor(updatedMember, "round-two"))) break;
          if (batch === maxBatches) throw workflowError(`${member.label} round two did not return every shared-pool candidate.`);
        }
      }

      await step.do("secretary:summary", noRetryStepConfig("15 minutes"), () => advanceStage(this.env, runId, mode, "secretary"));
      await step.do("risk-check:final", noRetryStepConfig(), () => advanceStage(this.env, runId, mode, "risk-check"));
      await finish("COMPLETE");
    } catch (caught) {
      const message = text(caught?.message || "Stock PDC Workflow failed.");
      await finish("BLOCKED", message, "WORKFLOW_BLOCKED");
      throw caught;
    }
  }
}
