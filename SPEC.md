# Bot Conquest — Game Specification

## World vision

Bot Conquest takes place across one interconnected mechanical world. It is not divided into numbered sectors, discrete stages, or finish-line courses. Its spaces support exploration, backtracking, alternate routes, optional rooms, shortcuts, hidden caches, environmental storytelling, and small secrets.

The current replacement fragment spans 9,600 horizontal units and 2,200 vertical units. It is not the complete map and has no region-clear state, glowing finish gate, or traversal-percentage objective.

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
| Repair | `E` | Available from the start; spend 30 electricity to restore one missing shell |
| Electric field | `Q` | Locked initially; spend 40 electricity after unlock |
| Electric jab | `F` | Locked initially; spend 25 electricity after unlock |
| Rest | `O` | After defeating the boss, interact near the recovery station to restore all shells and set a checkpoint |
| Inventory / map | `I` | Reserved for a later system; deliberately does nothing now |

There is no restart key or persistent restart control. The game-over screen may offer a reboot after the player loses all three shells.

The basic slash supports left, right, up, and down. Its aim is captured when the attack begins. Pressing Space immediately evaluates the complete 105-unit directional hitbox once. Its only presentation is a 0.09-second straight white slash facing forward; it never extends, retracts, curves, or resembles a pointer.

### Ability pickups

Movement and combat upgrades use generic contact pickups. An available pickup is a small floating white square with a bright core, orbiting lines, motes, and a gentle bob. Moving the bot into it collects it immediately and permanently marks it collected for the run.

The first pickup is the `vault-core` just beyond the boss. It does not appear until the Heavy Core is defeated. Collecting it unlocks vault: holding jump while running into a low obstacle up to 115 units high hops the bot onto its top. Future pickups use the same data and collection flow with their own progression requirements.

### Planned shell bodies

Shell swapping is planned but not implemented in this prototype. Shells will change both the bot silhouette and its statistics; they must not be simple recolors. Initial design directions are:

- A tall, light shell with a stronger jump.
- A large, heavy shell with substantially more maximum health but slower movement.
- A reach-focused shell with a longer primary slash.

Acquisition, inventory presentation, swapping locations, exact bonuses, and balance costs remain for a later design pass.

## Resource loop

Enemies award scrap when killed: crawler 6, roller 8, hopper 10, drone 12, and brute 25. Scrap has no spending behavior yet.

The player has an electricity meter capped at 100. A standard slash against an enemy adds 12 electricity. Three conduits each contain 24 electricity, yield 4 per slash, and stay permanently empty after six successful harvests. A target hit by a special attack returns 4 electricity.

Ten ordinary junk piles have configured health and burst into scrap payouts when destroyed. An additional 90-unit-tall VOLT-sealed junk wall has minimum damage 2 and requires the future electric jab. Hitting junk does not generate electricity.

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

The HUD displays the boss health bar throughout the encounter. Defeating the Heavy Core awards 150 scrap, removes remaining boss hazards, retracts both gates, and permanently clears the arena for the run.

### Recovery room

The foundation immediately beyond the boss arena is a calm recovery room with no ordinary enemies, junk, conduits, or floor obstacles. Its station powers on only after the Heavy Core is defeated. While within 115 units, the HUD displays the `O // REST AND RECOVER` prompt. Resting restores all three core shells, clears current knockback, plays a recovery pulse, and moves the spike-reset checkpoint beside the station. It does not refill electricity or unlock abilities.

## Current map fragment

The current map is a complete geometric reset and must not derive its layout from the discarded access-path prototype. It spans X 0–9,600 and Y -1,000–1,200. Ten foundation pieces form the lower traversal network. Two safe, spike-free openings in the vault floor lead into an undercroft below Y 800; separate entrance and exit platforms make it a recoverable loop instead of a one-way pit.

Heavy overhead blocks frame eight large chambers. Twenty starting-kit platforms are scattered across six of them as broad leaps, return drops, combat perches, and alternate crossings. They are not a staircase or serpentine chain. Their widths vary from 150 to 380 units and their thicknesses vary from 40 to 60 units, creating substantially more readable air beneath them. Massive foundations remain at least 120 units thick.

The starting kit cannot reach the whole map. Twelve platforms form three substantial optional upper regions: upper assembly requires double jump, high foundry requires dash, and the relay crown requires wall movement. These regions contain combat and salvage while remaining outside the required route to the boss.

Six named regions cover the current world and meet at five visible mechanical gates. The gates are non-blocking navigation thresholds rather than stage exits. Crossing a gate changes the current region and briefly displays its name in a bottom-left HUD panel; region names never remain as permanent world labels.

The Relay Concourse is the merchant hub and contains a strict majority of the current merchant NPCs. Smaller merchants are scattered through the Rusted Verge and Ember Foundry. Merchants are visual placeholders until inventory, dialogue, pricing, and trading are designed.

Enemies, junk, and secrets occupy the upper networks, the undercroft, and the ability-gated regions—not only the lower left-to-right floor. The map contains seven spike gaps, three exhaustible conduits, ten ordinary junk piles, one armored junk wall, one boss encounter, and two end alcoves.

Solid rectangles never intersect: platform faces may touch but cannot overlap, bury one another, or contain a placed enemy, conduit, or junk pile. Every intended starting-kit connection has a simulated safe traversal or return drop. Ordinary junk always leaves at least one bot-width bypass, eliminating narrow obstacle pockets that can strand the player.

The world contains no permanent embedded area-name captions, directional labels, or text-box-like room names. Visual depth comes from three parallax structure layers, deep unlabeled recesses, and massive blocks with beveled top and side faces. True walls use red vertical bracing, dark center rails, repeated chevrons, and no green floor edge, so their collision role is immediately readable. The HUD shows coordinates, lives, electricity, scrap, the available starting kit, and only the temporary region-entry title.

## Quality requirements

- Gameplay rules stay deterministic apart from cosmetic particles and leg placement.
- Rendering, input, level data, geometry, and simulation remain separate modules.
- Automated tests cover starting locks, absent restart input, starting repair, reserved inventory input, post-boss rest, recovery checkpoints, the boss-gated vault pickup, vault movement, region-entry titles, post-unlock abilities, camera bounds, junk destruction, conduit depletion, four-direction melee combat, resources, life loss, enemy behavior, boss gates, all three boss attacks, boss rewards, simulated two-way room connections, the directed undercroft loop, and valid surface contact.
- Level-data tests enforce world dimensions, varied 40–60-unit suspended-platform thickness, massive foundation framing, zero solid intersections, object clearance, jump-safe lower gaps, safe undercroft openings, bot-sized headroom, junk bypasses, dedicated wall geometry, enemy distribution above and below the main floor, contiguous named regions, matching region gates, merchant-hub distribution, generic pickup data, framed unlabeled recesses, and three substantial ability-gated regions.
- The browser console has no errors during the start and play states.
