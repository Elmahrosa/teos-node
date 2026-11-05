\# WEB4 / TEOS-NODE — COMPLETE SECURITY AND TRANSACTION INTEGRITY REMEDIATION



\## EXECUTION MODE



You are operating inside the existing repository:



`C:\\Users\\aams1\\teos-fresh`



Repository: `Elmahrosa/teos-node`



Previously inspected branch: `fix/frame-ancestors`



Previously inspected HEAD: `44d10d5`



The repository has already undergone a detailed audit. This task is to implement the approved remediation, not merely produce recommendations.



Work through the entire scope in one execution session. Inspect first, implement safe changes, run tests, and deliver a factual report.



Do not ask for confirmation between ordinary implementation steps. However, stop if a required operation would violate the safety rules or requires an unavailable infrastructure capability.



\---



\# 0. ABSOLUTE SAFETY RULES — HIGHEST PRIORITY



These rules override every other instruction.



\### Git protection



NEVER execute:



\- `git clean`

\- `git reset`

\- `git checkout --`

\- Any command that discards local changes

\- Any force push

\- Any automatic merge

\- Any deployment command

\- Any command that changes production environment variables



Do not commit or push.



Do not switch branches.



Do not overwrite existing user modifications.



\### Mandatory initial inspection



Before editing anything:



1\. Run `git status --short --untracked-files=all`.

2\. Run `git branch --show-current`.

3\. Run `git rev-parse HEAD`.

4\. Run `git diff --name-only`.

5\. Run `git diff --cached --name-only`.

6\. Record the original status for the final report.



The following existing local modification is protected:



`app/page.tsx`



It contains user changes. Do not overwrite, revert, replace, or reconstruct it from HEAD.



Inspect its diff only if necessary. Preserve all existing changes and make only the minimum required additions around them. If safe integration cannot be guaranteed, leave it untouched and report the remaining work.



\### Protected untracked Solana files



The previously observed untracked files include:



\- `old-key.txt`

\- `rotate.mjs`

\- `rotate2.mjs`

\- `rotate3.mjs`

\- `rotate-core-two.mjs`

\- `rotate-two.mjs`

\- `transfer-ayman.mjs`

\- `convert-new.mjs`



These names are examples of protected files, not an exhaustive list.



Do not open, read, execute, copy, move, rename, delete, stage, or modify any untracked file associated with:



\- Private keys

\- Seed phrases

\- Wallet recovery material

\- Solana transfers

\- Key rotation

\- Wallet migration

\- Signing operations



Never read or expose `.env` files, private keys, seeds, credentials, RPC secrets, API tokens, or production secrets.



Do not include secret values in terminal output, reports, test logs, or generated files.



Use filenames and metadata only when needed to identify protected files.



If a file's purpose is uncertain and it might contain wallet or signing material, treat it as protected.



\### General safety



\- No Solana transactions.

\- No wallet signing.

\- No NFT minting against production.

\- No automated refunds.

\- No public sale activation.

\- No auction activation.

\- No production deployment.

\- No pricing changes.

\- No changes to `tiers.ts`.

\- No deletion of backend Site Builder code.

\- No changes to production infrastructure without explicit approval.



The production application must remain closed to public sales unless its existing configuration independently keeps it closed. Do not enable registration.



\---



\# 1. IMPLEMENTATION STRATEGY



First inspect the existing architecture and determine:



\- Next.js version and routing conventions.

\- Existing database provider and schema.

\- Existing migrations.

\- Existing Redis implementation.

\- Existing Registry interfaces.

\- Existing Metaplex Core integration.

\- Existing payment verification.

\- Existing quote lifecycle.

\- Existing authentication and cron protection.

\- Existing test framework and test conventions.



Reuse the existing architecture.



Do not introduce a second database, a new payment provider, or a new infrastructure architecture without necessity.



Do not assume Redis is a permanent database.



Do not assume a memory Map is persistent.



Do not claim that a migration is deployed merely because a migration file exists.



If the current infrastructure cannot provide durable transactional order storage, implement only the safe components that can be implemented and tested. Clearly identify the infrastructure blocker. Never replace durable storage with an in-memory simulation.



