# Bot Conquest — Game Specification

## World vision

Bot Conquest takes place across one interconnected mechanical world. It is not divided into numbered sectors, discrete stages, or finish-line courses. Its spaces support exploration, backtracking, alternate routes, optional rooms, shortcuts, hidden caches, environmental storytelling, and small secrets.

The current replacement fragment spans 14,500 horizontal units and 2,200 vertical units. It is not the complete map and has no region-clear state, glowing finish gate, or traversal-percentage objective.

## Player

The player controls a compact spherical/oval mechanical bot. Its body collision box is 50 × 36 world units, making it visibly wider than tall. Three red optical sensors communicate facing direction.

Three mechanical legs connect body-mounted anchors to actual nearby platform surfaces. Their targets are spread laterally by 44 units with up to 112 units of reach so they remain visible around the body. The center foot receives a left/right bias instead of hiding directly beneath the bot. A foot remains latched during each step interval, then one leg at a time selects a slightly randomized reachable contact point. If no surface exists within leg range, that leg retracts and is not rendered.

### Abilities

| Action | Input | Required behavior |
| --- | --- | --- |
| Move / horizontal aim | `A`, `D` | Accelerate left/right and aim in that direction |
| Jump / aim up | `W` | Perform the starting basic jump and set upward aim |
| Double jump | `W` in air | Locked at the beginning; available after its future pickup |
| Wall movement | Hold/press `W` at wall | Locked at the beginning; available after its future pickup |
| Vault | Hold `W` while running into a low obstacle | Locked initially; after the post-boss pickup, hop onto obstacles up to 115 units high |
| Aim down | `S` | Set downward aim without moving |
| Dash | `Shift` | Locked at the beginning; short horizontal burst after unlock |
| Basic slash | `Space` | Instantly strike the full 105-unit area in the locked aim direction |
| Repair | `E` | Spend 30 electricity, then channel for 0.7 seconds to restore one missing shell; damage interrupts it and it cannot start during post-hit invulnerability |
| Electric field | `Q` | Locked initially; spend 40 electricity after unlock |
| Electric jab | `F` | Locked initially; spend 24 electricity after collecting the blue Volt Jab core |
| Interact | `O` | Rest at the recovery station or enter/leave an unlocked merchant room |
| Inventory / map | `I` | Reserved for a later system; deliberately does nothing now |

There is no restart key or persistent restart control. The game-over screen may offer a reboot after the player loses all three shells.

The basic slash supports left, right, up, and down. Its aim is captured when the attack begins. Pressing Space immediately evaluates the complete 105-unit directional hitbox once. Its only presentation is a 0.09-second straight white slash facing forward; it never extends, retracts, curves, or resembles a pointer.

### Ability pickups

Movement and combat upgrades use generic contact pickups. An available pickup is a small floating square with a bright ability-specific color, orbiting lines, motes, and a gentle bob. Moving the bot into it collects it immediately and permanently marks it collected for the run. Collection opens a large temporary integration popup showing the ability name, its input, and a short usage instruction.

The blue `volt-core` lies inside the sealed Abyss Warden reward chamber in the Sunken Vault. It is unavailable until the full boss dies, then unlocks Volt Jab and shows `F` in its integration popup. A 24-electricity conduit and a two-health powered seal follow on the escape route, teaching the player to harvest the conduit with basic slashes and spend one Volt Jab to continue.

The white `vault-core` just beyond the Heavy Core does not appear until that boss is defeated. Collecting it unlocks wall climb. Holding `W` against a wall climbs continuously; pressing `D` away from a left wall or `A` away from a right wall jumps from the current height. The ability never teleports the bot to the top. Future pickups use the same data and collection flow with their own progression requirements.

### Planned shell bodies

Shell swapping is planned but not implemented in this prototype. Shells will change both the bot silhouette and its statistics; they must not be simple recolors. Initial design directions are:

- A tall, light shell with a stronger jump.
- A large, heavy shell with substantially more maximum health but slower movement.
- A reach-focused shell with a longer primary slash.

Acquisition, inventory presentation, swapping locations, exact bonuses, and balance costs remain for a later design pass.

## Resource loop

