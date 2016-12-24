/*
 * phina-minimizer 1.0.0 used 
 *
 * phina.js 0.2.0
 * phina.js is a game library in javascript
 * MIT Licensed
 * 
 * Copyright (C) 2015 phi, http://phinajs.com
 */


'use strict';

/*
 *
 */


;(function() {
  /**
   * @class global.Object
   * Objectの拡張
   */

  
  /**
   * @method property
   * 変数を追加
   * @param   {String} key name
   * @param   {Object} param
   */
  // Object.defineProperty(Object.prototype, "property", {
  //   value: function(name, val) {
  //     Object.defineProperty(this, name, {
  //       value: val,
  //       enumerable: true,
  //       writable: true
  //     });
  //   }
  // });

  /**
   * @method method
   * 関数を追加
   * @param   {String} key name
   * @param   {Function} function
   */
  Object.defineProperty(Object.prototype, "$method", {
    value: function(name, fn) {
      Object.defineProperty(this, name, {
        value: fn,
        enumerable: false,
        writable: true
      });
    }
  });



  /**
   * @method setter
   * セッターを定義する
   */
  Object.prototype.$method("setter", function(name, fn){
    Object.defineProperty(this, name, {
      set: fn,
      enumerable: false,
      configurable: true,
    });
  });

  /**
   * @method getter
   * ゲッターを定義する
   */
  Object.prototype.$method("getter", function(name, fn){
    Object.defineProperty(this, name, {
      get: fn,
      enumerable: false,
      configurable: true,
    });
  });

  /**
   * @method accessor
   * アクセッサ(セッター/ゲッター)を定義する
   */
  Object.prototype.$method("accessor", function(name, param) {
    Object.defineProperty(this, name, {
      set: param["set"],
      get: param["get"],
      enumerable: false,
      configurable: true,
    });
  });


  /**
   * @method forIn
   * オブジェクト用ループ処理
   */
  Object.prototype.$method("forIn", function(fn, self) {
    self = self || this;

    Object.keys(this).forEach(function(key, index) {
      var value = this[key];

      fn.call(self, key, value, index);
    }, this);

    return this;
  });

  /**
   * @method  $get
   * パス指定で値を取得
   */
  Object.prototype.$method('$get', function(key) {
    return key.split('.').reduce(function(t, v) {
      return t && t[v];
    }, this);
  });

  /**
   * @method  $set
   * パス指定で値を設定
   */
  Object.prototype.$method('$set', function(key, value) {
    key.split('.').reduce(function(t, v, i, arr) {
      if (i === (arr.length-1)) {
        t[v] = value;
      }
      else {
        if (!t[v]) t[v] = {};
        return t[v];
      }
    }, this);
  });

  /**
   * @method  $has
   * そのプロパティを持っているかを判定する
   */
  Object.prototype.$method("$has", function(key) {
    return this.hasOwnProperty(key);
  });

  /**
   * @method  $extend
   * 他のライブラリと競合しちゃうので extend -> $extend としました
   */
  Object.prototype.$method("$extend", function() {
    Array.prototype.forEach.call(arguments, function(source) {
      for (var property in source) {
        this[property] = source[property];
      }
    }, this);
    return this;
  });


  /**
   * @method  $safe
   * 安全拡張
   * 上書きしない
   */
  Object.prototype.$method("$safe", function(source) {
    Array.prototype.forEach.call(arguments, function(source) {
      for (var property in source) {
        if (this[property] === undefined) this[property] = source[property];
      }
    }, this);
    return this;
  });
  
  
  /**
   * @method  $strict
   * 厳格拡張
   * すでにあった場合は警告
   */
  Object.prototype.$method("$strict", function(source) {
    Array.prototype.forEach.call(arguments, function(source) {
      for (var property in source) {
        console.assert(!this[property], "tm error: {0} is Already".format(property));
        this[property] = source[property];
      }
    }, this);
    return this;
  });

  /**
   * @method  $pick
   * ピック
   */
  Object.prototype.$method("$pick", function() {
    var temp = {};

    Array.prototype.forEach.call(arguments, function(key) {
      if (key in this) temp[key] = this[key];
    }, this);

    return temp;
  });

  /**
   * @method  $omit
   * オミット
   */
  Object.prototype.$method("$omit", function() {
    var temp = {};

    for (var key in this) {
      if (Array.prototype.indexOf.call(arguments, key) == -1) {
        temp[key] = this[key];
      }
    }

    return temp;
  });

  /**
   * @method  $toArray
   * 配列化
   */
  Object.prototype.$method("$toArray", function() {
    return Array.prototype.slice.call(this);
  });

  Object.prototype.$method('$watch', function(key, callback) {
    var target = this;
    var descriptor = null;

    while(target) {
      descriptor = Object.getOwnPropertyDescriptor(target, key);
      if (descriptor) {
        break;
      }
      target = Object.getPrototypeOf(target);
    }

    // すでにアクセッサーとして存在する場合
    if (descriptor) {
      // データディスクリプタの場合
      if (descriptor.value !== undefined) {
        var tempKey = '__' + key;
        var tempValue = this[key];

        this[tempKey] = tempValue;

        this.accessor(key, {
          get: function() {
            return this[tempKey];
          },
          set: function(v) {
            var old = this[tempKey];
            this[tempKey] = v;
            callback.call(this, v, old);
          },
        });
      }
      // アクセサディスクリプタの場合
      else {
        this.accessor(key, {
          get: function() {
            return descriptor.get.call(this);
          },
          set: function(v) {
            var old = descriptor.get.call(this);
            descriptor.set.call(this, v);
            callback.call(this, v, old);
          },
        });
      }
    }
    else {
      var accesskey = '__' + key;

      this.accessor(key, {
        get: function() {
          return this[accesskey];
        },
        set: function(v) {
          var old = this[accesskey];
          this[accesskey] = v;
          callback.call(this, v, old);
        },
      });
    }
  });

  if (!Object.observe) {
    Object.$method('observe', function(obj, callback) {
      var keys = Object.keys(obj);
      keys.forEach(function(key) {
        var tempKey = '__' + key;
        var tempValue = obj[key];
        obj[tempKey] = tempValue;
        
        obj.accessor(key, {
          get: function() {
            return this[tempKey];
          },
          set: function(v) {
            this[tempKey] = v;
            callback();
          },
        });
      });
    });
  }

  if (!Object.unobserve) {
    Object.$method('unobserve', function(obj, callback) {
      console.assert(false);
    });
  }

})();



/*
 * number.js
 */