Keep diffs focused and backward-compatible wherever possible.



\---



\# 2. REMOVE SITE BUILDER PROMISES FROM THE CUSTOMER INTERFACE



Inspect all active customer-facing routes and components.



Find references to:



\- BuildSiteAfterPurchase

\- "ابني موقعك"

\- "انشر موقعك"

\- "Site Builder"

\- "Build your site"

\- Any wording suggesting that purchasing a domain automatically creates or hosts a website.



Remove these promises from the active interface.



Replace them with this exact Arabic statement:



"صفحة هوية النطاق فقط - بدون بناء موقع حاليا"



Requirements:



\- Do not delete backend Site Builder code.

\- Do not delete unrelated functionality.

\- Do not claim website hosting, deployment, publishing, or independent website functionality.

\- Ensure the customer-facing page accurately describes the currently available identity-page functionality.

\- Do not modify unrelated marketing copy.



\---



\# 3. PERMANENTLY RESERVE AYMAN



The name `ayman` is reserved.



Implement a centralized reserved-domain policy and enforce it across all relevant server-side entry points.



Requirements:



\- Normalize the input before comparison.

\- Comparison must be case-insensitive.

\- `ayman`, `AYMAN`, and `Ayman` must all be treated identically.

\- The reserved name must never be purchasable.

\- The reserved name must never be claimable.

\- The reserved name must never be minted.

\- The reserved name must never be released through an ordinary customer flow.

\- UI search must show a clear reserved state.

\- API search must return a consistent machine-readable reserved state.



Expected response semantics:



`status: "RESERVED"`



`reason: "NOT\_FOR\_SALE"`



Apply this policy in:



\- Domain parsing and validation where appropriate.

\- `/api/check`.

\- `/api/availability`.

\- `/api/quote`.

\- `/api/register`.

\- `/api/admin/grant`.

\- Gateway resolution.

\- `/u/{name}`.

\- Any other active claim or mint entry point.



Do not rely on frontend validation.



Add regression tests proving that all relevant entry points reject the reserved name.



Do not change the existing reserved-domain policy for unrelated names.



\---



\# 4. IMPLEMENT A REAL DOMAIN IDENTITY PAGE



Replace the placeholder behavior in:



`app/u/\[name]/page.tsx`



The page must use the real Registry data.



Requirements:



1\. Normalize the requested name.

2\. Handle `ayman` as reserved before displaying ordinary Registry information.

3\. Retrieve the claim using the existing Registry interface.

4\. Display only values actually present in verified data.

5\. Display:

&#x20;  - Domain name.

&#x20;  - TLD.

&#x20;  - Registry status.

&#x20;  - Registration/claim timestamp.

&#x20;  - Shortened wallet address.

&#x20;  - NFT ownership verification status.

6\. Missing values must display:



&#x20;  "لا توجد بيانات"



7\. An unknown domain must display:



&#x20;  "النطاق غير مسجل"



8\. A reserved domain must display:



&#x20;  "نطاق محجوز"



9\. Return a genuine HTTP 404 for an unregistered domain where supported by Next.js `notFound()`.



10\. Do not invent a wallet address, transaction, date, asset address, TLD, or ownership state.



11\. Do not treat a Registry claim alone as proof of NFT ownership.



12\. Keep the design responsive and consistent with the existing project.



13\. Do not describe the page as an independent sovereign website or a hosting service.



Backward compatibility is important. Existing Registry records may not contain all newly required fields.



\---



\# 5. CORRECT THE GATEWAY SEMANTICS



Inspect:



`app/api/gateway/\[name]/route.ts`



The current implementation treats a Registry entry or sealed name as:



`SOVEREIGN\_RESOLVED`



and returns:



`live: true`



This is misleading.



Implement separate fields:



\- `registryKnown`

\- `nftVerified`

\- `ownershipMismatch`

\- `status`



For this implementation stage:



\- `nftVerified` must remain false unless actual Metaplex verification succeeds.

\- A Registry entry alone must never set `nftVerified: true`.

