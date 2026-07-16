# Bot Conquest — Agent Guide

## Current focus

We are building the first large playable fragment of a 2D platforming/fighting game. The current fragment spans eight connected regions and remains part of one interconnected, explorable map—not a sequence of linear sectors or Mario-style stages. Future growth should support branching paths, backtracking, optional discoveries, and small secrets. Preserve the industrial sci-fi direction and keep gameplay readable.

The July 2026 map is a clean replacement for the discarded access-path layout. Do not reuse the old thin staircase, named bays, location captions, or route/side-platform data model. The current spatial language is enormous foundations, heavy ceilings, thick interior forms, open chambers framed by collision geometry, and ability-gated upper masses.

## Current player specification

- The player is a small mechanical bot whose body is wider than it is tall.
- It has three red eyes and three procedural legs. The three feet use a 44-unit lateral spread and may reach 112 units so the rig remains clearly visible around the body. The center foot receives a directional bias instead of hiding directly beneath the bot.
- Each leg is drawn only when it can connect a body anchor to a real, reachable platform surface. Never synthesize a fallback foot point in empty air. Foot placement varies so the legs do not remain directly under the body.
- Aim is cardinal. `A`/`D` aim left/right while moving, `W` aims up while jumping, and `S` aims down. The last aim direction persists.
- `Space` performs an instantaneous 105-unit directional slash locked to the current aim. Damage resolves across the full area on the press frame only. Its visual is a brief, static white forward slash—no extension, retraction, arrow, pointer, or circular arc.
- New runs start with the basic jump, slash, and repair. `E` spends 30 electricity and starts a 0.7-second repair channel; the missing shell returns only when it completes. Damage interrupts the channel without refunding electricity, and repair cannot begin during post-hit invulnerability.
- The basic jump can begin only while supported on the ground. Walking or running off a platform consumes that grounded jump immediately. Once double jump is unlocked, leaving a platform without jumping preserves exactly one airborne jump.
- Double jump, dash, wall movement, electric field, and electric jab remain implemented but locked for pickups. Dash is now granted by the deep-Vault `dash-core`; use `game.unlockAbility(name)` when progression grants one.
- The cyan `field-core` appears only after the Crown Dynamo is defeated. It unlocks the circular Field attack, raises electricity to at least the 40 required for one use, and teaches `Q` beside the Field-only Crownworks annex seal.
- The blue `volt-core` in the Sunken Vault unlocks electric jab and opens a large temporary tutorial popup showing `F`. It remains unavailable inside the Abyss Warden arena until that full boss is dead. The nearby tutorial conduit contains exactly the 24 electricity required for one jab, and the following `vault-volt-seal` requires that attack.
- The white post-boss `vault-core` appears only after the Heavy Core is cleared; touching it unlocks `wallClimb`. Hold `W` against a wall to climb continuously. Press `D` away from a left wall or `A` away from a right wall to jump off at the bot's current height. Never teleport the bot to a wall top.
- Once unlocked, `Q` creates the circular field, `F` uses electric jab, and `Shift` dashes.
- There is no restart key, persistent restart control, or game-over reboot. Losing the final shell rebuilds the bot at its last activated save point, or at the initial spawn if no station has been activated.
- A destroyed bot loses all carried scrap and electricity. Its old shell remains at the death location as a three-health wreck containing the lost scrap; destroying the wreck restores that scrap but no electricity. A newer death replaces any unrecovered wreck.
- After the boss is cleared, `O` interacts with the recovery station. Resting restores the bot to its current maximum shells and moves both the spike-reset checkpoint and full-death respawn point beside the station. Once more than one shell is owned, resting also opens the simulation-pausing shell selector; arrow keys choose a shell, `O` equips it, and `I` keeps the current shell.
- `I` opens and closes the combined inventory/map overlay and pauses simulation while open. Outside the map overview, `A`/`D` move between MAP, STATUS, MATERIALS, and ITEMS and `W`/`S` move through entries. MAP sits immediately left of STATUS.
- Local maps must use one uniform world-to-map scale for X and Y. Center the resulting true-scale region diagram inside the panel; never stretch its horizontal and vertical axes independently to fill the available rectangle.
- MAP opens on the player's current region. An unrevealed region displays `NO MAP`; the three survey cores reveal configured groups. `Q` zooms out to the eight-region overview, `W`/`A`/`S`/`D` select another region without changing pages, and `Q` zooms into that selected local map.
- STATUS shows current/maximum shells, current/maximum electricity, Fusion Cutter damage and range, and scrap. MATERIALS shows only titanium and uranium. ITEMS lists merchant purchases beside a diagram of the current shell and its actual mounts. `W`/`S` select an item and reveal its icon and tooltip. The standard shell shows `shell`, `core`, `legs`, and `weapon`; the Slicer shows `core`, `legs`, `weapon`, and `extended-weapon` with no shell mount. Every shell starts with its single internal bay unlocked and also shows two auxiliary expansion positions, marking only unpurchased auxiliary bays `LOCKED`. Pressing `Q` on a modifier or relic enters placement mode; all arrow keys move through compatible mounts and storage, and pressing `Q` again installs it in the highlighted target.
- The player starts with three lives and loses one to enemy contact, spikes, or falling.
- Touching a spike immediately removes one life and returns the bot to its last safe position on the most recently supported platform. It must not continue falling through the spike pit or return all the way to the initial spawn.