;(function() {
  /**
   * @class global.Number
   * # 拡張した Number クラス
   * 数値を扱う Number クラスを拡張しています。
   */

  /**
   * @method round
   * 指定した小数の位を四捨五入した値を返します。
   *
   * 負の値を指定すると整数部の位を四捨五入できます。
   *
   * ### Example
   *     (13.87).round(); // => 14
   *     (-1.87).round(); // => -2
   *     (-1.27).round(); // => -1
   *     
   *     (2.345).round(); // => 2
   *     (2.345).round(1); // => 2.3
   *     (2.345).round(2); // => 2.35
   *
   *     (12345.67).round(-3); // => 12000
   *
   * @param {Number} [figure=0] 四捨五入する位
   * @return {Number} 小数第 figure 位で四捨五入した値
   */
  Number.prototype.$method("round", function(figure) {
    figure = figure || 0;
    var base = Math.pow(10, figure);
    var temp = this * base;
    temp = Math.round(temp);
    return temp/base;
  });
  
  /**
   * @method ceil
   * 指定した小数の位を切り上げた値を返します。
   *
   * 負の値を指定すると整数部の位を切り上げられます。
   *
   * ### Example
   *     (-1.27).ceil(); // => -1
   *     (-1.87).ceil(); // => -1
   *     
   *     (2.345).ceil(); // => 3
   *     (2.345).ceil(1); // => 2.4
   *     (2.345).ceil(2); // => 2.35
   *
   *     (12345.67).ceil(-3); // => 13000
   *
   * @param {Number} [figure=0] 切り上げる位
   * @return {Number} 小数第 figure 位で切り上げた値
   */
  Number.prototype.$method("ceil",  function(figure) {
    figure = figure || 0;
    var base = Math.pow(10, figure);
    var temp = this * base;
    temp = Math.ceil(temp);
    return temp/base;
  });

  /**
   * @method floor
   * 指定した小数の位を切り下げた値を返します。
   *
   * 負の値を指定すると整数部の位を切り下げられます。
   *
   * ### Example
   *     (-1.27).floor(); // => -2
   *     (-1.87).floor(); // => -2
   *     
   *     (2.345).floor(); // => 2
   *     (2.345).floor(1); // => 2.3
   *     (2.345).floor(2); // => 2.34
   *
   *     (12345.67).floor(-3); // => 12000
   *
   * @param {Number} [figure=0] 切り下げる位
   * @return {Number} 小数第 figure 位で切り下げた値
   */
  Number.prototype.$method("floor",  function(figure) {
    figure = figure || 0;
    var base = Math.pow(10, figure);
    var temp = this * base;
    temp = Math.floor(temp);
    
    // ~~this
    // this|0
    
    return temp/base;
  });
  
  /**
   * @method toInt
   * 数値を整数に変換します。
   *
   * ### Example
   *     (42.195).toInt(); // => 42
   *
   * @return {Number} 整数値
   */
  Number.prototype.$method("toInt",  function() {
    return (this | 0);
  });
  
  /**
   * @method toHex
   * 数値を16進数表記にした文字列を返します。
   *
   * ### Example
   *     (26).toHex(); // => "1a"
   *     (-26).toHex(); // => "-1a"
   *     (26.25).toHex(); // => "1a.4"
   *
   * @return {String} 16進数表記の文字列
   */
  Number.prototype.$method("toHex",  function() {
    return this.toString(16);
  });
  
  /**
   * @method toBin
   * 数値を2進数表記にした文字列を返します。
   *
   * ### Example
   *     (6).toBin(); // => "110"
   *     (-6).toBin(); // => "-110"
   *     (0xA3).toBin(); // => "10100011"
   *     (6.25).toHex(); // => "110.01"
   *
   * @return {String} 2進数表記の文字列
   */
  Number.prototype.$method("toBin",  function() {
    return this.toString(2);
  });
  
  
  /**
   * @method toUnsigned
   * 数値を unsigned int 型に変換します。
   *
   * 数値を符号無し整数として評価した値を返します。  
   * Javascriptのビット演算では数値を符号付きの32bit整数として扱うため、RGBA を
   * 整数値で表現して演算する場合、期待通りの結果が得られない場合があります。
   * そこで本関数で unsigned int 型に変換することで期待通りの値を得ることができます。
   *
   * ### Example
   *     rgba = 0xfeffffff & 0xff000000; // => -33554432
   *     rgba.toHex(); // => "-2000000"
   *     rgba.toUnsigned().toHex(); // => "fe000000"
   *
   * @return {Number} unsigned int 型に変換した値
   */
  Number.prototype.$method("toUnsigned",  function() {
    return this >>> 0;
  });
  
  /**
   * @method padding
   * 指定した桁になるように文字を埋めます。
   *
   * ### Example
   *     (123).padding(5); // => "00123"
   *     (123).padding(5, "_"); // => "__123"
   *     (-12).padding(5); // => "-0012"
   *
   * @param {Number} n 桁数
   * @param {String} [ch="0"] 埋める文字
   * @return {String} 桁数を揃えた文字列
   */
  Number.prototype.$method("padding",  function(n, ch) {
    var str = this+'';
    n  = n-str.length;
    ch = (ch || '0')[0];
    
    while(n-- > 0) { str = ch + str; }
    
    if (str.indexOf("-") >= 0) {
      str = "-" + str.replace("-", "");
    }

    return str;
  });


  /**
   * @method times
   * 0 から自分自身の数-1まで、カウンタをインクリメントしながら関数を繰り返し実行します。
   *
   * ### Example
   *     arr = [];
   *     (5).times(function(i){
   *       arr.push(i);
   *     }); // => [0, 1, 2, 3, 4]
   *
   * @param {Function} fn コールバック関数
   * @param {Object} [self=this] 関数内で this として参照される値。デフォルトは自分自身。
   */
  Number.prototype.$method("times",  function(fn, self) {
    self = self || this;
    for (var i=0; i<this; ++i) {
      fn.call(self, i, this);
    }
    return this;
  });

  /**
   * @method upto
   * 自分自身の数から指定した数まで、カウンタをインクリメントしながら関数を繰り返し実行します。
   *
   * 指定した数が自分自身の数より小さい場合は関数は実行されません。
   *
   * ### Example
   *     arr = [];
   *     (6).upto(8, function(i){
   *       arr.push(i);
   *     });
   *     arr; // => [6, 7, 8]
   *
   *     (3).upto(0, function(i){
   *       arr.push(i);
   *     });
   *     arr; // => [6, 7, 8]
   *
   * @param {Function} fn コールバック関数。引数にカウンタが渡される。
   * @param {Object} [self=this] 関数内で this として参照される値。デフォルトは自分自身。
   */
  Number.prototype.$method("upto",  function(t, fn, self) {
    self = self || this;
    for (var i=+this; i<=t; ++i) {
      fn.call(self, i, this);
    }
    return this;
  });
  
  /**
   * @method downto
   * 自分自身の数から指定した数まで、カウンタをデクリメントしながら関数を繰り返し実行します。
   *
   * 指定した数が自分自身の数より大きい場合は関数は実行されません。
   *
   * ### Example
   *     arr = [];
   *     (7).downto(4, function(i){
   *       arr.push(i);
   *     }); // => [7, 6, 5, 4]
   *
   * @param {Function} fn コールバック関数。引数にカウンタが渡される。
   * @param {Object} [self=this] 関数内で this として参照される値。デフォルトは自分自身。
   */
  Number.prototype.$method("downto",  function(t, fn, self) {
    self = self || this;
    for (var i=+this; i>=t; --i) {
      fn.call(self, i, this);
    }
    return this;
  });

  /**
   * @method step
   * 自分自身の値から指定した数まで、カウンタを増分させながら関数を繰り返し実行します。
   *
   * 上限値や増分値は float 型を指定することができます。
   *
   * ### Example
   *     var arr = [];
   *     (2.4).step(5.3, 0.8, function(n) {
   *       arr.push(n);
   *      }); // => [2.4, 3.2, 4.0, 4.8]
   *
   * @param {Number} limit カウンタの上限値
   * @param {Number} step カウンタを増分する量
   * @param {Function} fn コールバック関数。引数にカウンタが渡される。
   * @param {Object} [self=this] 関数内で this として参照される値。デフォルトは自分自身。
   */
  Number.prototype.$method("step",  function(limit, step, fn, self) {
    self = self || this;
    for (var i=+this; i<=limit; i+=step) {
      fn.call(self, i, this);
    }
    return this;
  });

  /**
   * @method map
   * 0から自分自身の値-1までカウンタをインクリメントさせながらコールバック関数を繰り返し実行し、
   * その返り値を要素とする配列を生成します。
   *
   * ### Example
   *     (5).map(function(i) {
   *       return i*i;
   *     }); // => [0, 1, 4, 9, 16]
   *
   * @param {Function} fn コールバック関数。引数にカウンタが渡される。
   * @param {Object} [self=this] 関数内で this として参照される値。デフォルトは自分自身。
   * @return {Array} 生成した配列
   */
  Number.prototype.$method("map",  function(fn, self) {
    self = self || this;

    var results = [];
    for (var i=0; i<this; ++i) {
      var r = fn.call(self, i);
      results.push(r);
    }
    return results;
  });

  /**
   * @method abs
   * 絶対値を返します。
   *
   * ### Example
   *     (-5).abs(); // => 5
   *     (+5).abs(); // => 5
   *
   * @return {Number} 絶対値
   */
  Number.prototype.$method("abs", function() { return Math.abs(this) });

  /**
   * @method acos
   * アークコサイン（ラジアン単位）を返します。
   *
   * ### Example
   *     (0).asin(); // => 0
   *     (1).asin(); // => 1.5707963267948966
   *
   * @return {Number} アークコサイン
   */
  Number.prototype.$method("acos", function() { return Math.acos(this) });

  /**
   * @method asin
   * アークサイン（ラジアン単位）を返します。
   *
   * ### Example
   *     (1).acos(); // => 0
   *     (-1).acos(); // => 3.141592653589793
   *
   * @return {Number} アークサイン
   */
  Number.prototype.$method("asin", function() { return Math.asin(this) });

  /**
   * @method atan
   * アークタンジェント（ラジアン単位）を返します。
   *
   * ### Example
   *     (0).atan(); // => 0
   *     (1).atan(); // => 0.7853981633974483
   *
   * @return {Number} アークタンジェント
   */
  Number.prototype.$method("atan", function() { return Math.atan(this) });

  /**
   * @method cos
   * コサイン（ラジアン単位）を返します。
   *
   * ### Example
   *     (Math.PI/3).cos(); // => 0.5
   *
   * @return {Number} コサイン
   */
  Number.prototype.$method("cos", function() { return Math.cos(this) });

  /**
   * @method exp
   * e<sup>this</sup> を返します。ここで e は自然対数の底であるネイピア数（オイラー数）です。
   *
   * ### Example
   *     (2).exp(); // => e<sup>2</sup>
   *     (0).exp(); // => 1
   *
   * @return {Number} e<sup>x</sup>
   */
  Number.prototype.$method("exp", function() { return Math.exp(this) });

  /**
   * @method log
   * 自然対数を返します。
   *
   * ### Example
   *     (Math.E * Math.E * Math.E).log(); // => 3
   *     (1).log(); // => 0
   *     (0).log(); // => -Infinity
   *
   * @return {Number} 自然対数
   */
  Number.prototype.$method("log", function() { return Math.log(this) });

  /**
   * @method max
   * 自分自身と引数の値を比べ、大きい方の値を返します。
   *
   * ### Example
   *     (15).max(10); // => 15
   *     (15).max(90); // => 90
   *
   * @param {Number} value 比較する値
   * @return {Number} 最大値
   */
  Number.prototype.$method("max", function(value) { return Math.max(this, value) });

  /**
   * @method min
   * 自分自身と引数の値を比べ、小さい方の値を返します。
   *
   * ### Example
   *     (15).min(10); // => 10
   *     (15).min(90); // => 15
   *
   * @param {Number} value 比較する値
   * @return {Number} 最小値
   */
  Number.prototype.$method("min", function(value) { return Math.min(this, value) });

  /**
   * @method clamp
   * 指定した範囲に収めた値を返します。
   *
   * ### Example
   *     (200).clamp(0, 640); // => 200
   *     (-15).clamp(0, 640); // => 0
   *     (999).clamp(0, 640); // => 640
   *
   * @param {Number} min 範囲の下限
   * @param {Number} max 範囲の上限
   * @return {Number} 範囲内に収めた値
   */
  Number.prototype.$method("clamp", function(min, max) { return Math.clamp(this, min, max) });

  /**
   * @method pow
   * 自分自身を exponent 乗した値、つまり this<sup>exponent</sup> の値を返します。
   *
   * ### Example
   *     (3).pow(2); // => 9
   *
   * @param {Number} exponent 累乗する指数
   * @return {Number} 累乗した結果の値
   */
  Number.prototype.$method("pow", function(exponent) { return Math.pow(this, exponent) });

  /**
   * @method sin
   * サイン（ラジアン単位）を返します。
   *
   * ### Example
   *     (Math.PI/4).sin(); // => 0.7071067811865476
   *
   * @return {Number} サイン
   */
  Number.prototype.$method("sin", function() { return Math.sin(this) });

  /**
   * @method sqrt
   * 平方根を返します。
   *
   * ### Example
   *     (49).sqrt(); // => 7
   *
   * @return {Number} 平方根
   */
  Number.prototype.$method("sqrt", function() { return Math.sqrt(this) });

  /**
   * @method tan
   * タンジェント（ラジアン単位）を返します。
   *
   * ### Example
   *     (Math.PI/4).tan(); // => 1.0
   *
   * @return {Number} タンジェント
   */
  Number.prototype.$method("tan", function() { return Math.tan(this) });

  /**
   * @method toDegree
   * ラジアンを度に変換します。
   *
   * ### Example
   *     Math.radToDeg(Math.PI/4); // => 45
   *
   * @return {Number} 度
   */
  Number.prototype.$method("toDegree", function() { return (this*Math.RAD_TO_DEG); });

  /**
   * @method toRadian
   * 度をラジアンに変換します。
   *
   * ### Example
   *     (180).toRadian(); // => 3.141592653589793
   *
   * @return {Number} ラジアン
   */
  Number.prototype.$method("toRadian", function() { return this*Math.DEG_TO_RAD; });

})();


