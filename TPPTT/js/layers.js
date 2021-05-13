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
		mult=mult.mul(temp.c.buyables[11].effect)
		if (hasUpgrade('p',13)) mult=mult.mul(4)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
	upgrades:{
		rows:5,
		cols:5,
		11: {
			description: "Multiply point gain by (the logarithm of points plus one) plus one squared",
			cost: new Decimal(1)
		},
		12: {
			description: "1,1's effect is squared",
			cost: new Decimal(10)
		},
		13: {
			description: "Unlock the construction firm, multiply prestige point gain by 4",
			cost: new Decimal(25),
			onPurchase() {
				player.c.unlocked=true
			},
		},
		14: {
			description: "Prestige points multiply effective points in 1,1",
			cost: new Decimal(10000),
			unlocked() {return player.b.unlocked}
		}
	},
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "p", description: "P: Reset for prestige points", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true}
})
addLayer("c", {
    name: "Construction Firm", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "C", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
    }},
	branches: ['p'],
    color: "#784D00",
    requires: new Decimal(60), // Can be a function that takes requirement increases into account
    resource: "Brown resource", // Name of prestige currency
    baseResource: "Prestige points", // Name of resource prestige is based on
    baseAmount() {return player.p.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 1, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
	buyables: {
		rows: 3,
		cols: 3,
		11: {
			cost(x) { return new Decimal(1).mul(x || getBuyableAmount(this.layer, this.id)) },
			title: "Prestige",
			display() { return `bought:${format(getBuyableAmount(this.layer, this.id))}
			cost:${format(temp[this.layer].buyables[this.id].cost)}
			effect:Multiplies point and prestige point gain by ${format(temp[this.layer].buyables[this.id].effect)}`},
			effect() {
				return getBuyableAmount('c',11).add(1)
			},
			cost() {return new Decimal(4).pow(getBuyableAmount('c',11))},
			canAfford() { return player[this.layer].points.gte(this.cost()) },
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost())
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
		},
		12: {
			cost(x) { return new Decimal(1).mul(x || getBuyableAmount(this.layer, this.id)) },
			title: "Boosters",
			display() { return `bought:${format(getBuyableAmount(this.layer, this.id))}
			cost:${format(temp[this.layer].buyables[this.id].cost)}
			effect:Increases booster base by ${format(temp[this.layer].buyables[this.id].effect)}`},
			effect() {
				return getBuyableAmount('c',this.id).div(10)
			},
			cost() {return new Decimal(5).pow(getBuyableAmount('c',this.id).add(2))},
			canAfford() { return player[this.layer].points.gte(this.cost()) },
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost())
				if (!player.b.unlocked) player.b.unlocked=true
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
		},
	},
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "c", description: "C: Reset for brown resouce", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true}
})
addLayer("b", {
    name: "boosters", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "B", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
    }},
	layerShown() {return player.b.unlocked},
    color: "#6e64c4",
    requires: new Decimal(100), // Can be a function that takes requirement increases into account
	base: new Decimal(10),
    resource: "boosters", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 1.1, // Prestige currency exponent
	effect() {
		return temp.b.getBoostBase.pow(player.b.points)
	},
	effectDescription: ()=>"which multiplies point gain by "+format(temp.b.effect),
	getBoostBase() {
		let base=new Decimal(2)
		base=base.add(temp.c.buyables[12].effect)
		return base
	},
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
	branches: ['p','c'],
	upgrades:{
		rows:5,
		cols:5,
	},
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "b", description: "B: Reset for boosters", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
})