## Resources and combat economy

- A standard enemy hit generates 12 electricity, capped at the player's current capacity. The standard body starts at 100 capacity; capacitor upgrades and equipped modifiers may raise it.
- Only three conduits exist. Each holds 24 total electricity, yields 4 per primary hit, visibly drains, and generates nothing once empty.
- The Sunken Vault tutorial conduit must remain between the Volt Jab pickup and its powered seal. Electric jab costs 24 electricity so one fresh conduit always funds the required tutorial shot.
- Special-attack hits return 4 electricity per target.
- The starting primary slash deals 3 damage. Crawlers and rollers have 6 health, hoppers and drones have 9, and brutes have 12, so ordinary enemies take two or three hits while the large brute takes four. Each forge tier still adds exactly 1 damage so upgrades remain incremental.
- Killing enemies awards scrap based on archetype. The Grand Exchange `EDGE FORGE` offers four run-persistent `+1` primary-slash damage upgrades costing 500, 900, 1500, and 2400 scrap. Mk 2 also costs one titanium, Mk 3 costs two titanium and one uranium, and Mk 4 costs three titanium and two uranium. Other authorized scrap sinks are the three-tier shell reinforcement, capacitor, and internal-bay services, the three configured body modifiers, and the eight configured relics; do not invent additional sinks without a new design decision.
- Titanium and uranium are persistent special materials. Exactly two ordinary single-material salvage piles remain on ability-gated upper routes. The Cache Scrapper awards three titanium, and the Shard Gauntlet summit cache awards 450 scrap, three titanium, and two uranium. Preserve this finite early-game supply unless a later recipe pass deliberately adds more.
- Ordinary junk piles are solid destructible obstacles. Destroying one awards its configured scrap or special material but no electricity.

## Enemy rules

