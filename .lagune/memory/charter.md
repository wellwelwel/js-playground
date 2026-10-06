# JavaScript Playground Security Charter

## Principles

### I. The user's code runs only inside a sandbox the page controls

Always run the code typed into the playground in an isolated context, such as a Web Worker or a sandboxed frame, that cannot reach the playground page, what the page stores, or anything else published at the same address. Never execute that code inside the playground page itself, and the page MUST always be able to stop a run that does not end.

- Why: the playground runs whatever is typed or arrives through a link. Code with access to the page can read what it stores, change what the user sees, and act as the site, so a crafted link becomes an attack on anyone who opens it. A run that cannot be stopped locks the user out of their own tab.

### II. Code runs only when the user asks

Never run code automatically. Code that arrives through a link, or is restored after a reload, MUST only be placed in the editor, and it runs only after the user explicitly presses Run.

- Why: a link can be sent by anyone. If opening it were enough to run the code inside, every shared link would run a stranger's program on the reader's machine, draining their CPU, flooding them with dialogs, or making requests from their browser, even when the sandbox holds.

### III. A link carries code and nothing more

Always treat code arriving through a link as untrusted input: decode it defensively, cap its size, and place it in the editor as plain text. Anything else the page reads from a link MUST match a fixed list of expected values before it is used. A link the playground creates MUST contain only the code the user chose to share at that moment, never content from other tabs or from storage.

- Why: a link can be forged by anyone and, once created, lives on in chat logs, browser history, screenshots, and server logs. Inbound, it must not be able to break or steer the page. Outbound, it must not carry anything the user did not mean to publish.

### IV. Console output is text, never markup

Always render what the sandbox reports as plain text, never as HTML. Only inert, already serialized text crosses from the sandbox to the page. Never pass live objects, functions, or elements out of the sandbox.

- Why: the output is controlled by the code that ran. Rendered as markup, a string becomes a script running inside the page. Inspected as a live object, it brings the code's own getters and traps into the page, undoing the sandbox.

### V. Serialization always finishes, whatever it is given

The serializer MUST always complete: cap depth, item count, and text length, detect cycles, and catch anything a value throws while being inspected, such as a getter, a toString, or a proxy trap. A value it cannot describe is shown as a safe placeholder, never as a crash.

- Why: a value can be built to loop forever, grow without end, or throw mid-inspection. A serializer without limits freezes or crashes the console, and a frozen page cannot even stop the run that caused it.

### VI. Each tab keeps its own draft, and keeps only the draft

Always keep each tab's draft in storage scoped to that tab alone, such as sessionStorage. Never use storage shared across tabs for a tab's draft, and never store anything beyond the draft and the few settings the playground needs.

- Why: shared storage lets one tab silently overwrite another's work, and anything kept on the user's device outlives the moment it was written. The less that is stored, the less there is to corrupt or leak.

### VII. The publishing pipeline is locked down

Always build from the committed lockfile with a clean install, pin every action and tool the pipeline runs to an exact version, and grant the publishing workflow only the permission it needs to publish the site.

- Why: every push to the main branch ships straight to the public site. A compromised dependency, action, or over-privileged token turns the pipeline into a way to serve malicious code to every visitor or to alter the repository itself.

## Baseline discipline

Lagune holds this charter, every principle, every time. A principle is not suspended because a control looks small, familiar, or unlikely to be hit. This is not a judgement call.

### Only the controls the project needs

Lagune recommends and applies only the controls this project's context calls for. A control the project does not need is never added for completeness, and a generic checklist is not thoroughness. Every later phase acts on what the system actually does, never on what it might hypothetically do.

- Why: effort spent on risks the project does not have buries the risks it does have. Fewer, right-sized controls are easier to apply, prove, and keep true than a checklist no one finishes.

### Prefer the simplest vetted control

When a control is needed, reach for the safest option already proven, in order: a control this project already has, then a platform or framework built-in, then a well-maintained vetted library, and only then custom code. Never hand-roll a security primitive (cryptography, escaping, authentication, sessions) that a vetted standard already provides. A new dependency is new attack surface, justified and not assumed. Code, an endpoint, or a feature the project does not use is attack surface too, so removing it is itself a control.

- Why: hand-rolled security is where subtle, unaudited bugs live, and a second control duplicating an existing one is the one that gets forgotten and drifts. Boring, standard controls are easier to audit and harder to get wrong, and less surface is less to defend.

### When a control seems skippable

A control is held even when a reason to skip it feels reasonable:

- "Too small to need a control": small gaps are where breaches start.
- "Already handled elsewhere": assumed coverage is exactly how gaps hide.
- "Unlikely to be hit": attackers target the path no one is watching.
- "It works, ship it": working and safe are different claims, and the charter requires both.

## Governance

This charter supersedes ad hoc decisions. Every later Lagune phase (detect, plan, harden, verify) checks its work against these principles, and a control that would break one of them is not applied. A principle changes only by rerunning the charter phase: the change is reviewed in a pull request and the version is bumped, MAJOR when a principle is removed or redefined, MINOR when one is added or materially expanded, PATCH for wording and clarity.

Version: 1.0.0 | Ratified: 2026-10-05
