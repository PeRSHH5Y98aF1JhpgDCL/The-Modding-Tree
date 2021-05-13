addLayer("tree-tab", {
    name: "prestige", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
    }},
    color: "#FFFFFF",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "prestige points", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "none", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.5, // Prestige currency exponent
	tabFormat:{
		Main:{
			content:[['raw-html', 'Hey, here\'s my meta-thing for all my mods<br>i sure hope i can finish this before my motivation instantly gets nullified<br>Points do nothing<br>i used tmt because:can\'t be bothered with html']]
		},
		"Prestige Tree Extreme":{
			content:[['raw-html', 'This mod is like, okay?<br>Every normal layer\'s exponent is reduced *0.9 and static increased *(1/0.9)<br>Balanced up to 2 row 3 layers<br><br><a href="./PTextreme/index.html">Play here</a>']]
		},
		"The Omega Tree":{
			content:[['raw-html', 'This mod is decent.<br>This was supposed to go to OmegaNum\'s limit(and actually uses omeganum)<br>Not actually balanced.<br><br><a href="./OmegaTree/index.html">Play here</a>']]
		},
		"The Knockoff Tree":{
			content:[['raw-html', 'This mod is actually good.<br>This was my first mod, and was actually decent.<br>Endgame: no idea, haven\'t tested yet<br><br><a href="./KnockoffTree/index.html">Play here</a>']]
		},
		"The Procedural Tree":{
			content:[['raw-html', 'This mod does not work<br>This was abandoned due to Vue sucking and just not working with random layers<br>You can still dive through the code<br><br>[./ProceduralTree]']]
		},
		"[Unnamed]":{
			content:[['raw-html', 'This mod is bad<br>This was an attempt to beat the length of the largest upgrade.<br>Endgame: e6 prestige points<br><br><a href="./LongUpgName/index.html">Play here</a>']]
		},
		"The Modding Tree Plus I":{
			content:[['raw-html', 'This mod does not work<br>This was abandoned due to me not being bothered to finish the number library<br>You can still dive through the code<br><br>[./TMTplusi]']]
		},
		"TPPTT":{
			content:[['raw-html', 'This mod is bad<br>This was a mod trying to combine the perfect tower 2 and TMT<br>has 2 about features<br>Endgame: no idea<br><br><a href="./LongUpgName/index.html">Play here</a>']]
		}
	},
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(0)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "sdfdsf", description: "There's no secrets here", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true}
})