\- A sealed name must return `RESERVED`.

\- `ayman` must return `RESERVED`.

\- Unknown domains must return an appropriate unregistered response.

\- Do not return `live: true` merely because Registry contains the name.



Use an honest status model, for example:



\- `RESERVED`

\- `UNREGISTERED`

\- `REGISTRY\_RECORDED`

\- `OWNERSHIP\_UNVERIFIED`

\- `OWNERSHIP\_MISMATCH`

\- `NFT\_VERIFIED`



Do not claim `NFT\_VERIFIED` until actual on-chain ownership has been verified.



Do not break existing API consumers unnecessarily. Document response changes and update relevant tests.



\---



\# 6. TRANSACTION INTEGRITY — CRITICAL



The current purchase flow is:



`app/page.tsx` → `/api/quote` → `MintModal` → `/api/register`



Preserve this flow unless a minimal, necessary change is required.



Existing problems identified during audit:



\- Quote `markUsed()` performs a non-atomic read/write.

\- `releaseTx()` deletes an idempotency record but does not refund SOL.

\- Domain claims and payment can become inconsistent.

\- Mint failures may leave a paid order without a reliable recovery path.

\- Existing pending-mint logging has no identified worker consumer.

\- The success page trusts URL parameters rather than checking server state.



Implement a durable order lifecycle using the project's existing persistent database if one exists.



\## Order record



Create an Order model/table with appropriate constraints.



Required data:



\- orderId

\- normalized domain

\- TLD or purchased TLD list

\- wallet address

\- payment transaction signature

\- actual verified payment amount

\- currency/denomination

\- payment timestamp

\- asset address, when available

\- status

\- createdAt

\- updatedAt

\- lastError or equivalent diagnostic field



Do not store secrets.



Use appropriate unique constraints, including payment transaction signature where applicable.



Use a unique normalized domain constraint or a database-backed locking strategy that prevents two customers from successfully claiming the same domain concurrently.



\## Required lifecycle



Implement valid state transitions:



`PENDING → PAID → CLAIMED → MINTED`



Failure and review states:



`FAILED`



`NEED\_REVIEW`



Rules:



\- Never move to `MINTED` before confirming the asset exists and the mint result is recorded.

\- Never mark an order paid based solely on client-provided information.

\- Payment must be verified independently through the existing Solana payment verifier.

\- Store the verified amount and payment timestamp from trusted server-side verification.

\- Keep an auditable record of the payment signature.

\- A retry must not accept a different payment transaction for an already-paid order.

\- Never silently discard a paid order.

\- A failure after confirmed payment must preserve the order and its current state.

\- Errors must not trigger an automatic refund.

\- Never describe deletion of a transaction lock as a refund.



\## Atomicity



Use database transactions and unique constraints where supported.



The following operations must be protected against concurrency:



\- Creating an order.

\- Recording payment.

\- Claiming a domain.

\- Creating a mint job.

\- Associating a resulting asset with an order.



If full cross-system atomicity between Solana and the database is impossible, use an explicit durable state machine and reconciliation strategy.



Do not pretend that a database transaction can roll back an already confirmed Solana payment.



\## Quote consumption



Replace the unsafe read-then-write quote consumption behavior with an atomic operation.



Use a conditional database update, atomic Redis operation, or another proven compare-and-set mechanism.



The same quote must not be consumed by two concurrent registration requests.



If the current storage provider cannot guarantee atomic consumption, stop and report the limitation rather than implementing an unsafe fallback.



\---



\# 7. MINT RECOVERY — DURABLE JOBS



Create a durable `mint\_jobs` table/model using the existing database.



Required fields:



\- id

\- orderId

\- domain

\- wallet

\- status: `QUEUED`, `PROCESSING`, `DONE`, `FAILED`

\- attemptCount

\- lastError

\- createdAt

\- updatedAt

\- optional assetAddress

\- optional transactionSignature



Use a unique constraint or equivalent idempotency mechanism to prevent duplicate jobs for the same order.



\## Mint execution



For every paid and claimed order:



1\. Create the mint job durably before attempting mint execution.

