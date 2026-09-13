// Every colour in the game, in one place.
//
// The round happens at dawn, so the palette is built around a low sun: cool
// blue overhead falling to amber and peach at the horizon, warm light on the
// east faces of buildings, and haze in the distance.
var C = {
  /* early-morning sky, top to bottom */
  skyTop:'#3f7fb8', skyMid:'#8fb6d4', skyLow:'#f2d3a8', skyGlow:'#ffc98a',
  sun:'#fff0c2', sunHalo:'rgba(255,200,120,0.40)',

  /* distance: everything far away sits in warm mist */
  haze:'#e8dcc4', hazeSoft:'rgba(232,220,196,0.85)',
  far:'#a8a89e', far2:'#918f8a',

  field:'#a8bc6c', field2:'#8fa65a', dryGrass:'#cbbd7c',
  shoulder:'#c9ae7c', road:'#6b6660', roadLite:'#78736c', patch:'#5a5650',
  lane:'#efe2ad',
  ink:'#23252a',

  /* warm morning light and the shadow it throws */
  warm:'rgba(255,196,120,0.20)', warmStrong:'rgba(255,186,104,0.34)',
  coolShadow:'rgba(48,62,96,0.16)',

  pin:'#ff8a15', pinDone:'#22bd58',
  paper:'#fdfbf0', paperInk:'#c4452f',
  hud:'#ffffff', hudDim:'rgba(255,255,255,0.66)', panel:'rgba(14,20,30,0.9)',
  bad:'#e8503a', good:'#22bd58', gold:'#ffc63a',
  saffron:'#ff9933', green:'#138808', chakra:'#000088',

  /* landmarks */
  temple:'#f2e2c4', templeTrim:'#d4553a', templeGold:'#e8b93a',
  school:'#f0e6d0', schoolTrim:'#3f7fbf',
  govt:'#e8e0cc', govtTrim:'#9c3f34'
};
var WALLS = ['#f6e7c6','#dfeadb','#efd9c6','#d9e8f2','#eadfef','#f2e3cf','#cfe3d8'];
var ROOFS = ['#b4573f','#7d8a97','#9c6b4a','#5f7f8c','#a8724f'];

export { C, WALLS, ROOFS };
