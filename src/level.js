export const WORLD_WIDTH = 14500;
export const WORLD_TOP = -1000;
export const WORLD_BOTTOM = 2700;
export const WORLD_HEIGHT = WORLD_BOTTOM-WORLD_TOP;

export const SPAWN = { x:180, y:624 };

// The lower route is a reversible chain: every upward change is within the
// basic jump and every gap can be crossed in either direction.
export const FOUNDATION_BLOCKS = [
  {id:'west-floor',x:0,y:660,w:1200,h:140,kind:'foundation'},
  {id:'assembly-floor',x:1290,y:620,w:980,h:180,kind:'foundation'},
  {id:'vault-entry',x:2360,y:680,w:200,h:60,kind:'foundation'},
  {id:'vault-shelf',x:2720,y:750,w:220,h:60,kind:'foundation'},
  {id:'vault-depth',x:2940,y:820,w:220,h:60,kind:'foundation'},
  {id:'vault-rise',x:3160,y:750,w:100,h:60,kind:'foundation'},
  {id:'vault-exit',x:3420,y:680,w:130,h:60,kind:'foundation'},
  {id:'foundry-floor',x:3550,y:610,w:1300,h:190,kind:'foundation'},
  {id:'prearena-floor',x:4950,y:670,w:840,h:130,kind:'foundation'},
  {id:'boss-floor',x:5890,y:600,w:1300,h:200,kind:'foundation'},
  {id:'rest-floor',x:7350,y:660,w:980,h:140,kind:'foundation'},
  {id:'relay-floor',x:8400,y:590,w:1200,h:210,kind:'foundation'},
  {id:'gauntlet-west',x:9600,y:650,w:480,h:150,kind:'foundation'},
  {id:'gauntlet-depth',x:10180,y:710,w:440,h:120,kind:'foundation'},
  {id:'gauntlet-east',x:10720,y:650,w:580,h:150,kind:'foundation'},
  {id:'drift-floor',x:11400,y:620,w:1200,h:180,kind:'foundation'},
  {id:'exchange-floor',x:12700,y:660,w:1800,h:140,kind:'foundation'}
];

export const OVERHEAD_BLOCKS = [
  {x:0,y:-200,w:1200,h:80,kind:'ceiling'},
  {x:1290,y:-900,w:980,h:100,kind:'ceiling'},
  {x:2360,y:-400,w:1100,h:70,kind:'ceiling'},
  {x:3550,y:-900,w:1300,h:100,kind:'ceiling'},
  {x:4950,y:-300,w:840,h:100,kind:'ceiling'},
  {x:5890,y:250,w:1300,h:100,kind:'ceiling'},
  {x:7350,y:350,w:980,h:100,kind:'ceiling'},
  {x:8400,y:-900,w:1200,h:110,kind:'ceiling'},
  {x:9600,y:-100,w:1700,h:80,kind:'ceiling'},
  {x:11400,y:-600,w:1200,h:90,kind:'ceiling'},
  {x:12700,y:-800,w:1800,h:100,kind:'ceiling'}
];

// Every interior block sits flush on one foundation, is exactly one basic
// jump high, and leaves at least 80 units of exposed floor around it.
export const INTERIOR_BLOCKS = [
  {id:'west-step',x:430,y:590,w:180,h:70,kind:'interior'},
  {x:800,y:590,w:260,h:70,kind:'interior'},
  {id:'assembly-step',x:1400,y:550,w:220,h:70,kind:'interior'},
  {x:1950,y:550,w:180,h:70,kind:'interior'},
  {id:'foundry-step',x:3650,y:540,w:300,h:70,kind:'interior'},
  {x:4400,y:540,w:260,h:70,kind:'interior'},
  {id:'prearena-step',x:5100,y:600,w:200,h:70,kind:'interior'},
  {id:'relay-step',x:8600,y:520,w:260,h:70,kind:'interior'},
  {id:'drift-step-west',x:11600,y:550,w:240,h:70,kind:'interior'},
  {id:'drift-step-east',x:12150,y:550,w:220,h:70,kind:'interior'},
  {id:'exchange-step-west',x:13000,y:590,w:300,h:70,kind:'interior'},
  {id:'exchange-step-east',x:13800,y:590,w:260,h:70,kind:'interior'}
];