Enemies award scrap when killed: crawler 6, roller 8, hopper 10, drone 12, and brute 25. The Grand Exchange Edge Forge is the first scrap sink: one purchase costs 100 scrap and increases primary-slash damage from 1 to 2 for the remainder of the run. It cannot be purchased twice.

The player has an electricity meter capped at 100. A standard slash against an enemy adds 12 electricity. Three conduits each contain 24 electricity, yield 4 per slash, and stay permanently empty after six successful harvests. A target hit by a special attack returns 4 electricity.

Ten ordinary junk piles have configured health and burst into scrap payouts when destroyed. Two powered seals have minimum damage 2 and require electric jab: the two-health Sunken Vault tutorial seal and a later armored cache wall. Hitting junk does not generate electricity.

The electric field lasts 0.9 seconds and uses a true 112-unit-radius circular collision test. The electric jab lasts 0.5 seconds, reaches 170 units in its locked direction, and deals two damage.

## Lives and failure

The player starts with three core shells. Enemy contact removes one shell and briefly grants invulnerability. Touching a spike immediately removes one shell and returns the player to the last safe position recorded on the most recently supported platform; the player never continues falling through the spike pit. Falling completely out of the world still returns to the initial spawn. Losing the third shell ends the run.

## Enemies

Selected crawlers and rollers patrol passively within configured leashes. Basic ground enemies detect at 210 units and brutes at 240 units. Distance alone is insufficient: both the player and ground enemy must stand on the same supporting platform before pursuit begins. Ground enemies probe for walkable support before every step.

Crawlers change direction immediately and pursue at a steady 75 units per second. Oblong rollers accelerate gradually toward a 150-unit-per-second chase speed, preserving momentum rather than copying crawler motion. Square brutes stop for a visible 0.38-second warning, lock a direction, and charge at 190 units per second for 0.42 seconds before cooling down. Hoppers remain the jumping archetype.

Drones detect at 340 units. When inactive they hover around their spawn height. Once active they steer toward the player's actual two-dimensional position at 105 units per second. Drone movement resolves horizontal and vertical collision against solid blocks, so drones cannot fly through floors, ceilings, or walls.

Current archetypes are crawler, roller, hopper, drone, and brute. The brute takes three basic-slash hits; basic enemies take one.

### Boss encounter

After traversing roughly two-thirds of the current route, the player enters a 1,300-unit-wide open arena. Crossing its inner trigger while physically inside the chamber drops a solid gate behind the player and another at the far exit. The gates finish closing in about 0.3 seconds and cannot be crossed while the boss remains alive. Full-height structural bulkheads seal both approaches to the arena roof, preventing roof bypasses and ensuring a gate can never lock the player outside the fight.

The Heavy Core boss has 18 health and three deterministic attacks:

- A telegraphed horizontal charge locks its direction before rushing at 260 units per second.
- An aerial slam launches upward, then creates an expanding 300-unit ground shockwave when it lands.
- A volley fires three energy bolts toward the player's current position with a small angular spread.

The HUD displays the boss health bar throughout the encounter. Defeating the Heavy Core awards 150 scrap, removes remaining boss hazards, retracts both gates, destroys both full-height red roof bulkheads, and permanently clears the arena for the run.

### Mini-boss encounter

The Sunken Vault contains the twelve-health Abyss Warden, a full boss with its own large health bar and deterministic charge, leaping shockwave, and five-bolt volley. Its 420-unit-tall right exit seal is solid before the encounter activates, reaches from Y 700 to the floor at Y 1120, and cannot be jumped around from the exit platforms. Dropping into the chamber activates the Warden and closes the entry seal. The dormant Warden cannot be damaged from the approach.

Defeating the Abyss Warden awards 110 scrap, removes its hazards, opens both sides, and releases the blue Volt Jab core inside the chamber. The opened escape leads to the tutorial conduit and powered seal.

Quiet Drift contains the reusable six-health Cache Scrapper mini-boss on an optional upper route. Its gate controls only an 80-scrap cache path; the normal foundation route remains open and it never protects an ability.

### Recovery room

The foundation immediately beyond the boss arena is a calm recovery room with no ordinary enemies, junk, conduits, or floor obstacles. Its station powers on only after the Heavy Core is defeated. While within 115 units, the HUD displays the `O // REST AND RECOVER` prompt. Resting restores all three core shells, clears current knockback, plays a recovery pulse, and moves the spike-reset checkpoint beside the station. It does not refill electricity or unlock abilities.