2\. Mark the job `PROCESSING` under a concurrency-safe lock.

3\. Check whether the expected asset already exists.

4\. If it exists and its identity can be verified, associate it with the order instead of minting again.

5\. Otherwise perform the mint using the existing Metaplex Core integration.

6\. Verify the resulting asset.

7\. Persist its asset address and transaction signature.

8\. Mark the job `DONE`.

9\. Mark the order `MINTED` only after durable verification and recording.



\## Retry behavior



Implement:



`/api/cron/mint-recovery`



Security requirements:



\- Protect it with the existing cron authentication mechanism.

\- Never expose cron credentials.

\- Never allow unauthenticated public mint execution.

\- Process only eligible `FAILED` jobs for automatic retry, as specified.

\- Maximum three attempts per job.

\- Do not reset attemptCount.

\- Do not retry permanently invalid or ambiguous cases blindly.

\- Record each attempt and error.

\- Use concurrency-safe claiming of jobs.

\- A stale `PROCESSING` job must be reconciled before retry.

\- Check for an existing successful asset before every new mint attempt.



If an operation may already have succeeded on Solana but the database result is uncertain, mark it for review/reconciliation rather than blindly minting again.



Do not implement automatic SOL refunds.



Do not create a second independent worker architecture if the existing platform already provides an appropriate scheduled execution mechanism.



Do not claim the worker is operational until its infrastructure schedule and authentication are actually configured and verified.



\---



\# 8. ON-CHAIN OWNERSHIP VERIFICATION



Use the existing Metaplex Core integration.



Inspect `lib/mint.ts` and Registry interfaces before implementation.



The Registry currently stores claims and mint records separately. Existing claims may not have an asset address.



Implement a backward-compatible mechanism to retrieve the associated asset address from the existing mint record or the Order record.



When an asset address is available:



1\. Fetch the actual Metaplex Core asset using the existing Solana connection/provider.

2\. Retrieve its current on-chain owner.

3\. Compare the owner with the Registry owner.

4\. Normalize wallet addresses before comparison.

5\. If equal, return verified ownership.

6\. If different, return `ownershipMismatch: true`.

7\. Never display the Registry wallet as confirmed owner when ownership differs.

8\. If the asset cannot be fetched, return an unverified state.

9\. Do not convert RPC failure into successful verification.

10\. Do not treat a missing asset address as verified ownership.



Apply the verification to:



\- `/u/{name}`

\- `/api/gateway/\[name]`



Do not trust cached ownership indefinitely.



Use a short, documented cache only if required for performance, with safe invalidation and failure semantics.



A successful Registry lookup is not proof of current NFT ownership.



\---



\# 9. ORDER TRACKING PAGE



Create:



`app/order/\[id]/page.tsx`



The page must retrieve the actual Order from persistent storage.



It must not rely on query-string claims or localStorage.



Display:



\- Order ID.

\- Domain name.

\- Amount actually verified.

\- Payment transaction signature.

\- Payment timestamp.

\- Current order status.

\- Mint status.

\- Asset address when verified.



Use a clear status presentation for:



\- `PENDING`

\- `PAID`

\- `CLAIMED`

\- `MINTED`

\- `FAILED`

\- `NEED\_REVIEW`



Only display a successful completion message when the database confirms:



`status === "MINTED"`



A URL parameter must never be sufficient to prove payment, claim, mint, or ownership.



Protect customer data. Do not reveal private order details to arbitrary users. Use a secure order access mechanism consistent with the existing application, or require an appropriate authorization mechanism.



Do not expose wallet secrets or environment variables.



\---



\# 10. SUPPORT PAGE



Create:



`app/support/page.tsx`



Explain in clear Arabic and English if the application already supports bilingual content:



"If you completed payment but did not receive your NFT, submit your order ID and payment transaction signature for manual review."



Arabic wording:



"إذا أتممت الدفع ولم يصلك NFT، أرسل رقم الطلب وتوقيع المعاملة لمراجعة الطلب يدوياً."



Requirements:



\- Explain manual review.

\- Do not promise automatic refunds.

\- Do not promise a specific response time unless one is actually configured.