// Starting-kit exploration surfaces are scattered across rooms rather than
// arranged as staircases. Their varied spans create broad leaps, return drops,
// combat perches, and alternate lines through the same space.
export const BRANCH_BLOCKS = [
  {id:'start-loft',x:650,y:450,w:210,h:45,kind:'branch',zone:'west'},
  {id:'west-bridge',x:970,y:300,w:360,h:55,kind:'branch',zone:'west'},

  {id:'assembly-entry',x:1630,y:430,w:190,h:40,kind:'branch',zone:'assembly'},
  {id:'assembly-perch',x:1910,y:280,w:300,h:50,kind:'branch',zone:'assembly'},
  {id:'assembly-cross',x:1420,y:140,w:350,h:45,kind:'branch',zone:'assembly'},

  {id:'vault-ledge',x:2500,y:870,w:160,h:40,kind:'branch',zone:'vault'},
  {id:'vault-span',x:2600,y:930,w:290,h:55,kind:'branch',zone:'vault'},
  {id:'vault-high',x:2860,y:1040,w:200,h:40,kind:'branch',zone:'vault'},

  {id:'foundry-platform',x:3960,y:400,w:310,h:60,kind:'branch',zone:'foundry'},
  {id:'foundry-mid',x:4350,y:280,w:220,h:40,kind:'branch',zone:'foundry'},
  {id:'foundry-east',x:4600,y:400,w:230,h:50,kind:'branch',zone:'foundry'},
  {id:'foundry-west',x:4120,y:140,w:220,h:45,kind:'branch',zone:'foundry'},
  {id:'foundry-high',x:3740,y:0,w:260,h:50,kind:'branch',zone:'foundry'},

  {id:'prearena-low',x:5310,y:460,w:170,h:40,kind:'branch',zone:'prearena'},
  {id:'prearena-wide',x:5480,y:310,w:300,h:55,kind:'branch',zone:'prearena'},
  {id:'prearena-high',x:5270,y:170,w:190,h:45,kind:'branch',zone:'prearena'},

  {id:'relay-entry',x:8870,y:380,w:210,h:40,kind:'branch',zone:'relay'},
  {id:'relay-east',x:9250,y:240,w:300,h:55,kind:'branch',zone:'relay'},
  {id:'relay-center',x:8840,y:100,w:260,h:45,kind:'branch',zone:'relay'},
  {id:'relay-west',x:8440,y:-40,w:310,h:50,kind:'branch',zone:'relay'},

  {id:'gauntlet-west-perch',x:9920,y:520,w:140,h:40,kind:'branch',zone:'gauntlet'},
  {id:'gauntlet-center',x:10120,y:390,w:260,h:45,kind:'branch',zone:'gauntlet'},
  {id:'gauntlet-east-perch',x:10620,y:500,w:230,h:40,kind:'branch',zone:'gauntlet'},
  {id:'gauntlet-overlook',x:10920,y:370,w:300,h:50,kind:'branch',zone:'gauntlet'},

  {id:'drift-rise',x:11480,y:460,w:220,h:45,kind:'branch',zone:'drift'},
  {id:'drift-cache-floor',x:11800,y:340,w:520,h:50,kind:'branch',zone:'drift'},
  {id:'drift-threshold',x:12360,y:360,w:170,h:50,kind:'branch',zone:'drift'},
  {id:'drift-east',x:12380,y:470,w:190,h:40,kind:'branch',zone:'drift'},

  {id:'exchange-west-loft',x:12820,y:450,w:330,h:50,kind:'branch',zone:'exchange'},
  {id:'exchange-mid-link',x:13200,y:430,w:150,h:40,kind:'branch',zone:'exchange'},
  {id:'exchange-central-span',x:13380,y:320,w:520,h:55,kind:'branch',zone:'exchange'},
  {id:'exchange-east-loft',x:13900,y:430,w:250,h:45,kind:'branch',zone:'exchange'},
  {id:'exchange-high-cache',x:13600,y:180,w:360,h:50,kind:'branch',zone:'exchange'}
];

// The Sunken Vault descends through a reversible upper route, then uses one
// deliberate one-way drop into its mini-boss room. The right-hand platforms
// form the guaranteed basic-jump escape after the arena gate opens.
export const LOWER_BLOCKS = [
  {id:'under-cache',x:2860,y:1120,w:470,h:80,kind:'lower'},
  {id:'under-threshold',x:3370,y:1120,w:180,h:80,kind:'lower'},
  {id:'under-exit-low',x:3390,y:1020,w:80,h:40,kind:'lower'},
  {id:'under-exit-mid',x:3290,y:920,w:80,h:45,kind:'lower'},
  {id:'under-exit-high',x:3340,y:820,w:80,h:40,kind:'lower'}
];