- Selected crawlers and rollers passively patrol within explicit leash ranges. They reverse at leash boundaries and unsupported edges.
- Oblong rollers use acceleration and momentum; they do not snap directly to chase speed like crawlers.
- Square brutes stand still during a visible 0.38-second windup, then commit to a locked-direction 190-unit-per-second charge. They do not continuously shadow the player.
- Ground-enemy aggro radii are 210 units for basic enemies and 240 for brutes. Ground pursuit requires the player and enemy to stand on the same platform.
- Drones use a 340-unit detection radius and pursue the player's position in both axes. They may hover near their spawn height only while inactive.
- Drones use axis-separated collision against all solid platform blocks. Flying movement never permits them to pass through floors, ceilings, or walls.
- Ground enemies must probe for supporting floor before moving. They stop at platform and spike-gap edges.
- Hoppers commit to a high leap toward the player, then remain grounded for 0.7 seconds after landing so the player has a reliable attack window.
- The Abyss Warden is a sixty-health full boss protecting Volt Jab. Its full-height right exit seal exists before activation, so the reward can never be reached backward from the escape route. Dropping into the chamber activates a second entry seal. It randomly chooses a telegraphed charge, a leaping shockwave, or a three-bolt volley without immediate repeats. Below half health it accelerates, fires four-bolt volleys, and adds a six-bolt radial crossfire.
- The Cache Scrapper is an optional thirty-health mini boss in Quiet Drift. It awards three titanium, remains outside the required foundation route, never grants an ability, and enters a faster, longer-charge phase below half health.
- The Rift Stalker is a ninety-six-health full boss at the bottom of the extended Sunken Vault. It protects Dash and randomly chooses a cross-room dash, a teleporting overhead drop, or one fast, briefly tracking projectile without immediate repeats. The green projectile disappears without exploding on impact. Below half health it moves faster, fires paired tracking bolts, and adds a six-bolt non-tracking rift burst.
- The Crown Dynamo is a seventy-two-health full boss in upper Crownworks. It relocates between two lowered high anchors, and every active state is damageable; its changing white, yellow, and cyan colors communicate hover and attack timing only, never vulnerability. The player must still use the chamber's climbable perches to reach it. It protects Field and randomly chooses a floor sweep, targeted column, or four-bolt volley without immediate repeats. The floor sweep has a full-width dashed-line telegraph matching the column warning. Below half health it adds combined hazards, six-bolt volleys, and a two-column grid attack.
- Every boss and mini boss enters phase two exactly once at half health. The transition never grants invulnerability, emits particles, or resets, extends, or pauses the current attack timer; the boss remains damageable while continuing its current movement and attack. Every full boss adds a fourth attack to its seeded-random overdrive pool.
- Activating a save station or losing the final shell reconstructs every ordinary enemy from `ENEMY_SPAWNS`. Defeated full bosses and mini bosses remain defeated for the run.
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

