# Bot Conquest — Agent Guide

## Current focus

We are building the first large playable fragment of a 2D platforming/fighting game. The current fragment spans nine connected regions and remains part of one interconnected, explorable map—not a sequence of linear sectors or Mario-style stages. Future growth should support branching paths, backtracking, optional discoveries, and small secrets. Preserve the industrial sci-fi direction and keep gameplay readable.

The July 2026 map is a clean replacement for the discarded access-path layout. Do not reuse the old thin staircase, named bays, location captions, or route/side-platform data model. The current spatial language is enormous foundations, heavy ceilings, thick interior forms, open chambers framed by collision geometry, and ability-gated upper masses.

## Current player specification

- The player is a small mechanical bot whose body is wider than it is tall.
- It has three red eyes and three procedural legs. The three feet use a 44-unit lateral spread and may reach 112 units so the rig remains clearly visible around the body. The center foot receives a directional bias instead of hiding directly beneath the bot.
- Each leg is drawn only when it can connect a body anchor to a real, reachable platform surface. Never synthesize a fallback foot point in empty air. Foot placement varies so the legs do not remain directly under the body.
- Aim is cardinal. `A`/`D` aim left/right while moving, `W` aims up while jumping, and `S` aims down. The last aim direction persists.
- `Space` performs an instantaneous 105-unit directional slash locked to the current aim. Damage resolves across the full area on the press frame only. Its visual is a brief, static white forward slash—no extension, retraction, arrow, pointer, or circular arc.
- New runs start with the basic jump, slash, and repair. `E` spends 30 electricity and starts a 0.7-second repair channel; the missing shell returns only when it completes. Damage interrupts the channel without refunding electricity, and repair cannot begin during post-hit invulnerability.
- Double jump, dash, wall movement, electric field, and electric jab remain implemented but locked for pickups. Use `game.unlockAbility(name)` when progression grants one.
- The blue `volt-core` in the Sunken Vault unlocks electric jab and opens a large temporary tutorial popup showing `F`. It remains unavailable inside the Abyss Warden arena until that full boss is dead. The nearby tutorial conduit contains exactly the 24 electricity required for one jab, and the following `vault-volt-seal` requires that attack.
- The white post-boss `vault-core` appears only after the Heavy Core is cleared; touching it unlocks `wallClimb`. Hold `W` against a wall to climb continuously. Press `D` away from a left wall or `A` away from a right wall to jump off at the bot's current height. Never teleport the bot to a wall top.
- Once unlocked, `Q` creates the circular field, `F` uses electric jab, and `Shift` dashes.
- There is no restart key, persistent restart control, or game-over reboot. Losing the final shell rebuilds the bot at its last activated save point, or at the initial spawn if no station has been activated.
- A destroyed bot loses all carried scrap and electricity. Its old shell remains at the death location as a three-health wreck containing the lost scrap; destroying the wreck restores that scrap but no electricity. A newer death replaces any unrecovered wreck.
- After the boss is cleared, `O` interacts with the recovery station. Resting restores all three shells and moves both the spike-reset checkpoint and full-death respawn point beside the station.
- `I` is reserved for the future combined inventory/map interface. It must remain unbound and have no behavior until that system is designed.
- The player starts with three lives and loses one to enemy contact, spikes, or falling.
- Touching a spike immediately removes one life and returns the bot to its last safe position on the most recently supported platform. It must not continue falling through the spike pit or return all the way to the initial spawn.

## Resources and combat economy

- A standard enemy hit generates 12 electricity, capped at 100.
- Only three conduits exist. Each holds 24 total electricity, yields 4 per primary hit, visibly drains, and generates nothing once empty.
- The Sunken Vault tutorial conduit must remain between the Volt Jab pickup and its powered seal. Electric jab costs 24 electricity so one fresh conduit always funds the required tutorial shot.
- Special-attack hits return 4 electricity per target.
- Killing enemies awards scrap based on archetype. The one currently authorized sink is the Grand Exchange `EDGE FORGE`: 100 scrap buys one run-persistent `+1` primary-slash damage upgrade. Do not add other spending behavior without a new design decision.
- Ordinary junk piles are solid destructible obstacles. Destroying one awards its configured scrap value but no electricity.