// Wall Climb opens a large upper Vault chamber without obstructing the basic
// route below. The hanging wall stops 200 units above the foundation, leaving
// normal traversal intact while providing a continuous climb into the loft.
export const VAULT_UPPER_BLOCKS = [
  {id:'vault-upper-climb',x:2500,y:300,w:60,h:180,kind:'wall',requires:'wallClimb',region:'vault-upper',gateEntry:true},
  {id:'vault-upper-west',x:2560,y:300,w:240,h:50,kind:'vault-upper',requires:'wallClimb',region:'vault-upper'},
  {id:'vault-upper-mid',x:2860,y:130,w:260,h:50,kind:'vault-upper',requires:'wallClimb',region:'vault-upper'},
  {id:'vault-upper-spine',x:3060,y:-70,w:60,h:200,kind:'wall',requires:'wallClimb',region:'vault-upper'},
  {id:'vault-upper-crown',x:2760,y:-70,w:300,h:50,kind:'vault-upper',requires:'wallClimb',region:'vault-upper'},
  {id:'vault-upper-east',x:3190,y:280,w:260,h:50,kind:'vault-upper',requires:'wallClimb',region:'vault-upper'}
];

// Once Wall Climb is owned and the Abyss Warden is dead, the low hatch above
// this wall retracts. The player must climb over it to reach a broad 200-unit
// opening; the chamber below then zig-zags through two more climb galleries.
export const DEPTH_ACCESS_BLOCKS = [
  {id:'vault-depth-floor-west',x:2860,y:1120,w:130,h:80,kind:'lower'},
  {id:'vault-depth-access',x:2990,y:1000,w:60,h:120,kind:'wall',requires:'wallClimb',region:'vault-depth',gateEntry:true},
  {id:'vault-depth-floor-east',x:3250,y:1120,w:80,h:80,kind:'lower'}
];

export const VAULT_DEEP_BLOCKS = [
  {id:'vault-deep-drop-one',x:3000,y:1480,w:300,h:50,kind:'vault-depth'},
  {id:'vault-deep-climb-west',x:2940,y:1280,w:60,h:200,kind:'wall',requires:'wallClimb',region:'vault-depth'},
  {id:'vault-deep-gallery-west',x:2600,y:1280,w:340,h:50,kind:'vault-depth',requires:'wallClimb',region:'vault-depth'},
  {id:'vault-deep-drop-two',x:2460,y:1800,w:320,h:50,kind:'vault-depth'},
  {id:'vault-deep-climb-east',x:2780,y:1580,w:60,h:220,kind:'wall',requires:'wallClimb',region:'vault-depth'},
  {id:'vault-deep-gallery-east',x:2840,y:1580,w:380,h:50,kind:'vault-depth',requires:'wallClimb',region:'vault-depth'},
  {id:'vault-deep-drop-three',x:3170,y:2110,w:320,h:50,kind:'vault-depth'},
  {id:'depth-boss-left-wall',x:2380,y:2130,w:60,h:420,kind:'wall'},
  {id:'depth-boss-floor',x:2440,y:2550,w:1110,h:150,kind:'foundation'}
];

// These surfaces rise only after the Rift Stalker dies. The two alternating
// 270-unit gaps require Dash, after which the route rejoins the open hatch.
export const DEPTH_RETURN_BLOCKS = [
  {id:'depth-return-one',x:2480,y:2410,w:160,h:50,kind:'vault-depth-return',requires:'dash'},
  {id:'depth-return-two',x:2910,y:2280,w:160,h:50,kind:'vault-depth-return',requires:'dash'},
  {id:'depth-return-three',x:2480,y:2150,w:160,h:50,kind:'vault-depth-return',requires:'dash'},
  {id:'depth-return-four',x:2860,y:1950,w:160,h:50,kind:'vault-depth-return',requires:'dash'},
  {id:'depth-return-five',x:3230,y:1780,w:160,h:50,kind:'vault-depth-return',requires:'dash'},
  {id:'depth-return-climb',x:3390,y:1380,w:60,h:400,kind:'wall',requires:'dash'},
  {id:'depth-return-hatch',x:3260,y:1380,w:130,h:50,kind:'vault-depth-return',requires:'dash'}
];

// Small alcoves exist only at the outer ends of the world, where their back
// walls cannot seal a through-route or strand the player.
export const POCKET_BLOCKS = [
  {x:40,y:430,w:300,h:70,kind:'pocket-ceiling'},
  {x:14200,y:380,w:300,h:70,kind:'pocket-ceiling'}
];