- The current world spans X `0–14500` and Y `-1900–2700`. `REGIONS` contains eight contiguous regions connected by seven non-blocking `REGION_GATES`. Core Bastion spans X `5890–8400` and includes the former Relay Concourse space as one map region.
- Do not describe content as numbered sectors, stages, or levels.
- Do not add linear completion screens or traversal-percentage HUD elements.
- Do not render area-name text, directional captions, or text-box-like room labels directly into the world.
- Region names are the sole exception: crossing a `REGION_GATES` threshold shows the destination name temporarily in the bottom-left HUD. Never leave region-name text permanently in the world.
- Favor loops, alternate entrances, optional rooms, hidden caches, and ability-gated shortcuts as the map grows.
- Never add a glowing finish gate or other terminal marker at a map boundary.
- `FOUNDATION_BLOCKS` form the tested basic-jump lower network. Upward transitions may rise by at most 70 units and gaps may be no wider than 160 units. Simulation tests must physically cross every gap in both directions.
- The five `vault-*` foundations descend from Y 680 to Y 820 and rise again in 70-unit increments. The original branch continues down to the Abyss Warden floor at Y 1120. Every pre-Warden drop must remain reversible with the basic jump; only the clearly framed boss drop is one-way. Killing the Warden immediately opens the floor hatch into a safe entry landing; three broad basic-jump steps on its right return to `under-threshold`, while Wall Climb remains mandatory beyond that landing on the route to Y 2550.
- `VAULT_UPPER_BLOCKS` forms a Wall-Climb-gated loft above the Sunken Vault. `VAULT_DEEP_BLOCKS` forms the contained post-Warden descent and Rift Stalker floor. `DEPTH_RETURN_BLOCKS` appear after the Rift Stalker dies; their Dash gaps and final two Wall-Climb ascents are physically tested all the way back to the Warden floor.
- `OVERHEAD_BLOCKS` and the first eight `RECESSES` form the original hollow rooms. Crownworks' split overhead mass leaves one contained Wall-Climb shaft into `CROWN_UPPER_BLOCKS`, a full upper chamber with heavy roof and side walls, broad floor masses, brace-supported perches, encounters, salvage, and a reversible return. The map also extends through Shard Gauntlet, Quiet Drift, and Grand Exchange chambers to X 14500.
- `FIELD_ANNEX_BLOCKS` forms the broad two-chamber route west of the Crown Dynamo arena. It appears as solid world geometry from the start but is accessible only after Field destroys `crown-field-seal`; preserve its roughly 2,550-unit span, two height layers, ordinary encounters, platform spikes, salvage, and reversible return. Its western hall occupies the high volume above the Heavy Core arena. `POST_BOSS_CROWN_CONNECTORS` replaces the destroyed east roof bulkhead with a 160-unit floor-and-roof link; it must never exist before that bulkhead is removed. The lower corridor must stay open beneath hanging red braces all the way through the linked halls. Only `crown-volt-shell-seal` may block the Slicer pocket.
- `DASH_POCKET_BLOCKS` adds optional backtracking clusters in Rusted Verge, Ember Foundry, Shard Gauntlet, and Grand Exchange. Their entry spans must require Dash, lead to safe standing space and salvage, and never alter the basic-jump foundation route.
- `REGION_EXPANSION_BLOCKS` contains fifty-five additional exploration surfaces distributed across all eight named regions, with at least six in each. Preserve the Verge substation, Vault flood shelves and side lofts, Foundry cooling and crane routes, post-boss Bastion maintenance tower, Crownworks lower galleries and upper shaft, Gauntlet service perches, Quiet Drift ceiling galleries, and Grand Exchange archives. These routes carry ordinary encounters, platform traps, and one configured scrap cache per region while keeping the tested lower progression spine open.
- `POCKET_BLOCKS` form the two end-alcove ceilings. `WALL_BLOCKS` also includes the short Crownworks climbing wall, the destructible Heavy Core roof bulkheads, and the left wall of the Abyss Warden room. The Crownworks entry wall must never become a floor-to-ceiling barrier; its right side launches onto `wall-entry` after Wall Climb is unlocked.
- Suspended platforms are normally 40–60 units thick to preserve air and visibility. The two deep Vault floor masses may be 80 units thick. Foundations stay 120+ units thick except the five 60-unit Sunken Vault foundations, which preserve traversal clearance; ceilings remain massive structural forms.
- No two entries in `PLATFORMS` may geometrically overlap. Touching faces are allowed; intersecting rectangles, buried surfaces, and objects spawned inside solids are forbidden.
- Every `INTERIOR_BLOCKS` obstacle is exactly 70 units high, sits flush on one foundation, and leaves at least 80 units of exposed recovery floor on both sides and between neighbors. Preserve these invariants to prevent one-way drops and softlocks.
- `ABILITY_GATED_BLOCKS` contains twelve surfaces across three substantial optional regions: upper assembly (`doubleJump`), high foundry (`dash`), and Crownworks (`wallClimb`). Their entrances must remain impossible with the starting jump while never interrupting the boss route.
- Killing the Abyss Warden immediately removes `under-cache` and installs `DEPTH_ACCESS_BLOCKS`; this never waits for Volt Jab, Wall Climb, a player position, or another update frame. The former `vault-high` hiding shelf is absent so the hatch remains visually exposed. The open shaft drops safely onto `vault-deep-drop-one`, and three broad right-side steps form a physically tested basic-jump return to `under-threshold`. Those steps must remain too far from the west gallery to bypass `vault-deep-climb-west`: Wall Climb is mandatory from the landing into the first gallery and again at the later 220-unit east wall. Structural roof and side walls must prevent outside entry and side-drop shortcuts.
- `BRANCH_BLOCKS` contains thirty-two starting-kit exploration platforms across at least nine chambers. They vary substantially in width and thickness and form broad leaps, return drops, combat perches, and cross-room choices—not staircases, serpentine chains, or isolated vertical ladders.
- Every normal walkable surface must retain an exposed standing span at least 80 units wide. Simulation tests must physically traverse every intended connection and its safe return path.
- Place ordinary encounters on upper platforms, lower platforms, and gated regions so exploration space is gameplay space rather than empty decoration.
- `REGIONS` must cover the full world without gaps. `REGION_GATES` connects each neighboring pair as a visible, non-blocking threshold.
- Shard Gauntlet is the trap-focused region from X 9600–11400. Preserve its three lower spike gaps, at least three spike beds on upper platforms, two cycling electric barriers, one swinging chain ball, its red hazard atmosphere, and a tested basic-jump foundation route. Its summit cache awards the configured mixed scrap/material prize.
- Quiet Drift is the conventional exploration region from X 11400–12700. Its lower foundation route must stay open regardless of the optional Cache Scrapper encounter above it.
- Grand Exchange is the expansive region from X 12700–14500. Preserve broad floor space, multiple height layers, the far-corner Edge Forge door, and an enemy-free, spike-free interaction pocket with a physically traversable approach from `exchange-step-east` across `exchange-floor-market`.
- `MERCHANT_SPAWNS` defines overworld doors, not exposed NPCs. Major upgrade merchants are discoveries away from the post-boss recovery route: Parts Broker is in the Wall-Climb-gated Crownworks route, Capacitor Exchange is on the Shard Gauntlet overlook, and Shell Archive is on a high Grand Exchange route. Response Forge is hidden in Quiet Drift and Salvage Curator is on a Grand Exchange loft; both sell configured relic stock. Scattered doors remain elsewhere, including the Grand Exchange damage forge.
- Merchant door rectangles must never overlap any solid platform or wall; the full doorway and its standing pocket must remain exposed.
- Each door is either already in an enemy-free pocket or stays sealed until every ordinary enemy within its 210-unit circular `clearRadius` is dead. This check must use full two-dimensional distance from the door center; an enemy above, below, or elsewhere outside that small field must never lock the door. Pressing `O` beneath an unlocked door teleports into the isolated `MERCHANT_ROOM`; its exit returns to the saved overworld position. Merchants preview titanium and uranium, and the Edge Forge consumes the configured material recipes for its later tiers.
- Pressing `O` near an interior merchant opens the large, simulation-pausing catalog instead of buying immediately. The catalog lists every configured offer, full effect, cost, and ownership/availability state. `W`/`S` select, `O` buys the selected available offer, and `I` closes without opening the normal inventory.
- Merchant services are data-driven: `damageUpgrade` adds `+1` slash damage through four forge tiers; `healthUpgrade` adds one maximum shell through three tiers; `energyUpgrade` adds 25 maximum electricity through three tiers; `modifierShop` sells its configured reusable modifier stock; `bayUpgrade` adds two distinctly classified auxiliary bays and never sells or unlocks the starting internal bay; and `relicShop` sells its configured relic stock. Health, energy, and damage merchants append relic rows aligned with their specialties: survivability, charge economy, and cutter output. All purchases persist for the run and appear in ITEMS.
- `RELICS` contains exactly eight distinct passive items: Mender Loop, Impact Damper, Feedback Dynamo, Execution Coil, Arc Retort, Kinetic Memory, Salvage Lens, and Corpse Key. Relics have no dedicated slots. A purchased relic is inactive in storage, may occupy any normal mount exposed by the current shell, shares those mounts with modifiers, and retains the same effect in every valid mount. Relics may therefore use either cutter mount on the Slicer but never an expansion bay.
- `PICKUP_SPAWNS` is the shared data format for ability, map, and shell pickups and remains extensible to later combat pickups. It owns pickup color, name, input hint, tutorial copy, progression requirements, and map-region reveal data rather than placing those decisions in renderer conditionals.
- Ordinary junk must leave at least one bot-width bypass on its supporting platform. Only the explicitly ability-gated junk wall may seal an optional pocket.
- True vertical walls use `kind: 'wall'` and the dedicated red-braced wall rendering. Do not render walls with the green top-edge treatment used by floors.
- `RECESSES` contain no `label` field.

