export const WORLD_WIDTH = 9600;
export const WORLD_TOP = -600;
export const WORLD_BOTTOM = 800;
export const WORLD_HEIGHT = WORLD_BOTTOM-WORLD_TOP;

export const SPAWN = { x:180, y:624 };

// The lower route is a reversible chain: every upward change is within the
// basic jump and every gap can be crossed in either direction.
export const FOUNDATION_BLOCKS = [
  {x:0,y:660,w:1150,h:140,kind:'foundation'},
  {x:1290,y:620,w:930,h:180,kind:'foundation'},
  {x:2360,y:680,w:1050,h:120,kind:'foundation'},
  {x:3550,y:610,w:1240,h:190,kind:'foundation'},
  {x:4950,y:670,w:780,h:130,kind:'foundation'},
  {x:5890,y:600,w:1300,h:200,kind:'foundation'},
  {x:7350,y:660,w:900,h:140,kind:'foundation'},
  {x:8400,y:590,w:1200,h:210,kind:'foundation'}
];

export const OVERHEAD_BLOCKS = [
  {x:0,y:200,w:1120,h:90,kind:'ceiling'},
  {x:1290,y:300,w:930,h:90,kind:'ceiling'},
  {x:2360,y:360,w:1050,h:100,kind:'ceiling'},
  {x:3550,y:220,w:1240,h:110,kind:'ceiling'},
  {x:4950,y:330,w:780,h:100,kind:'ceiling'},
  {x:5890,y:250,w:1300,h:100,kind:'ceiling'},
  {x:7350,y:350,w:900,h:100,kind:'ceiling'},
  {x:8400,y:250,w:1200,h:110,kind:'ceiling'}
];

// Every interior block sits flush on one foundation, is exactly one basic
// jump high, and leaves at least 80 units of exposed floor around it.
export const INTERIOR_BLOCKS = [
  {x:430,y:590,w:240,h:70,kind:'interior'},
  {x:780,y:590,w:260,h:70,kind:'interior'},
  {x:1510,y:550,w:300,h:70,kind:'interior'},
  {x:1900,y:550,w:200,h:70,kind:'interior'},
  {x:2630,y:610,w:400,h:70,kind:'interior'},
  {x:3130,y:610,w:180,h:70,kind:'interior'},
  {x:3820,y:540,w:400,h:70,kind:'interior'},
  {x:4320,y:540,w:300,h:70,kind:'interior'},
  {x:5140,y:600,w:300,h:70,kind:'interior'},
  {x:7540,y:590,w:330,h:70,kind:'interior'},
  {x:7970,y:590,w:160,h:70,kind:'interior'},
  {x:8660,y:520,w:420,h:70,kind:'interior'}
];

// Small alcoves exist only at the outer ends of the world, where their back
// walls cannot seal a through-route or strand the player.
export const POCKET_BLOCKS = [
  {x:40,y:430,w:300,h:70,kind:'pocket-ceiling'},
  {x:40,y:500,w:60,h:160,kind:'pocket-wall'},
  {x:9300,y:380,w:300,h:70,kind:'pocket-ceiling'},
  {x:9540,y:450,w:60,h:140,kind:'pocket-wall'}
];

// Three small optional caches are the only spaces outside the starting jump.
// They never interrupt or gate the main traversal route.
export const ABILITY_GATED_BLOCKS = [
  {x:1740,y:390,w:260,h:70,kind:'cache',requires:'doubleJump'},
  {x:3600,y:350,w:280,h:70,kind:'cache',requires:'doubleJump'},
  {x:7800,y:470,w:260,h:70,kind:'cache',requires:'doubleJump'}
];

export const BOSS_ARENA = {
  x:5890,y:350,w:1300,h:250,floorY:600,
  triggerX:6000,leftGateX:5905,rightGateX:7133,gateWidth:42,
  gateStartY:80,gateClosedY:350,gateHeight:250,
  boss:{type:'boss',x:6500,y:500,w:120,h:100,health:18}
};