export const WALL_BLOCKS = [
  {x:40,y:500,w:60,h:160,kind:'wall'},
  {x:14440,y:450,w:60,h:210,kind:'wall'},
  {id:'crown-climb',x:8380,y:-260,w:60,h:220,kind:'wall'},
  {id:'boss-roof-left',x:5790,y:-1000,w:100,h:1350,kind:'wall',destructibleAfterBoss:true},
  {id:'boss-roof-right',x:7190,y:-1000,w:160,h:1350,kind:'wall',destructibleAfterBoss:true},
  {id:'vault-arena-left',x:2800,y:985,w:60,h:135,kind:'wall'}
];

// Three substantial optional regions remain unreachable with the starting
// kit. Their first platforms require double jump, dash, or wall movement;
// their remaining surfaces form explorable rooms beyond those entrances.
export const ABILITY_GATED_BLOCKS = [
  {id:'double-entry',x:1160,y:-80,w:190,h:45,kind:'cache',requires:'doubleJump',region:'upper-assembly',gateEntry:true},
  {id:'double-gallery',x:1480,y:-220,w:370,h:55,kind:'cache',requires:'doubleJump',region:'upper-assembly'},
  {id:'double-east',x:1960,y:-70,w:230,h:40,kind:'cache',requires:'doubleJump',region:'upper-assembly'},
  {id:'double-vault',x:1830,y:-390,w:280,h:50,kind:'cache',requires:'doubleJump',region:'upper-assembly'},
  {id:'double-cache',x:1330,y:-540,w:330,h:60,kind:'cache',requires:'doubleJump',region:'upper-assembly'},

  {id:'dash-entry',x:4430,y:80,w:180,h:40,kind:'cache',requires:'dash',region:'high-foundry',gateEntry:true},
  {id:'dash-pier',x:4700,y:-70,w:140,h:45,kind:'cache',requires:'dash',region:'high-foundry'},
  {id:'dash-cache',x:4320,y:-230,w:380,h:55,kind:'cache',requires:'dash',region:'high-foundry'},

  {id:'wall-entry',x:8500,y:-330,w:220,h:45,kind:'cache',requires:'wallClimb',region:'relay-crown',gateEntry:true},
  {id:'wall-gallery',x:8750,y:-470,w:570,h:60,kind:'cache',requires:'wallClimb',region:'relay-crown'},
  {id:'wall-east',x:9340,y:-525,w:180,h:45,kind:'cache',requires:'wallClimb',region:'relay-crown'},
  {id:'wall-cache',x:9000,y:-650,w:320,h:55,kind:'cache',requires:'wallClimb',region:'relay-crown'}
];

export const BOSS_ARENA = {
  x:5890,y:350,w:1300,h:250,floorY:600,
  triggerX:6000,leftGateX:5905,rightGateX:7133,gateWidth:42,
  gateStartY:80,gateClosedY:350,gateHeight:250,
  boss:{type:'boss',x:6512,y:522,w:96,h:78,health:36}
};

export const VAULT_BOSS_ARENA = {
  id:'vault-warden',name:'ABYSS WARDEN',region:'vault',
  x:2860,y:950,w:510,h:170,floorY:1120,triggerY:1000,
  leftGateX:2818,rightGateX:3330,gateY:700,gateWidth:40,gateHeight:420,
  rewardScrap:110,
  boss:{type:'vaultBoss',x:3120,y:1038,w:92,h:82,health:24}
};

export const DEPTH_BOSS_ARENA = {
  id:'rift-stalker',name:'RIFT STALKER',region:'vault',
  x:2440,y:2330,w:1030,h:220,floorY:2550,triggerY:2360,
  rightGateX:3470,gateY:2330,gateWidth:40,gateHeight:220,
  rewardScrap:180,
  boss:{type:'depthBoss',x:2680,y:2478,w:88,h:72,health:48}
};

export const MINI_BOSS_ARENAS = [
  {
    id:'drift-scrapper',name:'CACHE SCRAPPER',region:'drift',
    x:11800,y:170,w:560,h:170,floorY:340,triggerY:205,
    gateX:12320,gateY:170,gateWidth:40,gateHeight:170,rewardScrap:0,rewardMaterial:{type:'titanium',amount:3},
    enemy:{type:'miniBoss',x:12080,y:268,w:82,h:72,health:12}
  }
];

