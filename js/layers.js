addNode("C", { // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "C", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
	row:0,
	canClick:()=>true,
	onClick:()=>{player.points=player.points.add(getPointGen())},
	tooltip:()=>"Click to get points",
    layerShown(){return true},
	color:"#e26827"
})
function nd(x) {
	return new Decimal(x)
}
addLayer("p", {
    name: "prestige", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
    }},
	tooltip:()=>`${format(player.points)} points`,
    color: "#4BDC13",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "points", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "none", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
	abcd:"test",
    exponent: 0.5, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(0)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
	tabFormat: {
		"Upgrades": {
			content:[["display-text", ()=>`You have ${format(player.points)} points<br>[note:i would advise you to get an autoclicker]`],"upgrades"],
		},
		"Buyables": {
			content:[["display-text", ()=>`You have ${format(player.points)} points`],"buyables"],
			unlocked: ()=>hasUpgrade("p",31)||player.a.unlocked
		},
	},
	buyables: {
		rows: 3,
		cols: 3,
		11: {
				title: "Boost",
				description: "Multiply point gain by 1.1[pre-exp]",
				cost(x=getBuyableAmount("p",11)) {
					let y=new Decimal(1e8).mul(new Decimal(10).pow(x))
					if (y.gt(1e30)) {
						y=nd(10).pow(y.log10().pow(1.5).sub(130)).div(1e11)
					}
					return y
				},
				display() {
					return `${this.description}<br>Cost: <b>${format(this.cost())}</b><br>You have <b>${format(getBuyableAmount('p',11))}</b> of this`
				},
				effect:()=>(nd(1.1).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "points",
				currencyLocation:()=>{return window.player},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.gt(this.cost(getBuyableAmount("p", 11)))},
				buy:function() {
					(this.currencyLocation||(function() {return player[this.layer]}))().points.subEq(this.cost());
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return hasUpgrade('p',31)||player.a.unlocked
				},
		},
	},
	upgrades: {
		rows: 3,
		cols: 3,
		11: {
				title: "Start",
				description: "Increase point gain based on points",
				cost: new Decimal(20),
				effect:()=>(player.points.add(1).pow(hasUpgrade('p',23)?2:1).log10().add(1)),
				currencyDisplayName: "points",
				currencyLocation:()=>{return window.player},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.subEq(this.cost)},
			},
		12: {
				title: "Small inflate",
				description: "Square point gain",
				cost: new Decimal(100),
				effect:()=>2,
				currencyDisplayName: "points",
				currencyLocation:()=>{return window.player},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.subEq(this.cost)},
				unlocked:()=>hasUpgrade('p',11),
			},
		13: {
				title: "Bigger inflate",
				description: "Raise point gain by 1.75",
				cost: new Decimal(2500),
				effect:()=>1.75,
				currencyDisplayName: "points",
				currencyLocation:()=>{return window.player},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.subEq(this.cost)},
				unlocked:()=>hasUpgrade('p',12)
			},
		21: {
				title: "Basic boost",
				description: "Multiply point gain by 1.5[pre-exponents]",
				cost: new Decimal(50000),
				effect:()=>1.5,
				currencyDisplayName: "points",
				currencyLocation:()=>{return window.player},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.subEq(this.cost)},
				unlocked:()=>hasUpgrade('p',13)
			},
		22: {
				title: "Basic boost II",
				description: "Upgrade [2,1] is 33% better",
				cost: new Decimal(250000),
				effect:()=>1.5,
				currencyDisplayName: "points",
				currencyLocation:()=>{return window.player},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.subEq(this.cost)},
				unlocked:()=>hasUpgrade('p',21)
			},
		23: {
				title: "Basic boost III",
				description: "Raise point gain by 2 in [1,1] formula",
				cost: new Decimal(10000000),
				effect:()=>1.5,
				currencyDisplayName: "points",
				currencyLocation:()=>{return window.player},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.subEq(this.cost)},
				unlocked:()=>hasUpgrade('p',22)
			},
		31: {
				title: "A thing?????????",
				description: "Get a buyable",
				cost: new Decimal(1e9),
				effect:()=>1.5,
				currencyDisplayName: "points",
				currencyLocation:()=>{return window.player},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.subEq(this.cost)},
				unlocked:()=>hasUpgrade('p',23)
			},
		32: {
				title: "ZZZzzz",
				description: "Autoclick ten times per second",
				cost: new Decimal(1e9),
				effect:()=>1.5,
				currencyDisplayName: "points",
				currencyLocation:()=>{return window.player},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.subEq(this.cost)},
				unlocked:()=>hasUpgrade('p',23)
			},
		33: {
				title: "A new layer",
				description: "Get a layer",
				cost: new Decimal(1e10),
				effect:()=>1.5,
				currencyDisplayName: "points",
				currencyLocation:()=>{return window.player},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().points.subEq(this.cost)},
				unlocked:()=>hasUpgrade('p',31)&&hasUpgrade('p',32),
				onPurchase() {
					player.a.unlocked=true
				}
			},
		},
	componentStyles: {
		"prestige-button"() { return {'display': 'none'} },
		"main-display"() { return {'display': 'none'} },
		"resource-display"() { return {'fontSize': '1.5em'} },
	},
	branches:["C"],
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "p", description: "P: Reset for prestige points", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true},
	doReset() {
		layerDataReset(this.layer,hasMilestone('di',5)?['upgrades','buyables']:[])
	},
});
function fn(x) {return ()=>x}
function maxAllDims() {
	[11,12,13,14,21,22,23,24].forEach((x,i)=>{
		let y=player.a.antimatter.div(layers.a.initCosts[i]).log10().div(layers.a.costInc[i].log10()).floor().add(1)
		if (isNaN(y.sign) || isNaN(y.layer) || isNaN(y.mag)) {
			y=nd(0)
		}
		if (y.gt(player.a.buyables[x])&&layers.a.buyables[x].unlocked()) {
			if (!hasUpgrade('a',13)) player.a.antimatter=player.a.antimatter.sub(layers.a.buyables[x].cost(y.sub(1)))
			setBuyableAmount('a', x, y)
			//console.log(y.sub(player.a.buyables[x])+'')
		}
	});
}
function maxAllThirdrow() {
	[31,32,33].forEach((x,i)=>{
		let y=player.a.antimatter.div(layers.a.thirdRowCosts[i][0]).log10().div(layers.a.thirdRowCosts[i][1].log10()).root(2).floor().add(1)
		if (isNaN(y.sign) || isNaN(y.layer) || isNaN(y.mag)) {
			y=nd(0)
		}
		//console.log(y)
		if (y.gt(player.a.buyables[x])&&layers.a.buyables[x].unlocked()) {
			setBuyableAmount('a', x, y)
			//console.log(y.sub(player.a.buyables[x])+'')
		}
	});
}
addLayer("a", {
    name: "Antimatter", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "AD", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
		antimatter: nd(10),
		firstDim: nd(0),
		secondDim: nd(0),
		thirdDim: nd(0),
		fourthDim: nd(0),
		fifthDim: nd(0),
		sixthDim: nd(0),
		seventhDim: nd(0),
		eighthDim: nd(0),
    }},
	getPerdim() {
		return nd(2).mul(nd(1.05).pow(hasUpgrade('ip',22)?1.5:1).pow(getBuyableAmount('a',32)))
	},
	getMult() {
		let perDim=layers.a.getPerdim()
		return nd(1)
		.mul(buyableEffect('a',31))
		.mul(hasUpgrade('a',11)?upgradeEffect('a',11):nd(1))
		.mul(hasUpgrade('a',12)?upgradeEffect('a',12):nd(1))
		.mul(perDim.pow(getBuyableAmount('a',31).mul(2).add(player.a.points.add(getBuyableAmount('a',33)).mul(0.13750352374993502))))
		.mul(hasUpgrade('a',21)?nd(1.1).pow(getBuyableAmount('p',11)).pow(2.66*1.75):nd(1))
		.mul(temp.di.effect)
	},
	doNotCallTheseFunctionsEveryTick:["maxAllDims"],
	getAMGain() {
		let perDim=layers.a.getPerdim()
		//console.log(perDim+'')
		let genericMult=layers.a.getMult()
		let amGain=player.a.firstDim.add(perDim.pow(getBuyableAmount('a',11))).mul(genericMult)
		if (amGain.gt("1e308")) amGain=amGain.root(2).mul(1e154)
		if (amGain.gt("1e1000")) amGain=amGain.root(4).mul(1e750)
		return amGain
	},
	update(diff) {
		if (!player.a.unlocked) return;
		let perDim=layers.a.getPerdim()
		//console.log(perDim+'')
		let genericMult=layers.a.getMult()
		let amGain=player.a.firstDim.add(perDim.pow(getBuyableAmount('a',11))).mul(genericMult)
		if (amGain.gt("1e308")) amGain=amGain.root(2).mul(1e154)
		  player.a.antimatter.addEq(amGain.mul(diff))
		  player.a.firstDim.addEq(player.a.secondDim.add(getBuyableAmount('a',12)).mul(diff).mul(perDim.pow(getBuyableAmount('a',12))).mul(genericMult))
		  player.a.secondDim.addEq(player.a.thirdDim.add(getBuyableAmount('a',13)).mul(diff).mul(perDim.pow(getBuyableAmount('a',13))).mul(genericMult))
		  player.a.thirdDim.addEq(player.a.fourthDim.add(getBuyableAmount('a',14)).mul(diff).mul(perDim.pow(getBuyableAmount('a',14))).mul(genericMult))
		  player.a.fourthDim.addEq(player.a.fifthDim.add(getBuyableAmount('a',21)).mul(diff).mul(perDim.pow(getBuyableAmount('a',21))).mul(genericMult))
		   player.a.fifthDim.addEq(player.a.sixthDim.add(getBuyableAmount('a',22)).mul(diff).mul(perDim.pow(getBuyableAmount('a',22))).mul(genericMult))
		 player.a.sixthDim.addEq(player.a.seventhDim.add(getBuyableAmount('a',23)).mul(diff).mul(perDim.pow(getBuyableAmount('a',23))).mul(genericMult))
		player.a.seventhDim.addEq(player.a.eighthDim.add(getBuyableAmount('a',24)).mul(diff).mul(perDim.pow(getBuyableAmount('a',24))).mul(genericMult))
	},
	tooltip:()=>`${format(player.a.antimatter)} antimatter`,
    color: "#FF0000",
	base:nd(1.2),
    requires: new Decimal(1e10), // Can be a function that takes requirement increases into account
    resource: "free tickspeed upgrades", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
	abcd:"test",
    exponent: 1.1, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
	doReset(resLayer) {
		if (resLayer=='a') return;
		layerDataReset('a',hasMilestone('di',5)?['upgrades']:[]);
		//setBuyableAmount(31,nd(7))
	},
	canBuyMax:()=>true,
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
	tabFormat: {
		"Upgrades": {
			content:["main-display", ["display-text",()=>`(${format(player.a.points.mul(0.13750352374993502))} effective purchased dimensions)`], "prestige-button", ["display-text",()=>`You have ${format(player.a.antimatter)} antimatter`],"upgrades"],
		},
		"Dimensions": {
			content:["main-display", ["display-text",()=>`(${format(player.a.points.mul(0.13750352374993502))} effective purchased dimensions)`],
			"prestige-button", ["display-text",()=>`You have ${format(player.a.antimatter)} antimatter`], ["clickables", 100], "buyables"],
			unlocked: fn(true)
		},
	},
	initCosts:[10,100,1e4,1e7,1e9,1e13,1e18,1e24].map((x)=>nd(x)),
	costInc:[1e3,1e4,1e5,1e6,1e8,1e10,1e12,1e15].map((x)=>nd(x)),
	clickables: {
		rows:1,
		cols:1,
		11:{
			title:"Max All",
			display:()=>`Max All(M)`,
			canClick:()=>true,
			onClick() {
				maxAllDims()
			}
		}
	},
	automate() {
		if (hasUpgrade('a',13)) maxAllDims()
		if (hasMilestone('di',7)) maxAllThirdrow()
	},
	thirdRowCosts:[[1e2,2e2],[1e140,1e50],[1,1.1]].map((x)=>x.map(y=>nd(y))),
	buyables: {
		rows: 3,
		cols: 4,
		11: {
				title: "First Dimension",
				description: "Get a first dimension",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(10).mul(new Decimal(1e3).pow(x))
				},
				display() {
					return `${this.description}<br>Cost: <b>${format(this.cost())}</b><br>You have bought <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this dimension<br>(${format(getBuyableAmount(this.layer,this.id).add(player.a.firstDim))} total)`
				},
				effect:()=>(nd(2).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function(x=getBuyableAmount(this.layer, this.id)) {return this.currencyLocation().gte(this.cost(x))},
				buy:function() {
					(this.currencyLocation)().subEq(this.cost());
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer,this.id).add(1))
				},
				unlocked() {
					return player[this.layer].unlocked
				},
		},
		12: {
				title: "Second Dimension",
				description: "Get a second dimension",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(100).mul(new Decimal(1e4).pow(x))
				},
				display() {
					return `${this.description}<br>Cost: <b>${format(this.cost())}</b><br>You have bought <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this dimension<br>(${format(getBuyableAmount(this.layer,this.id).add(player.a.secondDim))} total)`
				},
				effect:()=>(nd(2).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return this.currencyLocation().gte(this.cost())},
				buy:function() {
					(this.currencyLocation)().subEq(this.cost());
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return getBuyableAmount("a",31).gt(0)
				},
		},
		13: {
				title: "Third Dimension",
				description: "Get a third dimension",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(1e4).mul(new Decimal(1e5).pow(x))
				},
				display() {
					return `${this.description}<br>Cost: <b>${format(this.cost())}</b><br>You have bought <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this dimension<br>(${format(getBuyableAmount(this.layer,this.id).add(player.a.thirdDim))} total)`
				},
				effect:()=>(nd(2).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return this.currencyLocation().gte(this.cost())},
				buy:function() {
					(this.currencyLocation)().subEq(this.cost());
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return getBuyableAmount("a",31).gt(1)
				},
		},
		14: {
				title: "Fourth Dimension",
				description: "Get a fourth dimension",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(1e7).mul(new Decimal(1e6).pow(x))
				},
				display() {
					return `${this.description}<br>Cost: <b>${format(this.cost())}</b><br>You have bought <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this dimension<br>(${format(getBuyableAmount(this.layer,this.id).add(player.a.fourthDim))} total)`
				},
				effect:()=>(nd(2).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return this.currencyLocation().gte(this.cost())},
				buy:function() {
					(this.currencyLocation)().subEq(this.cost());
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return getBuyableAmount("a",31).gt(2)
				},
		},
		21: {
				title: "Fifth Dimension",
				description: "Get a fifth dimension",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(1e9).mul(new Decimal(1e8).pow(x))
				},
				display() {
					return `${this.description}<br>Cost: <b>${format(this.cost())}</b><br>You have bought <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this dimension<br>(${format(getBuyableAmount(this.layer,this.id).add(player.a.fifthDim))} total)`
				},
				effect:()=>(nd(2).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return this.currencyLocation().gte(this.cost())},
				buy:function() {
					(this.currencyLocation)().subEq(this.cost());
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return getBuyableAmount("a",31).gt(3)
				},
		},
		22: {
				title: "Sixth Dimension",
				description: "Get a sixth dimension",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(1e13).mul(new Decimal(1e10).pow(x))
				},
				display() {
					return `${this.description}<br>Cost: <b>${format(this.cost())}</b><br>You have bought <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this dimension<br>(${format(getBuyableAmount(this.layer,this.id).add(player.a.sixthDim))} total)`
				},
				effect:()=>(nd(2).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return this.currencyLocation().gte(this.cost())},
				buy:function() {
					(this.currencyLocation)().subEq(this.cost());
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return getBuyableAmount("a",31).gt(4)
				},
		},
		23: {
				title: "Seventh Dimension",
				description: "Get a seventh dimension",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(1e18).mul(new Decimal(1e12).pow(x))
				},
				display() {
					return `${this.description}<br>Cost: <b>${format(this.cost())}</b><br>You have bought <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this dimension<br>(${format(getBuyableAmount(this.layer,this.id).add(player.a.seventhDim))} total)`
				},
				effect:()=>(nd(2).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return this.currencyLocation().gte(this.cost())},
				buy:function() {
					(this.currencyLocation)().subEq(this.cost());
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return getBuyableAmount("a",31).gt(5)
				},
		},
		24: {
				title: "Eighth Dimension",
				description: "Get a eighth dimension",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(1e24).mul(new Decimal(1e15).pow(x))
				},
				display() {
					return `${this.description}<br>Cost: <b>${format(this.cost())}</b><br>You have bought <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this dimension<br>(${format(getBuyableAmount(this.layer,this.id).add(player.a.eighthDim))} total)`
				},
				effect:()=>(nd(2).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return this.currencyLocation().gte(this.cost())},
				buy:function() {
					(this.currencyLocation)().subEq(this.cost());
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return getBuyableAmount("a",31).gt(6)
				},
		},
		31: {
				title: "Dimension Boost",
				description: "Get a new dimension[until dim8] and add 2 effective bought dimensions<br>[note:doesn't reset dimensions]",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(1e2).mul(new Decimal(2e2).pow(x.pow(2)))
				},
				display() {
					return `${this.description}<br>Requires: <b>${format(this.cost())}</b><br>You have <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this upgrade`
				},
				effect:()=>(nd(3).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return this.currencyLocation().gte(this.cost())},
				buy:function() {
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return player[this.layer].unlocked
				},
		},
		32: {
				title: "Broken Galaxy",
				description: "Multiplier per dimension is increased by *1.05",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(1e140).mul(new Decimal(1e50).pow(x.pow(2)))
				},
				display() {
					return `${this.description}<br>Requires: <b>${format(this.cost())}</b><br>You have <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this upgrade`
				},
				effect:()=>(nd(3).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return this.currencyLocation().gte(this.cost())},
				buy:function() {
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return player[this.layer].unlocked
				},
		},
		33: {
				title: "Infinity Tickspeed",
				description: "Get a tickspeed upgrade",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					return new Decimal(1).mul(new Decimal(1.1).pow(x.pow(2)))
				},
				display() {
					return `${this.description}<br>Requires: <b>${format(this.cost())}</b><br>You have <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this upgrade`
				},
				effect:()=>(0),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return this.currencyLocation().gte(this.cost())},
				buy:function() {
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				},
				unlocked() {
					return hasUpgrade('ip',21)
				},
		},
	},
	upgrades: {
		rows: 3,
		cols: 3,
		11: {
				title: "Inversed Point Buff",
				description: "Increase dimension production based on points",
				cost: new Decimal(1e10),
				effect:()=>(player.points.add(1)).log10().add(1),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			},
		12: {
				title: "Recursed Antimatter",
				description: "Increase dimension production based on antimatter",
				cost: new Decimal(1e70),
				effect:()=>temp.a.effect,
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
				unlocked() {return hasUpgrade('a',11)}
			},
		13: {
				title: "Boosted Antimatter",
				description: "Antimatter point boost formula is better;Antimatter dimensions cost nothing and autobuys",
				cost: new Decimal(1e210),
				effect:()=>(player.a.antimatter.add(1)).root(50),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
				unlocked() {return hasUpgrade('a',12)}
			},
		21: {
				title: "Antimatter Synergy II",
				description: "PB[1,1] affects dimensions[after point exponents]",
				cost: new Decimal("1e390"),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
				unlocked() {return hasUpgrade('a',13)}
			},
		22: {
				title: "Boosted Antimatter III",
				description: "Antimatter boost formula is <b>SIGNIFICANTLY</b> better.<br>Getting Tickspeed resets nothing.",
				cost: new Decimal("1e425"),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				effect:()=>(player.a.antimatter.add(1).root(30)),
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
				unlocked() {return hasUpgrade('a',21)}
		},
		23: {
				title: "Paradigm spike",
				description: "Get a new layer",
				cost: new Decimal("1e635"),
				currencyDisplayName: "AM",
				currencyLocation:()=>{return player.a.antimatter},
				effect:()=>(player.a.antimatter.add(1).root(30)),
				canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
				pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
				unlocked() {return hasUpgrade('a',22)},
				onPurchase() {
					player.di.unlocked=true
				},
		},
	},
	resetsNothing() {
		return hasUpgrade('a',22)
	},
	componentStyles: {
	},
	branches:["p"],
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "t", description: "T: Reset for tickspeed", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
		{key: "m", description: "M: Max All antimatter dimensions", onPress(){ maxAllDims() }},
    ],
    layerShown(){return player.a.unlocked},
	effect() {
		let temp=player.a.antimatter.add(1).log10().pow(2)
		if (hasUpgrade("a",13)) temp=temp.mul(upgradeEffect('a',13))
		if (hasUpgrade("a",22)) temp=temp.mul(upgradeEffect('a',22))
		if (temp.gt(1) && player.a.unlocked) {return (temp)}
		else {return nd(1)}
	},
	autoPrestige() {
		return temp.a.resetsNothing&&hasMilestone('di',7)
	},
});
addLayer("bd", {
	name: "Gain Breakdown",
	row: "side",
	tooltip() {
		return "Check Stats/Settings"
	},
	resource: "...why are you looking at the code",
	tabFormat: {
		"Points":{content:[["display-text",()=>{return `Point gain:${format(getPointGen())}
														<br>Base gain:1
														${hasUpgrade('p',11)?"<br>PU[1,1] bonus:"+format(upgradeEffect('p',11)):""}
														${hasUpgrade('p',21)?"<br>PU[2,1] bonus:*1.5":""}
														${getBuyableAmount('p',11).gt(0)?"<br>PB[1,1] bonus:*"+format(buyableEffect('p',11)):""}
														${hasUpgrade('p',12)?"<br>PU[1,2] bonus:"+(hasUpgrade('p',22)?"^2.66":"^2"):""}
														${hasUpgrade('p',13)?"<br>PU[2,1] bonus:^1.75":""}
														<br>
														${player.a.unlocked?"<br>antimatter bonus:*"+format(temp.a.effect):""}
														${player.di.unlocked?"<br>Time speed bonus:*"+format(layers.di.effect()):""}
														`
		}]]},
		"Antimatter":{content:[["display-text",()=>{return `Antimatter gain:${format(layers.a.getAMGain())}
														<br>Base gain:${format(player.a.firstDim.add(getBuyableAmount('a',11)))}
														<br>Bought First Dimension multiplier:${format(layers.a.getPerdim().pow(getBuyableAmount('a',11)))}
														<br>Generic Dimension multiplier:${format(layers.a.getMult())}
														${layers.a.getAMGain().gt("1e308")?"<br>1e308 Softcap: ^0.5;*1e154":""}
														${layers.a.getAMGain().gt("1e1000")?"<br>1e1000 Softcap: ^0.25;*1e750":""}
														<br><br>
														Generic Dimension Multiplier:${format(layers.a.getMult())}
														<br>Base multiplier: 1
														${hasUpgrade('a',11)?"<br>AU[1,1] bonus:"+format(upgradeEffect('a',11)):""}
														${hasUpgrade('a',12)?"<br>AU[2,1] bonus:"+format(upgradeEffect('a',12)):""}
														${hasUpgrade('a',21)?"<br>PB[1,1] and AU[1,2] bonus:*"+format(buyableEffect('p',11).pow(4.655)):""}
														${getBuyableAmount('a',31).gt(0)?"<br>Dimboost bonus:*"+format(layers.a.getPerdim().pow(getBuyableAmount('a',31).mul(2))):""}
														${"<br>Tickspeed bonus:*"+format(layers.a.getPerdim().pow(player.a.points.mul(0.13750352374993502)))}
														${player.di.unlocked?"<br>Time speed bonus:*"+format(layers.di.effect()):""}
														<br><br>
														Bought Dimension Mult:${format(layers.a.getPerdim())}
														<br>Base Multiplier:2
														${getBuyableAmount('a',32).gt(0)?"<br>Galaxy boost:"+format(nd(1.05).pow(getBuyableAmount('a',32))):""}
														`
		}]],unlocked:()=>player.a.unlocked}
	},
	color: "#ffffff",
	image: "./rainbow.gif",
});
addLayer("di", {
	name:"distance incremental",
	symbol: "DI",
	position: 0,
    startData() { return {                  // startData is a function that returns default data for a layer. 
        unlocked: false,                     // You can add more variables here to add them to your layer.
        points: new Decimal(0),             // "points" is the internal name for the main resource of the layer.
		dist: nd(0),
		vel: nd(0),
		acc: nd(1),
    }},
	effect() {
		let x= player.di.points.add(1)
		let IIB=nd(.3)
		if (hasMilestone('di',3)) {IIB=IIB.mul(1.5)}
		IIB=IIB.add(1)
		if (hasMilestone('di',1)) x=x.mul(IIB.pow(getBuyableAmount('di',11)))
		if (hasUpgrade('di',11)) x=x.mul(upgradeEffect('di',11))
		if (hasUpgrade('di',12)) x=x.mul(upgradeEffect('di',12))
		if (hasUpgrade('di',13)) x=x.mul(upgradeEffect('di',13))
		if (hasUpgrade('ip',11)) x=x.mul(upgradeEffect('ip',11))
		if (hasUpgrade('ip',12)) x=x.mul(upgradeEffect('ip',12))
		if (hasUpgrade('ip',13)) x=x.mul(upgradeEffect('ip',13))
		return x
	},
	effectDescription() {
		return `which makes time *${format(temp.di.effect)} faster.`
	},
	tabFormat: {
		"Main":{content:["prestige-button", "main-display",['display-text', ()=>{return `<br>Distance:<b> ${format(player.di.dist)}</b><br>Velocity:<b> ${format(player.di.vel)}</b><br>Accel. :<b> &nbsp;${format(player.di.acc)}</b>`}], "buyables"]},
		"Upgrades": {content:["prestige-button", "main-display","upgrades"],
		unlocked() {return hasMilestone('di',4)}},
		"Rank Milestones": {content:["main-display", "milestones"]}
	},
	getDerMult() {
		let x=nd(1)
		if (hasMilestone('di',0)) x=x.mul(2)
		x=x.mul(temp.di.effect)
		return x
	},
	update(diff) {
		if (!player.di.unlocked) return;
		let y=layers.di.getDerMult()
		player.di.dist.addEq(player.di.vel.mul(diff).mul(y))
		player.di.vel.addEq(player.di.acc.mul(diff).mul(y))
		player.di.acc.addEq(player.di.dist.mul(y).root(7).mul(diff))
		if (hasUpgrade('di',21)) player.a.eighthDim=player.a.eighthDim.add(upgradeEffect('di',21))
	},
	branches:["a"],
    color: "#aa00aa",                       // The color for this layer, which affects many elements.
    resource: "time cubes",            // The name of this layer's main prestige resource.
    row: 3,                                 // The row this layer is on (0 is the first row).

	upgrades: {
		cols:3,
		rows:3,
		11: {
			title: "Closed timelike curves",
			description: "Increase time cube efficiency.",
			cost: new Decimal(3e2),
			effect:()=>(player.di.points.add(1)).log10().pow(hasUpgrade('di',31)?1.5:1).add(1),
			currencyDisplayName: "Time cubes",
			currencyLocation:()=>{return player.di.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasMilestone('di',4)}
		},
		12: {
			title: "Special relativity",
			description: "Time is faster based on velocity",
			cost: new Decimal(2.5e3),
			effect:()=>(player.di.vel.add(1)).log10().pow(hasUpgrade('di',31)?1.5:1).add(1),
			currencyDisplayName: "Time cubes",
			currencyLocation:()=>{return player.di.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasUpgrade('di',this.id-1)}
		},
		13: {
			title: "General relativity",
			description: "Time is faster based on antimatter",
			cost: new Decimal(3e4),
			effect:()=>(player.a.antimatter.add(1)).log10().root(2).pow(hasUpgrade('di',31)?1.5:1).add(1),
			currencyDisplayName: "Time cubes",
			currencyLocation:()=>{return player.di.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasUpgrade('di',this.id-1)}
		},
		21: {
			title: "String theory",
			description: "Gain 8th dimensions based on distance",
			cost: new Decimal(1e6),
			effect:()=>(player.di.dist.mul(temp.di.effect).root(10).mul(layers.a.getPerdim().pow(getBuyableAmount('a',31).mul(2).add(player.a.points.mul(0.13750352374993502))))).add(1),
			currencyDisplayName: "Time cubes",
			currencyLocation:()=>{return player.di.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasMilestone('di',6)}
		},
		22: {
			title: "Tachyon particles",
			description: "Get more time cubes based on time cubes",
			cost: new Decimal(1e7),
			effect:()=>(player.di.points.add(1)).log10().add(1),
			currencyDisplayName: "Time cubes",
			currencyLocation:()=>{return player.di.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasMilestone('di',6)}
		},
		23: {
			title: "Brane collision",
			description: "Get a new layer",
			cost: new Decimal(1e9),
			effect:()=>true,
			currencyDisplayName: "Time cubes",
			currencyLocation:()=>{return player.di.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasMilestone('di',6)},
			onPurchase() {player.ip.unlocked=true},
		},
		31: {
			title: "Overclocking",
			description: "First row DI upgrades are ^1.5 stronger",
			cost: new Decimal(1e15),
			effect:()=>(player.di.points.add(1)).log10().add(1),
			currencyDisplayName: "Time cubes",
			currencyLocation:()=>{return player.di.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasUpgrade('ip',23)}
		},
	},
	tooltip() {
		return format(player.di.dist)+"m"
	},

	buyables: {
		cols:1,
		rows:1,
		11: {
				title: "Rank",
				description: "Get a rank",
				cost(x=getBuyableAmount(this.layer,this.id)) {
					let y=x.pow(1.5)
					return y.pow(y)
				},
				display() {
					return `${this.description}<br>Requires: <b>${format(this.cost())}</b><br>You have <b>${format(getBuyableAmount(this.layer,this.id))}</b> of this`
				},
				effect:()=>(nd(2).pow(getBuyableAmount('p',11))),
				currencyDisplayName: "Distance",
				currencyLocation:()=>{return player.di.dist},
				canAfford:function(x=getBuyableAmount(this.layer, this.id)) {return this.currencyLocation().gte(this.cost(x))},
				buy:function() {
					player.di.dist=nd(0)
					player.di.vel=nd(0)
					player.di.acc=nd(1)
					setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer,this.id).add(1))
				},
				unlocked() {
					return true
				},
		},
	},

	milestonePopups:false,

	milestones: {
		0: {
			requirementDescription: "1 rank",
			effectDescription: "This layer's time speed is doubled",
			done() { return player.di.buyables[11].gte(1) }
		},
		1: {
			requirementDescription: "2 ranks",
			effectDescription: "Time speed is increased by 30% for every rank",
			done() { return player.di.buyables[11].gte(2) },
			unlocked() {return hasMilestone('di',this.id-1)},
		},
		2: {
			requirementDescription: "3 ranks",
			effectDescription: "Acceleration is generated based on distance",
			done() { return player.di.buyables[11].gte(3) },
			unlocked() {return hasMilestone('di',this.id-1)},
		},
		3: {
			requirementDescription: "4 ranks",
			effectDescription: "2 rank milestone base is *1.5",
			done() { return player.di.buyables[11].gte(4) },
			unlocked() {return hasMilestone('di',this.id-1)},
		},
		4: {
			requirementDescription: "6 ranks",
			effectDescription: "Unlock upgrades",
			done() { return player.di.buyables[11].gte(6) },
			unlocked() {return hasMilestone('di',this.id-1)},
		},
		5: {
			requirementDescription: "7 ranks",
			effectDescription: "Keep P and AD upgrades, P buyables",
			done() { return player.di.buyables[11].gte(7) },
			unlocked() {return hasMilestone('di',this.id-1)},
		},
		6: {
			requirementDescription: "8 ranks",
			effectDescription: "Get more upgrades",
			done() { return player.di.buyables[11].gte(8) },
			unlocked() {return hasMilestone('di',this.id-1)},
		},
		7: {
			requirementDescription: "10 ranks",
			effectDescription: "Automatically get galaxies, dimBoosts, and tickspeed[if resets nothing]",
			done() { return player.di.buyables[11].gte(10) },
			unlocked() {return hasMilestone('di',this.id-1)},
		},
	},

    baseResource: "antimatter",                 // The name of the resource your prestige gain is based on.
    baseAmount() { return player.a.antimatter },  // A function to return the current amount of baseResource.

    requires: new Decimal('1e635'),              // The amount of the base needed to  gain 1 of the prestige currency.
                                            // Also the amount required to unlock the layer.
	softcap:nd(1e4),
	softcapPower:nd(0.5),
	softcapExt:[[nd(1e10),nd(2)]],
    type: "normal",                         // Determines the formula used for calculating prestige currency.
    exponent: nd('0.05'),                          // "normal" prestige gain is (currency^exponent).

    gainMult() {
		let x=new Decimal(1)
		if (hasUpgrade('di',22)) x=x.mul(upgradeEffect('di',22))
        return x// Factor in any bonuses multiplying gain here.
    },
    gainExp() {                             // Returns your exponent to your gain of the prestige resource.
        return new Decimal(1)
    },

    layerShown() { return player.di.unlocked}            // Returns a bool for if this layer's node should be visible in the tree.
}
)
addLayer("ip", {
	name:"infinity",
	symbol: "IP",
	position: 1,
    startData() { return {                  // startData is a function that returns default data for a layer. 
        unlocked: false,                     // You can add more variables here to add them to your layer.
        points: new Decimal(0),             // "points" is the internal name for the main resource of the layer.
    }},
	effect() {},
	tabFormat: {
		"Main":{content:["prestige-button", "main-display", "upgrades"]},
	},
	getDerMult() {
		return nd(1)
	},
	update(diff) {
		return
	},
	branches:["a"],
    color: "#242424",                       // The color for this layer, which affects many elements.
    resource: "infinity points",            // The name of this layer's main prestige resource.
	nodeStyle:{"border-color":"#B67F33","color":"#aaaaaa"},
    row: 3,                                 // The row this layer is on (0 is the first row).

	tooltip() {
		return `${format(player.ip.points)}IP`
	},

    baseResource: "antimatter",                 // The name of the resource your prestige gain is based on.
    baseAmount() { return player.a.antimatter },  // A function to return the current amount of baseResource.

	upgrades: {
		rows:3,
		cols:3,
		11: {
			title: "OH GOD",
			description: "Increase time cube efficiency(again)",
			cost: new Decimal(1e2),
			effect:()=>(player.di.points.add(1)).log10().add(1),
			currencyDisplayName: "IP",
			currencyLocation:()=>{return player.ip.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return true}
		},
		12: {
			title: "I DON'T HAVE ENOUGH CREATIVITY",
			description: "Increase time cube efficiency(again again)",
			cost: new Decimal(3e2),
			effect:()=>(player.di.points.add(1)).log10().add(1),
			currencyDisplayName: "IP",
			currencyLocation:()=>{return player.ip.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return true}
		},
		13: {
			title: "AAAAAAAAAAA",
			description: "Increase time rate based on IP;IP formula is better",
			cost: new Decimal(1e3),
			effect:()=>(player.ip.points.add(1)).log10().add(1),
			currencyDisplayName: "IP",
			currencyLocation:()=>{return player.ip.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasUpgrade('ip',12)}
		},
		21: {
			title: "I GUESS I'LL COPY AD?",
			description: "Unlock normal tickspeed",
			cost: new Decimal(1e4),
			effect:()=>(player.ip.points.add(1)).log10().add(1),
			currencyDisplayName: "IP",
			currencyLocation:()=>{return player.ip.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasUpgrade('ip',13)}
		},
		22: {
			title: "NG----?",
			description: "Galaxies are x1.5 as effective",
			cost: new Decimal(1e6),
			effect:()=>(player.ip.points.add(1)).log10().add(1),
			currencyDisplayName: "IP",
			currencyLocation:()=>{return player.ip.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasUpgrade('ip',21)}
		},
		23: {
			title: "UHHHHHHH HAVE MORE UPGRADES",
			description: "Add more upgrades to DI layer",
			cost: new Decimal(1e8),
			effect:()=>(player.ip.points.add(1)).log10().add(1),
			currencyDisplayName: "IP",
			currencyLocation:()=>{return player.ip.points},
			canAfford:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().gt(this.cost)},
			pay:function() {return (this.currencyLocation||(function() {return player[this.layer]}))().subEq(this.cost)},
			unlocked() {return hasUpgrade('ip',22)}
		},
	},
                                            // Also the amount required to unlock the layer.
    type: "custom",                         // Determines the formula used for calculating prestige currency.                       // "normal" prestige gain is (currency^exponent).

	getResetGain() {
		let x=player.a.antimatter.log10().root(1.33).floor()
		if (hasUpgrade('ip',13)) x=x.mul(player.a.antimatter.root(100).div(1e8))
		return x
	},
	
	canReset() {
		return player.a.antimatter.gt('1e500')
	},
	
	getNextAt() {
		return nd("1e500")
	},
	
	prestigeButtonText() {
		return `Prestige for ${format(temp.ip.resetGain)} IP`
	},
	
    gainMult() {
		let x=new Decimal(1)
        return x// Factor in any bonuses multiplying gain here.
    },
    gainExp() {                             // Returns your exponent to your gain of the prestige resource.
        return new Decimal(1)
    },
	softcap:nd(1e6),
	softcapPower:nd(0.5),

    layerShown() { return player.ip.unlocked}            // Returns a bool for if this layer's node should be visible in the tree.
}
)