/*
 * string.js
 */


;(function() {
  /**
   * @class global.String
   * # 拡張した String クラス
   * 文字列を扱う String クラスを拡張しています。
   */

  /**
   * @method format
   * フォーマットに引数を適用した文字列を返します。
   *
   * 引数がオブジェクトの場合、"{プロパティ名}" がオブジェクトのプロパティの値に置き換わります。
   * 指定したプロパティがオブジェクトにない場合は空文字列になります。
   *
   * 第1引数がオブジェクトでなかった場合、"{整数}" が各引数に置き換わります。
   * 指定した値の引数がなかった場合は空文字列になります。
   *
   * ### Example
   *     obj = {r: 128, g: 0, b: 255};
   *     "color: rgb({r}, {g}, {b});".format(obj); // => "color: rgb(128, 0, 255);"
   *
   *     "{0} + {1} = {2}".format(5, 8, (5+8)); // => "5 + 8 = 13"
   *
   * @param {Object} obj パラメータとなるオブジェクト
   * @return {String} 生成した文字列
   */
  String.prototype.$method("format", function(arg) {
    // 置換ファンク
    var rep_fn = undefined;
    
    // オブジェクトの場合
    if (typeof arg == "object") {
      /** @ignore */
      rep_fn = function(m, k) {
        if (arg[k] === undefined) {
          return '';
        }
        else {
          return arg[k];
        }
      };
    }
    // 複数引数だった場合
    else {
      var args = arguments;
      /** @ignore */
      rep_fn = function(m, k) {
        var v = args[ parseInt(k) ];
        if (v !== undefined && v !== null) {
          return v;
        }
        else {
          return '';
        }
      };
    }
    
    return this.replace( /\{(\w+)\}/g, rep_fn );
  });


  /**
   * @method trim
   * 文字列先頭と末尾の空白文字を全て取り除いた文字列を返します。
   *
   * ###Reference
   * - [String Functions for Javascript – trim, to camel case, to dashed, and to underscore](http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/)
   *
   * ### Example
   *     "  Hello, world!  ".trim(); // => "Hello, world!"
   *
   * @return {String} トリムした結果の文字列
   */
  String.prototype.$method("trim", function() {
    return this.replace(/^\s+|\s+$/g, "");
  });
  
  /**
   * @method capitalize
   * キャピタライズした文字列、すなわち、すべての単語の先頭を大文字にした文字列を返します。
   *
   * 単語の先頭以外は小文字化されます。
   *
   * ###Reference
   * - [キャピタライズ(単語の先頭の大文字化)を行う - oct inaodu](http://d.hatena.ne.jp/brazil/20051212/1134369083)  
   * - [デザインとプログラムの狭間で: javascriptでキャピタライズ（一文字目を大文字にする）](http://design-program.blogspot.com/2011/02/javascript.html)
   *
   * ### Example
   *     "i aM a pen.".capitalize(); // => "I Am A Pen."
   *
   * @return {String} キャピタライズした文字列
   */
  String.prototype.$method("capitalize", function() {
    return this.replace(/\w+/g, function(word){
      return word.capitalizeFirstLetter();
    });
  });
  
  /**
   * @method capitalizeFirstLetter
   * 先頭の文字を大文字にして、それ以外を小文字にした文字列を返します。
   *
   * ### Example
   *     "i aM a pen.".capitalizeFirstLetter(); // "I am a pen."
   *
   * @return {String} 先頭の文字を大文字にして、それ以外を小文字にした文字列
   */
  String.prototype.$method("capitalizeFirstLetter", function() {
    return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
  });
  
  /**
   * @method toDash
   * 文字列内の大文字を「"-" + 小文字」に変換します。
   *
   * css2properties（element.style）の各プロパティ名を CSS のプロパティ名に変換する場合に便利です。
   *
   * ### Example
   *     "borderTopColor".toDash(); // => "border-top-color"
   *
   *  @return {String} 変換後の文字列
   */
  String.prototype.$method("toDash", function() {
    return this.replace(/([A-Z])/g, function(m){ return '-'+m.toLowerCase(); });
  });
  
  
  /**
   * @method toHash
   * ハッシュ値を生成して返します。
   *
   * ### Example
   *     "phina.js".toHash(); // => 2676327394
   *
   * @return {Number} CRC32ハッシュ値
   */
  String.prototype.$method("toHash", function() {
    return this.toCRC32();
  });
  
  /**
   * @method padding
   * 左に文字を埋めて指定した桁にします。this の文字列は右寄せされます。
   *
   * ### Example
   *     "1234".padding(10);      // => "      1234"
   *     "1234".padding(10, '0'); // => "0000001234"
   *
   * @param {Number} figure 桁数
   * @param {String} [ch=" "] 埋める文字
   * @return {String} 指定した桁の文字列
   */
  String.prototype.$method("padding", function(n, ch) {
    var str = this.toString();
    n  = n-str.length;
    ch = (ch || ' ')[0];
    
    while(n-- > 0) { str = ch + str; }
    
    return str;
  });
  
  /**
   * @method paddingLeft
   * 左に文字を埋めて指定した桁にします。this の文字列を右寄せされます。
   *
   * {@link #padding} と同じです。
   * @inheritdoc #padding
   */
  String.prototype.$method("paddingLeft", function(n, ch) {
    var str = this.toString();
    n  = n-str.length;
    ch = (ch || ' ')[0];
    
    while(n-- > 0) { str = ch + str; }
    
    return str;
  });
  
  /**
   * @method paddingRight
   * 右に文字を埋めて指定した桁にします。this の文字列は左寄せされます。
   *
   * ### Example
   *     "1234".paddingRight(10);      // => "1234      "
   *     "1234".paddingRight(10, '0'); // => "1234000000"
   *
   * @param {Number} figure 桁数
   * @param {String} [ch=" "] 埋める文字
   * @return {String} 指定した桁の文字列
   */
  String.prototype.$method("paddingRight", function(n, ch) {
    var str = this.toString();
    n  = n-str.length;
    ch = (ch || ' ')[0];
    
    while(n-- > 0) { str = str + ch; }
    
    return str;
  });
  
  /**
   * @method quotemeta
   * 正規表現のメタ文字をクォートします。
   *
   * ### Example
   *     "Hello world. (can you hear me?)".quotemeta(); // => "Hello\\ world\\.\\ \\(can\\ you\\ hear\\ me\\?\\)"
   *
   *  @return {String} クォートされた文字列
   */
  String.prototype.$method("quotemeta", function(n) {
    return this.replace(/([^0-9A-Za-z_])/g, '\\$1');
  });
  
  /**
   * @method repeat
   * 自分自身を指定した回数だけ繰り返した文字列を返します。
   *
   * ### Example
   *     "Abc".repeat(4); // => "AbcAbcAbcAbc"
   *
   * @param {Number} n 繰り返し回数
   * @return {String} 文字列
   */
  String.prototype.$method("repeat", function(n) {
    // TODO: 確認する
    var arr = Array(n);
    for (var i=0; i<n; ++i) arr[i] = this;
    return arr.join('');
  });
  
  /**
   * @method count
   * 指定した文字列が何個入っているかをカウントして返します。
   *
   * 大文字・小文字は区別されます。
   *
   * ### Example
   *     "This is a string. Isn't it?".count("is"); // => 2
   *
   * @param {String} str 調べる文字列
   * @return {Number} this に str が入っている個数
   */
  String.prototype.$method("count", function(str) {
    var re = new RegExp(str, 'gm');
    return this.match(re).length;
  });
  
  /**
   * @method include
   * 指定した文字列が含まれているかどうかを返します。
   *
   * 大文字・小文字は区別されます。
   *
   * ### Example
   *     "This is a string.".include("is"); // => true
   *     "This is a string.".include("was"); // => false
   *
   * @param {String} str 調べる文字列
   * @return {Boolean} 含まれているかどうか
   */
  String.prototype.$method("include", function(str) {
    return this.indexOf(str) != -1;
  });
  
  /**
   * @method each
   * 各文字を順番に渡しながら関数を繰り返し実行します。
   *
   * ### Example
   *     str = 'abc';
   *     str.each(function(ch) {
   *       console.log(ch);
   *     });
   *     // => 'a'
   *     //    'b'
   *     //    'c'
   *
   * @param {Function} callback 各要素に対して実行するコールバック関数
   * @param {Object} [self=this] callback 内で this として参照される値
   */
  String.prototype.$method("each", function() {
    Array.prototype.forEach.apply(this, arguments);
    return this;
  });
  
  /**
   * @method toArray
   * 1文字ずつ分解した配列を返します。
   *
   * ### Example
   *     "12345".toArray(); // => ["1", "2", "3", "4", "5"]
   *     "あいうえお".toArray(); // => "あ", "い", "う", "え", "お"]
   *
   * @return {String[]} 配列
   */
  String.prototype.$method("toArray", function() {
    var arr = [];
    for (var i=0,len=this.length; i<len; ++i) {
      arr.push(this[i]);
    }
    return arr;
  });
  
  /**
   * @method toObject
   * キーと値の組み合わせが連結された文字列からオブジェクトを生成します。
   *
   * 値は Number、Boolean、String のいずれかの型として評価されます。
   *
   * ### Example
   *     obj1 = "num=128.5&flag1=true&flag2=false&str=hoge";
   *     obj1.toObject(); // => {num: 128.5, flag1: true, flag2: false, str: "hoge" }
   *     
   *     obj2 = "num:-64.5|flag1:false|flag2:true|str:foo";
   *     obj2.toObject('|', ':'); // => {num: -64.5, flag1: false, flag2: true, str: "foo" }
   *
   * @param {String} [sep="&"] セパレータ文字
   * @param {String} [eq=""] キーと値の組み合わせを表す文字
   * @return {Object} オブジェクト
   */
  String.prototype.$method("toObject", function(sep, eq) {
    sep = sep || '&';
    eq  = eq || '=';

    var obj = {};
    var params = this.split(sep);
    params.each(function(str, i) {
      var pos = str.indexOf(eq);
      if (pos > 0) {
        var key = str.substring(0, pos);
        var val = str.substring(pos+1);
        var num = Number(val);

        if (!isNaN(num)) {
          val = num;
        }
        else if (val === 'true') {
          val = true;
        }
        else if (val === 'false') {
          val = false;
        }

        obj[key] = val;
      }
    });

    return obj;
  });
  
  var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D".split(' ');
  
  /**
   * @method toCRC32
   * 文字列の CRC32 を計算します。
   *
   * ### Example
   *     "phina.js".toCRC32(); // => 2676327394
   *
   * @return {Number} CRC32 ハッシュ値
   */
  String.prototype.$method("toCRC32", function() {
    var crc = 0, x=0, y=0;
    
    crc = crc ^ (-1);
    for (var i=0, iTop=this.length; i<iTop; ++i) {
      y = (crc ^ this.charCodeAt(i)) & 0xff;
      x = "0x" + table[y];
      crc = (crc >>> 8) ^ x;
    }
    
    return (crc ^ (-1)) >>> 0;
  });

})();