\- Do not expose private operational information.

\- Do not imply that submitting a support request itself executes a refund.



If an existing support API is reused, validate and rate-limit inputs.



\---



\# 11. REFUND POLICY — MANUAL ONLY



The existing `/api/refund-request` route only queues a support request in Redis and does not execute a refund.



Preserve that distinction.



Requirements:



\- No automated refund transfer.

\- No Solana signing.

\- No treasury transfer.

\- No automatic refund on domain-claim failure.

\- No automatic refund on mint failure.

\- Never call `releaseTx()` and describe it as a refund.

\- Preserve the original payment transaction record.

\- Ensure paid-but-unminted orders can be located and reviewed.

\- Document that refund decisions require human approval and manual execution.



If the existing Redis support queue has no durable consumer, explicitly document that it is a support intake queue, not a completed refund workflow.



\---



\# 12. SUCCESS PAGE



Inspect `app/success/page.tsx`.



The current page trusts URL parameters such as:



\- `tx`

\- `pay`

\- `asset`

\- `names`

\- `pending`



These parameters are not proof of a successful mint.



Change the success flow so that:



\- It references the actual order ID.

\- It retrieves the actual server-side order state.

\- It displays success only for a verified `MINTED` order.

\- A paid-but-unminted order displays a review/pending message.

\- A failed order does not display a success message.

\- Client-controlled URL parameters cannot override database status.



Preserve existing localization and layout where possible.



\---



\# 13. PAYMENT VALIDATION HARDENING



Inspect `lib/payment.ts`.



The audit identified:



\- Future `blockTime` values are not explicitly rejected.

\- Overpayment is accepted using a minimum amount check.

\- Payment validation must remain independent of client assertions.



Harden payment verification carefully:



\- Reject missing, failed, stale, or unverifiable transactions.

\- Reject implausible future timestamps.

\- Preserve confirmed commitment requirements.

\- Preserve supported transaction version restrictions.

\- Verify the expected payer and treasury.

\- Verify the correct transfer instruction and amount.

\- Account for the actual quote amount and documented rounding policy.

\- Do not accidentally reject valid transactions solely because Solana transaction data contains unrelated instructions.

\- Preserve inner/outer instruction handling.

\- Add tests for underpayment, exact payment, overpayment policy, wrong payer, wrong treasury, stale transactions, future timestamps, and RPC failure.



Do not change advertised prices.



Do not introduce new USD or SOL price tiers.



If exact payment enforcement is incompatible with existing quote behavior, document the precise issue rather than silently changing commercial terms.



\---



\# 14. PRICING FREEZE



Do not modify:



\- `tiers.ts`

\- Pricing configuration

\- Dodo checkout URLs

\- Existing USD price values

\- Existing product tiers



No new $25 price.



No new SOL pricing scheme.



Pricing is explicitly outside this remediation.



\---



\# 15. TESTING REQUIREMENTS



Add or update automated tests using the existing test framework.



At minimum test:



\### Reserved domain



\- `ayman`

\- `AYMAN`

\- `Ayman`

\- Search rejection.

\- Quote rejection.

\- Registration rejection.

\- Admin grant rejection.

\- Mint rejection.



\### Order lifecycle



\- Pending order creation.

\- Verified payment transition.

\- Claim transition.

\- Mint transition.

\- Failure preservation.

\- Review state.

\- Invalid state transitions.

\- Duplicate payment signature.

\- Duplicate order submission.



\### Concurrency



\- Two simultaneous requests for the same domain.

\- Two requests consuming the same quote.

\- Two mint workers attempting the same job.

\- A retry racing with a successful mint.



\### Mint recovery



\- Existing asset detection.

\- No duplicate mint.

\- Successful retry.

\- Three-attempt limit.

\- RPC failure.

\- Ambiguous previous transaction.

\- Stale PROCESSING job reconciliation.



\### Ownership



\- Matching Registry and on-chain owner.

\- Mismatched owner.

\- Missing asset.

\- RPC failure.

\- Missing asset address.

\- Sealed/reserved domain.



\### User interface



