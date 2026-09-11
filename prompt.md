# Propr Tracker — Final AI-Slop Cleanup & Human-Code Refactor

Repository:

https://github.com/dhruvamity/propr-tracker.git

Use the attached:

* `eval.md`
* `SKILL.md`

as the authoritative style standard for this task.

The objective is to remove **AI slop** from the repository while preserving the actual product, behavior, architecture, financial correctness, tests, and established technical conventions.

This is NOT a feature-development task.

This is NOT a visual redesign.

This is NOT an excuse to rewrite the repository into a generic "clean architecture."

The goal is:

> Make the repository look and read like it was written and maintained deliberately by a competent human engineer who understands this specific project.

---

# 1. HARD RULES

Before touching anything:

1. Read the entire repository.
2. Read `eval.md` completely.
3. Read `SKILL.md` completely.
4. Inspect the existing codebase, documentation, comments, UI copy, tests, configuration, naming, and commit-visible artifacts.
5. Understand the existing architecture before editing.

Do NOT:

* change business logic merely for style;
* rewrite working code because another implementation looks cleaner;
* rename public APIs unnecessarily;
* change financial calculations;
* change API contracts;
* change database schemas;
* change Propr integration behavior;
* change tests merely to make them shorter;
* delete useful comments simply because they are verbose;
* replace real project-specific language with generic professional language;
* flatten personality out of README/documentation;
* add abstractions solely because the current implementation looks repetitive;
* introduce a new framework or dependency;
* create a giant formatting/refactor diff.

Preserve behavior first.

Style cleanup is subordinate to correctness.

---

# 2. WHAT "AI SLOP" MEANS IN THIS REPOSITORY

Apply `SKILL.md` and `eval.md` to the repository, adapting the principles to software.

Look for writing and code patterns that make the repository feel machine-generated, over-produced, generic, repetitive, or detached from the actual product.

The audit must cover at least:

```text
README.md
documentation
markdown files
comments
JSDoc
inline explanations
UI labels
UI descriptions
error messages
empty states
tooltips
button labels
test descriptions
test names
variable names
function names
component names
commit-visible generated text
configuration comments
architecture descriptions
audit artifacts
```

Also inspect source structure for code-level AI slop:

```text
unnecessary abstraction
over-engineered wrappers
one-line helper functions used once
generic "manager"/"service"/"handler"/"processor" classes
ceremonial interfaces
duplicated transformation layers
pointless re-export layers
excessive type wrappers
needless factory functions
generic adapter naming
over-commenting obvious code
comments that merely narrate syntax
comments that restate function names
comments that explain trivial assignments
```

Do NOT label ordinary technical abstraction as AI slop.

A useful abstraction solves a real problem.

---

# 3. PRESERVE THE PROJECT'S ACTUAL VOICE

The source material explicitly requires preserving the writer's:

* vocabulary
* cadence
* bluntness
* uncertainty
* digressions
* level of polish
* useful edge
* distinctive phrasing

Do the same here.

For this repository, preserve:

* direct engineering language;
* project-specific terminology;
* Propr terminology;
* financial terminology;
* concise technical explanations;
* useful blunt warnings;
* actual implementation caveats;
* uncertainty where uncertainty is real.

Do NOT turn everything into:

```text
"robust and scalable architecture"
"seamless experience"
"powerful solution"
"modern platform"
"comprehensive monitoring"
"enterprise-grade"
```

Those phrases are meaningless unless they describe something concrete.

---

# 4. BANNED LANGUAGE SWEEP

Use the banned vocabulary from `SKILL.md`.

Search the repository for:

```text
delve
foster
leverage
utilize
facilitate
empower
streamline
robust
cutting-edge
paradigm shift
game changer
this is huge
this changes everything
tapestry
realm
beacon
multifaceted
meticulous
intricate
paramount
transformative
elevate
embark
supercharge
harness
ever-evolving
```

Also search for empty language such as:

```text
it's worth noting
it's important to note
at the end of the day
when it comes to
at its core
in today's world
in the world of
the reality is
the truth is
in terms of
with regard to
in order to
going forward
let's dive in
```

The source specifically says these should be removed when they add nothing.

Do NOT perform a blind global replacement.

Inspect each occurrence and preserve it when it is genuinely meaningful or technical.

---

# 5. REMOVE AI-WRITING PATTERNS FROM DOCUMENTATION

Apply the complete pattern list from `SKILL.md`.

Find and remove:

## Binary contrasts

Examples:

```text
"This is not X. It's Y."
"The question isn't X, it's Y."
"It's not just X but Y."
```