/*
 * array.js
 */

;(function() {

  /**
   * @class global.Array
   * # 拡張した Array クラス
   * Array クラスを拡張しています。
   */


  /**
   * @property {Object} first
   * 最初の要素
   *
   * ### Example
   *     arr = [6, 5, 2, 3, 1, 4];
   *     arr.first; // => 6
   */
  Array.prototype.accessor("first", {
      "get": function()   { return this[0]; },
      "set": function(v)  { this[0] = v; }
  });
  
  /**
   * @property {Object} last
   * 最後の要素
   *
   * ### Example
   *     arr = [6, 5, 2, 3, 1, 4];
   *     arr.last; // => 4
   */
  Array.prototype.accessor("last", {
    "get": function()   { return this[this.length-1]; },
    "set": function(v)  { this[this.length-1] = v; }
  });

  /**
   * @method equals
   * 渡された配列と等しいかどうかをチェックします。
   *
   * 要素同士を === で比較します。要素に配列が含まれている場合は {@link #deepEquals} を使用してください。
   *
   * ### Example
   *     arr1 = [6, 5, 2, 3, 1, 4];
   *     arr1.equals([6, 5, 2, 3, 1, 4]);       // => true
   *     arr2 = [6, 5, 2, [3, 1], 4];
   *     arr2.equals([6, 5, 2, [3, 1], 4]);     // => false
   *     arr2.deepEquals([6, 5, 2, [3, 1], 4]); // => true
   *
   * @param {Array} arr 比較する対象の配列
   * @return {Boolean} チェックの結果
   */
  Array.prototype.$method("equals", function(arr) {
    // 長さチェック
    if (this.length !== arr.length) return false;
    
    for (var i=0,len=this.length; i<len; ++i) {
      if (this[i] !== arr[i]) {
        return false;
      }
    }

    return true;
  });

  /**
   * @method deepEquals
   * ネストされている配列を含め、渡された配列と等しいかどうかをチェックします。
   *
   * ※equalsDeep にするか検討. (Java では deepEquals なのでとりあえず合わせとく)
   *
   * ### Example
   *     arr = [6, 5, 2, [3, 1], 4];
   *     arr.equals([6, 5, 2, [3, 1], 4]);     // => false
   *     arr.deepEquals([6, 5, 2, [3, 1], 4]); // => true
   *
   * @param {Array} arr 比較する対象の配列
   * @return {Boolean} チェックの結果
   */
  Array.prototype.$method("deepEquals", function(arr) {
    // 長さチェック
    if (this.length !== arr.length) return false;
    
    for (var i=0,len=this.length; i<len; ++i) {
      var result = (this[i].deepEquals) ? this[i].deepEquals(arr[i]) : (this[i] === arr[i]);
      if (result === false) {
        return false;
      }
    }
    return true;
  });

  /**
   * @method contains
   * 指定した要素が配列に含まれているかをチェックします。
   *
   * 比較には厳密な同値（三重イコール演算子 === で使われるのと同じ方法）を用います。
   *
   * ### Example
   *     arr = [6, 5, 2, 3, 1, 4];
   *     arr.contains(3);     // => true
   *     arr.contains(3, 4);  // => false
   *     arr.contains(3, -4); // => true
   *     arr.contains("6");   // => false
   *
   * @param {Object} item チェックするオブジェクト
   * @param {Number} [fromIndex=0] 検索を始める位置。負数を指定した場合は末尾からのオフセットと見なします。
   * @return {Boolean} チェックの結果
   */
  Array.prototype.$method("contains", function(item, fromIndex) {
    return this.indexOf(item, fromIndex) != -1;
  });
  
  /**
   * @method at
   * 指定したインデックスの要素を返します（ループ・負数の指定可）。
   *
   * 添字が負数の場合は末尾からのオフセットとみなします。末尾の要素が -1 番目になります。  
   * 添字の絶対値が Array.length 以上の場合はループします。
   *
   * ### Example
   *     arr = ['a', 'b', 'c', 'd', 'e', 'f'];
   *     arr.at(0);  // => 'a'
   *     arr.at(6);  // => 'a'
   *     arr.at(13); // => 'b'
   *     arr.at(-1); // => 'f'
   *     arr.at(-8); // => 'e'
   *
   * @param {Number} index 添字
   * @return {Object} 添字で指定された要素
   */
  Array.prototype.$method("at", function(i) {
    i%=this.length;
    i+=this.length;
    i%=this.length;
    return this[i];
  });


  /**
   * @method find
   * 各要素を引数にして関数を実行し、その値が真となる（＝条件にマッチする）最初の要素を返します。
   *
   * どの要素もマッチしなければ undefined を返します。
   *
   * ### Example
   *     arr = ['foo', 'bar', 'hoge', 'fuga'];
   *     arr.find( function(elm) {
   *       return elm.indexOf('a') >= 0;
   *     });
   *     // => 'bar'
   *
   * @param {Function} callback 各要素に対して実行するコールバック関数
   * @param {Object} [self=this] callback 内で this として参照される値。デフォルトは呼び出し時の this。
   * @return {Object} 条件にマッチした最初の要素、または undefined
   */
  Array.prototype.$method("find", function(fn, self) {
    var target = null;

    this.some(function(elm, i) {
      if (fn.call(self, elm, i, this)) {
        target = elm;
        return true;
      }
    });

    return target;
  });

  /**
   * @method findIndex
   * 各要素を引数にして関数を実行し、その値が真となる（＝条件にマッチする）最初のインデックスを返します。
   *
   * どの要素もマッチしなければ -1 を返します。
   *
   * ### Example
   *     arr = ['foo', 'bar', 'hoge', 'fuga'];
   *     arr.findIndex( function(elm) {
   *       return elm.indexOf('a') >= 0;
   *     });
   *     // => 1
   *
   * @param {Function} callback 各要素に対して実行するコールバック関数
   * @param {Object} [self=this] callback 内で this として参照される値。デフォルトは呼び出し時の this。
   * @return {Object} 条件にマッチした最初のインデックス、または -1
   */
  Array.prototype.$method("findIndex", function(fn, self) {
    var target = null;

    this.some(function(elm, i) {
      if (fn.call(self, elm, i, this)) {
        target = i;
        return true;
      }
    });

    return target;
  });
  
  /**
   * @method swap
   * @chainable
   * a 番目の要素 と b 番目の要素を入れ替えます。
   *
   * ### Example
   *     arr1 = ['a', 'b', 'c', 'd'];
   *     arr2 = arr1.swap(0, 3); // => ['d', 'b', 'c', 'a']
   *     arr1 === arr2;          // => true
   *
   * @param {Number} a  インデックス
   * @param {Number} b  インデックス
   */
  Array.prototype.$method("swap", function(a, b) {
    var temp = this[a];
    this[a] = this[b];
    this[b] = temp;
    
    return this;
  });

  /**
   * @method erase
   * @chainable
   * 指定したオブジェクトと一致した最初の要素を削除します。
   *
   * ### Example
   *     arr1 = ['a', 'b', 'b', 'c'];
   *     arr2 = arr1.erase('b'); // => ['a', 'b', 'c']
   *     arr1 === arr2;          // => true
   *
   * @param {Object} elm 削除したいオブジェクト
   */
  Array.prototype.$method("erase", function(elm) {
    var index  = this.indexOf(elm);
    if (index >= 0) {
      this.splice(index, 1);
    }
    return this;
  });
  
  /**
   * @method eraseAll
   * @chainable
   * 指定したオブジェクトと一致したすべての要素を削除します。
   *
   * ### Example
   *     arr1 = ['a', 'b', 'b', 'c'];
   *     arr2 = arr1.eraseAll('b'); // => ['a', 'c']
   *     arr1 === arr2;             // => true
   *
   * @param {Object} elm 削除したいオブジェクト
   */
  Array.prototype.$method("eraseAll", function(elm) {
    for (var i=0,len=this.length; i<len; ++i) {
      if (this[i] == elm) {
        this.splice(i--, 1);
      }
    }
    return this;
  });
  
  /**
   * @method eraseIf
   * @chainable
   * 各要素を引数にして関数を実行し、その値が真となる（＝条件にマッチする）最初の要素を削除します。
   *
   * どの要素もマッチしなければ何も起きません。
   *
   * ### Example
   *     arr = ['foo', 'bar', 'hoge', 'fuga'];
   *     arr.eraseIf( function(elm) {
   *       return elm.indexOf('o') >= 0;
   *     });
   *     // => ['bar', 'hoge', 'fuga']
   *
   * @param {Function} callback 各要素に対して実行するコールバック関数
   */
  Array.prototype.$method("eraseIf", function(fn) {
    for (var i=0,len=this.length; i<len; ++i) {
      if ( fn(this[i], i, this) ) {
        this.splice(i, 1);
        break;
      }
    }
    return this;
  });
  
  /**
   * @method eraseIfAll
   * @chainable
   * 各要素を引数にして関数を実行し、その値が真となる（＝条件にマッチする）すべての要素を削除します。
   *
   * どの要素もマッチしなければ何も起きません。
   *
   * ### Example
   *     arr = ['foo', 'bar', 'hoge', 'fuga'];
   *     arr.eraseIfAll( function(elm) {
   *       return elm.indexOf('o') >= 0;
   *     });
   *     // => ['bar', 'fuga']
   *
   * @param {Function} callback 各要素に対して実行するコールバック関数
   */
  Array.prototype.$method("eraseIfAll", function(fn) {
    for (var i=0,len=this.length; i<len; ++i) {
      if ( fn(this[i], i, this) ) {
        this.splice(i--, 1);
        len--;
      }
    }
    return this;
  });
  
  /**
   * @method random
   * 配列からランダムに1つ取り出した要素を返します。
   *
   * 取り出す範囲をインデックスで指定することもできます。  
   * {@link #pickup}、{@link #lot} と同じです。  
   *
   * ### Example
   *     arr = ['foo', 'bar', 'hoge', 'fuga'];
   *     arr.random(2, 3);  // => 'hoge' または 'fuga'
   *
   * @param {Number} [min=0] インデックスの下限
   * @param {Number} [max=配列の最大インデックス] インデックスの上限
   * @return {Object} ランダムに1つ取り出した要素
   */
  Array.prototype.$method("random", function(min, max) {
    min = min || 0;
    max = max || this.length-1;
    return this[ Math.randint(min, max) ];
  });
  
  /**
   * @method pickup
   * 配列からランダムで1つ取り出した要素を返します。
   *
   * {@link #random}、{@link #lot} と同じです。
   * @inheritdoc #random
   */
  Array.prototype.$method("pickup", function(min, max) {
    min = min || 0;
    max = max || this.length-1;
    return this[ Math.randint(min, max) ];
  });
  
  /**
   * @method lot
   * 配列からランダムで1つ取り出した要素を返します。
   *
   * {@link #random}、{@link #pickup} と同じです。
   * @inheritdoc #random
   */
  Array.prototype.$method("lot", function(min, max) {
    min = min || 0;
    max = max || this.length-1;
    return this[ Math.randint(min, max) ];
  });
  
  /**
   * @method uniq
   * 要素の重複を取り除いた配列を生成して返します。
   *
   * 自分自身は破壊されません。
   *
   * ### Example
   *     arr = [1, 2, 3, 4, 3, 2];
   *     arr.uniq(); // => [1, 2, 3, 4]
   *
   * @param {Number} [deep] ※未使用
   * @return {Object} 新しい配列
   */
  Array.prototype.$method("uniq", function(deep) {
    return this.filter(function(value, index, self) {
      return self.indexOf(value) === index;
    });
  });
  

  /**
   * @method flatten
   * 自身を再帰的に平滑化した配列を生成して返します。
   *
   * level を指定しなければ深さの際限なく完全に平滑化します。
   *
   * ### Example
   *     arr = [1, 2, [3, [4, 5]]];
   *     arr.flatten();  // => [1, 2, 3, 4, 5]
   *     arr.flatten(1); // => [1, 2, 3, [4, 5]]
   *
   * @param {Number} [level=0]  平滑化の再帰の深さ
   * @return {Object} 平滑化した配列
   */
  Array.prototype.$method("flatten", function(level) {
    var arr = null;

    if (level) {
      arr = this;
      for (var i=0; i<level; ++i) {
        arr = Array.prototype.concat.apply([], arr);
      }
    }
    else {
      // 完全フラット
      arr = this.reduce(function (previousValue, curentValue) {
        return Array.isArray(curentValue) ?
          previousValue.concat(curentValue.flatten()) : previousValue.concat(curentValue);
      }, []);
    }

    return arr;
  });

  /**
   * @method clone
   * 自身のコピーを生成して返します。
   *
   * ### Example
   *     arr1 = [1, 2, [3, 4]];
   *     arr2 = arr1.clone();      // => [1, 2, [3, 4]]
   *     arr1[2] === arr2[2];      // => true
   *     arr1[2][0] = 9;
   *     arr2;                     // => [1, 2, [9, 4]]
   *     arr1 = [1, 2, [3, 4]];
   *     arr2 = arr1.clone(true);  // => [1, 2, [3, 4]]
   *     arr1[2] === arr2[2];      // => false
   *     arr1[2][0] = 9;
   *     arr2;                     // => [1, 2, [3, 4]]
   *
   * @param {Boolean} [deep=false] 配列のネストをたどって複製するかどうか
   * @return {Object} 新しい配列
   */
  Array.prototype.$method("clone", function(deep) {
    if (deep === true) {
      var a = Array(this.length);
      for (var i=0,len=this.length; i<len; ++i) {
        a[i] = (this[i].clone) ? this[i].clone(deep) : this[i];
      }
      return a;
    }
    else {
      return Array.prototype.slice.apply(this);
    }
  });


  /**
   * @method clear
   * @chainable
   * 自身を空の配列にします。
   *
   * ### Example
   *     arr = [1, 2, [3, 4]];
   *     arr.clear(); // => []
   */
  Array.prototype.$method("clear", function() {
    this.length = 0;
    return this;
  });
  
  /**
   * @method fill
   * @chainable
   * 自身の一部の要素を特定の値で埋めます。
   *
   * ### Example
   *     arr = [1, 2, 3, 4, 5];
   *     arr.fill("x");       // => ["x", "x", "x", "x", "x"]
   *     arr.fill("x", 2, 4); // => [1, 2, "x", "x", 5]
   *
   * @param {Object} value 埋める値
   * @param {Number} [start=0] 値を埋める最初のインデックス
   * @param {Number} [end=自身の配列の長さ] 値を埋める最後のインデックス+1
   */
  Array.prototype.$method("fill", function(value, start, end) {
    start = start || 0;
    end   = end   || (this.length);
    
    for (var i=start; i<end; ++i) {
      this[i] = value;
    }
    
    return this;
  });
  

  /**
   * @method range
   * @chainable
   * 自身を等差数列（一定間隔の整数値の列）とします。
   *
   * - 引数が1つの場合、0～end（end含まず）の整数の配列です。  
   * - 引数が2つの場合、start～end（end含まず）の整数の配列です。  
   * - 引数が3つの場合、start～end（end含まず）かつ start + n * step (nは整数)を満たす整数の配列です。
   *
   * ### Example
   *     arr = [];
   *     arr.range(4);        // => [0, 1, 2, 3]
   *     arr.range(2, 5);     // => [2, 3, 4]
   *     arr.range(2, 14, 5); // => [2, 7, 12]
   *     arr.range(2, -3);    // => [2, 1, 0, -1, -2]
   *
   * @param {Number} start 最初の値（デフォルトは 0）
   * @param {Number} end 最後の値（省略不可）
   * @param {Number} [step=1または-1] 間隔
   */
  Array.prototype.$method("range", function(start, end, step) {
    this.clear();
    
    if (arguments.length == 1) {
      for (var i=0; i<start; ++i) this[i] = i;
    }
    else if (start < end) {
      step = step || 1;
      if (step > 0) {
        for (var i=start, index=0; i<end; i+=step, ++index) {
          this[index] = i;
        }
      }
    }
    else {
      step = step || -1;
      if (step < 0) {
        for (var i=start, index=0; i>end; i+=step, ++index) {
          this[index] = i;
        }
      }
    }
    
    return this;
  });
  
  /**
   * @method shuffle
   * @chainable
   * 自身の要素をランダムにシャッフルします。
   *
   * ### Example
   *     arr = [1, 2, 3, 4, 5];
   *     arr.shuffle(); // => [5, 1, 4, 2, 3] など
   */
  Array.prototype.$method("shuffle", function() {
    for (var i=0,len=this.length; i<len; ++i) {
      var j = Math.randint(0, len-1);
      
      if (i != j) {
        this.swap(i, j);
      }
    }
    
    return this;
  });

  /**
   * @method sum
   * 要素の合計値を返します。
   *
   * 要素に数値以外が含まれる場合の挙動は不定です。
   *
   * ### Example
   *     arr = [1, 2, 3, 4, 5, 6];
   *     arr.sum(); // => 21
   *
   * @return {Number} 合計
   */
  Array.prototype.$method("sum", function() {
    var sum = 0;
    for (var i=0,len=this.length; i<len; ++i) {
      sum += this[i];
    }
    return sum;
  });

  /**
   * @method average
   * 要素の平均値を返します。
   *
   * 要素に数値以外が含まれる場合の挙動は不定です。
   *
   * ### Example
   *     arr = [1, 2, 3, 4, 5, 6]
   *     arr.average(); // => 3.5
   *
   * @return {Number} 平均値
   */
  Array.prototype.$method("average", function() {
    var sum = 0;
    var len = this.length;
    for (var i=0; i<len; ++i) {
      sum += this[i];
    }
    return sum/len;
  });

  /**
   * @method each
   * @chainable
   * 要素を順番に渡しながら関数を繰り返し実行します。
   *
   * メソッドチェーンに対応していますが、このメソッドによって自分自身は変化しません。
   *
   * ###Reference
   * - [Array.prototype.forEach() - JavaScript | MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
   *
   * ### Example
   *     arr = [1, 2, 3];
   *     arr.each( function(elm) {
   *       console.log(elm * elm)
   *     });
   *     // => 1
   *     //    4
   *     //    9
   *
   * @param {Function} callback 各要素に対して実行するコールバック関数
   * @param {Object} [self=this] callback 内で this として参照される値
   */
  Array.prototype.$method("each", function() {
    this.forEach.apply(this, arguments);
    return this;
  });

  
  /**
   * @method toULElement
   * ULElement に変換します（未実装）
   */
  Array.prototype.$method("toULElement", function(){
      // TODO: 
  });

  /**
   * @method toOLElement
   * OLElement に変換します（未実装）
   */
  Array.prototype.$method("toOLElement", function(){
      // TODO:
  });

  
  /**
   * @method range
   * @static
   * インスタンスメソッドの {@link #range} と同じです。
   *
   * ### Example
   *     Array.range(2, 14, 5); // => [2, 7, 12]
   */
  Array.$method("range", function(start, end, step) {
    return Array.prototype.range.apply([], arguments);
  });


  /**
   * @method of
   * @static
   * ES6 準拠の of 関数です。可変長引数をとって Array オブジェクトにして返します。
   *
   * ### Example
   *     Array.of();        // => []
   *     Array.of(1, 2, 3); // => [1, 2, 3]
   *
   * @param {Object} elementN 生成する配列の要素
   * @return {Array} 生成した配列
   */
  Array.$method("of", function() {
    return Array.prototype.slice.call(arguments);
  });

  /**
   * @method from
   * @static
   * ES6 準拠の from 関数です。array-like オブジェクトかiterable オブジェクトから新しい配列を生成します。
   *
   * array-like オブジェクトとは、length プロパティを持ち、数字の添字でアクセス可能なオブジェクトのことです。
   * 通常の配列のほか、String、arguments、NodeList なども array-like オブジェクトです。
   *
   * iterable オブジェクトとは、Symbol.iterator プロパティを持つオブジェクトのことです。
   * 通常の配列のほか、String、arguments、NodeList なども iterable オブジェクトです。
   *
   * ### Example
   *     Array.from([1, 2, 3], function(elm){ return elm * elm} ); // => [1, 4, 9]
   *     Array.from("foo");                                        // => ["f", "o", "o"]
   *     Array.from( document.querySelectorAll("span"))            // => [Element, Element, Element,...]
   *
   * @param {Object} arrayLike 配列に変換する array-like オブジェクト
   * @param {Function} [callback] arrayLike のすべての要素に対して実行するマップ関数
   * @param {Object} [context] callback 内で this として参照される値
   * @return {Array} 生成した配列
   */
  Array.$method("from", function(arrayLike, callback, context) {
    if (!Object(arrayLike).length) return [];

    var result = [];
    if (Symbol && Symbol.iterator && arrayLike[Symbol.iterator]) {
        var iterator = arrayLike[Symbol.iterator]();
        while (true) {
            var iteratorResult = iterator.next();
            if (iteratorResult.done) break;

            var value = typeof callback === 'function' ? callback.bind(context || this)(iteratorResult.value) : iteratorResult.value;
            result.push(value);
        }
        return result;
    }

    for (var i = 0, len = arrayLike.length; i < len; i++) {
        result.push(arrayLike[i]);
    }
    return result.map(typeof callback == 'function' ? callback : function(item) {
      return item;
    }, context);
  });
  
  /**
   * @method most
   * 指定した関数の返り値が最小となる要素と最大となる要素をまとめて返します。
   *
   * 空の配列に対して実行すると {max: Infinity, min: -Infinity} を返します。
   *
   * ### Example
   *     [5,1,4,1,9,2,-10].most(); // => {max:9, min: -10}
   *
   *     points = [ {x:0, y:0}, {x:640, y:960}, {x:-80, y:100} ];
   *     points.most(function(e){return e.x;}).min; // => [x:-80, y:100]
   *     points.most(function(e){return e.y;}).max; // => [x:640, y:960]
   *
   * @param {Function} [callback] 各要素に対して実行するコールバック関数
   * @param {Object} [self=this] 関数内で this として参照される値。デフォルトは自分自身。
   * @return {Object} max と min をキーに持つオブジェクト
   * @return {Object} return.min 関数の返り値が最小となる要素
   * @return {Object} return.max 関数の返り値が最大となる要素
   */
  Array.prototype.$method("most", function(func, self) {
    if(this.length < 1){
      return {
        max: -Infinity,
        min: Infinity,
      };
    }
    if(func){
      var maxValue = -Infinity;
      var minValue = Infinity;
      var maxIndex = 0;
      var minIndex = 0;
      
      if(typeof self === 'undefined'){self = this;}
      
      for (var i = 0, len = this.length; i < len; ++i) {
        var v = func.call(self, this[i], i, this);
        if(maxValue < v){
          maxValue = v;
          maxIndex = i;
        }
        if(minValue > v){
          minValue = v;
          minIndex = i;
        }
      }
      return {
        max: this[maxIndex],
        min: this[minIndex],
      };
    }
    else{
      var max = -Infinity;
      var min = Infinity;
      for (var i = 0, len = this.length;i < len; ++i) {
        if(max<this[i]){max=this[i];}
        if(min>this[i]){min=this[i];}
      }
      return {
        max: max,
        min: min,
      };
    }
    
  });  

})();