## Enemy rules

- Selected crawlers and rollers passively patrol within explicit leash ranges. They reverse at leash boundaries and unsupported edges.
- Oblong rollers use acceleration and momentum; they do not snap directly to chase speed like crawlers.
- Square brutes stand still during a visible 0.38-second windup, then commit to a locked-direction 190-unit-per-second charge. They do not continuously shadow the player.
- Ground-enemy aggro radii are 210 units for basic enemies and 240 for brutes. Ground pursuit requires the player and enemy to stand on the same platform.
- Drones use a 340-unit detection radius and pursue the player's position in both axes. They may hover near their spawn height only while inactive.
- Drones use axis-separated collision against all solid platform blocks. Flying movement never permits them to pass through floors, ceilings, or walls.
- Ground enemies must probe for supporting floor before moving. They stop at platform and spike-gap edges.
- Hoppers commit to a high leap toward the player, then remain grounded for 0.7 seconds after landing so the player has a reliable attack window.
- The Abyss Warden is a twelve-health full boss protecting Volt Jab. Its full-height right exit seal exists before activation, so the reward can never be reached backward from the escape route. Dropping into the chamber activates a second entry seal. It cycles through a telegraphed charge, a leaping shockwave, and a five-bolt volley.
- The Cache Scrapper is an optional six-health mini boss in Quiet Drift. It protects only an 80-scrap upper cache route and never grants an ability.
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