export const RECESSES = [
  {x:110,y:290,w:780,h:370,floorY:660,ceilingY:290,openSide:'right'},
  {x:1340,y:390,w:780,h:230,floorY:620,ceilingY:390,openSide:'left'},
  {x:2460,y:460,w:850,h:220,floorY:680,ceilingY:460,openSide:'right'},
  {x:3650,y:330,w:1040,h:280,floorY:610,ceilingY:330,openSide:'left'},
  {x:5030,y:430,w:590,h:240,floorY:670,ceilingY:430,openSide:'right'},
  {x:5980,y:350,w:1100,h:250,floorY:600,ceilingY:350,openSide:'left'},
  {x:7440,y:450,w:700,h:210,floorY:660,ceilingY:450,openSide:'right'},
  {x:8500,y:360,w:980,h:230,floorY:590,ceilingY:360,openSide:'left'},
  {x:100,y:500,w:240,h:160,floorY:660,ceilingY:500,openSide:'right',pocket:true},
  {x:9300,y:450,w:240,h:140,floorY:590,ceilingY:450,openSide:'left',pocket:true}
];

export const PLATFORMS = [
  ...FOUNDATION_BLOCKS,
  ...OVERHEAD_BLOCKS,
  ...INTERIOR_BLOCKS,
  ...POCKET_BLOCKS,
  ...ABILITY_GATED_BLOCKS
];

export const TRAPS = [
  {x:1150,y:690,w:140,h:110},
  {x:2220,y:710,w:140,h:90},
  {x:3410,y:700,w:140,h:100},
  {x:4790,y:700,w:160,h:100},
  {x:5730,y:700,w:160,h:100},
  {x:7190,y:700,w:160,h:100},
  {x:8250,y:700,w:150,h:100}
];

export const ENEMY_SPAWNS = [
  {type:'crawler',x:500,y:550,w:30,h:40,patrol:true,patrolRange:90},
  {type:'roller',x:700,y:632,w:46,h:28,patrol:true,patrolRange:55,patrolDirection:-1},
  {type:'hopper',x:1390,y:575,w:34,h:45},
  {type:'brute',x:1830,y:557,w:58,h:63},
  {type:'drone',x:1450,y:450,w:42,h:30},
  {type:'roller',x:2500,y:652,w:46,h:28,patrol:true,patrolRange:90},
  {type:'crawler',x:3060,y:640,w:30,h:40,patrol:true,patrolRange:30,patrolDirection:-1},
  {type:'crawler',x:3650,y:570,w:30,h:40},
  {type:'brute',x:4240,y:547,w:58,h:63},
  {type:'drone',x:4140,y:410,w:42,h:30},
  {type:'roller',x:5000,y:642,w:46,h:28,patrol:true,patrolRange:70},
  {type:'hopper',x:5550,y:625,w:34,h:45},
  {type:'roller',x:7420,y:632,w:46,h:28,patrol:true,patrolRange:65},
  {type:'crawler',x:8040,y:550,w:30,h:40},
  {type:'hopper',x:8460,y:545,w:34,h:45},
  {type:'brute',x:9200,y:527,w:58,h:63},
  {type:'drone',x:8830,y:390,w:42,h:30}
];

export const CONDUITS = [
  {x:330,y:608,w:28,h:52,charge:24,energyPerHit:4},
  {x:3990,y:488,w:28,h:52,charge:24,energyPerHit:4},
  {x:7700,y:538,w:28,h:52,charge:24,energyPerHit:4}
];

export const JUNK_PILES = [
  {x:500,y:544,w:76,h:46,health:5,scrapValue:24},
  {x:1560,y:504,w:82,h:46,health:5,scrapValue:26},
  {x:2700,y:564,w:84,h:46,health:6,scrapValue:32},
  {x:3190,y:564,w:76,h:46,health:5,scrapValue:26},
  {x:3710,y:564,w:86,h:46,health:6,scrapValue:34},
  {x:5200,y:554,w:80,h:46,health:5,scrapValue:28},
  {x:8950,y:474,w:88,h:46,health:6,scrapValue:36},
  {x:7600,y:544,w:78,h:46,health:5,scrapValue:28},
  {x:8750,y:474,w:90,h:46,health:6,scrapValue:38},
  {x:9300,y:500,w:120,h:90,health:8,scrapValue:60,minimumDamage:2,gate:true}
];