/*
 * date.js
 */

(function() {
  
  /**
   * @class global.Date
   * # 拡張した Date クラス
   * 日付を扱う Date クラスを拡張しています。
   */
  
  var MONTH = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  var WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  
  /**
   * @method format
   * 指定したフォーマットに従って日付を文字列化します。
   *
   * <table border="1">
   *   <tr><td>変換指定文字列</td><td>意味</td></tr>
   *   <tr><td>yyyy</td><td>西暦年（4桁）</td></tr>
   *   <tr><td>yy</td><td>西暦年（2桁）</td></tr>
   *   <tr><td>y</td><td>西暦年</td></tr>
   *   <tr><td>MMMM</td><td>月（英語名）</td></tr>
   *   <tr><td>MMM</td><td>月（英語省略名）</td></tr>
   *   <tr><td>MM</td><td>月（2桁数字）</td></tr>
   *   <tr><td>M</td><td>月</td></tr>
   *   <tr><td>dd</td><td>日（2桁）</td></tr>
   *   <tr><td>d</td><td>日</td></tr>
   *   <tr><td>EEEE</td><td>曜日（英語名）</td></tr>
   *   <tr><td>EEE</td><td>曜日（英語省略名）</td></tr>
   *   <tr><td>HH</td><td>時（24時間表記・2桁）</td></tr>
   *   <tr><td>H</td><td>時（24時間表記）</td></tr>
   *   <tr><td>mm</td><td>分（2桁）</td></tr>
   *   <tr><td>m</td><td>分</td></tr>
   *   <tr><td>ss</td><td>秒（2桁）</td></tr>
   *   <tr><td>s</td><td>秒</td></tr>
   * </table>
   * 桁数が指定されているものは0パディングされます。
   *
   * ### Example
   *     (new Date()).format("yyyy-MM-dd(EEE)"); // => "2016-04-05(Tue)" など
   *
   * @param {String} pattern フォーマット文字列
   * @return {String} フォーマット文字列に従って生成された文字列
   */
  Date.prototype.$method('format', function(pattern) {
    var year    = this.getFullYear();
    var month   = this.getMonth();
    var date    = this.getDate();
    var day     = this.getDay();
    var hours   = this.getHours();
    var minutes = this.getMinutes();
    var seconds = this.getSeconds();
    var millseconds = this.getMilliseconds();
    
    var patterns = {
      'yyyy': String(year).padding(4, '0'),
      'yy': year.toString().substr(2, 2),
      'y': year,

      'MMMM': MONTH[month],
      'MMM': MONTH[month].substr(0, 3),
      'MM': String(month+1).padding(2, '0'),
      'M': (month+1),

      'dd': String(date).padding(2, '0'),
      'd': date,

      'EEEE': WEEK[day],
      'EEE': WEEK[day].substr(0, 3),

      'HH': String(hours).padding(2, '0'),
      'H': hours,

      'mm': String(minutes).padding(2, '0'),
      'm': minutes,

      'ss': String(seconds).padding(2, '0'),
      's': seconds,
      
      // // date
      // 'd': String('00' + date).slice(-2),
      // 'D': WEEK[day].substr(0, 3),
      // 'j': date,
      // 'l': WEEK[day],
      
      // // month
      // 'm': String('00' + (month+1)).slice(-2),
      // 'M': MONTH[month].substr(0, 3),
      // 'n': (month+1),
      // 'F': MONTH[month],
      
      // // year
      // 'y': year.toString().substr(2, 2),
      // 'Y': year,
      
      // // time
      // 'G': hours,
      // 'H': String('00' + hours).slice(-2),
      // 'i': String('00' + minutes).slice(-2),
      // 's': String('00' + seconds).slice(-2),
      // 'S': String('000' + millseconds).slice(-3),
    };

    var regstr = '(' + Object.keys(patterns).join('|') + ')';
    var re = new RegExp(regstr, 'g');

    return pattern.replace(re, function(str) {
      return patterns[str];
    });
  });


  /**
   * @method calculateAge
   * @static
   * 指定した誕生日から、現在または指定した日付における年齢を計算します。
   *
   * ###Reference
   * - [Javascriptで誕生日から現在の年齢を算出](http://qiita.com/n0bisuke/items/dd537bd4cbe9ab501ce8)
   *
   * ### Example
   *     Date.calculateAge("1990-01-17"); // => 26 など
   *
   * @param {String/Date} birthday 誕生日
   * @param {String/Date} [when=本日] 基準の日付
   * @return {Number} 年齢
   */
  Date.$method('calculateAge', function(birthday, when) {
    // birthday
    if (typeof birthday === 'string') {
      birthday = new Date(birthday);
    }
    // when
    if (!when) {
      when = new Date();
    }
    else if (typeof when === 'string') {
      when = new Date(when);
    }

    var bn = new Date(birthday.getTime()).setFullYear(256);
    var wn = new Date(when.getTime()).setFullYear(256);
    var step = (wn < bn) ? 1 : 0;

    return (when.getFullYear() - birthday.getFullYear()) - step;
  });
  
})();

