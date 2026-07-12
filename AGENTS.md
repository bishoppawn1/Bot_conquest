# Bot Conquest — Agent Guide

## Current focus

We are building the first playable region of a 2D platforming/fighting game. The final game is one interconnected, explorable map—not a sequence of linear sectors or Mario-style stages. Future regions should support branching paths, backtracking, optional discoveries, and small secrets. Preserve the industrial sci-fi direction and keep gameplay readable.

The July 2026 map is a clean replacement for the discarded access-path layout. Do not reuse the old thin staircase, named bays, location captions, or route/side-platform data model. The current spatial language is enormous foundations, heavy ceilings, thick interior forms, open chambers framed by collision geometry, and ability-gated upper masses.

## Current player specification

- The player is a small mechanical bot whose body is wider than it is tall.
- It has three red eyes and three procedural legs. The three feet use a 44-unit lateral spread and may reach 112 units so the rig remains clearly visible around the body. The center foot receives a directional bias instead of hiding directly beneath the bot.
- Each leg is drawn only when it can connect a body anchor to a real, reachable platform surface. Never synthesize a fallback foot point in empty air. Foot placement varies so the legs do not remain directly under the body.
- Aim is cardinal. `A`/`D` aim left/right while moving, `W` aims up while jumping, and `S` aims down. The last aim direction persists.
- `Space` performs an instantaneous 105-unit directional slash locked to the current aim. Damage resolves across the full area on the press frame only. Its visual is a brief, static white forward slash—no extension, retraction, arrow, pointer, or circular arc.
- New runs start with the basic jump, slash, and repair. `E` repairs one missing shell when the bot has at least 30 electricity.
- Double jump, dash, wall movement, electric field, and electric jab remain implemented but locked for later pickups. Use `game.unlockAbility(name)` when progression grants one.
- Once unlocked, `Q` creates the circular field, `F` uses electric jab, and `Shift` dashes. `R` restarts.
- After the boss is cleared, `O` interacts with the recovery station. Resting restores all three shells and moves the spike-reset checkpoint beside the station.
- `I` is reserved for the future combined inventory/map interface. It must remain unbound and have no behavior until that system is designed.
- The player starts with three lives and loses one to enemy contact, spikes, or falling.
- Touching a spike immediately removes one life and returns the bot to its last safe position on the most recently supported platform. It must not continue falling through the spike pit or return all the way to the initial spawn.

## Resources and combat economy

- A standard enemy hit generates 12 electricity, capped at 100.
- Only three conduits exist. Each holds 24 total electricity, yields 4 per primary hit, visibly drains, and generates nothing once empty.
- Special-attack hits return 4 electricity per target.
- Killing enemies awards scrap based on archetype. Scrap is persistent run currency reserved for later systems; do not add spending behavior without a new design decision.
- Ordinary junk piles are solid destructible obstacles. Destroying one awards its configured scrap value but no electricity.

## Enemy rules

- Selected crawlers and rollers passively patrol within explicit leash ranges. They reverse at leash boundaries and unsupported edges.
- Oblong rollers use acceleration and momentum; they do not snap directly to chase speed like crawlers.
- Square brutes stand still during a visible 0.38-second windup, then commit to a locked-direction 190-unit-per-second charge. They do not continuously shadow the player.
- Ground-enemy aggro radii are 210 units for basic enemies and 240 for brutes. Ground pursuit requires the player and enemy to stand on the same platform.
- Drones use a 340-unit detection radius and pursue the player's position in both axes. They may hover near their spawn height only while inactive.
- Drones use axis-separated collision against all solid platform blocks. Flying movement never permits them to pass through floors, ceilings, or walls.
- Ground enemies must probe for supporting floor before moving. They stop at platform and spike-gap edges.
- Enemy types should continue to vary in size, silhouette, health, speed, and movement style.

## Architecture

- `src/game.js`: deterministic game state and simulation
- `src/level.js`: level geometry, recesses, traps, spawn, and enemy placement
- `src/geometry.js`: shared collision and surface queries
- `src/combat.js`: combat geometry, costs, caps, and reward values
- `src/input.js`: keyboard mapping and event binding
- `src/renderer.js`: all canvas drawing and procedural leg presentation
- `src/main.js`: small application bootstrap and frame loop
- `test/`: fast headless simulation tests
- `SPEC.md`: product and behavior specification