Rewrite directly.

Example:

```text
Bad:
This is not a traditional trading dashboard. It's a complete command center.

Better:
This dashboard tracks accounts, risk, positions, orders, and finance.
```

---

## Throat-clearing openers

Remove:

```text
Here's the thing:
Here's what I mean:
Let me be clear:
I'll be honest:
The uncomfortable truth is:
```

Start with the actual point.

---

## Faux-insight setups

Remove:

```text
"This is the part most people skip..."
"What most people get wrong..."
"Here's what nobody tells you..."
"The part everyone misses..."
```

State the technical fact directly.

These patterns are explicitly identified as AI-slop patterns in `SKILL.md`.

---

## Colon-reveal prose

Avoid constructions like:

```text
The key insight: ...
The biggest issue: ...
The best part: ...
The real reason: ...
```

when they are merely dramatic setups.

Use normal sentences.

Keep colons for:

* lists
* labels
* configuration
* code
* actual grammatical use

The source specifically calls this out.

---

## Superficial analysis

Remove comments and documentation such as:

```text
highlighting...
underscoring...
reflecting...
showcasing...
demonstrating the importance of...
```

Replace them with actual mechanism or consequence when that information is useful.

Example:

```text
Bad:
This integration improves reliability, demonstrating the importance of centralized state.

Better:
The worker stores the latest account state in Redis so another process can reconstruct it after restart.
```

---

## Importance puffery

Remove language such as:

```text
critical milestone
pivotal moment
plays a vital role
stands as a testament
solidifies its position
underscores its significance
```

State the technical fact.

---

## Interpretive metadiscourse

Remove:

```text
The key point is...
This distinction matters...
As you can see...
It's important to understand...
In other words...
What this means is...
```

when the surrounding code or prose already makes the point.

The source explicitly calls this interpretive metadiscourse.

---

## Weasel attribution

Remove:

```text
experts agree
industry standards suggest
many believe
widely regarded as
studies show
```

unless the repository actually identifies the source.

Never invent authority.

---

## Fake-strong verbs

Prefer simple verbs.

Avoid unnecessary prose such as:

```text
"serves as a centralized hub"
"acts as a mechanism for"
"provides the ability to"
```

Prefer:

```text
"tracks"
"stores"
"loads"
"fetches"
"calculates"
"renders"
"validates"
```

---

## Synonym cycling

Use the same technical term consistently.

Do NOT alternate between:

```text
account
profile
trading entity
portfolio object
account record
```

when they mean the same thing.

Use the project's established term.

The same applies to:

```text
trade
position
order
purchase
payout
cash flow
PnL
```

Do not rotate vocabulary merely to sound varied.

---

## Negative listing

Remove:

```text
Not X.
Not Y.
Not Z.
```

unless the negative distinction is technically necessary.

State the actual design.

---

## Dramatic fragments

Avoid generated rhythm such as:

```text
Fast. Clean. Reliable.
No complexity. No nonsense.
Simple. Secure. Scalable.
```

unless the project already intentionally uses this style.

---

## Robotic rhythm

Look for:

```text
three identical sentence structures
every section containing exactly three bullets
repeated "This X..." openings
repeated "It..." sentences
identical paragraph lengths
mechanically parallel headings
```

Break the rhythm where it feels artificial.

The goal is natural technical writing, not manufactured variation.

---

## Rhetorical setups

Remove:

```text
What if I told you...
Think about it:
Plot twist:
Question? Answer.
```

Make the point directly.

---

## Fake-profound kickers

Delete manufactured endings such as:

```text
That's the real game changer.
And that's where the magic happens.
The code is only half the battle.
This is what separates good systems from great ones.
```

End documentation on the last useful fact or action.

---

## Summary-recap endings

Avoid repeating the same content at the end of every README section.

Do not append:

```text
In conclusion...
Ultimately...
Overall...
To summarize...
```

unless a summary is genuinely necessary.

---

# 6. REMOVE FORMAT SLOP

Audit Markdown formatting.

Remove:

* emoji section headings unless the project intentionally uses them;
* decorative bold;
* bold used every few words;
* excessive horizontal rules;
* headings for tiny two-sentence sections;
* nested bullet hierarchies that could be two sentences;
* giant tables where prose is clearer;
* repetitive callout blocks;
* "important" / "note" boxes that restate the obvious.

The source explicitly says formatting should follow the content rather than decorate it.

Do NOT remove formatting that materially improves scanning of technical information.

---

# 7. EM DASH CLEANUP

Search for:

```text
—
```

Remove decorative em dashes.

Prefer:

