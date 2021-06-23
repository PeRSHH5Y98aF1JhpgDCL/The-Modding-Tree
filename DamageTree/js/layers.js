let loar = {
	d: [
		["It's difficult to make an incremental game interesting.", "I mean, you could make a puzzle or something but who's going to do that?", "You could just make things slower but that's just not fun.", "???"],
		["All I've done so far is just adding upgrades and buyables.", "You could add a lot of branching paths but that'd be a nightmare to implement.", "No wonder all mods just seem like the same.", "...what do i do now?"],
		["I don't really want to make anything because that'd be too much work.", "...", "Just take your /8 scaling and leave.", "scaling reduction"],
		["Hidden upgrade", "enemy scaling", "damage shards", "scaling reduction"]
	],
	p:[
		["...i know that this game is just a dim reflection of a better game which I'm not talented or creative enough to create","..but I'm just creating this for me and not anyone else, right?", "i don't know what i want this to be...", "whatever."],
		["???","???","???","???"],
		["???", "Why are you here?", "???", "???"],
		["More complex", "complexity cap", "planets", "complexity cap"]
	]
}
addLayer("d", {
	softcapPower:new Decimal(0.3),
    name: "damage", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "D", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(1),
		damage: new Decimal(0),
		timeSinceKill:0
   }},
    color: "#4BDC13",
    requires: new Decimal(5), // Can be a function that takes requirement increases into account
    resource: "damage shards", // Name of prestige currency
    baseResource: "zones", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.9, // Prestige currency exponent
	getEffectiveResetTime() {
		let x=new Decimal(player.d.resetTime)
		if (hasUpgrade('d',42)) x=x.mul(temp.d.getDamage.log10())
		return x
	},
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
		mult = mult.mul(temp.p.effect)
		mult=mult.mul(player.p.c22points.add(1).log10().add(1).pow(5))
        return mult
    },
	getDamage() {
		let x = player.d.points.add(1).sqrt()
		if (hasUpgrade('d', 32)) x=x.mul(temp.d.getEffectiveResetTime.add(1).sqrt())
		if (hasUpgrade('d', 44)) x=x.mul(player.points.add(1).log10().add(1))
		x=x.mul(buyableEffect('d',11))
		x=x.mul(temp.p.effect)
		x=x.pow(player.p.c12points.add(1).log10().add(1).sqrt())
		if (inChallenge('p',13)) x=x.add(1).log10().add(1)
		return x 
	},
	getScalingReduction() {
		let x=new Decimal(1)
		if (inChallenge('p',22)) return x
		if (hasUpgrade('d',11)) x=x.mul(2)
		if (hasUpgrade('d',12)) x=x.mul(2)
		if (hasUpgrade('d',23)) x=x.mul(temp.d.getEffectiveResetTime.add(1).sqrt())
		if (hasUpgrade('d',33)) x=x.mul(10)
		if (hasUpgrade('d',34)) x=x.mul(temp.d.getDamage.log10())
		if (hasUpgrade('d',51)) x=x.mul(temp.d.getDamage.log10())
		x=x.mul(buyableEffect('d',13))
		x=x.mul(buyableEffect('d',14))
		x=x.mul(temp.p.effect)
		x=x.mul(player.p.c11points.add(1).pow(0.1))
		if (inChallenge('p',21)) x=x.root(10)
		return x
	},
	getMaxHp() {
		let effPoints=player.points
		if (hasUpgrade('d',15)) effPoints=effPoints.pow(0.8)
		let x = Decimal.pow(1.1,effPoints.div(tmp.d.getScalingReduction))
		if (inChallenge('p',21)) x=Decimal.pow(2,x.div(tmp.d.getScalingReduction.add(1).log10().add(1)))
		if (hasUpgrade('d',13)) x=x.sub(1)
		
		return x
	},
	update(dt) {
		player.d.damage=player.d.damage.add(temp.d.getDamage.mul(dt))
		player.d.timeSinceKill+=dt
		if (temp.d.getHealth.lt(0)) {
			if (!hasUpgrade('p',12)) {
				player.d.damage=new Decimal(0)
				player.d.timeSinceKill=0
			}
			player.points=player.points.add(1)
			if (hasUpgrade('d',21)&&(temp.d.getDamage.gt(temp.d.getMaxHp)||hasUpgrade('d',24))) {
				let overkillAmt=new Decimal(5)
				if (hasUpgrade('d',31)) overkillAmt=overkillAmt.add(player.points.sqrt().floor())
				if (hasUpgrade('d', 41)) overkillAmt=overkillAmt.mul(temp.d.getDamage.log10()).floor()
				overkillAmt=overkillAmt.mul(buyableEffect('d',12))
				let metakill=player.points.div(10)
				if (hasUpgrade('d', 35)) metakill=metakill.mul(buyableEffect('d',14))
				if (hasUpgrade('d',53)) overkillAmt=overkillAmt.add(metakill)
				if (hasUpgrade('d',52)) overkillAmt=overkillAmt.pow(0.9).floor()
				overkillAmt=overkillAmt.mul(temp.p.effect)
				if (inChallenge('p',11)) overkillAmt=overkillAmt.root(4)
				if (inChallenge('p',21)) overkillAmt=overkillAmt.root(2)
				if (inChallenge('p',22)) overkillAmt=overkillAmt.root(20)
				player.points=player.points.add(overkillAmt.floor())
			}
		}
	},
	getHealth() {
		let effMHp=tmp.d.getMaxHp
		let y=new Decimal(player.d.timeSinceKill)
		if (hasUpgrade('p',22)) y=y.mul(tmp.p.effect)
		if (hasUpgrade('d',52)) effMHp=effMHp.div(temp.d.getDamage.pow(y))
		let x=effMHp.sub(player.d.damage)
		return x
	},
    gainExp() { // Calculate the exponent on main currency from bonuses
        let exp=new Decimal(1)
		if (hasUpgrade('d', 22)) exp=exp.mul(1.5)
			if (inChallenge('p',12)) exp=exp.mul(0.1)
		return exp
    },
	tabFormat: {
		Main: {
			content: [
				"main-display", "prestige-button", "blank", "resource-display",["display-text",()=>`Health: ${format(temp.d.getHealth)}/${format(tmp.d.getMaxHp)}<br>(-${format(player.d.damage)} from max)<br>(-${format(temp.d.getDamage)}/s)`],"upgrades"
			]
		},
		Buyables: {
			content: [
				["row",[["buyable", 11],["buyable", 12],["buyable", 13]]]
			],
			unlocked() {
				return hasUpgrade('d',43)
			}
		},
		"???": {
			content: [
				["buyable", 14]
			],
			unlocked() {
				return hasUpgrade('d',25)&&getBuyableAmount('d',14).neq(3)
			}
		}
	},
	upgrades: {
		11:{
			title:"Welcome",
			description: "Reduce enemy scaling by 50%",
			cost: new Decimal(20)
		},
		12:{
			title:"Not very clever",
			description: "Reduce enemy scaling by 50%, again",
			cost: new Decimal(50),
			unlocked() {return hasUpgrade("d", 11)}
		},
		13:{
			title:"Thanks",
			description: "Reduce enemy max health by 1",
			cost: new Decimal(50),
			unlocked() {return hasUpgrade("d", 12)}
		},
		21:{
			title:"Overkill",
			description: "If damage in a second is greater than enemy max health skip 5 zones",
			cost: new Decimal(150),
			unlocked() {return hasUpgrade("d", 13)}
		},
		22:{
			title:"More exponents",
			description: "Damage shard gain exponent is multiplied by 1.5",
			cost: new Decimal(150),
			unlocked() {return hasUpgrade("d", 21)}
		},
		23:{
			title:"Dynamic max health",
			description: "Enemy max health scaling is reduced based on d reset time",
			cost: new Decimal(500),
			unlocked() {return hasUpgrade("d", 22)}
		},
		31:{
			title:"Ultrakill",
			description: "Overkill effect is increased by sqrt(zones) rounded down",
			cost: new Decimal(2500),
			unlocked() {return hasUpgrade("d", 23)}
		},
		32:{
			title:"Dynamic damage",
			description: "Damage is increased based on d reset time",
			cost: new Decimal(5000),
			unlocked() {return hasUpgrade("d", 31)}
		},
		33:{
			title:"Even less clever",
			description: "Reduce enemy scaling by 90%",
			cost: new Decimal(10000),
			unlocked() {return hasUpgrade("d", 32)}
		},
		41:{
			title:"Hill skip",
			description: "Overkill amount is multiplied by the logarithm of damage",
			cost: new Decimal(25000),
			unlocked() {return hasUpgrade("d", 33)}
		},
		42:{
			title:"Time skip",
			description: "Effective time in \"Dynamic [n]\" upgrades is multiplied by the logarithm of damage",
			cost: new Decimal(500000),
			unlocked() {return hasUpgrade("d", 41)}
		},
		43:{
			title:"Actual weapons",
			description: "Unlock a buyable",
			cost: new Decimal(500000),
			unlocked() {return hasUpgrade("d", 41)}
		},
		14:{
			title:"Mountain skip",
			description: "Unlock a buyable",
			cost: new Decimal(1000000),
			unlocked() {return hasUpgrade("d", 42)&&hasUpgrade("d", 43)}
		},
		24:{
			title:"Hyperkill",
			description: "Overkill always triggers",
			cost: new Decimal(2500000),
			unlocked() {return hasUpgrade("d", 14)}
		},
		34:{
			title:"Better damage",
			description: "Enemy scaling is reduced by the logarithm of damage",
			cost: new Decimal(5000000),
			unlocked() {return hasUpgrade("d", 24)}
		},
		44:{
			title:"Pattern recognition",
			description: "Damage is multiplied by the logarithm of zones",
			cost: new Decimal(25000000),
			unlocked() {return hasUpgrade("d", 34)}
		},
		51:{
			title:"Betterer damage",
			description: "Better damage is squared",
			cost: new Decimal("1e8"),
			unlocked() {return hasUpgrade("d", 44)}
		},
		52:{
			title:"Best damage",
			description: "Damage now divides and subtracts health, but overkill is raised to ^0.9",
			cost: new Decimal("1e9"),
			unlocked() {return hasUpgrade("d", 51)}
		},
		53:{
			title:"Metakill",
			description: "Overkill is increased by 10% of zones after previous multipliers but not \"Best damage\"",
			cost: new Decimal("5e9"),
			unlocked() {return hasUpgrade("d", 52)}
		},
		54:{
			title:"Even less health",
			description: "Unlock another buyable",
			cost: new Decimal("5e9"),
			unlocked() {return hasUpgrade("d", 52)}
		},
		15:{
			title:"Vauguely creative",
			description: "Effective zones in damage scaling is ^0.8",
			cost: new Decimal("2e10"),
			unlocked() {return hasUpgrade("d", 54)}
		},
		25:{
			title:"todo",
			description: "Placeholder",
			cost: new Decimal(NaN),
			pay () {},
			canAfford() {},
			unlocked() {return hasUpgrade("d", 15)}
		},
		35:{
			title:"not less than",
			description() {return "Metakill is affected by Hidden Upgrade";},
			cost: new Decimal("2e20"),
			unlocked() {return getBuyableAmount("d", 14).eq(3)}
		},
		45:{
			title:"Void",
			description: "Exists just for the 5x5 square",
			cost: new Decimal(NaN),
			pay () {},
			canAfford() {},
			unlocked() {return hasUpgrade("d", 35)}
		},
		55:{
			title:"Interstellar",
			description() {return "Unlock another layer";},
			cost: new Decimal("1e22"),
			unlocked() {return hasUpgrade("d", 45)},
			onPurchase() {player.p.unlocked=true}
		},
	},
	buyables: {
		11: {
			title: "Upgrade weapons",
			cost(x) { return new Decimal(5).pow(x).mul(10000) },
			display() { return "<b>Multiply damage by 2</b><br><b>Cost</b>:"+format(temp[this.layer].buyables[this.id].cost)+" damage shards<br><b>Effect</b>:"+format(temp[this.layer].buyables[this.id].effect)},
			canAfford() { return player[this.layer].points.gte(this.cost()) },
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost())
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			effect() {
				return new Decimal(2).pow(getBuyableAmount(this.layer,this.id))
			},
			unlocked() {
				return hasUpgrade('d',43)
			}
			
		},
		12: {
			title: "Rank up",
			cost(x) { return new Decimal(10).pow(x).mul(1e6) },
			display() { return "<b>Multiply overkill by 2</b><br><b>Cost</b>:"+format(temp[this.layer].buyables[this.id].cost)+" damage shards<br><b>Effect</b>:"+format(temp[this.layer].buyables[this.id].effect)},
			canAfford() { return player[this.layer].points.gte(this.cost()) },
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost())
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			effect() {
				return new Decimal(2).pow(getBuyableAmount(this.layer,this.id))
			},
			unlocked() {
				return hasUpgrade('d',14)
			}
			
		},
		13: {
			title: "Weaker enemies",
			cost(x) { return new Decimal(3).pow(x).mul(1e9) },
			display() { return "<b>Divide health scaling by 2</b><br><b>Cost</b>:"+format(temp[this.layer].buyables[this.id].cost)+" damage shards<br><b>Effect</b>:"+format(temp[this.layer].buyables[this.id].effect)},
			canAfford() { return player[this.layer].points.gte(this.cost()) },
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost())
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			effect() {
				return new Decimal(2).pow(getBuyableAmount(this.layer,this.id))
			},
			unlocked() {
				return hasUpgrade('d',54)
			}
			
		},
		14: {
			title(x) {return loar.d[getBuyableAmount(this.layer,this.id)][0]},
			cost(x) { return new Decimal(2).pow(x)},
			display() { return "<b>Divide "+loar.d[getBuyableAmount(this.layer,this.id)][1]+" by 2</b><br><b>Cost</b>: "+format(temp[this.layer].buyables[this.id].cost)+' '+loar.d[getBuyableAmount(this.layer,this.id)][2]+"<br><b>Effect</b>:"+format(temp[this.layer].buyables[this.id].effect)+' '+loar.d[getBuyableAmount(this.layer,this.id)][3]},
			canAfford() { return player[this.layer].points.gte(this.cost()) },
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost())
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			effect() {
				return new Decimal(2).pow(getBuyableAmount(this.layer,this.id))
			},
			unlocked() {
				return hasUpgrade('d',54)
			},
			purchaseLimit: 3
		},
	},
	softcap:new Decimal(1e20),
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "d", description: "D: Reset for damage shards", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true}
})
addLayer("p", {
    name: "planets", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
		complexity:new Decimal(0),
		c11points: new Decimal(0),
		c12points: new Decimal(0),
		c13points: new Decimal(0),
		c21points: new Decimal(0),
		c22points: new Decimal(0)
    }},
    color: "#888800",
    requires: new Decimal(1e20), // Can be a function that takes requirement increases into account
    resource() {return "planet"+(player.p.points.eq(1)?'':'s')}, // Name of prestige currency
    baseResource: "zones", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
	base: 10,
	branches: ['d'],
    type: "static", 
    exponent: 1.95, // not 2 JUST so that the requirement isn't a power of 10
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "p", description: "P: Reset for planets", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
	doReset(resettingLayer) {
        let keep = [];
        if (layers[resettingLayer].row > this.row)
            layerDataReset("p", keep)
    },
	getCompLim() {
		let x=new Decimal(50)
		x=x.mul(temp.p.effect)
		x=x.mul(buyableEffect('p',11))
		if (hasUpgrade('p',23)) x=x.mul(player.p.complexity.add(1).log10().add(1))
		x=x.mul(player.p.c13points.add(1))
		return x
	},
	update(dt) {
		if (!hasUpgrade('p', 11)) return;
		let diff=temp.p.getCompLim.sub(player.p.complexity)
		diff=diff.div(player.p.points.div(1000).add(1).pow(dt))
		player.p.complexity=temp.p.getCompLim.sub(diff)
	},
	upgrades:{
		11:{
			title: "Primordial soup",
			description: "unlock another feature<br><i>I'd advise not purchasing this until you get enough for a planet after the purchase...</i>",
			cost:3
		},
		12:{
			title: "Overerkill",
			description: "Advancing a zone no longer resets damage and \"Best damage\"<br><i>Same as the other upgrade...</i>",
			cost:4,
			unlocked() {return hasUpgrade('p',11)}
		},
		13:{
			title:"todo",
			description: "Placeholder",
			cost: new Decimal(NaN),
			pay () {},
			canAfford() {},
			unlocked() {return hasUpgrade("p", 12)}
		},
		21:{
			title: "Dwarf planets",
			description: "You can get half a planet and planets can be maxed<br><i>...</i>",
			cost:5,
			unlocked() {return hasUpgrade('p',13)}
		},
		22:{
			title: "Somehow better damage",
			description: "\"Best damage\" is affected by planet effect",
			cost:5.7,
			unlocked() {return hasUpgrade('p',21)}
		},
		23:{
			title: "sqrt(-log(x))",
			description: "Complexity limit is multiplied by log(complexity)",
			cost:6.7,
			unlocked() {return hasUpgrade('p',22)}
		},
		31:{
			title: "Challenging",
			description: "Unlock challenges",
			cost:7.1,
			unlocked() {return hasUpgrade('p',23)}
		},
	},
	canBuyMax() {
		return hasUpgrade('p',21)
	},
	canBeFractional() {
		return hasUpgrade('p',21)
	},
	challenges: {
		11: {
			name: "Alternate bottleneck",
			challengeDescription: "Overkill is fourth rooted. Your highest zones in this challenge divides scaling.",
			rewardDescription() {
				return "Your "+format(player.p.c11points)+" zones traveled in this challenge reduce scaling by "+ format(player.p.c11points.add(1).pow(0.1))
			},
			canComplete() {return false},
			goalDescription: "Infinity zones",
			onExit() {
				player.p.c11points=player.points
			}
		},
		12: {
			name: "No upgrades",
			challengeDescription: "Damage shards are raised ^0.1. Your highest zones in this challenge raises damage to an exponent.",
			rewardDescription() {
				return "Your "+format(player.p.c12points)+" zones traveled in this challenge raises damage by "+ format(player.p.c12points.add(1).log10().add(1).sqrt())
			},
			canComplete() {return false},
			goalDescription: "Infinity zones",
			onExit() {
				player.p.c12points=player.points
			}
		},
		13: {
			name: "No damage",
			challengeDescription: "Damage is log10(). Your highest damage in this challenge multiplies complexity cap.",
			rewardDescription() {
				return "Your "+format(player.p.c13points)+" dps in this challenge multiples complexity by "+ format(player.p.c13points.add(1))
			},
			canComplete() {return false},
			goalDescription: "Infinity zones",
			onExit() {
				player.p.c13points=temp.d.getDamage
			}
		},
		21: {
			name: "Very scaled",
			challengeDescription: "Enemy scaling is significantly faster.<br>Overkill is square rooted. <br>Scaling reduction is ^0.1<br>Your highest zones in this challenge multiplies planet base.",
			rewardDescription() {
				return "Your "+format(player.p.c21points)+" zones in this challenge multiples planet base by "+ format(player.p.c21points.add(1).log10().add(1).log10().add(1))
			},
			//countsAs: [11],
			canComplete() {return false},
			goalDescription: "Infinity zones",
			onExit() {
				player.p.c21points=player.points
			}
		},
		22: {
			name: "No.",
			challengeDescription: "Damage scaling is forced to 1.<br>Overkill is ^1/20<br>Your highest zones in this challenge multiplies damage shard gain",
			rewardDescription() {
				return "Your "+format(player.p.c22points)+" zones in this challenge multiples damage shard gain by "+ format(player.p.c22points.add(1).log10().add(1).pow(5))
			},
			canComplete() {return false},
			goalDescription: "Infinity zones",
			onExit() {
				player.p.c22points=player.points
			}
		},
		23: {
			name: "<i>Why?</i>",
			challengeDescription: "All previous challenges except 13 are applied at once.",
			rewardDescription() {
				return "Unlock the next layer..."
			},
			countsAs: [11,12,21,22],
			canComplete() {return player.points.gte(100)},
			goalDescription: "100 zones",
			completionLimit:1
		}
	},
	buyables: {11: {
			title(x) {return loar.p[getBuyableAmount(this.layer,this.id).min(loar.p.length-1)][0]},
			cost(x) { return new Decimal(x.add(1)).pow(1.5).floor()},
			display() { return "<b>Multiply "+loar.p[getBuyableAmount(this.layer,this.id).min(loar.p.length-1)][1]+" by 10</b><br><b>Cost</b>: "+format(temp[this.layer].buyables[this.id].cost)+' '+loar.p[getBuyableAmount(this.layer,this.id).min(loar.p.length-1)][2]+"<br><b>Effect</b>:"+format(temp[this.layer].buyables[this.id].effect)+' '+loar.p[getBuyableAmount(this.layer,this.id).min(loar.p.length-1)][3]},
			canAfford() { return player[this.layer].points.gte(this.cost()) },
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost())
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			effect() {
				return new Decimal(10).pow(getBuyableAmount(this.layer,this.id))
			},
			unlocked() {
				return hasUpgrade('p',13)
			},
			purchaseLimit: Infinity
		},},
	getPlanetBase() {
		let x=new Decimal(2)
		x=x.mul(player.p.complexity.add(1).log10().add(1).sqrt())
		x=x.mul(player.p.c21points.add(1).log10().add(1).log10().add(1))
		return x
	},
	tabFormat: {
		Main: {
			content: [
				"main-display", "prestige-button", "blank", "resource-display","upgrades"
			]
		},
		Life: {
			content: [["display-text", ()=>{return "You have "+format(player.p.complexity)+' complexity('+format(temp.p.getCompLim.sub(player.p.complexity).mul(player.p.points.div(1000)))+'/s, based on planets and cap)<br>Complexity is capped at '+format(temp.p.getCompLim)+"(based on planet effect)<br>Your complexity is multiplying planet base by "+format(player.p.complexity.add(1).log10().add(1).sqrt())}],"buyables"],
			unlocked() {
				return hasUpgrade('p',11)
			}
		},
		Challenges: {
			content: ["challenges"],
			unlocked() {
				return hasUpgrade('p',31)
			},
		}
	},
    layerShown(){return player.p.unlocked},
	effectDescription() {return "Multipling damage shard gain, damage, overkill amount[after \"Best damage\"], and divides enemy scaling by "+format(temp.p.effect)},
	effect() {return Decimal.pow(temp.p.getPlanetBase,player.p.points)}
})