\- Unregistered `/u/{name}`.

\- Reserved `/u/ayman`.

\- Registered domain with missing optional data.

\- Verified NFT.

\- Ownership mismatch.

\- Order pending.

\- Order minted.

\- Order failed.

\- Success page with forged URL parameters.



\### Payment



\- Exact expected payment.

\- Underpayment.

\- Overpayment according to the selected policy.

\- Wrong payer.

\- Wrong treasury.

\- Failed transaction.

\- Old transaction.

\- Future timestamp.

\- RPC unavailable.



Do not delete, weaken, skip, or rewrite existing tests merely to make the suite green.



Run:



\- Existing unit tests.

\- Relevant integration tests.

\- TypeScript checks.

\- ESLint.

\- Production build.

\- `git diff --check`.



Do not claim tests passed unless they actually ran and passed.



If an integration test requires unavailable external infrastructure, identify it as NOT RUN and explain why.



Never send real Solana transactions during tests.



Use mocks or isolated test fixtures.



\---



\# 16. PRODUCTION SAFETY



Do not:



\- Deploy to Vercel.

\- Deploy to Railway.

\- Change production environment variables.

\- Open registration.

\- Enable public sales.

\- Start an auction.

\- Execute an actual mint.

\- Transfer SOL.

\- Execute a refund.

\- Publish a new release.

\- Push changes.

\- Merge changes.



The implementation must leave production activation as a separate, explicitly approved future operation.



Do not modify production settings to make health checks green.



Do not weaken fail-closed behavior.



Do not add a fallback that silently treats an unavailable database or RPC as successful.



\---



\# 17. FINAL VALIDATION



Before finishing:



1\. Run `git status --short --untracked-files=all`.

2\. Run `git diff --name-only`.

3\. Run `git diff --cached --name-only`.

4\. Run `git diff --check`.

5\. Confirm the original `app/page.tsx` modification remains preserved.

6\. Confirm protected untracked Solana files remain untouched.

7\. Confirm `tiers.ts` is unchanged.

8\. Confirm no deployment, push, merge, commit, refund, or Solana transaction was executed.

9\. Confirm public registration was not enabled.

10\. Report any implementation blocked by missing infrastructure.



Do not stage files.



Do not create a commit.



Do not push.



Do not run any destructive Git command.



\---



\# 18. REQUIRED DELIVERY REPORT



Provide a factual final report with these sections:



\## A. Files changed

List only files actually modified or newly created.



For each file, state the purpose of the change.



\## B. Transaction integrity

Explain the implemented Order lifecycle and the guarantees actually achieved.



\## C. Mint recovery

Explain the durable job design, idempotency, retry limit, and unresolved infrastructure requirements.



\## D. Ownership verification

Explain exactly how Metaplex Core ownership is verified and how mismatch/RPC failure is handled.



\## E. Customer interface

Explain the changes to domain identity, order tracking, support, and success pages.



\## F. Tests

List each command actually run and its actual result.



Separate PASS, FAIL, and NOT RUN.



\## G. Infrastructure blockers

List database migrations, cron scheduling, environment configuration, or external services that still require separate operational action.



\## H. Final Git status

Show the final status and identify pre-existing modifications separately from newly created changes.



\## I. Safety confirmation

Explicitly confirm:



\- No `git clean`.

\- No `git reset`.

\- No `git checkout --`.

\- No protected key or Solana transfer file was opened, executed, moved, or deleted.

\- No `.env` or secret was read or exposed.

\- No production deployment.

\- No public sale activation.

\- No auction activation.

\- No pricing changes.

\- No commit or push.

\- No actual Solana transaction or refund.



\## FINAL ACCEPTANCE RULE



A feature is complete only when its implementation and relevant tests demonstrate the required behavior.



A migration file alone does not prove a production database migration was applied.



A cron API route alone does not prove a scheduled worker is running.



A Registry entry alone does not prove NFT ownership.



A payment transaction alone does not prove mint completion.



A successful build alone does not prove transaction integrity.



If any requirement remains incomplete, say so explicitly. Never report full completion when a required guarantee is missing.