```text
period
comma
parentheses
semicolon
sentence split
```

Use an em dash only where it clearly improves the sentence.

The source recommends none in short copy and only occasional use in longer writing.

Do not globally replace code operators or technical syntax.

---

# 8. CODE COMMENT AUDIT

Inspect every nontrivial comment.

Delete comments that merely narrate code.

Example:

```ts
// Loop through accounts
for (const account of accounts) {
```

Delete it.

Also delete:

```ts
// Set the value
value = nextValue;

// Return the result
return result;
```

Delete comments that restate the function:

```ts
// Calculate active capital
calculateActiveCapital(...)
```

Keep comments that explain:

* a non-obvious Propr API quirk;
* a financial rule;
* why a workaround exists;
* a deployment constraint;
* a security boundary;
* an invariant;
* an unusual data-shape decision;
* a deliberately non-obvious algorithm;
* a race-condition prevention mechanism.

For each retained comment ask:

> Would a competent engineer understand WHY this exists without the comment?

If yes, delete the comment.

If no, keep or rewrite it.

---

# 9. JSDoc AUDIT

Review JSDoc especially carefully.

Remove generic blocks such as:

```ts
/**
 * This function is responsible for...
 * This function takes...
 * This function returns...
 */
```

when the types and function name already make that obvious.

Keep JSDoc when it documents:

* financial semantics;
* units;
* currency;
* API provenance;
* invariants;
* side effects;
* failure modes;
* external contracts.

Example:

```ts
/**
 * `amount` is USD face value, not actual bank cash cost.
 */
```

That is useful.

---

# 10. TEST NAME AUDIT

Make test names sound like engineers wrote them.

Avoid:

```text
should successfully correctly calculate...
should properly handle...
should robustly support...
should comprehensively validate...
```

Prefer:

```text
excludes failed purchases from active capital
filters decimal zero quantities
does not count pending payouts
rejects stale REST state
preserves HWM across restart
```

Use concrete behavior.

---

# 11. TEST DESCRIPTIONS

Avoid prose like:

```text
This test verifies that the system is able to correctly...
```

Prefer:

```text
it("excludes failed challenges from active capital", ...)
```

The test itself should communicate the invariant.

---

# 12. VARIABLE / FUNCTION / COMPONENT NAMING

Search for generic AI-shaped names:

```text
processData
handleData
transformData
processResult
handleResult
manageState
processState
genericData
resultData
responseData
payloadData
tempData
processedData
enhancedData
optimizedData
finalData
updatedData
```

Do NOT rename blindly.

Rename only when:

1. the name is actually vague;
2. the real domain meaning is known;
3. the change improves clarity;
4. the rename does not create unnecessary churn.

Prefer domain-specific names such as:

```text
accountSnapshot
purchaseLedger
activeCapital
drawdownLimit
lastSyncAt
processedPayouts
```

when those are the actual concepts.

---

# 13. OVER-ENGINEERED CODE

Look for structures that appear generated rather than necessary:

```text
one-use abstraction classes
one-use interfaces
wrapper around one function
factory around one object
service around one API call
manager around one state value
adapter around an already compatible object
three layers of trivial data transformation
```

For each, ask:

> Does this abstraction solve a real problem in this repository?

If not, simplify it.

But do NOT collapse architectural boundaries that are actually useful, such as:

```text
API client
normalization
calculation engine
finance ledger
UI
sync worker
```

Those are meaningful boundaries in this project.

---

# 14. DUPLICATION AUDIT

Find duplicated logic that looks generated.

Pay particular attention to:

```text
formatting
currency conversion
account status labels
error handling
API response normalization
risk labels
financial calculations
ledger aggregation
```

Prefer a shared function where duplication is genuinely harmful.

Do not extract tiny helpers solely to eliminate two similar lines.

The goal is clarity, not maximum abstraction.

---

# 15. DOCUMENTATION SPECIFICITY TEST

For every paragraph in repository documentation, ask:

> Could this sentence be pasted into documentation for another random SaaS product unchanged?

If yes:

1. delete it; or
2. replace it with something specific to Propr Tracker.

The source explicitly calls this the portability test.

Example:

```text
Bad:
The application provides a seamless and intuitive experience for managing your trading activities.

Better:
The terminal reads Propr account state, positions, orders, drawdown, payouts, and the finance ledger in one view.
```

---

# 16. README CLEANUP

Rewrite the README only as much as necessary.

It should answer:

```text
What is this?
Who is it for?
What does it currently do?
How do I run it?
What services/packages exist?
What environment variables are required?
What is intentionally unsupported?
```