export const REST_AREA = {
  x:7420,y:450,w:650,h:210,floorY:660,
  station:{x:7520,y:594,w:64,h:66,interactionRadius:115}
};

export const REGIONS = [
  {id:'verge',name:'RUSTED VERGE',x:0,w:2360},
  {id:'vault',name:'SUNKEN VAULT',x:2360,w:1190},
  {id:'foundry',name:'EMBER FOUNDRY',x:3550,w:2340},
  {id:'bastion',name:'CORE BASTION',x:5890,w:2510,merchantHub:true},
  {id:'crown',name:'CROWNWORKS',x:8400,w:1200},
  {id:'gauntlet',name:'SHARD GAUNTLET',x:9600,w:1800},
  {id:'drift',name:'QUIET DRIFT',x:11400,w:1300},
  {id:'exchange',name:'GRAND EXCHANGE',x:12700,w:1800,merchantHub:true}
];

// Region gates are readable non-blocking thresholds. Crossing one changes the
// current region and triggers the temporary HUD title.
export const REGION_GATES = [
  {x:2372,y:510,w:72,h:170,from:'verge',to:'vault'},
  {x:3562,y:440,w:72,h:170,from:'vault',to:'foundry'},
  {x:5902,y:350,w:72,h:250,from:'foundry',to:'bastion'},
  {x:8412,y:420,w:72,h:170,from:'bastion',to:'crown'},
  {x:9612,y:480,w:72,h:170,from:'crown',to:'gauntlet'},
  {x:11412,y:450,w:72,h:170,from:'gauntlet',to:'drift'},
  {x:12712,y:490,w:72,h:170,from:'drift',to:'exchange'}
];

// Pickups share one data shape so future movement, combat, and shell pickups
// can use the same contact collection flow.
export const PICKUP_SPAWNS = [
  {id:'volt-core',kind:'ability',ability:'electricJab',x:3260,y:1080,w:24,h:24,color:'#75f5ff',name:'VOLT JAB',key:'F',description:'Spend electricity to fire a long powered jab.',requiresVaultBossClear:true},
  {id:'vault-core',kind:'ability',ability:'wallClimb',x:7448,y:608,w:24,h:24,color:'#ffffff',name:'WALL CLIMB',key:'W + A / D',description:'Hold W on a wall; press away to jump at any height.',requiresBossClear:true},
  {id:'dash-core',kind:'ability',ability:'dash',x:2570,y:2526,w:24,h:24,color:'#d6ff3f',name:'DASH DRIVE',key:'SHIFT',description:'Burst across the deep return gaps.',requiresDepthBossClear:true},
  {id:'map-west',kind:'map',x:1080,y:256,w:24,h:24,color:'#d6ff3f',name:'WESTERN SURVEY',regions:['verge','vault']},
  {id:'map-central',kind:'map',x:4740,y:356,w:24,h:24,color:'#d6ff3f',name:'CENTRAL SURVEY',regions:['foundry','bastion']},
  {id:'map-east',kind:'map',x:11020,y:326,w:24,h:24,color:'#d6ff3f',name:'EASTERN SURVEY',regions:['crown','gauntlet','drift','exchange']}
];

export const FORGE_UPGRADE_COSTS = Object.freeze([500,900,1500,2400]);
export const HEALTH_UPGRADE_COSTS = Object.freeze([450,900,1600]);
export const ENERGY_UPGRADE_COSTS = Object.freeze([400,800,1400]);
export const INTERNAL_SLOT_COSTS = Object.freeze([800,1600,2800]);

export const BODY_MODIFIERS = Object.freeze([
  {id:'aegis-filament',name:'AEGIS FILAMENT',cost:650,effects:{shell:{maxLives:1,label:'+1 MAX SHELL'},core:{maxElectricity:10,label:'+10 CAPACITY'},legs:{moveSpeed:18,label:'+18 MOVE SPEED'},internal:{healShield:1,label:'REPAIR GRANTS 1-HIT SHIELD'}}},
  {id:'reactive-governor',name:'REACTIVE GOVERNOR',cost:800,effects:{shell:{postHitInvulnerability:.35,label:'+0.35S POST-HIT WINDOW'},core:{damageEnergy:8,label:'DAMAGE RETURNS 8 ENERGY'},legs:{damageSpeedBonus:85,damageSpeedDuration:3,label:'+85 SPEED FOR 3S AFTER DAMAGE'},internal:{damageSpeedBonus:30,damageSpeedDuration:2,label:'+30 SPEED FOR 2S AFTER DAMAGE'}}},
  {id:'extender-arm',name:'EXTENDER ARM',cost:950,effects:{core:{maxElectricity:8,label:'+8 CAPACITY'},legs:{moveSpeed:30,label:'+30 MOVE SPEED'},weapon:{attackRange:40,label:'+40 CUTTER RANGE'},internal:{attackRange:12,label:'+12 CUTTER RANGE'}}}
]);

