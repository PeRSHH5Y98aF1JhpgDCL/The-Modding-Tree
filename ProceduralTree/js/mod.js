var wordlistII=Object.keys(wordList)
function randfromarr(x) {return x[Math.floor(Math.random()*x.length)]}
var ranWrd=()=>randfromarr(wordlistII)
var nameList=["No Man's Tree", "Tree of Trees", "Tree citizen", "Meta tree", "Some tree, alright?", "7ree", "How many references can i squeeze in here? tree", "sometree?", "voidtree", "tetree", "Antreematter dimensions", "Treemps", "tree^2:beyond tree",
"tree void", "TREE(tree)", "nulltreefication", "7|-33", ((x)=>{console.log("don't look at the code");return x})(ranWrd()+" "+ranWrd()+' tree'), "Tree^^Tree"]
let modInfo = {
	name: nameList[Math.floor(Math.random()*nameList.length)],
	id: "metatreeII",
	author: randfromarr(wordlistII)+" "+randfromarr(wordlistII),
	pointsName: "points",
	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal (10), // Used for hard resets and new players
	
	offlineLimit: 1,  // In hours
}

// Set your version in num and name
let VERSION = {
	num: Math.round(Math.random()*10)+"."+Math.round(Math.random()*10),
	name: randfromarr(wordlistII)+" "+randfromarr(wordlistII),
}

let changelog = `<h1>Changelog:</h1><br>
	<h3>`+'v'+Math.round(Math.random()*10)+"."+Math.round(Math.random()*10)+`</h3><br>
		- Added `+ranWrd()+' '+ranWrd()+`<br>
		- Added `+ranWrd()+' '+ranWrd()+`<br>
		- Added `+ranWrd()+' '+ranWrd()+`<br>
		- Added `+ranWrd()+' '+ranWrd()+`<br>
		- Added `+ranWrd()+' '+ranWrd()

let winText = `...did you cheat or something?`

// If you add new functions anywhere inside of a layer, and those functions have an effect when called, add them here.
// (The ones here are examples, all official functions are already taken care of)
var doNotCallTheseFunctionsEveryTick = ["blowUpEverything"]

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

// Determines if it should show points/sec
function canGenPoints(){
	return true
}

// Calculate points/sec!
function getPointGen() {
	if(!canGenPoints())
		return new Decimal(0)

	let gain = new Decimal(1)
	if (getNonBoringLayers) {
		tempLayers=getNonBoringLayers()
		Object.keys(tempLayers).forEach((x)=>{
			let curLayer=tempLayers[x]
			if (curLayer.effect) {
				if (curLayer.effect().allNormalBelow) {
					gain=gain.mul(curLayer.effect().allNormalBelow)
				}
				if (curLayer.effect().pointsMult) {
					gain=gain.mul(curLayer.effect().pointsMult)
				}
			}
		})
	}
	return gain
}

// You can add non-layer related variables that should to into "player" and be saved here, along with default values
function addedPlayerData() { return {
}}

// Display extra things at the top of the page
var displayThings = [
]

// Determines when the game "ends"
function isEndgame() {
	return false
}



// Less important things beyond this point!

// You can change this if you have things that can be messed up by long tick lengths
function maxTickLength() {
	return(3600) // Default is 1 hour which is just arbitrarily large
}

// Use this if you need to undo inflation from an older version. If the version is older than the version that fixed the issue,
// you can cap their current resources with this.
function fixOldSave(oldVersion){
}