## Heavy Core arena

- `BOSS_ARENA` is the open chamber on the `boss-floor` foundation mass. Keep its full 1,300-unit width clear of ordinary interior blocks, enemies, conduits, and junk.
- Crossing `triggerX` activates the encounter. Both animated gates descend from the ceiling, become solid player colliders, and remain closed while the boss lives.
- The arena trigger requires the player to be vertically inside the chamber. The two full-height `boss-roof-*` bulkheads seal both ends of the arena ceiling so the player cannot bypass the fight or become trapped above a closed gate. Both bulkheads are removed from live collision and burst apart when the Heavy Core dies.
- The boss has 72 health and randomly chooses among a telegraphed horizontal charge, aerial slam with a ground shockwave, and two-projectile volley without immediate repeats. Below half health it enters phase two with faster recovery, a stronger charge and slam, a three-projectile volley, and a four-bolt radial burst.
- Killing the boss awards 150 scrap, deletes its active hazards, marks the arena cleared, and retracts both gates. The boss never respawns during that run.

## Abyss Warden arena

- `VAULT_BOSS_ARENA` is an 830-by-320-unit full boss chamber, not an entry in `MINI_BOSS_ARENAS`. Preserve its broad charge runway and vertical leap clearance. The Abyss Warden has 60 health and awards 110 scrap.
- Its right exit seal exists whenever the arena is uncleared, including before activation. It spans Y 700–1120, reaches the floor, and must block approach from every escape platform. Never shorten it to a jumpable gate.
- Dropping into the trigger volume activates the Warden and closes the animated left entry seal. The dormant Warden is not targetable from the approach.
- The Warden randomly chooses horizontal charge, leaping shockwave, and three-projectile volley attacks without immediate repeats. Overdrive expands the volley to four projectiles and adds a six-bolt radial crossfire. It uses the full-size cyan boss health bar.
- `volt-core` remains unavailable and inside the sealed chamber until `vaultBossArena.cleared` is true. Killing the Warden removes both seals and active hazards, releases the pickup, and opens the deep hatch on that same damage frame.
- The tutorial conduit and `vault-volt-seal` remain outside the opened boss exit. The powered seal must touch—but never geometrically overlap—the right boss gate.

