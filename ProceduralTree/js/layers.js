function randCol() {return Math.floor(Math.random()*16777215).toString(16)}
const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function getNonBoringLayers() {
	let temp=Object.keys(layers)
	temp=temp.filter((x)=>(!(['blank',"changelog-tab","info-tab", "options-tab", "tree-tab"].includes(x))))
	tempII=temp.map((x)=>layers[x])
	let tempIII={}
	temp.forEach((x,i)=>{
		tempIII[x]=tempII[i]
	})
	return tempIII
}
var getRandLayer=()=>{
	let temp=Object.keys(layers)
	temp=temp.filter((x)=>(!(['blank',"changelog-tab","info-tab", "options-tab", "tree-tab"].includes(x))))
	return temp
}
function getRandNonMetaLayer() {
	let temp=Object.keys(layers)
	temp=temp.filter((x)=>(!(['blank',"changelog-tab","info-tab", "options-tab", "tree-tab","m"].includes(x))))
	return temp
}
var generic={
    name: "Meta", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "M", // This appears on the layer's node. Default is the id with the first letter capitalized
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
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [],
    layerShown(){return true},
	gainMult:function() {
		gain=new Decimal(1)
		tempLayers=getNonBoringLayers()
		Object.keys(tempLayers).forEach((x)=>{
			let curLayer=tempLayers[x]
			if (curLayer.effect) {
				if (curLayer.effect().allNormalBelow && curLayer.row>this.row) {
					gain=gain.mul(curLayer.effect().allNormalBelow)
				}
				if (curLayer.effect()[this.name+"mult"]) {
					gain=gain.mul(curLayer.effect()[this.name+"mult"])
				}
			}
		})
		return gain
	},
	gainExp:function() {
		gain=new Decimal(1)
		tempLayers=layers
		Object.keys(tempLayers).forEach((x)=>{
			let curLayer=tempLayers[x]
			if (curLayer.effect) {
				if (curLayer.effect().allNormalBelow && curLayer.row>this.row) {
					gain=gain.mul(curLayer.effect().allNormalBelow)
				}
				if (curLayer.effect()[this.name+"exp"]) {
					gain=gain.mul(curLayer.effect()[this.name+"exp"])
				}
			}
		})
		return gain
	},
	effect:()=>{return {}},
	points:new Decimal(0)
}
addLayer("m", {
    name: "Meta", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "M", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
    }},
    color: "#4BDC13",
    requires: new Decimal(100), // Can be a function that takes requirement increases into account
    resource: "meta points", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.5, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
	getResetGain() {
		return player.points.log2().pow(0.5).sub(2).floor()
	},
	getNextAt() {
		return new Decimal(2).pow(player.points.log2().pow(0.5).floor()).pow(2)
	},
	canReset() {
		return player.points.gt(512)
	},
	prestigeButtonText() {
		return `This is getting boring and has century long timewalls. Reset for ${format(layers.m.getResetGain())} meta points.`
	},
	onPrestige(gain) {
		Object.keys(layers.m.buyables).filter((x)=>x.length<3).forEach((x)=>{
			setBuyableAmount("m",x,new Decimal(0))
		})
	},
	effect() {
		return {
			allNormalBelow: player.m.points.pow(0.5).add(1),
			allStaticBelow: player.m.points.add(1).log10().add(1).pow(0.33),
			pointsMult:new Decimal(1)
		}
	},
	effectDescription() {
		return `your ${player.m.points} meta points boost all non-this layer normal layer point gain by ${format(layers.m.effect().allNormalBelow)} and all static point gain by ${format(layers.m.effect().allStaticBelow)}.`
	},
	buyables: {
		rows: 3,
		cols: 3,
		11: {
			cost(x) { return new Decimal(2).pow(x || getBuyableAmount(this.layer, this.id)).mul(x || getBuyableAmount(this.layer, this.id)) },
			title:"Add new layer.",
			display() { return `<br><b>Requires:${this.cost()} meta points.</b>` },
			canAfford() { return player[this.layer].points.gte(this.cost()) },
			buy() {
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
				let temp=generateRandomLayer()
				addLayer(temp.symbol,temp)
				tmp[temp.symbol]=temp
				updateTemp()
			},
		},
		12: {
			cost(x) { return new Decimal(3).pow(x || getBuyableAmount(this.layer, this.id)).mul(x || getBuyableAmount(this.layer, this.id)).add(3) },
			title:"Add new buyable.",
			display() { return `<br><b>Requires:${this.cost()} meta points.</b>` },
			canAfford() { return player[this.layer].points.gte(this.cost()) },
			buy() {
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
		},
	},
	metaLayers:0,
    row: 100, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "m", description: "M: Reset for meta points", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true}
})
function generateRandomLayer() {
	let temp=generic
	temp.name=capitalize(ranWrd())
	temp.symbol=temp.name[0]
	let i=0
	while (Object.keys(getNonBoringLayers()).includes(temp.symbol)) {
		i++
		temp.symbol+=temp.name[i]
	}
	temp.startData=()=>{return {unlocked:true,points:new Decimal(0)}}
	temp.color="#"+randCol()
	temp.resource=temp.name.toLowerCase()+((Math.random()>0.5)?" points":"")
	let tempLayer=layers[getRandNonMetaLayer()]||{row:1}
	temp.row=tempLayer.row || 1
	temp.type=(Math.random()>0.5)?"normal":"static"
	
	return temp
}