// Relics are permanent passive merchant items with distinct conditional
// effects. They do not occupy body-modifier mounts.
export const RELICS = Object.freeze([
  {id:'mender-loop',name:'MENDER LOOP',cost:750,detail:'REPAIR COST -5 ELECTRICITY',effects:{healCostReduction:5}},
  {id:'impact-damper',name:'IMPACT DAMPER',cost:900,detail:'50% LESS KNOCKBACK AFTER DAMAGE',effects:{knockbackReduction:.5}},
  {id:'feedback-dynamo',name:'FEEDBACK DYNAMO',cost:850,detail:'TAKING DAMAGE RESTORES 12 ELECTRICITY',effects:{damageElectricity:12}},
  {id:'execution-coil',name:'EXECUTION COIL',cost:1050,detail:'ENEMY KILLS RESTORE 8 ELECTRICITY',effects:{killElectricity:8}},
  {id:'arc-retort',name:'ARC RETORT',cost:1100,detail:'TAKING DAMAGE HITS NEARBY ENEMIES FOR 2',effects:{retaliationDamage:2,retaliationRadius:120}},
  {id:'kinetic-memory',name:'KINETIC MEMORY',cost:1250,detail:'AFTER DAMAGE, NEXT CUTTER SLASH DEALS +2',effects:{nextSlashDamage:2}},
  {id:'salvage-lens',name:'SALVAGE LENS',cost:800,detail:'ORDINARY ENEMY KILLS DROP +3 SCRAP',effects:{ordinaryScrapBonus:3}},
  {id:'corpse-key',name:'CORPSE KEY',cost:950,detail:'RECOVERY WRECKS HAVE 1 HEALTH',effects:{corpseHealthReduction:2}}
]);

// Merchant terminals lead to one sealed, enemy-free interior. A terminal
// remains locked until its explicitly local enemy group is defeated.
export const MERCHANT_SPAWNS = [
  {id:'merchant-parts',name:'PARTS BROKER',x:9010,y:-770,w:80,h:120,region:'crown',hub:false,color:'#75f5ff',clearRadius:210,service:'modifierShop',stock:['aegis-filament','reactive-governor','extender-arm']},
  {id:'merchant-shells',name:'SHELL ARCHIVE',x:13700,y:60,w:80,h:120,region:'exchange',hub:false,color:'#d6ff3f',clearRadius:210,service:'healthUpgrade',upgradeCosts:HEALTH_UPGRADE_COSTS,relicStock:['mender-loop','impact-damper']},
  {id:'merchant-salvage',name:'CAPACITOR EXCHANGE',x:11120,y:250,w:80,h:120,region:'gauntlet',hub:false,color:'#ffb85c',clearRadius:210,service:'energyUpgrade',upgradeCosts:ENERGY_UPGRADE_COSTS,relicStock:['feedback-dynamo','execution-coil']},
  {id:'merchant-verge',name:'VERGE TINKER',x:2160,y:500,w:80,h:120,region:'verge',hub:false,color:'#75f5ff',clearRadius:210},
  {id:'merchant-foundry',name:'INNER FOUNDRY',x:4690,y:490,w:80,h:120,region:'foundry',hub:false,color:'#ffb85c',clearRadius:210,service:'internalSlot',upgradeCosts:INTERNAL_SLOT_COSTS},
  {id:'merchant-response',name:'RESPONSE FORGE',x:12450,y:240,w:80,h:120,region:'drift',hub:false,color:'#ff786f',clearRadius:180,service:'relicShop',relicStock:['arc-retort','kinetic-memory']},
  {id:'merchant-curator',name:'SALVAGE CURATOR',x:12880,y:330,w:80,h:120,region:'exchange',hub:false,color:'#d9a441',clearRadius:180,service:'relicShop',relicStock:['salvage-lens','corpse-key']},
  {id:'merchant-forge',name:'EDGE FORGE',x:14280,y:540,w:80,h:120,region:'exchange',hub:false,color:'#ffffff',clearRadius:210,service:'damageUpgrade',upgradeCosts:FORGE_UPGRADE_COSTS}
];