## Current map fragment

The current map is a complete geometric reset and must not derive its layout from the discarded access-path prototype. It spans X 0–14,500 and Y -1,000–1,200. Seventeen foundation pieces form the lower traversal network. Within the Sunken Vault, five foundations descend from Y 680 to Y 820 and rise again in 70-unit increments. A reversible branch continues to Y 1,040 before one deliberate drop reaches the Abyss Warden floor at Y 1,120. The gate-controlled escape uses three tested basic-jump platforms; no accidental early drop is allowed to strand the player.

Heavy overhead blocks frame large chambers. Thirty-three starting-kit platforms are scattered across at least nine of them as broad leaps, return drops, combat perches, and alternate crossings. They are not a staircase or serpentine chain. Most suspended platforms are 40–60 units thick; only the two deep Vault floor masses reach 80 units. Massive foundations remain at least 120 units thick except the five 60-unit Vault foundations, whose reduced depth leaves more passage clearance.

The starting kit cannot reach the whole map. Twelve platforms form three substantial optional upper regions: upper assembly requires double jump, high foundry requires dash, and the relay crown requires wall movement. These regions contain combat and salvage while remaining outside the required route to the boss.

Nine named regions cover the current world and meet at eight visible mechanical gates. The Shard Gauntlet concentrates four spike gaps and red hazard atmosphere; Quiet Drift is a more conventional exploration chamber with an optional scrap mini-boss; the 1,800-unit Grand Exchange is a broad multi-height district with the Edge Forge in its far corner. Region gates remain non-blocking navigation thresholds rather than stage exits.

Three merchant doors cluster in the Relay Concourse, with additional doors in the Rusted Verge, Ember Foundry, and Grand Exchange. A door in a safe pocket can open immediately; otherwise it remains sealed until nearby ordinary enemies are defeated. Pressing `O` beneath an unlocked door moves the bot into a separate enemy-free merchant room, and its interior exit returns to the saved overworld position. Ordinary merchants remain offline; the Edge Forge offers the configured 100-scrap slash upgrade.

Enemies, junk, and secrets occupy the upper networks, the deep vault, and the ability-gated regions—not only the lower left-to-right floor. The map contains ten spike gaps, three exhaustible conduits, fourteen ordinary junk piles, two powered seals, one optional mini-boss encounter, two full boss encounters, and two end alcoves. The Sunken Vault uses a darker blue-black background, Shard Gauntlet uses red hazard silhouettes, and Grand Exchange uses warm industrial accents.

Solid rectangles never intersect: platform faces may touch but cannot overlap, bury one another, or contain a placed enemy, conduit, or junk pile. Every intended starting-kit connection has a simulated safe traversal or return drop. Ordinary junk always leaves at least one bot-width bypass, eliminating narrow obstacle pockets that can strand the player.

The world contains no permanent embedded area-name captions, directional labels, or text-box-like room names. Visual depth comes from three parallax structure layers, deep unlabeled recesses, and massive blocks with beveled top and side faces. True walls use red vertical bracing, dark center rails, repeated chevrons, and no green floor edge, so their collision role is immediately readable. The HUD shows coordinates, lives, electricity, scrap, the available starting kit, and only the temporary region-entry title.

## Quality requirements

- Gameplay rules stay deterministic apart from cosmetic particles and leg placement.
- Rendering, input, level data, geometry, and simulation remain separate modules.
- Automated tests cover starting locks, absent restart input, repair timing, wall climbing, merchant-room access, the Edge Forge purchase, the permanent pre-fight Vault exit seal, all three Abyss Warden attacks, Volt-core release, Heavy Core barrier destruction, optional mini-boss rewards, region-entry titles, combat, resources, life loss, enemy behavior, two-way room connections, and valid surface contact.
- Level-data tests enforce world dimensions, varied platform thickness, zero solid intersections, object clearance, the reversible stepped Vault, its intentional full-boss drop and tested escape, bot-sized headroom, junk bypasses, dedicated wall geometry, enemy distribution, nine contiguous regions, matching region gates, distinct new-region identities, generic pickup data, framed unlabeled recesses, and three substantial ability-gated regions.
- The browser console has no errors during the start and play states.