## Rift Stalker arena

- `DEPTH_BOSS_ARENA` is the third deep-world full boss encounter. Its right exit gate exists whenever the arena is uncleared, and the dormant boss cannot be targeted before the player drops into the trigger volume.
- The route's hatch opens immediately when the Abyss Warden dies, before Volt Jab is collected and regardless of whether Wall Climb is owned. It replaces the intact Warden floor with two safe lips and a broad opening onto a safe first landing. Three starting-jump stair platforms on the landing's right side lead back to the Warden exit, but the route onward still alternates mandatory Wall Climbs and broad galleries before reaching the arena floor at Y 2550.
- The Rift Stalker has 96 health, awards 180 scrap, and randomly chooses a 520-unit-per-second cross-room dash, a relocation above the player with a distinct 0.5-second stationary hover before its ground slam, or a fast briefly tracking bolt without immediate repeats. The bolt disappears without exploding when it hits the player, a platform, or an arena gate. Phase two raises the dash to 680 units per second, shortens the hover, enlarges the slam, fires paired bolts, and adds a six-bolt non-tracking rift burst.
- Killing the Rift Stalker permanently opens its gate, releases `dash-core`, removes the temporary east containment wall, and adds `DEPTH_RETURN_BLOCKS`. The return route uses Dash spans followed by two climb walls with bot-width crest clearance, and must reconnect physically to `under-threshold` on the Warden floor.

## Crown Dynamo arena

- `CROWN_BOSS_ARENA` is the full boss encounter at the top of the Crownworks Wall-Climb route. Entering either floor side closes two horizontal gate pieces across the central shaft; the shaft must reopen after victory so the route remains reversible.
- The Crown Dynamo has 72 health, awards 140 scrap, and alternates between two high anchor positions. Once the arena activates, it remains targetable during relocation, hovering, windups, attacks, and recovery; its state colors never grant armor or invulnerability. It must remain unreachable by an upward starting slash from the floor, so the player still climbs to a matching perch to hit it. Below half health its hover and recovery windows shorten while its attacks intensify.
- It randomly chooses a cross-floor sweep, a targeted vertical column, or a four-bolt volley without immediate repeats. The sweep uses a full-width dashed horizontal telegraph and the column uses a dashed vertical telegraph. Overdrive adds a two-column grid attack. Killing it clears every active Crown hazard and releases `field-core`.
- Collecting `field-core` supplies at least 40 electricity. Only the circular Field attack may destroy `crown-field-seal`; primary attacks and Volt Jab must leave it intact.
- Beyond that breach, the lower west annex pocket is blocked by the two-health `crown-volt-shell-seal`. Only Volt Jab may damage it. Destroying it makes `slicer-shell` available in the contained reward pocket and opens the continuous floor route into the much larger western hall above the former Heavy Core chamber.

