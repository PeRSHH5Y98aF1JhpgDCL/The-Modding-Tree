function d(x) {return new Decimal(x)}
function derivativeFormula(num,time,mult=d(1)) {
	return time.mul(mult).pow(num).div(num.factorial())
}
addLayer("d", {
    name: "Derivatives", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "D", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(1),
		time: new Decimal(0)
    }},
    color: "#4BDC13",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "derivatives", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 1.7, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
	getDeris() {
		return player.d.points
		.mul(temp.db.effect)
		.floor()
	},
	getMult() {
		return d(1).mul(d(3).pow(player.b.points))
	},
	tabFormat:{
		"Main":{
			content:["main-display","prestige-button","resource-display",["display-text",()=>{
				return `You have waited ${format(player.d.time)} in-game seconds<br>
						Derivative multiplier: x${format(temp.d.getMult)}<br>
						${player.d.points.gte(0)?"Derivative 1:"+format(derivativeFormula(temp.d.getDeris,player.d.time,temp.d.getMult)):''}<br>
					    ${player.d.points.gte(1)?"Derivative 2:"+format(derivativeFormula(temp.d.getDeris.sub(1),player.d.time,temp.d.getMult)):''}<br>
						${player.d.points.gte(2)?"Derivative 3:"+format(derivativeFormula(temp.d.getDeris.sub(2),player.d.time,temp.d.getMult)):''}<br>
						${player.d.points.gte(6)?'['+temp.d.getDeris.sub(6)+' hidden derivative'+(temp.d.getDeris.gt(7)?'s':'')+']<br>':''}
						${player.d.points.gte(3)?"Derivative "+format(temp.d.getDeris.sub(2).max(4))+':'+format(derivativeFormula(temp.d.getDeris.sub(3).min(2),player.d.time,temp.d.getMult)):''}<br>
						${player.d.points.gte(4)?"Derivative "+format(temp.d.getDeris.sub(1).max(5))+':'+format(derivativeFormula(temp.d.getDeris.sub(2).min(1),player.d.time,temp.d.getMult)):''}<br>
						${player.d.points.gte(5)?"Derivative "+format(temp.d.getDeris.max(6))+':'+format(derivativeFormula(d(0),player.d.time,temp.d.getMult)):''}<br>`
			}]]
		}
	},
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
	update(diff) {
		player.d.time=player.d.time.add(diff)
	},
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "d", description: "D: Reset for derivatives", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
	doReset(l) {
		if (!temp.d.resetsNothing)player.d.time=d(0)
		if (l!='d')layerDataReset('d')
	},
    layerShown(){return true},
	resetsNothing() {
		return hasMilestone('db',0)
	},
	canBuyMax(){
		return hasMilestone('db',1)
	},
})
addLayer("b", {
    name: "Boosters", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "B", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
		time: new Decimal(0)
    }},
	base:d(1.1),
    color: "#4444ff",
    requires: new Decimal(13), // Can be a function that takes requirement increases into account
    resource: "boosters", // Name of prestige currency
    baseResource: "derivatives", // Name of resource prestige is based on
    baseAmount() {return temp.d.getDeris}, // Get the current amount of baseResource
    type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 1.1, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
	tabFormat:{
		"Main":{
			content:["main-display","prestige-button","resource-display"]
		}
	},
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
	update(diff) {
		player.b.unlocked=player.b.unlocked||player.d.points.gte(13)
	},
	branches:['d'],
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "b", description: "B: Reset for boosters", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
	doReset() {
		player.d.time=d(0)
	},
    layerShown(){return true}
})
addLayer("db", {
    name: "Derivative Boosters", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "DB", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
		time: new Decimal(0)
    }},
	base:d(1.2),
    color: "#44aaff",
    requires: new Decimal(14), // Can be a function that takes requirement increases into account
    resource: "derivative boosters", // Name of prestige currency
    baseResource: "derivatives", // Name of resource prestige is based on
    baseAmount() {return temp.d.getDeris}, // Get the current amount of baseResource
    type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 1.1, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
	tabFormat:{
		"Main":{
			content:["main-display","prestige-button","resource-display",'milestones']
		}
	},
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
	update(diff) {
		player.db.unlocked=player.db.unlocked||player.d.points.gte(14)
	},
	branches:['d'],
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "s", description: "S: Reset for derivative boosters", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
	milestones:{
		0:{
				requirementDescription: "10 DBs",
				effectDescription: "Derivatives reset nothing",
				done() {return player.db.points.gte(10)}
		},
		1:{
				requirementDescription: "20 DBs",
				effectDescription: "Derivatives can be maxed",
				done() {return player.db.points.gte(20)}
		},
		2:{
				requirementDescription: "100 DBs",
				effectDescription: "Derivative Boosters reset nothing",
				done() {return player.db.points.gte(100)}
		},
		3:{
				requirementDescription: "500 DBs",
				effectDescription: "Derivative Boosters can be maxed",
				done() {return player.db.points.gte(500)}
		}
	},
	effect() {
		return new Decimal(1.2).pow(player.db.points)
	},
	effectDescription() {
		return 'which are multipling effective derivatives by '+format(temp.db.effect)+'.'
	},
	resetsNothing() {
		return hasMilestone('db',2)
	},
	canBuyMax() {
		return hasMilestone('db',3)
	},
    layerShown(){return player.db.unlocked}
})