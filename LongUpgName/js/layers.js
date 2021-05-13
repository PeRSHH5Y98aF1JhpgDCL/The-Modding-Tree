addLayer("p", {
    name: "prestige", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
    }},
    color: "#4BDC13",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "prestige points", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.5, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
	upgrades:{
		11:{
			title:"Gigantic name that does nothing but increase the size of the upgrade",
			description() {return "Multiply point gain by the length of the title and the description of this upgrade"+(hasUpgrade('p',22)?", The \"Currently:\" is duplicated, this upgrade's effect is exponentiated by the log10 of (log10 of (this upgrade's effect plus one) plus one) plus one, and this effect does nothing but to increase the length to increase the effect of this upgrade":"")+(hasUpgrade('p',23)?', this upgrade\'s effect is multiplied by (the natural logarithm of points plus one) plus one(before [2,2]), this upgrade\'s is multiplied by eleven and i have ran out of ideas please help':'')+(hasUpgrade('p',21)?"<br>Currently: "+format(upgradeEffect('p',11))+(hasUpgrade('p',22)?', ^'+format(upgradeEffect('p',22)):'')+(hasUpgrade('p',23)?', '+format(upgradeEffect('p',23))+', 11':''):"").repeat(hasUpgrade('p',22)?2:1)},
			effect() {
					let x=new Decimal(temp.p.upgrades[11].description.length+temp.p.upgrades[11].title.length)
						if (hasUpgrade('p',23)) x=x.mul(upgradeEffect('p',23)).mul(11)
						if (hasUpgrade('p',22)) x=x.pow(upgradeEffect('p',22))
					return x},
			cost:1,
			style:{width: "300px"}
		},
		21:{
			title() {return"Currently: "+player.p.upgrades.includes(21)},
			description: "Appends a \"Currently:[effect]\" to [1,1]",
			cost:50
		},
		22:{
			title() {return"Hidden effects are fun"},
			description: "Adds a bunch of effects to [1,1]",
			cost:100,
			unlocked() {return hasUpgrade('p',21)},
			effect() {return upgradeEffect('p',11).add(1).log(10).add(1).log(10).add(1)}
		},
		23:{
			title() {return"Hidden effects are fun II"},
			description: "[1,1] is better",
			cost:1000,
			unlocked() {return hasUpgrade('p',22)},
			effect() {return player.points.add(1).ln().add(1)}
		}
	},
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "p", description: "P: Reset for prestige points", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true}
})