- The current world spans X `0–14500` and Y `-1000–1200`. `REGIONS` contains nine contiguous regions connected by eight non-blocking `REGION_GATES`.
- Do not describe content as numbered sectors, stages, or levels.
- Do not add linear completion screens or traversal-percentage HUD elements.
- Do not render area-name text, directional captions, or text-box-like room labels directly into the world.
- Region names are the sole exception: crossing a `REGION_GATES` threshold shows the destination name temporarily in the bottom-left HUD. Never leave region-name text permanently in the world.
- Favor loops, alternate entrances, optional rooms, hidden caches, and ability-gated shortcuts as the map grows.
- Never add a glowing finish gate or other terminal marker at a map boundary.
- `FOUNDATION_BLOCKS` form the tested basic-jump lower network. Upward transitions may rise by at most 70 units and gaps may be no wider than 160 units. Simulation tests must physically cross every gap in both directions.
- The five `vault-*` foundations descend from Y 680 to Y 820 and rise again in 70-unit increments. The optional branch continues down to the Abyss Warden floor at Y 1120. Every pre-arena drop must remain reversible with the basic jump; only the clearly framed boss drop is one-way.
- `OVERHEAD_BLOCKS` and the first eight `RECESSES` form the original hollow rooms. The map now extends through Shard Gauntlet, Quiet Drift, and Grand Exchange chambers to X 14500.
- `POCKET_BLOCKS` form the two end-alcove ceilings. `WALL_BLOCKS` also includes the relay-crown climbing wall, the destructible Heavy Core roof bulkheads, and the left wall of the Abyss Warden room.
- Suspended platforms are normally 40–60 units thick to preserve air and visibility. The two deep Vault floor masses may be 80 units thick. Foundations stay 120+ units thick except the five 60-unit Sunken Vault foundations, which preserve traversal clearance; ceilings remain massive structural forms.
- No two entries in `PLATFORMS` may geometrically overlap. Touching faces are allowed; intersecting rectangles, buried surfaces, and objects spawned inside solids are forbidden.
- Every `INTERIOR_BLOCKS` obstacle is exactly 70 units high, sits flush on one foundation, and leaves at least 80 units of exposed recovery floor on both sides and between neighbors. Preserve these invariants to prevent one-way drops and softlocks.
- `ABILITY_GATED_BLOCKS` contains twelve surfaces across three substantial optional regions: upper assembly (`doubleJump`), high foundry (`dash`), and relay crown (`wallClimb`). Their entrances must remain impossible with the starting jump while never interrupting the boss route.
- `BRANCH_BLOCKS` contains thirty-three starting-kit exploration platforms across at least nine chambers. They vary substantially in width and thickness and form broad leaps, return drops, combat perches, and cross-room choices—not staircases, serpentine chains, or isolated vertical ladders.
- Every normal walkable surface must retain an exposed standing span at least 80 units wide. Simulation tests must physically traverse every intended connection and its safe return path.
- Place ordinary encounters on upper platforms, lower platforms, and gated regions so exploration space is gameplay space rather than empty decoration.
- `REGIONS` must cover the full world without gaps. `REGION_GATES` connects each neighboring pair as a visible, non-blocking threshold.
- Shard Gauntlet is the trap-focused region from X 9600–11400. Preserve at least three distinct spike gaps, its red hazard atmosphere, and a tested basic-jump foundation route.
- Quiet Drift is the conventional exploration region from X 11400–12700. Its lower foundation route must stay open regardless of the optional Cache Scrapper encounter above it.
- Grand Exchange is the expansive region from X 12700–14500. Preserve broad floor space, multiple height layers, the far-corner Edge Forge door, and an enemy-free interaction pocket around that door.
- `MERCHANT_SPAWNS` defines overworld doors, not exposed NPCs. Three cluster in the Relay Concourse and scattered doors appear elsewhere, including the Grand Exchange damage forge.
- Each door is either already in an enemy-free pocket or stays sealed until every ordinary enemy within its `clearRadius` is dead. Pressing `O` beneath an unlocked door teleports into the isolated `MERCHANT_ROOM`; its exit returns to the saved overworld position. Only the merchant inside shows the explicit services-offline notice until trading is designed.
- A merchant with `service: 'damageUpgrade'` is interactive inside the room. It charges its configured 100 scrap once, increments `player.primaryDamage`, and then reports the edge coil as installed.
- `PICKUP_SPAWNS` is the shared data format for future ability, combat, and shell pickups. It owns pickup color, name, input hint, tutorial copy, and progression requirements rather than placing those decisions in renderer conditionals.
- Ordinary junk must leave at least one bot-width bypass on its supporting platform. Only the explicitly ability-gated junk wall may seal an optional pocket.
- True vertical walls use `kind: 'wall'` and the dedicated red-braced wall rendering. Do not render walls with the green top-edge treatment used by floors.
- `RECESSES` contain no `label` field.

## Heavy Core arena

- `BOSS_ARENA` is the open chamber on the `boss-floor` foundation mass. Keep its full 1,300-unit width clear of ordinary interior blocks, enemies, conduits, and junk.
- Crossing `triggerX` activates the encounter. Both animated gates descend from the ceiling, become solid player colliders, and remain closed while the boss lives.
- The arena trigger requires the player to be vertically inside the chamber. The two full-height `boss-roof-*` bulkheads seal both ends of the arena ceiling so the player cannot bypass the fight or become trapped above a closed gate. Both bulkheads are removed from live collision and burst apart when the Heavy Core dies.
- The boss has 18 health and cycles deterministically through three moves: telegraphed horizontal charge, aerial slam with a ground shockwave, and a three-projectile volley.
- Killing the boss awards 150 scrap, deletes its active hazards, marks the arena cleared, and retracts both gates. The boss never respawns during that run.

## Abyss Warden arena

