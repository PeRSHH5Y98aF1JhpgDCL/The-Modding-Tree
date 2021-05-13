(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.BDecimal = factory());
}(this, function () { 'use strict';

  var padEnd = function (string, maxLength, fillString) {

    if (string === null || maxLength === null) {
      return string;
    }

    var result    = String(string);
    var targetLen = typeof maxLength === 'number'
      ? maxLength
      : parseInt(maxLength, 10);

    if (isNaN(targetLen) || !isFinite(targetLen)) {
      return result;
    }


    var length = result.length;
    if (length >= targetLen) {
      return result;
    }


    var filled = fillString === null ? '' : String(fillString);
    if (filled === '') {
      filled = ' ';
    }


    var fillLen = targetLen - length;

    while (filled.length < fillLen) {
      filled += filled;
    }

    var truncated = filled.length > fillLen ? filled.substr(0, fillLen) : filled;

    return result + truncated;
  };

  var MAX_SIGNIFICANT_DIGITS = 17; //Maximum number of digits of precision to assume in Number

  var EXP_LIMIT = 9e15; //If we're ABOVE this value, increase a layer. (9e15 is close to the largest integer that can fit in a Number.)
  
  var LAYER_DOWN = Math.log10(9e15); //If we're BELOW this value, drop down a layer. About 15.954.
  
  var FIRST_NEG_LAYER = 1/9e15; //At layer 0, smaller non-zero numbers than this become layer 1 numbers with negative mag. After that the pattern continues as normal.

  var NUMBER_EXP_MAX = 308; //The largest exponent that can appear in a Number, though not all mantissas are valid here.

  var NUMBER_EXP_MIN = -324; //The smallest exponent that can appear in a Number, though not all mantissas are valid here.
  
  var MAX_ES_IN_A_ROW = 5; //For default toString behaviour, when to swap from eee... to (e^n) syntax.

  var powerOf10 = function () {
    // We need this lookup table because Math.pow(10, exponent)
    // when exponent's absolute value is large is slightly inaccurate.
    // You can fix it with the power of math... or just make a lookup table.
    // Faster AND simpler
    var powersOf10 = [];

    for (var i = NUMBER_EXP_MIN + 1; i <= NUMBER_EXP_MAX; i++) {
      powersOf10.push(Number("1e" + i));
    }

    var indexOf0InPowersOf10 = 323;
    return function (power) {
      return powersOf10[power + indexOf0InPowersOf10];
    };
  }();

  var D = function D(value) {
    return BDecimal.fromValue_noAlloc(value);
  };

  var FC = function FC(sign, layer, mag) {
    return BDecimal.fromComponents(sign, layer, mag);
  };

  var FC_NN = function FC_NN(sign, layer, mag) {
    return BDecimal.fromComponents_noNormalize(sign, layer, mag);
  };
  
  var ME = function ME(mantissa, exponent) {
    return BDecimal.fromMantissaExponent(mantissa, exponent);
  };

  var ME_NN = function ME_NN(mantissa, exponent) {
    return BDecimal.fromMantissaExponent_noNormalize(mantissa, exponent);
  };
  
  var BDecimalPlaces = function BDecimalPlaces(value, places) {
    var len = places + 1;
    var numDigits = Math.ceil(Math.log10(Math.abs(value)));
    var rounded = Math.round(value * Math.pow(10, len - numDigits)) * Math.pow(10, numDigits - len);
    return parseFloat(rounded.toFixed(Math.max(len - numDigits, 0)));
  };
  
  var f_maglog10 = function(n) {
    return Math.sign(n)*Math.log10(Math.abs(n));
  }
  
  //from HyperCalc source code
  var f_gamma = function(n) {
    if (!isFinite(n)) { return n; }
    if (n < -50)
    {
      if (n === Math.trunc(n)) { return Number.NEGATIVE_INFINITY; }
      return 0;
    }
    
    var scal1 = 1;
    while (n < 10)
    {
      scal1 = scal1*n;
      ++n;
    }
    
    n -= 1;
    var l = 0.9189385332046727; //0.5*Math.log(2*Math.PI)
    l = l + (n+0.5)*Math.log(n);
    l = l - n;
    var n2 = n*n;
    var np = n;
    l = l+1/(12*np);
    np = np*n2;
    l = l+1/(360*np);
    np = np*n2;
    l = l+1/(1260*np);
    np = np*n2;
    l = l+1/(1680*np);
    np = np*n2;
    l = l+1/(1188*np);
    np = np*n2;
    l = l+691/(360360*np);
    np = np*n2;
    l = l+7/(1092*np);
    np = np*n2;
    l = l+3617/(122400*np);

    return Math.exp(l)/scal1;
  };
  
  var twopi = 6.2831853071795864769252842;  // 2*pi
  var EXPN1 = 0.36787944117144232159553;  // exp(-1)
  var OMEGA = 0.56714329040978387299997;  // W(1, 0)
  //from https://math.stackexchange.com/a/465183
  // The evaluation can become inaccurate very close to the branch point
  var f_lambertw = function(z, tol = 1e-10) {
    var w;
    var wn;

    if (!Number.isFinite(z)) { return z; }
    if (z === 0)
    {
      return z;
    }
    if (z === 1)
    {
      return OMEGA;
    }

    if (z < 10)
    {
      w = 0;
    }
    else
    {
      w = Math.log(z)-Math.log(Math.log(z));
    }

    for (var i = 0; i < 100; ++i)
    {
      wn = (z * Math.exp(-w) + w * w)/(w + 1);
      if (Math.abs(wn - w) < tol*Math.abs(wn))
      {
        return wn;
      }
      else
      {
        w = wn;
      }
    }

    throw Error("Iteration failed to converge: " + z);
    //return Number.NaN;
  }
  
  var BDecimal =
  /** @class */
  function () {
  
    function BDecimal(value) {
      
      this.sign = Number.NaN;
      this.layer = Number.NaN;
      this.mag = Number.NaN;

      if (value instanceof BDecimal) {
        this.fromBDecimal(value);
      } else if (typeof value === "number") {
        this.fromNumber(value);
      } else if (typeof value === "string") {
        this.fromString(value);
      } else {
        this.sign = 0;
        this.layer = 0;
        this.mag = 0;
      }
    }

    Object.defineProperty(BDecimal.prototype, "m", {
      get: function get() {
        if (this.sign === 0)
        {
          return 0;
        }
        else if (this.layer === 0)
        {
          var exp = Math.floor(Math.log10(this.mag));
          //handle special case 5e-324
          var man;
          if (this.mag === 5e-324)
          {
            man = 5;
          }
          else
          {
            man = this.mag / powerOf10(exp);
          }
          return this.sign*man;
        }
        else if (this.layer === 1)
        {
          var residue = this.mag-Math.floor(this.mag);
          return this.sign*Math.pow(10, residue);
        }
        else
        {
          //mantissa stops being relevant past 1e9e15 / ee15.954
          return this.sign;
        }
      },
      set: function set(value) {
        if (this.layer <= 2)
        {
          this.fromMantissaExponent(value, this.e);
        }
        else
        {
          //don't even pretend mantissa is meaningful
          this.sign = Math.sign(value);
          if (this.sign === 0) { this.layer === 0; this.exponent === 0; }
        }
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BDecimal.prototype, "e", {
      get: function get() {
        if (this.sign === 0)
        {
          return 0;
        }
        else if (this.layer === 0)
        {
          return Math.floor(Math.log10(this.mag));
        }
        else if (this.layer === 1)
        {
          return Math.floor(this.mag);
        }
        else if (this.layer === 2)
        {
          return Math.floor(Math.sign(this.mag)*Math.pow(10, Math.abs(this.mag)));
        }
        else
        {
          return this.mag*Number.POSITIVE_INFINITY;
        }
      },
      set: function set(value) {
        this.fromMantissaExponent(this.m, value);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BDecimal.prototype, "s", {
      get: function get() {
        return this.sign;
      },
      set: function set(value) {
        if (value === 0) {
          this.sign = 0;
          this.layer = 0;
          this.mag = 0;
        }
        else
        {
          this.sign = value;
        }
      },
      enumerable: true,
      configurable: true
    });
    
    Object.defineProperty(BDecimal.prototype, "mantissa", {
      get: function get() {
        return this.m;
      },
      set: function set(value) {
        this.m = value;
      },
      enumerable: true,
      configurable: true
    });

    Object.defineProperty(BDecimal.prototype, "exponent", {
      get: function get() {
        return this.e;
      },
      set: function set(value) {
        this.e = value;
      },
      enumerable: true,
      configurable: true
    });

    BDecimal.fromComponents = function (sign, layer, mag) {
      return new BDecimal().fromComponents(sign, layer, mag);
    };

    BDecimal.fromComponents_noNormalize = function (sign, layer, mag) {
      return new BDecimal().fromComponents_noNormalize(sign, layer, mag);
    };
    
    BDecimal.fromMantissaExponent = function (mantissa, exponent) {
      return new BDecimal().fromMantissaExponent(mantissa, exponent);
    };

    BDecimal.fromMantissaExponent_noNormalize = function (mantissa, exponent) {
      return new BDecimal().fromMantissaExponent_noNormalize(mantissa, exponent);
    };
    
    BDecimal.fromBDecimal = function (value) {
      return new BDecimal().fromBDecimal(value);
    };

    BDecimal.fromNumber = function (value) {
      return new BDecimal().fromNumber(value);
    };

    BDecimal.fromString = function (value) {
      return new BDecimal().fromString(value);
    };

    BDecimal.fromValue = function (value) {
      return new BDecimal().fromValue(value);
    };

    BDecimal.fromValue_noAlloc = function (value) {
      return value instanceof BDecimal ? value : new BDecimal(value);
    };
    
    BDecimal.abs = function (value) {
      return D(value).abs();
    };

    BDecimal.neg = function (value) {
      return D(value).neg();
    };

    BDecimal.negate = function (value) {
      return D(value).neg();
    };

    BDecimal.negated = function (value) {
      return D(value).neg();
    };

    BDecimal.sign = function (value) {
      return D(value).sign();
    };

    BDecimal.sgn = function (value) {
      return D(value).sign();
    };

    BDecimal.round = function (value) {
      return D(value).round();
    };

    BDecimal.floor = function (value) {
      return D(value).floor();
    };

    BDecimal.ceil = function (value) {
      return D(value).ceil();
    };

    BDecimal.trunc = function (value) {
      return D(value).trunc();
    };

    BDecimal.add = function (value, other) {
      return D(value).add(other);
    };

    BDecimal.plus = function (value, other) {
      return D(value).add(other);
    };

    BDecimal.sub = function (value, other) {
      return D(value).sub(other);
    };

    BDecimal.subtract = function (value, other) {
      return D(value).sub(other);
    };

    BDecimal.minus = function (value, other) {
      return D(value).sub(other);
    };

    BDecimal.mul = function (value, other) {
      return D(value).mul(other);
    };

    BDecimal.multiply = function (value, other) {
      return D(value).mul(other);
    };

    BDecimal.times = function (value, other) {
      return D(value).mul(other);
    };

    BDecimal.div = function (value, other) {
      return D(value).div(other);
    };

    BDecimal.divide = function (value, other) {
      return D(value).div(other);
    };

    BDecimal.recip = function (value) {
      return D(value).recip();
    };

    BDecimal.reciprocal = function (value) {
      return D(value).recip();
    };

    BDecimal.reciprocate = function (value) {
      return D(value).reciprocate();
    };

    BDecimal.cmp = function (value, other) {
      return D(value).cmp(other);
    };

	BDecimal.cmpabs = function (value, other) {
      return D(value).cmpabs(other);
    };
	
    BDecimal.compare = function (value, other) {
      return D(value).cmp(other);
    };

    BDecimal.eq = function (value, other) {
      return D(value).eq(other);
    };

    BDecimal.equals = function (value, other) {
      return D(value).eq(other);
    };

    BDecimal.neq = function (value, other) {
      return D(value).neq(other);
    };

    BDecimal.notEquals = function (value, other) {
      return D(value).notEquals(other);
    };

    BDecimal.lt = function (value, other) {
      return D(value).lt(other);
    };

    BDecimal.lte = function (value, other) {
      return D(value).lte(other);
    };

    BDecimal.gt = function (value, other) {
      return D(value).gt(other);
    };

    BDecimal.gte = function (value, other) {
      return D(value).gte(other);
    };

    BDecimal.max = function (value, other) {
      return D(value).max(other);
    };
    
    BDecimal.min = function (value, other) {
      return D(value).min(other);
    };

    BDecimal.minabs = function (value, other) {
      return D(value).minabs(other);
    };
	
    BDecimal.maxabs = function (value, other) {
      return D(value).maxabs(other);
    };
    
    BDecimal.clamp = function(value, min, max) {
      return D(value).clamp(min, max);
    }
    
    BDecimal.clampMin = function(value, min) {
      return D(value).clampMin(min);
    }
    
    BDecimal.clampMax = function(value, max) {
      return D(value).clampMax(max);
    }

    BDecimal.cmp_tolerance = function (value, other, tolerance) {
      return D(value).cmp_tolerance(other, tolerance);
    };

    BDecimal.compare_tolerance = function (value, other, tolerance) {
      return D(value).cmp_tolerance(other, tolerance);
    };

    BDecimal.eq_tolerance = function (value, other, tolerance) {
      return D(value).eq_tolerance(other, tolerance);
    };

    BDecimal.equals_tolerance = function (value, other, tolerance) {
      return D(value).eq_tolerance(other, tolerance);
    };

    BDecimal.neq_tolerance = function (value, other, tolerance) {
      return D(value).neq_tolerance(other, tolerance);
    };

    BDecimal.notEquals_tolerance = function (value, other, tolerance) {
      return D(value).notEquals_tolerance(other, tolerance);
    };

    BDecimal.lt_tolerance = function (value, other, tolerance) {
      return D(value).lt_tolerance(other, tolerance);
    };

    BDecimal.lte_tolerance = function (value, other, tolerance) {
      return D(value).lte_tolerance(other, tolerance);
    };

    BDecimal.gt_tolerance = function (value, other, tolerance) {
      return D(value).gt_tolerance(other, tolerance);
    };

    BDecimal.gte_tolerance = function (value, other, tolerance) {
      return D(value).gte_tolerance(other, tolerance);
    };

    BDecimal.pLog10 = function (value) {
      return D(value).pLog10();
    };
    
    BDecimal.absLog10 = function (value) {
      return D(value).absLog10();
    };
    
    BDecimal.log10 = function (value) {
      return D(value).log10();
    };

    BDecimal.log = function (value, base) {
      return D(value).log(base);
    };

    BDecimal.log2 = function (value) {
      return D(value).log2();
    };

    BDecimal.ln = function (value) {
      return D(value).ln();
    };

    BDecimal.logarithm = function (value, base) {
      return D(value).logarithm(base);
    };

    BDecimal.pow = function (value, other) {
      return D(value).pow(other);
    };
    
    BDecimal.pow10 = function (value) {
      return D(value).pow10();
    };
    
    BDecimal.root = function (value, other) {
      return D(value).root(other);
    };
    
    BDecimal.factorial = function (value, other) {
      return D(value).factorial();
    };
    
    BDecimal.gamma = function (value, other) {
      return D(value).gamma();
    };
    
    BDecimal.lngamma = function (value, other) {
      return D(value).lngamma();
    };

    BDecimal.exp = function (value) {
      return D(value).exp();
    };

    BDecimal.sqr = function (value) {
      return D(value).sqr();
    };

    BDecimal.sqrt = function (value) {
      return D(value).sqrt();
    };

    BDecimal.cube = function (value) {
      return D(value).cube();
    };

    BDecimal.cbrt = function (value) {
      return D(value).cbrt();
    };
    
    BDecimal.tetrate = function (value, height = 2, payload = FC_NN(1, 0, 1)) {
      return D(value).tetrate(height, payload);
    }
    
    BDecimal.iteratedexp = function (value, height = 2, payload = FC_NN(1, 0, 1)) {
      return D(value).iteratedexp(height, payload);
    }
    
    BDecimal.iteratedlog = function (value, base = 10, times = 1) {
      return D(value).iteratedlog(base, times);
    }
    
    BDecimal.layeradd10 = function (value, diff) {
      return D(value).layeradd10(diff);
    }
    
     BDecimal.layeradd = function (value, diff, base = 10) {
      return D(value).layeradd(diff, base);
    }
    
    BDecimal.slog = function (value, base = 10) {
      return D(value).slog(base);
    }
    
    BDecimal.lambertw = function(value) {
      return D(value).lambertw();
    }
    
    BDecimal.ssqrt = function(value) {
      return D(value).ssqrt();
    }
    
    BDecimal.pentate = function (value, height = 2, payload = FC_NN(1, 0, 1)) {
      return D(value).pentate(height, payload);
    }
    
    /**
     * If you're willing to spend 'resourcesAvailable' and want to buy something
     * with exponentially increasing cost each purchase (start at priceStart,
     * multiply by priceRatio, already own currentOwned), how much of it can you buy?
     * Adapted from Trimps source code.
     */


    BDecimal.affordGeometricSeries = function (resourcesAvailable, priceStart, priceRatio, currentOwned) {
      return this.affordGeometricSeries_core(D(resourcesAvailable), D(priceStart), D(priceRatio), currentOwned);
    };
    /**
     * How much resource would it cost to buy (numItems) items if you already have currentOwned,
     * the initial price is priceStart and it multiplies by priceRatio each purchase?
     */


    BDecimal.sumGeometricSeries = function (numItems, priceStart, priceRatio, currentOwned) {
      return this.sumGeometricSeries_core(numItems, D(priceStart), D(priceRatio), currentOwned);
    };
    /**
     * If you're willing to spend 'resourcesAvailable' and want to buy something with additively
     * increasing cost each purchase (start at priceStart, add by priceAdd, already own currentOwned),
     * how much of it can you buy?
     */


    BDecimal.affordArithmeticSeries = function (resourcesAvailable, priceStart, priceAdd, currentOwned) {
      return this.affordArithmeticSeries_core(D(resourcesAvailable), D(priceStart), D(priceAdd), D(currentOwned));
    };
    /**
     * How much resource would it cost to buy (numItems) items if you already have currentOwned,
     * the initial price is priceStart and it adds priceAdd each purchase?
     * Adapted from http://www.mathwords.com/a/arithmetic_series.htm
     */


    BDecimal.sumArithmeticSeries = function (numItems, priceStart, priceAdd, currentOwned) {
      return this.sumArithmeticSeries_core(D(numItems), D(priceStart), D(priceAdd), D(currentOwned));
    };
    /**
     * When comparing two purchases that cost (resource) and increase your resource/sec by (deltaRpS),
     * the lowest efficiency score is the better one to purchase.
     * From Frozen Cookies:
     * http://cookieclicker.wikia.com/wiki/Frozen_Cookies_(JavaScript_Add-on)#Efficiency.3F_What.27s_that.3F
     */


    BDecimal.efficiencyOfPurchase = function (cost, currentRpS, deltaRpS) {
      return this.efficiencyOfPurchase_core(D(cost), D(currentRpS), D(deltaRpS));
    };

    BDecimal.randomBDecimalForTesting = function (maxLayers) {
      // NOTE: This doesn't follow any kind of sane random distribution, so use this for testing purposes only.
      //5% of the time, return 0
      if (Math.random() * 20 < 1) {
        return FC_NN(0, 0, 0);
      }
      
      var randomsign = Math.random() > 0.5 ? 1 : -1;
      
      //5% of the time, return 1 or -1
      if (Math.random() * 20 < 1) {
        return FC_NN(randomsign, 0, 1);
      }
      
      //pick a random layer
      var layer = Math.floor(Math.random()*(maxLayers+1));

      var randomexp = layer === 0 ? Math.random()*616-308 : Math.random()*16;
      //10% of the time, make it a simple power of 10
      if (Math.random() > 0.9) { randomexp = Math.trunc(randomexp); }
      var randommag = Math.pow(10, randomexp);
      //10% of the time, trunc mag
      if (Math.random() > 0.9) { randommag = Math.trunc(randommag); }
      return FC(randomsign, layer, randommag);
    };

    BDecimal.affordGeometricSeries_core = function (resourcesAvailable, priceStart, priceRatio, currentOwned) {
      var actualStart = priceStart.mul(priceRatio.pow(currentOwned));
      return BDecimal.floor(resourcesAvailable.div(actualStart).mul(priceRatio.sub(1)).add(1).log10().div(priceRatio.log10()));
    };

    BDecimal.sumGeometricSeries_core = function (numItems, priceStart, priceRatio, currentOwned) {
      return priceStart.mul(priceRatio.pow(currentOwned)).mul(BDecimal.sub(1, priceRatio.pow(numItems))).div(BDecimal.sub(1, priceRatio));
    };

    BDecimal.affordArithmeticSeries_core = function (resourcesAvailable, priceStart, priceAdd, currentOwned) {
      // n = (-(a-d/2) + sqrt((a-d/2)^2+2dS))/d
      // where a is actualStart, d is priceAdd and S is resourcesAvailable
      // then floor it and you're done!
      var actualStart = priceStart.add(currentOwned.mul(priceAdd));
      var b = actualStart.sub(priceAdd.div(2));
      var b2 = b.pow(2);
      return b.neg().add(b2.add(priceAdd.mul(resourcesAvailable).mul(2)).sqrt()).div(priceAdd).floor();
    };

    BDecimal.sumArithmeticSeries_core = function (numItems, priceStart, priceAdd, currentOwned) {
      var actualStart = priceStart.add(currentOwned.mul(priceAdd)); // (n/2)*(2*a+(n-1)*d)

      return numItems.div(2).mul(actualStart.mul(2).plus(numItems.sub(1).mul(priceAdd)));
    };

    BDecimal.efficiencyOfPurchase_core = function (cost, currentRpS, deltaRpS) {
      return cost.div(currentRpS).add(cost.div(deltaRpS));
    };
    
    BDecimal.prototype.normalize = function () {
      /*
      PSEUDOCODE:
      Whenever we are partially 0 (sign is 0 or mag and layer is 0), make it fully 0.
      Whenever we are at or hit layer 0, extract sign from negative mag.
      If layer === 0 and mag < FIRST_NEG_LAYER (1/9e15), shift to 'first negative layer' (add layer, log10 mag).
      While abs(mag) > EXP_LIMIT (9e15), layer += 1, mag = maglog10(mag).
      While abs(mag) < LAYER_DOWN (15.954) and layer > 0, layer -= 1, mag = pow(10, mag).
      
      When we're done, all of the following should be true OR one of the numbers is not IsFinite OR layer is not IsInteger (error state):
      Any 0 is totally zero (0, 0, 0).
      Anything layer 0 has mag 0 OR mag > 1/9e15 and < 9e15.
      Anything layer 1 or higher has abs(mag) >= 15.954 and < 9e15.
      We will assume in calculations that all BDecimals are either erroneous or satisfy these criteria. (Otherwise: Garbage in, garbage out.)
      */
      if (this.sign === 0 || (this.mag === 0 && this.layer === 0))
      {
        this.sign = 0;
        this.mag = 0;
        this.layer = 0;
        return this;
      }
      
      if (this.layer === 0 && this.mag < 0)
      {
        //extract sign from negative mag at layer 0
        this.mag = -this.mag;
        this.sign = -this.sign;
      }
      
      //Handle shifting from layer 0 to negative layers.
      if (this.layer === 0 && this.mag < FIRST_NEG_LAYER)
      {
        this.layer += 1;
        this.mag = Math.log10(this.mag);
        return this;
      }
      
      var absmag = Math.abs(this.mag);
      var signmag = Math.sign(this.mag);
      
      if (absmag >= EXP_LIMIT)
      {
        this.layer += 1;
        this.mag = signmag*Math.log10(absmag);
        return this;
      }
      else
      {
        while (absmag < LAYER_DOWN && this.layer > 0)
        {
          this.layer -= 1;
          if (this.layer === 0)
          {
            this.mag = Math.pow(10, this.mag);
          }
          else
          {
            this.mag = signmag*Math.pow(10, absmag);
            absmag = Math.abs(this.mag);
            signmag = Math.sign(this.mag);
          }
        }
        if (this.layer === 0)
        {
          if (this.mag < 0)
          {
            //extract sign from negative mag at layer 0
            this.mag = -this.mag;
            this.sign = -this.sign;
          }
          else if (this.mag === 0)
          {
            //excessive rounding can give us all zeroes
            this.sign = 0;
          }
        }
      }

      return this;
    };

    BDecimal.prototype.fromComponents = function (sign, layer, mag) {
      this.sign = sign;
      this.layer = layer;
      this.mag = mag;

      this.normalize();
      return this;
    };

    BDecimal.prototype.fromComponents_noNormalize = function (sign, layer, mag) {
      this.sign = sign;
      this.layer = layer;
      this.mag = mag;
      return this;
    };
    
    BDecimal.prototype.fromMantissaExponent = function (mantissa, exponent) {
      this.layer = 1;
      this.sign = Math.sign(mantissa);
      mantissa = Math.abs(mantissa);
      this.mag = exponent + Math.log10(mantissa);

      this.normalize();
      return this;
    };


    BDecimal.prototype.fromMantissaExponent_noNormalize = function (mantissa, exponent) {
      //The idea of 'normalizing' a break_infinity.js style BDecimal doesn't really apply. So just do the same thing.
      this.fromMantissaExponent(mantissa, exponent);
      return this;
    };

    BDecimal.prototype.fromBDecimal = function (value) {
      this.sign = value.sign;
      this.layer = value.layer;
      this.mag = value.mag;
      return this;
    };

    BDecimal.prototype.fromNumber = function (value) {
      this.mag = Math.abs(value);
      this.sign = Math.sign(value);
      this.layer = 0;
      this.normalize();
      return this;
    };

    var IGNORE_COMMAS = true;
    var COMMAS_ARE_BDecimal_POINTS = false;
    
    BDecimal.prototype.fromString = function (value) {
      if (IGNORE_COMMAS) { value = value.replace(",", ""); }
      else if (COMMAS_ARE_BDecimal_POINTS) { value = value.replace(",", "."); }
    
      //Handle x^^^y format.
      var pentationparts = value.split("^^^");
      if (pentationparts.length === 2)
      {
        var base = parseFloat(pentationparts[0]);
        var height = parseFloat(pentationparts[1]);
        var payload = 1;
        var heightparts = pentationparts[1].split(";");
        if (heightparts.length === 2)
        {
          var payload = parseFloat(heightparts[1]);
          if (!isFinite(payload)) { payload = 1; }
        }
        if (isFinite(base) && isFinite(height))
        {
          var result = BDecimal.pentate(base, height, payload);
          this.sign = result.sign;
          this.layer = result.layer;
          this.mag = result.mag;
          return this;
        }
      }
    
      //Handle x^^y format.
      var tetrationparts = value.split("^^");
      if (tetrationparts.length === 2)
      {
        var base = parseFloat(tetrationparts[0]);
        var height = parseFloat(tetrationparts[1]);
        var heightparts = tetrationparts[1].split(";");
        if (heightparts.length === 2)
        {
          var payload = parseFloat(heightparts[1]);
          if (!isFinite(payload)) { payload = 1; }
        }
        if (isFinite(base) && isFinite(height))
        {
          var result = BDecimal.tetrate(base, height, payload);
          this.sign = result.sign;
          this.layer = result.layer;
          this.mag = result.mag;
          return this;
        }
      }
      
      //Handle x^y format.
      var powparts = value.split("^");
      if (powparts.length === 2)
      {
        var base = parseFloat(powparts[0]);
        var exponent = parseFloat(powparts[1]);
        if (isFinite(base) && isFinite(exponent))
        {
          var result = BDecimal.pow(base, exponent);
          this.sign = result.sign;
          this.layer = result.layer;
          this.mag = result.mag;
          return this;
        }
      }
      
      //Handle various cases involving it being a Big Number.
      value = value.trim().toLowerCase();
      
      //handle X PT Y format.
      var ptparts = value.split("pt");
      if (ptparts.length === 2)
      {
        base = 10;
        height = parseFloat(ptparts[0]);
        ptparts[1] = ptparts[1].replace("(", "");
        ptparts[1] = ptparts[1].replace(")", "");
        var payload = parseFloat(ptparts[1]);
        if (!isFinite(payload)) { payload = 1; }
        if (isFinite(base) && isFinite(height))
        {
          var result = BDecimal.tetrate(base, height, payload);
          this.sign = result.sign;
          this.layer = result.layer;
          this.mag = result.mag;
          return this;
        }
      }
      
      //handle XpY format (it's the same thing just with p).
      var ptparts = value.split("p");
      if (ptparts.length === 2)
      {
        base = 10;
        height = parseFloat(ptparts[0]);
        ptparts[1] = ptparts[1].replace("(", "");
        ptparts[1] = ptparts[1].replace(")", "");
        var payload = parseFloat(ptparts[1]);
        if (!isFinite(payload)) { payload = 1; }
        if (isFinite(base) && isFinite(height))
        {
          var result = BDecimal.tetrate(base, height, payload);
          this.sign = result.sign;
          this.layer = result.layer;
          this.mag = result.mag;
          return this;
        }
      }

      var parts = value.split("e");
      var ecount = parts.length-1;
    
      //Handle numbers that are exactly floats (0 or 1 es).
      if (ecount === 0)
      {
        var numberAttempt = parseFloat(value);
        if (isFinite(numberAttempt))
        {
          return this.fromNumber(numberAttempt);
        }
      }
      else if (ecount === 1)
      {
        //Very small numbers ("2e-3000" and so on) may look like valid floats but round to 0.
        var numberAttempt = parseFloat(value);
        if (isFinite(numberAttempt) && numberAttempt !== 0)
        {
          return this.fromNumber(numberAttempt);
        }
      }
      
      //Handle new (e^N)X format.
      var newparts = value.split("e^");
      if (newparts.length === 2)
      {
        this.sign = 1;
        if (newparts[0].charAt(0) == "-")
        {
          this.sign = -1;
        }
        var layerstring = "";
        for (var i = 0; i < newparts[1].length; ++i)
        {
          var chrcode = newparts[1].charCodeAt(i);
          if ((chrcode >= 43 && chrcode <= 57) || chrcode === 101) //is "0" to "9" or "+" or "-" or "." or "e" (or "," or "/")
          {
            layerstring += newparts[1].charAt(i);
          }
          else //we found the end of the layer count
          {
            this.layer = parseFloat(layerstring);
            this.mag = parseFloat(newparts[1].substr(i+1));
            this.normalize();
            return this;
          }
        }
      }
      
      if (ecount < 1) { this.sign = 0; this.layer = 0; this.mag = 0; return this; }
      var mantissa = parseFloat(parts[0]);
      if (mantissa === 0) { this.sign = 0; this.layer = 0; this.mag = 0; return this; }
      var exponent = parseFloat(parts[parts.length-1]);
      //handle numbers like AeBeC and AeeeeBeC
      if (ecount >= 2)
      {
        var me = parseFloat(parts[parts.length-2]);
        if (isFinite(me))
        {
          exponent *= Math.sign(me);
          exponent += f_maglog10(me);
        }
      }
      
      //Handle numbers written like eee... (N es) X
      if (!isFinite(mantissa))
      {
        this.sign = (parts[0] === "-") ? -1 : 1;
        this.layer = ecount;
        this.mag = exponent;
      }
      //Handle numbers written like XeY
      else if (ecount === 1)
      {
        this.sign = Math.sign(mantissa);
        this.layer = 1;
        //Example: 2e10 is equal to 10^log10(2e10) which is equal to 10^(10+log10(2))
        this.mag = exponent + Math.log10(Math.abs(mantissa));
      }
      //Handle numbers written like Xeee... (N es) Y
      else
      {
        this.sign = Math.sign(mantissa);
        this.layer = ecount;
        if (ecount === 2)
        {
          var result = BDecimal.mul(FC(1, 2, exponent), D(mantissa));
          this.sign = result.sign;
          this.layer = result.layer;
          this.mag = result.mag;
          return this;
        }
        else
        {
          //at eee and above, mantissa is too small to be recognizable!
          this.mag = exponent;
        }
      }
      
      this.normalize();
      return this;
    };

    BDecimal.prototype.fromValue = function (value) {
      if (value instanceof BDecimal) {
        return this.fromBDecimal(value);
      }

      if (typeof value === "number") {
        return this.fromNumber(value);
      }

      if (typeof value === "string") {
        return this.fromString(value);
      }

      this.sign = 0;
      this.layer = 0;
      this.mag = 0;
      return this;
    };

    BDecimal.prototype.toNumber = function () {
      if (!Number.isFinite(this.layer)) { return Number.NaN; }
      if (this.layer === 0)
      {
        return this.sign*this.mag;
      }
      else if (this.layer === 1)
      {
        return this.sign*Math.pow(10, this.mag);
      }
      else //overflow for any normalized BDecimal
      {
        return this.mag > 0 ? (this.sign > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY) : 0;
      }
    };
    
    BDecimal.prototype.mantissaWithBDecimalPlaces = function (places) {
      // https://stackoverflow.com/a/37425022
      if (isNaN(this.m)) {
        return Number.NaN;
      }

      if (this.m === 0) {
        return 0;
      }

      return BDecimalPlaces(this.m, places);
    };
    
    BDecimal.prototype.magnitudeWithBDecimalPlaces = function (places) {
      // https://stackoverflow.com/a/37425022
      if (isNaN(this.mag)) {
        return Number.NaN;
      }

      if (this.mag === 0) {
        return 0;
      }

      return BDecimalPlaces(this.mag, places);
    };
    
    BDecimal.prototype.toString = function () {
      if (this.layer === 0)
      {
        if ((this.mag < 1e21 && this.mag > 1e-7) || this.mag === 0)
        {
          return (this.sign*this.mag).toString();
        }
        return this.m + "e" + this.e;
      }
      else if (this.layer === 1)
      {
        return this.m + "e" + this.e;
      }
      else
      {
        //layer 2+
        if (this.layer <= MAX_ES_IN_A_ROW)
        {
          return (this.sign === -1 ? "-" : "") + "e".repeat(this.layer) + this.mag;
        }
        else
        {
          return (this.sign === -1 ? "-" : "") + "(e^" + this.layer + ")" + this.mag;
        }
      }
    };
    
    BDecimal.prototype.toExponential = function (places) {
      if (this.layer === 0)
      {
        return (this.sign*this.mag).toExponential(places);
      }
      return this.toStringWithBDecimalPlaces(places);
    };
    
    BDecimal.prototype.toFixed = function (places) {
      if (this.layer === 0)
      {
        return (this.sign*this.mag).toFixed(places);
      }
      return this.toStringWithBDecimalPlaces(places);
    };
    
    BDecimal.prototype.toPrecision = function (places) {
      if (this.e <= -7) {
        return this.toExponential(places - 1);
      }

      if (places > this.e) {
        return this.toFixed(places - this.exponent - 1);
      }

      return this.toExponential(places - 1);
    };
    
    BDecimal.prototype.valueOf = function () {
      return this.toString();
    };

    BDecimal.prototype.toJSON = function () {
      return this.toString();
    };
    
    BDecimal.prototype.toStringWithBDecimalPlaces = function (places) {
      if (this.layer === 0)
      {
        if ((this.mag < 1e21 && this.mag > 1e-7) || this.mag === 0)
        {
          return (this.sign*this.mag).toFixed(places);
        }
        return BDecimalPlaces(this.m, places) + "e" + BDecimalPlaces(this.e, places);
      }
      else if (this.layer === 1)
      {
        return BDecimalPlaces(this.m, places) + "e" + BDecimalPlaces(this.e, places);
      }
      else
      {
        //layer 2+
        if (this.layer <= MAX_ES_IN_A_ROW)
        {
          return (this.sign === -1 ? "-" : "") + "e".repeat(this.layer) + BDecimalPlaces(this.mag, places);
        }
        else
        {
          return (this.sign === -1 ? "-" : "") + "(e^" + this.layer + ")" + BDecimalPlaces(this.mag, places);
        }
      }
    };
    
    BDecimal.prototype.abs = function () {
      return FC_NN(this.sign === 0 ? 0 : 1, this.layer, this.mag);
    };

    BDecimal.prototype.neg = function () {
      return FC_NN(-this.sign, this.layer, this.mag);
    };

    BDecimal.prototype.negate = function () {
      return this.neg();
    };

    BDecimal.prototype.negated = function () {
      return this.neg();
    };

    BDecimal.prototype.sign = function () {
      return this.sign;
    };

    BDecimal.prototype.sgn = function () {
      return this.sign;
    };
    
    BDecimal.prototype.round = function () {
      if (this.mag < 0)
      {
        return BDecimal.dZero;
      }
      if (this.layer === 0)
      {
        return FC(this.sign, 0, Math.round(this.mag));
      }
      return this;
    };

    BDecimal.prototype.floor = function () {
      if (this.mag < 0)
      {
        return BDecimal.dZero;
      }
      if (this.layer === 0)
      {
        return FC(this.sign, 0, Math.floor(this.mag));
      }
      return this;
    };

    BDecimal.prototype.ceil = function () {
      if (this.mag < 0)
      {
        return BDecimal.dZero;
      }
      if (this.layer === 0)
      {
        return FC(this.sign, 0, Math.ceil(this.mag));
      }
      return this;
    };

    BDecimal.prototype.trunc = function () {
      if (this.mag < 0)
      {
        return BDecimal.dZero;
      }
      if (this.layer === 0)
      {
        return FC(this.sign, 0, Math.trunc(this.mag));
      }
      return this;
    };

    BDecimal.prototype.add = function (value) {
      var BDecimal = D(value);
      
      //inf/nan check
      if (!Number.isFinite(this.layer)) { return this; }
      if (!Number.isFinite(BDecimal.layer)) { return BDecimal; }
      
      //Special case - if one of the numbers is 0, return the other number.
      if (this.sign === 0) { return BDecimal; }
      if (BDecimal.sign === 0) { return this; }
      
      //Special case - Adding a number to its negation produces 0, no matter how large.
      if (this.sign === -(BDecimal.sign) && this.layer === BDecimal.layer && this.mag === BDecimal.mag) { return FC_NN(0, 0, 0); }
      
      var a;
      var b;
      
      //Special case: If one of the numbers is layer 2 or higher, just take the bigger number.
      if ((this.layer >= 2 || BDecimal.layer >= 2)) { return this.maxabs(BDecimal); }
      
      if (BDecimal.cmpabs(this, BDecimal) > 0)
      {
        a = this;
        b = BDecimal;
      }
      else
      {
        a = BDecimal;
        b = this;
      }
      
      if (a.layer === 0 && b.layer === 0) { return D(a.sign*a.mag + b.sign*b.mag); }
      
      var layera = a.layer*Math.sign(a.mag);
      var layerb = b.layer*Math.sign(b.mag);
      
      //If one of the numbers is 2+ layers higher than the other, just take the bigger number.
      if (layera - layerb >= 2) { return a; }
      
      if (layera === 0 && layerb === -1)
      {
        if (Math.abs(b.mag-Math.log10(a.mag)) > MAX_SIGNIFICANT_DIGITS)
        {
          return a;
        }
        else
        {
          var magdiff = Math.pow(10, Math.log10(a.mag)-b.mag);
          var mantissa = (b.sign)+(a.sign*magdiff);
          return FC(Math.sign(mantissa), 1, b.mag+Math.log10(Math.abs(mantissa)));
        }
      }
      
      if (layera === 1 && layerb === 0)
      {
        if (Math.abs(a.mag-Math.log10(b.mag)) > MAX_SIGNIFICANT_DIGITS)
        {
          return a;
        }
        else
        {
          var magdiff = Math.pow(10, a.mag-Math.log10(b.mag));
          var mantissa = (b.sign)+(a.sign*magdiff);
          return FC(Math.sign(mantissa), 1, Math.log10(b.mag)+Math.log10(Math.abs(mantissa)));
        }
      }
      
      if (Math.abs(a.mag-b.mag) > MAX_SIGNIFICANT_DIGITS)
      {
        return a;
      }
      else
      {
        var magdiff = Math.pow(10, a.mag-b.mag);
        var mantissa = (b.sign)+(a.sign*magdiff);
        return FC(Math.sign(mantissa), 1, b.mag+Math.log10(Math.abs(mantissa)));
      }
      
      throw Error("Bad arguments to add: " + this + ", " + value);
    };

    BDecimal.prototype.plus = function (value) {
      return this.add(value);
    };

    BDecimal.prototype.sub = function (value) {
      return this.add(D(value).neg());
    };

    BDecimal.prototype.subtract = function (value) {
      return this.sub(value);
    };

    BDecimal.prototype.minus = function (value) {
      return this.sub(value);
    };

    BDecimal.prototype.mul = function (value) {
      var BDecimal = D(value);
      
      //inf/nan check
      if (!Number.isFinite(this.layer)) { return this; }
      if (!Number.isFinite(BDecimal.layer)) { return BDecimal; }
      
      //Special case - if one of the numbers is 0, return 0.
      if (this.sign === 0 || BDecimal.sign === 0) { return FC_NN(0, 0, 0); }
      
      //Special case - Multiplying a number by its own reciprocal yields +/- 1, no matter how large.
      if (this.layer === BDecimal.layer && this.mag === -BDecimal.mag) { return FC_NN(this.sign*BDecimal.sign, 0, 1); }
            
      var a;
      var b;
      
      //Which number is bigger in terms of its multiplicative distance from 1?
      if ((this.layer > BDecimal.layer) || (this.layer == BDecimal.layer && Math.abs(this.mag) > Math.abs(BDecimal.mag)))
      {
        a = this;
        b = BDecimal;
      }
      else
      {
        a = BDecimal;
        b = this;
      }
      
      if (a.layer === 0 && b.layer === 0) { return D(a.sign*b.sign*a.mag*b.mag); }
      
      //Special case: If one of the numbers is layer 3 or higher or one of the numbers is 2+ layers bigger than the other, just take the bigger number.
      if (a.layer >= 3 || (a.layer - b.layer >= 2)) { return FC(a.sign*b.sign, a.layer, a.mag); }

      if (a.layer === 1 && b.layer === 0)
      { 
        return FC(a.sign*b.sign, 1, a.mag+Math.log10(b.mag));
      }
      
      if (a.layer === 1 && b.layer === 1)
      {
        return FC(a.sign*b.sign, 1, a.mag+b.mag);
      }
      
      if (a.layer === 2 && b.layer === 1)
      {
        var newmag = FC(Math.sign(a.mag), a.layer-1, Math.abs(a.mag)).add(FC(Math.sign(b.mag), b.layer-1, Math.abs(b.mag)));
        return FC(a.sign*b.sign, newmag.layer+1, newmag.sign*newmag.mag);
      }
      
      if (a.layer === 2 && b.layer === 2)
      {
        var newmag = FC(Math.sign(a.mag), a.layer-1, Math.abs(a.mag)).add(FC(Math.sign(b.mag), b.layer-1, Math.abs(b.mag)));
        return FC(a.sign*b.sign, newmag.layer+1, newmag.sign*newmag.mag);
      }
      
      throw Error("Bad arguments to mul: " + this + ", " + value);
    };

    BDecimal.prototype.multiply = function (value) {
      return this.mul(value);
    };

    BDecimal.prototype.times = function (value) {
      return this.mul(value);
    };

    BDecimal.prototype.div = function (value) {
      var BDecimal = D(value);
      return this.mul(BDecimal.recip());
    };

    BDecimal.prototype.divide = function (value) {
      return this.div(value);
    };

    BDecimal.prototype.divideBy = function (value) {
      return this.div(value);
    };

    BDecimal.prototype.dividedBy = function (value) {
      return this.div(value);
    };

    BDecimal.prototype.recip = function () {
      if (this.mag === 0)
      {
        return BDecimal.dNaN;
      }
      else if (this.layer === 0)
      {
        return FC(this.sign, 0, 1/this.mag);
      }
      else
      {
        return FC(this.sign, this.layer, -this.mag);
      }
    };

    BDecimal.prototype.reciprocal = function () {
      return this.recip();
    };

    BDecimal.prototype.reciprocate = function () {
      return this.recip();
    };
    
    /**
     * -1 for less than value, 0 for equals value, 1 for greater than value
     */
    BDecimal.prototype.cmp = function (value) {
      var BDecimal = D(value);
      if (this.sign > BDecimal.sign) { return 1; }
      if (this.sign < BDecimal.sign) { return -1; }
      return this.sign*this.cmpabs(value);
    };
	
	BDecimal.prototype.cmpabs = function (value) {
      var BDecimal = D(value);
      var layera = this.mag > 0 ? this.layer : -this.layer;
      var layerb = BDecimal.mag > 0 ? BDecimal.layer : -BDecimal.layer;
      if (layera > layerb) { return 1; }
      if (layera < layerb) { return -1; }
      if (this.mag > BDecimal.mag) { return 1; }
      if (this.mag < BDecimal.mag) { return -1; }
      return 0;
    };

    BDecimal.prototype.compare = function (value) {
      return this.cmp(value);
    };

    BDecimal.prototype.eq = function (value) {
      var BDecimal = D(value);
      return this.sign === BDecimal.sign && this.layer === BDecimal.layer && this.mag === BDecimal.mag;
    };

    BDecimal.prototype.equals = function (value) {
      return this.eq(value);
    };

    BDecimal.prototype.neq = function (value) {
      return !this.eq(value);
    };

    BDecimal.prototype.notEquals = function (value) {
      return this.neq(value);
    };

    BDecimal.prototype.lt = function (value) {
      var BDecimal = D(value);
      return this.cmp(value) === -1;
    };

    BDecimal.prototype.lte = function (value) {
      return !this.gt(value);
    };

    BDecimal.prototype.gt = function (value) {
      var BDecimal = D(value);
      return this.cmp(value) === 1;
    };

    BDecimal.prototype.gte = function (value) {
      return !this.lt(value);
    };

    BDecimal.prototype.max = function (value) {
      var BDecimal = D(value);
      return this.lt(BDecimal) ? BDecimal : this;
    };

    BDecimal.prototype.min = function (value) {
      var BDecimal = D(value);
      return this.gt(BDecimal) ? BDecimal : this;
    };
	
	BDecimal.prototype.maxabs = function (value) {
      var BDecimal = D(value);
      return this.cmpabs(BDecimal) < 0 ? BDecimal : this;
    };

    BDecimal.prototype.minabs = function (value) {
      var BDecimal = D(value);
      return this.cmpabs(BDecimal) > 0 ? BDecimal : this;
    };
    
    BDecimal.prototype.clamp = function(min, max) {
      return this.max(min).min(max);
    }
    
    BDecimal.prototype.clampMin = function(min) {
      return this.max(min);
    }
    
    BDecimal.prototype.clampMax = function(max) {
      return this.min(max);
    }

    BDecimal.prototype.cmp_tolerance = function (value, tolerance) {
      var BDecimal = D(value);
      return this.eq_tolerance(BDecimal, tolerance) ? 0 : this.cmp(BDecimal);
    };

    BDecimal.prototype.compare_tolerance = function (value, tolerance) {
      return this.cmp_tolerance(value, tolerance);
    };
    
    /**
     * Tolerance is a relative tolerance, multiplied by the greater of the magnitudes of the two arguments.
     * For example, if you put in 1e-9, then any number closer to the
     * larger number than (larger number)*1e-9 will be considered equal.
     */
    BDecimal.prototype.eq_tolerance = function (value, tolerance) {
      var BDecimal = D(value); // https://stackoverflow.com/a/33024979
      if (tolerance == null) { tolerance = 1e-7; }
      //Numbers that are too far away are never close.
      if (this.sign !== BDecimal.sign) { return false; }
      if (Math.abs(this.layer - BDecimal.layer) > 1) { return false; }
      // return abs(a-b) <= tolerance * max(abs(a), abs(b))
      var magA = this.mag;
      var magB = BDecimal.mag;
      if (this.layer > BDecimal.layer) { magB = f_maglog10(magB); }
      if (this.layer < BDecimal.layer) { magA = f_maglog10(magA); }
      return Math.abs(magA-magB) <= tolerance*Math.max(Math.abs(magA), Math.abs(magB));
    };

    BDecimal.prototype.equals_tolerance = function (value, tolerance) {
      return this.eq_tolerance(value, tolerance);
    };

    BDecimal.prototype.neq_tolerance = function (value, tolerance) {
      return !this.eq_tolerance(value, tolerance);
    };

    BDecimal.prototype.notEquals_tolerance = function (value, tolerance) {
      return this.neq_tolerance(value, tolerance);
    };

    BDecimal.prototype.lt_tolerance = function (value, tolerance) {
      var BDecimal = D(value);
      return !this.eq_tolerance(BDecimal, tolerance) && this.lt(BDecimal);
    };

    BDecimal.prototype.lte_tolerance = function (value, tolerance) {
      var BDecimal = D(value);
      return this.eq_tolerance(BDecimal, tolerance) || this.lt(BDecimal);
    };

    BDecimal.prototype.gt_tolerance = function (value, tolerance) {
      var BDecimal = D(value);
      return !this.eq_tolerance(BDecimal, tolerance) && this.gt(BDecimal);
    };

    BDecimal.prototype.gte_tolerance = function (value, tolerance) {
      var BDecimal = D(value);
      return this.eq_tolerance(BDecimal, tolerance) || this.gt(BDecimal);
    };
    
    BDecimal.prototype.pLog10 = function() {
      if (this.lt(BDecimal.dZero)) { return BDecimal.dZero; }
      return this.log10();
    }

    BDecimal.prototype.absLog10 = function () {
      if (this.sign === 0)
      {
        return BDecimal.dNaN;
      }
      else if (this.layer > 0)
      {
        return FC(Math.sign(this.mag), this.layer-1, Math.abs(this.mag));
      }
      else
      {
        return FC(1, 0, Math.log10(this.mag));
      }
    };
    
    BDecimal.prototype.log10 = function () {
      if (this.sign <= 0)
      {
        return BDecimal.dNaN;
      }
      else if (this.layer > 0)
      {
        return FC(Math.sign(this.mag), this.layer-1, Math.abs(this.mag));
      }
      else
      {
        return FC(this.sign, 0, Math.log10(this.mag));
      }
    };

    BDecimal.prototype.log = function (base) {
      base = D(base);
      if (this.sign <= 0)
      {
        return BDecimal.dNaN;
      }
      if (base.sign <= 0)
      {
        return BDecimal.dNaN;
      }
      if (base.sign === 1 && base.layer === 0 && base.mag === 1)
      {
        return BDecimal.dNaN;
      }
      else if (this.layer === 0 && base.layer === 0)
      {
        return FC(this.sign, 0, Math.log(this.mag)/Math.log(base.mag));
      }
      
      return BDecimal.div(this.log10(), base.log10());
    };

    BDecimal.prototype.log2 = function () {
      if (this.sign <= 0)
      {
        return BDecimal.dNaN;
      }
      else if (this.layer === 0)
      {
        return FC(this.sign, 0, Math.log2(this.mag));
      }
      else if (this.layer === 1)
      {
        return FC(Math.sign(this.mag), 0, Math.abs(this.mag)*3.321928094887362); //log2(10)
      }
      else if (this.layer === 2)
      {
        return FC(Math.sign(this.mag), 1, Math.abs(this.mag)+0.5213902276543247); //-log10(log10(2))
      }
      else
      {
        return FC(Math.sign(this.mag), this.layer-1, Math.abs(this.mag));
      }
    };

    BDecimal.prototype.ln = function () {
      if (this.sign <= 0)
      {
        return BDecimal.dNaN;
      }
      else if (this.layer === 0)
      {
        return FC(this.sign, 0, Math.log(this.mag));
      }
      else if (this.layer === 1)
      {
        return FC(Math.sign(this.mag), 0, Math.abs(this.mag)*2.302585092994046); //ln(10)
      }
      else if (this.layer === 2)
      {
        return FC(Math.sign(this.mag), 1, Math.abs(this.mag)+0.36221568869946325); //log10(log10(e))
      }
      else
      {
        return FC(Math.sign(this.mag), this.layer-1, Math.abs(this.mag));
      }
    };

    BDecimal.prototype.logarithm = function (base) {
      return this.log(base);
    };

    BDecimal.prototype.pow = function (value) {
      var BDecimal = D(value);
      var a = this;
      var b = BDecimal;

      //special case: if a is 0, then return 0
      if (a.sign === 0) { return a; }
      //special case: if a is 1, then return 1
      if (a.sign === 1 && a.layer === 0 && a.mag === 1) { return a; }
      //special case: if b is 0, then return 1
      if (b.sign === 0) { return FC_NN(1, 0, 1); }
      //special case: if b is 1, then return a
      if (b.sign === 1 && b.layer === 0 && b.mag === 1) { return a; }
      
      var result = (a.absLog10().mul(b)).pow10();

      if (this.sign === -1 && b.toNumber() % 2 === 1) {
        return result.neg();
      }

      return result;
    };
    
    BDecimal.prototype.pow10 = function() {
      /*
      There are four cases we need to consider:
      1) positive sign, positive mag (e15, ee15): +1 layer (e.g. 10^15 becomes e15, 10^e15 becomes ee15)
      2) negative sign, positive mag (-e15, -ee15): +1 layer but sign and mag sign are flipped (e.g. 10^-15 becomes e-15, 10^-e15 becomes ee-15)
      3) positive sign, negative mag (e-15, ee-15): layer 0 case would have been handled in the Math.pow check, so just return 1
      4) negative sign, negative mag (-e-15, -ee-15): layer 0 case would have been handled in the Math.pow check, so just return 1
      */
      
      if (!Number.isFinite(this.layer) || !Number.isFinite(this.mag)) { return BDecimal.dNaN; }
      
      var a = this;
      
      //handle layer 0 case - if no precision is lost just use Math.pow, else promote one layer
      if (a.layer === 0)
      {
        var newmag = Math.pow(10, a.sign*a.mag);
        if (Number.isFinite(newmag) && Math.abs(newmag) > 0.1) { return FC(1, 0, newmag); }
        else
        {
          if (a.sign === 0) { return BDecimal.dOne; }
          else { a = FC_NN(a.sign, a.layer+1, Math.log10(a.mag)); }
        }
      }
      
      //handle all 4 layer 1+ cases individually
      if (a.sign > 0 && a.mag > 0)
      {
        return FC(a.sign, a.layer+1, a.mag);
      }
      if (a.sign < 0 && a.mag > 0)
      {
        return FC(-a.sign, a.layer+1, -a.mag);
      }
      //both the negative mag cases are identical: one +/- rounding error
      return BDecimal.dOne;
    }

    BDecimal.prototype.pow_base = function (value) {
      return D(value).pow(this);
    };
    
    BDecimal.prototype.root = function (value) {
      var BDecimal = D(value);
      return this.pow(BDecimal.recip());
    }

    BDecimal.prototype.factorial = function () {
      if (this.mag < 0)
      {
        return this.toNumber().add(1).gamma();
      }
      else if (this.layer === 0)
      {
        return this.add(1).gamma();
      }
      else if (this.layer === 1)
      {
        return BDecimal.exp(BDecimal.mul(this, BDecimal.ln(this).sub(1)));
      }
      else
      {
        return BDecimal.exp(this);
      }
    };
    
    //from HyperCalc source code
    BDecimal.prototype.gamma = function () {
      if (this.mag < 0)
      {
        return this.recip();
      }
      else if (this.layer === 0)
      {
        if (this.lt(FC_NN(1, 0, 24)))
        {
          return D(f_gamma(this.sign*this.mag));
        }
        
        var t = this.mag - 1;
        var l = 0.9189385332046727; //0.5*Math.log(2*Math.PI)
        l = (l+((t+0.5)*Math.log(t)));
        l = l-t;
        var n2 = t*t;
        var np = t;
        var lm = 12*np;
        var adj = 1/lm;
        var l2 = l+adj;
        if (l2 === l)
        {
          return BDecimal.exp(l);
        }
        
        l = l2;
        np = np*n2;
        lm = 360*np;
        adj = 1/lm;
        l2 = l-adj;
        if (l2 === l)
        {
          return BDecimal.exp(l);
        }
        
        l = l2;
        np = np*n2;
        lm = 1260*np;
        var lt = 1/lm;
        l = l+lt;
        np = np*n2;
        lm = 1680*np;
        lt = 1/lm;
        l = l-lt;
        return BDecimal.exp(l);
      }
      else if (this.layer === 1)
      {
        return BDecimal.exp(BDecimal.mul(this, BDecimal.ln(this).sub(1)));
      }
      else
      {
        return BDecimal.exp(this);
      }
    };
    
    BDecimal.prototype.lngamma = function () {
      return this.gamma().ln();
    }

    BDecimal.prototype.exp = function () {
      if (this.mag < 0) { return BDecimal.dOne; }
      if (this.layer === 0 && this.mag <= 709.7) { return D(Math.exp(this.sign*this.mag)); }
      else if (this.layer === 0) { return FC(1, 1, this.sign*Math.log10(Math.E)*this.mag); }
      else if (this.layer === 1) { return FC(1, 2, this.sign*(Math.log10(0.4342944819032518)+this.mag)); }
      else { return FC(1, this.layer+1, this.sign*this.mag); }
    };

    BDecimal.prototype.sqr = function () {
      return this.pow(2);
    };

    BDecimal.prototype.sqrt = function () {
      if (this.layer === 0) { return D(Math.sqrt(this.sign*this.mag)); }
      else if (this.layer === 1) { return FC(1, 2, Math.log10(this.mag)-0.3010299956639812); }
      else
      {
        var result = BDecimal.div(FC_NN(this.sign, this.layer-1, this.mag), FC_NN(1, 0, 2));
        result.layer += 1;
        result.normalize();
        return result;
      }
    };

    BDecimal.prototype.cube = function () {
      return this.pow(3);
    };

    BDecimal.prototype.cbrt = function () {
      return this.pow(1/3);
    };
    
    //Tetration/tetrate: The result of exponentiating 'this' to 'this' 'height' times in a row.  https://en.wikipedia.org/wiki/Tetration
    //If payload != 1, then this is 'iterated exponentiation', the result of exping (payload) to base (this) (height) times. https://andydude.github.io/tetration/archives/tetration2/ident.html
    //Works with negative and positive real heights.
    BDecimal.prototype.tetrate = function(height = 2, payload = FC_NN(1, 0, 1)) {
      if (height === Number.POSITIVE_INFINITY)
      {
        //Formula for infinite height power tower.
        var negln = BDecimal.ln(this).neg();
        return negln.lambertw().div(negln);
      }
      
      if (height < 0)
      {
        return BDecimal.iteratedlog(payload, this, -height);
      }
      
      payload = D(payload);
      var oldheight = height;
      height = Math.trunc(height);
      var fracheight = oldheight-height;
     
      if (fracheight !== 0)
      {
        if (payload.eq(BDecimal.dOne))
        {
          ++height;
          payload = new BDecimal(fracheight);
        }
        else
        {
          if (this.eq(10))
          {
            payload = payload.layeradd10(fracheight);
          }
          else
          {
            payload = payload.layeradd(fracheight, this);
          }
        }
      }
      
      for (var i = 0; i < height; ++i)
      {
        payload = this.pow(payload);
        //bail if we're NaN
        if (!isFinite(payload.layer) || !isFinite(payload.mag)) { return payload; }
        //shortcut 
        if (payload.layer - this.layer > 3) { return FC_NN(payload.sign, payload.layer + (height - i - 1), payload.mag); }
        //give up after 100 iterations if nothing is happening
        if (i > 100) { return payload; }
      }
      return payload;
    }
    
    //iteratedexp/iterated exponentiation: - all cases handled in tetrate, so just call it
    BDecimal.prototype.iteratedexp = function(height = 2, payload = FC_NN(1, 0, 1)) {
      return this.tetrate(height, payload);
    }
    
    //iterated log/repeated log: The result of applying log(base) 'times' times in a row. Approximately equal to subtracting (times) from the number's slog representation. Equivalent to tetrating to a negative height.
    //Works with negative and positive real heights.
    BDecimal.prototype.iteratedlog = function(base = 10, times = 1) {      
      if (times < 0)
      {
        return BDecimal.tetrate(base, -times, this);
      }
      
      base = D(base);
      var result = D(this);
      var fulltimes = times;
      times = Math.trunc(times);
      var fraction = fulltimes - times;
      if (result.layer - base.layer > 3)
      {
        var layerloss = Math.min(times, (result.layer - base.layer - 3));
        times -= layerloss;
        result.layer -= layerloss;
      }
      
      for (var i = 0; i < times; ++i)
      {
        result = result.log(base);
        //bail if we're NaN
        if (!isFinite(result.layer) || !isFinite(result.mag)) { return result; }
        //give up after 100 iterations if nothing is happening
        if (i > 100) { return result; }
      }
      
      //handle fractional part
      if (fraction > 0 && fraction < 1)
      {
        if (base.eq(10))
        {
          result = result.layeradd10(-fraction);
        }
        else
        {
          result = result.layeradd(-fraction, base);
        }
      }
      
      return result;
    }
    
    //Super-logarithm, one of tetration's inverses, tells you what size power tower you'd have to tetrate base to to get number. By definition, will never be higher than 1.8e308 in break_eternity.js, since a power tower 1.8e308 numbers tall is the largest representable number.
    // https://en.wikipedia.org/wiki/Super-logarithm
    BDecimal.prototype.slog = function(base = 10) {
      if (this.mag < 0) { return BDecimal.dNegOne; }
      
      base = D(base);
      
      var result = 0;
      var copy = D(this);
      if (copy.layer - base.layer > 3)
      {
        var layerloss = (copy.layer - base.layer - 3);
        result += layerloss;
        copy.layer -= layerloss;
      }
      
      for (var i = 0; i < 100; ++i)
      {
        if (copy.lt(BDecimal.dZero))
        {
          copy = BDecimal.pow(base, copy);
          result -= 1;
        }
        else if (copy.lte(BDecimal.dOne))
        {
          return D(result + copy.toNumber() - 1); //<-- THIS IS THE CRITICAL FUNCTION
          //^ Also have to change tetrate payload handling and layeradd10 if this is changed!
        }
        else
        {
          result += 1;
          copy = BDecimal.log(copy, base);
        }
      }
      return D(result);
    }
    
    //Approximations taken from the excellent paper https://web.archive.org/web/20090201164836/http://tetration.itgo.com/paper.html !
    //Not using for now unless I can figure out how to use it in all the related functions.
    /*var slog_criticalfunction_1 = function(x, z) {
      z = z.toNumber();
      return -1 + z;
    }
    
    var slog_criticalfunction_2 = function(x, z) {
      z = z.toNumber();
      var lnx = x.ln();
      if (lnx.layer === 0)
      {
        lnx = lnx.toNumber();
        return -1 + z*2*lnx/(1+lnx) - z*z*(1-lnx)/(1+lnx);
      }
      else
      {
        var term1 = lnx.mul(z*2).div(lnx.add(1));
        var term2 = BDecimal.sub(1, lnx).mul(z*z).div(lnx.add(1));
        BDecimal.dNegOne.add(BDecimal.sub(term1, term2));
      }
    }
    
    var slog_criticalfunction_3 = function(x, z) {
      z = z.toNumber();
      var lnx = x.ln();
      var lnx2 = lnx.sqr();
      var lnx3 = lnx.cube();
      if (lnx.layer === 0 && lnx2.layer === 0 && lnx3.layer === 0)
      {
        lnx = lnx.toNumber();
        lnx2 = lnx2.toNumber();
        lnx3 = lnx3.toNumber();
        
        var term1 = 6*z*(lnx+lnx3);
        var term2 = 3*z*z*(3*lnx2-2*lnx3);
        var term3 = 2*z*z*z*(1-lnx-2*lnx2+lnx3);
        var top = term1+term2+term3;
        var bottom = 2+4*lnx+5*lnx2+2*lnx3;
        
        return -1 + top/bottom;
      }
      else
      {
        var term1 = (lnx.add(lnx3)).mul(6*z);
        var term2 = (lnx2.mul(3).sub(lnx3.mul(2))).mul(3*z*z);
        var term3 = (BDecimal.dOne.sub(lnx).sub(lnx2.mul(2)).add(lnx3)).mul(2*z*z*z);
        var top = term1.add(term2).add(term3);
        var bottom = new BDecimal(2).add(lnx.mul(4)).add(lnx2.mul(5)).add(lnx3.mul(2));
        
        return BDecimal.dNegOne.add(top.div(bottom));
      }
    }*/
    
    //Function for adding/removing layers from a BDecimal, even fractional layers (e.g. its slog10 representation).
    //Everything continues to use the linear approximation ATM.
    BDecimal.prototype.layeradd10 = function(diff) {
      diff = BDecimal.fromValue_noAlloc(diff).toNumber();
      var result = D(this);
      if (diff >= 1)
      {
        var layeradd = Math.trunc(diff);
        diff -= layeradd;
        result.layer += layeradd;
      }
      if (diff <= -1)
      {
        var layeradd = Math.trunc(diff);
        diff -= layeradd;
        result.layer += layeradd;
        if (result.layer < 0)
        {
          for (var i = 0; i < 100; ++i)
          {
            result.layer++;
            result.mag = Math.log10(result.mag);
            if (!isFinite(result.mag)) { return result; }
            if (result.layer >= 0) { break; }
          }
        }
      }
      
      //layeradd10: like adding 'diff' to the number's slog(base) representation. Very similar to tetrate base 10 and iterated log base 10. Also equivalent to adding a fractional amount to the number's layer in its break_eternity.js representation.
      if (diff > 0)
      {
        var subtractlayerslater = 0;
        //Ironically, this edge case would be unnecessary if we had 'negative layers'.
        while (Number.isFinite(result.mag) && result.mag < 10)
        {
          result.mag = Math.pow(10, result.mag);
          ++subtractlayerslater;
        }
        
        //A^(10^B) === C, solve for B
        //B === log10(logA(C))
        
        if (result.mag > 1e10)
        {
          result.mag = Math.log10(result.mag);
          result.layer++;
        }
        
        //Note that every integer slog10 value, the formula changes, so if we're near such a number, we have to spend exactly enough layerdiff to hit it, and then use the new formula.
        var diffToNextSlog = Math.log10(Math.log(1e10)/Math.log(result.mag), 10);
        if (diffToNextSlog < diff)
        {
          result.mag = Math.log10(1e10);
          result.layer++;
          diff -= diffToNextSlog;
        }
        
        result.mag = Math.pow(result.mag, Math.pow(10, diff));
        
        while (subtractlayerslater > 0)
        {
          result.mag = Math.log10(result.mag);
          --subtractlayerslater;
        }
      }
      else if (diff < 0)
      {
        var subtractlayerslater = 0;
        
        while (Number.isFinite(result.mag) && result.mag < 10)
        {
          result.mag = Math.pow(10, result.mag);
          ++subtractlayerslater;
        }
        
        if (result.mag > 1e10)
        {
          result.mag = Math.log10(result.mag);
          result.layer++;
        }
        
        var diffToNextSlog = Math.log10(1/Math.log10(result.mag));
        if (diffToNextSlog > diff)
        {
          result.mag = 1e10;
          result.layer--;
          diff -= diffToNextSlog;
        }
        
        result.mag = Math.pow(result.mag, Math.pow(10, diff));
        
        while (subtractlayerslater > 0)
        {
          result.mag = Math.log10(result.mag);
          --subtractlayerslater;
        }
      }
      
      while (result.layer < 0)
      {
        result.layer++;
        result.mag = Math.log10(result.mag);
      }
      result.normalize();
      return result;
    }
    
    //layeradd: like adding 'diff' to the number's slog(base) representation. Very similar to tetrate base 'base' and iterated log base 'base'.
    BDecimal.prototype.layeradd = function(diff, base) {
      var slogthis = this.slog(base).toNumber();
      var slogdest = slogthis+diff;
      if (slogdest >= 0)
      {
        return BDecimal.tetrate(base, slogdest);
      }
      else if (!Number.isFinite(slogdest))
      {
        return BDecimal.dNaN;
      }
      else if (slogdest >= -1)
      {
        return BDecimal.log(BDecimal.tetrate(base, slogdest+1), base);
      }
      else
      {
        BDecimal.log(BDecimal.log(BDecimal.tetrate(base, slogdest+2), base), base);
      }
    }
    
    //The Lambert W function, also called the omega function or product logarithm, is the solution W(x) === x*e^x.
    // https://en.wikipedia.org/wiki/Lambert_W_function
    //Some special values, for testing: https://en.wikipedia.org/wiki/Lambert_W_function#Special_values
    BDecimal.prototype.lambertw = function() {
      if (this.lt(-0.3678794411710499))
      {
        throw Error("lambertw is unimplemented for results less than -1, sorry!");
      }
      else if (this.mag < 0)
      {
        return D(f_lambertw(this.toNumber()));
      }
      else if (this.layer === 0)
      {
        return D(f_lambertw(this.sign*this.mag));
      }
      else if (this.layer === 1)
      {
        return d_lambertw(this);
      }
      else if (this.layer === 2)
      {
        return d_lambertw(this);
      }
      if (this.layer >= 3)
      {
        return FC_NN(this.sign, this.layer-1, this.mag);
      }
    }
  
    //from https://github.com/scipy/scipy/blob/8dba340293fe20e62e173bdf2c10ae208286692f/scipy/special/lambertw.pxd
    // The evaluation can become inaccurate very close to the branch point
    // at ``-1/e``. In some corner cases, `lambertw` might currently
    // fail to converge, or can end up on the wrong branch.
    var d_lambertw = function(z, tol = 1e-10) {
    var w;
    var ew, wew, wewz, wn;
    
    if (!Number.isFinite(z.mag)) { return z; }
    if (z === 0)
    {
      return z;
    }
    if (z === 1)
    {
      //Split out this case because the asymptotic series blows up
      return OMEGA;
    }
    
    var absz = BDecimal.abs(z);
    //Get an initial guess for Halley's method
    w = BDecimal.ln(z);
    
    //Halley's method; see 5.9 in [1]
    
    for (var i = 0; i < 100; ++i)
    {
      ew = BDecimal.exp(-w);
      wewz = w.sub(z.mul(ew));
      wn = w.sub(wewz.div(w.add(1).sub((w.add(2)).mul(wewz).div((BDecimal.mul(2, w).add(2))))));
      if (BDecimal.abs(wn.sub(w)).lt(BDecimal.abs(wn).mul(tol)))
      {
        return wn;
      }
      else
      {
        w = wn;
      }
    }
    
    throw Error("Iteration failed to converge: " + z);
    //return BDecimal.dNaN;
    }
    
    //The super square-root function - what number, tetrated to height 2, equals this?
    //Other sroots are possible to calculate probably through guess and check methods, this one is easy though.
    // https://en.wikipedia.org/wiki/Tetration#Super-root
    BDecimal.prototype.ssqrt = function() {
      if (this.sign == 1 && this.layer >= 3)
      {
          return FC_NN(this.sign, this.layer-1, this.mag)
      }
      var lnx = this.ln();
      return lnx.div(lnx.lambertw());
    }
/*

Unit tests for tetrate/iteratedexp/iteratedlog/layeradd10/layeradd/slog:

for (var i = 0; i < 1000; ++i)
{
    var first = Math.random()*100;
    var both = Math.random()*100;
    var expected = first+both+1;
    var result = new BDecimal(10).layeradd10(first).layeradd10(both).slog();
    if (Number.isFinite(result.mag) && !BDecimal.eq_tolerance(expected, result))
    {
        console.log(first + ", " + both);
    }
}

for (var i = 0; i < 1000; ++i)
{
    var first = Math.random()*100;
    var both = Math.random()*100;
    first += both;
    var expected = first-both+1;
    var result = new BDecimal(10).layeradd10(first).layeradd10(-both).slog();
    if (Number.isFinite(result.mag) && !BDecimal.eq_tolerance(expected, result))
    {
        console.log(first + ", " + both);
    }
}

for (var i = 0; i < 1000; ++i)
{
    var first = Math.random()*100;
    var both = Math.random()*100;
    var base = Math.random()*8+2;
    var expected = first+both+1;
    var result = new BDecimal(base).layeradd(first, base).layeradd(both, base).slog(base);
    if (Number.isFinite(result.mag) && !BDecimal.eq_tolerance(expected, result))
    {
        console.log(first + ", " + both);
    }
}

for (var i = 0; i < 1000; ++i)
{
    var first = Math.random()*100;
    var both = Math.random()*100;
    var base = Math.random()*8+2;
    first += both;
    var expected = first-both+1;
    var result = new BDecimal(base).layeradd(first, base).layeradd(-both, base).slog(base);
    if (Number.isFinite(result.mag) && !BDecimal.eq_tolerance(expected, result))
    {
        console.log(first + ", " + both);
    }
}

for (var i = 0; i < 1000; ++i)
{
	var first = Math.round((Math.random()*30))/10;
	var both = Math.round((Math.random()*30))/10;
	var tetrateonly = BDecimal.tetrate(10, first);
	var tetrateandlog = BDecimal.tetrate(10, first+both).iteratedlog(10, both);
	if (!BDecimal.eq_tolerance(tetrateonly, tetrateandlog))
	{
		console.log(first + ", " + both);
	}
}

for (var i = 0; i < 1000; ++i)
{
	var first = Math.round((Math.random()*30))/10;
	var both = Math.round((Math.random()*30))/10;
  var base = Math.random()*8+2;
	var tetrateonly = BDecimal.tetrate(base, first);
	var tetrateandlog = BDecimal.tetrate(base, first+both).iteratedlog(base, both);
	if (!BDecimal.eq_tolerance(tetrateonly, tetrateandlog))
	{
		console.log(first + ", " + both);
	}
}

for (var i = 0; i < 1000; ++i)
{
	var first = Math.round((Math.random()*30))/10;
	var both = Math.round((Math.random()*30))/10;
  var base = Math.random()*8+2;
	var tetrateonly = BDecimal.tetrate(base, first, base);
	var tetrateandlog = BDecimal.tetrate(base, first+both, base).iteratedlog(base, both);
	if (!BDecimal.eq_tolerance(tetrateonly, tetrateandlog))
	{
		console.log(first + ", " + both);
	}
}

for (var i = 0; i < 1000; ++i)
{
    var xex = new BDecimal(-0.3678794411710499+Math.random()*100);
    var x = BDecimal.lambertw(xex);
    if (!BDecimal.eq_tolerance(xex, x.mul(BDecimal.exp(x))))
    {
        console.log(xex);
    }
}

for (var i = 0; i < 1000; ++i)
{
    var xex = new BDecimal(-0.3678794411710499+Math.exp(Math.random()*100));
    var x = BDecimal.lambertw(xex);
    if (!BDecimal.eq_tolerance(xex, x.mul(BDecimal.exp(x))))
    {
        console.log(xex);
    }
}

for (var i = 0; i < 1000; ++i)
{
    var a = BDecimal.randomBDecimalForTesting(Math.random() > 0.5 ? 0 : 1);
    var b = BDecimal.randomBDecimalForTesting(Math.random() > 0.5 ? 0 : 1);
    if (Math.random() > 0.5) { a = a.recip(); }
    if (Math.random() > 0.5) { b = b.recip(); }
    var c = a.add(b).toNumber();
    if (Number.isFinite(c) && !BDecimal.eq_tolerance(c, a.toNumber()+b.toNumber()))
    {
        console.log(a + ", " + b);
    }
}

for (var i = 0; i < 100; ++i)
{
    var a = BDecimal.randomBDecimalForTesting(Math.round(Math.random()*4));
    var b = BDecimal.randomBDecimalForTesting(Math.round(Math.random()*4));
    if (Math.random() > 0.5) { a = a.recip(); }
    if (Math.random() > 0.5) { b = b.recip(); }
    var c = a.mul(b).toNumber();
    if (Number.isFinite(c) && Number.isFinite(a.toNumber()) && Number.isFinite(b.toNumber()) && a.toNumber() != 0 && b.toNumber() != 0 && c != 0 && !BDecimal.eq_tolerance(c, a.toNumber()*b.toNumber()))
    {
        console.log("Test 1: " + a + ", " + b);
    }
    else if (!BDecimal.mul(a.recip(), b.recip()).eq_tolerance(BDecimal.mul(a, b).recip()))
    {
        console.log("Test 3: " + a + ", " + b);
    }
}

for (var i = 0; i < 10; ++i)
{
    var a = BDecimal.randomBDecimalForTesting(Math.round(Math.random()*4));
    var b = BDecimal.randomBDecimalForTesting(Math.round(Math.random()*4));
    if (Math.random() > 0.5 && a.sign !== 0) { a = a.recip(); }
    if (Math.random() > 0.5 && b.sign !== 0) { b = b.recip(); }
    var c = a.pow(b);
    var d = a.root(b.recip());
    var e = a.pow(b.recip());
    var f = a.root(b);
    
    if (!c.eq_tolerance(d) && a.sign !== 0 && b.sign !== 0)
    {
      console.log("Test 1: " + a + ", " + b);
    }
    if (!e.eq_tolerance(f) && a.sign !== 0 && b.sign !== 0)
    {
      console.log("Test 2: " + a + ", " + b);
    }
}

for (var i = 0; i < 10; ++i)
{
    var a = Math.round(Math.random()*18-9);
    var b = Math.round(Math.random()*100-50);
    var c = Math.round(Math.random()*18-9);
    var d = Math.round(Math.random()*100-50);
    console.log("BDecimal.pow(BDecimal.fromMantissaExponent(" + a + ", " + b + "), BDecimal.fromMantissaExponent(" + c + ", " + d + ")).toString()");
}

*/
    
    //Pentation/pentate: The result of tetrating 'height' times in a row. An absurdly strong operator - BDecimal.pentate(2, 4.28) and BDecimal.pentate(10, 2.37) are already too huge for break_eternity.js!
    // https://en.wikipedia.org/wiki/Pentation
    BDecimal.prototype.pentate = function(height = 2, payload = FC_NN(1, 0, 1)) {
      payload = D(payload);
      var oldheight = height;
      height = Math.trunc(height);
      var fracheight = oldheight-height;
      
      //I have no idea if this is a meaningful approximation for pentation to continuous heights, but it is monotonic and continuous.
      if (fracheight !== 0)
      {
        if (payload.eq(BDecimal.dOne))
        {
          ++height;
          payload = new BDecimal(fracheight);
        }
        else
        {
          if (this.eq(10))
          {
            payload = payload.layeradd10(fracheight);
          }
          else
          {
            payload = payload.layeradd(fracheight, this);
          }
        }
      }
      
      for (var i = 0; i < height; ++i)
      {
        payload = this.tetrate(payload);
        //bail if we're NaN
        if (!isFinite(payload.layer) || !isFinite(payload.mag)) { return payload; }
        //give up after 10 iterations if nothing is happening
        if (i > 10) { return payload; }
      }
      
      return payload;
    }
    
    // trig functions!
    BDecimal.prototype.sin = function () {
      if (this.mag < 0) { return this; }
      if (this.layer === 0) { return D(Math.sin(this.sign*this.mag)); }
      return FC_NN(0, 0, 0);
    };

    BDecimal.prototype.cos = function () {
      if (this.mag < 0) { return BDecimal.dOne; }
      if (this.layer === 0) { return D(Math.cos(this.sign*this.mag)); }
      return FC_NN(0, 0, 0);
    };

    BDecimal.prototype.tan = function () {
      if (this.mag < 0) { return this; }
      if (this.layer === 0) { return D(Math.tan(this.sign*this.mag)); }
      return FC_NN(0, 0, 0);
    };

    BDecimal.prototype.asin = function () {
      if (this.mag < 0) { return this; }
      if (this.layer === 0) { return D(Math.asin(this.sign*this.mag)); }
      return FC_NN(Number.NaN, Number.NaN, Number.NaN);
    };

    BDecimal.prototype.acos = function () {
      if (this.mag < 0) { return D(Math.acos(this.toNumber())); }
      if (this.layer === 0) { return D(Math.acos(this.sign*this.mag)); }
      return FC_NN(Number.NaN, Number.NaN, Number.NaN);
    };

    BDecimal.prototype.atan = function () {
      if (this.mag < 0) { return this; }
      if (this.layer === 0) { return D(Math.atan(this.sign*this.mag)); }
      return D(Math.atan(this.sign*1.8e308));
    };

    BDecimal.prototype.sinh = function () {
      return this.exp().sub(this.negate().exp()).div(2);
    };

    BDecimal.prototype.cosh = function () {
      return this.exp().add(this.negate().exp()).div(2);
    };

    BDecimal.prototype.tanh = function () {
      return this.sinh().div(this.cosh());
    };

    BDecimal.prototype.asinh = function () {
      return BDecimal.ln(this.add(this.sqr().add(1).sqrt()));
    };

    BDecimal.prototype.acosh = function () {
      return BDecimal.ln(this.add(this.sqr().sub(1).sqrt()));
    };

    BDecimal.prototype.atanh = function () {
      if (this.abs().gte(1)) {
        return FC_NN(Number.NaN, Number.NaN, Number.NaN);
      }

      return BDecimal.ln(this.add(1).div(D(1).sub(this))).div(2);
    };
    
    /**
     * Joke function from Realm Grinder
     */
    BDecimal.prototype.ascensionPenalty = function (ascensions) {
      if (ascensions === 0) {
        return this;
      }

      return this.root(BDecimal.pow(10, ascensions));
    };
    
    /**
     * Joke function from Cookie Clicker. It's 'egg'
     */
    BDecimal.prototype.egg = function () {
      return this.add(9);
    };
    
    BDecimal.prototype.lessThanOrEqualTo = function (other) {
      return this.cmp(other) < 1;
    };

    BDecimal.prototype.lessThan = function (other) {
      return this.cmp(other) < 0;
    };

    BDecimal.prototype.greaterThanOrEqualTo = function (other) {
      return this.cmp(other) > -1;
    };

    BDecimal.prototype.greaterThan = function (other) {
      return this.cmp(other) > 0;
    };

    return BDecimal;
  }();

	BDecimal.dZero = FC_NN(0, 0, 0);
	BDecimal.dOne = FC_NN(1, 0, 1);
	BDecimal.dNegOne = FC_NN(-1, 0, 1);
	BDecimal.dTwo = FC_NN(1, 0, 2);
	BDecimal.dTen = FC_NN(1, 0, 10);
	BDecimal.dNaN = FC_NN(Number.NaN, Number.NaN, Number.NaN);
	BDecimal.dInf = FC_NN(1, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
	BDecimal.dNegInf = FC_NN(-1, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  BDecimal.dNumberMax = FC(1, 0, Number.MAX_VALUE);
  BDecimal.dNumberMin = FC(1, 0, Number.MIN_VALUE);
  
  return BDecimal;

}));