export const MERCHANT_ROOM = {
  x:2600,y:-930,w:700,h:330,floorY:-600,
  spawn:{x:2700,y:-636},exit:{x:3160,y:-720,w:80,h:120},
  merchant:{x:2910,y:-654,w:38,h:54}
};

export const MERCHANT_ROOM_BLOCKS = [
  {id:'merchant-room-ceiling',x:2600,y:-1000,w:700,h:70,kind:'merchant-room'},
  {id:'merchant-room-left',x:2600,y:-930,w:60,h:330,kind:'merchant-room'},
  {id:'merchant-room-right',x:3240,y:-930,w:60,h:330,kind:'merchant-room'},
  {id:'merchant-room-floor',x:2600,y:-600,w:700,h:200,kind:'merchant-room'}
];

export const RECESSES = [
  {x:110,y:-120,w:980,h:780,floorY:660,ceilingY:-120,openSide:'right'},
  {x:1340,y:-800,w:780,h:1420,floorY:620,ceilingY:-800,openSide:'left'},
  {x:2380,y:-330,w:1050,h:1450,floorY:1120,ceilingY:-330,openSide:'right',floorOpenings:true,steppedFloor:true},
  {x:3650,y:-800,w:1040,h:1410,floorY:610,ceilingY:-800,openSide:'left'},
  {x:5030,y:-200,w:690,h:870,floorY:670,ceilingY:-200,openSide:'right'},
  {x:5980,y:350,w:1100,h:250,floorY:600,ceilingY:350,openSide:'left'},
  {x:7440,y:450,w:800,h:210,floorY:660,ceilingY:450,openSide:'right'},
  {x:8500,y:-790,w:980,h:1380,floorY:590,ceilingY:-790,openSide:'left'},
  {x:100,y:500,w:240,h:160,floorY:660,ceilingY:500,openSide:'right',pocket:true},
  {x:14200,y:450,w:240,h:210,floorY:660,ceilingY:450,openSide:'left',pocket:true},
  {x:2660,y:-930,w:580,h:330,floorY:-600,ceilingY:-930,merchantRoom:true},
  {x:9650,y:-20,w:1600,h:670,floorY:650,ceilingY:-20,openSide:'right'},
  {x:11450,y:-510,w:1100,h:1130,floorY:620,ceilingY:-510,openSide:'left'},
  {x:12750,y:-700,w:1700,h:1360,floorY:660,ceilingY:-700,openSide:'left'},
  {x:2400,y:1120,w:1150,h:1430,floorY:2550,ceilingY:1120,openSide:'top',deepVault:true}
];

export const PLATFORMS = [
  ...FOUNDATION_BLOCKS,
  ...OVERHEAD_BLOCKS,
  ...INTERIOR_BLOCKS,
  ...BRANCH_BLOCKS,
  ...LOWER_BLOCKS,
  ...VAULT_UPPER_BLOCKS,
  ...VAULT_DEEP_BLOCKS,
  ...POCKET_BLOCKS,
  ...WALL_BLOCKS,
  ...ABILITY_GATED_BLOCKS,
  ...MERCHANT_ROOM_BLOCKS
];

export const TRAPS = [
  {x:1200,y:690,w:90,h:110},
  {x:2270,y:710,w:90,h:90},
  {x:4850,y:700,w:100,h:100},
  {x:5790,y:700,w:100,h:100},
  {x:7190,y:700,w:160,h:100},
  {x:8330,y:700,w:70,h:100},
  {x:10080,y:680,w:100,h:150},
  {x:10620,y:680,w:100,h:150},
  {x:11300,y:680,w:100,h:150},
  {x:12600,y:690,w:100,h:110}
];