## Mini-boss arenas

- `MINI_BOSS_ARENAS` is the reusable data format for optional contained elite fights. The current entry is `drift-scrapper` in Quiet Drift.
- Entering a configured trigger volume activates the encounter and closes its exit gate. The entrance may be a deliberate one-way drop only when the exit is tested and guaranteed after victory.
- A mini boss is not targetable before its arena activates; attacks from approach platforms must never pre-clear the encounter.
- Killing the configured mini boss awards its configured scrap or material reward, shows a temporary reward notice, marks the arena cleared, and retracts its gate permanently for that run.
- Mini-boss arenas use a smaller health bar and one focused combat pattern. They must not duplicate the full Heavy Core presentation or attack cycle.
- Mini bosses may guard optional scrap, benches, caches, or shortcuts. They must never guard a required movement/combat ability or block the region's required foundation route.

## Rest and recovery

- `REST_AREA` occupies the foundation immediately after the boss arena. Keep its floor clear of ordinary enemies, conduits, junk, and interior obstacles.
- The recovery station remains offline until `bossArena.cleared` is true.
- Pressing `O` within the configured interaction radius restores the player to its current maximum lives, clears knockback/invulnerability motion, plays the recovery effect, and records the station-side spike and full-death checkpoints.
- If more than one shell is owned, the same interaction then opens the paused shell selector. Arrow keys choose an owned shell, `O` equips it at full current shell integrity, and `I` closes the selector without switching.
- Resting reconstructs all ordinary enemies while preserving defeated boss and mini-boss state.
- Resting does not refill electricity or unlock abilities.
- The post-boss wall-climb pickup may occupy the entrance side of this region. Merchant doors remain beyond the configured `REST_AREA` boundary so the immediate recovery pocket stays calm.

## Shell bodies

- The standard body starts with three maximum shells, 100 electricity capacity, 105 Fusion Cutter range, and four full-strength normal mounts: `shell`, `core`, `legs`, and `weapon` for the Fusion Cutter.
- The first alternate body is the forward-pointed droplet `slicer-body`, found behind `crown-volt-shell-seal`. Its silhouette has three red circular eyes. It starts with two maximum shells, 80 electricity capacity, and 135 Fusion Cutter range. Its normal mounts are `core`, `legs`, `weapon`, and a second cutter mount named `extended-weapon` / `EXTENDED FUSION CUTTER`; it has no shell mount.
- A modifier or relic can occupy only one mount at a time, and the two categories share normal-mount occupancy. ITEMS uses an explicit two-step `Q` flow: select an item, move an arrow-key highlight among only its compatible mounts and storage, then press `Q` again to place it. Moving an item onto an occupied mount displaces the previous item. Some modifiers deliberately have no weapon effect and must skip both cutter mounts.
- Each owned body stores its own complete modifier and relic placement. Switching shells saves the outgoing build and restores the incoming shell's previous build, so returning to a body never requires rebuilding it manually.
- Modifier effects depend on placement and must support distinct builds rather than linear better-stat copies. Aegis Filament provides the only modifier health bonus (`+1` shell), a small core bonus, leg speed, or a one-hit guard that exists only during an active repair channel. Reactive Governor changes post-hit invulnerability, damage-returned electricity, or temporary speed after damage. Extender Arm provides a small core bonus, leg speed, Fusion Cutter range, or reduced internal range.
- Every body starts with exactly one unlocked `internal` bay. `bayUpgrade` purchases add only two `auxiliary` bays to every owned body; no merchant may sell or unlock the internal bay. Auxiliary bays are never classified or presented as internal. All three expansion mounts use each modifier's explicitly configured reduced internal behavior; do not synthesize a generic mixed-stat profile. Internal or auxiliary Aegis absorbs one enemy hit without interrupting the current repair, then disappears when used, when the channel completes, or when it is cancelled. It never protects against spikes or falling and never remains active after repair. Relics cannot use expansion bays.
- Maximum-shell, electricity-capacity, movement-speed, Fusion Cutter range, shield, and reactive bonuses must be recomputed from the base body, permanent merchant tiers, and current placements. Modifier core-capacity bonuses must remain at or below 10. Repositioning a modifier may clamp current shells, electricity, or shield but never creates a free refill.
- Later design candidates remain a tall/light shell with a jump bonus and a large/heavy shell with extra maximum health and slower movement.
- Each shell must change the rendered silhouette as well as gameplay statistics. Do not ship stat-only recolors.

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