/*
 * math.js
 */

;(function() {
    
  /**
   * @class global.Math
   * # 拡張した Math クラス
   * 数学的な処理を扱う Math クラスを拡張しています。
   */

  
  /**
   * @property DEG_TO_RAD
   * 度をラジアンに変換するための定数です。
   */
  Math.DEG_TO_RAD = Math.PI/180;
  
  /**
   * @property RAD_TO_DEG
   * ラジアンを度に変換するための定数です。
   */
  Math.RAD_TO_DEG = 180/Math.PI;
  
  /**
   * @property PHI
   * 黄金比です。
   */
  Math.PHI = (1 + Math.sqrt(5)) / 2;
  
  /**
   * @static
   * @method degToRad
   * 度をラジアンに変換します。
   *
   * ### Example
   *     Math.degToRad(180); // => 3.141592653589793
   *
   * @param {Number} deg 度
   * @return {Number} ラジアン
   */
  Math.degToRad = function(deg) {
    return deg * Math.DEG_TO_RAD;
  };
  
  /**
   * @static
   * @method radToDeg
   * ラジアンを度に変換します。
   *
   * ### Example
   *     Math.radToDeg(Math.PI/4); // => 45
   *
   * @param {Number} rad ラジアン
   * @return {Number} 度
   */
  Math.radToDeg = function(rad) {
    return rad * Math.RAD_TO_DEG;
  };
  

  
  /**
   * @static
   * @method clamp
   * 指定した値を指定した範囲に収めた結果を返します。
   *
   * ### Example
   *     Math.clamp(120, 0, 640); // => 120
   *     Math.clamp(980, 0, 640); // => 640
   *     Math.clamp(-80, 0, 640); // => 0
   *
   * @param {Number} value 値
   * @param {Number} min  範囲の下限
   * @param {Number} max  範囲の上限
   * @return {Number} 丸めた結果の値
   */
  Math.$method("clamp", function(value, min, max) {
    return (value < min) ? min : ( (value > max) ? max : value );
  });
  
  /**
   * @static
   * @method inside
   * 指定した値が指定した値の範囲にあるかどうかを返します。
   *
   * ### Example
   *     Math.inside(980, 0, 640); // => false
   *     Math.inside(120, 0, 640); // => true
   *
   * @param {Number} value チェックする値
   * @param {Number} min  範囲の下限
   * @param {Number} max  範囲の上限
   * @return {Boolean} 範囲内に値があるかないか
   */
  Math.$method("inside", function(value, min, max) {
    return (value >= min) && (value) <= max;
  });
  
  /**
   * @static
   * @method randint
   * 指定された範囲内でランダムな整数値を生成します。
   *
   * ### Example
   *     Math.randint(-4, 4); // => -4、0、3、4 など
   *
   * @param {Number} min  範囲の最小値
   * @param {Number} max  範囲の最大値
   * @return {Number} ランダムな整数値
   */
  Math.$method("randint", function(min, max) {
    return Math.floor( Math.random()*(max-min+1) ) + min;
  });
  
  /**
   * @static
   * @method randfloat
   * 指定された範囲内でランダムな数値を生成します。
   *
   * ### Example
   *     Math.randfloat(-4, 4); // => -2.7489193824000937 など
   *
   * @param {Number} min  範囲の最小値
   * @param {Number} max  範囲の最大値
   * @return {Number} ランダムな数値
   */
  Math.$method("randfloat", function(min, max) {
    return Math.random()*(max-min)+min;
  });

  /**
   * @static
   * @method randbool
   * ランダムに真偽値を生成します。
   * 引数で百分率を指定する事もできます。
   *
   * ### Example
   *     Math.randbool();   // => true または false
   *     Math.randbool(80); // => 80% の確率で true
   *
   * @param {Number} percent  真になる百分率
   * @return {Boolean} ランダムな真偽値
   */
  Math.$method("randbool", function(perecent) {
    return Math.randint(0, 100) < (perecent || 50);
  });
    
})();
/*
 *
 */