Do not move rendering concerns into the game-state engine. Keep level coordinates out of the renderer. Add or update automated tests whenever gameplay rules change.

## World structure

- Do not describe content as numbered sectors, stages, or levels.
- Do not add linear completion screens or traversal-percentage HUD elements.
- Do not render area-name text, directional captions, or text-box-like room labels directly into the world.
- Favor loops, alternate entrances, optional rooms, hidden caches, and ability-gated shortcuts as the map grows.
- Never add a glowing finish gate or other terminal marker at a map boundary.
- `FOUNDATION_BLOCKS` form the tested basic-jump lower network. Upward transitions may rise by at most 70 units and gaps may be no wider than 160 units.
- `OVERHEAD_BLOCKS` and the first eight `RECESSES` form real hollow rooms: every recess must remain bounded by a spanning solid ceiling and foundation floor.
- `POCKET_BLOCKS` frame two smaller playable alcoves at the extreme ends of the world, where their back walls cannot seal a through-route.
- Normal collision geometry may never be thinner than 60 units. Favor blocks hundreds of units wide and 90+ units thick; a run of narrow ledges is a level-design regression.
- No two entries in `PLATFORMS` may geometrically overlap. Touching faces are allowed; intersecting rectangles, buried surfaces, and objects spawned inside solids are forbidden.
- Every `INTERIOR_BLOCKS` obstacle is exactly 70 units high, sits flush on one foundation, and leaves at least 80 units of exposed recovery floor on both sides and between neighbors. Preserve these invariants to prevent one-way drops and softlocks.
- `ABILITY_GATED_BLOCKS` contains exactly three small optional double-jump caches. Upgrade-gated geometry must never interrupt the main route or claim a large share of playable space.
- `BRANCH_BLOCKS` contains normal-jump vertical loops across at least six chambers. Each branch must rise in steps of at most 70 units, sit over a safe foundation, and reconnect through a survivable drop.
- `RECESSES` contain no `label` field.

## Boss arena

- `BOSS_ARENA` is the open chamber on the sixth foundation. Keep its full 1,300-unit width clear of ordinary interior blocks, enemies, conduits, and junk.
- Crossing `triggerX` activates the encounter. Both animated gates descend from the ceiling, become solid player colliders, and remain closed while the boss lives.
- The boss has 18 health and cycles deterministically through three moves: telegraphed horizontal charge, aerial slam with a ground shockwave, and a three-projectile volley.
- Killing the boss awards 150 scrap, deletes its active hazards, marks the arena cleared, and retracts both gates. The boss never respawns during that run.

## Rest and recovery

- `REST_AREA` occupies the foundation immediately after the boss arena. Keep its floor clear of ordinary enemies, conduits, junk, and interior obstacles.
- The recovery station remains offline until `bossArena.cleared` is true.
- Pressing `O` within the configured interaction radius restores the player to three lives, clears knockback/invulnerability motion, plays the recovery effect, and records the station-side checkpoint.
- Resting does not refill electricity or unlock abilities.

## GitHub workflow

- After completing and verifying any code, content, test, specification, or documentation change, commit it and push the current branch to `origin` before the final response.
- Never leave a completed requested change only in the local worktree. Confirm the pushed commit and clean tracking status after every iteration.
- Do not overwrite unrelated remote work or force-push unless the user explicitly authorizes it.

## Commands

```bash
npm start
npm test
npm run check
```

The development server runs at `http://127.0.0.1:4173`. Before handing off visual changes, run `npm run check` and inspect the game in a browser at both the start screen and during live play.

Use `http://127.0.0.1:4173/?debug=boss` for visual boss-arena QA. This query only changes the initial preview spawn; it must never affect the default URL or ordinary progression.

Use `http://127.0.0.1:4173/?debug=rest` for visual recovery-area QA. It previews the post-boss cleared state without changing default progression.