Do not turn it into:

```text
marketing copy
architecture manifesto
AI-generated feature catalog
```

Avoid claims like:

```text
enterprise-grade
production-ready
world-class
comprehensive
powerful
seamless
scalable
```

unless a concrete technical fact supports the statement.

---

# 17. UI COPY AUDIT

Search all user-facing strings.

Look for AI-sounding labels such as:

```text
Powerful Insights
Comprehensive Overview
Real-Time Intelligence
Advanced Analytics
Seamless Monitoring
Centralized Command Center
Enhanced Visibility
Actionable Insights
Smart Risk Management
```

Replace them with concrete UI language.

Example:

```text
Bad:
Advanced Portfolio Intelligence

Better:
Account Risk
```

```text
Bad:
Comprehensive Financial Overview

Better:
Cash Flow
```

```text
Bad:
Real-Time Trading Intelligence

Better:
Live Positions
```

The UI should describe what the screen contains.

---

# 18. ERROR MESSAGE AUDIT

Avoid AI-polished error text.

Bad:

```text
We encountered an unexpected issue while attempting to synchronize your account data. Please try again later.
```

Better:

```text
Propr sync failed. Last successful update: 42s ago.
```

Use actual technical information that helps the user.

Do not expose secrets or internal stack traces.

---

# 19. EMPTY-STATE AUDIT

Avoid:

```text
No data available at the moment.
There's nothing here yet.
Your dashboard is ready to come alive.
```

Prefer specific states:

```text
No open positions.
No pending orders.
No processed payouts.
No finance transactions.
Propr data is unavailable.
```

---

# 20. COMMENT / DOC CLAIM AUDIT

Remove comments that make unsupported claims:

```text
// This is the fastest approach
// This is the most reliable implementation
// This guarantees production safety
// This ensures perfect accuracy
```

The comment should describe the mechanism, not praise it.

---

# 21. PRESERVE REAL UNCERTAINTY

Do NOT remove legitimate uncertainty.

Keep language such as:

```text
may
can
likely
unknown
not guaranteed
depends on
```

when the implementation or API contract genuinely has uncertainty.

Do not make uncertain code sound more authoritative just because the prose is being cleaned up.

---

# 22. DO NOT GAME AI DETECTORS

Do not modify the repository merely to make it score better on a detector.

Do not insert:

* typos;
* weird punctuation;
* awkward fragments;
* unnecessary slang;
* random sentence variation;
* fake personality;
* fake anecdotes.

The objective is human, useful engineering writing, not detector gaming.

The source explicitly says named patterns are evidence and AI detectors are not the authority.

---

# 23. PRESERVE FINANCIAL TERMINOLOGY

Never replace precise financial terminology merely because it sounds repetitive.

Keep distinctions such as:

```text
active capital
purchase face value
actual cash cost
realized PnL
unrealized PnL
cash PnL
processed payout
drawdown
high-water mark
daily loss
```

Do not synonym-cycle these terms.

---

# 24. PRESERVE PROPR TERMINOLOGY

Use the terminology defined by the Propr API and existing implementation.

Do not invent alternate labels just to make documentation more varied.

Consistency is more important than stylistic variation in technical writing.

---

# 25. AUDIT ARTIFACT CLEANUP

Review:

```text
FINAL_RELEASE_AUDIT.md
FINAL_RELEASE_FINDINGS.md
FINAL_RELEASE_RECONCILIATION.md
FINAL_RELEASE_TEST_REPORT.md
README.md
```

Remove AI-generated verbosity and repetitive certification language.

Keep:

* exact numbers;
* evidence;
* file references;
* commands;
* reproduction steps;
* known limitations;
* unresolved conditions;
* final verdict.

Do not remove evidence simply because it makes the document longer.

---

# 26. GIT DIFF DISCIPLINE

Before editing:

```bash
git status
git log -n 5 --oneline
```

After editing:

```bash
git diff --stat
git diff
```

The final diff must be explainable.

If the diff contains:

```text
hundreds of unrelated formatting changes
mass renaming
whole-file rewrites
unnecessary reordering
```

stop and reduce the scope.

---

# 27. AUTOMATED SEARCH

Perform repository-wide searches for:

```text
banned vocabulary
empty phrases
binary contrasts
throat clearing
faux insight
colon reveals
importance puffery
interpretive metadiscourse
weasel attribution
fake-strong verbs
synonym cycling
negative listings
dramatic fragments
rhetorical setups
fake profound endings
summary recaps
emoji headings
decorative bold
em dash clusters
generic variable names
narrative comments
```