export const ENEMY_SPAWNS = [
  {type:'crawler',x:500,y:550,w:30,h:40,patrol:true,patrolRange:90},
  {type:'roller',x:700,y:632,w:46,h:28,patrol:true,patrolRange:55,patrolDirection:-1},
  {type:'hopper',x:1680,y:575,w:34,h:45},
  {type:'brute',x:1830,y:557,w:58,h:63},
  {type:'crawler',x:700,y:410,w:30,h:40,patrol:true,patrolRange:55},
  {type:'roller',x:1050,y:272,w:46,h:28,patrol:true,patrolRange:80,patrolDirection:-1},
  {type:'hopper',x:1950,y:235,w:34,h:45},
  {type:'drone',x:1450,y:300,w:42,h:30},
  {type:'roller',x:2450,y:652,w:46,h:28,patrol:true,patrolRange:45},
  {type:'crawler',x:2760,y:890,w:30,h:40,patrol:true,patrolRange:60},
  {type:'crawler',x:2670,y:1240,w:30,h:40,patrol:true,patrolRange:70},
  {type:'hopper',x:2880,y:1535,w:34,h:45},
  {type:'brute',x:3000,y:757,w:58,h:63},
  {type:'drone',x:2860,y:650,w:42,h:30},
  {type:'crawler',x:2640,y:260,w:30,h:40,patrol:true,patrolRange:55},
  {type:'hopper',x:2820,y:-115,w:34,h:45},
  {type:'crawler',x:4050,y:570,w:30,h:40},
  {type:'brute',x:4280,y:547,w:58,h:63},
  {type:'roller',x:4020,y:372,w:46,h:28,patrol:true,patrolRange:90},
  {type:'hopper',x:4690,y:355,w:34,h:45},
  {type:'drone',x:4200,y:200,w:42,h:30},
  {type:'roller',x:4380,y:-258,w:46,h:28,patrol:true,patrolRange:90},
  {type:'roller',x:5420,y:642,w:46,h:28,patrol:true,patrolRange:70},
  {type:'hopper',x:5600,y:625,w:34,h:45},
  {type:'roller',x:5520,y:282,w:46,h:28,patrol:true,patrolRange:90},
  {type:'hopper',x:8920,y:545,w:34,h:45},
  {type:'brute',x:8140,y:597,w:58,h:63},
  {type:'crawler',x:9300,y:200,w:30,h:40,patrol:true,patrolRange:100},
  {type:'hopper',x:8800,y:-515,w:34,h:45},
  {type:'brute',x:9400,y:-588,w:58,h:63},
  {type:'drone',x:9000,y:0,w:42,h:30},
  {type:'hopper',x:9700,y:605,w:34,h:45},
  {type:'drone',x:10300,y:500,w:42,h:30},
  {type:'roller',x:10780,y:622,w:46,h:28,patrol:true,patrolRange:100},
  {type:'brute',x:11050,y:587,w:58,h:63},
  {type:'crawler',x:11920,y:580,w:30,h:40,patrol:true,patrolRange:80},
  {type:'drone',x:12400,y:250,w:42,h:30},
  {type:'roller',x:13320,y:632,w:46,h:28,patrol:true,patrolRange:100},
  {type:'hopper',x:13450,y:615,w:34,h:45},
  {type:'brute',x:13650,y:597,w:58,h:63},
  {type:'drone',x:13650,y:260,w:42,h:30}
];

export const CONDUITS = [
  {x:330,y:608,w:28,h:52,charge:24,energyPerHit:4},
  {x:3300,y:868,w:28,h:52,charge:24,energyPerHit:4,tutorial:'electricJab'},
  {x:8500,y:538,w:28,h:52,charge:24,energyPerHit:4}
];

export const JUNK_PILES = [
  {x:500,y:544,w:76,h:46,health:5,scrapValue:24},
  {x:740,y:404,w:76,h:46,health:5,scrapValue:26},
  {x:1500,y:94,w:82,h:46,health:5,scrapValue:28},
  {id:'vault-hatch-junk',x:2960,y:994,w:84,h:46,health:6,scrapValue:32},
  {x:2800,y:884,w:88,h:46,health:6,scrapValue:34},
  {x:3820,y:-46,w:86,h:46,health:6,scrapValue:36},
  {x:4500,y:-276,w:90,h:46,health:6,scrapValue:0,material:{type:'titanium',amount:1}},
  {x:5600,y:264,w:80,h:46,health:5,scrapValue:28},
  {x:8940,y:54,w:78,h:46,health:5,scrapValue:30},
  {x:9040,y:-696,w:92,h:46,health:7,scrapValue:0,material:{type:'uranium',amount:1}},
  {id:'vault-volt-seal',x:3370,y:740,w:50,h:80,health:2,scrapValue:20,minimumDamage:2,gate:true,requires:'electricJab'},
  {x:9300,y:500,w:120,h:90,health:8,scrapValue:60,minimumDamage:2,gate:true},
  {x:10280,y:344,w:82,h:46,health:6,scrapValue:38},
  {x:12160,y:294,w:82,h:46,health:6,scrapValue:45},
  {x:13560,y:274,w:88,h:46,health:7,scrapValue:50},
  {x:14000,y:384,w:90,h:46,health:7,scrapValue:55}
];