/*
 * phina.js namespace
 */
var phina = phina || {};

;(function() {

  /**
   * @class phina
   * phina.js namespace
   */

  /**
   * バージョン
   */
  phina.VERSION = '1.0.0';

  phina.$method('isNode', function() {
    return (typeof module !== 'undefined');
  });

  phina.$method('namespace', function(fn) {
    fn.call(this);
  });

  var ns = phina.isNode() ? global : window;

  /**
   * @method global
   * global
   */
  phina.accessor('global', {
    get: function() {
      return ns;
    },
  });

  
  /**
   * @method testUA
   * UAを正規表現テスト
   */
  phina.$method('testUA', function(regExp) {
    if (!phina.global.navigator) return false;
    var ua = phina.global.navigator.userAgent;
    return regExp.test(ua);
  });

  /**
   * @method isAndroid
   * Android かどうかをチェック
   */
  phina.$method('isAndroid', function() {
    return phina.testUA(/Android/);
  });
  
  /**
   * @method isIPhone
   * iPhone かどうかをチェック
   */
  phina.$method('isIPhone', function() {
    return phina.testUA(/iPhone/);
  });
  
  /**
   * @method isIPad
   * iPad かどうかをチェック
   */
  phina.$method('isIPad', function() {
    return phina.testUA(/iPad/);
  });
  
  /**
   * @method isIOS
   * iOS かどうかをチェック
   */
  phina.$method('isIOS', function() {
    return phina.testUA(/iPhone|iPad/);
  });

  /**
   * @method isMobile
   * mobile かどうかをチェック
   */
  phina.$method('isMobile', function() {
    return phina.testUA(/iPhone|iPad|Android/);
  });
  
  


  // support node.js
  if (phina.isNode()) {
    module.exports = phina;
  }

  ns.phina = phina;

})(this);