Keep a temporary findings list during the cleanup.

---

# 28. MINIMUM EFFECTIVE EDIT

Follow the core rule from `SKILL.md`:

> Make the minimum effective edit.

If a sentence is already clear and human, leave it alone.

If a comment is useful, leave it alone.

If a piece of architecture is valid, leave it alone.

Do NOT normalize the entire repository into one writing style.

---

# 29. FINAL SELF-EVAL

After editing, run every check from `eval.md`.

The final repository must pass:

### Meaning

* Does the edit preserve the original technical meaning?
* Were no unsupported claims introduced?
* Were financial semantics preserved?

### Voice

* Does repository writing still feel specific to this project?
* Has useful bluntness been preserved?
* Has the writing avoided generic corporate prose?

### Structure

* Were only genuinely harmful structures changed?
* Were useful technical sections preserved?

### Clarity

* Are sentences direct?
* Are concrete facts used?
* Are weak verbs removed?

### AI-slop patterns

* binary contrasts removed where unnecessary;
* throat clearing removed;
* fake insight removed;
* dramatic colon reveals removed;
* superficial analysis removed;
* importance puffery removed;
* metadiscourse removed;
* weasel attribution removed;
* synonym cycling reduced;
* robotic rhythm reduced;
* fake-profound endings removed;
* summary recap endings reduced;
* formatting slop removed;
* decorative em dashes removed.

These checks come directly from `eval.md` and `SKILL.md`.

---

# 30. CODE SAFETY VERIFICATION

After all cleanup:

```bash
npm test
npm run type-check
npm run lint
npm run build
```

All must pass.

If any fail because of the cleanup:

* fix the cleanup;
* do not weaken the test;
* do not remove the failing assertion;
* do not suppress the lint rule unless it is genuinely correct.

---

# 31. BEHAVIORAL REGRESSION CHECK

Verify specifically that cleanup did not alter:

```text
active capital
purchase accounting
cash PnL
INR conversion
drawdown
trailing HWM
daily loss
PnL
positions
orders
payouts
REST/WS reconciliation
API failure states
read-only behavior
secret isolation
multi-account isolation
```

---

# 32. FINAL DIFF REVIEW

For every production-code change ask:

```text
Did this change remove AI slop?
Did it improve human readability?
Did it preserve behavior?
Could the same result have been achieved with fewer changes?
```

If the answer to the first two is no, revert the change.

---

# 33. FINAL OUTPUT

Produce:

```text
AI_SLOP_CLEANUP_REPORT.md
```

with:

```text
Repository:
Commit before cleanup:
Commit after cleanup:

Files reviewed:
Files changed:

Documentation cleanup:
Comment cleanup:
UI copy cleanup:
Naming cleanup:
Code abstraction cleanup:
Formatting cleanup:

AI-slop patterns removed:
- count

Behavioral changes:
- MUST BE ZERO unless explicitly justified

Tests:
Typecheck:
Lint:
Build:

Remaining intentional patterns:
- explanation
```

Also produce a concise final report containing:

## What Changed

Only concrete changes.

## What Was Deliberately Left Alone

Explain why some verbose or repetitive code/docs were preserved.

## Verification

Show:

```text
npm test
npm run type-check
npm run lint
npm run build
```

and their results.

---

# 34. FINAL ACCEPTANCE CRITERIA

The cleanup is accepted only when:

```text
[ ] no important technical meaning was lost
[ ] no financial semantics changed
[ ] no unsupported claims were introduced
[ ] banned AI vocabulary has been reviewed
[ ] filler phrases have been reviewed
[ ] AI-writing patterns have been reviewed
[ ] comments explain reasons rather than syntax
[ ] test names describe concrete behavior
[ ] UI copy is concrete
[ ] documentation is project-specific
[ ] unnecessary abstractions were removed only where justified
[ ] useful abstractions were preserved
[ ] no large meaningless formatting diff exists
[ ] no unnecessary dependency was added
[ ] tests pass
[ ] typecheck passes
[ ] lint passes
[ ] build passes
[ ] git diff is explainable
```

---

# 35. IMPORTANT FINAL RULE

Do not finish by saying:

```text
"The code is now cleaner, more robust, and production-ready."
```

That is exactly the kind of generic conclusion this task is intended to remove.

End with concrete facts:

```text
X files changed.
Y comments removed/reworked.
Z documentation sections rewritten.
N AI-slop patterns removed.
No business logic changed.
All tests pass.
Build passes.
```

The repository should feel less generated because the writing and code became more specific, restrained, and intentional—not because it was rewritten into a new artificial "human" style.
