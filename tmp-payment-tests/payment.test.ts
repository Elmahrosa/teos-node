// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";
import { verifyPayment } from "../lib/payment.ts";

const SIGNATURE = "mock-signature";
const PAYER = "mock-payer";
const TREASURY = "mock-treasury";
const MIN = 100_000;

function transaction(overrides: Record<string, any> = {}) {
  return {
    result: {
      blockTime: Math.floor(Date.now() / 1000),
      meta: { err: null, innerInstructions: [] },
      transaction: {
        signatures: [SIGNATURE],
        message: {
          accountKeys: [{
            pubkey: PAYER,
            signer: true,
            writable: true,
          }],
          instructions: [{
            program: "system",
            parsed: {
              type: "transfer",
              info: {
                source: PAYER,
                destination: TREASURY,
                lamports: MIN,
              },
            },
          }],
        },
      },
      ...overrides,
    },
  };
}

async function withRpc(body: any, callback: () => Promise<void>, status = 200) {
  const originalFetch = globalThis.fetch;
  process.env.HELIUS_RPC_URL = "http://127.0.0.1/mock-rpc";

  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

  try {
    await callback();
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.HELIUS_RPC_URL;
  }
}

const opts = {
  txSignature: SIGNATURE,
  payer: PAYER,
  treasury: TREASURY,
  minLamports: MIN,
};

test("rejects payer when account is not a signer", async () => {
  const body = transaction();
  body.result.transaction.message.accountKeys[0].signer = false;

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "payer_not_signer");
  });
});

test("rejects payer missing from account keys", async () => {
  const body = transaction();
  body.result.transaction.message.accountKeys = [{
    pubkey: "another-wallet",
    signer: true,
    writable: true,
  }];

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "payer_not_signer");
  });
});

test("rejects malformed account keys", async () => {
  const body = transaction();
  body.result.transaction.message.accountKeys = "invalid";

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_transaction");
  });
});
test("accepts exact valid payment", async () => {
  await withRpc(transaction(), async () => {
    assert.deepEqual(await verifyPayment(opts), { ok: true });
  });
});

test("rejects insufficient payment", async () => {
  const body = transaction();
  body.result.transaction.message.instructions[0].parsed.info.lamports = MIN - 1;

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "insufficient_or_wrong_transfer");
  });
});

test("rejects signature mismatch", async () => {
  const body = transaction();
  body.result.transaction.signatures = ["different-signature"];

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "signature_mismatch");
  });
});

test("rejects failed transaction", async () => {
  const body = transaction();
  body.result.meta.err = { InstructionError: [0, "Custom"] };

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "tx_failed");
  });
});

test("rejects old transaction", async () => {
  const body = transaction();
  body.result.blockTime = Math.floor(Date.now() / 1000) - 601;

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "tx_too_old");
  });
});

test("rejects future transaction", async () => {
  const body = transaction();
  body.result.blockTime = Math.floor(Date.now() / 1000) + 60;

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "tx_future");
  });
});

test("rejects invalid block time", async () => {
  const body = transaction();
  body.result.blockTime = null;

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_block_time");
  });
});

test("rejects invalid payment parameters without RPC call", async () => {
  const result = await verifyPayment({ ...opts, minLamports: 0 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "invalid_payment_parameters");
});

test("rejects wrong payer", async () => {
  const body = transaction();
  body.result.transaction.message.instructions[0].parsed.info.source = "other-payer";

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "insufficient_or_wrong_transfer");
  });
});

test("rejects RPC failure", async () => {
  await withRpc(null, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "rpc_unavailable");
  }, 503);
});

test("rejects missing transaction", async () => {
  await withRpc({ result: null }, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "tx_not_found");
  });
});

test("rejects malformed transfer amount", async () => {
  const body = transaction();
  body.result.transaction.message.instructions[0].parsed.info.lamports = "not-a-number";

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_transaction");
  });
});


test("rejects missing transaction metadata", async () => {
  const body = transaction();
  delete body.result.meta;

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_transaction");
  });
});

test("rejects missing transaction error status", async () => {
  const body = transaction();
  delete body.result.meta.err;

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_transaction");
  });
});

test("accepts valid inner system transfer", async () => {
  const body = transaction();
  body.result.transaction.message.instructions = [];
  body.result.meta.innerInstructions = [{
    index: 0,
    instructions: [{
      program: "system",
      parsed: {
        type: "transfer",
        info: {
          source: PAYER,
          destination: TREASURY,
          lamports: MIN,
        },
      },
    }],
  }];

  await withRpc(body, async () => {
    assert.deepEqual(await verifyPayment(opts), { ok: true });
  });
});

test("rejects malformed inner instruction group", async () => {
  const body = transaction();
  body.result.meta.innerInstructions = [{
    index: 0,
    instructions: "invalid",
  }];

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_transaction");
  });
});

test("accepts null inner instructions", async () => {
  const body = transaction();
  body.result.meta.innerInstructions = null;

  await withRpc(body, async () => {
    assert.deepEqual(await verifyPayment(opts), { ok: true });
  });
});

test("rejects malformed system transfer instead of ignoring it", async () => {
  const body = transaction();
  body.result.transaction.message.instructions[0].parsed.info.lamports = "not-a-number";

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_transaction");
  });
});


test("rejects missing inner instructions", async () => {
  const body = transaction();
  delete body.result.meta.innerInstructions;

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_transaction");
  });
});
test("accepts multiple matching transfers in one transaction", async () => {
  const body = transaction();
  body.result.transaction.message.instructions.push({
    program: "system",
    parsed: {
      type: "transfer",
      info: {
        source: PAYER,
        destination: TREASURY,
        lamports: MIN,
      },
    },
  });

  await withRpc(body, async () => {
    assert.deepEqual(await verifyPayment(opts), { ok: true });
  });
});
test("does not count transfers from another payer", async () => {
  const body = transaction();
  body.result.transaction.message.instructions[0].parsed.info.lamports = MIN - 1;
  body.result.transaction.message.instructions.push({
    program: "system",
    parsed: {
      type: "transfer",
      info: {
        source: "other-payer",
        destination: TREASURY,
        lamports: MIN,
      },
    },
  });

  await withRpc(body, async () => {
    const result = await verifyPayment(opts);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "insufficient_or_wrong_transfer");
  });
});
test("requests finalized commitment from RPC", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: any = null;

  process.env.HELIUS_RPC_URL = "http://127.0.0.1/mock-rpc";
  globalThis.fetch = async (_url: any, init: any) => {
    requestBody = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      json: async () => transaction(),
    } as Response;
  };

  try {
    assert.deepEqual(await verifyPayment(opts), { ok: true });
    assert.equal(requestBody.method, "getTransaction");
    assert.equal(requestBody.params[1].commitment, "finalized");
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.HELIUS_RPC_URL;
  }
});