Use `http://127.0.0.1:4173/?debug=vault-upper` for the Wall-Climb loft, `http://127.0.0.1:4173/?debug=deep-vault` for the opened post-Warden hatch, `http://127.0.0.1:4173/?debug=deep-gallery` for both mandatory climb galleries, `http://127.0.0.1:4173/?debug=depth-boss` for the active Rift Stalker, and `http://127.0.0.1:4173/?debug=dash` for the released Dash core and return platforms.

Use `http://127.0.0.1:4173/?debug=crown-upper` to inspect the enclosed Crownworks upper chamber and its climbable salvage perches.

Use `http://127.0.0.1:4173/?debug=expansion-west`, `http://127.0.0.1:4173/?debug=bastion-tower`, `http://127.0.0.1:4173/?debug=expansion-crown`, and `http://127.0.0.1:4173/?debug=expansion-east` to inspect representative west, central, Crownworks, and east expansion routes.

Use `http://127.0.0.1:4173/?debug=crown-boss` for the active Crown Dynamo, `http://127.0.0.1:4173/?debug=field-annex` for its cleared Field-gated annex, `http://127.0.0.1:4173/?debug=slicer-gate` for the intact Volt-gated reward wall, `http://127.0.0.1:4173/?debug=slicer` for the equipped alternate shell, `http://127.0.0.1:4173/?debug=slicer&panel=items` for its mount diagram, `http://127.0.0.1:4173/?debug=shell-menu` for the rest selector, and `http://127.0.0.1:4173/?debug=dash-routes` for the distributed Dash backtracking pockets.

Use `http://127.0.0.1:4173/?debug=merchant` to verify an unlocked merchant door and its separate interior.

Use `http://127.0.0.1:4173/?debug=merchant-room` to inspect the full modifier catalog directly. Add `&panel=health`, `&panel=energy`, or `&panel=internal` to inspect the other merchant catalogs.

Use `http://127.0.0.1:4173/?debug=wall` to verify continuous wall climbing and jumps away from either wall side.

Use `http://127.0.0.1:4173/?debug=gauntlet` for the trap-heavy Shard Gauntlet and `http://127.0.0.1:4173/?debug=exchange` for the Grand Exchange damage forge.

Use `http://127.0.0.1:4173/?debug=gauntlet-top` for the upper spike beds, cycling barriers, swinging chain ball, and summit cache. Add `&phase=2` to any boss or mini-boss debug URL to inspect its second phase.

Use `http://127.0.0.1:4173/?debug=forge-room` for the full Edge Forge catalog and `http://127.0.0.1:4173/?debug=postboss` to inspect the opened roof after the Heavy Core bulkheads are destroyed.

Use `http://127.0.0.1:4173/?debug=recovery` to inspect a rebuilt bot and its nearby scrap-bearing wreckage.

Use `http://127.0.0.1:4173/?debug=inventory` to inspect STATUS; add `&panel=items`, `&panel=placement`, `&panel=materials`, `&panel=map`, `&panel=overview`, or `&panel=nomap` for the other inventory, modifier-placement, and map states.

Use `http://127.0.0.1:4173/?debug=verge-merchant` to inspect the cleared Verge Tinker doorway and its collision-free standing pocket.