phina.namespace(function() {

  /**
   * @member phina
   * @static
   * @method createClass
   * クラスを生成
   */
  phina.$method('createClass', function(params) {
    var props = {};

    var _class = function() {
      var instance = new _class.prototype._creator();
      _class.prototype.init.apply(instance, arguments);
      return instance;
    };

    if (params.superClass) {
      _class.prototype = Object.create(params.superClass.prototype);
      params.init.owner = _class;
      _class.prototype.superInit = function() {
        this.__counter = this.__counter || 0;

        var superClass = this._hierarchies[this.__counter++];
        var superInit = superClass.prototype.init;
        superInit.apply(this, arguments);

        this.__counter = 0;
      };
      _class.prototype.superMethod = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var name = args.shift();
        this.__counters = this.__counters || {};
        this.__counters[name] = this.__counters[name] || 0;

        var superClass = this._hierarchies[ this.__counters[name]++ ];
        var superMethod = superClass.prototype[name];
        var rst = superMethod.apply(this, args);

        this.__counters[name] = 0;

        return rst;
      };
      _class.prototype.constructor = _class;
    }


    // // 
    // params.forIn(function(key, value) {
    //   if (typeof value === 'function') {
    //     _class.$method(key, value);
    //   }
    //   else {
    //     _class.prototype[key] = value;
    //   }
    // });
    // 継承
    _class.prototype.$extend(params);

    // 継承用
    _class.prototype._hierarchies = [];
    var _super = _class.prototype.superClass;
    while(_super) {
      _class.prototype._hierarchies.push(_super);
      _super = _super.prototype.superClass;
    }

    // accessor
    if (params._accessor) {
      params._accessor.forIn(function(key, value) {
        _class.prototype.accessor(key, value);
      });
      // _class.prototype = Object.create(_class.prototype, params._accessor);
    }

    _class.prototype._creator = function() { return this; };
    _class.prototype._creator.prototype = _class.prototype;

    // static property/method
    if (params._static) {
      _class.$extend(params._static);
    }

    if (params._defined) {
      params._defined.call(_class, _class);
    }

    return _class;
  });

  var chachedClasses = {};
  /*
   * 
   */
  phina.$method('using', function(path) {
    if (!path) {
      return phina.global;
    }
    
    var pathes = path.split(/[,.\/ ]|::/);
    var current = phina.global;

    pathes.forEach(function(p) {
      current = current[p] || (current[p]={});
    });

    return current;
  });
  
  /*
   * 
   */
  phina.$method('register', function(path, _class) {
    var pathes = path.split(/[,.\/ ]|::/);
    var className = pathes.last;
    var parentPath = path.substring(0, path.lastIndexOf('.'));
    var parent = phina.using(parentPath);

    parent[className] = _class;

    return _class;
  });
  
  var _classDefinedCallback = {};

  /**
   * @member phina
   * @static
   * @method define
   * クラスを定義
   */
  phina.$method('define', function(path, params) {
    if (params.superClass) {
      if (typeof params.superClass === 'string') {
        var _superClass = phina.using(params.superClass);
        if (typeof _superClass != 'function') {
          if (!_classDefinedCallback[params.superClass]) {
            _classDefinedCallback[params.superClass] = [];
          }
          _classDefinedCallback[params.superClass].push(function() {
            phina.define(path, params);
          });

          return ;
        }
        else {
          params.superClass = _superClass;
        }
      }
      else {
        params.superClass = params.superClass;
      }
    }

    var _class = phina.createClass(params);
    _class.prototype.accessor('className', {
      get: function() {
        return path;
      },
    });

    phina.register(path, _class);
    
    if (_classDefinedCallback[path]) {
      _classDefinedCallback[path].forEach(function(callback) {
        callback();
      });
      _classDefinedCallback[path] = null;
    }

    return _class;
  });


  phina.$method('globalize', function() {
    phina.forIn(function(key, value) {
      var ns = key;

      if (typeof value !== 'object') return ;

      value.forIn(function(key, value) {
        // if (phina.global[key]) {
        //   console.log(ns, key);
        //   phina.global['_' + key] = value;
        // }
        // else {
        //   phina.global[key] = value;
        // }
        phina.global[key] = value;
      });
    });
  });

  phina._mainListeners = [];
  phina._mainLoaded = false;
  phina.$method('main', function(func) {
    if (phina._mainLoaded) {
      func();
    }
    else {
      phina._mainListeners.push(func);
    }
  });

  var doc = phina.global.document;
  if (phina.global.addEventListener && doc && doc.readyState !== 'complete') {
    phina.global.addEventListener('load', function() {
      var run = function() {
        var listeners = phina._mainListeners.clone();
        phina._mainListeners.clear();
        listeners.each(function(func) {
          func();
        });

        // main 内で main を追加している場合があるのでそのチェック
        if (phina._mainListeners.length > 0) {
          run(0);
        }
        else {
          phina._mainLoaded = true;
        }
      };
      // ちょっと遅延させる(画面サイズ問題)
      setTimeout(run);
    });
  }
  else {
    phina._mainLoaded = true;
  }



});