- `VAULT_BOSS_ARENA` is a full boss encounter, not an entry in `MINI_BOSS_ARENAS`. The Abyss Warden has 12 health and awards 110 scrap.
- Its right exit seal exists whenever the arena is uncleared, including before activation. It spans Y 700–1120, reaches the floor, and must block approach from every escape platform. Never shorten it to a jumpable gate.
- Dropping into the trigger volume activates the Warden and closes the animated left entry seal. The dormant Warden is not targetable from the approach.
- The Warden deterministically cycles through horizontal charge, leaping shockwave, and five-projectile volley attacks. It uses the full-size cyan boss health bar.
- `volt-core` remains unavailable and inside the sealed chamber until `vaultBossArena.cleared` is true. Killing the Warden removes both seals and active hazards, then releases the pickup.
- The tutorial conduit and `vault-volt-seal` remain outside the opened boss exit. The powered seal must touch—but never geometrically overlap—the right boss gate.

## Mini-boss arenas

- `MINI_BOSS_ARENAS` is the reusable data format for optional contained elite fights. The current entry is `drift-scrapper` in Quiet Drift.
- Entering a configured trigger volume activates the encounter and closes its exit gate. The entrance may be a deliberate one-way drop only when the exit is tested and guaranteed after victory.
- A mini boss is not targetable before its arena activates; attacks from approach platforms must never pre-clear the encounter.
- Killing the configured mini boss awards its arena's scrap reward, shows a temporary reward notice, marks the arena cleared, and retracts its gate permanently for that run.
- Mini-boss arenas use a smaller health bar and one focused combat pattern. They must not duplicate the full Heavy Core presentation or attack cycle.
- Mini bosses may guard optional scrap, benches, caches, or shortcuts. They must never guard a required movement/combat ability or block the region's required foundation route.

## Rest and recovery

- `REST_AREA` occupies the foundation immediately after the boss arena. Keep its floor clear of ordinary enemies, conduits, junk, and interior obstacles.
- The recovery station remains offline until `bossArena.cleared` is true.
- Pressing `O` within the configured interaction radius restores the player to three lives, clears knockback/invulnerability motion, plays the recovery effect, and records the station-side spike and full-death checkpoints.
- Resting does not refill electricity or unlock abilities.
- The post-boss wall-climb pickup may occupy the entrance side of this region. Merchant doors remain beyond the configured `REST_AREA` boundary so the immediate recovery pocket stays calm.

## Planned shell bodies

- Shell swapping is a later system and is not implemented yet. Preserve room in player state and pickup design for visually distinct bodies.
- The current design candidates are a tall/light shell with a jump bonus, a large/heavy shell with extra maximum health and slower movement, and a reach shell with an extended primary slash.
- Each shell must change the rendered silhouette as well as gameplay statistics. Do not ship stat-only recolors.
- Shell bonuses, drawbacks, acquisition, and swapping rules require a separate design pass before implementation.

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

Use `http://127.0.0.1:4173/?debug=explore` for visual QA of the assembly platform network and ability-gated upper space.

Use `http://127.0.0.1:4173/?debug=lower` for visual QA of the vault undercroft.

Use `http://127.0.0.1:4173/?debug=vault-boss` for the active Abyss Warden room, `http://127.0.0.1:4173/?debug=mini` for the optional Quiet Drift Cache Scrapper, and `http://127.0.0.1:4173/?debug=volt` for the post-Warden Volt Jab tutorial.

Use `http://127.0.0.1:4173/?debug=merchant` to verify an unlocked merchant door and its separate interior.

Use `http://127.0.0.1:4173/?debug=merchant-room` to inspect the merchant interior directly.

Use `http://127.0.0.1:4173/?debug=wall` to verify continuous wall climbing and jumps away from either wall side.

Use `http://127.0.0.1:4173/?debug=gauntlet` for the trap-heavy Shard Gauntlet and `http://127.0.0.1:4173/?debug=exchange` for the Grand Exchange damage forge.

Use `http://127.0.0.1:4173/?debug=forge-room` for the Edge Forge purchase prompt and `http://127.0.0.1:4173/?debug=postboss` to inspect the opened roof after the Heavy Core bulkheads are destroyed.

Use `http://127.0.0.1:4173/?debug=recovery` to inspect a rebuilt bot and its nearby scrap-bearing wreckage.
