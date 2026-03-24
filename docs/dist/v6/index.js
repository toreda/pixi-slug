!function(root,factory){"object"==typeof exports&&"object"==typeof module?module.exports=factory(require("@pixi/core"),require("@pixi/display"),require("@pixi/mesh")):"function"==typeof define&&define.amd?define([,,],factory):"object"==typeof exports?exports.pixiSlug=factory(require("@pixi/core"),require("@pixi/display"),require("@pixi/mesh")):root.pixiSlug=factory(root.PIXI,root.PIXI,root.PIXI)}(this,(__WEBPACK_EXTERNAL_MODULE__3780__,__WEBPACK_EXTERNAL_MODULE__6492__,__WEBPACK_EXTERNAL_MODULE__9564__)=>/******/(()=>{// webpackBootstrap
/******/var __webpack_modules__={
/***/9452(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.archAliases=void 0,
/**
 * Common architecture aliases mappe dto full arch IDs.
 *
 * @category System Info
 */
exports.archAliases={
/** BSD & Some linux distributions refer to arm64 as aarch64. */
aarch64:"arm64",
/** Specifically the instruction set for arm64, but sometimes used coloqualiiy */
a64:"arm64",
/** Some Windows versions and Linux distributions identify both AMD64 and Intel 64 as 'amd64'. */
/** Hyphen vs underscore in x86_64 varies by implementation. Strong Types
     * supports x86_64 as the arch type, but includes this alias to support
     * mapping it on systems which use the hyphen. */
"x86-64":"x86_64",
/** Technically valid architecture identifier on its own, but commonly used to shorthand x86_64.*/
x64:"x86_64"}},
/***/4488(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.archSet=void 0,
/**
 * All supported target architecture keys. This is not an
 * exhaustive list, only those currently supported.
 *
 * @category System Info
 */
exports.archSet=new Set(["arc","arm","arm64","itanium","mips","powerpc","sparc","x86_64","x86"])},
/***/5106(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.archValid=void 0;const set_1=__webpack_require__(4488);
/**
 * Check whether provided key identifies a supported architecture.
 * @param value
 * @returns
 *
 * @category System Info
 */exports.archValid=function(key){return!!key&&set_1.archSet.has(key)}},
/***/1411(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.arrayMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938);exports.arrayMake=
/**
 *
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Collections
 */
function(fallback,initial){const rules=new rules_1.Rules;rules.add().must.match.type.array();const value=void 0!==initial?initial:[];return(0,type_1.createType)(fallback,value,rules,"Array")}},
/***/7962(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.arrayNullValue=void 0,exports.arrayNullValue=
/**
 * Check if `value` is an array and return it when true. Otherwise returns
 * `fallback`. Guarantees return type without additional checks.
 *
 * @param value			`value` to validate as an Array.
 * @param fallback		Returned when `value` not an Array.
 * @returns				`value` if it's an Array, otherwise `fallback`.
 *
 * @category Collections
 */
function(value,fallback){return Array.isArray(value)?value:fallback}},
/***/5084(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.arrayValue=void 0,exports.arrayValue=
/**
 * Check whether provided `value` is an Array and return it if so,
 * otherwise return provided `fallback`.
 * @param value			`value` to validate as an Array.
 * @param fallback		Returned when `value` is not an Array.
 * @returns				`value` if it's an Array, otherwise `fallback`.
 *
 * @category Collections
 */
function(value,fallback){return Array.isArray(value)?value:fallback}},
/***/5143(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.awsArnMake=void 0;const make_1=__webpack_require__(275);
/**
 * Make an Amazon Resource Name ID.
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Unique Identifiers
 */exports.awsArnMake=function(fallback,value){
// Length constants specified at: https://docs.aws.amazon.com/IAM/latest/APIReference/API_Policy.html
return(0,make_1.idMake)(fallback,value,{minLength:20,maxLength:2048,contains:["arn::"],typeId:"AwsArn"})}},
/***/4546(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.bigMake=void 0;const big_js_1=__importDefault(__webpack_require__(9900)),match_1=__webpack_require__(2369);exports.bigMake=
/**
 * Wraps Big object creation with try/catch and returns null when
 * Big constructor throws. Performs no validation on value.
 * @param value
 *
 * @category Maths
 */
function(value){if(null==value)return null;if((0,match_1.typeMatch)(value,big_js_1.default))return value;let result=null;try{result=(0,big_js_1.default)(value)}catch(e){console.error(`Bad bigMake: ${e}.`),result=null}return result}},
/***/4356(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.boolMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.boolMake=
/**
 * Factory function to create a StrongType Bool object.
 * @param fallback
 * @param value
 * @returns
 *
 * @category Bool
 */
function(fallback,value){const rules=new rules_1.Rules;return rules.add().must.match.type.boolean(),(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"Bool")}},
/***/669(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.booleanNullValue=void 0;const value_1=__webpack_require__(9501);
/**
 * Check if `value` is a valid boolean and return it if so, otherwise
 * returns `fallback`.
 * @param value
 * @param fallback
 * @returns
 *
 * @category Bool
 */exports.booleanNullValue=function(value,fallback){return(0,value_1.typeValue)("boolean",value,fallback)}},
/***/1825(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.booleanValue=void 0;const value_1=__webpack_require__(9501);
/**
 * Return `value` if it's a valid boolean, otherwise returns `fallback`.
 *
 * @param value
 * @param fallback
 * @returns
 *
 * @category Bool
 */exports.booleanValue=function(value,fallback){return(0,value_1.typeValue)("boolean",value,fallback)}},
/***/4125(__unused_webpack_module,exports,__webpack_require__){"use strict";var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.canConvertFromBig=void 0;
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */
const big_js_1=__importDefault(__webpack_require__(9900)),match_1=__webpack_require__(2369),BIG_MAX_SAFE_INT=(0,big_js_1.default)(Number.MAX_SAFE_INTEGER),BIG_MIN_SAFE_INT=(0,big_js_1.default)(Number.MIN_SAFE_INTEGER);exports.canConvertFromBig=
/**
 * Convert from common numeric types to the `Big` data type.
 * @param value
 * @returns
 *
 * @category Strong Helpers
 */
function(value){return null!=value&&(!!(0,match_1.typeMatch)(value,big_js_1.default)&&(!value.gt(BIG_MAX_SAFE_INT)&&!value.lt(BIG_MIN_SAFE_INT)))}},
/***/5938(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.createType=void 0;const data_1=__webpack_require__(2503);
/**
 * Create a StrongType.
 * @param fallbackArg
 * @param initial
 * @param rules
 * @returns
 *
 * @category Core
 */exports.createType=function(fallbackDefault,initial,rules,typeId){const instance=new data_1.StrongData(fallbackDefault,initial,rules,typeId);return Object.assign(value=>(void 0!==value&&instance.set(value),instance.get(instance.fallbackDefault)),{
/**
         * Get current value and return provided fallback if
         * @param fallback
         * @returns
         */
get:fallback=>instance.get(fallback),
/**
         * Get current value, or null if there isn't one.
         * @returns		Current value when set, otherwise null.
         */
getNull:()=>instance.getNull(),
/**
         * Reset instance properties to their starting values.
         */
reset:()=>{instance.reset(),void 0!==initial&&instance.set(initial)},
/**
         * Read-only check to determine if provided value passes
         * rule validation for this instance.
         * @param value
         * @returns
         */
check:target=>instance.check(target),typeId,baseType:"StrongType",_data:instance})}},
/***/9446(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.CSSFont=void 0;const defaults_1=__webpack_require__(7141),rules_1=__webpack_require__(3756),map_1=__webpack_require__(5753),make_1=__webpack_require__(1293),make_2=__webpack_require__(9853);
/**
 * @category CSS
 */
class CSSFont extends map_1.StrongMap{constructor(){super();(new rules_1.Rules).add().must.match.pattern.hexColor(),this.color=(0,make_1.hexColorCodeMake)(defaults_1.Defaults.CSS.Font.Color),this.family=(0,make_2.strongMake)(defaults_1.Defaults.CSS.Font.Family),this.lineHeight=(0,make_2.strongMake)(defaults_1.Defaults.CSS.Font.LineHeight),this.size=(0,make_2.strongMake)(defaults_1.Defaults.CSS.Font.Size),this.stretch=(0,make_2.strongMake)(defaults_1.Defaults.CSS.Font.Stretch),this.variant=(0,make_2.strongMake)(defaults_1.Defaults.CSS.Font.Variant),this.weight=(0,make_2.strongMake)(defaults_1.Defaults.CSS.Font.Weight)}reset(){this.color.reset(),this.family.reset(),this.lineHeight.reset(),this.size.reset(),this.stretch.reset(),this.variant.reset(),this.weight.reset()}}exports.CSSFont=CSSFont},
/***/6980(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.CSSText=void 0;const map_1=__webpack_require__(5753),make_1=__webpack_require__(4837);
/**
 * @category CSS
 */
class CSSText extends map_1.StrongMap{constructor(){super(),this.decoration=(0,make_1.textMake)("none"),this.shadow=(0,make_1.textMake)("0")}reset(){this.decoration.reset(),this.shadow.reset()}}exports.CSSText=CSSText},
/***/3366(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.dblMake=void 0;const big_js_1=__importDefault(__webpack_require__(9900)),rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),big_1=__webpack_require__(518),float_1=__webpack_require__(6255),BIG_ZERO=(0,big_js_1.default)(0),BIG_ONE=(0,big_js_1.default)(1);exports.dblMake=
/**
 * Make instance of arbitrary precision decimal type.
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Maths
 */
function(fallback,initial){const rules=new rules_1.Rules;rules.add().must.match.type.big();const bigFallback=(0,big_1.toDblBig)(fallback),bigInitial=(0,big_1.toDblBig)(initial),strong=(0,type_1.createType)(null!=bigFallback?bigFallback:BIG_ZERO,bigInitial,rules,"Dbl");return Object.assign(strong,{increment:()=>{const value=strong._data.getNull();if(null===value)return null;const result=value.add(BIG_ONE);return strong._data.set(result)?result:null},decrement:()=>{const value=strong._data.getNull();if(null===value)return null;const result=value.minus((0,big_js_1.default)(1));return strong._data.set(result)?result:null},mul:input=>{const curr=strong.get(BIG_ZERO),value=(0,big_1.toDblBig)(input);if(null===value)return null;const result=curr.mul(value);return strong._data.set(result)?result:null},pow:exponent=>{const curr=strong._data.getNull(),value=(0,float_1.toFloat)(exponent);if(null===curr||null===value)return null;const result=curr.pow(value);return strong._data.set(result)?result:null},div:input=>{const curr=strong.get(BIG_ZERO),value=(0,big_1.toDblBig)(input);if(null===curr||null===value)return null;if(value===BIG_ZERO||curr===BIG_ZERO)return null;const result=curr.div(value);return strong._data.set(result)?result:null},add:input=>{const value=(0,big_1.toDblBig)(input),curr=strong.getNull();if(null===value)return null;if(null===curr)return null;const result=curr.add(value);return strong._data.set(result)?result:null},sub:input=>{const value=(0,big_1.toDblBig)(input),curr=strong.getNull();if(null===value||null===curr)return null;const result=curr.minus(value);return strong._data.set(result)?result:null}})}},
/***/7141(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Defaults=void 0;
/**
 * Default values used across the library.
 *
 * @category Core
 */
class Defaults{}exports.Defaults=Defaults,Defaults.Vec={X:0,Y:0,Z:0,W:0},Defaults.CSS={Font:{Color:"#FFFFFF",Size:"12px",Family:"sans-serif",Weight:"normal",Stretch:"normal",Variant:"normal",LineHeight:"normal"}}},
/***/5748(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2010 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.emailMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.emailMake=
/**
 * Create Strong Email object with fallback and optional initial value.
 * @param fallback	Value returned when none is set.
 * @param initial	Starting value.
 * @returns			New strong Email object.
 *
 * @category Email
 */
function(fallback,value){const rules=new rules_1.Rules;return rules.add().must.match.type.string(),rules.add().must.be.email(),(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"Email")}},
/***/5582(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.floatMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.floatMake=
/**
 *
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Maths
 */
function(fallback,value){const rules=new rules_1.Rules;rules.add().must.match.type.float();const strong=(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"Float");return Object.assign(strong,{increment:()=>strong._data.add(1),decrement:()=>{const curr=strong._data.getNull();return null===curr||0===curr?null:strong._data.add(-1)},mul:amt=>strong._data.mul(amt),pow:exponent=>strong._data.pow(exponent),div:amt=>strong._data.div(amt),add:amt=>strong._data.add(amt),sub:amt=>strong._data.add(-1*amt)})}},
/***/5678(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasCharMake=exports.hasChar=void 0;const node_1=__webpack_require__(8248),text_1=__webpack_require__(3841);
/**
 *
 * @param text
 * @param char
 * @returns
 *
 * @category Validators
 */
function hasChar(text,char){return"string"==typeof text&&"string"==typeof char&&(0!==text.length&&0!==char.length&&(1===char.length&&(0,text_1.hasText)(text,char)))}exports.hasChar=hasChar,exports.hasCharMake=
/**
 *
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("HAS_CHAR",1/* CMP */,curr=>hasChar(curr,target),mods);return rule.add(node),caller}}},
/***/3387(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasCharTimesMake=exports.hasCharTimes=void 0;const node_1=__webpack_require__(8248);
/**
 *
 * @param text
 * @param char
 * @param count
 * @returns
 *
 * @category Validators
 */function hasCharTimes(text,targetChar,count){if("string"!=typeof text||"string"!=typeof targetChar)return!1;if(!text.length||!targetChar.length)return!1;if(1!==targetChar.length)return!1;if(count<0)return!1;let findCount=0;
// O(n) search for matching characters. Doesn't work for greater
for(const char of text)char===targetChar&&findCount++;return findCount>=count}exports.hasCharTimes=hasCharTimes,exports.hasCharTimesMake=
/**
 *
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return(char,count)=>{const node=new node_1.RuleNode("HAS_CHAR_TIMES",1/* CMP */,curr=>hasCharTimes(curr,char,count),mods);return rule.add(node),caller}}},
/***/2477(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasLengthEqualMake=exports.hasLengthEqual=void 0;const node_1=__webpack_require__(8248);
/**
 *
 * @param value
 * @param target
 * @returns
 *
 * @category Validators
 */function hasLengthEqual(value,target){if(null==value)return!1;if("number"!=typeof target)return!1;if("string"==typeof value)return value.length===target;if(Array.isArray(value))return value.length===target;const obj=value;return"number"==typeof obj.length&&obj.length===target}exports.hasLengthEqual=hasLengthEqual,exports.hasLengthEqualMake=
/**
 *
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("HAS_LENGTH_EQ",1/* CMP */,curr=>hasLengthEqual(curr,target),mods);return rule.add(node),caller}}},
/***/5078(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasLengthGTMake=exports.hasLengthGreaterThan=void 0;const node_1=__webpack_require__(8248),gt_1=__webpack_require__(6041);
/**
 *
 * @param curr
 * @param target
 * @returns
 *
 * @category Validators
 */
function hasLengthGreaterThan(curr,target){return"number"==typeof curr.length&&(!(curr.length<0)&&(0,gt_1.isGT)(curr.length,target))}exports.hasLengthGreaterThan=hasLengthGreaterThan,exports.hasLengthGTMake=
/**
 * Create hasLengthGT validator function.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("HAS_LENGTH_GT",1/* CMP */,curr=>hasLengthGreaterThan(curr,target),mods);return rule.add(node),caller}}},
/***/2751(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasLengthGTEMake=exports.hasLengthGTE=void 0;const node_1=__webpack_require__(8248),gte_1=__webpack_require__(3994);
/**
 *
 * @param curr
 * @param target
 * @returns
 *
 * @category Validators
 */
function hasLengthGTE(value,target){return"number"==typeof value.length&&(!(value.length<0)&&(0,gte_1.isGTE)(value.length,target))}exports.hasLengthGTE=hasLengthGTE,exports.hasLengthGTEMake=
/**
 *
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("HAS_LENGTH_GRT_OR_EQL",1/* CMP */,curr=>hasLengthGTE(curr,target),mods);return rule.add(node),caller}}},
/***/5193(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 *
 * CSS Property descriptions from w3 schools:
 * https://www.w3schools.com/cssref/pr_pos_clip.asp
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasLengthLTMake=exports.hasLengthLT=void 0;const node_1=__webpack_require__(8248),lt_1=__webpack_require__(3622);
/**
 *
 * @param curr
 * @param target
 * @returns
 *
 * @category Validators
 */
function hasLengthLT(curr,target){return"number"==typeof curr.length&&(!(curr.length<0)&&(0,lt_1.isLT)(curr.length,target))}exports.hasLengthLT=hasLengthLT,exports.hasLengthLTMake=
/**
 *
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("HAS_LENGTH_LT",1/* CMP */,curr=>hasLengthLT(curr,target),mods);return rule.add(node),caller}}},
/***/8042(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 *
 * CSS Property descriptions from w3 schools:
 * https://www.w3schools.com/cssref/pr_pos_clip.asp
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasLengthLTEMake=exports.hasLengthLTE=void 0;const node_1=__webpack_require__(8248),lte_1=__webpack_require__(5727);
/**
 *
 * @param curr
 * @param target
 * @returns
 *
 * @category Validators
 */
function hasLengthLTE(value,target){return"number"==typeof value.length&&(!(value.length<0)&&(0,lte_1.isLTE)(value.length,target))}exports.hasLengthLTE=hasLengthLTE,exports.hasLengthLTEMake=
/**
 *
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("HAS_LENGTH_LTE",1/* CMP */,curr=>hasLengthLTE(curr,target),mods);return rule.add(node),caller}}},
/***/5105(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasPropertyWithTypeMake=exports.hasPropertyWithType=void 0;const node_1=__webpack_require__(8248);
/**
 *
 * @param o
 * @param propName
 * @param typeName
 * @returns
 *
 * @category Validators
 */function hasPropertyWithType(o,propName,typeName){if("string"!=typeof propName||"string"!==typeName)return!1;if(null==o)return!1;if(!propName.trim()||!typeName.trim())return!1;const obj=o;return!("function"!=typeof obj.hasOwnProperty||!obj.hasOwnProperty(propName))&&typeof obj[propName]===typeName}exports.hasPropertyWithType=hasPropertyWithType,exports.hasPropertyWithTypeMake=
/**
 *
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return(propName,typeName)=>{const node=new node_1.RuleNode("HAS_PROP_W_TYPE",1/* CMP */,obj=>hasPropertyWithType(obj,propName,typeName),mods);return rule.add(node),caller}}},
/***/7199(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasPropertyMake=exports.hasProperty=void 0;const node_1=__webpack_require__(8248);
/**
 *
 * @param o
 * @param propName
 * @returns
 *
 * @category Validators
 */function hasProperty(o,propName){if(null==o)return!1;return void 0!==o[propName]}exports.hasProperty=hasProperty,exports.hasPropertyMake=
/**
 *
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return propName=>{const node=new node_1.RuleNode("HAS_PROPERTY",1/* CMP */,obj=>hasProperty(obj,propName),mods);return rule.add(node),caller}}},
/***/3841(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasTextMake=exports.hasText=void 0;const node_1=__webpack_require__(8248);
/**
 *
 * @param data
 * @param target
 * @returns
 *
 * @category Validators
 */function hasText(value,target){let mustMatch;if("string"!=typeof value||""===value)return!1;if(mustMatch=Array.isArray(target)?target:"string"==typeof target?[target]:[],0===mustMatch.length)return!1;let matches=0;for(const match of mustMatch)-1!==value.indexOf(match)&&matches++;
// All substrings in target must be present.
return matches===mustMatch.length}exports.hasText=hasText,exports.hasTextMake=
/**
 *
 * @param caller
 * @param data
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("HAS_TEXT",1/* CMP */,value=>hasText(value,target),mods);return rule.add(node),caller}}},
/***/7768(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hasTextTimesMake=exports.hasTextTimes=void 0;const node_1=__webpack_require__(8248);
/**
 *
 * @param curr
 * @param target
 * @param count
 * @returns
 *
 * @category Validators
 */exports.hasTextTimes=(curr,target,count)=>"string"==typeof curr&&"string"==typeof target&&curr.includes(target),exports.hasTextTimesMake=
/**
 *
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return(target,count)=>{const node=new node_1.RuleNode("HAS_TEXT_TIMES",1/* CMP */,curr=>(0,exports.hasTextTimes)(curr,target,count),mods);return rule.add(node),caller}}},
/***/1293(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.hexColorCodeMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.hexColorCodeMake=
/**
 * Create new strong hex color code object.
 * @param fallback
 * @param initial
 * @returns
 */
function(fallback,value){const rules=new rules_1.Rules;return rules.add().must.match.type.string(),rules.add().must.be.hexColorCode(),(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"HexColorCode")}},
/***/5159(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpAuthHeaderValid=void 0;const headers_1=__webpack_require__(6341);
/**
 * Check whether provided string identifies a supported HTTP
 * Auth header name.
 * @param key
 * @returns
 *
 * @category HTTP
 */exports.httpAuthHeaderValid=function(key){return"string"==typeof key&&headers_1.httpAuthHeaders.has(key)}},
/***/6341(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpAuthHeaders=void 0,
/**
 * Header set used to identify valid HTTP Auth header keys.
 *
 * @category HTTP
 */
exports.httpAuthHeaders=new Set(["WWW-Authenticate","Authorization","Proxy-Authenticate","Proxy-Authorization"])},
/***/2925(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpCacheHeaderValid=void 0;const headers_1=__webpack_require__(8571);
/**
 * Check whether provided string identifies a supported HTTP
 * Cache header name.
 * @param key
 * @returns
 *
 * @category HTTP
 */exports.httpCacheHeaderValid=function(key){return"string"==typeof key&&headers_1.httpCacheHeaders.has(key)}},
/***/8571(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpCacheHeaders=void 0,
/**
 * Set used to check & validate Http Cache header keys.
 *
 * @category HTTP
 */
exports.httpCacheHeaders=new Set(["Age","Cache-Control","Clear-Site-Data","Expires","Pragma","Warning"])},
/***/2318(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpCorsHeaderValid=void 0;const headers_1=__webpack_require__(5870);
/**
 * Check whether provided string identifies a supported HTTP
 * CORS header name.
 * @param key
 * @returns
 *
 * @category HTTP
 */exports.httpCorsHeaderValid=function(key){return"string"==typeof key&&headers_1.httpCorsHeaders.has(key)}},
/***/5870(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpCorsHeaders=void 0,
/**
 * Set used to check & validate HTTP CORS header keys.
 *
 * @category HTTP
 */
exports.httpCorsHeaders=new Set(["Access-Control-Allow-Origin","Access-Control-Allow-Credentials","Access-Control-Allow-Headers","Access-Control-Allow-Methods","Access-Control-Expose-Headers","Access-Control-Max-Age","Access-Control-Request-Headers","Access-Control-Request-Method","Origin","Timing-Allow-Origin"])},
/***/3675(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpFetchHeaderValid=void 0;const headers_1=__webpack_require__(5057);
/**
 * Check whether provided string identifies a supported HTTP
 * fetch header name.
 * @param key
 * @returns
 *
 * @category HTTP
 */exports.httpFetchHeaderValid=function(key){return"string"==typeof key&&headers_1.httpFetchHeaders.has(key)}},
/***/5057(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpFetchHeaders=void 0,
/**
 * Set used to check & validate HTTP Fetch header keys.
 *
 * @category HTTP
 */
exports.httpFetchHeaders=new Set(["Sec-Fetch-Site","Sec-Fetch-Mode","Sec-Fetch-User","Sec-Fetch-Dest"])},
/***/1130(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpMethodValid=void 0;const methods_1=__webpack_require__(8178);
/**
 * Check whether provided string is a supported HTTP request method.
 * @param method
 * @returns
 *
 * @category HTTP
 */exports.httpMethodValid=function(method){return!!method&&("string"==typeof method&&methods_1.httpMethods.has(method))}},
/***/8178(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpMethods=void 0,
/**
 * Set of supported HTTP request methods.
 *
 * @category HTTP
 */
exports.httpMethods=new Set(["CONNECT","DELETE","GET","HEAD","OPTIONS","PATCH","POST","PUT","TRACE"])},
/***/4531(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpProxyHeaderValid=void 0;const headers_1=__webpack_require__(5465);
/**
 * Check whether provided string identifies a supported HTTP
 * proxy header name.w
 * @param key
 * @returns
 *
 * @category HTTP
 */exports.httpProxyHeaderValid=function(key){return"string"==typeof key&&headers_1.httpProxyHeaders.has(key)}},
/***/5465(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpProxyHeaders=void 0,
/**
 * Set used to check & validate HTTP Proxy header keys.
 *
 * @category HTTP
 */
exports.httpProxyHeaders=new Set(["Forwarded","X-Forwarded-For","X-Forwarded-Host","X-Forwarded-Proto","Via"])},
/***/7644(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpRequestHeaderValid=void 0;const headers_1=__webpack_require__(3692);
/**
 * Check whether provided string identifies a Valid HTTP
 * Request header name.
 * @param key
 * @returns
 *
 * @category HTTP
 */exports.httpRequestHeaderValid=function(key){return"string"==typeof key&&headers_1.httpRequestHeaders.has(key)}},
/***/3692(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpRequestHeaders=void 0,
/**
 * Set used to check & validate common HTTP Request header keys.
 *
 * @category HTTP
 */
exports.httpRequestHeaders=new Set(["Accept-Encoding","Accept-Language","Accept","Cache-Control","Connection","Host","If-Modified-Since","If-None-Match","Referer","Upgrade-Insecure-Requests","User-Agent"])},
/***/1120(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpResponseHeaderValid=void 0;const headers_1=__webpack_require__(3976);
/**
 * Check whether provided string identifies a Valid HTTP
 * Response header name.
 * @param key
 * @returns
 *
 * @category HTTP
 */exports.httpResponseHeaderValid=function(key){return"string"==typeof key&&headers_1.httpResponseHeaders.has(key)}},
/***/3976(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpResponseHeaders=void 0,
/**
 * Set used to check & validate common HTTP Request header keys.
 *
 * @category HTTP
 */
exports.httpResponseHeaders=new Set(["Access-Control-Allow-Origin","Connection","Content-Encoding","Content-Type","Date","ETag","Keep-Alive","Last-Modified","Server","Set-Cookie","Transfer-Encoding","Vary","X-Backend-Server","X-Cache-Info","X-kuma-revision","x-frame-options"])},
/***/4507(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpSecurityHeaderValid=void 0;const headers_1=__webpack_require__(4801);
/**
 * Check whether provided string identifies a valid HTTP
 * Security header name.
 * @param key
 * @returns
 *
 * @category HTTP
 */exports.httpSecurityHeaderValid=function(key){return"string"==typeof key&&headers_1.httpSecurityHeaders.has(key)}},
/***/4801(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpSecurityHeaders=void 0,
/**
 * Set used to check & validate HTTP Security header keys.
 *
 * @category HTTP
 */
exports.httpSecurityHeaders=new Set(["Content-Security-Policy-Report-Only","Content-Security-Policy","Cross-Origin-Embedder-Policy","Cross-Origin-Opener-Policy","Cross-Origin-Resource-Policy","Expect-CT","Feature-Policy","Origin-Isolation","Strict-Transport-Security","Upgrade-Insecure-Requests","X-Content-Type-Options","X-Download-Options","X-Frame-Options","X-Permitted-Cross-Domain-Policies","X-Powered-By","X-XSS-Protection"])},
/***/4453(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpWebsocketHeaderValid=void 0;const headers_1=__webpack_require__(474);
/**
 * Check whether provided string identifies a valid HTTP
 * Websocket header name.
 * @param key
 * @returns
 *
 * @category HTTP
 */exports.httpWebsocketHeaderValid=function(key){return"string"==typeof key&&headers_1.httpWebsocketHeaders.has(key)}},
/***/474(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.httpWebsocketHeaders=void 0,
/**
 * Set used to check & validate HTTP Websocket header keys.
 *
 * @category HTTP
 */
exports.httpWebsocketHeaders=new Set(["Sec-WebSocket-Key","Sec-WebSocket-Extensions","Sec-WebSocket-Accept","Sec-WebSocket-Protocol","Sec-WebSocket-Version"])},
/***/275(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.idMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.idMake=
/**
 * Create a Strong Id type.
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Strings
 */
function(fallback,value,options){const rules=new rules_1.Rules;options&&("number"==typeof options.maxLength&&rules.add().must.have.length.lessThanOrEqualTo(options.maxLength),"number"==typeof options.minLength&&rules.add().must.have.length.greaterThanOrEqualTo(options.minLength),("string"==typeof options.contains||Array.isArray(options.contains))&&rules.add().must.contain.text(options.contains)),rules.add().must.match.type.string();const typeId=options&&"string"==typeof options.typeId?options.typeId:"Id";return(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,typeId)}},
/***/6859(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Range=exports.MapParserState=exports.MapParser=exports.MapJsonifier=exports.StrongMap=exports.httpWebsocketHeaderValid=exports.httpWebsocketHeaders=exports.httpSecurityHeaderValid=exports.httpSecurityHeaders=exports.httpResponseHeaderValid=exports.httpResponseHeaders=exports.httpRequestHeaderValid=exports.httpRequestHeaders=exports.httpProxyHeaderValid=exports.httpProxyHeaders=exports.httpMethodValid=exports.httpMethods=exports.httpFetchHeaderValid=exports.httpFetchHeaders=exports.httpCorsHeaderValid=exports.httpCorsHeaders=exports.httpCacheHeaderValid=exports.httpCacheHeaders=exports.httpAuthHeaderValid=exports.httpAuthHeaders=exports.CSSText=exports.CSSFont=exports.awsArnMake=exports.semVerMake=exports.uIntMake=exports.textMake=exports.safeMoneyMake=exports.intMake=exports.idMake=exports.floatMake=exports.emailMake=exports.dblMake=exports.boolMake=exports.arrayMake=exports.typeMatch=exports.StrongData=exports.createType=exports.strongMake=exports.bigMake=exports.canConvertFromBig=exports.osValid=exports.osSet=exports.archAliases=exports.archValid=exports.archSet=void 0,exports.isBigMake=exports.isBig=exports.isGTEMake=exports.isGT=exports.isGTMake=exports.isEqualMake=exports.isEqual=exports.isEmptyMake=exports.isEmpty=exports.isEmailMake=exports.isEmail=exports.isFloatMake=exports.isFloat=exports.isDblMake=exports.isDbl=exports.isDateTimeMake=exports.isDateTime=exports.isDateMake=exports.isDate=exports.isBooleanMake=exports.isBoolean=exports.isArrayMake=exports.hasTextTimesMake=exports.hasTextTimes=exports.hasTextMake=exports.hasText=exports.hasPropertyWithTypeMake=exports.hasPropertyWithType=exports.hasPropertyMake=exports.hasProperty=exports.hasLengthLTEMake=exports.hasLengthLTE=exports.hasLengthLTMake=exports.hasLengthLT=exports.hasLengthGTMake=exports.hasLengthGreaterThan=exports.hasCharTimesMake=exports.hasCharTimes=exports.hasCharMake=exports.hasChar=exports.hasLengthGTEMake=exports.hasLengthGTE=exports.hasLengthEqualMake=exports.hasLengthEqual=exports.swapPop=exports.Vec4=exports.Vec3=exports.Vec2=exports.Vec1=exports.Size=void 0,exports.RuleOr=exports.RuleNot=exports.RuleNodeType=exports.RuleNode=exports.RuleMust=exports.RuleMatch=exports.RuleLength=exports.RuleHave=exports.RuleContains=exports.RuleBe=exports.RuleA=exports.Rule=exports.systemPortMake=exports.portMake=exports.Pattern=exports.toIntNumber=exports.toIntBig=exports.toDblBig=exports.toFloat=exports.isUIntMake=exports.isUInt=exports.isUrlMake=exports.isUrl=exports.isUndefinedMake=exports.isUndefined=exports.isTimeMake=exports.isTime=exports.isTextMake=exports.isSystemPort=exports.isSystemPortMake=exports.isPortMake=exports.isPort=exports.isNullMake=exports.isNull=exports.isLTEMake=exports.isLTE=exports.isLTMake=exports.isLT=exports.isLengthMake=exports.isLength=exports.isIpv6Addr=exports.isIpv6AddrMake=exports.isIpv4AddrMake=exports.isIpv4Addr=exports.isIntMake=exports.isInt=exports.isHexColorCodeMake=exports.isHexColorCode=exports.isBigIntMake=exports.isBigInt=void 0,exports.urlMake=exports.timeMake=exports.Transforms=exports.TransformNB=exports.Transform=exports.typeValue=exports.stringNullValue=exports.stringValue=exports.numberNullValue=exports.numberValue=exports.booleanNullValue=exports.booleanValue=exports.arrayNullValue=exports.arrayValue=exports.RuleType=exports.Rules=void 0;var set_1=__webpack_require__(4488);Object.defineProperty(exports,"archSet",{enumerable:!0,get:function(){return set_1.archSet}});var valid_1=__webpack_require__(5106);Object.defineProperty(exports,"archValid",{enumerable:!0,get:function(){return valid_1.archValid}});var aliases_1=__webpack_require__(9452);Object.defineProperty(exports,"archAliases",{enumerable:!0,get:function(){return aliases_1.archAliases}});var set_2=__webpack_require__(3758);Object.defineProperty(exports,"osSet",{enumerable:!0,get:function(){return set_2.osSet}});var valid_2=__webpack_require__(8144);Object.defineProperty(exports,"osValid",{enumerable:!0,get:function(){return valid_2.osValid}});var big_1=__webpack_require__(4125);Object.defineProperty(exports,"canConvertFromBig",{enumerable:!0,get:function(){return big_1.canConvertFromBig}});var make_1=__webpack_require__(4546);Object.defineProperty(exports,"bigMake",{enumerable:!0,get:function(){return make_1.bigMake}});var make_2=__webpack_require__(9853);Object.defineProperty(exports,"strongMake",{enumerable:!0,get:function(){return make_2.strongMake}});var type_1=__webpack_require__(5938);Object.defineProperty(exports,"createType",{enumerable:!0,get:function(){return type_1.createType}});var data_1=__webpack_require__(2503);Object.defineProperty(exports,"StrongData",{enumerable:!0,get:function(){return data_1.StrongData}});var match_1=__webpack_require__(2369);Object.defineProperty(exports,"typeMatch",{enumerable:!0,get:function(){return match_1.typeMatch}});
// General Types
var make_3=__webpack_require__(1411);Object.defineProperty(exports,"arrayMake",{enumerable:!0,get:function(){return make_3.arrayMake}});var make_4=__webpack_require__(4356);Object.defineProperty(exports,"boolMake",{enumerable:!0,get:function(){return make_4.boolMake}});var make_5=__webpack_require__(3366);Object.defineProperty(exports,"dblMake",{enumerable:!0,get:function(){return make_5.dblMake}});var make_6=__webpack_require__(5748);Object.defineProperty(exports,"emailMake",{enumerable:!0,get:function(){return make_6.emailMake}});var make_7=__webpack_require__(5582);Object.defineProperty(exports,"floatMake",{enumerable:!0,get:function(){return make_7.floatMake}});var make_8=__webpack_require__(275);Object.defineProperty(exports,"idMake",{enumerable:!0,get:function(){return make_8.idMake}});var make_9=__webpack_require__(1167);Object.defineProperty(exports,"intMake",{enumerable:!0,get:function(){return make_9.intMake}});var make_10=__webpack_require__(6834);Object.defineProperty(exports,"safeMoneyMake",{enumerable:!0,get:function(){return make_10.safeMoneyMake}});var make_11=__webpack_require__(4837);Object.defineProperty(exports,"textMake",{enumerable:!0,get:function(){return make_11.textMake}});var make_12=__webpack_require__(884);Object.defineProperty(exports,"uIntMake",{enumerable:!0,get:function(){return make_12.uIntMake}});var make_13=__webpack_require__(6047);Object.defineProperty(exports,"semVerMake",{enumerable:!0,get:function(){return make_13.semVerMake}});var make_14=__webpack_require__(5143);Object.defineProperty(exports,"awsArnMake",{enumerable:!0,get:function(){return make_14.awsArnMake}});var font_1=__webpack_require__(9446);Object.defineProperty(exports,"CSSFont",{enumerable:!0,get:function(){return font_1.CSSFont}});var text_1=__webpack_require__(6980);Object.defineProperty(exports,"CSSText",{enumerable:!0,get:function(){return text_1.CSSText}});var headers_1=__webpack_require__(6341);Object.defineProperty(exports,"httpAuthHeaders",{enumerable:!0,get:function(){return headers_1.httpAuthHeaders}});var valid_3=__webpack_require__(5159);Object.defineProperty(exports,"httpAuthHeaderValid",{enumerable:!0,get:function(){return valid_3.httpAuthHeaderValid}});var headers_2=__webpack_require__(8571);Object.defineProperty(exports,"httpCacheHeaders",{enumerable:!0,get:function(){return headers_2.httpCacheHeaders}});var valid_4=__webpack_require__(2925);Object.defineProperty(exports,"httpCacheHeaderValid",{enumerable:!0,get:function(){return valid_4.httpCacheHeaderValid}});var headers_3=__webpack_require__(5870);Object.defineProperty(exports,"httpCorsHeaders",{enumerable:!0,get:function(){return headers_3.httpCorsHeaders}});var valid_5=__webpack_require__(2318);Object.defineProperty(exports,"httpCorsHeaderValid",{enumerable:!0,get:function(){return valid_5.httpCorsHeaderValid}});var headers_4=__webpack_require__(5057);Object.defineProperty(exports,"httpFetchHeaders",{enumerable:!0,get:function(){return headers_4.httpFetchHeaders}});var valid_6=__webpack_require__(3675);Object.defineProperty(exports,"httpFetchHeaderValid",{enumerable:!0,get:function(){return valid_6.httpFetchHeaderValid}});var methods_1=__webpack_require__(8178);Object.defineProperty(exports,"httpMethods",{enumerable:!0,get:function(){return methods_1.httpMethods}});var valid_7=__webpack_require__(1130);Object.defineProperty(exports,"httpMethodValid",{enumerable:!0,get:function(){return valid_7.httpMethodValid}});var headers_5=__webpack_require__(5465);Object.defineProperty(exports,"httpProxyHeaders",{enumerable:!0,get:function(){return headers_5.httpProxyHeaders}});var valid_8=__webpack_require__(4531);Object.defineProperty(exports,"httpProxyHeaderValid",{enumerable:!0,get:function(){return valid_8.httpProxyHeaderValid}});var headers_6=__webpack_require__(3692);Object.defineProperty(exports,"httpRequestHeaders",{enumerable:!0,get:function(){return headers_6.httpRequestHeaders}});var valid_9=__webpack_require__(7644);Object.defineProperty(exports,"httpRequestHeaderValid",{enumerable:!0,get:function(){return valid_9.httpRequestHeaderValid}});var headers_7=__webpack_require__(3976);Object.defineProperty(exports,"httpResponseHeaders",{enumerable:!0,get:function(){return headers_7.httpResponseHeaders}});var valid_10=__webpack_require__(1120);Object.defineProperty(exports,"httpResponseHeaderValid",{enumerable:!0,get:function(){return valid_10.httpResponseHeaderValid}});var headers_8=__webpack_require__(4801);Object.defineProperty(exports,"httpSecurityHeaders",{enumerable:!0,get:function(){return headers_8.httpSecurityHeaders}});var valid_11=__webpack_require__(4507);Object.defineProperty(exports,"httpSecurityHeaderValid",{enumerable:!0,get:function(){return valid_11.httpSecurityHeaderValid}});var headers_9=__webpack_require__(474);Object.defineProperty(exports,"httpWebsocketHeaders",{enumerable:!0,get:function(){return headers_9.httpWebsocketHeaders}});var valid_12=__webpack_require__(4453);Object.defineProperty(exports,"httpWebsocketHeaderValid",{enumerable:!0,get:function(){return valid_12.httpWebsocketHeaderValid}});
// Map
var map_1=__webpack_require__(5753);Object.defineProperty(exports,"StrongMap",{enumerable:!0,get:function(){return map_1.StrongMap}});var jsonifier_1=__webpack_require__(4909);Object.defineProperty(exports,"MapJsonifier",{enumerable:!0,get:function(){return jsonifier_1.MapJsonifier}});var parser_1=__webpack_require__(6267);Object.defineProperty(exports,"MapParser",{enumerable:!0,get:function(){return parser_1.MapParser}});var state_1=__webpack_require__(3269);Object.defineProperty(exports,"MapParserState",{enumerable:!0,get:function(){return state_1.MapParserState}});var range_1=__webpack_require__(8862);Object.defineProperty(exports,"Range",{enumerable:!0,get:function(){return range_1.Range}});var size_1=__webpack_require__(8954);Object.defineProperty(exports,"Size",{enumerable:!0,get:function(){return size_1.Size}});var vec1_1=__webpack_require__(2858);Object.defineProperty(exports,"Vec1",{enumerable:!0,get:function(){return vec1_1.Vec1}});var vec2_1=__webpack_require__(4311);Object.defineProperty(exports,"Vec2",{enumerable:!0,get:function(){return vec2_1.Vec2}});var vec3_1=__webpack_require__(4592);Object.defineProperty(exports,"Vec3",{enumerable:!0,get:function(){return vec3_1.Vec3}});var vec4_1=__webpack_require__(8389);Object.defineProperty(exports,"Vec4",{enumerable:!0,get:function(){return vec4_1.Vec4}});var pop_1=__webpack_require__(9168);Object.defineProperty(exports,"swapPop",{enumerable:!0,get:function(){return pop_1.swapPop}});
// Validator functions for is & has
var equal_1=__webpack_require__(2477);Object.defineProperty(exports,"hasLengthEqual",{enumerable:!0,get:function(){return equal_1.hasLengthEqual}}),Object.defineProperty(exports,"hasLengthEqualMake",{enumerable:!0,get:function(){return equal_1.hasLengthEqualMake}});var gte_1=__webpack_require__(2751);Object.defineProperty(exports,"hasLengthGTE",{enumerable:!0,get:function(){return gte_1.hasLengthGTE}}),Object.defineProperty(exports,"hasLengthGTEMake",{enumerable:!0,get:function(){return gte_1.hasLengthGTEMake}});var char_1=__webpack_require__(5678);Object.defineProperty(exports,"hasChar",{enumerable:!0,get:function(){return char_1.hasChar}}),Object.defineProperty(exports,"hasCharMake",{enumerable:!0,get:function(){return char_1.hasCharMake}});var times_1=__webpack_require__(3387);Object.defineProperty(exports,"hasCharTimes",{enumerable:!0,get:function(){return times_1.hasCharTimes}}),Object.defineProperty(exports,"hasCharTimesMake",{enumerable:!0,get:function(){return times_1.hasCharTimesMake}});var gt_1=__webpack_require__(5078);Object.defineProperty(exports,"hasLengthGreaterThan",{enumerable:!0,get:function(){return gt_1.hasLengthGreaterThan}}),Object.defineProperty(exports,"hasLengthGTMake",{enumerable:!0,get:function(){return gt_1.hasLengthGTMake}});var lt_1=__webpack_require__(5193);Object.defineProperty(exports,"hasLengthLT",{enumerable:!0,get:function(){return lt_1.hasLengthLT}}),Object.defineProperty(exports,"hasLengthLTMake",{enumerable:!0,get:function(){return lt_1.hasLengthLTMake}});var lte_1=__webpack_require__(8042);Object.defineProperty(exports,"hasLengthLTE",{enumerable:!0,get:function(){return lte_1.hasLengthLTE}}),Object.defineProperty(exports,"hasLengthLTEMake",{enumerable:!0,get:function(){return lte_1.hasLengthLTEMake}});var property_1=__webpack_require__(7199);Object.defineProperty(exports,"hasProperty",{enumerable:!0,get:function(){return property_1.hasProperty}}),Object.defineProperty(exports,"hasPropertyMake",{enumerable:!0,get:function(){return property_1.hasPropertyMake}});var property_with_type_1=__webpack_require__(5105);Object.defineProperty(exports,"hasPropertyWithType",{enumerable:!0,get:function(){return property_with_type_1.hasPropertyWithType}}),Object.defineProperty(exports,"hasPropertyWithTypeMake",{enumerable:!0,get:function(){return property_with_type_1.hasPropertyWithTypeMake}});var text_2=__webpack_require__(3841);Object.defineProperty(exports,"hasText",{enumerable:!0,get:function(){return text_2.hasText}}),Object.defineProperty(exports,"hasTextMake",{enumerable:!0,get:function(){return text_2.hasTextMake}});var times_2=__webpack_require__(7768);Object.defineProperty(exports,"hasTextTimes",{enumerable:!0,get:function(){return times_2.hasTextTimes}}),Object.defineProperty(exports,"hasTextTimesMake",{enumerable:!0,get:function(){return times_2.hasTextTimesMake}});var array_1=__webpack_require__(1841);Object.defineProperty(exports,"isArrayMake",{enumerable:!0,get:function(){return array_1.isArrayMake}});var boolean_1=__webpack_require__(964);Object.defineProperty(exports,"isBoolean",{enumerable:!0,get:function(){return boolean_1.isBoolean}}),Object.defineProperty(exports,"isBooleanMake",{enumerable:!0,get:function(){return boolean_1.isBooleanMake}});var date_1=__webpack_require__(3298);Object.defineProperty(exports,"isDate",{enumerable:!0,get:function(){return date_1.isDate}}),Object.defineProperty(exports,"isDateMake",{enumerable:!0,get:function(){return date_1.isDateMake}});var time_1=__webpack_require__(4288);Object.defineProperty(exports,"isDateTime",{enumerable:!0,get:function(){return time_1.isDateTime}}),Object.defineProperty(exports,"isDateTimeMake",{enumerable:!0,get:function(){return time_1.isDateTimeMake}});var dbl_1=__webpack_require__(7646);Object.defineProperty(exports,"isDbl",{enumerable:!0,get:function(){return dbl_1.isDbl}}),Object.defineProperty(exports,"isDblMake",{enumerable:!0,get:function(){return dbl_1.isDblMake}});var float_1=__webpack_require__(5190);Object.defineProperty(exports,"isFloat",{enumerable:!0,get:function(){return float_1.isFloat}}),Object.defineProperty(exports,"isFloatMake",{enumerable:!0,get:function(){return float_1.isFloatMake}});var email_1=__webpack_require__(5308);Object.defineProperty(exports,"isEmail",{enumerable:!0,get:function(){return email_1.isEmail}}),Object.defineProperty(exports,"isEmailMake",{enumerable:!0,get:function(){return email_1.isEmailMake}});var empty_1=__webpack_require__(4897);Object.defineProperty(exports,"isEmpty",{enumerable:!0,get:function(){return empty_1.isEmpty}}),Object.defineProperty(exports,"isEmptyMake",{enumerable:!0,get:function(){return empty_1.isEmptyMake}});var equal_2=__webpack_require__(7364);Object.defineProperty(exports,"isEqual",{enumerable:!0,get:function(){return equal_2.isEqual}}),Object.defineProperty(exports,"isEqualMake",{enumerable:!0,get:function(){return equal_2.isEqualMake}});var gt_2=__webpack_require__(6041);Object.defineProperty(exports,"isGTMake",{enumerable:!0,get:function(){return gt_2.isGTMake}}),Object.defineProperty(exports,"isGT",{enumerable:!0,get:function(){return gt_2.isGT}});var gte_2=__webpack_require__(3994);Object.defineProperty(exports,"isGTEMake",{enumerable:!0,get:function(){return gte_2.isGTEMake}});var big_2=__webpack_require__(8442);Object.defineProperty(exports,"isBig",{enumerable:!0,get:function(){return big_2.isBig}}),Object.defineProperty(exports,"isBigMake",{enumerable:!0,get:function(){return big_2.isBigMake}});var big_int_1=__webpack_require__(5046);Object.defineProperty(exports,"isBigInt",{enumerable:!0,get:function(){return big_int_1.isBigInt}}),Object.defineProperty(exports,"isBigIntMake",{enumerable:!0,get:function(){return big_int_1.isBigIntMake}});var hex_color_code_1=__webpack_require__(6489);Object.defineProperty(exports,"isHexColorCode",{enumerable:!0,get:function(){return hex_color_code_1.isHexColorCode}}),Object.defineProperty(exports,"isHexColorCodeMake",{enumerable:!0,get:function(){return hex_color_code_1.isHexColorCodeMake}});var int_1=__webpack_require__(9001);Object.defineProperty(exports,"isInt",{enumerable:!0,get:function(){return int_1.isInt}}),Object.defineProperty(exports,"isIntMake",{enumerable:!0,get:function(){return int_1.isIntMake}});var addr_1=__webpack_require__(5979);Object.defineProperty(exports,"isIpv4Addr",{enumerable:!0,get:function(){return addr_1.isIpv4Addr}});var make_15=__webpack_require__(7232);Object.defineProperty(exports,"isIpv4AddrMake",{enumerable:!0,get:function(){return make_15.isIpv4AddrMake}});var make_16=__webpack_require__(2046);Object.defineProperty(exports,"isIpv6AddrMake",{enumerable:!0,get:function(){return make_16.isIpv6AddrMake}});var addr_2=__webpack_require__(6957);Object.defineProperty(exports,"isIpv6Addr",{enumerable:!0,get:function(){return addr_2.isIpv6Addr}});var length_1=__webpack_require__(5526);Object.defineProperty(exports,"isLength",{enumerable:!0,get:function(){return length_1.isLength}}),Object.defineProperty(exports,"isLengthMake",{enumerable:!0,get:function(){return length_1.isLengthMake}});var lt_2=__webpack_require__(3622);Object.defineProperty(exports,"isLT",{enumerable:!0,get:function(){return lt_2.isLT}}),Object.defineProperty(exports,"isLTMake",{enumerable:!0,get:function(){return lt_2.isLTMake}});var lte_2=__webpack_require__(5727);Object.defineProperty(exports,"isLTE",{enumerable:!0,get:function(){return lte_2.isLTE}}),Object.defineProperty(exports,"isLTEMake",{enumerable:!0,get:function(){return lte_2.isLTEMake}});var null_1=__webpack_require__(6483);Object.defineProperty(exports,"isNull",{enumerable:!0,get:function(){return null_1.isNull}}),Object.defineProperty(exports,"isNullMake",{enumerable:!0,get:function(){return null_1.isNullMake}});var port_1=__webpack_require__(105);Object.defineProperty(exports,"isPort",{enumerable:!0,get:function(){return port_1.isPort}}),Object.defineProperty(exports,"isPortMake",{enumerable:!0,get:function(){return port_1.isPortMake}});var port_2=__webpack_require__(7213);Object.defineProperty(exports,"isSystemPortMake",{enumerable:!0,get:function(){return port_2.isSystemPortMake}}),Object.defineProperty(exports,"isSystemPort",{enumerable:!0,get:function(){return port_2.isSystemPort}});var text_3=__webpack_require__(6105);Object.defineProperty(exports,"isTextMake",{enumerable:!0,get:function(){return text_3.isTextMake}});var time_2=__webpack_require__(731);Object.defineProperty(exports,"isTime",{enumerable:!0,get:function(){return time_2.isTime}}),Object.defineProperty(exports,"isTimeMake",{enumerable:!0,get:function(){return time_2.isTimeMake}});var undefined_1=__webpack_require__(5576);Object.defineProperty(exports,"isUndefined",{enumerable:!0,get:function(){return undefined_1.isUndefined}}),Object.defineProperty(exports,"isUndefinedMake",{enumerable:!0,get:function(){return undefined_1.isUndefinedMake}});var url_1=__webpack_require__(1113);Object.defineProperty(exports,"isUrl",{enumerable:!0,get:function(){return url_1.isUrl}}),Object.defineProperty(exports,"isUrlMake",{enumerable:!0,get:function(){return url_1.isUrlMake}});var uint_1=__webpack_require__(1562);Object.defineProperty(exports,"isUInt",{enumerable:!0,get:function(){return uint_1.isUInt}}),Object.defineProperty(exports,"isUIntMake",{enumerable:!0,get:function(){return uint_1.isUIntMake}});var float_2=__webpack_require__(6255);Object.defineProperty(exports,"toFloat",{enumerable:!0,get:function(){return float_2.toFloat}});var big_3=__webpack_require__(518);Object.defineProperty(exports,"toDblBig",{enumerable:!0,get:function(){return big_3.toDblBig}});var big_4=__webpack_require__(8301);Object.defineProperty(exports,"toIntBig",{enumerable:!0,get:function(){return big_4.toIntBig}});var number_1=__webpack_require__(4046);Object.defineProperty(exports,"toIntNumber",{enumerable:!0,get:function(){return number_1.toIntNumber}});
// Patterns
var pattern_1=__webpack_require__(8317);Object.defineProperty(exports,"Pattern",{enumerable:!0,get:function(){return pattern_1.Pattern}});var make_17=__webpack_require__(6377);Object.defineProperty(exports,"portMake",{enumerable:!0,get:function(){return make_17.portMake}});var make_18=__webpack_require__(2283);Object.defineProperty(exports,"systemPortMake",{enumerable:!0,get:function(){return make_18.systemPortMake}});
// Rules
var rule_1=__webpack_require__(521);Object.defineProperty(exports,"Rule",{enumerable:!0,get:function(){return rule_1.Rule}});var a_1=__webpack_require__(2137);Object.defineProperty(exports,"RuleA",{enumerable:!0,get:function(){return a_1.RuleA}});var be_1=__webpack_require__(6749);Object.defineProperty(exports,"RuleBe",{enumerable:!0,get:function(){return be_1.RuleBe}});var contains_1=__webpack_require__(7725);Object.defineProperty(exports,"RuleContains",{enumerable:!0,get:function(){return contains_1.RuleContains}});var have_1=__webpack_require__(2678);Object.defineProperty(exports,"RuleHave",{enumerable:!0,get:function(){return have_1.RuleHave}});var length_2=__webpack_require__(7576);Object.defineProperty(exports,"RuleLength",{enumerable:!0,get:function(){return length_2.RuleLength}});var match_2=__webpack_require__(515);Object.defineProperty(exports,"RuleMatch",{enumerable:!0,get:function(){return match_2.RuleMatch}});var must_1=__webpack_require__(7029);Object.defineProperty(exports,"RuleMust",{enumerable:!0,get:function(){return must_1.RuleMust}});var node_1=__webpack_require__(8248);Object.defineProperty(exports,"RuleNode",{enumerable:!0,get:function(){return node_1.RuleNode}});var type_2=__webpack_require__(8211);Object.defineProperty(exports,"RuleNodeType",{enumerable:!0,get:function(){return type_2.RuleNodeType}});var not_1=__webpack_require__(7419);Object.defineProperty(exports,"RuleNot",{enumerable:!0,get:function(){return not_1.RuleNot}});var or_1=__webpack_require__(29);Object.defineProperty(exports,"RuleOr",{enumerable:!0,get:function(){return or_1.RuleOr}});var rules_1=__webpack_require__(3756);Object.defineProperty(exports,"Rules",{enumerable:!0,get:function(){return rules_1.Rules}});var type_3=__webpack_require__(2528);Object.defineProperty(exports,"RuleType",{enumerable:!0,get:function(){return type_3.RuleType}});var value_1=__webpack_require__(5084);Object.defineProperty(exports,"arrayValue",{enumerable:!0,get:function(){return value_1.arrayValue}});var value_2=__webpack_require__(7962);Object.defineProperty(exports,"arrayNullValue",{enumerable:!0,get:function(){return value_2.arrayNullValue}});var value_3=__webpack_require__(1825);Object.defineProperty(exports,"booleanValue",{enumerable:!0,get:function(){return value_3.booleanValue}});var value_4=__webpack_require__(669);Object.defineProperty(exports,"booleanNullValue",{enumerable:!0,get:function(){return value_4.booleanNullValue}});var value_5=__webpack_require__(8376);Object.defineProperty(exports,"numberValue",{enumerable:!0,get:function(){return value_5.numberValue}});var value_6=__webpack_require__(8934);Object.defineProperty(exports,"numberNullValue",{enumerable:!0,get:function(){return value_6.numberNullValue}});var value_7=__webpack_require__(6984);Object.defineProperty(exports,"stringValue",{enumerable:!0,get:function(){return value_7.stringValue}});var value_8=__webpack_require__(9254);Object.defineProperty(exports,"stringNullValue",{enumerable:!0,get:function(){return value_8.stringNullValue}});var value_9=__webpack_require__(9501);Object.defineProperty(exports,"typeValue",{enumerable:!0,get:function(){return value_9.typeValue}});
// Transforms
var transform_1=__webpack_require__(667);Object.defineProperty(exports,"Transform",{enumerable:!0,get:function(){return transform_1.Transform}});var nb_1=__webpack_require__(7542);Object.defineProperty(exports,"TransformNB",{enumerable:!0,get:function(){return nb_1.TransformNB}});var transforms_1=__webpack_require__(5406);Object.defineProperty(exports,"Transforms",{enumerable:!0,get:function(){return transforms_1.Transforms}});var make_19=__webpack_require__(8583);Object.defineProperty(exports,"timeMake",{enumerable:!0,get:function(){return make_19.timeMake}});var make_20=__webpack_require__(8383);Object.defineProperty(exports,"urlMake",{enumerable:!0,get:function(){return make_20.urlMake}})},
/***/3369(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.initialValue=void 0,exports.initialValue=function(initial){return void 0!==initial?initial:null}},
/***/1167(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.intMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.intMake=
/**
 *
 * @param fallback
 * @param value
 * @returns
 *
 * @category Maths
 */
function(fallback,value){const rules=new rules_1.Rules;rules.add().must.match.type.int();const strong=(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"Int");return Object.assign(strong,{increment:()=>strong._data.add(1),decrement:()=>strong._data.add(-1),mul:amt=>strong._data.mul(amt),pow:exponent=>strong._data.pow(exponent),div:amt=>strong._data.div(amt),add:amt=>strong._data.add(amt),sub:amt=>strong._data.add(-1*amt)})}},
/***/1841(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isArrayMake=void 0;const node_1=__webpack_require__(8248);
/**
 * Factory to create isArray validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */exports.isArrayMake=function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_T_ARRAY",1/* CMP */,curr=>Array.isArray(curr),mods);return rule.add(node),caller}}},
/***/5046(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isBigIntMake=exports.isBigInt=void 0;const node_1=__webpack_require__(8248);
/**
 * Check whether provided value is a valid bigint, and if so
 * whether it's an integer.
 * @param value		Number to check
 * @returns
 *
 * @category Validators
 */function isBigInt(target){return"bigint"==typeof target}exports.isBigInt=isBigInt,exports.isBigIntMake=
/**
 * Factory function to create isInteger validator function.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_T_BIG_INT",1/* CMP */,value=>isBigInt(value),mods);return rule.add(node),caller}}},
/***/8442(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.isBigMake=exports.isBig=void 0;const big_js_1=__importDefault(__webpack_require__(9900)),node_1=__webpack_require__(8248),match_1=__webpack_require__(2369);
/**
 * Check if provided value is a valid Big.
 *
 * @param value		Number to check
 * @returns
 *
 * @category Validators
 */
function isBig(target){return(0,match_1.typeMatch)(target,big_js_1.default)}exports.isBig=isBig,exports.isBigMake=
/**
 * Factory function to create isBig validator function.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_T_BIG",1/* CMP */,value=>isBig(value),mods);return rule.add(node),caller}}},
/***/964(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isBooleanMake=exports.isBoolean=void 0;const node_1=__webpack_require__(8248);
/**
 * Determine if provided value is a boolean with strict true or
 * false value. All non-booleans return false, regardless of truthyness.
 * @param value
 * @returns
 *
 * @category Validators
 */function isBoolean(value){return!0===value||!1===value}exports.isBoolean=isBoolean,exports.isBooleanMake=
/**
 * Factory to create isBoolean validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_T_BOOLEAN",1/* CMP */,value=>isBoolean(value),mods);return rule.add(node),caller}}},
/***/3298(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isDateMake=exports.isDate=void 0;const node_1=__webpack_require__(8248);
// eslint-disable-next-line
/**
 * Check if provided value is a valid Date string. Accepts most ISO
 * Date strings as valid.
 * @param value
 * @returns
 *
 * @category Validators
 */
function isDate(value){if("string"!=typeof value)return!1;const result=Date.parse(value);return!(isNaN(result)||value.match("T([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]")||value.match("T([01]?[0-9]|2[0-3]):[0-5][0-9]")||value.match("T([01]?[0-9]|2[0-3])"))}exports.isDate=isDate,exports.isDateMake=
/**
 * Factory function to create isDate validator function. Once created, the validator function can
 * be invoked with a value.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_DATE",1/* CMP */,curr=>isDate(curr),mods);return rule.add(node),caller}}},
/***/4288(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isDateTimeMake=exports.isDateTime=void 0;const node_1=__webpack_require__(8248);
/**
 *
 * @param value
 * @returns
 *
 * @category Date & Time Validators
 */function isDateTime(value){if("string"!=typeof value)return!1;if(!value.trim())return!1;if(value.includes("T")&&!value.includes("GMT")){const pieces=value.split("T");if(2!==pieces.length)return!1;const date=pieces[0].split("-"),time=pieces[1].split(":");if(3!==date.length)return!1;if(time.length>=4)return!1}if(!value.includes("T")){const segments=value.split(/(\s+)/);if(3!==segments.length)return!1;const dateSeg=segments[0].split("."),emptySeg=segments[1].trim(),timeSeg=segments[2].split(":");if(3!==dateSeg.length)return!1;if(""!==emptySeg)return!1;if(timeSeg.length>=4)return!1}if(value.includes("GMT")){const section=value.split("GMT");if(section.length>=3)return!1;if(9!==section[0].toString().trim().split(/(\s+)/).length)return!1}return!0}exports.isDateTime=isDateTime,exports.isDateTimeMake=
/**
 * Factory to create isDatetTime validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_DATE_TIME",1/* CMP */,curr=>isDateTime(curr),mods);return rule.add(node),caller}}},
/***/7646(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isDblMake=exports.isDbl=void 0;const node_1=__webpack_require__(8248);
/**
 * Check whether value is a valid Double.
 *
 * @category Validators
 */function isDbl(value){return"number"==typeof value&&!isNaN(value)}exports.isDbl=isDbl,exports.isDblMake=
/**
 * Factory to create isDbl validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_T_DBL",1/* CMP */,value=>isDbl(value),mods);return rule.add(node),caller}}},
/***/5308(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isEmailMake=exports.isEmail=void 0;const node_1=__webpack_require__(8248);
/**
 * Determine if provided value is a validly formatted email address.
 * @param value
 * @returns
 *
 * @category Email Validators
 */function isEmail(value){if("string"!=typeof value)return!1;if(!value.trim())return!1;const pieces=value.split("@");if(2!==pieces.length)return!1;const name=pieces[0],domain=pieces[1];return-1!==domain.indexOf(".")&&(!(domain.length>252)&&(!!name.trim()&&(!(name.length>64)&&!(name.length+domain.length+1>254))))}exports.isEmail=isEmail,exports.isEmailMake=
/**
 * Factory to create isEmail validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_EMAIL",1/* CMP */,curr=>isEmail(curr),mods);return rule.add(node),caller}}},
/***/4897(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isEmptyMake=exports.isEmpty=void 0;const node_1=__webpack_require__(8248);
/**
 * Determine if value is an empty array or empty string. Arrays & strings with
 * length > 0 and all other types return false.
 * @param value		Array or string to validate.
 * @returns			true	-	value is an empty string or empty array.
 *					false	-	value is either not a string, not an array,
 *								or not not empty.
 *
 * @category Validators
 */function isEmpty(value){return!(!Array.isArray(value)&&"string"!=typeof value)&&("string"==typeof value?""===value:0===value.length)}exports.isEmpty=isEmpty,exports.isEmptyMake=
/**
 * Factory to create isEmpty validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_EMPTY",1/* CMP */,curr=>isEmpty(curr),mods);return rule.add(node),caller}}},
/***/7364(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isEqualMake=exports.isEqual=void 0;const node_1=__webpack_require__(8248);
/**
 *
 * @param curr
 * @param target
 * @returns
 *
 * @category Validators
 */function isEqual(value,target){if(void 0===target||void 0===value)return!1;if(Array.isArray(value)&&Array.isArray(target)){if(value.length!==target.length)return!1;
// Naive check for equality. Will produce false negative
// if the arrays have the same contents in a different order.
for(let i=0;i<value.length;i++)if(value[i]!==target[i])return!1;return!0}return value===target}exports.isEqual=isEqual,exports.isEqualMake=
/**
 * Factory to create isEqual validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("IS_EQ",1/* CMP */,value=>isEqual(value,target),mods);return rule.add(node),caller}}},
/***/5190(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isFloatMake=exports.isFloat=void 0;const node_1=__webpack_require__(8248);
/**
 * Check whether value is a valid Double.
 *
 * @category Validators
 */function isFloat(value){return"number"==typeof value&&!isNaN(value)}exports.isFloat=isFloat,exports.isFloatMake=
/**
 * Factory to create isFloat validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_T_FLOAT",1/* CMP */,value=>isFloat(value),mods);return rule.add(node),caller}}},
/***/6041(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isGTMake=exports.isGT=void 0;const node_1=__webpack_require__(8248);
/**
 * Check if target number is strictly greater than value.
 * @param value
 * @param target
 * @returns
 *
 * @category Validators
 */function isGT(value,target){return"number"==typeof value&&"number"==typeof target&&value>target}exports.isGT=isGT,exports.isGTMake=
/**
 * Factory function to create an isGT validation function.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("IS_GT",1/* CMP */,curr=>isGT(curr,target),mods);return rule.add(node),caller}}},
/***/3994(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isGTEMake=exports.isGTE=void 0;const node_1=__webpack_require__(8248);
/**
 * Validate whether target number is greater than or equal to current value.
 * @param value
 * @param target
 * @returns
 *
 * @category Validators
 */function isGTE(value,target){return"number"==typeof value&&"number"==typeof target&&value>=target}exports.isGTE=isGTE,exports.isGTEMake=
/**
 * Factory function to create a greaterThanorEqual validator function.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("IS_GTE",1/* CMP */,curr=>isGTE(curr,target),mods);return rule.add(node),caller}}},
/***/6489(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isHexColorCodeMake=exports.isHexColorFn=exports.isHexColorCodeStr=exports.isHexColorCode=void 0;const node_1=__webpack_require__(8248);
/**
 * Accepts a number value and returns whether value is
 * a valid hex color code value.
 * @param value
 * @returns
 *
 * @category Validators
 */
function isHexColorCode(value){return!isNaN(value)&&(value>=0&&value<=16777215)}
/**
 * Accepts a string value and returns whether value is
 * a valid hex color code string.
 * @param value
 * @returns
 *
 * @category Validators
 */
function isHexColorCodeStr(value){if("string"!=typeof value)return!1;
// Necessary trim to guarantee the # character check
// succeeds if present.
const trimmed=value.trim().toLowerCase();if(!trimmed)return!1;if(value.length>=9)return!1;
// Remove first character when it's #, usually do to string values like #FF0000.
const cleaned="#"===trimmed[0]?trimmed.substring(1):trimmed;let hexStr;return hexStr=cleaned.startsWith("0x")?cleaned:`0x${cleaned}`,isHexColorCode(Number(hexStr))}
/**
 * Accepts a string or number value and returns whether provided
 * value is a valid hex color code.
 * @param curr
 * @returns
 *
 * @category Validators
 */
function isHexColorFn(curr){return"string"==typeof curr?isHexColorCodeStr(curr):"number"==typeof curr&&isHexColorCode(curr)}exports.isHexColorCode=isHexColorCode,exports.isHexColorCodeStr=isHexColorCodeStr,exports.isHexColorFn=isHexColorFn,exports.isHexColorCodeMake=
/**
 * Factory to create isHexColorCode validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_HEX_COLOR_CODE",1/* CMP */,curr=>isHexColorFn(curr),mods);return rule.add(node),caller}}},
/***/9001(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isIntMake=exports.isInt=void 0;const node_1=__webpack_require__(8248);
/**
 * Check whether provided value is a valid number, and if so
 * whether it's an integer.
 * @param value		Number to check
 * @returns
 *
 * @category Validators
 */function isInt(target){return"number"==typeof target&&(!isNaN(target)&&Math.floor(target)===target)}exports.isInt=isInt,exports.isIntMake=
/**
 * Factory function to create isInteger validator function.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_T_INT",1/* CMP */,value=>isInt(value),mods);return rule.add(node),caller}}},
/***/5979(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isIpv4Addr=void 0,exports.isIpv4Addr=function(addr){
//Always a string.
if("string"!=typeof addr)return!1;
//Is valid if it has whitespace which can be trimmed with .trim()
//Invalid if it contains any other whitespace which cannot be trimmed with .trim()
const pieces=addr.trim().split(".");
//Always has exactly four quads, and 3 periods.
if(4!==pieces.length)return!1;const firstQuad=parseInt(pieces[0]),secondQuad=parseInt(pieces[1]),thirdQuad=parseInt(pieces[2]),fourthQuad=parseInt(pieces[3]);
//The first quad must be an integer between 1  and 255  (cannot be 0)
//All other quads must be an integer between 0 and 255
//Integers cannot have leading 0s
return!(firstQuad<=0||firstQuad>255)&&!(secondQuad<0||secondQuad>255||thirdQuad<0||thirdQuad>255||fourthQuad<0||firstQuad>255)}},
/***/7232(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isIpv4AddrMake=void 0;const addr_1=__webpack_require__(5979),node_1=__webpack_require__(8248);exports.isIpv4AddrMake=
/**
 * Factory to create isIpv4Addr validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_IPV4_ADDR",1/* CMP */,curr=>(0,addr_1.isIpv4Addr)(curr),mods);return rule.add(node),caller}}},
/***/6957(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isValidSegment=exports.isIpv6Addr=void 0,exports.isIpv6Addr=function(current){if("string"!=typeof current)return!1;const trimmed=current.trim();if(!trimmed)return!1;const sections=trimmed.split(":"),doubleColonSegment=trimmed.split("::");if(!sections.length)return!1;if(sections.length>8)return!1;const validatedSegment=sections.every(exports.isValidSegment);return!(8===sections.length&&!validatedSegment&&current.includes("::"))&&!(sections.length<=7&&!validatedSegment&&doubleColonSegment.length>=3)};exports.isValidSegment=segment=>{if("string"!=typeof segment)return!1;const hex=parseInt(segment,16);return!isNaN(hex)&&(hex>=0&&hex<=65535)}},
/***/2046(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.isIpv6AddrMake=void 0;const addr_1=__webpack_require__(6957),node_1=__webpack_require__(8248);exports.isIpv6AddrMake=
/**
 * Factory to create isIpv6Addr validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_IPV6_ADDR",1/* CMP */,curr=>(0,addr_1.isIpv6Addr)(curr),mods);return rule.add(node),caller}}},
/***/5526(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isLengthMake=exports.isLength=void 0;const node_1=__webpack_require__(8248);
/**
 * Check whether current value is a string or array matching target length.
 * @param value
 * @param expectedLength
 * @returns
 *
 * @category Validators
 */function isLength(value,expectedLength){return!(!Array.isArray(value)&&"number"!=typeof value&&"string"!=typeof value)&&("string"==typeof value?value.length===expectedLength:"number"==typeof value?value===expectedLength:value.length===expectedLength)}exports.isLength=isLength,exports.isLengthMake=
/**
 * Factory to create isLength validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return expectedLength=>{const node=new node_1.RuleNode("IS_LENGTH",1/* CMP */,curr=>isLength(curr,expectedLength),mods);return rule.add(node),caller}}},
/***/3622(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isLTMake=exports.isLT=void 0;const node_1=__webpack_require__(8248);
/**
 * Check whether target number is strictly less than value.
 * @param value
 * @param target
 * @returns
 *
 * @category Validators
 */function isLT(value,target){return"number"==typeof value&&("number"==typeof target&&value<target)}exports.isLT=isLT,exports.isLTMake=
/**
 * Factory to create isLT validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("IS_LT",1/* CMP */,curr=>isLT(curr,target),mods);return rule.add(node),caller}}},
/***/5727(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isLTEMake=exports.isLTE=void 0;const node_1=__webpack_require__(8248);
/**
 * Check whether target number is less than or equal to current value.
 * @param value		Strong Type's current value.
 * @param target	Target number to compare.
 * @returns
 *
 * @category Validators
 */function isLTE(value,target){return"number"==typeof value&&"number"==typeof target&&value<=target}exports.isLTE=isLTE,exports.isLTEMake=
/**
 * Factory to create a isLTE validator function.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return target=>{const node=new node_1.RuleNode("IS_LT_OR_EQT",1/* CMP */,curr=>isLTE(curr,target),mods);return rule.add(node),caller}}},
/***/6483(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isNullMake=exports.isNull=void 0;const node_1=__webpack_require__(8248);
/**
 * Determine if value is strictly null.
 * @param value
 * @returns
 *
 * @category Validators
 */exports.isNull=function(value){return null===value},exports.isNullMake=
/**
 * Factory to create isNull validator function used in rule chains.
 * @param caller		Rule node calling this function.
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_NULL",1/* CMP */,curr=>null===curr,mods);return rule.add(node),caller}}},
/***/105(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isPortMake=exports.isPort=void 0;const node_1=__webpack_require__(8248),int_1=__webpack_require__(9001);
/**
 * Check if provided value is a valid port number. Does not differentiate
 * between reserved system ports (root only)and non-reserved ports, only that
 * the port is in the valid port range.
 * @param value
 * @returns
 *
 * @category System Info Validators
 */
function isPort(value){return"number"==typeof value&&(!(value<0)&&(!(value>65353)&&(0,int_1.isInt)(value)))}exports.isPort=isPort,exports.isPortMake=
//Must be an unsigned int (whole number).
//Must be from 0 to 65353 .
//port > 65353 is invalid.
//port < 0 is invalid.
/**
 * Factory to create isPort validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_PORT",1/* CMP */,curr=>isPort(curr),mods);return rule.add(node),caller}}},
/***/6828(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.isSafeMoney=void 0,exports.isSafeMoney=function(o){return null!=o&&"SafeMoney"===o.typeId}},
/***/7213(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isSystemPortMake=exports.isSystemPort=void 0;const node_1=__webpack_require__(8248),port_1=__webpack_require__(105);
/**
 * Check if provided value is a valid port system port number in the
 * range of 1 - 1024 which requires root/admin access to use.
 * @param value
 * @returns
 *
 * @category System Info Validators
 */
function isSystemPort(value){return!!(0,port_1.isPort)(value)&&value<1024}exports.isSystemPort=isSystemPort,exports.isSystemPortMake=
/**
 * Factory to create isSystemPort validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_SYS_PORT",1/* CMP */,curr=>isSystemPort(curr),mods);return rule.add(node),caller}}},
/***/6105(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isTextMake=void 0;const node_1=__webpack_require__(8248);
/**
 * Factory to create isString validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */exports.isTextMake=function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_T_STR",1/* CMP */,value=>"string"==typeof value,mods);return rule.add(node),caller}}},
/***/731(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isTimeMake=exports.isTime=void 0;const node_1=__webpack_require__(8248);
/**
 * Check whether `value` is a valid time string.
 * @param value
 * @returns
 *
 * @category Date & Time Validators
 */
function isTime(value){return"string"==typeof value&&!value.match("^([12]d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]d|3[01]))T([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$")&&!value.match("^([12]d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]d|3[01]))$")&&("string"!=typeof value||!(!value.match("^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$")&&!value.match("^([01]?[0-9]|2[0-3]):[0-5][0-9]$")))}exports.isTime=isTime,exports.isTimeMake=
/**
 * Factory to create isTime validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Date & Time Validators
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_TIME",1/* CMP */,curr=>isTime(curr),mods);return rule.add(node),caller}}},
/***/1562(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isUIntMake=exports.isUInt=void 0;const node_1=__webpack_require__(8248);
/**
 * Check whether provided value is a valid number, and if so
 * whether it's an unsigned integer.
 * @param value		Number to check
 * @returns
 *
 * @category Validators
 */function isUInt(value){return"number"==typeof value&&(!isNaN(value)&&(!(value<0)&&Math.floor(value)===value))}exports.isUInt=isUInt,exports.isUIntMake=
/**
 * Factory function to create isInteger validator function.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_U_INT",1/* CMP */,value=>isUInt(value),mods);return rule.add(node),caller}}},
/***/5576(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isUndefinedMake=exports.isUndefined=void 0;const node_1=__webpack_require__(8248);
/**
 * Check if provided value is undefined.
 * @param value
 * @returns
 *
 * @category Validators
 */function isUndefined(value){return void 0===value}exports.isUndefined=isUndefined,exports.isUndefinedMake=
/**
 * Factory to create isUndefined validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_T_UNDEFINED",1/* CMP */,curr=>isUndefined(curr),mods);return rule.add(node),caller}}},
/***/1113(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.isUrlMake=exports.isUrl=void 0;const node_1=__webpack_require__(8248),url_1=__webpack_require__(8835);
/**
 * Check whether value is a valid URL.
 *
 * @category Validators
 */
function isUrl(value){if("string"!=typeof value)return!1;const pieces=value.split("http://"),segment=value.split("https://");if(""===pieces[1]||""===segment[1])return!1;let result=!1;try{new url_1.URL(value);result=!0}catch(e){result=!1}return result}exports.isUrl=isUrl,exports.isUrlMake=
/**
 * Factory to create isUrl validator function used in rule chains.
 * @param caller
 * @param rule
 * @param mods
 * @returns
 *
 * @category Validator Factory Functions
 */
function(caller,rule,mods){return()=>{const node=new node_1.RuleNode("IS_URL",1/* CMP */,curr=>isUrl(curr),mods);return rule.add(node),caller}}},
/***/5753(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.StrongMap=void 0;const jsonifier_1=__webpack_require__(4909),parser_1=__webpack_require__(6267);exports.StrongMap=
/**
 * Map data structure for Strong Types. Supports recursive parsing of
 * JSON objects into the map, with property type matching and conversion
 * from Strong Map to json object.
 *
 * @category Strong Map
 */
class{constructor(){this.typeId="StrongMap",this.baseType="StrongMap"}parse(data){if(!data)return;(new parser_1.MapParser).parse(this,data)}jsonify(){return(new jsonifier_1.MapJsonifier).jsonify(this)}}},
/***/4909(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.MapJsonifier=void 0;const map_1=__webpack_require__(5753);
/**
 * @category Strong Map
 */exports.MapJsonifier=class{jsonify(map){if(!map)throw Error("Bad MapJsonifier.jsonify attempt - map arg missing.");return this.jsonifyMap(map)}jsonifyMap(map){var _a;const result={},keys=Object.keys(map);for(const keyName of keys){const child=map[keyName];void 0!==child&&(null===child?result[keyName]=null:child instanceof map_1.StrongMap?result[keyName]=this.jsonifyMap(child):"StrongType"===child.baseType||"object"!=typeof child||Array.isArray(child)||null!=(null===(_a=child)||void 0===_a?void 0:_a.nodeType)?result[keyName]=this.jsonifyKey(child):result[keyName]=this.jsonifyMap(child))}return result}jsonifyKey(key){if(void 0===key)return;if(null===key)return null;const assumeKeyIsStrongType=key;return"StrongType"===(null==assumeKeyIsStrongType?void 0:assumeKeyIsStrongType.baseType)?assumeKeyIsStrongType():key}}},
/***/6267(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.MapParser=void 0;const map_1=__webpack_require__(5753),state_1=__webpack_require__(3269);exports.MapParser=
/**
 * Recursively parse provided object properties.
 *
 * @category Strong Map
 */
class{parse(map,data,options){if(!map)return!1;if(!data)return!1;const parseState=new state_1.MapParserState(options);return this.parseMap(map,data,parseState)}parseStrongKey(key,value,_parseState){if(!key||void 0===value)return;if("StrongType"!==key.baseType)return;const strongValue=value;
// When value is also a StrongType invoke it to get its value. Otherwise set
// the strong key with value.
null!=strongValue&&"StrongType"===strongValue.baseType?key(strongValue()):key(value)}parseKey(map,keyName,value,_parseState){if(!map)return!1;if(void 0===value)return!1;if("string"!=typeof keyName||!keyName)return!1;if(null===value)return map[keyName]=null,!0;let result;const strongValue=value;return result=strongValue.hasOwnProperty("typeId")&&"StrongType"===strongValue.baseType?strongValue():value,typeof map[keyName]==typeof result&&(map[keyName]=result,!0)}
/**
     * Recursively parse map and children.
     * @param map			Map to match properties against and store parsed values.
     * @param json			Object to parse into map.
     * @param parseState	Internal state for current parse.
     * @returns				Boolean indicating success or failure.
     *						true	- 	Map parse successful.
     *						false	-	Map parse not successful.
     */parseMap(map,data,parseState){var _a;if(!map)return!1;if(void 0===data||data==={})return!1;const keys=Object.keys(map);for(const keyName of keys){const child=map[keyName],keyValue=data[keyName];
// Skip built-in properties.
map.hasOwnProperty(keyName)&&(
// Child is also a StrongMap. Parse it recursively.
child instanceof map_1.StrongMap?this.parseMap(child,keyValue,parseState):"StrongType"===(null===(_a=child)||void 0===_a?void 0:_a.baseType)?
// Child is a StrongType.
this.parseStrongKey(child,keyValue,parseState):"object"!=typeof child&&
// Child is not a StrongType and not an object.
this.parseKey(map,keyName,keyValue,parseState))}return!0}}},
/***/3269(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.MapParserState=void 0;exports.MapParserState=
/**
 * Internal state used while parsing.
 *
 * @category Strong Map
 */
class{constructor(_options){
// empty constructor
}}},
/***/8934(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.numberNullValue=void 0;const value_1=__webpack_require__(9501);
/**
 * Check if `value` is a valid number or null and return if true. Otherwise
 * returns `fallback`.
 * @param value
 * @param fallback
 * @returns
 *
 * @category Numbers
 */exports.numberNullValue=function(value,fallback){return(0,value_1.typeValue)("number",value,fallback)}},
/***/8376(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.numberValue=void 0;const value_1=__webpack_require__(9501);
/**
 * Test and return value if it's number, otherwise return fallback.
 * Guarantees number return type without additional checks.
 * @param value
 * @param fallback
 * @returns
 *
 * @category Numbers
 */exports.numberValue=function(value,fallback){return(0,value_1.typeValue)("number",value,fallback)}},
/***/3758(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.osSet=void 0,
/**
 * @category System Info
 */
exports.osSet=new Set(["android","darwin","linux","windows","all","none"])},
/***/8144(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.osValid=void 0;const set_1=__webpack_require__(3758);
/**
 * Check whether target key identifies a supported OS.
 * @param value
 * @returns
 *
 * @category System Info
 */exports.osValid=function(key){return!!key&&set_1.osSet.has(key)}},
/***/8317(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Pattern=void 0;const hex_color_code_1=__webpack_require__(6489);
/**
 * @category Rules
 */exports.Pattern=class{constructor(rule,mods){this.hexColor=(0,hex_color_code_1.isHexColorCodeMake)(this,rule,mods)}}},
/***/6377(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.portMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.portMake=
/**
 *
 * @param fallback
 * @param initial
 * @returns
 *
 * @category System Info
 */
function(fallback,value){const rules=new rules_1.Rules;return rules.add().must.match.type.int(),rules.add().must.be.lessThanOrEqual(65535),rules.add().must.be.greaterThanOrEqual(1),(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"Port")}},
/***/8862(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Range=void 0;const map_1=__webpack_require__(5753),make_1=__webpack_require__(5582);
/**
 * General numeric range with min and max value.
 *
 * @category Maths
 */
class Range extends map_1.StrongMap{constructor(defaultMin,defaultMax){super(),this.min=(0,make_1.floatMake)("number"==typeof defaultMin?defaultMin:0),this.max=(0,make_1.floatMake)("number"==typeof defaultMax?defaultMax:0),this.typeId="Range"}
/**
     * Check if provided value exists between min and max range values (inclusive).
     * @param value
     * @returns
     */in(value,exclusive){return"number"==typeof value&&(
// Value must be strict greater than range min and strictly less than the
// range max in exclusive mode.
!0===exclusive?value>this.min()&&value<this.max():value>=this.min()&&value<=this.max())}
/**
     * Reset min and max to initial values.
     */reset(){this.max.reset(),this.min.reset()}}exports.Range=Range},
/***/521(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Rule=void 0;exports.Rule=
/**
 * Single rule applied to a node. Can be modified by other rules, matches,
 * specifiers, and flags such as invert.
 *
 * @category Rules
 */
class{constructor(){this.nodes=[]}add(node){1/* CMP */===node.type&&this.nodes.push(node)}run(value){if(!this.nodes.length)return!1;let trueCount=0;for(const node of this.nodes){node.execute(value)&&trueCount++}
// Require at least comparison in set of
// OR operators to be true.
return trueCount>0}reset(){this.nodes.length=0}}},
/***/2137(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleA=void 0;exports.RuleA=
/**
 * @category Rules
 */
class{}},
/***/6749(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleBe=void 0;const date_1=__webpack_require__(3298),time_1=__webpack_require__(4288),email_1=__webpack_require__(5308),empty_1=__webpack_require__(4897),equal_1=__webpack_require__(7364),gt_1=__webpack_require__(6041),gte_1=__webpack_require__(3994),hex_color_code_1=__webpack_require__(6489),lt_1=__webpack_require__(3622),lte_1=__webpack_require__(5727),null_1=__webpack_require__(6483),port_1=__webpack_require__(105),port_2=__webpack_require__(7213),time_2=__webpack_require__(731),undefined_1=__webpack_require__(5576),url_1=__webpack_require__(1113),make_1=__webpack_require__(7232),make_2=__webpack_require__(2046);exports.RuleBe=
/**
 * Rule chain matcher node with equality and type validation operations
 *
 * @category Rules
 */
class{constructor(rule,mods){this.greaterThan=(0,gt_1.isGTMake)(this,rule,mods),this.greaterThanOrEqual=(0,gte_1.isGTEMake)(this,rule,mods),this.lessThan=(0,lt_1.isLTMake)(this,rule,mods),this.lessThanOrEqual=(0,lte_1.isLTEMake)(this,rule,mods),this.equalTo=(0,equal_1.isEqualMake)(this,rule,mods),this.undefined=(0,undefined_1.isUndefinedMake)(this,rule,mods),this.null=(0,null_1.isNullMake)(this,rule,mods),this.empty=(0,empty_1.isEmptyMake)(this,rule,mods),this.date=(0,date_1.isDateMake)(this,rule,mods),this.time=(0,time_2.isTimeMake)(this,rule,mods),this.hexColorCode=(0,hex_color_code_1.isHexColorCodeMake)(this,rule,mods),this.email=(0,email_1.isEmailMake)(this,rule,mods),this.url=(0,url_1.isUrlMake)(this,rule,mods),this.dateTime=(0,time_1.isDateTimeMake)(this,rule,mods),this.portNumber=(0,port_1.isPortMake)(this,rule,mods),this.systemPortNumber=(0,port_2.isSystemPortMake)(this,rule,mods),this.ipv4Addr=(0,make_1.isIpv4AddrMake)(this,rule,mods),this.ipv6Addr=(0,make_2.isIpv6AddrMake)(this,rule,mods)}}},
/***/7725(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleContains=void 0;const char_1=__webpack_require__(5678),times_1=__webpack_require__(3387),text_1=__webpack_require__(3841),times_2=__webpack_require__(7768);exports.RuleContains=
/**
 * @category Rules
 */
class{constructor(rule,mods){this.text=(0,text_1.hasTextMake)(this,rule,mods),this.textTimes=(0,times_2.hasTextTimesMake)(this,rule,mods),this.char=(0,char_1.hasCharMake)(this,rule,mods),this.charTimes=(0,times_1.hasCharTimesMake)(this,rule,mods)}}},
/***/2678(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleHave=void 0;const property_1=__webpack_require__(7199),text_1=__webpack_require__(3841),times_1=__webpack_require__(7768),length_1=__webpack_require__(7576);exports.RuleHave=
/**
 * @category Rules
 */
class{constructor(rule,mods){this.length=new length_1.RuleLength(rule,mods),this.property=(0,property_1.hasPropertyMake)(this,rule,mods),this.text=(0,text_1.hasTextMake)(this,rule,mods),this.textTimes=(0,times_1.hasTextTimesMake)(this,rule,mods)}}},
/***/7576(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleLength=void 0;const equal_1=__webpack_require__(2477),gt_1=__webpack_require__(5078),gte_1=__webpack_require__(2751),lt_1=__webpack_require__(5193),lte_1=__webpack_require__(8042);exports.RuleLength=
/**
 * @category Rules
 */
class{constructor(rule,mods){this.equalTo=(0,equal_1.hasLengthEqualMake)(this,rule,mods),this.greaterThan=(0,gt_1.hasLengthGTMake)(this,rule,mods),this.greaterThanOrEqualTo=(0,gte_1.hasLengthGTEMake)(this,rule,mods),this.lessThan=(0,lt_1.hasLengthLTMake)(this,rule,mods),this.lessThanOrEqualTo=(0,lte_1.hasLengthLTEMake)(this,rule,mods)}}},
/***/515(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleMatch=void 0;const pattern_1=__webpack_require__(8317),or_1=__webpack_require__(29),type_1=__webpack_require__(2528);exports.RuleMatch=
/**
 * Source must match the comparator immediately following a match.
 *
 * @category Rules
 */
class{constructor(rule,parentMods){const mods={invert:parentMods.invert,target:parentMods.target};this.or=new or_1.RuleOr(rule,mods),this.type=new type_1.RuleType(rule,mods),this.pattern=new pattern_1.Pattern(rule,mods)}}},
/***/7029(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleMust=void 0;const equal_1=__webpack_require__(7364),rule_1=__webpack_require__(521),be_1=__webpack_require__(6749),contains_1=__webpack_require__(7725),have_1=__webpack_require__(2678),match_1=__webpack_require__(515),not_1=__webpack_require__(7419);exports.RuleMust=
/**
 * Begins a new statement within a rule.
 *
 * @category Rules
 */
class{constructor(rules,parentRule){const rule=parentRule||new rule_1.Rule;parentRule||rules.push(rule);
// Each must begins a new rule and resets all preceding mods.
const mods={invert:!1,target:"value"};this.be=new be_1.RuleBe(rule,mods),this.have=new have_1.RuleHave(rule,mods),this.not=new not_1.RuleNot(rule,mods),this.equal=(0,equal_1.isEqualMake)(this,rule,mods),this.match=new match_1.RuleMatch(rule,mods),this.contain=new contains_1.RuleContains(rule,mods)}}},
/***/8248(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleNode=void 0;exports.RuleNode=
/**
 * @category Rules
 */
class{constructor(id,type,fn,mods){if(this.id=id,"function"!=typeof fn)throw new Error("Bad rule init - fn arg is not a function.");this.type=type,this.children=[],this.fn=fn,this.target=mods.target,this.invertResult=!0===mods.invert}execute(value){const result=this.fn(value);return this.invertResult?!result:result}}},
/***/8211(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleNodeType=void 0,function(RuleNodeType){RuleNodeType[RuleNodeType.OP=0]="OP",RuleNodeType[RuleNodeType.CMP=1]="CMP"}(exports.RuleNodeType||(exports.RuleNodeType={}))},
/***/7419(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleNot=void 0;const equal_1=__webpack_require__(7364),be_1=__webpack_require__(6749),contains_1=__webpack_require__(7725);exports.RuleNot=
/**
 * Inverts the operation immediately following it.
 *
 * @category Rules
 */
class{constructor(rule,parentMods){const mods={invert:!parentMods.invert,target:parentMods.target};this.be=new be_1.RuleBe(rule,mods),this.contain=new contains_1.RuleContains(rule,mods),this.equalTo=(0,equal_1.isEqualMake)(this,rule,mods)}}},
/***/29(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleOr=void 0;const type_1=__webpack_require__(2528);
/**
 * Rule chain operator which requires either the proceeding or following
 * operation node return true.
 *
 * @category Rules
 */exports.RuleOr=class{constructor(rule,parentMods){this.type=new type_1.RuleType(rule,parentMods)}}},
/***/2528(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.RuleType=void 0;const array_1=__webpack_require__(1841),big_1=__webpack_require__(8442),big_int_1=__webpack_require__(5046),boolean_1=__webpack_require__(964),dbl_1=__webpack_require__(7646),float_1=__webpack_require__(5190),int_1=__webpack_require__(9001),null_1=__webpack_require__(6483),text_1=__webpack_require__(6105),uint_1=__webpack_require__(1562);exports.RuleType=
/**
 * @category Rules
 */
class{constructor(rule,mods){this.array=(0,array_1.isArrayMake)(this,rule,mods),this.big=(0,big_1.isBigMake)(this,rule,mods),this.bigInt=(0,big_int_1.isBigIntMake)(this,rule,mods),this.boolean=(0,boolean_1.isBooleanMake)(this,rule,mods),this.dbl=(0,dbl_1.isDblMake)(this,rule,mods),this.float=(0,float_1.isFloatMake)(this,rule,mods),this.int=(0,int_1.isIntMake)(this,rule,mods),this.null=(0,null_1.isNullMake)(this,rule,mods),this.string=(0,text_1.isTextMake)(this,rule,mods),this.text=(0,text_1.isTextMake)(this,rule,mods),this.uint=(0,uint_1.isUIntMake)(this,rule,mods)}}},
/***/3756(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Rules=void 0;const must_1=__webpack_require__(7029);
/**
 * Container for rules applied to a node.
 *
 * @category Rules
 */exports.Rules=class{constructor(){this.rules=[]}add(){return{must:new must_1.RuleMust(this.rules,null)}}run(value){if(!this.rules||!this.rules.length)return!0;for(const rule of this.rules)if(!rule.run(value))return!1;return!0}}},
/***/6834(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.safeMoneyMake=void 0;const big_js_1=__importDefault(__webpack_require__(9900)),rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),big_1=__webpack_require__(9046),BIG_ZERO=(0,big_js_1.default)(0),BIG_ONE=(0,big_js_1.default)(1);exports.safeMoneyMake=
/**
 *
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Maths
 */
function(fallback,initial){const rules=new rules_1.Rules;rules.add().must.match.type.big();const bigFallback=(0,big_1.toSafeMoneyBig)(fallback),bigInitial=(0,big_1.toSafeMoneyBig)(initial),strong=(0,type_1.createType)(null!=bigFallback?bigFallback:BIG_ZERO,bigInitial,rules,"SafeMoney");return Object.assign(strong,{increment:()=>{const value=strong._data.getNull();if(null===value)return null;const result=value.add(BIG_ONE);return strong._data.set(result)?result:null},decrement:()=>{const value=strong._data.getNull();if(null===value)return null;const result=value.minus(BIG_ONE);return strong._data.set(result)?result:null},mul:input=>{const curr=strong.get(BIG_ZERO),value=(0,big_1.toSafeMoneyBig)(input);if(null===value||null===curr)return null;const result=curr.mul(value);return strong._data.set(result)?result:null},pow:exponent=>{const curr=strong._data.getNull(),value=(0,big_1.toSafeMoneyBig)(exponent);if(null===curr||null===value)return null;const result=curr.pow(value.toNumber());return strong._data.set(result)?result:null},div:input=>{const curr=strong.get(BIG_ZERO),value=(0,big_1.toSafeMoneyBig)(input);if(null===curr||null===value)return null;if(value===BIG_ZERO||curr===BIG_ZERO)return null;const result=curr.div(value);return strong._data.set(result)?result:null},add:input=>{const value=(0,big_1.toSafeMoneyBig)(input),curr=strong.getNull();if(null===value||null===curr)return null;const result=curr.add(value);return strong._data.set(result)?result:null},sub:input=>{const value=(0,big_1.toSafeMoneyBig)(input),curr=strong.getNull();if(null===value||null===curr)return null;const result=curr.minus(value);return strong._data.set(result)?result:null},round:_input=>null,typeId:"SafeMoney",baseType:"StrongType"})}},
/***/6047(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.semVerMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.semVerMake=
/**
 * Create new strong hex color code object.
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Strings
 */
function(fallback,value){const rules=new rules_1.Rules;return rules.add().must.match.type.string(),rules.add().must.contain.charTimes(".",3),(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"SemVer")}},
/***/8954(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Size=void 0;const map_1=__webpack_require__(5753),make_1=__webpack_require__(5582);
/**
 * Size object containing width & height properties as strong doubles.
 *
 * @category Maths
 */
class Size extends map_1.StrongMap{constructor(defaultWidth,defaultHeight){super(),this.width=(0,make_1.floatMake)("number"==typeof defaultWidth?defaultWidth:0),this.height=(0,make_1.floatMake)("number"==typeof defaultHeight?defaultHeight:0),this.typeId="Size",this.baseType="StrongMap"}}exports.Size=Size},
/***/9254(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.stringNullValue=void 0;const value_1=__webpack_require__(9501);
/**
 * Check if `value` is a valid string and return it if so, otherwise
 * returns `fallback`.
 * @param value
 * @param fallback
 * @returns
 *
 * @category Strings
 */exports.stringNullValue=function(value,fallback){return(0,value_1.typeValue)("string",value,fallback)}},
/***/6984(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.stringValue=void 0;const value_1=__webpack_require__(9501);
/**
 * Check if `value` is a valid string and return it if so, otherwise
 * returns `fallback`.
 * @param value
 * @param fallback
 * @returns
 *
 * @category Strings
 */exports.stringValue=function(value,fallback){return(0,value_1.typeValue)("string",value,fallback)}},
/***/2503(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.StrongData=void 0;const transforms_1=__webpack_require__(5406);
/**
 * @category Core
 */exports.StrongData=class{constructor(fallbackDefault,value,rules,typeId){this.value=null,this.fallbackDefault=fallbackDefault,this.transforms=new transforms_1.Transforms(fallbackDefault),this.rules=rules,this.typeId=typeId,this.baseType="StrongData",this.initial=value,this.set(value)}
/**
     * Check if value passes this instance's rule validation.
     * @param value
     * @returns
     */check(value){return void 0!==value&&this.rules.run(value)}get(fallback){return null===this.value?null==fallback?this.fallbackDefault:fallback:this.value}set(value){if(void 0===value)return!1;if(null===value)return this.value=null,!0;const transformed=value;return!!this.check(value)&&(this.value=transformed,!0)}getNull(){return void 0===this.value||null===this.value?null:this.value}reset(){this.value=this.initial}
/**
     * Divide current `value` by `divisor`. Result is zero when
     * `divisor` or `value` are zero.
     * @param divisor
     * @returns
     */div(divisor){const curr=this.getNull();if("number"!=typeof divisor||"number"!=typeof curr)return null;if(0===divisor||0===curr)return this.set(0),0;const result=curr/divisor;return isNaN(result)?null:(this.set(result),result)}mul(value){const curr=this.getNull();if("number"!=typeof value||"number"!=typeof curr)return null;if(0===value||0===curr)return this.set(0),0;const result=value*curr;return this.set(result)?result:null}
/**
     *
     * @param exponent
     * @returns
     */pow(exponent){const curr=this.getNull();if("number"!=typeof curr||null===curr)return null;const result=Math.pow(curr,exponent);return isNaN(result)||result>=Number.MAX_SAFE_INTEGER?null:(this.set(result),result)}
/**
     * Add value to Strong Type's current value, if it is a numeric type. Operation
     * ignored for non-numeric types.
     * @param value
     * @returns
     */add(value){const curr=this.getNull();if("number"!=typeof value||"number"!=typeof curr)return null;const result=value+curr;return isNaN(result)||result<Number.MIN_SAFE_INTEGER||result>Number.MAX_SAFE_INTEGER?null:this.set(result)?result:null}}},
/***/9853(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.strongMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.strongMake=
/**
 * Create Strong object using provided arguments. Should generally be called
 * by helper functions or factories which create the desired type and pass in
 * type rules consistently.
 * @param fallback		Value returned when type's current `value` is null.
 * @param initial		(Optional) Initial value for type. When not provided, type's
 *						initial value is `fallback` instead. When reset is called, value
 *						is automatically set to initial if it was provided, or fallback if not.
 * @param rules			Automatic type validation rules applied to any value used with `set`.
 * @returns
 *
 * @category Core
 */
function(fallback,initial,rules){const rulesValue=rules instanceof rules_1.Rules?rules:new rules_1.Rules;return(0,type_1.createType)(fallback,(0,value_1.initialValue)(initial),rulesValue,"StrongType")}},
/***/9168(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.swapPop=void 0,exports.swapPop=
/**
 * Remove an array element in O(1) time if element ndx is known.
 * Works only with unordered arrays.
 * @param array
 * @param ndx
 *
 * @category Collections
 */
function(array,ndx){if(!array.length)
// pop always returns a value if the length is greater
// than zero. This check prevents pop from returning a
// value of undefined.
return null;if(ndx>=array.length||ndx<0)return null;if(1===array.length||ndx===array.length-1){const result=array.pop();return void 0===result?null:result}
// Save the element at ndx in the array to
// keep it safe while we overwrite the slot.
const element=array[ndx];
// Move the last element into ndx slot.
return array[ndx]=array[array.length-1],
// Pop the last element off the array
array.pop(),element}},
/***/2283(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.systemPortMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.systemPortMake=
/**
 *
 * @param fallback
 * @param initial
 * @returns
 *
 * @category System Info
 */
function(fallback,value){const rules=new rules_1.Rules;return rules.add().must.match.type.int(),rules.add().must.be.systemPortNumber(),(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"SystemPort")}},
/***/4837(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.textMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.textMake=
/**
 *
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Strings
 */
function(fallback,value){const rules=new rules_1.Rules;return rules.add().must.match.type.string(),(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"Text")}},
/***/8583(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.timeMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.timeMake=
/**
 * ISO Time string.
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Date & Time
 */
function(fallback,value){const rules=new rules_1.Rules;return rules.add().must.match.type.string(),rules.add().must.be.time(),(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"Time")}},
/***/518(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.toDblBig=void 0;const big_js_1=__importDefault(__webpack_require__(9900)),make_1=__webpack_require__(4546),match_1=__webpack_require__(2369);exports.toDblBig=
/**
 * Convert from common numeric types to the `Big` data type.
 * @param value
 * @returns
 *
 * @category Strong Helpers
 */
function(value){return null==value?null:
// No conversion needed if type is already a Big.
(0,match_1.typeMatch)(value,big_js_1.default)?value:"string"==typeof value?(0,make_1.bigMake)(value):
// All other accepted types have been processed. If type is not number,
// value type cannot be handled.
"number"!=typeof value||isNaN(value)||value>=Number.POSITIVE_INFINITY||value<=Number.NEGATIVE_INFINITY||value>Number.MAX_SAFE_INTEGER||value<Number.MIN_SAFE_INTEGER?null:(0,make_1.bigMake)(value)}},
/***/6255(__unused_webpack_module,exports,__webpack_require__){"use strict";var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.toFloat=void 0;const big_js_1=__importDefault(__webpack_require__(9900)),match_1=__webpack_require__(2369);
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */exports.toFloat=
/**
 * Convert a Big, string, or number to standard float (`number`). Returns `null` when
 * input value is `undefined`, `null`, or a `Big` value which cannot be safely converted
 * to `number`. Useful for working with `Big` values but small types, such as a small exponent,
 * which must be in number form to use with a `Big`.
 * @param value
 * @returns
 *
 * @category Strong Helpers
 */
function(value){if(null==value)return null;if((0,match_1.typeMatch)(value,big_js_1.default))return value.gt(Number.MAX_SAFE_INTEGER)||value.lt(Number.MIN_SAFE_INTEGER)?null:value.toNumber();if("string"==typeof value){const result=parseFloat(value);return!isNaN(result)&&isFinite(result)?result:null}return value}},
/***/8301(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.toIntBig=void 0;const big_js_1=__importDefault(__webpack_require__(9900)),make_1=__webpack_require__(4546),match_1=__webpack_require__(2369);exports.toIntBig=
/**
 * Convert from common numeric types to the `Big` data type.
 * @param value
 * @returns
 *
 * @category Strong Helpers
 */
function(value){try{if(null==value)return null;if((0,match_1.typeMatch)(value,big_js_1.default))return value;if("string"==typeof value){const result=(0,make_1.bigMake)(value);if(null===result)return null;
// String values converted to Big can be larger than JavaScript `number`,
// meaning common JavaScript math functions cannot be used to check result.
// Values with decimal values are rejected.
const rounded=result.round(4);return isNaN(rounded.cmp(result))?null:rounded}
// All other supported types have been processed. If value is not
// a number, we don't support it. Bail out.
if("number"!=typeof value)return null;if(isNaN(value)||value>=Number.POSITIVE_INFINITY||value<=Number.NEGATIVE_INFINITY)return null;if(value>Number.MAX_SAFE_INTEGER||value<Number.MIN_SAFE_INTEGER)return null;if(Math.floor(value)!==value)return null}catch(e){}return(0,make_1.bigMake)(value)}},
/***/4046(__unused_webpack_module,exports,__webpack_require__){"use strict";var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.toIntNumber=void 0;
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */
const big_js_1=__importDefault(__webpack_require__(9900)),match_1=__webpack_require__(2369);exports.toIntNumber=
/**
 * Convert from common numeric types to JavaScript `number` type.
 * @param value
 * @returns
 *
 * @category Strong Helpers
 */
function(value){if(null==value)return null;let result;
// Converting Big -> number is generally as precision may be lost.
// Support for Big values is provided for ease of use in cases where
// the caller would have to convert input before calling.
if((0,match_1.typeMatch)(value,big_js_1.default))
// Throws when Big value will not fit in number.
try{result=value.toNumber()}catch(e){result=null}else result="string"==typeof value?parseFloat(value):"number"==typeof value?value:null;return null===result||isNaN(result)||result>=Number.POSITIVE_INFINITY||result<=Number.NEGATIVE_INFINITY||result<Number.MIN_SAFE_INTEGER||result>Number.MAX_SAFE_INTEGER||Math.floor(result)!==result?null:result}},
/***/9046(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.toSafeMoneyBig=void 0;const money_1=__webpack_require__(6828),big_1=__webpack_require__(518);exports.toSafeMoneyBig=
/**
 * Convert from common numeric types to the `Big` data type.
 * @param value
 * @returns
 *
 * @category Strong Helpers
 */
function(input){if(null==input)return null;let value=null;if((0,money_1.isSafeMoney)(input)){const sm=input;value="function"==typeof sm.getNull?sm.getNull():null}else value=input;return(0,big_1.toDblBig)(value)}},
/***/667(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Transform=void 0;exports.Transform=
/**
 * @category Transforms
 */
class{constructor(fn,options){if(!fn)throw new Error("Bad Transform init - fn arg missing.");this.fn=fn,this.id=options&&"string"==typeof options.id?options.id:"tf",this.label=`filter_${this.id}`}run(value){let result=value;try{result=this.fn(value)}catch(e){console.error(`[${this.label}]`)}return result}}},
/***/7542(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.TransformNB=void 0;exports.TransformNB=
/**
 * @category Transforms
 */
class{constructor(fn,options){if(!fn)throw new Error("Bad TransformNB init - fn arg missing.");this.fn=fn,this.id=options&&"string"==typeof options.id?options.id:"tf",this.label=`filter_${this.id}`}run(value){let result=value;try{result=this.fn(value)}catch(e){console.error(`[${this.label}]`)}return result}}},
/***/5406(__unused_webpack_module,exports){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Transforms=void 0;exports.Transforms=
/**
 * Container holding the transform function chain used to transform
 * values before saving. Transforms are applied in the order they are
 * stored in the transforms or transformsNB array.
 *
 * @category Transforms
 */
class{constructor(fallbackDefault){this.transforms=[],this.transformsNB=[],this.fallbackDefault=fallbackDefault}
/**
     * Add nullable transform function to chain.
     * @param transform		Nullable transform fn to be added to chain.
     * @returns				Boolean indicating add success or failure.
     *						true	-	Transform fn added to chain successfully.
     *						false	-	Transform fn not added to chain.
     */addNB(transform){return!!transform&&(this.transformsNB.push(transform),!0)}
/**
     * Add transform function to chain.
     * @param transform		Transform fn to be added to chain.
     * @returns				Boolean indicating add success or failure.
     *						true	-	Transform fn added to chain successfully.
     *						false	-	Transform fn not added to chain.
     */add(transform){return!!transform&&(
// todo: add sorted insert here based on filter.sortOrder
this.transforms.push(transform),!0)}
/**
     * Run transform chain, applying each transforms once the order added to
     * the chain.
     * @param value
     * @returns
     */run(value){if(null==value)return this.fallbackDefault;let transformed=value;const transforms=this.transforms;for(const transform of transforms){const input=transformed;transformed=transform.run(input)}return transformed}
/**
     * Run transform chain, applying each transforms once the order added to
     * the chain.
     * @param value
     * @returns
     */runNB(value){if(null==value)return null;let transformed=value;const transformsNB=this.transformsNB;for(const transform of transformsNB){const input=transformed;transformed=transform.run(input)}return transformed}
/**
     * Remove all transform functions from chain. Fallback value
     * remains the same.
     */reset(){this.transforms.length=0,this.transformsNB.length=0}}},
/***/2369(__unused_webpack_module,exports){"use strict";
/**
 * Determine whether object is an instance of provided type or className.
 * @param o
 * @param className
 * @returns
 *
 * @category Validators
 */
function typeMatch(o,className){return"string"==typeof className?typeof o===className:o instanceof className}Object.defineProperty(exports,"__esModule",{value:!0}),exports.isType=exports.typeMatch=void 0,exports.typeMatch=typeMatch,
/**
 * Alias for typeMatch for backwards compat.
 *
 * @category Validators
 */
exports.isType=typeMatch},
/***/9501(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.typeValue=void 0,exports.typeValue=
/**
 * Validate `value` a valid type_T and return it if valid, otherwise
 * return `fallback`. Quick and easy way to validate configs, maps, and
 * other objects with a guaranteed return type.
 * @param typeName		JavaScript type name for expected type.
 * @param value			Value to be validated as `typeName`.
 * @param fallback		Value returned when `value` is not a valid type_T.
 * @returns
 *
 * @category Core
 */
function(typeName,value,fallback){return typeof value!==typeName?fallback:value}},
/***/884(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.uIntMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.uIntMake=
/**
 * Create new strong unsigned integer.
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Maths
 */
function(fallback,value){const rules=new rules_1.Rules;rules.add().must.match.type.int(),rules.add().must.be.greaterThanOrEqual(0);const strong=(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"UInt");return Object.assign(strong,{increment:()=>strong._data.add(1),decrement:()=>strong._data.add(-1),mul:amt=>strong._data.mul(amt),pow:exponent=>strong._data.pow(exponent),div:amt=>strong._data.div(amt),add:amt=>strong._data.add(amt),sub:amt=>strong._data.add(-1*amt)})}},
/***/8383(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.urlMake=void 0;const rules_1=__webpack_require__(3756),type_1=__webpack_require__(5938),value_1=__webpack_require__(3369);exports.urlMake=
/**
 * Create new strong Url object. Only valid Urls can be set.
 * @param fallback
 * @param initial
 * @returns
 *
 * @category Strings
 */
function(fallback,value){const rules=new rules_1.Rules;return rules.add().must.match.type.string(),rules.add().must.be.url(),(0,type_1.createType)(fallback,(0,value_1.initialValue)(value),rules,"Url")}},
/***/2858(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Vec1=void 0;const defaults_1=__webpack_require__(7141),make_1=__webpack_require__(5582);exports.Vec1=
/**
 * Map for passing coodinates in 1-dimensional
 * coordinate systems.
 *
 * @category Maths
 */
class{constructor(x){this.x=(0,make_1.floatMake)(defaults_1.Defaults.Vec.X,x)}
/**
     * Reset all coordinate properties to default values.
     */reset(){this.x.reset()}}},
/***/4311(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Vec2=void 0;const defaults_1=__webpack_require__(7141),make_1=__webpack_require__(5582);exports.Vec2=
/**
 * Map for passing coodinates in 2-dimensional
 * coordinate systems.
 *
 * @category Maths
 */
class{constructor(x,y){this.x=(0,make_1.floatMake)(defaults_1.Defaults.Vec.X,x),this.y=(0,make_1.floatMake)(defaults_1.Defaults.Vec.Y,y)}
/**
     * Reset all coordinate properties to default values.
     */reset(){this.x.reset(),this.y.reset()}}},
/***/4592(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Vec3=void 0;const defaults_1=__webpack_require__(7141),make_1=__webpack_require__(5582);exports.Vec3=
/**
 * Map for passing coodinates in 3-dimensional
 * coordinate systems.
 *
 * @category Maths
 */
class{constructor(x,y,z){this.x=(0,make_1.floatMake)(defaults_1.Defaults.Vec.X,x),this.y=(0,make_1.floatMake)(defaults_1.Defaults.Vec.Y,y),this.z=(0,make_1.floatMake)(defaults_1.Defaults.Vec.Z,z)}
/**
     * Reset all coordinate properties to default values.
     */reset(){this.x.reset(),this.y.reset(),this.z.reset()}}},
/***/8389(__unused_webpack_module,exports,__webpack_require__){"use strict";
/**
 *	MIT License
 *
 *	Copyright (c) 2019 - 2021 Toreda, Inc.
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *	copies of the Software, and to permit persons to whom the Software is
 *	furnished to do so, subject to the following conditions:

 * 	The above copyright notice and this permission notice shall be included in all
 * 	copies or substantial portions of the Software.
 *
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * 	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * 	SOFTWARE.
 *
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.Vec4=void 0;const defaults_1=__webpack_require__(7141),make_1=__webpack_require__(5582);exports.Vec4=
/**
 * Map for passing coodinates in 4-dimensional
 * coordinate systems.
 *
 * @category Maths
 */
class{constructor(x,y,z,w){this.x=(0,make_1.floatMake)(defaults_1.Defaults.Vec.X,x),this.y=(0,make_1.floatMake)(defaults_1.Defaults.Vec.Y,y),this.z=(0,make_1.floatMake)(defaults_1.Defaults.Vec.Z,z),this.w=(0,make_1.floatMake)(defaults_1.Defaults.Vec.W,w)}
/**
     * Reset all coordinate properties to default values.
     */reset(){this.x.reset(),this.y.reset(),this.z.reset(),this.w.reset()}}},
/***/9900(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;
/*
 *  big.js v6.2.2
 *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
 *  Copyright (c) 2024 Michael Mclaughlin
 *  https://github.com/MikeMcl/big.js/LICENCE.md
 */!function(){"use strict";var Big,// true or false
/**************************************************************************************************/
// Error messages.
NAME="[big.js] ",INVALID=NAME+"Invalid ",INVALID_DP=INVALID+"decimal places",INVALID_RM=INVALID+"rounding mode",DIV_BY_ZERO=NAME+"Division by zero",
// The shared prototype object.
P={},NUMERIC=/^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
/*
   * Create and return a Big constructor.
   */
/*
   * Round Big x to a maximum of sd significant digits using rounding mode rm.
   *
   * x {Big} The Big to round.
   * sd {number} Significant digits: integer, 0 to MAX_DP inclusive.
   * rm {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   * [more] {boolean} Whether the result of division was truncated.
   */
function round(x,sd,rm,more){var xc=x.c;if(void 0===rm&&(rm=x.constructor.RM),0!==rm&&1!==rm&&2!==rm&&3!==rm)throw Error(INVALID_RM);if(sd<1)more=3===rm&&(more||!!xc[0])||0===sd&&(1===rm&&xc[0]>=5||2===rm&&(xc[0]>5||5===xc[0]&&(more||void 0!==xc[1]))),xc.length=1,more?(
// 1, 0.1, 0.01, 0.001, 0.0001 etc.
x.e=x.e-sd+1,xc[0]=1):
// Zero.
xc[0]=x.e=0;else if(sd<xc.length){
// Round up?
if(
// xc[sd] is the digit after the digit that may be rounded up.
more=1===rm&&xc[sd]>=5||2===rm&&(xc[sd]>5||5===xc[sd]&&(more||void 0!==xc[sd+1]||1&xc[sd-1]))||3===rm&&(more||!!xc[0]),
// Remove any digits after the required precision.
xc.length=sd,more)
// Rounding up may mean the previous digit has to be rounded up.
for(;++xc[--sd]>9;)if(xc[sd]=0,0===sd){++x.e,xc.unshift(1);break}
// Remove trailing zeros.
for(sd=xc.length;!xc[--sd];)xc.pop()}return x}
/*
   * Return a string representing the value of Big x in normal or exponential notation.
   * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
   */function stringify(x,doExponential,isNonzero){var e=x.e,s=x.c.join(""),n=s.length;
// Exponential notation?
if(doExponential)s=s.charAt(0)+(n>1?"."+s.slice(1):"")+(e<0?"e":"e+")+e;
// Normal notation.
else if(e<0){for(;++e;)s="0"+s;s="0."+s}else if(e>0)if(++e>n)for(e-=n;e--;)s+="0";else e<n&&(s=s.slice(0,e)+"."+s.slice(e));else n>1&&(s=s.charAt(0)+"."+s.slice(1));return x.s<0&&isNonzero?"-"+s:s}
// Prototype/instance methods
/*
   * Return a new Big whose value is the absolute value of this Big.
   */P.abs=function(){var x=new this.constructor(this);return x.s=1,x},
/*
   * Return 1 if the value of this Big is greater than the value of Big y,
   *       -1 if the value of this Big is less than the value of Big y, or
   *        0 if they have the same value.
   */
P.cmp=function(y){var isneg,x=this,xc=x.c,yc=(y=new x.constructor(y)).c,i=x.s,j=y.s,k=x.e,l=y.e;
// Either zero?
if(!xc[0]||!yc[0])return xc[0]?i:yc[0]?-j:0;
// Signs differ?
if(i!=j)return i;
// Compare exponents.
if(isneg=i<0,k!=l)return k>l^isneg?1:-1;
// Compare digit by digit.
for(j=(k=xc.length)<(l=yc.length)?k:l,i=-1;++i<j;)if(xc[i]!=yc[i])return xc[i]>yc[i]^isneg?1:-1;
// Compare lengths.
return k==l?0:k>l^isneg?1:-1},
/*
   * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
   * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
P.div=function(y){var x=this,Big=x.constructor,a=x.c,// dividend
b=(y=new Big(y)).c,// divisor
k=x.s==y.s?1:-1,dp=Big.DP;if(dp!==~~dp||dp<0||dp>1e6)throw Error(INVALID_DP);
// Divisor is zero?
if(!b[0])throw Error(DIV_BY_ZERO);
// Dividend is 0? Return +-0.
if(!a[0])return y.s=k,y.c=[y.e=0],y;var bl,bt,n,cmp,ri,bz=b.slice(),ai=bl=b.length,al=a.length,r=a.slice(0,bl),// remainder
rl=r.length,q=y,// quotient
qc=q.c=[],qi=0,p=dp+(q.e=x.e-y.e)+1;// precision of the result
// Add zeros to make remainder as long as divisor.
for(q.s=k,k=p<0?0:p,
// Create version of divisor with leading zero.
bz.unshift(0);rl++<bl;)r.push(0);do{
// n is how many times the divisor goes into current remainder.
for(n=0;n<10;n++){
// Compare divisor and remainder.
if(bl!=(rl=r.length))cmp=bl>rl?1:-1;else for(ri=-1,cmp=0;++ri<bl;)if(b[ri]!=r[ri]){cmp=b[ri]>r[ri]?1:-1;break}
// If divisor < remainder, subtract divisor from remainder.
if(!(cmp<0))break;
// Remainder can't be more than 1 digit longer than divisor.
// Equalise lengths using divisor with extra leading zero?
for(bt=rl==bl?b:bz;rl;){if(r[--rl]<bt[rl]){for(ri=rl;ri&&!r[--ri];)r[ri]=9;--r[ri],r[rl]+=10}r[rl]-=bt[rl]}for(;!r[0];)r.shift()}
// Add the digit n to the result array.
qc[qi++]=cmp?n:++n,
// Update the remainder.
r[0]&&cmp?r[rl]=a[ai]||0:r=[a[ai]]}while((ai++<al||void 0!==r[0])&&k--);
// Leading zero? Do not remove if result is simply zero (qi == 1).
return qc[0]||1==qi||(
// There can't be more than one zero.
qc.shift(),q.e--,p--),
// Round?
qi>p&&round(q,p,Big.RM,void 0!==r[0]),q},
/*
   * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
   */
P.eq=function(y){return 0===this.cmp(y)},
/*
   * Return true if the value of this Big is greater than the value of Big y, otherwise return
   * false.
   */
P.gt=function(y){return this.cmp(y)>0},
/*
   * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
   * return false.
   */
P.gte=function(y){return this.cmp(y)>-1},
/*
   * Return true if the value of this Big is less than the value of Big y, otherwise return false.
   */
P.lt=function(y){return this.cmp(y)<0},
/*
   * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
   * return false.
   */
P.lte=function(y){return this.cmp(y)<1},
/*
   * Return a new Big whose value is the value of this Big minus the value of Big y.
   */
P.minus=P.sub=function(y){var i,j,t,xlty,x=this,Big=x.constructor,a=x.s,b=(y=new Big(y)).s;
// Signs differ?
if(a!=b)return y.s=-b,x.plus(y);var xc=x.c.slice(),xe=x.e,yc=y.c,ye=y.e;
// Either zero?
if(!xc[0]||!yc[0])return yc[0]?y.s=-b:xc[0]?y=new Big(x):y.s=1,y;
// Determine which is the bigger number. Prepend zeros to equalise exponents.
if(a=xe-ye){for((xlty=a<0)?(a=-a,t=xc):(ye=xe,t=yc),t.reverse(),b=a;b--;)t.push(0);t.reverse()}else for(
// Exponents equal. Check digit by digit.
j=((xlty=xc.length<yc.length)?xc:yc).length,a=b=0;b<j;b++)if(xc[b]!=yc[b]){xlty=xc[b]<yc[b];break}
// x < y? Point xc to the array of the bigger number.
/*
     * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
     * needs to start at yc.length.
     */
if(xlty&&(t=xc,xc=yc,yc=t,y.s=-y.s),(b=(j=yc.length)-(i=xc.length))>0)for(;b--;)xc[i++]=0;
// Subtract yc from xc.
for(b=i;j>a;){if(xc[--j]<yc[j]){for(i=j;i&&!xc[--i];)xc[i]=9;--xc[i],xc[j]+=10}xc[j]-=yc[j]}
// Remove trailing zeros.
for(;0===xc[--b];)xc.pop();
// Remove leading zeros and adjust exponent accordingly.
for(;0===xc[0];)xc.shift(),--ye;return xc[0]||(
// n - n = +0
y.s=1,
// Result must be zero.
xc=[ye=0]),y.c=xc,y.e=ye,y},
/*
   * Return a new Big whose value is the value of this Big modulo the value of Big y.
   */
P.mod=function(y){var ygtx,x=this,Big=x.constructor,a=x.s,b=(y=new Big(y)).s;if(!y.c[0])throw Error(DIV_BY_ZERO);return x.s=y.s=1,ygtx=1==y.cmp(x),x.s=a,y.s=b,ygtx?new Big(x):(a=Big.DP,b=Big.RM,Big.DP=Big.RM=0,x=x.div(y),Big.DP=a,Big.RM=b,this.minus(x.times(y)))},
/*
   * Return a new Big whose value is the value of this Big negated.
   */
P.neg=function(){var x=new this.constructor(this);return x.s=-x.s,x},
/*
   * Return a new Big whose value is the value of this Big plus the value of Big y.
   */
P.plus=P.add=function(y){var e,k,t,x=this,Big=x.constructor;
// Signs differ?
if(y=new Big(y),x.s!=y.s)return y.s=-y.s,x.minus(y);var xe=x.e,xc=x.c,ye=y.e,yc=y.c;
// Either zero?
if(!xc[0]||!yc[0])return yc[0]||(xc[0]?y=new Big(x):y.s=x.s),y;
// Prepend zeros to equalise exponents.
// Note: reverse faster than unshifts.
if(xc=xc.slice(),e=xe-ye){for(e>0?(ye=xe,t=yc):(e=-e,t=xc),t.reverse();e--;)t.push(0);t.reverse()}
// Point xc to the longer array.
// Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
for(xc.length-yc.length<0&&(t=yc,yc=xc,xc=t),e=yc.length,k=0;e;xc[e]%=10)k=(xc[--e]=xc[e]+yc[e]+k)/10|0;
// No need to check for zero, as +x + +y != 0 && -x + -y != 0
// Remove trailing zeros.
for(k&&(xc.unshift(k),++ye),e=xc.length;0===xc[--e];)xc.pop();return y.c=xc,y.e=ye,y},
/*
   * Return a Big whose value is the value of this Big raised to the power n.
   * If n is negative, round to a maximum of Big.DP decimal places using rounding
   * mode Big.RM.
   *
   * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
   */
P.pow=function(n){var x=this,one=new x.constructor("1"),y=one,isneg=n<0;if(n!==~~n||n<-1e6||n>1e6)throw Error(INVALID+"exponent");for(isneg&&(n=-n);1&n&&(y=y.times(x)),n>>=1;)x=x.times(x);return isneg?one.div(y):y},
/*
   * Return a new Big whose value is the value of this Big rounded to a maximum precision of sd
   * significant digits using rounding mode rm, or Big.RM if rm is not specified.
   *
   * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
   * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   */
P.prec=function(sd,rm){if(sd!==~~sd||sd<1||sd>1e6)throw Error(INVALID+"precision");return round(new this.constructor(this),sd,rm)},
/*
   * Return a new Big whose value is the value of this Big rounded to a maximum of dp decimal places
   * using rounding mode rm, or Big.RM if rm is not specified.
   * If dp is negative, round to an integer which is a multiple of 10**-dp.
   * If dp is not specified, round to 0 decimal places.
   *
   * dp? {number} Integer, -MAX_DP to MAX_DP inclusive.
   * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   */
P.round=function(dp,rm){if(void 0===dp)dp=0;else if(dp!==~~dp||dp<-1e6||dp>1e6)throw Error(INVALID_DP);return round(new this.constructor(this),dp+this.e+1,rm)},
/*
   * Return a new Big whose value is the square root of the value of this Big, rounded, if
   * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
P.sqrt=function(){var r,c,t,x=this,Big=x.constructor,s=x.s,e=x.e,half=new Big("0.5");
// Zero?
if(!x.c[0])return new Big(x);
// Negative?
if(s<0)throw Error(NAME+"No square root");
// Estimate.
// Math.sqrt underflow/overflow?
// Re-estimate: pass x coefficient to Math.sqrt as integer, then adjust the result exponent.
0===(s=Math.sqrt(+stringify(x,!0,!0)))||s===1/0?((c=x.c.join("")).length+e&1||(c+="0"),e=((e+1)/2|0)-(e<0||1&e),r=new Big(((s=Math.sqrt(c))==1/0?"5e":(s=s.toExponential()).slice(0,s.indexOf("e")+1))+e)):r=new Big(s+""),e=r.e+(Big.DP+=4);
// Newton-Raphson iteration.
do{t=r,r=half.times(t.plus(x.div(t)))}while(t.c.slice(0,e).join("")!==r.c.slice(0,e).join(""));return round(r,(Big.DP-=4)+r.e+1,Big.RM)},
/*
   * Return a new Big whose value is the value of this Big times the value of Big y.
   */
P.times=P.mul=function(y){var c,x=this,Big=x.constructor,xc=x.c,yc=(y=new Big(y)).c,a=xc.length,b=yc.length,i=x.e,j=y.e;
// Determine sign of result.
// Return signed 0 if either 0.
if(y.s=x.s==y.s?1:-1,!xc[0]||!yc[0])return y.c=[y.e=0],y;
// Initialise exponent of result as x.e + y.e.
// Initialise coefficient array of result with zeros.
for(y.e=i+j,
// If array xc has fewer digits than yc, swap xc and yc, and lengths.
a<b&&(c=xc,xc=yc,yc=c,j=a,a=b,b=j),c=new Array(j=a+b);j--;)c[j]=0;
// Multiply.
// i is initially xc.length.
for(i=b;i--;){
// a is yc.length.
for(b=0,j=a+i;j>i;)
// Current sum of products at this digit position, plus carry.
b=c[j]+yc[i]*xc[j-i-1]+b,c[j--]=b%10,
// carry
b=b/10|0;c[j]=b}
// Increment result exponent if there is a final carry, otherwise remove leading zero.
// Remove trailing zeros.
for(b?++y.e:c.shift(),i=c.length;!c[--i];)c.pop();return y.c=c,y},
/*
   * Return a string representing the value of this Big in exponential notation rounded to dp fixed
   * decimal places using rounding mode rm, or Big.RM if rm is not specified.
   *
   * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
   * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   */
P.toExponential=function(dp,rm){var x=this,n=x.c[0];if(void 0!==dp){if(dp!==~~dp||dp<0||dp>1e6)throw Error(INVALID_DP);for(x=round(new x.constructor(x),++dp,rm);x.c.length<dp;)x.c.push(0)}return stringify(x,!0,!!n)},
/*
   * Return a string representing the value of this Big in normal notation rounded to dp fixed
   * decimal places using rounding mode rm, or Big.RM if rm is not specified.
   *
   * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
   * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   *
   * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
   * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
   */
P.toFixed=function(dp,rm){var x=this,n=x.c[0];if(void 0!==dp){if(dp!==~~dp||dp<0||dp>1e6)throw Error(INVALID_DP);
// x.e may have changed if the value is rounded up.
for(dp=dp+(x=round(new x.constructor(x),dp+x.e+1,rm)).e+1;x.c.length<dp;)x.c.push(0)}return stringify(x,!1,!!n)},
/*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Omit the sign for negative zero.
   */
P.toJSON=P.toString=function(){var x=this,Big=x.constructor;return stringify(x,x.e<=Big.NE||x.e>=Big.PE,!!x.c[0])},
/*
   * Return the value of this Big as a primitve number.
   */
P.toNumber=function(){var n=+stringify(this,!0,!0);if(!0===this.constructor.strict&&!this.eq(n.toString()))throw Error(NAME+"Imprecise conversion");return n},
/*
   * Return a string representing the value of this Big rounded to sd significant digits using
   * rounding mode rm, or Big.RM if rm is not specified.
   * Use exponential notation if sd is less than the number of digits necessary to represent
   * the integer part of the value in normal notation.
   *
   * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
   * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   */
P.toPrecision=function(sd,rm){var x=this,Big=x.constructor,n=x.c[0];if(void 0!==sd){if(sd!==~~sd||sd<1||sd>1e6)throw Error(INVALID+"precision");for(x=round(new Big(x),sd,rm);x.c.length<sd;)x.c.push(0)}return stringify(x,sd<=x.e||x.e<=Big.NE||x.e>=Big.PE,!!n)},
/*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Include the sign for negative zero.
   */
P.valueOf=function(){var x=this,Big=x.constructor;if(!0===Big.strict)throw Error(NAME+"valueOf disallowed");return stringify(x,x.e<=Big.NE||x.e>=Big.PE,!0)},
// Export
Big=function _Big_(){
/*
     * The Big constructor and exported function.
     * Create and return a new instance of a Big number object.
     *
     * n {number|string|Big} A numeric value.
     */
function Big(n){var x=this;
// Enable constructor usage without new.
if(!(x instanceof Big))return void 0===n?_Big_():new Big(n);
// Duplicate.
if(n instanceof Big)x.s=n.s,x.e=n.e,x.c=n.c.slice();else{if("string"!=typeof n){if(!0===Big.strict&&"bigint"!=typeof n)throw TypeError(INVALID+"value");
// Minus zero?
n=0===n&&1/n<0?"-0":String(n)}!
/*
   * Parse the number or string value passed to a Big constructor.
   *
   * x {Big} A Big number instance.
   * n {number|string} A numeric value.
   */
function(x,n){var e,i,nl;if(!NUMERIC.test(n))throw Error(INVALID+"number");
// Determine sign.
// Decimal point?
x.s="-"==n.charAt(0)?(n=n.slice(1),-1):1,(e=n.indexOf("."))>-1&&(n=n.replace(".",""));
// Exponential form?
(i=n.search(/e/i))>0?(
// Determine exponent.
e<0&&(e=i),e+=+n.slice(i+1),n=n.substring(0,i)):e<0&&(
// Integer.
e=n.length);
// Determine leading zeros.
for(nl=n.length,i=0;i<nl&&"0"==n.charAt(i);)++i;if(i==nl)
// Zero.
x.c=[x.e=0];else{
// Determine trailing zeros.
for(;nl>0&&"0"==n.charAt(--nl););
// Convert string to array of digits without leading/trailing zeros.
for(x.e=e-i-1,x.c=[],e=0;i<=nl;)x.c[e++]=+n.charAt(i++)}}(x,n)}
// Retain a reference to this Big constructor.
// Shadow Big.prototype.constructor which points to Object.
x.constructor=Big}return Big.prototype=P,Big.DP=20,Big.RM=1,Big.NE=-7,Big.PE=21,Big.strict=false,Big.roundDown=0,Big.roundHalfUp=1,Big.roundHalfEven=2,Big.roundUp=3,Big}(),Big.default=Big.Big=Big,void 0===(__WEBPACK_AMD_DEFINE_RESULT__=function(){return Big}.call(exports,__webpack_require__,exports,module))||(module.exports=__WEBPACK_AMD_DEFINE_RESULT__)}()},
/***/3144(module,__unused_webpack_exports,__webpack_require__){"use strict";var bind=__webpack_require__(6743),$apply=__webpack_require__(1002),$call=__webpack_require__(76),$reflectApply=__webpack_require__(7119);
/** @type {import('./actualApply')} */
module.exports=$reflectApply||bind.call($call,$apply)},
/***/1002(module){"use strict";
/** @type {import('./functionApply')} */module.exports=Function.prototype.apply},
/***/76(module){"use strict";
/** @type {import('./functionCall')} */module.exports=Function.prototype.call},
/***/3126(module,__unused_webpack_exports,__webpack_require__){"use strict";var bind=__webpack_require__(6743),$TypeError=__webpack_require__(9675),$call=__webpack_require__(76),$actualApply=__webpack_require__(3144);
/** @type {(args: [Function, thisArg?: unknown, ...args: unknown[]]) => Function} TODO FIXME, find a way to use import('.') */
module.exports=function(args){if(args.length<1||"function"!=typeof args[0])throw new $TypeError("a function is required");return $actualApply(bind,$call,args)}},
/***/7119(module){"use strict";
/** @type {import('./reflectApply')} */module.exports="undefined"!=typeof Reflect&&Reflect&&Reflect.apply},
/***/6556(module,__unused_webpack_exports,__webpack_require__){"use strict";var GetIntrinsic=__webpack_require__(453),callBindBasic=__webpack_require__(3126),$indexOf=callBindBasic([GetIntrinsic("%String.prototype.indexOf%")]);
/** @type {import('.')} */
module.exports=function(name,allowMissing){
/* eslint no-extra-parens: 0 */
var intrinsic=/** @type {(this: unknown, ...args: unknown[]) => unknown} */GetIntrinsic(name,!!allowMissing);return"function"==typeof intrinsic&&$indexOf(name,".prototype.")>-1?callBindBasic(/** @type {const} */[intrinsic]):intrinsic}},
/***/7176(module,__unused_webpack_exports,__webpack_require__){"use strict";var hasProtoAccessor,callBind=__webpack_require__(3126),gOPD=__webpack_require__(5795);try{
// eslint-disable-next-line no-extra-parens, no-proto
hasProtoAccessor=/** @type {{ __proto__?: typeof Array.prototype }} */[].__proto__===Array.prototype}catch(e){if(!e||"object"!=typeof e||!("code"in e)||"ERR_PROTO_ACCESS"!==e.code)throw e}
// eslint-disable-next-line no-extra-parens
var desc=!!hasProtoAccessor&&gOPD&&gOPD(Object.prototype,/** @type {keyof typeof Object.prototype} */"__proto__"),$Object=Object,$getPrototypeOf=$Object.getPrototypeOf;
/** @type {import('./get')} */
module.exports=desc&&"function"==typeof desc.get?callBind([desc.get]):"function"==typeof $getPrototypeOf&&/** @type {import('./get')} */function(value){
// eslint-disable-next-line eqeqeq
return $getPrototypeOf(null==value?value:$Object(value))}},
/***/655(module){"use strict";
/** @type {import('.')} */var $defineProperty=Object.defineProperty||!1;if($defineProperty)try{$defineProperty({},"a",{value:1})}catch(e){
// IE 8 has a broken defineProperty
$defineProperty=!1}module.exports=$defineProperty},
/***/1237(module){"use strict";
/** @type {import('./eval')} */module.exports=EvalError},
/***/9383(module){"use strict";
/** @type {import('.')} */module.exports=Error},
/***/9290(module){"use strict";
/** @type {import('./range')} */module.exports=RangeError},
/***/9538(module){"use strict";
/** @type {import('./ref')} */module.exports=ReferenceError},
/***/8068(module){"use strict";
/** @type {import('./syntax')} */module.exports=SyntaxError},
/***/9675(module){"use strict";
/** @type {import('./type')} */module.exports=TypeError},
/***/5345(module){"use strict";
/** @type {import('./uri')} */module.exports=URIError},
/***/9612(module){"use strict";
/** @type {import('.')} */module.exports=Object},
/***/9353(module){"use strict";
/* eslint no-invalid-this: 1 */var toStr=Object.prototype.toString,max=Math.max,concatty=function(a,b){for(var arr=[],i=0;i<a.length;i+=1)arr[i]=a[i];for(var j=0;j<b.length;j+=1)arr[j+a.length]=b[j];return arr};module.exports=function(that){var target=this;if("function"!=typeof target||"[object Function]"!==toStr.apply(target))throw new TypeError("Function.prototype.bind called on incompatible "+target);for(var bound,args=function(arrLike,offset){for(var arr=[],i=offset||0,j=0;i<arrLike.length;i+=1,j+=1)arr[j]=arrLike[i];return arr}(arguments,1),boundLength=max(0,target.length-args.length),boundArgs=[],i=0;i<boundLength;i++)boundArgs[i]="$"+i;if(bound=Function("binder","return function ("+function(arr,joiner){for(var str="",i=0;i<arr.length;i+=1)str+=arr[i],i+1<arr.length&&(str+=joiner);return str}(boundArgs,",")+"){ return binder.apply(this,arguments); }")(function(){if(this instanceof bound){var result=target.apply(this,concatty(args,arguments));return Object(result)===result?result:this}return target.apply(that,concatty(args,arguments))}),target.prototype){var Empty=function(){};Empty.prototype=target.prototype,bound.prototype=new Empty,Empty.prototype=null}return bound}},
/***/6743(module,__unused_webpack_exports,__webpack_require__){"use strict";var implementation=__webpack_require__(9353);module.exports=Function.prototype.bind||implementation},
/***/453(module,__unused_webpack_exports,__webpack_require__){"use strict";var $Object=__webpack_require__(9612),$Error=__webpack_require__(9383),$EvalError=__webpack_require__(1237),$RangeError=__webpack_require__(9290),$ReferenceError=__webpack_require__(9538),$SyntaxError=__webpack_require__(8068),$TypeError=__webpack_require__(9675),$URIError=__webpack_require__(5345),abs=__webpack_require__(1514),floor=__webpack_require__(8968),max=__webpack_require__(6188),min=__webpack_require__(8002),pow=__webpack_require__(5880),round=__webpack_require__(414),sign=__webpack_require__(3093),$Function=Function,getEvalledConstructor=function(expressionSyntax){try{return $Function('"use strict"; return ('+expressionSyntax+").constructor;")()}catch(e){}},$gOPD=__webpack_require__(5795),$defineProperty=__webpack_require__(655),throwTypeError=function(){throw new $TypeError},ThrowTypeError=$gOPD?function(){try{// IE 8 does not throw here
return throwTypeError}catch(calleeThrows){try{
// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
return $gOPD(arguments,"callee").get}catch(gOPDthrows){return throwTypeError}}}():throwTypeError,hasSymbols=__webpack_require__(4039)(),getProto=__webpack_require__(3628),$ObjectGPO=__webpack_require__(1064),$ReflectGPO=__webpack_require__(8648),$apply=__webpack_require__(1002),$call=__webpack_require__(76),needsEval={},TypedArray="undefined"!=typeof Uint8Array&&getProto?getProto(Uint8Array):void 0,INTRINSICS={__proto__:null,"%AggregateError%":"undefined"==typeof AggregateError?void 0:AggregateError,"%Array%":Array,"%ArrayBuffer%":"undefined"==typeof ArrayBuffer?void 0:ArrayBuffer,"%ArrayIteratorPrototype%":hasSymbols&&getProto?getProto([][Symbol.iterator]()):void 0,"%AsyncFromSyncIteratorPrototype%":void 0,"%AsyncFunction%":needsEval,"%AsyncGenerator%":needsEval,"%AsyncGeneratorFunction%":needsEval,"%AsyncIteratorPrototype%":needsEval,"%Atomics%":"undefined"==typeof Atomics?void 0:Atomics,"%BigInt%":"undefined"==typeof BigInt?void 0:BigInt,"%BigInt64Array%":"undefined"==typeof BigInt64Array?void 0:BigInt64Array,"%BigUint64Array%":"undefined"==typeof BigUint64Array?void 0:BigUint64Array,"%Boolean%":Boolean,"%DataView%":"undefined"==typeof DataView?void 0:DataView,"%Date%":Date,"%decodeURI%":decodeURI,"%decodeURIComponent%":decodeURIComponent,"%encodeURI%":encodeURI,"%encodeURIComponent%":encodeURIComponent,"%Error%":$Error,"%eval%":eval,// eslint-disable-line no-eval
"%EvalError%":$EvalError,"%Float16Array%":"undefined"==typeof Float16Array?void 0:Float16Array,"%Float32Array%":"undefined"==typeof Float32Array?void 0:Float32Array,"%Float64Array%":"undefined"==typeof Float64Array?void 0:Float64Array,"%FinalizationRegistry%":"undefined"==typeof FinalizationRegistry?void 0:FinalizationRegistry,"%Function%":$Function,"%GeneratorFunction%":needsEval,"%Int8Array%":"undefined"==typeof Int8Array?void 0:Int8Array,"%Int16Array%":"undefined"==typeof Int16Array?void 0:Int16Array,"%Int32Array%":"undefined"==typeof Int32Array?void 0:Int32Array,"%isFinite%":isFinite,"%isNaN%":isNaN,"%IteratorPrototype%":hasSymbols&&getProto?getProto(getProto([][Symbol.iterator]())):void 0,"%JSON%":"object"==typeof JSON?JSON:void 0,"%Map%":"undefined"==typeof Map?void 0:Map,"%MapIteratorPrototype%":"undefined"!=typeof Map&&hasSymbols&&getProto?getProto((new Map)[Symbol.iterator]()):void 0,"%Math%":Math,"%Number%":Number,"%Object%":$Object,"%Object.getOwnPropertyDescriptor%":$gOPD,"%parseFloat%":parseFloat,"%parseInt%":parseInt,"%Promise%":"undefined"==typeof Promise?void 0:Promise,"%Proxy%":"undefined"==typeof Proxy?void 0:Proxy,"%RangeError%":$RangeError,"%ReferenceError%":$ReferenceError,"%Reflect%":"undefined"==typeof Reflect?void 0:Reflect,"%RegExp%":RegExp,"%Set%":"undefined"==typeof Set?void 0:Set,"%SetIteratorPrototype%":"undefined"!=typeof Set&&hasSymbols&&getProto?getProto((new Set)[Symbol.iterator]()):void 0,"%SharedArrayBuffer%":"undefined"==typeof SharedArrayBuffer?void 0:SharedArrayBuffer,"%String%":String,"%StringIteratorPrototype%":hasSymbols&&getProto?getProto(""[Symbol.iterator]()):void 0,"%Symbol%":hasSymbols?Symbol:void 0,"%SyntaxError%":$SyntaxError,"%ThrowTypeError%":ThrowTypeError,"%TypedArray%":TypedArray,"%TypeError%":$TypeError,"%Uint8Array%":"undefined"==typeof Uint8Array?void 0:Uint8Array,"%Uint8ClampedArray%":"undefined"==typeof Uint8ClampedArray?void 0:Uint8ClampedArray,"%Uint16Array%":"undefined"==typeof Uint16Array?void 0:Uint16Array,"%Uint32Array%":"undefined"==typeof Uint32Array?void 0:Uint32Array,"%URIError%":$URIError,"%WeakMap%":"undefined"==typeof WeakMap?void 0:WeakMap,"%WeakRef%":"undefined"==typeof WeakRef?void 0:WeakRef,"%WeakSet%":"undefined"==typeof WeakSet?void 0:WeakSet,"%Function.prototype.call%":$call,"%Function.prototype.apply%":$apply,"%Object.defineProperty%":$defineProperty,"%Object.getPrototypeOf%":$ObjectGPO,"%Math.abs%":abs,"%Math.floor%":floor,"%Math.max%":max,"%Math.min%":min,"%Math.pow%":pow,"%Math.round%":round,"%Math.sign%":sign,"%Reflect.getPrototypeOf%":$ReflectGPO};if(getProto)try{null.error;// eslint-disable-line no-unused-expressions
}catch(e){
// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
var errorProto=getProto(getProto(e));INTRINSICS["%Error.prototype%"]=errorProto}var doEval=function doEval(name){var value;if("%AsyncFunction%"===name)value=getEvalledConstructor("async function () {}");else if("%GeneratorFunction%"===name)value=getEvalledConstructor("function* () {}");else if("%AsyncGeneratorFunction%"===name)value=getEvalledConstructor("async function* () {}");else if("%AsyncGenerator%"===name){var fn=doEval("%AsyncGeneratorFunction%");fn&&(value=fn.prototype)}else if("%AsyncIteratorPrototype%"===name){var gen=doEval("%AsyncGenerator%");gen&&getProto&&(value=getProto(gen.prototype))}return INTRINSICS[name]=value,value},LEGACY_ALIASES={__proto__:null,"%ArrayBufferPrototype%":["ArrayBuffer","prototype"],"%ArrayPrototype%":["Array","prototype"],"%ArrayProto_entries%":["Array","prototype","entries"],"%ArrayProto_forEach%":["Array","prototype","forEach"],"%ArrayProto_keys%":["Array","prototype","keys"],"%ArrayProto_values%":["Array","prototype","values"],"%AsyncFunctionPrototype%":["AsyncFunction","prototype"],"%AsyncGenerator%":["AsyncGeneratorFunction","prototype"],"%AsyncGeneratorPrototype%":["AsyncGeneratorFunction","prototype","prototype"],"%BooleanPrototype%":["Boolean","prototype"],"%DataViewPrototype%":["DataView","prototype"],"%DatePrototype%":["Date","prototype"],"%ErrorPrototype%":["Error","prototype"],"%EvalErrorPrototype%":["EvalError","prototype"],"%Float32ArrayPrototype%":["Float32Array","prototype"],"%Float64ArrayPrototype%":["Float64Array","prototype"],"%FunctionPrototype%":["Function","prototype"],"%Generator%":["GeneratorFunction","prototype"],"%GeneratorPrototype%":["GeneratorFunction","prototype","prototype"],"%Int8ArrayPrototype%":["Int8Array","prototype"],"%Int16ArrayPrototype%":["Int16Array","prototype"],"%Int32ArrayPrototype%":["Int32Array","prototype"],"%JSONParse%":["JSON","parse"],"%JSONStringify%":["JSON","stringify"],"%MapPrototype%":["Map","prototype"],"%NumberPrototype%":["Number","prototype"],"%ObjectPrototype%":["Object","prototype"],"%ObjProto_toString%":["Object","prototype","toString"],"%ObjProto_valueOf%":["Object","prototype","valueOf"],"%PromisePrototype%":["Promise","prototype"],"%PromiseProto_then%":["Promise","prototype","then"],"%Promise_all%":["Promise","all"],"%Promise_reject%":["Promise","reject"],"%Promise_resolve%":["Promise","resolve"],"%RangeErrorPrototype%":["RangeError","prototype"],"%ReferenceErrorPrototype%":["ReferenceError","prototype"],"%RegExpPrototype%":["RegExp","prototype"],"%SetPrototype%":["Set","prototype"],"%SharedArrayBufferPrototype%":["SharedArrayBuffer","prototype"],"%StringPrototype%":["String","prototype"],"%SymbolPrototype%":["Symbol","prototype"],"%SyntaxErrorPrototype%":["SyntaxError","prototype"],"%TypedArrayPrototype%":["TypedArray","prototype"],"%TypeErrorPrototype%":["TypeError","prototype"],"%Uint8ArrayPrototype%":["Uint8Array","prototype"],"%Uint8ClampedArrayPrototype%":["Uint8ClampedArray","prototype"],"%Uint16ArrayPrototype%":["Uint16Array","prototype"],"%Uint32ArrayPrototype%":["Uint32Array","prototype"],"%URIErrorPrototype%":["URIError","prototype"],"%WeakMapPrototype%":["WeakMap","prototype"],"%WeakSetPrototype%":["WeakSet","prototype"]},bind=__webpack_require__(6743),hasOwn=__webpack_require__(9957),$concat=bind.call($call,Array.prototype.concat),$spliceApply=bind.call($apply,Array.prototype.splice),$replace=bind.call($call,String.prototype.replace),$strSlice=bind.call($call,String.prototype.slice),$exec=bind.call($call,RegExp.prototype.exec),rePropName=/[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g,reEscapeChar=/\\(\\)?/g,getBaseIntrinsic=function(name,allowMissing){var alias,intrinsicName=name;if(hasOwn(LEGACY_ALIASES,intrinsicName)&&(intrinsicName="%"+(alias=LEGACY_ALIASES[intrinsicName])[0]+"%"),hasOwn(INTRINSICS,intrinsicName)){var value=INTRINSICS[intrinsicName];if(value===needsEval&&(value=doEval(intrinsicName)),void 0===value&&!allowMissing)throw new $TypeError("intrinsic "+name+" exists, but is not available. Please file an issue!");return{alias,name:intrinsicName,value}}throw new $SyntaxError("intrinsic "+name+" does not exist!")};module.exports=function(name,allowMissing){if("string"!=typeof name||0===name.length)throw new $TypeError("intrinsic name must be a non-empty string");if(arguments.length>1&&"boolean"!=typeof allowMissing)throw new $TypeError('"allowMissing" argument must be a boolean');if(null===$exec(/^%?[^%]*%?$/,name))throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");var parts=function(string){var first=$strSlice(string,0,1),last=$strSlice(string,-1);if("%"===first&&"%"!==last)throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");if("%"===last&&"%"!==first)throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");var result=[];return $replace(string,rePropName,function(match,number,quote,subString){result[result.length]=quote?$replace(subString,reEscapeChar,"$1"):number||match}),result}(name),intrinsicBaseName=parts.length>0?parts[0]:"",intrinsic=getBaseIntrinsic("%"+intrinsicBaseName+"%",allowMissing),intrinsicRealName=intrinsic.name,value=intrinsic.value,skipFurtherCaching=!1,alias=intrinsic.alias;alias&&(intrinsicBaseName=alias[0],$spliceApply(parts,$concat([0,1],alias)));for(var i=1,isOwn=!0;i<parts.length;i+=1){var part=parts[i],first=$strSlice(part,0,1),last=$strSlice(part,-1);if(('"'===first||"'"===first||"`"===first||'"'===last||"'"===last||"`"===last)&&first!==last)throw new $SyntaxError("property names with quotes must have matching quotes");if("constructor"!==part&&isOwn||(skipFurtherCaching=!0),hasOwn(INTRINSICS,intrinsicRealName="%"+(intrinsicBaseName+="."+part)+"%"))value=INTRINSICS[intrinsicRealName];else if(null!=value){if(!(part in value)){if(!allowMissing)throw new $TypeError("base intrinsic for "+name+" exists, but the property is not available.");return}if($gOPD&&i+1>=parts.length){var desc=$gOPD(value,part);
// By convention, when a data property is converted to an accessor
// property to emulate a data property that does not suffer from
// the override mistake, that accessor's getter is marked with
// an `originalValue` property. Here, when we detect this, we
// uphold the illusion by pretending to see that original data
// property, i.e., returning the value rather than the getter
// itself.
value=(isOwn=!!desc)&&"get"in desc&&!("originalValue"in desc.get)?desc.get:value[part]}else isOwn=hasOwn(value,part),value=value[part];isOwn&&!skipFurtherCaching&&(INTRINSICS[intrinsicRealName]=value)}}return value}},
/***/1064(module,__unused_webpack_exports,__webpack_require__){"use strict";var $Object=__webpack_require__(9612);
/** @type {import('./Object.getPrototypeOf')} */module.exports=$Object.getPrototypeOf||null},
/***/8648(module){"use strict";
/** @type {import('./Reflect.getPrototypeOf')} */module.exports="undefined"!=typeof Reflect&&Reflect.getPrototypeOf||null},
/***/3628(module,__unused_webpack_exports,__webpack_require__){"use strict";var reflectGetProto=__webpack_require__(8648),originalGetProto=__webpack_require__(1064),getDunderProto=__webpack_require__(7176);
/** @type {import('.')} */
module.exports=reflectGetProto?function(O){
// @ts-expect-error TS can't narrow inside a closure, for some reason
return reflectGetProto(O)}:originalGetProto?function(O){if(!O||"object"!=typeof O&&"function"!=typeof O)throw new TypeError("getProto: not an object");
// @ts-expect-error TS can't narrow inside a closure, for some reason
return originalGetProto(O)}:getDunderProto?function(O){
// @ts-expect-error TS can't narrow inside a closure, for some reason
return getDunderProto(O)}:null},
/***/6549(module){"use strict";
/** @type {import('./gOPD')} */module.exports=Object.getOwnPropertyDescriptor},
/***/5795(module,__unused_webpack_exports,__webpack_require__){"use strict";
/** @type {import('.')} */var $gOPD=__webpack_require__(6549);if($gOPD)try{$gOPD([],"length")}catch(e){
// IE 8 has a broken gOPD
$gOPD=null}module.exports=$gOPD},
/***/4039(module,__unused_webpack_exports,__webpack_require__){"use strict";var origSymbol="undefined"!=typeof Symbol&&Symbol,hasSymbolSham=__webpack_require__(1333);
/** @type {import('.')} */
module.exports=function(){return"function"==typeof origSymbol&&("function"==typeof Symbol&&("symbol"==typeof origSymbol("foo")&&("symbol"==typeof Symbol("bar")&&hasSymbolSham())))}},
/***/1333(module){"use strict";
/** @type {import('./shams')} */
/* eslint complexity: [2, 18], max-statements: [2, 33] */module.exports=function(){if("function"!=typeof Symbol||"function"!=typeof Object.getOwnPropertySymbols)return!1;if("symbol"==typeof Symbol.iterator)return!0;
/** @type {{ [k in symbol]?: unknown }} */var obj={},sym=Symbol("test"),symObj=Object(sym);if("string"==typeof sym)return!1;if("[object Symbol]"!==Object.prototype.toString.call(sym))return!1;if("[object Symbol]"!==Object.prototype.toString.call(symObj))return!1;
// temp disabled per https://github.com/ljharb/object.assign/issues/17
// if (sym instanceof Symbol) { return false; }
// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
// if (!(symObj instanceof Symbol)) { return false; }
// if (typeof Symbol.prototype.toString !== 'function') { return false; }
// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }
for(var _ in obj[sym]=42,obj)return!1;// eslint-disable-line no-restricted-syntax, no-unreachable-loop
if("function"==typeof Object.keys&&0!==Object.keys(obj).length)return!1;if("function"==typeof Object.getOwnPropertyNames&&0!==Object.getOwnPropertyNames(obj).length)return!1;var syms=Object.getOwnPropertySymbols(obj);if(1!==syms.length||syms[0]!==sym)return!1;if(!Object.prototype.propertyIsEnumerable.call(obj,sym))return!1;if("function"==typeof Object.getOwnPropertyDescriptor){
// eslint-disable-next-line no-extra-parens
var descriptor=/** @type {PropertyDescriptor} */Object.getOwnPropertyDescriptor(obj,sym);if(42!==descriptor.value||!0!==descriptor.enumerable)return!1}return!0}},
/***/9957(module,__unused_webpack_exports,__webpack_require__){"use strict";var call=Function.prototype.call,$hasOwn=Object.prototype.hasOwnProperty,bind=__webpack_require__(6743);
/** @type {import('.')} */
module.exports=bind.call(call,$hasOwn)},
/***/1514(module){"use strict";
/** @type {import('./abs')} */module.exports=Math.abs},
/***/8968(module){"use strict";
/** @type {import('./floor')} */module.exports=Math.floor},
/***/4459(module){"use strict";
/** @type {import('./isNaN')} */module.exports=Number.isNaN||function(a){return a!=a}},
/***/6188(module){"use strict";
/** @type {import('./max')} */module.exports=Math.max},
/***/8002(module){"use strict";
/** @type {import('./min')} */module.exports=Math.min},
/***/5880(module){"use strict";
/** @type {import('./pow')} */module.exports=Math.pow},
/***/414(module){"use strict";
/** @type {import('./round')} */module.exports=Math.round},
/***/3093(module,__unused_webpack_exports,__webpack_require__){"use strict";var $isNaN=__webpack_require__(4459);
/** @type {import('./sign')} */module.exports=function(number){return $isNaN(number)||0===number?number:number<0?-1:1}},
/***/8859(module,__unused_webpack_exports,__webpack_require__){var hasMap="function"==typeof Map&&Map.prototype,mapSizeDescriptor=Object.getOwnPropertyDescriptor&&hasMap?Object.getOwnPropertyDescriptor(Map.prototype,"size"):null,mapSize=hasMap&&mapSizeDescriptor&&"function"==typeof mapSizeDescriptor.get?mapSizeDescriptor.get:null,mapForEach=hasMap&&Map.prototype.forEach,hasSet="function"==typeof Set&&Set.prototype,setSizeDescriptor=Object.getOwnPropertyDescriptor&&hasSet?Object.getOwnPropertyDescriptor(Set.prototype,"size"):null,setSize=hasSet&&setSizeDescriptor&&"function"==typeof setSizeDescriptor.get?setSizeDescriptor.get:null,setForEach=hasSet&&Set.prototype.forEach,weakMapHas="function"==typeof WeakMap&&WeakMap.prototype?WeakMap.prototype.has:null,weakSetHas="function"==typeof WeakSet&&WeakSet.prototype?WeakSet.prototype.has:null,weakRefDeref="function"==typeof WeakRef&&WeakRef.prototype?WeakRef.prototype.deref:null,booleanValueOf=Boolean.prototype.valueOf,objectToString=Object.prototype.toString,functionToString=Function.prototype.toString,$match=String.prototype.match,$slice=String.prototype.slice,$replace=String.prototype.replace,$toUpperCase=String.prototype.toUpperCase,$toLowerCase=String.prototype.toLowerCase,$test=RegExp.prototype.test,$concat=Array.prototype.concat,$join=Array.prototype.join,$arrSlice=Array.prototype.slice,$floor=Math.floor,bigIntValueOf="function"==typeof BigInt?BigInt.prototype.valueOf:null,gOPS=Object.getOwnPropertySymbols,symToString="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?Symbol.prototype.toString:null,hasShammedSymbols="function"==typeof Symbol&&"object"==typeof Symbol.iterator,toStringTag="function"==typeof Symbol&&Symbol.toStringTag&&(typeof Symbol.toStringTag===hasShammedSymbols||"symbol")?Symbol.toStringTag:null,isEnumerable=Object.prototype.propertyIsEnumerable,gPO=("function"==typeof Reflect?Reflect.getPrototypeOf:Object.getPrototypeOf)||([].__proto__===Array.prototype?function(O){return O.__proto__;// eslint-disable-line no-proto
}:null);function addNumericSeparator(num,str){if(num===1/0||num===-1/0||num!=num||num&&num>-1e3&&num<1e3||$test.call(/e/,str))return str;var sepRegex=/[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;if("number"==typeof num){var int=num<0?-$floor(-num):$floor(num);// trunc(num)
if(int!==num){var intStr=String(int),dec=$slice.call(str,intStr.length+1);return $replace.call(intStr,sepRegex,"$&_")+"."+$replace.call($replace.call(dec,/([0-9]{3})/g,"$&_"),/_$/,"")}}return $replace.call(str,sepRegex,"$&_")}var utilInspect=__webpack_require__(2634),inspectCustom=utilInspect.custom,inspectSymbol=isSymbol(inspectCustom)?inspectCustom:null,quotes={__proto__:null,double:'"',single:"'"},quoteREs={__proto__:null,double:/(["\\])/g,single:/(['\\])/g};function wrapQuotes(s,defaultStyle,opts){var style=opts.quoteStyle||defaultStyle,quoteChar=quotes[style];return quoteChar+s+quoteChar}function quote(s){return $replace.call(String(s),/"/g,"&quot;")}function canTrustToString(obj){return!toStringTag||!("object"==typeof obj&&(toStringTag in obj||void 0!==obj[toStringTag]))}function isArray(obj){return"[object Array]"===toStr(obj)&&canTrustToString(obj)}function isRegExp(obj){return"[object RegExp]"===toStr(obj)&&canTrustToString(obj)}
// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol(obj){if(hasShammedSymbols)return obj&&"object"==typeof obj&&obj instanceof Symbol;if("symbol"==typeof obj)return!0;if(!obj||"object"!=typeof obj||!symToString)return!1;try{return symToString.call(obj),!0}catch(e){}return!1}module.exports=function inspect_(obj,options,depth,seen){var opts=options||{};if(has(opts,"quoteStyle")&&!has(quotes,opts.quoteStyle))throw new TypeError('option "quoteStyle" must be "single" or "double"');if(has(opts,"maxStringLength")&&("number"==typeof opts.maxStringLength?opts.maxStringLength<0&&opts.maxStringLength!==1/0:null!==opts.maxStringLength))throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');var customInspect=!has(opts,"customInspect")||opts.customInspect;if("boolean"!=typeof customInspect&&"symbol"!==customInspect)throw new TypeError("option \"customInspect\", if provided, must be `true`, `false`, or `'symbol'`");if(has(opts,"indent")&&null!==opts.indent&&"\t"!==opts.indent&&!(parseInt(opts.indent,10)===opts.indent&&opts.indent>0))throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');if(has(opts,"numericSeparator")&&"boolean"!=typeof opts.numericSeparator)throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');var numericSeparator=opts.numericSeparator;if(void 0===obj)return"undefined";if(null===obj)return"null";if("boolean"==typeof obj)return obj?"true":"false";if("string"==typeof obj)return inspectString(obj,opts);if("number"==typeof obj){if(0===obj)return 1/0/obj>0?"0":"-0";var str=String(obj);return numericSeparator?addNumericSeparator(obj,str):str}if("bigint"==typeof obj){var bigIntStr=String(obj)+"n";return numericSeparator?addNumericSeparator(obj,bigIntStr):bigIntStr}var maxDepth=void 0===opts.depth?5:opts.depth;if(void 0===depth&&(depth=0),depth>=maxDepth&&maxDepth>0&&"object"==typeof obj)return isArray(obj)?"[Array]":"[Object]";var indent=function(opts,depth){var baseIndent;if("\t"===opts.indent)baseIndent="\t";else{if(!("number"==typeof opts.indent&&opts.indent>0))return null;baseIndent=$join.call(Array(opts.indent+1)," ")}return{base:baseIndent,prev:$join.call(Array(depth+1),baseIndent)}}(opts,depth);if(void 0===seen)seen=[];else if(indexOf(seen,obj)>=0)return"[Circular]";function inspect(value,from,noIndent){if(from&&(seen=$arrSlice.call(seen)).push(from),noIndent){var newOpts={depth:opts.depth};return has(opts,"quoteStyle")&&(newOpts.quoteStyle=opts.quoteStyle),inspect_(value,newOpts,depth+1,seen)}return inspect_(value,opts,depth+1,seen)}if("function"==typeof obj&&!isRegExp(obj)){// in older engines, regexes are callable
var name=function(f){if(f.name)return f.name;var m=$match.call(functionToString.call(f),/^function\s*([\w$]+)/);if(m)return m[1];return null}(obj),keys=arrObjKeys(obj,inspect);return"[Function"+(name?": "+name:" (anonymous)")+"]"+(keys.length>0?" { "+$join.call(keys,", ")+" }":"")}if(isSymbol(obj)){var symString=hasShammedSymbols?$replace.call(String(obj),/^(Symbol\(.*\))_[^)]*$/,"$1"):symToString.call(obj);return"object"!=typeof obj||hasShammedSymbols?symString:markBoxed(symString)}if(function(x){if(!x||"object"!=typeof x)return!1;if("undefined"!=typeof HTMLElement&&x instanceof HTMLElement)return!0;return"string"==typeof x.nodeName&&"function"==typeof x.getAttribute}(obj)){for(var s="<"+$toLowerCase.call(String(obj.nodeName)),attrs=obj.attributes||[],i=0;i<attrs.length;i++)s+=" "+attrs[i].name+"="+wrapQuotes(quote(attrs[i].value),"double",opts);return s+=">",obj.childNodes&&obj.childNodes.length&&(s+="..."),s+="</"+$toLowerCase.call(String(obj.nodeName))+">"}if(isArray(obj)){if(0===obj.length)return"[]";var xs=arrObjKeys(obj,inspect);return indent&&!function(xs){for(var i=0;i<xs.length;i++)if(indexOf(xs[i],"\n")>=0)return!1;return!0}(xs)?"["+indentedJoin(xs,indent)+"]":"[ "+$join.call(xs,", ")+" ]"}if(function(obj){return"[object Error]"===toStr(obj)&&canTrustToString(obj)}(obj)){var parts=arrObjKeys(obj,inspect);return"cause"in Error.prototype||!("cause"in obj)||isEnumerable.call(obj,"cause")?0===parts.length?"["+String(obj)+"]":"{ ["+String(obj)+"] "+$join.call(parts,", ")+" }":"{ ["+String(obj)+"] "+$join.call($concat.call("[cause]: "+inspect(obj.cause),parts),", ")+" }"}if("object"==typeof obj&&customInspect){if(inspectSymbol&&"function"==typeof obj[inspectSymbol]&&utilInspect)return utilInspect(obj,{depth:maxDepth-depth});if("symbol"!==customInspect&&"function"==typeof obj.inspect)return obj.inspect()}if(function(x){if(!mapSize||!x||"object"!=typeof x)return!1;try{mapSize.call(x);try{setSize.call(x)}catch(s){return!0}return x instanceof Map;// core-js workaround, pre-v2.5.0
}catch(e){}return!1}(obj)){var mapParts=[];return mapForEach&&mapForEach.call(obj,function(value,key){mapParts.push(inspect(key,obj,!0)+" => "+inspect(value,obj))}),collectionOf("Map",mapSize.call(obj),mapParts,indent)}if(function(x){if(!setSize||!x||"object"!=typeof x)return!1;try{setSize.call(x);try{mapSize.call(x)}catch(m){return!0}return x instanceof Set;// core-js workaround, pre-v2.5.0
}catch(e){}return!1}(obj)){var setParts=[];return setForEach&&setForEach.call(obj,function(value){setParts.push(inspect(value,obj))}),collectionOf("Set",setSize.call(obj),setParts,indent)}if(function(x){if(!weakMapHas||!x||"object"!=typeof x)return!1;try{weakMapHas.call(x,weakMapHas);try{weakSetHas.call(x,weakSetHas)}catch(s){return!0}return x instanceof WeakMap;// core-js workaround, pre-v2.5.0
}catch(e){}return!1}(obj))return weakCollectionOf("WeakMap");if(function(x){if(!weakSetHas||!x||"object"!=typeof x)return!1;try{weakSetHas.call(x,weakSetHas);try{weakMapHas.call(x,weakMapHas)}catch(s){return!0}return x instanceof WeakSet;// core-js workaround, pre-v2.5.0
}catch(e){}return!1}(obj))return weakCollectionOf("WeakSet");if(function(x){if(!weakRefDeref||!x||"object"!=typeof x)return!1;try{return weakRefDeref.call(x),!0}catch(e){}return!1}(obj))return weakCollectionOf("WeakRef");if(function(obj){return"[object Number]"===toStr(obj)&&canTrustToString(obj)}(obj))return markBoxed(inspect(Number(obj)));if(function(obj){if(!obj||"object"!=typeof obj||!bigIntValueOf)return!1;try{return bigIntValueOf.call(obj),!0}catch(e){}return!1}(obj))return markBoxed(inspect(bigIntValueOf.call(obj)));if(function(obj){return"[object Boolean]"===toStr(obj)&&canTrustToString(obj)}(obj))return markBoxed(booleanValueOf.call(obj));if(function(obj){return"[object String]"===toStr(obj)&&canTrustToString(obj)}(obj))return markBoxed(inspect(String(obj)));
// note: in IE 8, sometimes `global !== window` but both are the prototypes of each other
/* eslint-env browser */if("undefined"!=typeof window&&obj===window)return"{ [object Window] }";if("undefined"!=typeof globalThis&&obj===globalThis||void 0!==__webpack_require__.g&&obj===__webpack_require__.g)return"{ [object globalThis] }";if(!function(obj){return"[object Date]"===toStr(obj)&&canTrustToString(obj)}(obj)&&!isRegExp(obj)){var ys=arrObjKeys(obj,inspect),isPlainObject=gPO?gPO(obj)===Object.prototype:obj instanceof Object||obj.constructor===Object,protoTag=obj instanceof Object?"":"null prototype",stringTag=!isPlainObject&&toStringTag&&Object(obj)===obj&&toStringTag in obj?$slice.call(toStr(obj),8,-1):protoTag?"Object":"",tag=(isPlainObject||"function"!=typeof obj.constructor?"":obj.constructor.name?obj.constructor.name+" ":"")+(stringTag||protoTag?"["+$join.call($concat.call([],stringTag||[],protoTag||[]),": ")+"] ":"");return 0===ys.length?tag+"{}":indent?tag+"{"+indentedJoin(ys,indent)+"}":tag+"{ "+$join.call(ys,", ")+" }"}return String(obj)};var hasOwn=Object.prototype.hasOwnProperty||function(key){return key in this};function has(obj,key){return hasOwn.call(obj,key)}function toStr(obj){return objectToString.call(obj)}function indexOf(xs,x){if(xs.indexOf)return xs.indexOf(x);for(var i=0,l=xs.length;i<l;i++)if(xs[i]===x)return i;return-1}function inspectString(str,opts){if(str.length>opts.maxStringLength){var remaining=str.length-opts.maxStringLength,trailer="... "+remaining+" more character"+(remaining>1?"s":"");return inspectString($slice.call(str,0,opts.maxStringLength),opts)+trailer}var quoteRE=quoteREs[opts.quoteStyle||"single"];return quoteRE.lastIndex=0,wrapQuotes($replace.call($replace.call(str,quoteRE,"\\$1"),/[\x00-\x1f]/g,lowbyte),"single",opts)}function lowbyte(c){var n=c.charCodeAt(0),x={8:"b",9:"t",10:"n",12:"f",13:"r"}[n];return x?"\\"+x:"\\x"+(n<16?"0":"")+$toUpperCase.call(n.toString(16))}function markBoxed(str){return"Object("+str+")"}function weakCollectionOf(type){return type+" { ? }"}function collectionOf(type,size,entries,indent){return type+" ("+size+") {"+(indent?indentedJoin(entries,indent):$join.call(entries,", "))+"}"}function indentedJoin(xs,indent){if(0===xs.length)return"";var lineJoiner="\n"+indent.prev+indent.base;return lineJoiner+$join.call(xs,","+lineJoiner)+"\n"+indent.prev}function arrObjKeys(obj,inspect){var isArr=isArray(obj),xs=[];if(isArr){xs.length=obj.length;for(var i=0;i<obj.length;i++)xs[i]=has(obj,i)?inspect(obj[i],obj):""}var symMap,syms="function"==typeof gOPS?gOPS(obj):[];if(hasShammedSymbols){symMap={};for(var k=0;k<syms.length;k++)symMap["$"+syms[k]]=syms[k]}for(var key in obj)// eslint-disable-line no-restricted-syntax
has(obj,key)&&(// eslint-disable-line no-restricted-syntax, no-continue
isArr&&String(Number(key))===key&&key<obj.length||hasShammedSymbols&&symMap["$"+key]instanceof Symbol||($test.call(/[^\w$]/,key)?xs.push(inspect(key,obj)+": "+inspect(obj[key],obj)):xs.push(key+": "+inspect(obj[key],obj))));if("function"==typeof gOPS)for(var j=0;j<syms.length;j++)isEnumerable.call(obj,syms[j])&&xs.push("["+inspect(syms[j])+"]: "+inspect(obj[syms[j]],obj));return xs}
/***/},
/***/945(__unused_webpack_module,__webpack_exports__,__webpack_require__){"use strict";var defineProperty,codePointAt;__webpack_require__.r(__webpack_exports__),
/* harmony export */__webpack_require__.d(__webpack_exports__,{
/* harmony export */BoundingBox:()=>/* binding */BoundingBox,
/* harmony export */Font:()=>/* binding */Font,
/* harmony export */Glyph:()=>/* binding */Glyph,
/* harmony export */Path:()=>/* binding */Path,
/* harmony export */_parse:()=>/* binding */parse,
/* harmony export */default:()=>__WEBPACK_DEFAULT_EXPORT__,
/* harmony export */load:()=>/* binding */load,
/* harmony export */loadSync:()=>/* binding */loadSync,
/* harmony export */parse:()=>/* binding */parseBuffer
/* harmony export */}),
/**
 * https://opentype.js.org v1.3.4 | (c) Frederik De Bleser and other contributors | MIT License | Uses tiny-inflate by Devon Govett and string.prototype.codepointat polyfill by Mathias Bynens
 */
/*! https://mths.be/codepointat v0.2.0 by @mathias */
String.prototype.codePointAt||(defineProperty=function(){
// IE 8 only supports `Object.defineProperty` on DOM elements
try{var object={},$defineProperty=Object.defineProperty,result=$defineProperty(object,object,object)&&$defineProperty}catch(error){}return result}(),codePointAt=function(position){if(null==this)throw TypeError();var string=String(this),size=string.length,index=position?Number(position):0;
// Account for out-of-bounds indices:
if(index!=index&&(// better `isNaN`
index=0),!(index<0||index>=size)){
// Get the first code unit
var second,first=string.charCodeAt(index);// check if it’s the start of a surrogate pair
return first>=55296&&first<=56319&&// high surrogate
size>index+1&&(second=string.charCodeAt(index+1))>=56320&&second<=57343?1024*(first-55296)+second-56320+65536:first}},defineProperty?defineProperty(String.prototype,"codePointAt",{value:codePointAt,configurable:!0,writable:!0}):String.prototype.codePointAt=codePointAt);function Tree(){this.table=new Uint16Array(16),/* table of code length counts */
this.trans=new Uint16Array(288)}function Data(source,dest){this.source=source,this.sourceIndex=0,this.tag=0,this.bitcount=0,this.dest=dest,this.destLen=0,this.ltree=new Tree,/* dynamic length/symbol tree */
this.dtree=new Tree}
/* --------------------------------------------------- *
 * -- uninitialized global data (static structures) -- *
 * --------------------------------------------------- */var sltree=new Tree,sdtree=new Tree,length_bits=new Uint8Array(30),length_base=new Uint16Array(30),dist_bits=new Uint8Array(30),dist_base=new Uint16Array(30),clcidx=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),code_tree=new Tree,lengths=new Uint8Array(320);
/* ----------------------- *
 * -- utility functions -- *
 * ----------------------- */
/* build extra bits and base tables */
function tinf_build_bits_base(bits,base,delta,first){var i,sum;
/* build bits table */for(i=0;i<delta;++i)bits[i]=0;for(i=0;i<30-delta;++i)bits[i+delta]=i/delta|0;
/* build base table */for(sum=first,i=0;i<30;++i)base[i]=sum,sum+=1<<bits[i]}
/* build the fixed huffman trees */
/* given an array of code lengths, build a tree */
var offs=new Uint16Array(16);function tinf_build_tree(t,lengths,off,num){var i,sum;
/* clear code length count table */for(i=0;i<16;++i)t.table[i]=0;
/* scan symbol lengths, and sum code length counts */for(i=0;i<num;++i)t.table[lengths[off+i]]++;
/* compute offset table for distribution sort */
for(t.table[0]=0,sum=0,i=0;i<16;++i)offs[i]=sum,sum+=t.table[i];
/* create code->symbol translation table (symbols sorted by code) */for(i=0;i<num;++i)lengths[off+i]&&(t.trans[offs[lengths[off+i]]++]=i)}
/* ---------------------- *
 * -- decode functions -- *
 * ---------------------- */
/* get one bit from source stream */function tinf_getbit(d){
/* check if tag is empty */
d.bitcount--||(
/* load next tag */
d.tag=d.source[d.sourceIndex++],d.bitcount=7)
/* shift bit out of tag */;var bit=1&d.tag;return d.tag>>>=1,bit}
/* read a num bit value from a stream and add base */function tinf_read_bits(d,num,base){if(!num)return base;for(;d.bitcount<24;)d.tag|=d.source[d.sourceIndex++]<<d.bitcount,d.bitcount+=8;var val=d.tag&65535>>>16-num;return d.tag>>>=num,d.bitcount-=num,val+base}
/* given a data stream and a tree, decode a symbol */function tinf_decode_symbol(d,t){for(;d.bitcount<24;)d.tag|=d.source[d.sourceIndex++]<<d.bitcount,d.bitcount+=8;var sum=0,cur=0,len=0,tag=d.tag;
/* get more bits while code value is above sum */
do{cur=2*cur+(1&tag),tag>>>=1,++len,sum+=t.table[len],cur-=t.table[len]}while(cur>=0);return d.tag=tag,d.bitcount-=len,t.trans[sum+cur]}
/* given a data stream, decode dynamic trees from it */function tinf_decode_trees(d,lt,dt){var hlit,hdist,hclen,i,num,length;for(
/* get 5 bits HLIT (257-286) */
hlit=tinf_read_bits(d,5,257),
/* get 5 bits HDIST (1-32) */
hdist=tinf_read_bits(d,5,1),
/* get 4 bits HCLEN (4-19) */
hclen=tinf_read_bits(d,4,4),i=0;i<19;++i)lengths[i]=0;
/* read code lengths for code length alphabet */for(i=0;i<hclen;++i){
/* get 3 bits code length (0-7) */
var clen=tinf_read_bits(d,3,0);lengths[clcidx[i]]=clen}
/* build code length tree */
/* decode code lengths for the dynamic trees */
for(tinf_build_tree(code_tree,lengths,0,19),num=0;num<hlit+hdist;){var sym=tinf_decode_symbol(d,code_tree);switch(sym){case 16:
/* copy previous code length 3-6 times (read 2 bits) */
var prev=lengths[num-1];for(length=tinf_read_bits(d,2,3);length;--length)lengths[num++]=prev;break;case 17:
/* repeat code length 0 for 3-10 times (read 3 bits) */
for(length=tinf_read_bits(d,3,3);length;--length)lengths[num++]=0;break;case 18:
/* repeat code length 0 for 11-138 times (read 7 bits) */
for(length=tinf_read_bits(d,7,11);length;--length)lengths[num++]=0;break;default:
/* values 0-15 represent the actual code lengths */
lengths[num++]=sym}}
/* build dynamic trees */tinf_build_tree(lt,lengths,0,hlit),tinf_build_tree(dt,lengths,hlit,hdist)}
/* ----------------------------- *
 * -- block inflate functions -- *
 * ----------------------------- */
/* given a stream and two trees, inflate a block of data */function tinf_inflate_block_data(d,lt,dt){for(;;){var length,dist,offs,i,sym=tinf_decode_symbol(d,lt);
/* check for end of block */if(256===sym)return 0;if(sym<256)d.dest[d.destLen++]=sym;else
/* copy match */
for(
/* possibly get more bits from length code */
length=tinf_read_bits(d,length_bits[sym-=257],length_base[sym]),dist=tinf_decode_symbol(d,dt),i=
/* possibly get more bits from distance code */
offs=d.destLen-tinf_read_bits(d,dist_bits[dist],dist_base[dist]);i<offs+length;++i)d.dest[d.destLen++]=d.dest[i]}}
/* inflate an uncompressed block of data */function tinf_inflate_uncompressed_block(d){
/* unread from bitbuffer */
for(var length,i;d.bitcount>8;)d.sourceIndex--,d.bitcount-=8;
/* get length */
/* check length */
if((length=256*(length=d.source[d.sourceIndex+1])+d.source[d.sourceIndex])!==(65535&~(256*d.source[d.sourceIndex+3]+d.source[d.sourceIndex+2])))return-3;
/* copy block */
for(d.sourceIndex+=4,i=length;i;--i)d.dest[d.destLen++]=d.source[d.sourceIndex++];
/* make sure we start next block on a byte boundary */return d.bitcount=0,0}
/* inflate stream from source to dest */
/* -------------------- *
 * -- initialization -- *
 * -------------------- */
/* build fixed huffman trees */
!function(lt,dt){var i;
/* build fixed length tree */for(i=0;i<7;++i)lt.table[i]=0;for(lt.table[7]=24,lt.table[8]=152,lt.table[9]=112,i=0;i<24;++i)lt.trans[i]=256+i;for(i=0;i<144;++i)lt.trans[24+i]=i;for(i=0;i<8;++i)lt.trans[168+i]=280+i;for(i=0;i<112;++i)lt.trans[176+i]=144+i;
/* build fixed distance tree */for(i=0;i<5;++i)dt.table[i]=0;for(dt.table[5]=32,i=0;i<32;++i)dt.trans[i]=i}(sltree,sdtree),
/* build extra bits and base tables */
tinf_build_bits_base(length_bits,length_base,4,3),tinf_build_bits_base(dist_bits,dist_base,2,1),
/* fix a special case */
length_bits[28]=0,length_base[28]=258;var tinyInflate=function(source,dest){var bfinal,res,d=new Data(source,dest);do{
/* decompress block */
switch(
/* read final block flag */
bfinal=tinf_getbit(d),tinf_read_bits(d,2,0)){case 0:
/* decompress uncompressed block */
res=tinf_inflate_uncompressed_block(d);break;case 1:
/* decompress block with fixed huffman trees */
res=tinf_inflate_block_data(d,sltree,sdtree);break;case 2:
/* decompress block with dynamic huffman trees */
tinf_decode_trees(d,d.ltree,d.dtree),res=tinf_inflate_block_data(d,d.ltree,d.dtree);break;default:res=-3}if(0!==res)throw new Error("Data error")}while(!bfinal);return d.destLen<d.dest.length?"function"==typeof d.dest.slice?d.dest.slice(0,d.destLen):d.dest.subarray(0,d.destLen):d.dest};
// The Bounding Box object
function derive(v0,v1,v2,v3,t){return Math.pow(1-t,3)*v0+3*Math.pow(1-t,2)*t*v1+3*(1-t)*Math.pow(t,2)*v2+Math.pow(t,3)*v3}
/**
 * A bounding box is an enclosing box that describes the smallest measure within which all the points lie.
 * It is used to calculate the bounding box of a glyph or text path.
 *
 * On initialization, x1/y1/x2/y2 will be NaN. Check if the bounding box is empty using `isEmpty()`.
 *
 * @exports opentype.BoundingBox
 * @class
 * @constructor
 */function BoundingBox(){this.x1=Number.NaN,this.y1=Number.NaN,this.x2=Number.NaN,this.y2=Number.NaN}
/**
 * Returns true if the bounding box is empty, that is, no points have been added to the box yet.
 */
// Geometric objects
/**
 * A bézier path containing a set of path commands similar to a SVG path.
 * Paths can be drawn on a context using `draw`.
 * @exports opentype.Path
 * @class
 * @constructor
 */
function Path(){this.commands=[],this.fill="black",this.stroke=null,this.strokeWidth=1}
/**
 * @param  {number} x
 * @param  {number} y
 */
// Run-time checking of preconditions.
function fail(message){throw new Error(message)}
// Precondition function that checks if the given predicate is true.
// If not, it will throw an error.
function argument(predicate,message){predicate||fail(message)}BoundingBox.prototype.isEmpty=function(){return isNaN(this.x1)||isNaN(this.y1)||isNaN(this.x2)||isNaN(this.y2)},
/**
 * Add the point to the bounding box.
 * The x1/y1/x2/y2 coordinates of the bounding box will now encompass the given point.
 * @param {number} x - The X coordinate of the point.
 * @param {number} y - The Y coordinate of the point.
 */
BoundingBox.prototype.addPoint=function(x,y){"number"==typeof x&&((isNaN(this.x1)||isNaN(this.x2))&&(this.x1=x,this.x2=x),x<this.x1&&(this.x1=x),x>this.x2&&(this.x2=x)),"number"==typeof y&&((isNaN(this.y1)||isNaN(this.y2))&&(this.y1=y,this.y2=y),y<this.y1&&(this.y1=y),y>this.y2&&(this.y2=y))},
/**
 * Add a X coordinate to the bounding box.
 * This extends the bounding box to include the X coordinate.
 * This function is used internally inside of addBezier.
 * @param {number} x - The X coordinate of the point.
 */
BoundingBox.prototype.addX=function(x){this.addPoint(x,null)},
/**
 * Add a Y coordinate to the bounding box.
 * This extends the bounding box to include the Y coordinate.
 * This function is used internally inside of addBezier.
 * @param {number} y - The Y coordinate of the point.
 */
BoundingBox.prototype.addY=function(y){this.addPoint(null,y)},
/**
 * Add a Bézier curve to the bounding box.
 * This extends the bounding box to include the entire Bézier.
 * @param {number} x0 - The starting X coordinate.
 * @param {number} y0 - The starting Y coordinate.
 * @param {number} x1 - The X coordinate of the first control point.
 * @param {number} y1 - The Y coordinate of the first control point.
 * @param {number} x2 - The X coordinate of the second control point.
 * @param {number} y2 - The Y coordinate of the second control point.
 * @param {number} x - The ending X coordinate.
 * @param {number} y - The ending Y coordinate.
 */
BoundingBox.prototype.addBezier=function(x0,y0,x1,y1,x2,y2,x,y){
// This code is based on http://nishiohirokazu.blogspot.com/2009/06/how-to-calculate-bezier-curves-bounding.html
// and https://github.com/icons8/svg-path-bounding-box
var p0=[x0,y0],p1=[x1,y1],p2=[x2,y2],p3=[x,y];this.addPoint(x0,y0),this.addPoint(x,y);for(var i=0;i<=1;i++){var b=6*p0[i]-12*p1[i]+6*p2[i],a=-3*p0[i]+9*p1[i]-9*p2[i]+3*p3[i],c=3*p1[i]-3*p0[i];if(0!==a){var b2ac=Math.pow(b,2)-4*c*a;if(!(b2ac<0)){var t1=(-b+Math.sqrt(b2ac))/(2*a);0<t1&&t1<1&&(0===i&&this.addX(derive(p0[i],p1[i],p2[i],p3[i],t1)),1===i&&this.addY(derive(p0[i],p1[i],p2[i],p3[i],t1)));var t2=(-b-Math.sqrt(b2ac))/(2*a);0<t2&&t2<1&&(0===i&&this.addX(derive(p0[i],p1[i],p2[i],p3[i],t2)),1===i&&this.addY(derive(p0[i],p1[i],p2[i],p3[i],t2)))}}else{if(0===b)continue;var t=-c/b;0<t&&t<1&&(0===i&&this.addX(derive(p0[i],p1[i],p2[i],p3[i],t)),1===i&&this.addY(derive(p0[i],p1[i],p2[i],p3[i],t)))}}},
/**
 * Add a quadratic curve to the bounding box.
 * This extends the bounding box to include the entire quadratic curve.
 * @param {number} x0 - The starting X coordinate.
 * @param {number} y0 - The starting Y coordinate.
 * @param {number} x1 - The X coordinate of the control point.
 * @param {number} y1 - The Y coordinate of the control point.
 * @param {number} x - The ending X coordinate.
 * @param {number} y - The ending Y coordinate.
 */
BoundingBox.prototype.addQuad=function(x0,y0,x1,y1,x,y){var cp1x=x0+2/3*(x1-x0),cp1y=y0+2/3*(y1-y0),cp2x=cp1x+1/3*(x-x0),cp2y=cp1y+1/3*(y-y0);this.addBezier(x0,y0,cp1x,cp1y,cp2x,cp2y,x,y)},Path.prototype.moveTo=function(x,y){this.commands.push({type:"M",x,y})},
/**
 * @param  {number} x
 * @param  {number} y
 */
Path.prototype.lineTo=function(x,y){this.commands.push({type:"L",x,y})},
/**
 * Draws cubic curve
 * @function
 * curveTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control 1
 * @param  {number} y1 - y of control 1
 * @param  {number} x2 - x of control 2
 * @param  {number} y2 - y of control 2
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 */
/**
 * Draws cubic curve
 * @function
 * bezierCurveTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control 1
 * @param  {number} y1 - y of control 1
 * @param  {number} x2 - x of control 2
 * @param  {number} y2 - y of control 2
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 * @see curveTo
 */
Path.prototype.curveTo=Path.prototype.bezierCurveTo=function(x1,y1,x2,y2,x,y){this.commands.push({type:"C",x1,y1,x2,y2,x,y})},
/**
 * Draws quadratic curve
 * @function
 * quadraticCurveTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control
 * @param  {number} y1 - y of control
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 */
/**
 * Draws quadratic curve
 * @function
 * quadTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control
 * @param  {number} y1 - y of control
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 */
Path.prototype.quadTo=Path.prototype.quadraticCurveTo=function(x1,y1,x,y){this.commands.push({type:"Q",x1,y1,x,y})},
/**
 * Closes the path
 * @function closePath
 * @memberof opentype.Path.prototype
 */
/**
 * Close the path
 * @function close
 * @memberof opentype.Path.prototype
 */
Path.prototype.close=Path.prototype.closePath=function(){this.commands.push({type:"Z"})},
/**
 * Add the given path or list of commands to the commands of this path.
 * @param  {Array} pathOrCommands - another opentype.Path, an opentype.BoundingBox, or an array of commands.
 */
Path.prototype.extend=function(pathOrCommands){if(pathOrCommands.commands)pathOrCommands=pathOrCommands.commands;else if(pathOrCommands instanceof BoundingBox){var box=pathOrCommands;return this.moveTo(box.x1,box.y1),this.lineTo(box.x2,box.y1),this.lineTo(box.x2,box.y2),this.lineTo(box.x1,box.y2),void this.close()}Array.prototype.push.apply(this.commands,pathOrCommands)},
/**
 * Calculate the bounding box of the path.
 * @returns {opentype.BoundingBox}
 */
Path.prototype.getBoundingBox=function(){for(var box=new BoundingBox,startX=0,startY=0,prevX=0,prevY=0,i=0;i<this.commands.length;i++){var cmd=this.commands[i];switch(cmd.type){case"M":box.addPoint(cmd.x,cmd.y),startX=prevX=cmd.x,startY=prevY=cmd.y;break;case"L":box.addPoint(cmd.x,cmd.y),prevX=cmd.x,prevY=cmd.y;break;case"Q":box.addQuad(prevX,prevY,cmd.x1,cmd.y1,cmd.x,cmd.y),prevX=cmd.x,prevY=cmd.y;break;case"C":box.addBezier(prevX,prevY,cmd.x1,cmd.y1,cmd.x2,cmd.y2,cmd.x,cmd.y),prevX=cmd.x,prevY=cmd.y;break;case"Z":prevX=startX,prevY=startY;break;default:throw new Error("Unexpected path command "+cmd.type)}}return box.isEmpty()&&box.addPoint(0,0),box},
/**
 * Draw the path to a 2D context.
 * @param {CanvasRenderingContext2D} ctx - A 2D drawing context.
 */
Path.prototype.draw=function(ctx){ctx.beginPath();for(var i=0;i<this.commands.length;i+=1){var cmd=this.commands[i];"M"===cmd.type?ctx.moveTo(cmd.x,cmd.y):"L"===cmd.type?ctx.lineTo(cmd.x,cmd.y):"C"===cmd.type?ctx.bezierCurveTo(cmd.x1,cmd.y1,cmd.x2,cmd.y2,cmd.x,cmd.y):"Q"===cmd.type?ctx.quadraticCurveTo(cmd.x1,cmd.y1,cmd.x,cmd.y):"Z"===cmd.type&&ctx.closePath()}this.fill&&(ctx.fillStyle=this.fill,ctx.fill()),this.stroke&&(ctx.strokeStyle=this.stroke,ctx.lineWidth=this.strokeWidth,ctx.stroke())},
/**
 * Convert the Path to a string of path data instructions
 * See http://www.w3.org/TR/SVG/paths.html#PathData
 * @param  {number} [decimalPlaces=2] - The amount of decimal places for floating-point values
 * @return {string}
 */
Path.prototype.toPathData=function(decimalPlaces){function floatToString(v){return Math.round(v)===v?""+Math.round(v):v.toFixed(decimalPlaces)}function packValues(){for(var arguments$1=arguments,s="",i=0;i<arguments.length;i+=1){var v=arguments$1[i];v>=0&&i>0&&(s+=" "),s+=floatToString(v)}return s}decimalPlaces=void 0!==decimalPlaces?decimalPlaces:2;for(var d="",i=0;i<this.commands.length;i+=1){var cmd=this.commands[i];"M"===cmd.type?d+="M"+packValues(cmd.x,cmd.y):"L"===cmd.type?d+="L"+packValues(cmd.x,cmd.y):"C"===cmd.type?d+="C"+packValues(cmd.x1,cmd.y1,cmd.x2,cmd.y2,cmd.x,cmd.y):"Q"===cmd.type?d+="Q"+packValues(cmd.x1,cmd.y1,cmd.x,cmd.y):"Z"===cmd.type&&(d+="Z")}return d},
/**
 * Convert the path to an SVG <path> element, as a string.
 * @param  {number} [decimalPlaces=2] - The amount of decimal places for floating-point values
 * @return {string}
 */
Path.prototype.toSVG=function(decimalPlaces){var svg='<path d="';return svg+=this.toPathData(decimalPlaces),svg+='"',this.fill&&"black"!==this.fill&&(null===this.fill?svg+=' fill="none"':svg+=' fill="'+this.fill+'"'),this.stroke&&(svg+=' stroke="'+this.stroke+'" stroke-width="'+this.strokeWidth+'"'),svg+="/>"},
/**
 * Convert the path to a DOM element.
 * @param  {number} [decimalPlaces=2] - The amount of decimal places for floating-point values
 * @return {SVGPathElement}
 */
Path.prototype.toDOMElement=function(decimalPlaces){var temporaryPath=this.toPathData(decimalPlaces),newPath=document.createElementNS("http://www.w3.org/2000/svg","path");return newPath.setAttribute("d",temporaryPath),newPath};var check={fail,argument,assert:argument},decode={},encode={},sizeOf={};
// Data types used in the OpenType font file.
// Return a function that always returns the same value.
function constant(v){return function(){return v}}
// OpenType data types //////////////////////////////////////////////////////
/**
 * Convert an 8-bit unsigned integer to a list of 1 byte.
 * @param {number}
 * @returns {Array}
 */encode.BYTE=function(v){return check.argument(v>=0&&v<=255,"Byte value should be between 0 and 255."),[v]},
/**
 * @constant
 * @type {number}
 */
sizeOf.BYTE=constant(1),
/**
 * Convert a 8-bit signed integer to a list of 1 byte.
 * @param {string}
 * @returns {Array}
 */
encode.CHAR=function(v){return[v.charCodeAt(0)]},
/**
 * @constant
 * @type {number}
 */
sizeOf.CHAR=constant(1),
/**
 * Convert an ASCII string to a list of bytes.
 * @param {string}
 * @returns {Array}
 */
encode.CHARARRAY=function(v){void 0===v&&(v="",console.warn("Undefined CHARARRAY encountered and treated as an empty string. This is probably caused by a missing glyph name."));for(var b=[],i=0;i<v.length;i+=1)b[i]=v.charCodeAt(i);return b},
/**
 * @param {Array}
 * @returns {number}
 */
sizeOf.CHARARRAY=function(v){return void 0===v?0:v.length},
/**
 * Convert a 16-bit unsigned integer to a list of 2 bytes.
 * @param {number}
 * @returns {Array}
 */
encode.USHORT=function(v){return[v>>8&255,255&v]},
/**
 * @constant
 * @type {number}
 */
sizeOf.USHORT=constant(2),
/**
 * Convert a 16-bit signed integer to a list of 2 bytes.
 * @param {number}
 * @returns {Array}
 */
encode.SHORT=function(v){
// Two's complement
return v>=32768&&(v=-(65536-v)),[v>>8&255,255&v]},
/**
 * @constant
 * @type {number}
 */
sizeOf.SHORT=constant(2),
/**
 * Convert a 24-bit unsigned integer to a list of 3 bytes.
 * @param {number}
 * @returns {Array}
 */
encode.UINT24=function(v){return[v>>16&255,v>>8&255,255&v]},
/**
 * @constant
 * @type {number}
 */
sizeOf.UINT24=constant(3),
/**
 * Convert a 32-bit unsigned integer to a list of 4 bytes.
 * @param {number}
 * @returns {Array}
 */
encode.ULONG=function(v){return[v>>24&255,v>>16&255,v>>8&255,255&v]},
/**
 * @constant
 * @type {number}
 */
sizeOf.ULONG=constant(4),
/**
 * Convert a 32-bit unsigned integer to a list of 4 bytes.
 * @param {number}
 * @returns {Array}
 */
encode.LONG=function(v){
// Two's complement
return v>=2147483648&&(v=-(4294967296-v)),[v>>24&255,v>>16&255,v>>8&255,255&v]},
/**
 * @constant
 * @type {number}
 */
sizeOf.LONG=constant(4),encode.FIXED=encode.ULONG,sizeOf.FIXED=sizeOf.ULONG,encode.FWORD=encode.SHORT,sizeOf.FWORD=sizeOf.SHORT,encode.UFWORD=encode.USHORT,sizeOf.UFWORD=sizeOf.USHORT,
/**
 * Convert a 32-bit Apple Mac timestamp integer to a list of 8 bytes, 64-bit timestamp.
 * @param {number}
 * @returns {Array}
 */
encode.LONGDATETIME=function(v){return[0,0,0,0,v>>24&255,v>>16&255,v>>8&255,255&v]},
/**
 * @constant
 * @type {number}
 */
sizeOf.LONGDATETIME=constant(8),
/**
 * Convert a 4-char tag to a list of 4 bytes.
 * @param {string}
 * @returns {Array}
 */
encode.TAG=function(v){return check.argument(4===v.length,"Tag should be exactly 4 ASCII characters."),[v.charCodeAt(0),v.charCodeAt(1),v.charCodeAt(2),v.charCodeAt(3)]},
/**
 * @constant
 * @type {number}
 */
sizeOf.TAG=constant(4),
// CFF data types ///////////////////////////////////////////////////////////
encode.Card8=encode.BYTE,sizeOf.Card8=sizeOf.BYTE,encode.Card16=encode.USHORT,sizeOf.Card16=sizeOf.USHORT,encode.OffSize=encode.BYTE,sizeOf.OffSize=sizeOf.BYTE,encode.SID=encode.USHORT,sizeOf.SID=sizeOf.USHORT,
// Convert a numeric operand or charstring number to a variable-size list of bytes.
/**
 * Convert a numeric operand or charstring number to a variable-size list of bytes.
 * @param {number}
 * @returns {Array}
 */
encode.NUMBER=function(v){return v>=-107&&v<=107?[v+139]:v>=108&&v<=1131?[247+((v-=108)>>8),255&v]:v>=-1131&&v<=-108?[251+((v=-v-108)>>8),255&v]:v>=-32768&&v<=32767?encode.NUMBER16(v):encode.NUMBER32(v)},
/**
 * @param {number}
 * @returns {number}
 */
sizeOf.NUMBER=function(v){return encode.NUMBER(v).length},
/**
 * Convert a signed number between -32768 and +32767 to a three-byte value.
 * This ensures we always use three bytes, but is not the most compact format.
 * @param {number}
 * @returns {Array}
 */
encode.NUMBER16=function(v){return[28,v>>8&255,255&v]},
/**
 * @constant
 * @type {number}
 */
sizeOf.NUMBER16=constant(3),
/**
 * Convert a signed number between -(2^31) and +(2^31-1) to a five-byte value.
 * This is useful if you want to be sure you always use four bytes,
 * at the expense of wasting a few bytes for smaller numbers.
 * @param {number}
 * @returns {Array}
 */
encode.NUMBER32=function(v){return[29,v>>24&255,v>>16&255,v>>8&255,255&v]},
/**
 * @constant
 * @type {number}
 */
sizeOf.NUMBER32=constant(5),
/**
 * @param {number}
 * @returns {Array}
 */
encode.REAL=function(v){var value=v.toString(),m=/\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(value);
// Some numbers use an epsilon to encode the value. (e.g. JavaScript will store 0.0000001 as 1e-7)
// This code converts it back to a number without the epsilon.
if(m){var epsilon=parseFloat("1e"+((m[2]?+m[2]:0)+m[1].length));value=(Math.round(v*epsilon)/epsilon).toString()}for(var nibbles="",i=0,ii=value.length;i<ii;i+=1){var c=value[i];nibbles+="e"===c?"-"===value[++i]?"c":"b":"."===c?"a":"-"===c?"e":c}for(var out=[30],i$1=0,ii$1=(nibbles+=1&nibbles.length?"f":"ff").length;i$1<ii$1;i$1+=2)out.push(parseInt(nibbles.substr(i$1,2),16));return out},
/**
 * @param {number}
 * @returns {number}
 */
sizeOf.REAL=function(v){return encode.REAL(v).length},encode.NAME=encode.CHARARRAY,sizeOf.NAME=sizeOf.CHARARRAY,encode.STRING=encode.CHARARRAY,sizeOf.STRING=sizeOf.CHARARRAY,
/**
 * @param {DataView} data
 * @param {number} offset
 * @param {number} numBytes
 * @returns {string}
 */
decode.UTF8=function(data,offset,numBytes){for(var codePoints=[],numChars=numBytes,j=0;j<numChars;j++,offset+=1)codePoints[j]=data.getUint8(offset);return String.fromCharCode.apply(null,codePoints)},
/**
 * @param {DataView} data
 * @param {number} offset
 * @param {number} numBytes
 * @returns {string}
 */
decode.UTF16=function(data,offset,numBytes){for(var codePoints=[],numChars=numBytes/2,j=0;j<numChars;j++,offset+=2)codePoints[j]=data.getUint16(offset);return String.fromCharCode.apply(null,codePoints)},
/**
 * Convert a JavaScript string to UTF16-BE.
 * @param {string}
 * @returns {Array}
 */
encode.UTF16=function(v){for(var b=[],i=0;i<v.length;i+=1){var codepoint=v.charCodeAt(i);b[b.length]=codepoint>>8&255,b[b.length]=255&codepoint}return b},
/**
 * @param {string}
 * @returns {number}
 */
sizeOf.UTF16=function(v){return 2*v.length};
// Data for converting old eight-bit Macintosh encodings to Unicode.
// This representation is optimized for decoding; encoding is slower
// and needs more memory. The assumption is that all opentype.js users
// want to open fonts, but saving a font will be comparatively rare
// so it can be more expensive. Keyed by IANA character set name.
// Python script for generating these strings:
//     s = u''.join([chr(c).decode('mac_greek') for c in range(128, 256)])
//     print(s.encode('utf-8'))
/**
 * @private
 */
var eightBitMacEncodings={"x-mac-croatian":// Python: 'mac_croatian'
"ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊©⁄€‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ","x-mac-cyrillic":// Python: 'mac_cyrillic'
"АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю","x-mac-gaelic":// http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/GAELIC.TXT
"ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØḂ±≤≥ḃĊċḊḋḞḟĠġṀæøṁṖṗɼƒſṠ«»… ÀÃÕŒœ–—“”‘’ṡẛÿŸṪ€‹›Ŷŷṫ·Ỳỳ⁊ÂÊÁËÈÍÎÏÌÓÔ♣ÒÚÛÙıÝýŴŵẄẅẀẁẂẃ","x-mac-greek":// Python: 'mac_greek'
"Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦€ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩάΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ­","x-mac-icelandic":// Python: 'mac_iceland'
"ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ","x-mac-inuit":// http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/INUIT.TXT
"ᐃᐄᐅᐆᐊᐋᐱᐲᐳᐴᐸᐹᑉᑎᑏᑐᑑᑕᑖᑦᑭᑮᑯᑰᑲᑳᒃᒋᒌᒍᒎᒐᒑ°ᒡᒥᒦ•¶ᒧ®©™ᒨᒪᒫᒻᓂᓃᓄᓅᓇᓈᓐᓯᓰᓱᓲᓴᓵᔅᓕᓖᓗᓘᓚᓛᓪᔨᔩᔪᔫᔭ… ᔮᔾᕕᕖᕗ–—“”‘’ᕘᕙᕚᕝᕆᕇᕈᕉᕋᕌᕐᕿᖀᖁᖂᖃᖄᖅᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖠᖡᖢᖣᖤᖥᖦᕼŁł","x-mac-ce":// Python: 'mac_latin2'
"ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ",macintosh:// Python: 'mac_roman'
"ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ","x-mac-romanian":// Python: 'mac_romanian'
"ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂȘ∞±≤≥¥µ∂∑∏π∫ªºΩăș¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›Țț‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ","x-mac-turkish":// Python: 'mac_turkish'
"ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙˆ˜¯˘˙˚¸˝˛ˇ"};
/**
 * Decodes an old-style Macintosh string. Returns either a Unicode JavaScript
 * string, or 'undefined' if the encoding is unsupported. For example, we do
 * not support Chinese, Japanese or Korean because these would need large
 * mapping tables.
 * @param {DataView} dataView
 * @param {number} offset
 * @param {number} dataLength
 * @param {string} encoding
 * @returns {string}
 */decode.MACSTRING=function(dataView,offset,dataLength,encoding){var table=eightBitMacEncodings[encoding];if(void 0!==table){for(var result="",i=0;i<dataLength;i++){var c=dataView.getUint8(offset+i);
// In all eight-bit Mac encodings, the characters 0x00..0x7F are
// mapped to U+0000..U+007F; we only need to look up the others.
result+=c<=127?String.fromCharCode(c):table[127&c]}return result}};
// Helper function for encode.MACSTRING. Returns a dictionary for mapping
// Unicode character codes to their 8-bit MacOS equivalent. This table
// is not exactly a super cheap data structure, but we do not care because
// encoding Macintosh strings is only rarely needed in typical applications.
var macEncodingCacheKeys,macEncodingTableCache="function"==typeof WeakMap&&new WeakMap;
// Helper for encode.VARDELTAS
function isByteEncodable(value){return value>=-128&&value<=127}
// Helper for encode.VARDELTAS
function encodeVarDeltaRunAsZeroes(deltas,pos,result){for(var runLength=0,numDeltas=deltas.length;pos<numDeltas&&runLength<64&&0===deltas[pos];)++pos,++runLength;return result.push(128|runLength-1),pos}
// Helper for encode.VARDELTAS
function encodeVarDeltaRunAsBytes(deltas,offset,result){for(var runLength=0,numDeltas=deltas.length,pos=offset;pos<numDeltas&&runLength<64;){var value=deltas[pos];if(!isByteEncodable(value))break;
// Within a byte-encoded run of deltas, a single zero is best
// stored literally as 0x00 value. However, if we have two or
// more zeroes in a sequence, it is better to start a new run.
// Fore example, the sequence of deltas [15, 15, 0, 15, 15]
// becomes 6 bytes (04 0F 0F 00 0F 0F) when storing the zero
// within the current run, but 7 bytes (01 0F 0F 80 01 0F 0F)
// when starting a new run.
if(0===value&&pos+1<numDeltas&&0===deltas[pos+1])break;++pos,++runLength}result.push(runLength-1);for(var i=offset;i<pos;++i)result.push(deltas[i]+256&255);return pos}
// Helper for encode.VARDELTAS
function encodeVarDeltaRunAsWords(deltas,offset,result){for(var runLength=0,numDeltas=deltas.length,pos=offset;pos<numDeltas&&runLength<64;){var value=deltas[pos];
// Within a word-encoded run of deltas, it is easiest to start
// a new run (with a different encoding) whenever we encounter
// a zero value. For example, the sequence [0x6666, 0, 0x7777]
// needs 7 bytes when storing the zero inside the current run
// (42 66 66 00 00 77 77), and equally 7 bytes when starting a
// new run (40 66 66 80 40 77 77).
if(0===value)break;
// Within a word-encoded run of deltas, a single value in the
// range (-128..127) should be encoded within the current run
// because it is more compact. For example, the sequence
// [0x6666, 2, 0x7777] becomes 7 bytes when storing the value
// literally (42 66 66 00 02 77 77), but 8 bytes when starting
// a new run (40 66 66 00 02 40 77 77).
if(isByteEncodable(value)&&pos+1<numDeltas&&isByteEncodable(deltas[pos+1]))break;++pos,++runLength}result.push(64|runLength-1);for(var i=offset;i<pos;++i){var val=deltas[i];result.push(val+65536>>8&255,val+256&255)}return pos}
/**
 * Encode a list of variation adjustment deltas.
 *
 * Variation adjustment deltas are used in ‘gvar’ and ‘cvar’ tables.
 * They indicate how points (in ‘gvar’) or values (in ‘cvar’) get adjusted
 * when generating instances of variation fonts.
 *
 * @see https://www.microsoft.com/typography/otspec/gvar.htm
 * @see https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6gvar.html
 * @param {Array}
 * @return {Array}
 */
/**
 * Encodes an old-style Macintosh string. Returns a byte array upon success.
 * If the requested encoding is unsupported, or if the input string contains
 * a character that cannot be expressed in the encoding, the function returns
 * 'undefined'.
 * @param {string} str
 * @param {string} encoding
 * @returns {Array}
 */
encode.MACSTRING=function(str,encoding){var table=function(encoding){
// Since we use encoding as a cache key for WeakMap, it has to be
// a String object and not a literal. And at least on NodeJS 2.10.1,
// WeakMap requires that the same String instance is passed for cache hits.
if(!macEncodingCacheKeys)for(var e in macEncodingCacheKeys={},eightBitMacEncodings)
/*jshint -W053 */ // Suppress "Do not use String as a constructor."
macEncodingCacheKeys[e]=new String(e);var cacheKey=macEncodingCacheKeys[encoding];if(void 0!==cacheKey){
// We can't do "if (cache.has(key)) {return cache.get(key)}" here:
// since garbage collection may run at any time, it could also kick in
// between the calls to cache.has() and cache.get(). In that case,
// we would return 'undefined' even though we do support the encoding.
if(macEncodingTableCache){var cachedTable=macEncodingTableCache.get(cacheKey);if(void 0!==cachedTable)return cachedTable}var decodingTable=eightBitMacEncodings[encoding];if(void 0!==decodingTable){for(var encodingTable={},i=0;i<decodingTable.length;i++)encodingTable[decodingTable.charCodeAt(i)]=i+128;return macEncodingTableCache&&macEncodingTableCache.set(cacheKey,encodingTable),encodingTable}}}(encoding);if(void 0!==table){for(var result=[],i=0;i<str.length;i++){var c=str.charCodeAt(i);
// In all eight-bit Mac encodings, the characters 0x00..0x7F are
// mapped to U+0000..U+007F; we only need to look up the others.
if(c>=128&&void 0===(c=table[c]))
// str contains a Unicode character that cannot be encoded
// in the requested encoding.
return;result[i]=c}return result}},
/**
 * @param {string} str
 * @param {string} encoding
 * @returns {number}
 */
sizeOf.MACSTRING=function(str,encoding){var b=encode.MACSTRING(str,encoding);return void 0!==b?b.length:0},encode.VARDELTAS=function(deltas){for(var pos=0,result=[];pos<deltas.length;){var value=deltas[pos];pos=0===value?encodeVarDeltaRunAsZeroes(deltas,pos,result):value>=-128&&value<=127?encodeVarDeltaRunAsBytes(deltas,pos,result):encodeVarDeltaRunAsWords(deltas,pos,result)}return result},
// Convert a list of values to a CFF INDEX structure.
// The values should be objects containing name / type / value.
/**
 * @param {Array} l
 * @returns {Array}
 */
encode.INDEX=function(l){for(
//var offset, offsets, offsetEncoder, encodedOffsets, encodedOffset, data,
//    i, v;
// Because we have to know which data type to use to encode the offsets,
// we have to go through the values twice: once to encode the data and
// calculate the offsets, then again to encode the offsets using the fitting data type.
var offset=1,offsets=[offset],data=[],i=0// First offset is always 1.
;i<l.length;i+=1){var v=encode.OBJECT(l[i]);Array.prototype.push.apply(data,v),offset+=v.length,offsets.push(offset)}if(0===data.length)return[0,0];for(var encodedOffsets=[],offSize=1+Math.floor(Math.log(offset)/Math.log(2))/8|0,offsetEncoder=[void 0,encode.BYTE,encode.USHORT,encode.UINT24,encode.ULONG][offSize],i$1=0;i$1<offsets.length;i$1+=1){var encodedOffset=offsetEncoder(offsets[i$1]);Array.prototype.push.apply(encodedOffsets,encodedOffset)}return Array.prototype.concat(encode.Card16(l.length),encode.OffSize(offSize),encodedOffsets,data)},
/**
 * @param {Array}
 * @returns {number}
 */
sizeOf.INDEX=function(v){return encode.INDEX(v).length},
/**
 * Convert an object to a CFF DICT structure.
 * The keys should be numeric.
 * The values should be objects containing name / type / value.
 * @param {Object} m
 * @returns {Array}
 */
encode.DICT=function(m){for(var d=[],keys=Object.keys(m),length=keys.length,i=0;i<length;i+=1){
// Object.keys() return string keys, but our keys are always numeric.
var k=parseInt(keys[i],0),v=m[k];d=(
// Value comes before the key.
d=d.concat(encode.OPERAND(v.value,v.type))).concat(encode.OPERATOR(k))}return d},
/**
 * @param {Object}
 * @returns {number}
 */
sizeOf.DICT=function(m){return encode.DICT(m).length},
/**
 * @param {number}
 * @returns {Array}
 */
encode.OPERATOR=function(v){return v<1200?[v]:[12,v-1200]},
/**
 * @param {Array} v
 * @param {string}
 * @returns {Array}
 */
encode.OPERAND=function(v,type){var d=[];if(Array.isArray(type))for(var i=0;i<type.length;i+=1)check.argument(v.length===type.length,"Not enough arguments given for type"+type),d=d.concat(encode.OPERAND(v[i],type[i]));else if("SID"===type)d=d.concat(encode.NUMBER(v));else if("offset"===type)
// We make it easy for ourselves and always encode offsets as
// 4 bytes. This makes offset calculation for the top dict easier.
d=d.concat(encode.NUMBER32(v));else if("number"===type)d=d.concat(encode.NUMBER(v));else{if("real"!==type)throw new Error("Unknown operand type "+type);
// FIXME Add support for booleans
d=d.concat(encode.REAL(v))}return d},encode.OP=encode.BYTE,sizeOf.OP=sizeOf.BYTE;
// memoize charstring encoding using WeakMap if available
var wmm="function"==typeof WeakMap&&new WeakMap;
/**
 * Convert a list of CharString operations to bytes.
 * @param {Array}
 * @returns {Array}
 */
// Table metadata
/**
 * @exports opentype.Table
 * @class
 * @param {string} tableName
 * @param {Array} fields
 * @param {Object} options
 * @constructor
 */
function Table(tableName,fields,options){
// For coverage tables with coverage format 2, we do not want to add the coverage data directly to the table object,
// as this will result in wrong encoding order of the coverage data on serialization to bytes.
// The fallback of using the field values directly when not present on the table is handled in types.encode.TABLE() already.
if(fields.length&&("coverageFormat"!==fields[0].name||1===fields[0].value))for(var i=0;i<fields.length;i+=1){var field=fields[i];this[field.name]=field.value}if(this.tableName=tableName,this.fields=fields,options)for(var optionKeys=Object.keys(options),i$1=0;i$1<optionKeys.length;i$1+=1){var k=optionKeys[i$1],v=options[k];void 0!==this[k]&&(this[k]=v)}}
/**
 * Encodes the table and returns an array of bytes
 * @return {Array}
 */
/**
 * @private
 */
function ushortList(itemName,list,count){void 0===count&&(count=list.length);var fields=new Array(list.length+1);fields[0]={name:itemName+"Count",type:"USHORT",value:count};for(var i=0;i<list.length;i++)fields[i+1]={name:itemName+i,type:"USHORT",value:list[i]};return fields}
/**
 * @private
 */function tableList(itemName,records,itemCallback){var count=records.length,fields=new Array(count+1);fields[0]={name:itemName+"Count",type:"USHORT",value:count};for(var i=0;i<count;i++)fields[i+1]={name:itemName+i,type:"TABLE",value:itemCallback(records[i],i)};return fields}
/**
 * @private
 */function recordList(itemName,records,itemCallback){var count=records.length,fields=[];fields[0]={name:itemName+"Count",type:"USHORT",value:count};for(var i=0;i<count;i++)fields=fields.concat(itemCallback(records[i],i));return fields}
// Common Layout Tables
/**
 * @exports opentype.Coverage
 * @class
 * @param {opentype.Table}
 * @constructor
 * @extends opentype.Table
 */function Coverage(coverageTable){1===coverageTable.format?Table.call(this,"coverageTable",[{name:"coverageFormat",type:"USHORT",value:1}].concat(ushortList("glyph",coverageTable.glyphs))):2===coverageTable.format?Table.call(this,"coverageTable",[{name:"coverageFormat",type:"USHORT",value:2}].concat(recordList("rangeRecord",coverageTable.ranges,function(RangeRecord){return[{name:"startGlyphID",type:"USHORT",value:RangeRecord.start},{name:"endGlyphID",type:"USHORT",value:RangeRecord.end},{name:"startCoverageIndex",type:"USHORT",value:RangeRecord.index}]}))):check.assert(!1,"Coverage format must be 1 or 2.")}function ScriptList(scriptListTable){Table.call(this,"scriptListTable",recordList("scriptRecord",scriptListTable,function(scriptRecord,i){var script=scriptRecord.script,defaultLangSys=script.defaultLangSys;return check.assert(!!defaultLangSys,"Unable to write GSUB: script "+scriptRecord.tag+" has no default language system."),[{name:"scriptTag"+i,type:"TAG",value:scriptRecord.tag},{name:"script"+i,type:"TABLE",value:new Table("scriptTable",[{name:"defaultLangSys",type:"TABLE",value:new Table("defaultLangSys",[{name:"lookupOrder",type:"USHORT",value:0},{name:"reqFeatureIndex",type:"USHORT",value:defaultLangSys.reqFeatureIndex}].concat(ushortList("featureIndex",defaultLangSys.featureIndexes)))}].concat(recordList("langSys",script.langSysRecords,function(langSysRecord,i){var langSys=langSysRecord.langSys;return[{name:"langSysTag"+i,type:"TAG",value:langSysRecord.tag},{name:"langSys"+i,type:"TABLE",value:new Table("langSys",[{name:"lookupOrder",type:"USHORT",value:0},{name:"reqFeatureIndex",type:"USHORT",value:langSys.reqFeatureIndex}].concat(ushortList("featureIndex",langSys.featureIndexes)))}]})))}]}))}
/**
 * @exports opentype.FeatureList
 * @class
 * @param {opentype.Table}
 * @constructor
 * @extends opentype.Table
 */
function FeatureList(featureListTable){Table.call(this,"featureListTable",recordList("featureRecord",featureListTable,function(featureRecord,i){var feature=featureRecord.feature;return[{name:"featureTag"+i,type:"TAG",value:featureRecord.tag},{name:"feature"+i,type:"TABLE",value:new Table("featureTable",[{name:"featureParams",type:"USHORT",value:feature.featureParams}].concat(ushortList("lookupListIndex",feature.lookupListIndexes)))}]}))}
/**
 * @exports opentype.LookupList
 * @class
 * @param {opentype.Table}
 * @param {Object}
 * @constructor
 * @extends opentype.Table
 */
function LookupList(lookupListTable,subtableMakers){Table.call(this,"lookupListTable",tableList("lookup",lookupListTable,function(lookupTable){var subtableCallback=subtableMakers[lookupTable.lookupType];return check.assert(!!subtableCallback,"Unable to write GSUB lookup type "+lookupTable.lookupType+" tables."),new Table("lookupTable",[{name:"lookupType",type:"USHORT",value:lookupTable.lookupType},{name:"lookupFlag",type:"USHORT",value:lookupTable.lookupFlag}].concat(tableList("subtable",lookupTable.subtables,subtableCallback)))}))}encode.CHARSTRING=function(ops){
// See encode.MACSTRING for why we don't do "if (wmm && wmm.has(ops))".
if(wmm){var cachedValue=wmm.get(ops);if(void 0!==cachedValue)return cachedValue}for(var d=[],length=ops.length,i=0;i<length;i+=1){var op=ops[i];d=d.concat(encode[op.type](op.value))}return wmm&&wmm.set(ops,d),d},
/**
 * @param {Array}
 * @returns {number}
 */
sizeOf.CHARSTRING=function(ops){return encode.CHARSTRING(ops).length},
// Utility functions ////////////////////////////////////////////////////////
/**
 * Convert an object containing name / type / value to bytes.
 * @param {Object}
 * @returns {Array}
 */
encode.OBJECT=function(v){var encodingFunction=encode[v.type];return check.argument(void 0!==encodingFunction,"No encoding function for type "+v.type),encodingFunction(v.value)},
/**
 * @param {Object}
 * @returns {number}
 */
sizeOf.OBJECT=function(v){var sizeOfFunction=sizeOf[v.type];return check.argument(void 0!==sizeOfFunction,"No sizeOf function for type "+v.type),sizeOfFunction(v.value)},
/**
 * Convert a table object to bytes.
 * A table contains a list of fields containing the metadata (name, type and default value).
 * The table itself has the field values set as attributes.
 * @param {opentype.Table}
 * @returns {Array}
 */
encode.TABLE=function(table){for(var d=[],length=table.fields.length,subtables=[],subtableOffsets=[],i=0;i<length;i+=1){var field=table.fields[i],encodingFunction=encode[field.type];check.argument(void 0!==encodingFunction,"No encoding function for field type "+field.type+" ("+field.name+")");var value=table[field.name];void 0===value&&(value=field.value);var bytes=encodingFunction(value);"TABLE"===field.type?(subtableOffsets.push(d.length),d=d.concat([0,0]),subtables.push(bytes)):d=d.concat(bytes)}for(var i$1=0;i$1<subtables.length;i$1+=1){var o=subtableOffsets[i$1],offset=d.length;check.argument(offset<65536,"Table "+table.tableName+" too big."),d[o]=offset>>8,d[o+1]=255&offset,d=d.concat(subtables[i$1])}return d},
/**
 * @param {opentype.Table}
 * @returns {number}
 */
sizeOf.TABLE=function(table){for(var numBytes=0,length=table.fields.length,i=0;i<length;i+=1){var field=table.fields[i],sizeOfFunction=sizeOf[field.type];check.argument(void 0!==sizeOfFunction,"No sizeOf function for field type "+field.type+" ("+field.name+")");var value=table[field.name];void 0===value&&(value=field.value),numBytes+=sizeOfFunction(value),
// Subtables take 2 more bytes for offsets.
"TABLE"===field.type&&(numBytes+=2)}return numBytes},encode.RECORD=encode.TABLE,sizeOf.RECORD=sizeOf.TABLE,
// Merge in a list of bytes.
encode.LITERAL=function(v){return v},sizeOf.LITERAL=function(v){return v.length},Table.prototype.encode=function(){return encode.TABLE(this)},
/**
 * Get the size of the table.
 * @return {number}
 */
Table.prototype.sizeOf=function(){return sizeOf.TABLE(this)},Coverage.prototype=Object.create(Table.prototype),Coverage.prototype.constructor=Coverage,ScriptList.prototype=Object.create(Table.prototype),ScriptList.prototype.constructor=ScriptList,FeatureList.prototype=Object.create(Table.prototype),FeatureList.prototype.constructor=FeatureList,LookupList.prototype=Object.create(Table.prototype),LookupList.prototype.constructor=LookupList;
// Record = same as Table, but inlined (a Table has an offset and its data is further in the stream)
// Don't use offsets inside Records (probable bug), only in Tables.
var table={Table,Record:Table,Coverage,ScriptList,FeatureList,LookupList,ushortList,tableList,recordList};
// Parsing utility functions
// Retrieve an unsigned byte from the DataView.
function getByte(dataView,offset){return dataView.getUint8(offset)}
// Retrieve an unsigned 16-bit short from the DataView.
// The value is stored in big endian.
function getUShort(dataView,offset){return dataView.getUint16(offset,!1)}
// Retrieve a signed 16-bit short from the DataView.
// The value is stored in big endian.
// Retrieve an unsigned 32-bit long from the DataView.
// The value is stored in big endian.
function getULong(dataView,offset){return dataView.getUint32(offset,!1)}
// Retrieve a 32-bit signed fixed-point number (16.16) from the DataView.
// The value is stored in big endian.
function getFixed(dataView,offset){return dataView.getInt16(offset,!1)+dataView.getUint16(offset+2,!1)/65535}
// Retrieve a 4-character tag from the DataView.
// Tags are used to identify tables.
var typeOffsets={byte:1,uShort:2,short:2,uLong:4,fixed:4,longDateTime:8,tag:4};
// A stateful parser that changes the offset whenever a value is retrieved.
// The data is a DataView.
function Parser(data,offset){this.data=data,this.offset=offset,this.relativeOffset=0}Parser.prototype.parseByte=function(){var v=this.data.getUint8(this.offset+this.relativeOffset);return this.relativeOffset+=1,v},Parser.prototype.parseChar=function(){var v=this.data.getInt8(this.offset+this.relativeOffset);return this.relativeOffset+=1,v},Parser.prototype.parseCard8=Parser.prototype.parseByte,Parser.prototype.parseUShort=function(){var v=this.data.getUint16(this.offset+this.relativeOffset);return this.relativeOffset+=2,v},Parser.prototype.parseCard16=Parser.prototype.parseUShort,Parser.prototype.parseSID=Parser.prototype.parseUShort,Parser.prototype.parseOffset16=Parser.prototype.parseUShort,Parser.prototype.parseShort=function(){var v=this.data.getInt16(this.offset+this.relativeOffset);return this.relativeOffset+=2,v},Parser.prototype.parseF2Dot14=function(){var v=this.data.getInt16(this.offset+this.relativeOffset)/16384;return this.relativeOffset+=2,v},Parser.prototype.parseULong=function(){var v=getULong(this.data,this.offset+this.relativeOffset);return this.relativeOffset+=4,v},Parser.prototype.parseOffset32=Parser.prototype.parseULong,Parser.prototype.parseFixed=function(){var v=getFixed(this.data,this.offset+this.relativeOffset);return this.relativeOffset+=4,v},Parser.prototype.parseString=function(length){var dataView=this.data,offset=this.offset+this.relativeOffset,string="";this.relativeOffset+=length;for(var i=0;i<length;i++)string+=String.fromCharCode(dataView.getUint8(offset+i));return string},Parser.prototype.parseTag=function(){return this.parseString(4)},
// LONGDATETIME is a 64-bit integer.
// JavaScript and unix timestamps traditionally use 32 bits, so we
// only take the last 32 bits.
// + Since until 2038 those bits will be filled by zeros we can ignore them.
Parser.prototype.parseLongDateTime=function(){var v=getULong(this.data,this.offset+this.relativeOffset+4);
// Subtract seconds between 01/01/1904 and 01/01/1970
// to convert Apple Mac timestamp to Standard Unix timestamp
return v-=2082844800,this.relativeOffset+=8,v},Parser.prototype.parseVersion=function(minorBase){var major=getUShort(this.data,this.offset+this.relativeOffset),minor=getUShort(this.data,this.offset+this.relativeOffset+2);
// How to interpret the minor version is very vague in the spec. 0x5000 is 5, 0x1000 is 1
// Default returns the correct number if minor = 0xN000 where N is 0-9
// Set minorBase to 1 for tables that use minor = N where N is 0-9
return this.relativeOffset+=4,void 0===minorBase&&(minorBase=4096),major+minor/minorBase/10},Parser.prototype.skip=function(type,amount){void 0===amount&&(amount=1),this.relativeOffset+=typeOffsets[type]*amount},
///// Parsing lists and records ///////////////////////////////
// Parse a list of 32 bit unsigned integers.
Parser.prototype.parseULongList=function(count){void 0===count&&(count=this.parseULong());for(var offsets=new Array(count),dataView=this.data,offset=this.offset+this.relativeOffset,i=0;i<count;i++)offsets[i]=dataView.getUint32(offset),offset+=4;return this.relativeOffset+=4*count,offsets},
// Parse a list of 16 bit unsigned integers. The length of the list can be read on the stream
// or provided as an argument.
Parser.prototype.parseOffset16List=Parser.prototype.parseUShortList=function(count){void 0===count&&(count=this.parseUShort());for(var offsets=new Array(count),dataView=this.data,offset=this.offset+this.relativeOffset,i=0;i<count;i++)offsets[i]=dataView.getUint16(offset),offset+=2;return this.relativeOffset+=2*count,offsets},
// Parses a list of 16 bit signed integers.
Parser.prototype.parseShortList=function(count){for(var list=new Array(count),dataView=this.data,offset=this.offset+this.relativeOffset,i=0;i<count;i++)list[i]=dataView.getInt16(offset),offset+=2;return this.relativeOffset+=2*count,list},
// Parses a list of bytes.
Parser.prototype.parseByteList=function(count){for(var list=new Array(count),dataView=this.data,offset=this.offset+this.relativeOffset,i=0;i<count;i++)list[i]=dataView.getUint8(offset++);return this.relativeOffset+=count,list},
/**
 * Parse a list of items.
 * Record count is optional, if omitted it is read from the stream.
 * itemCallback is one of the Parser methods.
 */
Parser.prototype.parseList=function(count,itemCallback){itemCallback||(itemCallback=count,count=this.parseUShort());for(var list=new Array(count),i=0;i<count;i++)list[i]=itemCallback.call(this);return list},Parser.prototype.parseList32=function(count,itemCallback){itemCallback||(itemCallback=count,count=this.parseULong());for(var list=new Array(count),i=0;i<count;i++)list[i]=itemCallback.call(this);return list},
/**
 * Parse a list of records.
 * Record count is optional, if omitted it is read from the stream.
 * Example of recordDescription: { sequenceIndex: Parser.uShort, lookupListIndex: Parser.uShort }
 */
Parser.prototype.parseRecordList=function(count,recordDescription){
// If the count argument is absent, read it in the stream.
recordDescription||(recordDescription=count,count=this.parseUShort());for(var records=new Array(count),fields=Object.keys(recordDescription),i=0;i<count;i++){for(var rec={},j=0;j<fields.length;j++){var fieldName=fields[j],fieldType=recordDescription[fieldName];rec[fieldName]=fieldType.call(this)}records[i]=rec}return records},Parser.prototype.parseRecordList32=function(count,recordDescription){
// If the count argument is absent, read it in the stream.
recordDescription||(recordDescription=count,count=this.parseULong());for(var records=new Array(count),fields=Object.keys(recordDescription),i=0;i<count;i++){for(var rec={},j=0;j<fields.length;j++){var fieldName=fields[j],fieldType=recordDescription[fieldName];rec[fieldName]=fieldType.call(this)}records[i]=rec}return records},
// Parse a data structure into an object
// Example of description: { sequenceIndex: Parser.uShort, lookupListIndex: Parser.uShort }
Parser.prototype.parseStruct=function(description){if("function"==typeof description)return description.call(this);for(var fields=Object.keys(description),struct={},j=0;j<fields.length;j++){var fieldName=fields[j],fieldType=description[fieldName];struct[fieldName]=fieldType.call(this)}return struct},
/**
 * Parse a GPOS valueRecord
 * https://docs.microsoft.com/en-us/typography/opentype/spec/gpos#value-record
 * valueFormat is optional, if omitted it is read from the stream.
 */
Parser.prototype.parseValueRecord=function(valueFormat){if(void 0===valueFormat&&(valueFormat=this.parseUShort()),0!==valueFormat){var valueRecord={};return 1&valueFormat&&(valueRecord.xPlacement=this.parseShort()),2&valueFormat&&(valueRecord.yPlacement=this.parseShort()),4&valueFormat&&(valueRecord.xAdvance=this.parseShort()),8&valueFormat&&(valueRecord.yAdvance=this.parseShort()),
// Device table (non-variable font) / VariationIndex table (variable font) not supported
// https://docs.microsoft.com/fr-fr/typography/opentype/spec/chapter2#devVarIdxTbls
16&valueFormat&&(valueRecord.xPlaDevice=void 0,this.parseShort()),32&valueFormat&&(valueRecord.yPlaDevice=void 0,this.parseShort()),64&valueFormat&&(valueRecord.xAdvDevice=void 0,this.parseShort()),128&valueFormat&&(valueRecord.yAdvDevice=void 0,this.parseShort()),valueRecord}},
/**
 * Parse a list of GPOS valueRecords
 * https://docs.microsoft.com/en-us/typography/opentype/spec/gpos#value-record
 * valueFormat and valueCount are read from the stream.
 */
Parser.prototype.parseValueRecordList=function(){for(var valueFormat=this.parseUShort(),valueCount=this.parseUShort(),values=new Array(valueCount),i=0;i<valueCount;i++)values[i]=this.parseValueRecord(valueFormat);return values},Parser.prototype.parsePointer=function(description){var structOffset=this.parseOffset16();if(structOffset>0)
// NULL offset => return undefined
return new Parser(this.data,this.offset+structOffset).parseStruct(description)},Parser.prototype.parsePointer32=function(description){var structOffset=this.parseOffset32();if(structOffset>0)
// NULL offset => return undefined
return new Parser(this.data,this.offset+structOffset).parseStruct(description)},
/**
 * Parse a list of offsets to lists of 16-bit integers,
 * or a list of offsets to lists of offsets to any kind of items.
 * If itemCallback is not provided, a list of list of UShort is assumed.
 * If provided, itemCallback is called on each item and must parse the item.
 * See examples in tables/gsub.js
 */
Parser.prototype.parseListOfLists=function(itemCallback){for(var offsets=this.parseOffset16List(),count=offsets.length,relativeOffset=this.relativeOffset,list=new Array(count),i=0;i<count;i++){var start=offsets[i];if(0!==start)if(this.relativeOffset=start,itemCallback){for(var subOffsets=this.parseOffset16List(),subList=new Array(subOffsets.length),j=0;j<subOffsets.length;j++)this.relativeOffset=start+subOffsets[j],subList[j]=itemCallback.call(this);list[i]=subList}else list[i]=this.parseUShortList();else
// NULL offset
// Add i as owned property to list. Convenient with assert.
list[i]=void 0}return this.relativeOffset=relativeOffset,list},
///// Complex tables parsing //////////////////////////////////
// Parse a coverage table in a GSUB, GPOS or GDEF table.
// https://www.microsoft.com/typography/OTSPEC/chapter2.htm
// parser.offset must point to the start of the table containing the coverage.
Parser.prototype.parseCoverage=function(){var startOffset=this.offset+this.relativeOffset,format=this.parseUShort(),count=this.parseUShort();if(1===format)return{format:1,glyphs:this.parseUShortList(count)};if(2===format){for(var ranges=new Array(count),i=0;i<count;i++)ranges[i]={start:this.parseUShort(),end:this.parseUShort(),index:this.parseUShort()};return{format:2,ranges}}throw new Error("0x"+startOffset.toString(16)+": Coverage format must be 1 or 2.")},
// Parse a Class Definition Table in a GSUB, GPOS or GDEF table.
// https://www.microsoft.com/typography/OTSPEC/chapter2.htm
Parser.prototype.parseClassDef=function(){var startOffset=this.offset+this.relativeOffset,format=this.parseUShort();if(1===format)return{format:1,startGlyph:this.parseUShort(),classes:this.parseUShortList()};if(2===format)return{format:2,ranges:this.parseRecordList({start:Parser.uShort,end:Parser.uShort,classId:Parser.uShort})};throw new Error("0x"+startOffset.toString(16)+": ClassDef format must be 1 or 2.")},
///// Static methods ///////////////////////////////////
// These convenience methods can be used as callbacks and should be called with "this" context set to a Parser instance.
Parser.list=function(count,itemCallback){return function(){return this.parseList(count,itemCallback)}},Parser.list32=function(count,itemCallback){return function(){return this.parseList32(count,itemCallback)}},Parser.recordList=function(count,recordDescription){return function(){return this.parseRecordList(count,recordDescription)}},Parser.recordList32=function(count,recordDescription){return function(){return this.parseRecordList32(count,recordDescription)}},Parser.pointer=function(description){return function(){return this.parsePointer(description)}},Parser.pointer32=function(description){return function(){return this.parsePointer32(description)}},Parser.tag=Parser.prototype.parseTag,Parser.byte=Parser.prototype.parseByte,Parser.uShort=Parser.offset16=Parser.prototype.parseUShort,Parser.uShortList=Parser.prototype.parseUShortList,Parser.uLong=Parser.offset32=Parser.prototype.parseULong,Parser.uLongList=Parser.prototype.parseULongList,Parser.struct=Parser.prototype.parseStruct,Parser.coverage=Parser.prototype.parseCoverage,Parser.classDef=Parser.prototype.parseClassDef;
///// Script, Feature, Lookup lists ///////////////////////////////////////////////
// https://www.microsoft.com/typography/OTSPEC/chapter2.htm
var langSysTable={reserved:Parser.uShort,reqFeatureIndex:Parser.uShort,featureIndexes:Parser.uShortList};Parser.prototype.parseScriptList=function(){return this.parsePointer(Parser.recordList({tag:Parser.tag,script:Parser.pointer({defaultLangSys:Parser.pointer(langSysTable),langSysRecords:Parser.recordList({tag:Parser.tag,langSys:Parser.pointer(langSysTable)})})}))||[]},Parser.prototype.parseFeatureList=function(){return this.parsePointer(Parser.recordList({tag:Parser.tag,feature:Parser.pointer({featureParams:Parser.offset16,lookupListIndexes:Parser.uShortList})}))||[]},Parser.prototype.parseLookupList=function(lookupTableParsers){return this.parsePointer(Parser.list(Parser.pointer(function(){var lookupType=this.parseUShort();check.argument(1<=lookupType&&lookupType<=9,"GPOS/GSUB lookup type "+lookupType+" unknown.");var lookupFlag=this.parseUShort(),useMarkFilteringSet=16&lookupFlag;return{lookupType,lookupFlag,subtables:this.parseList(Parser.pointer(lookupTableParsers[lookupType])),markFilteringSet:useMarkFilteringSet?this.parseUShort():void 0}})))||[]},Parser.prototype.parseFeatureVariationsList=function(){return this.parsePointer32(function(){var majorVersion=this.parseUShort(),minorVersion=this.parseUShort();return check.argument(1===majorVersion&&minorVersion<1,"GPOS/GSUB feature variations table unknown."),this.parseRecordList32({conditionSetOffset:Parser.offset32,featureTableSubstitutionOffset:Parser.offset32})})||[]};var parse={getByte,getCard8:getByte,getUShort,getCard16:getUShort,getShort:function(dataView,offset){return dataView.getInt16(offset,!1)},getULong,getFixed,getTag:function(dataView,offset){for(var tag="",i=offset;i<offset+4;i+=1)tag+=String.fromCharCode(dataView.getInt8(i));return tag}
// Retrieve an offset from the DataView.
// Offsets are 1 to 4 bytes in length, depending on the offSize argument.
,getOffset:function(dataView,offset,offSize){for(var v=0,i=0;i<offSize;i+=1)v<<=8,v+=dataView.getUint8(offset+i);return v}
// Retrieve a number of bytes from start offset to the end offset from the DataView.
,getBytes:function(dataView,startOffset,endOffset){for(var bytes=[],i=startOffset;i<endOffset;i+=1)bytes.push(dataView.getUint8(i));return bytes}
// Convert the list of bytes to a string.
,bytesToString:function(bytes){for(var s="",i=0;i<bytes.length;i+=1)s+=String.fromCharCode(bytes[i]);return s},Parser};
// The `cmap` table stores the mappings from characters to glyphs.
function addSegment(t,code,glyphIndex){t.segments.push({end:code,start:code,delta:-(code-glyphIndex),offset:0,glyphIndex})}var cmap={parse:
// Parse the `cmap` table. This table stores the mappings from characters to glyphs.
// There are many available formats, but we only support the Windows format 4 and 12.
// This function returns a `CmapEncoding` object or null if no supported format could be found.
function(data,start){var cmap={};cmap.version=parse.getUShort(data,start),check.argument(0===cmap.version,"cmap table version should be 0."),
// The cmap table can contain many sub-tables, each with their own format.
// We're only interested in a "platform 0" (Unicode format) and "platform 3" (Windows format) table.
cmap.numTables=parse.getUShort(data,start+2);for(var offset=-1,i=cmap.numTables-1;i>=0;i-=1){var platformId=parse.getUShort(data,start+4+8*i),encodingId=parse.getUShort(data,start+4+8*i+2);if(3===platformId&&(0===encodingId||1===encodingId||10===encodingId)||0===platformId&&(0===encodingId||1===encodingId||2===encodingId||3===encodingId||4===encodingId)){offset=parse.getULong(data,start+4+8*i+4);break}}if(-1===offset)
// There is no cmap table in the font that we support.
throw new Error("No valid cmap sub-tables found.");var p=new parse.Parser(data,start+offset);if(cmap.format=p.parseUShort(),12===cmap.format)!function(cmap,p){var groupCount;
//Skip reserved.
p.parseUShort(),
// Length in bytes of the sub-tables.
cmap.length=p.parseULong(),cmap.language=p.parseULong(),cmap.groupCount=groupCount=p.parseULong(),cmap.glyphIndexMap={};for(var i=0;i<groupCount;i+=1)for(var startCharCode=p.parseULong(),endCharCode=p.parseULong(),startGlyphId=p.parseULong(),c=startCharCode;c<=endCharCode;c+=1)cmap.glyphIndexMap[c]=startGlyphId,startGlyphId++}(cmap,p);else{if(4!==cmap.format)throw new Error("Only format 4 and 12 cmap tables are supported (found format "+cmap.format+").");!function(cmap,p,data,start,offset){
// segCount is stored x 2.
var segCount;
// Length in bytes of the sub-tables.
cmap.length=p.parseUShort(),cmap.language=p.parseUShort(),cmap.segCount=segCount=p.parseUShort()>>1,
// Skip searchRange, entrySelector, rangeShift.
p.skip("uShort",3),
// The "unrolled" mapping from character codes to glyph indices.
cmap.glyphIndexMap={};for(var endCountParser=new parse.Parser(data,start+offset+14),startCountParser=new parse.Parser(data,start+offset+16+2*segCount),idDeltaParser=new parse.Parser(data,start+offset+16+4*segCount),idRangeOffsetParser=new parse.Parser(data,start+offset+16+6*segCount),glyphIndexOffset=start+offset+16+8*segCount,i=0;i<segCount-1;i+=1)for(var glyphIndex=void 0,endCount=endCountParser.parseUShort(),startCount=startCountParser.parseUShort(),idDelta=idDeltaParser.parseShort(),idRangeOffset=idRangeOffsetParser.parseUShort(),c=startCount;c<=endCount;c+=1)0!==idRangeOffset?(
// The idRangeOffset is relative to the current position in the idRangeOffset array.
// Take the current offset in the idRangeOffset array.
glyphIndexOffset=idRangeOffsetParser.offset+idRangeOffsetParser.relativeOffset-2,
// Add the value of the idRangeOffset, which will move us into the glyphIndex array.
glyphIndexOffset+=idRangeOffset,
// Then add the character index of the current segment, multiplied by 2 for USHORTs.
glyphIndexOffset+=2*(c-startCount),0!==(glyphIndex=parse.getUShort(data,glyphIndexOffset))&&(glyphIndex=glyphIndex+idDelta&65535)):glyphIndex=c+idDelta&65535,cmap.glyphIndexMap[c]=glyphIndex}(cmap,p,data,start,offset)}return cmap},make:
// Make cmap table, format 4 by default, 12 if needed only
function(glyphs){
// Plan 0 is the base Unicode Plan but emojis, for example are on another plan, and needs cmap 12 format (with 32bit)
var i,isPlan0Only=!0;
// Check if we need to add cmap format 12 or if format 4 only is fine
for(i=glyphs.length-1;i>0;i-=1){if(glyphs.get(i).unicode>65535){console.log("Adding CMAP format 12 (needed!)"),isPlan0Only=!1;break}}var cmapTable=[{name:"version",type:"USHORT",value:0},{name:"numTables",type:"USHORT",value:isPlan0Only?1:2},
// CMAP 4 header
{name:"platformID",type:"USHORT",value:3},{name:"encodingID",type:"USHORT",value:1},{name:"offset",type:"ULONG",value:isPlan0Only?12:20}];isPlan0Only||(cmapTable=cmapTable.concat([
// CMAP 12 header
{name:"cmap12PlatformID",type:"USHORT",value:3},// We encode only for PlatformID = 3 (Windows) because it is supported everywhere
{name:"cmap12EncodingID",type:"USHORT",value:10},{name:"cmap12Offset",type:"ULONG",value:0}])),cmapTable=cmapTable.concat([
// CMAP 4 Subtable
{name:"format",type:"USHORT",value:4},{name:"cmap4Length",type:"USHORT",value:0},{name:"language",type:"USHORT",value:0},{name:"segCountX2",type:"USHORT",value:0},{name:"searchRange",type:"USHORT",value:0},{name:"entrySelector",type:"USHORT",value:0},{name:"rangeShift",type:"USHORT",value:0}]);var t=new table.Table("cmap",cmapTable);for(t.segments=[],i=0;i<glyphs.length;i+=1){for(var glyph=glyphs.get(i),j=0;j<glyph.unicodes.length;j+=1)addSegment(t,glyph.unicodes[j],i);t.segments=t.segments.sort(function(a,b){return a.start-b.start})}!function(t){t.segments.push({end:65535,start:65535,delta:1,offset:0})}(t);var segCount=t.segments.length,segCountToRemove=0,endCounts=[],startCounts=[],idDeltas=[],idRangeOffsets=[],glyphIds=[],cmap12Groups=[];
// Reminder this loop is not following the specification at 100%
// The specification -> find suites of characters and make a group
// Here we're doing one group for each letter
// Doing as the spec can save 8 times (or more) space
for(i=0;i<segCount;i+=1){var segment=t.segments[i];
// CMAP 4
segment.end<=65535&&segment.start<=65535?(endCounts=endCounts.concat({name:"end_"+i,type:"USHORT",value:segment.end}),startCounts=startCounts.concat({name:"start_"+i,type:"USHORT",value:segment.start}),idDeltas=idDeltas.concat({name:"idDelta_"+i,type:"SHORT",value:segment.delta}),idRangeOffsets=idRangeOffsets.concat({name:"idRangeOffset_"+i,type:"USHORT",value:segment.offset}),void 0!==segment.glyphId&&(glyphIds=glyphIds.concat({name:"glyph_"+i,type:"USHORT",value:segment.glyphId}))):
// Skip Unicode > 65535 (16bit unsigned max) for CMAP 4, will be added in CMAP 12
segCountToRemove+=1,
// CMAP 12
// Skip Terminator Segment
isPlan0Only||void 0===segment.glyphIndex||(cmap12Groups=(cmap12Groups=(cmap12Groups=cmap12Groups.concat({name:"cmap12Start_"+i,type:"ULONG",value:segment.start})).concat({name:"cmap12End_"+i,type:"ULONG",value:segment.end})).concat({name:"cmap12Glyph_"+i,type:"ULONG",value:segment.glyphIndex}))}
// CMAP 4 Subtable
if(t.segCountX2=2*(segCount-segCountToRemove),t.searchRange=2*Math.pow(2,Math.floor(Math.log(segCount-segCountToRemove)/Math.log(2))),t.entrySelector=Math.log(t.searchRange/2)/Math.log(2),t.rangeShift=t.segCountX2-t.searchRange,t.fields=t.fields.concat(endCounts),t.fields.push({name:"reservedPad",type:"USHORT",value:0}),t.fields=t.fields.concat(startCounts),t.fields=t.fields.concat(idDeltas),t.fields=t.fields.concat(idRangeOffsets),t.fields=t.fields.concat(glyphIds),t.cmap4Length=14+// Subtable header
2*endCounts.length+2+// reservedPad
2*startCounts.length+2*idDeltas.length+2*idRangeOffsets.length+2*glyphIds.length,!isPlan0Only){
// CMAP 12 Subtable
var cmap12Length=16+// Subtable header
4*cmap12Groups.length;t.cmap12Offset=20+t.cmap4Length,t.fields=t.fields.concat([{name:"cmap12Format",type:"USHORT",value:12},{name:"cmap12Reserved",type:"USHORT",value:0},{name:"cmap12Length",type:"ULONG",value:cmap12Length},{name:"cmap12Language",type:"ULONG",value:0},{name:"cmap12nGroups",type:"ULONG",value:cmap12Groups.length/3}]),t.fields=t.fields.concat(cmap12Groups)}return t}},cffStandardStrings=[".notdef","space","exclam","quotedbl","numbersign","dollar","percent","ampersand","quoteright","parenleft","parenright","asterisk","plus","comma","hyphen","period","slash","zero","one","two","three","four","five","six","seven","eight","nine","colon","semicolon","less","equal","greater","question","at","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","bracketleft","backslash","bracketright","asciicircum","underscore","quoteleft","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","braceleft","bar","braceright","asciitilde","exclamdown","cent","sterling","fraction","yen","florin","section","currency","quotesingle","quotedblleft","guillemotleft","guilsinglleft","guilsinglright","fi","fl","endash","dagger","daggerdbl","periodcentered","paragraph","bullet","quotesinglbase","quotedblbase","quotedblright","guillemotright","ellipsis","perthousand","questiondown","grave","acute","circumflex","tilde","macron","breve","dotaccent","dieresis","ring","cedilla","hungarumlaut","ogonek","caron","emdash","AE","ordfeminine","Lslash","Oslash","OE","ordmasculine","ae","dotlessi","lslash","oslash","oe","germandbls","onesuperior","logicalnot","mu","trademark","Eth","onehalf","plusminus","Thorn","onequarter","divide","brokenbar","degree","thorn","threequarters","twosuperior","registered","minus","eth","multiply","threesuperior","copyright","Aacute","Acircumflex","Adieresis","Agrave","Aring","Atilde","Ccedilla","Eacute","Ecircumflex","Edieresis","Egrave","Iacute","Icircumflex","Idieresis","Igrave","Ntilde","Oacute","Ocircumflex","Odieresis","Ograve","Otilde","Scaron","Uacute","Ucircumflex","Udieresis","Ugrave","Yacute","Ydieresis","Zcaron","aacute","acircumflex","adieresis","agrave","aring","atilde","ccedilla","eacute","ecircumflex","edieresis","egrave","iacute","icircumflex","idieresis","igrave","ntilde","oacute","ocircumflex","odieresis","ograve","otilde","scaron","uacute","ucircumflex","udieresis","ugrave","yacute","ydieresis","zcaron","exclamsmall","Hungarumlautsmall","dollaroldstyle","dollarsuperior","ampersandsmall","Acutesmall","parenleftsuperior","parenrightsuperior","266 ff","onedotenleader","zerooldstyle","oneoldstyle","twooldstyle","threeoldstyle","fouroldstyle","fiveoldstyle","sixoldstyle","sevenoldstyle","eightoldstyle","nineoldstyle","commasuperior","threequartersemdash","periodsuperior","questionsmall","asuperior","bsuperior","centsuperior","dsuperior","esuperior","isuperior","lsuperior","msuperior","nsuperior","osuperior","rsuperior","ssuperior","tsuperior","ff","ffi","ffl","parenleftinferior","parenrightinferior","Circumflexsmall","hyphensuperior","Gravesmall","Asmall","Bsmall","Csmall","Dsmall","Esmall","Fsmall","Gsmall","Hsmall","Ismall","Jsmall","Ksmall","Lsmall","Msmall","Nsmall","Osmall","Psmall","Qsmall","Rsmall","Ssmall","Tsmall","Usmall","Vsmall","Wsmall","Xsmall","Ysmall","Zsmall","colonmonetary","onefitted","rupiah","Tildesmall","exclamdownsmall","centoldstyle","Lslashsmall","Scaronsmall","Zcaronsmall","Dieresissmall","Brevesmall","Caronsmall","Dotaccentsmall","Macronsmall","figuredash","hypheninferior","Ogoneksmall","Ringsmall","Cedillasmall","questiondownsmall","oneeighth","threeeighths","fiveeighths","seveneighths","onethird","twothirds","zerosuperior","foursuperior","fivesuperior","sixsuperior","sevensuperior","eightsuperior","ninesuperior","zeroinferior","oneinferior","twoinferior","threeinferior","fourinferior","fiveinferior","sixinferior","seveninferior","eightinferior","nineinferior","centinferior","dollarinferior","periodinferior","commainferior","Agravesmall","Aacutesmall","Acircumflexsmall","Atildesmall","Adieresissmall","Aringsmall","AEsmall","Ccedillasmall","Egravesmall","Eacutesmall","Ecircumflexsmall","Edieresissmall","Igravesmall","Iacutesmall","Icircumflexsmall","Idieresissmall","Ethsmall","Ntildesmall","Ogravesmall","Oacutesmall","Ocircumflexsmall","Otildesmall","Odieresissmall","OEsmall","Oslashsmall","Ugravesmall","Uacutesmall","Ucircumflexsmall","Udieresissmall","Yacutesmall","Thornsmall","Ydieresissmall","001.000","001.001","001.002","001.003","Black","Bold","Book","Light","Medium","Regular","Roman","Semibold"],cffStandardEncoding=["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","space","exclam","quotedbl","numbersign","dollar","percent","ampersand","quoteright","parenleft","parenright","asterisk","plus","comma","hyphen","period","slash","zero","one","two","three","four","five","six","seven","eight","nine","colon","semicolon","less","equal","greater","question","at","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","bracketleft","backslash","bracketright","asciicircum","underscore","quoteleft","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","braceleft","bar","braceright","asciitilde","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","exclamdown","cent","sterling","fraction","yen","florin","section","currency","quotesingle","quotedblleft","guillemotleft","guilsinglleft","guilsinglright","fi","fl","","endash","dagger","daggerdbl","periodcentered","","paragraph","bullet","quotesinglbase","quotedblbase","quotedblright","guillemotright","ellipsis","perthousand","","questiondown","","grave","acute","circumflex","tilde","macron","breve","dotaccent","dieresis","","ring","cedilla","","hungarumlaut","ogonek","caron","emdash","","","","","","","","","","","","","","","","","AE","","ordfeminine","","","","","Lslash","Oslash","OE","ordmasculine","","","","","","ae","","","","dotlessi","","","lslash","oslash","oe","germandbls"],cffExpertEncoding=["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","space","exclamsmall","Hungarumlautsmall","","dollaroldstyle","dollarsuperior","ampersandsmall","Acutesmall","parenleftsuperior","parenrightsuperior","twodotenleader","onedotenleader","comma","hyphen","period","fraction","zerooldstyle","oneoldstyle","twooldstyle","threeoldstyle","fouroldstyle","fiveoldstyle","sixoldstyle","sevenoldstyle","eightoldstyle","nineoldstyle","colon","semicolon","commasuperior","threequartersemdash","periodsuperior","questionsmall","","asuperior","bsuperior","centsuperior","dsuperior","esuperior","","","isuperior","","","lsuperior","msuperior","nsuperior","osuperior","","","rsuperior","ssuperior","tsuperior","","ff","fi","fl","ffi","ffl","parenleftinferior","","parenrightinferior","Circumflexsmall","hyphensuperior","Gravesmall","Asmall","Bsmall","Csmall","Dsmall","Esmall","Fsmall","Gsmall","Hsmall","Ismall","Jsmall","Ksmall","Lsmall","Msmall","Nsmall","Osmall","Psmall","Qsmall","Rsmall","Ssmall","Tsmall","Usmall","Vsmall","Wsmall","Xsmall","Ysmall","Zsmall","colonmonetary","onefitted","rupiah","Tildesmall","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","exclamdownsmall","centoldstyle","Lslashsmall","","","Scaronsmall","Zcaronsmall","Dieresissmall","Brevesmall","Caronsmall","","Dotaccentsmall","","","Macronsmall","","","figuredash","hypheninferior","","","Ogoneksmall","Ringsmall","Cedillasmall","","","","onequarter","onehalf","threequarters","questiondownsmall","oneeighth","threeeighths","fiveeighths","seveneighths","onethird","twothirds","","","zerosuperior","onesuperior","twosuperior","threesuperior","foursuperior","fivesuperior","sixsuperior","sevensuperior","eightsuperior","ninesuperior","zeroinferior","oneinferior","twoinferior","threeinferior","fourinferior","fiveinferior","sixinferior","seveninferior","eightinferior","nineinferior","centinferior","dollarinferior","periodinferior","commainferior","Agravesmall","Aacutesmall","Acircumflexsmall","Atildesmall","Adieresissmall","Aringsmall","AEsmall","Ccedillasmall","Egravesmall","Eacutesmall","Ecircumflexsmall","Edieresissmall","Igravesmall","Iacutesmall","Icircumflexsmall","Idieresissmall","Ethsmall","Ntildesmall","Ogravesmall","Oacutesmall","Ocircumflexsmall","Otildesmall","Odieresissmall","OEsmall","Oslashsmall","Ugravesmall","Uacutesmall","Ucircumflexsmall","Udieresissmall","Yacutesmall","Thornsmall","Ydieresissmall"],standardNames=[".notdef",".null","nonmarkingreturn","space","exclam","quotedbl","numbersign","dollar","percent","ampersand","quotesingle","parenleft","parenright","asterisk","plus","comma","hyphen","period","slash","zero","one","two","three","four","five","six","seven","eight","nine","colon","semicolon","less","equal","greater","question","at","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","bracketleft","backslash","bracketright","asciicircum","underscore","grave","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","braceleft","bar","braceright","asciitilde","Adieresis","Aring","Ccedilla","Eacute","Ntilde","Odieresis","Udieresis","aacute","agrave","acircumflex","adieresis","atilde","aring","ccedilla","eacute","egrave","ecircumflex","edieresis","iacute","igrave","icircumflex","idieresis","ntilde","oacute","ograve","ocircumflex","odieresis","otilde","uacute","ugrave","ucircumflex","udieresis","dagger","degree","cent","sterling","section","bullet","paragraph","germandbls","registered","copyright","trademark","acute","dieresis","notequal","AE","Oslash","infinity","plusminus","lessequal","greaterequal","yen","mu","partialdiff","summation","product","pi","integral","ordfeminine","ordmasculine","Omega","ae","oslash","questiondown","exclamdown","logicalnot","radical","florin","approxequal","Delta","guillemotleft","guillemotright","ellipsis","nonbreakingspace","Agrave","Atilde","Otilde","OE","oe","endash","emdash","quotedblleft","quotedblright","quoteleft","quoteright","divide","lozenge","ydieresis","Ydieresis","fraction","currency","guilsinglleft","guilsinglright","fi","fl","daggerdbl","periodcentered","quotesinglbase","quotedblbase","perthousand","Acircumflex","Ecircumflex","Aacute","Edieresis","Egrave","Iacute","Icircumflex","Idieresis","Igrave","Oacute","Ocircumflex","apple","Ograve","Uacute","Ucircumflex","Ugrave","dotlessi","circumflex","tilde","macron","breve","dotaccent","ring","cedilla","hungarumlaut","ogonek","caron","Lslash","lslash","Scaron","scaron","Zcaron","zcaron","brokenbar","Eth","eth","Yacute","yacute","Thorn","thorn","minus","multiply","onesuperior","twosuperior","threesuperior","onehalf","onequarter","threequarters","franc","Gbreve","gbreve","Idotaccent","Scedilla","scedilla","Cacute","cacute","Ccaron","ccaron","dcroat"];
// Glyph encoding
/**
 * This is the encoding used for fonts created from scratch.
 * It loops through all glyphs and finds the appropriate unicode value.
 * Since it's linear time, other encodings will be faster.
 * @exports opentype.DefaultEncoding
 * @class
 * @constructor
 * @param {opentype.Font}
 */
function DefaultEncoding(font){this.font=font}
/**
 * @exports opentype.CmapEncoding
 * @class
 * @constructor
 * @param {Object} cmap - a object with the cmap encoded data
 */
function CmapEncoding(cmap){this.cmap=cmap}
/**
 * @param  {string} c - the character
 * @return {number} The glyph index.
 */
/**
 * @exports opentype.CffEncoding
 * @class
 * @constructor
 * @param {string} encoding - The encoding
 * @param {Array} charset - The character set.
 */
function CffEncoding(encoding,charset){this.encoding=encoding,this.charset=charset}
/**
 * @param  {string} s - The character
 * @return {number} The index.
 */
/**
 * @exports opentype.GlyphNames
 * @class
 * @constructor
 * @param {Object} post
 */
function GlyphNames(post){switch(post.version){case 1:this.names=standardNames.slice();break;case 2:this.names=new Array(post.numberOfGlyphs);for(var i=0;i<post.numberOfGlyphs;i++)post.glyphNameIndex[i]<standardNames.length?this.names[i]=standardNames[post.glyphNameIndex[i]]:this.names[i]=post.names[post.glyphNameIndex[i]-standardNames.length];break;case 2.5:this.names=new Array(post.numberOfGlyphs);for(var i$1=0;i$1<post.numberOfGlyphs;i$1++)this.names[i$1]=standardNames[i$1+post.glyphNameIndex[i$1]];break;default:this.names=[]}}
/**
 * Gets the index of a glyph by name.
 * @param  {string} name - The glyph name
 * @return {number} The index
 */
/**
 * @alias opentype.addGlyphNames
 * @param {opentype.Font}
 * @param {Object}
 */
function addGlyphNames(font,opt){opt.lowMemory?function(font){font._IndexToUnicodeMap={};for(var glyphIndexMap=font.tables.cmap.glyphIndexMap,charCodes=Object.keys(glyphIndexMap),i=0;i<charCodes.length;i+=1){var c=charCodes[i],glyphIndex=glyphIndexMap[c];void 0===font._IndexToUnicodeMap[glyphIndex]?font._IndexToUnicodeMap[glyphIndex]={unicodes:[parseInt(c)]}:font._IndexToUnicodeMap[glyphIndex].unicodes.push(parseInt(c))}}(font):function(font){for(var glyph,glyphIndexMap=font.tables.cmap.glyphIndexMap,charCodes=Object.keys(glyphIndexMap),i=0;i<charCodes.length;i+=1){var c=charCodes[i],glyphIndex=glyphIndexMap[c];(glyph=font.glyphs.get(glyphIndex)).addUnicode(parseInt(c))}for(var i$1=0;i$1<font.glyphs.length;i$1+=1)glyph=font.glyphs.get(i$1),font.cffEncoding?font.isCIDFont?glyph.name="gid"+i$1:glyph.name=font.cffEncoding.charset[i$1]:font.glyphNames.names&&(glyph.name=font.glyphNames.glyphIndexToName(i$1))}(font)}
// Drawing utility functions.
// Draw a line on the given context from point `x1,y1` to point `x2,y2`.
DefaultEncoding.prototype.charToGlyphIndex=function(c){var code=c.codePointAt(0),glyphs=this.font.glyphs;if(glyphs)for(var i=0;i<glyphs.length;i+=1)for(var glyph=glyphs.get(i),j=0;j<glyph.unicodes.length;j+=1)if(glyph.unicodes[j]===code)return i;return null},CmapEncoding.prototype.charToGlyphIndex=function(c){return this.cmap.glyphIndexMap[c.codePointAt(0)]||0},CffEncoding.prototype.charToGlyphIndex=function(s){var code=s.codePointAt(0),charName=this.encoding[code];return this.charset.indexOf(charName)},GlyphNames.prototype.nameToGlyphIndex=function(name){return this.names.indexOf(name)},
/**
 * @param  {number} gid
 * @return {string}
 */
GlyphNames.prototype.glyphIndexToName=function(gid){return this.names[gid]};var draw={line:function(ctx,x1,y1,x2,y2){ctx.beginPath(),ctx.moveTo(x1,y1),ctx.lineTo(x2,y2),ctx.stroke()}};
// The Glyph object
// import glyf from './tables/glyf' Can't be imported here, because it's a circular dependency
/**
 * @typedef GlyphOptions
 * @type Object
 * @property {string} [name] - The glyph name
 * @property {number} [unicode]
 * @property {Array} [unicodes]
 * @property {number} [xMin]
 * @property {number} [yMin]
 * @property {number} [xMax]
 * @property {number} [yMax]
 * @property {number} [advanceWidth]
 */
// A Glyph is an individual mark that often corresponds to a character.
// Some glyphs, such as ligatures, are a combination of many characters.
// Glyphs are the basic building blocks of a font.
// The `Glyph` class contains utility methods for drawing the path and its points.
/**
 * @exports opentype.Glyph
 * @class
 * @param {GlyphOptions}
 * @constructor
 */
function Glyph(options){
// By putting all the code on a prototype function (which is only declared once)
// we reduce the memory requirements for larger fonts by some 2%
this.bindConstructorValues(options)}
/**
 * @param  {GlyphOptions}
 */
// The GlyphSet object
// Define a property on the glyph that depends on the path being loaded.
function defineDependentProperty(glyph,externalName,internalName){Object.defineProperty(glyph,externalName,{get:function(){// jshint ignore:line
// Request the path property to make sure the path is loaded.
return glyph.path,glyph[internalName]},set:function(newValue){glyph[internalName]=newValue},enumerable:!0,configurable:!0})}
/**
 * A GlyphSet represents all glyphs available in the font, but modelled using
 * a deferred glyph loader, for retrieving glyphs only once they are absolutely
 * necessary, to keep the memory footprint down.
 * @exports opentype.GlyphSet
 * @class
 * @param {opentype.Font}
 * @param {Array}
 */function GlyphSet(font,glyphs){if(this.font=font,this.glyphs={},Array.isArray(glyphs))for(var i=0;i<glyphs.length;i++){var glyph=glyphs[i];glyph.path.unitsPerEm=font.unitsPerEm,this.glyphs[i]=glyph}this.length=glyphs&&glyphs.length||0}
/**
 * @param  {number} index
 * @return {opentype.Glyph}
 */Glyph.prototype.bindConstructorValues=function(options){var path,_path;this.index=options.index||0,
// These three values cannot be deferred for memory optimization:
this.name=options.name||null,this.unicode=options.unicode||void 0,this.unicodes=options.unicodes||void 0!==options.unicode?[options.unicode]:[],
// But by binding these values only when necessary, we reduce can
// the memory requirements by almost 3% for larger fonts.
"xMin"in options&&(this.xMin=options.xMin),"yMin"in options&&(this.yMin=options.yMin),"xMax"in options&&(this.xMax=options.xMax),"yMax"in options&&(this.yMax=options.yMax),"advanceWidth"in options&&(this.advanceWidth=options.advanceWidth),
// The path for a glyph is the most memory intensive, and is bound as a value
// with a getter/setter to ensure we actually do path parsing only once the
// path is actually needed by anything.
Object.defineProperty(this,"path",(path=options.path,_path=path||new Path,{configurable:!0,get:function(){return"function"==typeof _path&&(_path=_path()),_path},set:function(p){_path=p}}))},
/**
 * @param {number}
 */
Glyph.prototype.addUnicode=function(unicode){0===this.unicodes.length&&(this.unicode=unicode),this.unicodes.push(unicode)},
/**
 * Calculate the minimum bounding box for this glyph.
 * @return {opentype.BoundingBox}
 */
Glyph.prototype.getBoundingBox=function(){return this.path.getBoundingBox()},
/**
 * Convert the glyph to a Path we can draw on a drawing context.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {Object=} options - xScale, yScale to stretch the glyph.
 * @param  {opentype.Font} if hinting is to be used, the font
 * @return {opentype.Path}
 */
Glyph.prototype.getPath=function(x,y,fontSize,options,font){var commands,hPoints;x=void 0!==x?x:0,y=void 0!==y?y:0,fontSize=void 0!==fontSize?fontSize:72,options||(options={});var xScale=options.xScale,yScale=options.yScale;if(options.hinting&&font&&font.hinting&&(
// in case of hinting, the hinting engine takes care
// of scaling the points (not the path) before hinting.
hPoints=this.path&&font.hinting.exec(this,fontSize)),hPoints)
// Call font.hinting.getCommands instead of `glyf.getPath(hPoints).commands` to avoid a circular dependency
commands=font.hinting.getCommands(hPoints),x=Math.round(x),y=Math.round(y),
// TODO in case of hinting xyScaling is not yet supported
xScale=yScale=1;else{commands=this.path.commands;var scale=1/(this.path.unitsPerEm||1e3)*fontSize;void 0===xScale&&(xScale=scale),void 0===yScale&&(yScale=scale)}for(var p=new Path,i=0;i<commands.length;i+=1){var cmd=commands[i];"M"===cmd.type?p.moveTo(x+cmd.x*xScale,y+-cmd.y*yScale):"L"===cmd.type?p.lineTo(x+cmd.x*xScale,y+-cmd.y*yScale):"Q"===cmd.type?p.quadraticCurveTo(x+cmd.x1*xScale,y+-cmd.y1*yScale,x+cmd.x*xScale,y+-cmd.y*yScale):"C"===cmd.type?p.curveTo(x+cmd.x1*xScale,y+-cmd.y1*yScale,x+cmd.x2*xScale,y+-cmd.y2*yScale,x+cmd.x*xScale,y+-cmd.y*yScale):"Z"===cmd.type&&p.closePath()}return p},
/**
 * Split the glyph into contours.
 * This function is here for backwards compatibility, and to
 * provide raw access to the TrueType glyph outlines.
 * @return {Array}
 */
Glyph.prototype.getContours=function(){if(void 0===this.points)return[];for(var contours=[],currentContour=[],i=0;i<this.points.length;i+=1){var pt=this.points[i];currentContour.push(pt),pt.lastPointOfContour&&(contours.push(currentContour),currentContour=[])}return check.argument(0===currentContour.length,"There are still points left in the current contour."),contours},
/**
 * Calculate the xMin/yMin/xMax/yMax/lsb/rsb for a Glyph.
 * @return {Object}
 */
Glyph.prototype.getMetrics=function(){for(var commands=this.path.commands,xCoords=[],yCoords=[],i=0;i<commands.length;i+=1){var cmd=commands[i];"Z"!==cmd.type&&(xCoords.push(cmd.x),yCoords.push(cmd.y)),"Q"!==cmd.type&&"C"!==cmd.type||(xCoords.push(cmd.x1),yCoords.push(cmd.y1)),"C"===cmd.type&&(xCoords.push(cmd.x2),yCoords.push(cmd.y2))}var metrics={xMin:Math.min.apply(null,xCoords),yMin:Math.min.apply(null,yCoords),xMax:Math.max.apply(null,xCoords),yMax:Math.max.apply(null,yCoords),leftSideBearing:this.leftSideBearing};return isFinite(metrics.xMin)||(metrics.xMin=0),isFinite(metrics.xMax)||(metrics.xMax=this.advanceWidth),isFinite(metrics.yMin)||(metrics.yMin=0),isFinite(metrics.yMax)||(metrics.yMax=0),metrics.rightSideBearing=this.advanceWidth-metrics.leftSideBearing-(metrics.xMax-metrics.xMin),metrics},
/**
 * Draw the glyph on the given context.
 * @param  {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {Object=} options - xScale, yScale to stretch the glyph.
 */
Glyph.prototype.draw=function(ctx,x,y,fontSize,options){this.getPath(x,y,fontSize,options).draw(ctx)},
/**
 * Draw the points of the glyph.
 * On-curve points will be drawn in blue, off-curve points will be drawn in red.
 * @param  {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 */
Glyph.prototype.drawPoints=function(ctx,x,y,fontSize){function drawCircles(l,x,y,scale){ctx.beginPath();for(var j=0;j<l.length;j+=1)ctx.moveTo(x+l[j].x*scale,y+l[j].y*scale),ctx.arc(x+l[j].x*scale,y+l[j].y*scale,2,0,2*Math.PI,!1);ctx.closePath(),ctx.fill()}x=void 0!==x?x:0,y=void 0!==y?y:0,fontSize=void 0!==fontSize?fontSize:24;for(var scale=1/this.path.unitsPerEm*fontSize,blueCircles=[],redCircles=[],path=this.path,i=0;i<path.commands.length;i+=1){var cmd=path.commands[i];void 0!==cmd.x&&blueCircles.push({x:cmd.x,y:-cmd.y}),void 0!==cmd.x1&&redCircles.push({x:cmd.x1,y:-cmd.y1}),void 0!==cmd.x2&&redCircles.push({x:cmd.x2,y:-cmd.y2})}ctx.fillStyle="blue",drawCircles(blueCircles,x,y,scale),ctx.fillStyle="red",drawCircles(redCircles,x,y,scale)},
/**
 * Draw lines indicating important font measurements.
 * Black lines indicate the origin of the coordinate system (point 0,0).
 * Blue lines indicate the glyph bounding box.
 * Green line indicates the advance width of the glyph.
 * @param  {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 */
Glyph.prototype.drawMetrics=function(ctx,x,y,fontSize){var scale;x=void 0!==x?x:0,y=void 0!==y?y:0,fontSize=void 0!==fontSize?fontSize:24,scale=1/this.path.unitsPerEm*fontSize,ctx.lineWidth=1,
// Draw the origin
ctx.strokeStyle="black",draw.line(ctx,x,-1e4,x,1e4),draw.line(ctx,-1e4,y,1e4,y);
// This code is here due to memory optimization: by not using
// defaults in the constructor, we save a notable amount of memory.
var xMin=this.xMin||0,yMin=this.yMin||0,xMax=this.xMax||0,yMax=this.yMax||0,advanceWidth=this.advanceWidth||0;
// Draw the glyph box
ctx.strokeStyle="blue",draw.line(ctx,x+xMin*scale,-1e4,x+xMin*scale,1e4),draw.line(ctx,x+xMax*scale,-1e4,x+xMax*scale,1e4),draw.line(ctx,-1e4,y+-yMin*scale,1e4,y+-yMin*scale),draw.line(ctx,-1e4,y+-yMax*scale,1e4,y+-yMax*scale),
// Draw the advance width
ctx.strokeStyle="green",draw.line(ctx,x+advanceWidth*scale,-1e4,x+advanceWidth*scale,1e4)},GlyphSet.prototype.get=function(index){
// this.glyphs[index] is 'undefined' when low memory mode is on. glyph is pushed on request only.
if(void 0===this.glyphs[index]){this.font._push(index),"function"==typeof this.glyphs[index]&&(this.glyphs[index]=this.glyphs[index]());var glyph=this.glyphs[index],unicodeObj=this.font._IndexToUnicodeMap[index];if(unicodeObj)for(var j=0;j<unicodeObj.unicodes.length;j++)glyph.addUnicode(unicodeObj.unicodes[j]);this.font.cffEncoding?this.font.isCIDFont?glyph.name="gid"+index:glyph.name=this.font.cffEncoding.charset[index]:this.font.glyphNames.names&&(glyph.name=this.font.glyphNames.glyphIndexToName(index)),this.glyphs[index].advanceWidth=this.font._hmtxTableData[index].advanceWidth,this.glyphs[index].leftSideBearing=this.font._hmtxTableData[index].leftSideBearing}else"function"==typeof this.glyphs[index]&&(this.glyphs[index]=this.glyphs[index]());return this.glyphs[index]},
/**
 * @param  {number} index
 * @param  {Object}
 */
GlyphSet.prototype.push=function(index,loader){this.glyphs[index]=loader,this.length++};var glyphset={GlyphSet,glyphLoader:
/**
 * @alias opentype.glyphLoader
 * @param  {opentype.Font} font
 * @param  {number} index
 * @return {opentype.Glyph}
 */
function(font,index){return new Glyph({index,font})}
/**
 * Generate a stub glyph that can be filled with all metadata *except*
 * the "points" and "path" properties, which must be loaded only once
 * the glyph's path is actually requested for text shaping.
 * @alias opentype.ttfGlyphLoader
 * @param  {opentype.Font} font
 * @param  {number} index
 * @param  {Function} parseGlyph
 * @param  {Object} data
 * @param  {number} position
 * @param  {Function} buildPath
 * @return {opentype.Glyph}
 */,ttfGlyphLoader:function(font,index,parseGlyph,data,position,buildPath){return function(){var glyph=new Glyph({index,font});return glyph.path=function(){parseGlyph(glyph,data,position);var path=buildPath(font.glyphs,glyph);return path.unitsPerEm=font.unitsPerEm,path},defineDependentProperty(glyph,"xMin","_xMin"),defineDependentProperty(glyph,"xMax","_xMax"),defineDependentProperty(glyph,"yMin","_yMin"),defineDependentProperty(glyph,"yMax","_yMax"),glyph}}
/**
 * @alias opentype.cffGlyphLoader
 * @param  {opentype.Font} font
 * @param  {number} index
 * @param  {Function} parseCFFCharstring
 * @param  {string} charstring
 * @return {opentype.Glyph}
 */,cffGlyphLoader:function(font,index,parseCFFCharstring,charstring){return function(){var glyph=new Glyph({index,font});return glyph.path=function(){var path=parseCFFCharstring(font,glyph,charstring);return path.unitsPerEm=font.unitsPerEm,path},glyph}}};
// The `CFF` table contains the glyph outlines in PostScript format.
// Custom equals function that can also check lists.
function equals(a,b){if(a===b)return!0;if(Array.isArray(a)&&Array.isArray(b)){if(a.length!==b.length)return!1;for(var i=0;i<a.length;i+=1)if(!equals(a[i],b[i]))return!1;return!0}return!1}
// Subroutines are encoded using the negative half of the number space.
// See type 2 chapter 4.7 "Subroutine operators".
function calcCFFSubroutineBias(subrs){return subrs.length<1240?107:subrs.length<33900?1131:32768}
// Parse a `CFF` INDEX array.
// An index array consists of a list of offsets, then a list of objects at those offsets.
function parseCFFIndex(data,start,conversionFn){var objectOffset,endOffset,offsets=[],objects=[],count=parse.getCard16(data,start);if(0!==count){var offsetSize=parse.getByte(data,start+2);objectOffset=start+(count+1)*offsetSize+2;for(var pos=start+3,i=0;i<count+1;i+=1)offsets.push(parse.getOffset(data,pos,offsetSize)),pos+=offsetSize;
// The total size of the index array is 4 header bytes + the value of the last offset.
endOffset=objectOffset+offsets[count]}else endOffset=start+2;for(var i$1=0;i$1<offsets.length-1;i$1+=1){var value=parse.getBytes(data,objectOffset+offsets[i$1],objectOffset+offsets[i$1+1]);conversionFn&&(value=conversionFn(value)),objects.push(value)}return{objects,startOffset:start,endOffset}}
// Parse a `CFF` DICT operand.
function parseOperand(parser,b0){if(28===b0)return parser.parseByte()<<8|parser.parseByte();if(29===b0)return parser.parseByte()<<24|parser.parseByte()<<16|parser.parseByte()<<8|parser.parseByte();if(30===b0)
// Parse a `CFF` DICT real value.
return function(parser){for(var s="",lookup=["0","1","2","3","4","5","6","7","8","9",".","E","E-",null,"-"];;){var b=parser.parseByte(),n1=b>>4,n2=15&b;if(15===n1)break;if(s+=lookup[n1],15===n2)break;s+=lookup[n2]}return parseFloat(s)}(parser);if(b0>=32&&b0<=246)return b0-139;if(b0>=247&&b0<=250)return 256*(b0-247)+parser.parseByte()+108;if(b0>=251&&b0<=254)return 256*-(b0-251)-parser.parseByte()-108;throw new Error("Invalid b0 "+b0)}
// Convert the entries returned by `parseDict` to a proper dictionary.
// If a value is a list of one, it is unpacked.
// Parse a `CFF` DICT object.
// A dictionary contains key-value pairs in a compact tokenized format.
function parseCFFDict(data,start,size){start=void 0!==start?start:0;var parser=new parse.Parser(data,start),entries=[],operands=[];for(size=void 0!==size?size:data.length;parser.relativeOffset<size;){var op=parser.parseByte();
// The first byte for each dict item distinguishes between operator (key) and operand (value).
// Values <= 21 are operators.
op<=21?(
// Two-byte operators have an initial escape byte of 12.
12===op&&(op=1200+parser.parseByte()),entries.push([op,operands]),operands=[]):
// Since the operands (values) come before the operators (keys), we store all operands in a list
// until we encounter an operator.
operands.push(parseOperand(parser,op))}return function(entries){for(var o={},i=0;i<entries.length;i+=1){var key=entries[i][0],values=entries[i][1],value=void 0;if(value=1===values.length?values[0]:values,o.hasOwnProperty(key)&&!isNaN(o[key]))throw new Error("Object "+o+" already has key "+key);o[key]=value}return o}(entries)}
// Given a String Index (SID), return the value of the string.
// Strings below index 392 are standard CFF strings and are not encoded in the font.
function getCFFString(strings,index){return index=index<=390?cffStandardStrings[index]:strings[index-391]}
// Interpret a dictionary and return a new dictionary with readable keys and values for missing entries.
// This function takes `meta` which is a list of objects containing `operand`, `name` and `default`.
function interpretDict(dict,meta,strings){
// Because we also want to include missing values, we start out from the meta list
// and lookup values in the dict.
for(var value,newDict={},i=0;i<meta.length;i+=1){var m=meta[i];if(Array.isArray(m.type)){var values=[];values.length=m.type.length;for(var j=0;j<m.type.length;j++)void 0===(value=void 0!==dict[m.op]?dict[m.op][j]:void 0)&&(value=void 0!==m.value&&void 0!==m.value[j]?m.value[j]:null),"SID"===m.type[j]&&(value=getCFFString(strings,value)),values[j]=value;newDict[m.name]=values}else void 0===(value=dict[m.op])&&(value=void 0!==m.value?m.value:null),"SID"===m.type&&(value=getCFFString(strings,value)),newDict[m.name]=value}return newDict}
// Parse the CFF header.
var TOP_DICT_META=[{name:"version",op:0,type:"SID"},{name:"notice",op:1,type:"SID"},{name:"copyright",op:1200,type:"SID"},{name:"fullName",op:2,type:"SID"},{name:"familyName",op:3,type:"SID"},{name:"weight",op:4,type:"SID"},{name:"isFixedPitch",op:1201,type:"number",value:0},{name:"italicAngle",op:1202,type:"number",value:0},{name:"underlinePosition",op:1203,type:"number",value:-100},{name:"underlineThickness",op:1204,type:"number",value:50},{name:"paintType",op:1205,type:"number",value:0},{name:"charstringType",op:1206,type:"number",value:2},{name:"fontMatrix",op:1207,type:["real","real","real","real","real","real"],value:[.001,0,0,.001,0,0]},{name:"uniqueId",op:13,type:"number"},{name:"fontBBox",op:5,type:["number","number","number","number"],value:[0,0,0,0]},{name:"strokeWidth",op:1208,type:"number",value:0},{name:"xuid",op:14,type:[],value:null},{name:"charset",op:15,type:"offset",value:0},{name:"encoding",op:16,type:"offset",value:0},{name:"charStrings",op:17,type:"offset",value:0},{name:"private",op:18,type:["number","offset"],value:[0,0]},{name:"ros",op:1230,type:["SID","SID","number"]},{name:"cidFontVersion",op:1231,type:"number",value:0},{name:"cidFontRevision",op:1232,type:"number",value:0},{name:"cidFontType",op:1233,type:"number",value:0},{name:"cidCount",op:1234,type:"number",value:8720},{name:"uidBase",op:1235,type:"number"},{name:"fdArray",op:1236,type:"offset"},{name:"fdSelect",op:1237,type:"offset"},{name:"fontName",op:1238,type:"SID"}],PRIVATE_DICT_META=[{name:"subrs",op:19,type:"offset",value:0},{name:"defaultWidthX",op:20,type:"number",value:0},{name:"nominalWidthX",op:21,type:"number",value:0}];
// Parse the CFF top dictionary. A CFF table can contain multiple fonts, each with their own top dictionary.
// The top dictionary contains the essential metadata for the font, together with the private dictionary.
function parseCFFTopDict(data,strings){return interpretDict(parseCFFDict(data,0,data.byteLength),TOP_DICT_META,strings)}
// Parse the CFF private dictionary. We don't fully parse out all the values, only the ones we need.
function parseCFFPrivateDict(data,start,size,strings){return interpretDict(parseCFFDict(data,start,size),PRIVATE_DICT_META,strings)}
// Returns a list of "Top DICT"s found using an INDEX list.
// Used to read both the usual high-level Top DICTs and also the FDArray
// discovered inside CID-keyed fonts.  When a Top DICT has a reference to
// a Private DICT that is read and saved into the Top DICT.

// In addition to the expected/optional values as outlined in TOP_DICT_META
// the following values might be saved into the Top DICT.

//    _subrs []        array of local CFF subroutines from Private DICT
//    _subrsBias       bias value computed from number of subroutines
//                      (see calcCFFSubroutineBias() and parseCFFCharstring())
//    _defaultWidthX   default widths for CFF characters
//    _nominalWidthX   bias added to width embedded within glyph description

//    _privateDict     saved copy of parsed Private DICT from Top DICT
function gatherCFFTopDicts(data,start,cffIndex,strings){for(var topDictArray=[],iTopDict=0;iTopDict<cffIndex.length;iTopDict+=1){var topDict=parseCFFTopDict(new DataView(new Uint8Array(cffIndex[iTopDict]).buffer),strings);topDict._subrs=[],topDict._subrsBias=0,topDict._defaultWidthX=0,topDict._nominalWidthX=0;var privateSize=topDict.private[0],privateOffset=topDict.private[1];if(0!==privateSize&&0!==privateOffset){var privateDict=parseCFFPrivateDict(data,privateOffset+start,privateSize,strings);if(topDict._defaultWidthX=privateDict.defaultWidthX,topDict._nominalWidthX=privateDict.nominalWidthX,0!==privateDict.subrs){var subrIndex=parseCFFIndex(data,privateOffset+privateDict.subrs+start);topDict._subrs=subrIndex.objects,topDict._subrsBias=calcCFFSubroutineBias(topDict._subrs)}topDict._privateDict=privateDict}topDictArray.push(topDict)}return topDictArray}
// Parse the CFF charset table, which contains internal names for all the glyphs.
// This function will return a list of glyph names.
// See Adobe TN #5176 chapter 13, "Charsets".
// Take in charstring code and return a Glyph object.
// The encoding is described in the Type 2 Charstring Format
// https://www.microsoft.com/typography/OTSPEC/charstr2.htm
function parseCFFCharstring(font,glyph,code){var c1x,c1y,c2x,c2y,subrs,subrsBias,defaultWidthX,nominalWidthX,p=new Path,stack=[],nStems=0,haveWidth=!1,open=!1,x=0,y=0;if(font.isCIDFont){var fdIndex=font.tables.cff.topDict._fdSelect[glyph.index],fdDict=font.tables.cff.topDict._fdArray[fdIndex];subrs=fdDict._subrs,subrsBias=fdDict._subrsBias,defaultWidthX=fdDict._defaultWidthX,nominalWidthX=fdDict._nominalWidthX}else subrs=font.tables.cff.topDict._subrs,subrsBias=font.tables.cff.topDict._subrsBias,defaultWidthX=font.tables.cff.topDict._defaultWidthX,nominalWidthX=font.tables.cff.topDict._nominalWidthX;var width=defaultWidthX;function newContour(x,y){open&&p.closePath(),p.moveTo(x,y),open=!0}function parseStems(){stack.length%2!=0&&!haveWidth&&(width=stack.shift()+nominalWidthX),nStems+=stack.length>>1,stack.length=0,haveWidth=!0}return function parse(code){for(var b1,b2,b3,b4,codeIndex,subrCode,jpx,jpy,c3x,c3y,c4x,c4y,i=0;i<code.length;){var v=code[i];switch(i+=1,v){case 1:case 3:case 18:case 23:// vstemhm
parseStems();break;case 4:// vmoveto
stack.length>1&&!haveWidth&&(width=stack.shift()+nominalWidthX,haveWidth=!0),y+=stack.pop(),newContour(x,y);break;case 5:// rlineto
for(;stack.length>0;)x+=stack.shift(),y+=stack.shift(),p.lineTo(x,y);break;case 6:// hlineto
for(;stack.length>0&&(x+=stack.shift(),p.lineTo(x,y),0!==stack.length);)y+=stack.shift(),p.lineTo(x,y);break;case 7:// vlineto
for(;stack.length>0&&(y+=stack.shift(),p.lineTo(x,y),0!==stack.length);)x+=stack.shift(),p.lineTo(x,y);break;case 8:// rrcurveto
for(;stack.length>0;)c1x=x+stack.shift(),c1y=y+stack.shift(),c2x=c1x+stack.shift(),c2y=c1y+stack.shift(),x=c2x+stack.shift(),y=c2y+stack.shift(),p.curveTo(c1x,c1y,c2x,c2y,x,y);break;case 10:// callsubr
codeIndex=stack.pop()+subrsBias,(subrCode=subrs[codeIndex])&&parse(subrCode);break;case 11:// return
return;case 12:switch(// flex operators
v=code[i],i+=1,v){case 35:// flex
// |- dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 dx6 dy6 fd flex (12 35) |-
c1x=x+stack.shift(),// dx1
c1y=y+stack.shift(),// dy1
c2x=c1x+stack.shift(),// dx2
c2y=c1y+stack.shift(),// dy2
jpx=c2x+stack.shift(),// dx3
jpy=c2y+stack.shift(),// dy3
c3x=jpx+stack.shift(),// dx4
c3y=jpy+stack.shift(),// dy4
c4x=c3x+stack.shift(),// dx5
c4y=c3y+stack.shift(),// dy5
x=c4x+stack.shift(),// dx6
y=c4y+stack.shift(),// dy6
stack.shift(),// flex depth
p.curveTo(c1x,c1y,c2x,c2y,jpx,jpy),p.curveTo(c3x,c3y,c4x,c4y,x,y);break;case 34:// hflex
// |- dx1 dx2 dy2 dx3 dx4 dx5 dx6 hflex (12 34) |-
c1x=x+stack.shift(),// dx1
c1y=y,// dy1
c2x=c1x+stack.shift(),// dx2
c2y=c1y+stack.shift(),// dy2
jpx=c2x+stack.shift(),// dx3
jpy=c2y,// dy3
c3x=jpx+stack.shift(),// dx4
c3y=c2y,// dy4
c4x=c3x+stack.shift(),// dx5
c4y=y,// dy5
x=c4x+stack.shift(),// dx6
p.curveTo(c1x,c1y,c2x,c2y,jpx,jpy),p.curveTo(c3x,c3y,c4x,c4y,x,y);break;case 36:// hflex1
// |- dx1 dy1 dx2 dy2 dx3 dx4 dx5 dy5 dx6 hflex1 (12 36) |-
c1x=x+stack.shift(),// dx1
c1y=y+stack.shift(),// dy1
c2x=c1x+stack.shift(),// dx2
c2y=c1y+stack.shift(),// dy2
jpx=c2x+stack.shift(),// dx3
jpy=c2y,// dy3
c3x=jpx+stack.shift(),// dx4
c3y=c2y,// dy4
c4x=c3x+stack.shift(),// dx5
c4y=c3y+stack.shift(),// dy5
x=c4x+stack.shift(),// dx6
p.curveTo(c1x,c1y,c2x,c2y,jpx,jpy),p.curveTo(c3x,c3y,c4x,c4y,x,y);break;case 37:// flex1
// |- dx1 dy1 dx2 dy2 dx3 dy3 dx4 dy4 dx5 dy5 d6 flex1 (12 37) |-
c1x=x+stack.shift(),// dx1
c1y=y+stack.shift(),// dy1
c2x=c1x+stack.shift(),// dx2
c2y=c1y+stack.shift(),// dy2
jpx=c2x+stack.shift(),// dx3
jpy=c2y+stack.shift(),// dy3
c3x=jpx+stack.shift(),// dx4
c3y=jpy+stack.shift(),// dy4
c4x=c3x+stack.shift(),// dx5
c4y=c3y+stack.shift(),// dy5
Math.abs(c4x-x)>Math.abs(c4y-y)?x=c4x+stack.shift():y=c4y+stack.shift(),p.curveTo(c1x,c1y,c2x,c2y,jpx,jpy),p.curveTo(c3x,c3y,c4x,c4y,x,y);break;default:console.log("Glyph "+glyph.index+": unknown operator 1200"+v),stack.length=0}break;case 14:// endchar
stack.length>0&&!haveWidth&&(width=stack.shift()+nominalWidthX,haveWidth=!0),open&&(p.closePath(),open=!1);break;case 19:// hintmask
case 20:// cntrmask
parseStems(),i+=nStems+7>>3;break;case 21:// rmoveto
stack.length>2&&!haveWidth&&(width=stack.shift()+nominalWidthX,haveWidth=!0),y+=stack.pop(),newContour(x+=stack.pop(),y);break;case 22:// hmoveto
stack.length>1&&!haveWidth&&(width=stack.shift()+nominalWidthX,haveWidth=!0),newContour(x+=stack.pop(),y);break;case 24:// rcurveline
for(;stack.length>2;)c1x=x+stack.shift(),c1y=y+stack.shift(),c2x=c1x+stack.shift(),c2y=c1y+stack.shift(),x=c2x+stack.shift(),y=c2y+stack.shift(),p.curveTo(c1x,c1y,c2x,c2y,x,y);x+=stack.shift(),y+=stack.shift(),p.lineTo(x,y);break;case 25:// rlinecurve
for(;stack.length>6;)x+=stack.shift(),y+=stack.shift(),p.lineTo(x,y);c1x=x+stack.shift(),c1y=y+stack.shift(),c2x=c1x+stack.shift(),c2y=c1y+stack.shift(),x=c2x+stack.shift(),y=c2y+stack.shift(),p.curveTo(c1x,c1y,c2x,c2y,x,y);break;case 26:for(// vvcurveto
stack.length%2&&(x+=stack.shift());stack.length>0;)c1x=x,c1y=y+stack.shift(),c2x=c1x+stack.shift(),c2y=c1y+stack.shift(),x=c2x,y=c2y+stack.shift(),p.curveTo(c1x,c1y,c2x,c2y,x,y);break;case 27:for(// hhcurveto
stack.length%2&&(y+=stack.shift());stack.length>0;)c1x=x+stack.shift(),c1y=y,c2x=c1x+stack.shift(),c2y=c1y+stack.shift(),x=c2x+stack.shift(),y=c2y,p.curveTo(c1x,c1y,c2x,c2y,x,y);break;case 28:// shortint
b1=code[i],b2=code[i+1],stack.push((b1<<24|b2<<16)>>16),i+=2;break;case 29:// callgsubr
codeIndex=stack.pop()+font.gsubrsBias,(subrCode=font.gsubrs[codeIndex])&&parse(subrCode);break;case 30:// vhcurveto
for(;stack.length>0&&(c1x=x,c1y=y+stack.shift(),c2x=c1x+stack.shift(),c2y=c1y+stack.shift(),x=c2x+stack.shift(),y=c2y+(1===stack.length?stack.shift():0),p.curveTo(c1x,c1y,c2x,c2y,x,y),0!==stack.length);)c1x=x+stack.shift(),c1y=y,c2x=c1x+stack.shift(),c2y=c1y+stack.shift(),y=c2y+stack.shift(),x=c2x+(1===stack.length?stack.shift():0),p.curveTo(c1x,c1y,c2x,c2y,x,y);break;case 31:// hvcurveto
for(;stack.length>0&&(c1x=x+stack.shift(),c1y=y,c2x=c1x+stack.shift(),c2y=c1y+stack.shift(),y=c2y+stack.shift(),x=c2x+(1===stack.length?stack.shift():0),p.curveTo(c1x,c1y,c2x,c2y,x,y),0!==stack.length);)c1x=x,c1y=y+stack.shift(),c2x=c1x+stack.shift(),c2y=c1y+stack.shift(),x=c2x+stack.shift(),y=c2y+(1===stack.length?stack.shift():0),p.curveTo(c1x,c1y,c2x,c2y,x,y);break;default:v<32?console.log("Glyph "+glyph.index+": unknown operator "+v):v<247?stack.push(v-139):v<251?(b1=code[i],i+=1,stack.push(256*(v-247)+b1+108)):v<255?(b1=code[i],i+=1,stack.push(256*-(v-251)-b1-108)):(b1=code[i],b2=code[i+1],b3=code[i+2],b4=code[i+3],i+=4,stack.push((b1<<24|b2<<16|b3<<8|b4)/65536))}}}(code),glyph.advanceWidth=width,p}
// Convert a string to a String ID (SID).
// The list of strings is modified in place.
function encodeString(s,strings){var sid,i=cffStandardStrings.indexOf(s);
// Is the string in the CFF standard strings?
return i>=0&&(sid=i),(
// Is the string already in the string index?
i=strings.indexOf(s))>=0?sid=i+cffStandardStrings.length:(sid=cffStandardStrings.length+strings.length,strings.push(s)),sid}
// Given a dictionary's metadata, create a DICT structure.
function makeDict(meta,attrs,strings){for(var m={},i=0;i<meta.length;i+=1){var entry=meta[i],value=attrs[entry.name];void 0===value||equals(value,entry.value)||("SID"===entry.type&&(value=encodeString(value,strings)),m[entry.op]={name:entry.name,type:entry.type,value})}return m}
// The Top DICT houses the global font attributes.
function makeTopDict(attrs,strings){var t=new table.Record("Top DICT",[{name:"dict",type:"DICT",value:{}}]);return t.dict=makeDict(TOP_DICT_META,attrs,strings),t}function makeTopDictIndex(topDict){var t=new table.Record("Top DICT INDEX",[{name:"topDicts",type:"INDEX",value:[]}]);return t.topDicts=[{name:"topDict_0",type:"TABLE",value:topDict}],t}function glyphToOps(glyph){var ops=[],path=glyph.path;ops.push({name:"width",type:"NUMBER",value:glyph.advanceWidth});for(var x=0,y=0,i=0;i<path.commands.length;i+=1){var dx=void 0,dy=void 0,cmd=path.commands[i];if("Q"===cmd.type){
// CFF only supports bézier curves, so convert the quad to a bézier.
var _13=1/3,_23=2/3;
// We're going to create a new command so we don't change the original path.
// Since all coordinates are relative, we round() them ASAP to avoid propagating errors.
cmd={type:"C",x:cmd.x,y:cmd.y,x1:Math.round(_13*x+_23*cmd.x1),y1:Math.round(_13*y+_23*cmd.y1),x2:Math.round(_13*cmd.x+_23*cmd.x1),y2:Math.round(_13*cmd.y+_23*cmd.y1)}}if("M"===cmd.type)dx=Math.round(cmd.x-x),dy=Math.round(cmd.y-y),ops.push({name:"dx",type:"NUMBER",value:dx}),ops.push({name:"dy",type:"NUMBER",value:dy}),ops.push({name:"rmoveto",type:"OP",value:21}),x=Math.round(cmd.x),y=Math.round(cmd.y);else if("L"===cmd.type)dx=Math.round(cmd.x-x),dy=Math.round(cmd.y-y),ops.push({name:"dx",type:"NUMBER",value:dx}),ops.push({name:"dy",type:"NUMBER",value:dy}),ops.push({name:"rlineto",type:"OP",value:5}),x=Math.round(cmd.x),y=Math.round(cmd.y);else if("C"===cmd.type){var dx1=Math.round(cmd.x1-x),dy1=Math.round(cmd.y1-y),dx2=Math.round(cmd.x2-cmd.x1),dy2=Math.round(cmd.y2-cmd.y1);dx=Math.round(cmd.x-cmd.x2),dy=Math.round(cmd.y-cmd.y2),ops.push({name:"dx1",type:"NUMBER",value:dx1}),ops.push({name:"dy1",type:"NUMBER",value:dy1}),ops.push({name:"dx2",type:"NUMBER",value:dx2}),ops.push({name:"dy2",type:"NUMBER",value:dy2}),ops.push({name:"dx",type:"NUMBER",value:dx}),ops.push({name:"dy",type:"NUMBER",value:dy}),ops.push({name:"rrcurveto",type:"OP",value:8}),x=Math.round(cmd.x),y=Math.round(cmd.y)}
// Contours are closed automatically.
}return ops.push({name:"endchar",type:"OP",value:14}),ops}var cff={parse:
// Parse the `CFF` table, which contains the glyph outlines in PostScript format.
function(data,start,font,opt){font.tables.cff={};var header=function(data,start){var header={};return header.formatMajor=parse.getCard8(data,start),header.formatMinor=parse.getCard8(data,start+1),header.size=parse.getCard8(data,start+2),header.offsetSize=parse.getCard8(data,start+3),header.startOffset=start,header.endOffset=start+4,header}(data,start),nameIndex=parseCFFIndex(data,header.endOffset,parse.bytesToString),topDictIndex=parseCFFIndex(data,nameIndex.endOffset),stringIndex=parseCFFIndex(data,topDictIndex.endOffset,parse.bytesToString),globalSubrIndex=parseCFFIndex(data,stringIndex.endOffset);font.gsubrs=globalSubrIndex.objects,font.gsubrsBias=calcCFFSubroutineBias(font.gsubrs);var topDictArray=gatherCFFTopDicts(data,start,topDictIndex.objects,stringIndex.objects);if(1!==topDictArray.length)throw new Error("CFF table has too many fonts in 'FontSet' - count of fonts NameIndex.length = "+topDictArray.length);var topDict=topDictArray[0];if(font.tables.cff.topDict=topDict,topDict._privateDict&&(font.defaultWidthX=topDict._privateDict.defaultWidthX,font.nominalWidthX=topDict._privateDict.nominalWidthX),void 0!==topDict.ros[0]&&void 0!==topDict.ros[1]&&(font.isCIDFont=!0),font.isCIDFont){var fdArrayOffset=topDict.fdArray,fdSelectOffset=topDict.fdSelect;if(0===fdArrayOffset||0===fdSelectOffset)throw new Error("Font is marked as a CID font, but FDArray and/or FDSelect information is missing");var fdArrayIndex=parseCFFIndex(data,fdArrayOffset+=start),fdArray=gatherCFFTopDicts(data,start,fdArrayIndex.objects,stringIndex.objects);topDict._fdArray=fdArray,fdSelectOffset+=start,topDict._fdSelect=function(data,start,nGlyphs,fdArrayCount){var fdIndex,fdSelect=[],parser=new parse.Parser(data,start),format=parser.parseCard8();if(0===format)
// Simple list of nGlyphs elements
for(var iGid=0;iGid<nGlyphs;iGid++){if((fdIndex=parser.parseCard8())>=fdArrayCount)throw new Error("CFF table CID Font FDSelect has bad FD index value "+fdIndex+" (FD count "+fdArrayCount+")");fdSelect.push(fdIndex)}else{if(3!==format)throw new Error("CFF Table CID Font FDSelect table has unsupported format "+format);
// Ranges
var next,nRanges=parser.parseCard16(),first=parser.parseCard16();if(0!==first)throw new Error("CFF Table CID Font FDSelect format 3 range has bad initial GID "+first);for(var iRange=0;iRange<nRanges;iRange++){if(fdIndex=parser.parseCard8(),next=parser.parseCard16(),fdIndex>=fdArrayCount)throw new Error("CFF table CID Font FDSelect has bad FD index value "+fdIndex+" (FD count "+fdArrayCount+")");if(next>nGlyphs)throw new Error("CFF Table CID Font FDSelect format 3 range has bad GID "+next);for(;first<next;first++)fdSelect.push(fdIndex);first=next}if(next!==nGlyphs)throw new Error("CFF Table CID Font FDSelect format 3 range has bad final GID "+next)}return fdSelect}(data,fdSelectOffset,font.numGlyphs,fdArray.length)}var charStringsIndex,privateDictOffset=start+topDict.private[1],privateDict=parseCFFPrivateDict(data,privateDictOffset,topDict.private[0],stringIndex.objects);if(font.defaultWidthX=privateDict.defaultWidthX,font.nominalWidthX=privateDict.nominalWidthX,0!==privateDict.subrs){var subrOffset=privateDictOffset+privateDict.subrs,subrIndex=parseCFFIndex(data,subrOffset);font.subrs=subrIndex.objects,font.subrsBias=calcCFFSubroutineBias(font.subrs)}else font.subrs=[],font.subrsBias=0;
// Offsets in the top dict are relative to the beginning of the CFF data, so add the CFF start offset.
opt.lowMemory?(charStringsIndex=function(data,start){var objectOffset,endOffset,offsets=[],count=parse.getCard16(data,start);if(0!==count){var offsetSize=parse.getByte(data,start+2);objectOffset=start+(count+1)*offsetSize+2;for(var pos=start+3,i=0;i<count+1;i+=1)offsets.push(parse.getOffset(data,pos,offsetSize)),pos+=offsetSize;
// The total size of the index array is 4 header bytes + the value of the last offset.
endOffset=objectOffset+offsets[count]}else endOffset=start+2;return{offsets,startOffset:start,endOffset}}(data,start+topDict.charStrings),font.nGlyphs=charStringsIndex.offsets.length):(charStringsIndex=parseCFFIndex(data,start+topDict.charStrings),font.nGlyphs=charStringsIndex.objects.length);var charset=function(data,start,nGlyphs,strings){var sid,count,parser=new parse.Parser(data,start);
// The .notdef glyph is not included, so subtract 1.
nGlyphs-=1;var charset=[".notdef"],format=parser.parseCard8();if(0===format)for(var i=0;i<nGlyphs;i+=1)sid=parser.parseSID(),charset.push(getCFFString(strings,sid));else if(1===format)for(;charset.length<=nGlyphs;){sid=parser.parseSID(),count=parser.parseCard8();for(var i$1=0;i$1<=count;i$1+=1)charset.push(getCFFString(strings,sid)),sid+=1}else{if(2!==format)throw new Error("Unknown charset format "+format);for(;charset.length<=nGlyphs;){sid=parser.parseSID(),count=parser.parseCard16();for(var i$2=0;i$2<=count;i$2+=1)charset.push(getCFFString(strings,sid)),sid+=1}}return charset}
// Parse the CFF encoding data. Only one encoding can be specified per font.
// See Adobe TN #5176 chapter 12, "Encodings".
(data,start+topDict.charset,font.nGlyphs,stringIndex.objects);if(0===topDict.encoding?
// Standard encoding
font.cffEncoding=new CffEncoding(cffStandardEncoding,charset):1===topDict.encoding?
// Expert encoding
font.cffEncoding=new CffEncoding(cffExpertEncoding,charset):font.cffEncoding=function(data,start,charset){var code,enc={},parser=new parse.Parser(data,start),format=parser.parseCard8();if(0===format)for(var nCodes=parser.parseCard8(),i=0;i<nCodes;i+=1)enc[code=parser.parseCard8()]=i;else{if(1!==format)throw new Error("Unknown encoding format "+format);var nRanges=parser.parseCard8();code=1;for(var i$1=0;i$1<nRanges;i$1+=1)for(var first=parser.parseCard8(),nLeft=parser.parseCard8(),j=first;j<=first+nLeft;j+=1)enc[j]=code,code+=1}return new CffEncoding(enc,charset)}(data,start+topDict.encoding,charset),
// Prefer the CMAP encoding to the CFF encoding.
font.encoding=font.encoding||font.cffEncoding,font.glyphs=new glyphset.GlyphSet(font),opt.lowMemory)font._push=function(i){var charString=function(i,offsets,data,start,conversionFn){var count=parse.getCard16(data,start),objectOffset=0;0!==count&&(objectOffset=start+(count+1)*parse.getByte(data,start+2)+2);var value=parse.getBytes(data,objectOffset+offsets[i],objectOffset+offsets[i+1]);return conversionFn&&(value=conversionFn(value)),value}(i,charStringsIndex.offsets,data,start+topDict.charStrings);font.glyphs.push(i,glyphset.cffGlyphLoader(font,i,parseCFFCharstring,charString))};else for(var i=0;i<font.nGlyphs;i+=1){var charString=charStringsIndex.objects[i];font.glyphs.push(i,glyphset.cffGlyphLoader(font,i,parseCFFCharstring,charString))}},make:function(glyphs,options){
// Skip first glyph (.notdef)
for(var glyph,t=new table.Table("CFF ",[{name:"header",type:"RECORD"},{name:"nameIndex",type:"RECORD"},{name:"topDictIndex",type:"RECORD"},{name:"stringIndex",type:"RECORD"},{name:"globalSubrIndex",type:"RECORD"},{name:"charsets",type:"RECORD"},{name:"charStringsIndex",type:"RECORD"},{name:"privateDict",type:"RECORD"}]),fontScale=1/options.unitsPerEm,attrs={version:options.version,fullName:options.fullName,familyName:options.familyName,weight:options.weightName,fontBBox:options.fontBBox||[0,0,0,0],fontMatrix:[fontScale,0,0,fontScale,0,0],charset:999,encoding:0,charStrings:999,private:[0,999]},glyphNames=[],i=1;i<glyphs.length;i+=1)glyph=glyphs.get(i),glyphNames.push(glyph.name);var strings=[];t.header=new table.Record("Header",[{name:"major",type:"Card8",value:1},{name:"minor",type:"Card8",value:0},{name:"hdrSize",type:"Card8",value:4},{name:"major",type:"Card8",value:1}]),t.nameIndex=function(fontNames){var t=new table.Record("Name INDEX",[{name:"names",type:"INDEX",value:[]}]);t.names=[];for(var i=0;i<fontNames.length;i+=1)t.names.push({name:"name_"+i,type:"NAME",value:fontNames[i]});return t}([options.postScriptName]);var topDict=makeTopDict(attrs,strings);t.topDictIndex=makeTopDictIndex(topDict),t.globalSubrIndex=new table.Record("Global Subr INDEX",[{name:"subrs",type:"INDEX",value:[]}]),t.charsets=function(glyphNames,strings){for(var t=new table.Record("Charsets",[{name:"format",type:"Card8",value:0}]),i=0;i<glyphNames.length;i+=1){var glyphSID=encodeString(glyphNames[i],strings);t.fields.push({name:"glyph_"+i,type:"SID",value:glyphSID})}return t}(glyphNames,strings),t.charStringsIndex=function(glyphs){for(var t=new table.Record("CharStrings INDEX",[{name:"charStrings",type:"INDEX",value:[]}]),i=0;i<glyphs.length;i+=1){var glyph=glyphs.get(i),ops=glyphToOps(glyph);t.charStrings.push({name:glyph.name,type:"CHARSTRING",value:ops})}return t}(glyphs),t.privateDict=function(attrs,strings){var t=new table.Record("Private DICT",[{name:"dict",type:"DICT",value:{}}]);return t.dict=makeDict(PRIVATE_DICT_META,attrs,strings),t}({},strings),
// Needs to come at the end, to encode all custom strings used in the font.
t.stringIndex=function(strings){var t=new table.Record("String INDEX",[{name:"strings",type:"INDEX",value:[]}]);t.strings=[];for(var i=0;i<strings.length;i+=1)t.strings.push({name:"string_"+i,type:"STRING",value:strings[i]});return t}(strings);var startOffset=t.header.sizeOf()+t.nameIndex.sizeOf()+t.topDictIndex.sizeOf()+t.stringIndex.sizeOf()+t.globalSubrIndex.sizeOf();return attrs.charset=startOffset,
// We use the CFF standard encoding; proper encoding will be handled in cmap.
attrs.encoding=0,attrs.charStrings=attrs.charset+t.charsets.sizeOf(),attrs.private[1]=attrs.charStrings+t.charStringsIndex.sizeOf(),
// Recreate the Top DICT INDEX with the correct offsets.
topDict=makeTopDict(attrs,strings),t.topDictIndex=makeTopDictIndex(topDict),t}};
// The `head` table contains global information about the font.
// Parse the header `head` table
var head={parse:function(data,start){var head={},p=new parse.Parser(data,start);return head.version=p.parseVersion(),head.fontRevision=Math.round(1e3*p.parseFixed())/1e3,head.checkSumAdjustment=p.parseULong(),head.magicNumber=p.parseULong(),check.argument(1594834165===head.magicNumber,"Font header has wrong magic number."),head.flags=p.parseUShort(),head.unitsPerEm=p.parseUShort(),head.created=p.parseLongDateTime(),head.modified=p.parseLongDateTime(),head.xMin=p.parseShort(),head.yMin=p.parseShort(),head.xMax=p.parseShort(),head.yMax=p.parseShort(),head.macStyle=p.parseUShort(),head.lowestRecPPEM=p.parseUShort(),head.fontDirectionHint=p.parseShort(),head.indexToLocFormat=p.parseShort(),head.glyphDataFormat=p.parseShort(),head},make:function(options){
// Apple Mac timestamp epoch is 01/01/1904 not 01/01/1970
var timestamp=Math.round((new Date).getTime()/1e3)+2082844800,createdTimestamp=timestamp;return options.createdTimestamp&&(createdTimestamp=options.createdTimestamp+2082844800),new table.Table("head",[{name:"version",type:"FIXED",value:65536},{name:"fontRevision",type:"FIXED",value:65536},{name:"checkSumAdjustment",type:"ULONG",value:0},{name:"magicNumber",type:"ULONG",value:1594834165},{name:"flags",type:"USHORT",value:0},{name:"unitsPerEm",type:"USHORT",value:1e3},{name:"created",type:"LONGDATETIME",value:createdTimestamp},{name:"modified",type:"LONGDATETIME",value:timestamp},{name:"xMin",type:"SHORT",value:0},{name:"yMin",type:"SHORT",value:0},{name:"xMax",type:"SHORT",value:0},{name:"yMax",type:"SHORT",value:0},{name:"macStyle",type:"USHORT",value:0},{name:"lowestRecPPEM",type:"USHORT",value:0},{name:"fontDirectionHint",type:"SHORT",value:2},{name:"indexToLocFormat",type:"SHORT",value:0},{name:"glyphDataFormat",type:"SHORT",value:0}],options)}};
// The `hhea` table contains information for horizontal layout.
// Parse the horizontal header `hhea` table
var hhea={parse:function(data,start){var hhea={},p=new parse.Parser(data,start);return hhea.version=p.parseVersion(),hhea.ascender=p.parseShort(),hhea.descender=p.parseShort(),hhea.lineGap=p.parseShort(),hhea.advanceWidthMax=p.parseUShort(),hhea.minLeftSideBearing=p.parseShort(),hhea.minRightSideBearing=p.parseShort(),hhea.xMaxExtent=p.parseShort(),hhea.caretSlopeRise=p.parseShort(),hhea.caretSlopeRun=p.parseShort(),hhea.caretOffset=p.parseShort(),p.relativeOffset+=8,hhea.metricDataFormat=p.parseShort(),hhea.numberOfHMetrics=p.parseUShort(),hhea},make:function(options){return new table.Table("hhea",[{name:"version",type:"FIXED",value:65536},{name:"ascender",type:"FWORD",value:0},{name:"descender",type:"FWORD",value:0},{name:"lineGap",type:"FWORD",value:0},{name:"advanceWidthMax",type:"UFWORD",value:0},{name:"minLeftSideBearing",type:"FWORD",value:0},{name:"minRightSideBearing",type:"FWORD",value:0},{name:"xMaxExtent",type:"FWORD",value:0},{name:"caretSlopeRise",type:"SHORT",value:1},{name:"caretSlopeRun",type:"SHORT",value:0},{name:"caretOffset",type:"SHORT",value:0},{name:"reserved1",type:"SHORT",value:0},{name:"reserved2",type:"SHORT",value:0},{name:"reserved3",type:"SHORT",value:0},{name:"reserved4",type:"SHORT",value:0},{name:"metricDataFormat",type:"SHORT",value:0},{name:"numberOfHMetrics",type:"USHORT",value:0}],options)}};
// The `hmtx` table contains the horizontal metrics for all glyphs.
var hmtx={parse:
// Parse the `hmtx` table, which contains the horizontal metrics for all glyphs.
// This function augments the glyph array, adding the advanceWidth and leftSideBearing to each glyph.
function(font,data,start,numMetrics,numGlyphs,glyphs,opt){opt.lowMemory?function(font,data,start,numMetrics,numGlyphs){var advanceWidth,leftSideBearing;font._hmtxTableData={};for(var p=new parse.Parser(data,start),i=0;i<numGlyphs;i+=1)
// If the font is monospaced, only one entry is needed. This last entry applies to all subsequent glyphs.
i<numMetrics&&(advanceWidth=p.parseUShort(),leftSideBearing=p.parseShort()),font._hmtxTableData[i]={advanceWidth,leftSideBearing}}(font,data,start,numMetrics,numGlyphs):function(data,start,numMetrics,numGlyphs,glyphs){for(var advanceWidth,leftSideBearing,p=new parse.Parser(data,start),i=0;i<numGlyphs;i+=1){
// If the font is monospaced, only one entry is needed. This last entry applies to all subsequent glyphs.
i<numMetrics&&(advanceWidth=p.parseUShort(),leftSideBearing=p.parseShort());var glyph=glyphs.get(i);glyph.advanceWidth=advanceWidth,glyph.leftSideBearing=leftSideBearing}}(data,start,numMetrics,numGlyphs,glyphs)},make:function(glyphs){for(var t=new table.Table("hmtx",[]),i=0;i<glyphs.length;i+=1){var glyph=glyphs.get(i),advanceWidth=glyph.advanceWidth||0,leftSideBearing=glyph.leftSideBearing||0;t.fields.push({name:"advanceWidth_"+i,type:"USHORT",value:advanceWidth}),t.fields.push({name:"leftSideBearing_"+i,type:"SHORT",value:leftSideBearing})}return t}};
// The `ltag` table stores IETF BCP-47 language tags. It allows supporting
var ltag={make:function(tags){for(var result=new table.Table("ltag",[{name:"version",type:"ULONG",value:1},{name:"flags",type:"ULONG",value:0},{name:"numTags",type:"ULONG",value:tags.length}]),stringPool="",stringPoolOffset=12+4*tags.length,i=0;i<tags.length;++i){var pos=stringPool.indexOf(tags[i]);pos<0&&(pos=stringPool.length,stringPool+=tags[i]),result.fields.push({name:"offset "+i,type:"USHORT",value:stringPoolOffset+pos}),result.fields.push({name:"length "+i,type:"USHORT",value:tags[i].length})}return result.fields.push({name:"stringPool",type:"CHARARRAY",value:stringPool}),result},parse:function(data,start){var p=new parse.Parser(data,start),tableVersion=p.parseULong();check.argument(1===tableVersion,"Unsupported ltag table version."),
// The 'ltag' specification does not define any flags; skip the field.
p.skip("uLong",1);for(var numTags=p.parseULong(),tags=[],i=0;i<numTags;i++){for(var tag="",offset=start+p.parseUShort(),length=p.parseUShort(),j=offset;j<offset+length;++j)tag+=String.fromCharCode(data.getInt8(j));tags.push(tag)}return tags}};
// The `maxp` table establishes the memory requirements for the font.
// Parse the maximum profile `maxp` table.
var maxp={parse:function(data,start){var maxp={},p=new parse.Parser(data,start);return maxp.version=p.parseVersion(),maxp.numGlyphs=p.parseUShort(),1===maxp.version&&(maxp.maxPoints=p.parseUShort(),maxp.maxContours=p.parseUShort(),maxp.maxCompositePoints=p.parseUShort(),maxp.maxCompositeContours=p.parseUShort(),maxp.maxZones=p.parseUShort(),maxp.maxTwilightPoints=p.parseUShort(),maxp.maxStorage=p.parseUShort(),maxp.maxFunctionDefs=p.parseUShort(),maxp.maxInstructionDefs=p.parseUShort(),maxp.maxStackElements=p.parseUShort(),maxp.maxSizeOfInstructions=p.parseUShort(),maxp.maxComponentElements=p.parseUShort(),maxp.maxComponentDepth=p.parseUShort()),maxp},make:function(numGlyphs){return new table.Table("maxp",[{name:"version",type:"FIXED",value:20480},{name:"numGlyphs",type:"USHORT",value:numGlyphs}])}},nameTableNames=["copyright",// 0
"fontFamily",// 1
"fontSubfamily",// 2
"uniqueID",// 3
"fullName",// 4
"version",// 5
"postScriptName",// 6
"trademark",// 7
"manufacturer",// 8
"designer",// 9
"description",// 10
"manufacturerURL",// 11
"designerURL",// 12
"license",// 13
"licenseURL",// 14
"reserved",// 15
"preferredFamily",// 16
"preferredSubfamily",// 17
"compatibleFullName",// 18
"sampleText",// 19
"postScriptFindFontName",// 20
"wwsFamily",// 21
"wwsSubfamily"],macLanguages={0:"en",1:"fr",2:"de",3:"it",4:"nl",5:"sv",6:"es",7:"da",8:"pt",9:"no",10:"he",11:"ja",12:"ar",13:"fi",14:"el",15:"is",16:"mt",17:"tr",18:"hr",19:"zh-Hant",20:"ur",21:"hi",22:"th",23:"ko",24:"lt",25:"pl",26:"hu",27:"es",28:"lv",29:"se",30:"fo",31:"fa",32:"ru",33:"zh",34:"nl-BE",35:"ga",36:"sq",37:"ro",38:"cz",39:"sk",40:"si",41:"yi",42:"sr",43:"mk",44:"bg",45:"uk",46:"be",47:"uz",48:"kk",49:"az-Cyrl",50:"az-Arab",51:"hy",52:"ka",53:"mo",54:"ky",55:"tg",56:"tk",57:"mn-CN",58:"mn",59:"ps",60:"ks",61:"ku",62:"sd",63:"bo",64:"ne",65:"sa",66:"mr",67:"bn",68:"as",69:"gu",70:"pa",71:"or",72:"ml",73:"kn",74:"ta",75:"te",76:"si",77:"my",78:"km",79:"lo",80:"vi",81:"id",82:"tl",83:"ms",84:"ms-Arab",85:"am",86:"ti",87:"om",88:"so",89:"sw",90:"rw",91:"rn",92:"ny",93:"mg",94:"eo",128:"cy",129:"eu",130:"ca",131:"la",132:"qu",133:"gn",134:"ay",135:"tt",136:"ug",137:"dz",138:"jv",139:"su",140:"gl",141:"af",142:"br",143:"iu",144:"gd",145:"gv",146:"ga",147:"to",148:"el-polyton",149:"kl",150:"az",151:"nn"},macLanguageToScript={0:0,// langEnglish → smRoman
1:0,// langFrench → smRoman
2:0,// langGerman → smRoman
3:0,// langItalian → smRoman
4:0,// langDutch → smRoman
5:0,// langSwedish → smRoman
6:0,// langSpanish → smRoman
7:0,// langDanish → smRoman
8:0,// langPortuguese → smRoman
9:0,// langNorwegian → smRoman
10:5,// langHebrew → smHebrew
11:1,// langJapanese → smJapanese
12:4,// langArabic → smArabic
13:0,// langFinnish → smRoman
14:6,// langGreek → smGreek
15:0,// langIcelandic → smRoman (modified)
16:0,// langMaltese → smRoman
17:0,// langTurkish → smRoman (modified)
18:0,// langCroatian → smRoman (modified)
19:2,// langTradChinese → smTradChinese
20:4,// langUrdu → smArabic
21:9,// langHindi → smDevanagari
22:21,// langThai → smThai
23:3,// langKorean → smKorean
24:29,// langLithuanian → smCentralEuroRoman
25:29,// langPolish → smCentralEuroRoman
26:29,// langHungarian → smCentralEuroRoman
27:29,// langEstonian → smCentralEuroRoman
28:29,// langLatvian → smCentralEuroRoman
29:0,// langSami → smRoman
30:0,// langFaroese → smRoman (modified)
31:4,// langFarsi → smArabic (modified)
32:7,// langRussian → smCyrillic
33:25,// langSimpChinese → smSimpChinese
34:0,// langFlemish → smRoman
35:0,// langIrishGaelic → smRoman (modified)
36:0,// langAlbanian → smRoman
37:0,// langRomanian → smRoman (modified)
38:29,// langCzech → smCentralEuroRoman
39:29,// langSlovak → smCentralEuroRoman
40:0,// langSlovenian → smRoman (modified)
41:5,// langYiddish → smHebrew
42:7,// langSerbian → smCyrillic
43:7,// langMacedonian → smCyrillic
44:7,// langBulgarian → smCyrillic
45:7,// langUkrainian → smCyrillic (modified)
46:7,// langByelorussian → smCyrillic
47:7,// langUzbek → smCyrillic
48:7,// langKazakh → smCyrillic
49:7,// langAzerbaijani → smCyrillic
50:4,// langAzerbaijanAr → smArabic
51:24,// langArmenian → smArmenian
52:23,// langGeorgian → smGeorgian
53:7,// langMoldavian → smCyrillic
54:7,// langKirghiz → smCyrillic
55:7,// langTajiki → smCyrillic
56:7,// langTurkmen → smCyrillic
57:27,// langMongolian → smMongolian
58:7,// langMongolianCyr → smCyrillic
59:4,// langPashto → smArabic
60:4,// langKurdish → smArabic
61:4,// langKashmiri → smArabic
62:4,// langSindhi → smArabic
63:26,// langTibetan → smTibetan
64:9,// langNepali → smDevanagari
65:9,// langSanskrit → smDevanagari
66:9,// langMarathi → smDevanagari
67:13,// langBengali → smBengali
68:13,// langAssamese → smBengali
69:11,// langGujarati → smGujarati
70:10,// langPunjabi → smGurmukhi
71:12,// langOriya → smOriya
72:17,// langMalayalam → smMalayalam
73:16,// langKannada → smKannada
74:14,// langTamil → smTamil
75:15,// langTelugu → smTelugu
76:18,// langSinhalese → smSinhalese
77:19,// langBurmese → smBurmese
78:20,// langKhmer → smKhmer
79:22,// langLao → smLao
80:30,// langVietnamese → smVietnamese
81:0,// langIndonesian → smRoman
82:0,// langTagalog → smRoman
83:0,// langMalayRoman → smRoman
84:4,// langMalayArabic → smArabic
85:28,// langAmharic → smEthiopic
86:28,// langTigrinya → smEthiopic
87:28,// langOromo → smEthiopic
88:0,// langSomali → smRoman
89:0,// langSwahili → smRoman
90:0,// langKinyarwanda → smRoman
91:0,// langRundi → smRoman
92:0,// langNyanja → smRoman
93:0,// langMalagasy → smRoman
94:0,// langEsperanto → smRoman
128:0,// langWelsh → smRoman (modified)
129:0,// langBasque → smRoman
130:0,// langCatalan → smRoman
131:0,// langLatin → smRoman
132:0,// langQuechua → smRoman
133:0,// langGuarani → smRoman
134:0,// langAymara → smRoman
135:7,// langTatar → smCyrillic
136:4,// langUighur → smArabic
137:26,// langDzongkha → smTibetan
138:0,// langJavaneseRom → smRoman
139:0,// langSundaneseRom → smRoman
140:0,// langGalician → smRoman
141:0,// langAfrikaans → smRoman
142:0,// langBreton → smRoman (modified)
143:28,// langInuktitut → smEthiopic (modified)
144:0,// langScottishGaelic → smRoman (modified)
145:0,// langManxGaelic → smRoman (modified)
146:0,// langIrishGaelicScript → smRoman (modified)
147:0,// langTongan → smRoman
148:6,// langGreekAncient → smRoman
149:0,// langGreenlandic → smRoman
150:0,// langAzerbaijanRoman → smRoman
151:0},windowsLanguages={1078:"af",1052:"sq",1156:"gsw",1118:"am",5121:"ar-DZ",15361:"ar-BH",3073:"ar",2049:"ar-IQ",11265:"ar-JO",13313:"ar-KW",12289:"ar-LB",4097:"ar-LY",6145:"ary",8193:"ar-OM",16385:"ar-QA",1025:"ar-SA",10241:"ar-SY",7169:"aeb",14337:"ar-AE",9217:"ar-YE",1067:"hy",1101:"as",2092:"az-Cyrl",1068:"az",1133:"ba",1069:"eu",1059:"be",2117:"bn",1093:"bn-IN",8218:"bs-Cyrl",5146:"bs",1150:"br",1026:"bg",1027:"ca",3076:"zh-HK",5124:"zh-MO",2052:"zh",4100:"zh-SG",1028:"zh-TW",1155:"co",1050:"hr",4122:"hr-BA",1029:"cs",1030:"da",1164:"prs",1125:"dv",2067:"nl-BE",1043:"nl",3081:"en-AU",10249:"en-BZ",4105:"en-CA",9225:"en-029",16393:"en-IN",6153:"en-IE",8201:"en-JM",17417:"en-MY",5129:"en-NZ",13321:"en-PH",18441:"en-SG",7177:"en-ZA",11273:"en-TT",2057:"en-GB",1033:"en",12297:"en-ZW",1061:"et",1080:"fo",1124:"fil",1035:"fi",2060:"fr-BE",3084:"fr-CA",1036:"fr",5132:"fr-LU",6156:"fr-MC",4108:"fr-CH",1122:"fy",1110:"gl",1079:"ka",3079:"de-AT",1031:"de",5127:"de-LI",4103:"de-LU",2055:"de-CH",1032:"el",1135:"kl",1095:"gu",1128:"ha",1037:"he",1081:"hi",1038:"hu",1039:"is",1136:"ig",1057:"id",1117:"iu",2141:"iu-Latn",2108:"ga",1076:"xh",1077:"zu",1040:"it",2064:"it-CH",1041:"ja",1099:"kn",1087:"kk",1107:"km",1158:"quc",1159:"rw",1089:"sw",1111:"kok",1042:"ko",1088:"ky",1108:"lo",1062:"lv",1063:"lt",2094:"dsb",1134:"lb",1071:"mk",2110:"ms-BN",1086:"ms",1100:"ml",1082:"mt",1153:"mi",1146:"arn",1102:"mr",1148:"moh",1104:"mn",2128:"mn-CN",1121:"ne",1044:"nb",2068:"nn",1154:"oc",1096:"or",1123:"ps",1045:"pl",1046:"pt",2070:"pt-PT",1094:"pa",1131:"qu-BO",2155:"qu-EC",3179:"qu",1048:"ro",1047:"rm",1049:"ru",9275:"smn",4155:"smj-NO",5179:"smj",3131:"se-FI",1083:"se",2107:"se-SE",8251:"sms",6203:"sma-NO",7227:"sms",1103:"sa",7194:"sr-Cyrl-BA",3098:"sr",6170:"sr-Latn-BA",2074:"sr-Latn",1132:"nso",1074:"tn",1115:"si",1051:"sk",1060:"sl",11274:"es-AR",16394:"es-BO",13322:"es-CL",9226:"es-CO",5130:"es-CR",7178:"es-DO",12298:"es-EC",17418:"es-SV",4106:"es-GT",18442:"es-HN",2058:"es-MX",19466:"es-NI",6154:"es-PA",15370:"es-PY",10250:"es-PE",20490:"es-PR",
// Microsoft has defined two different language codes for
// “Spanish with modern sorting” and “Spanish with traditional
// sorting”. This makes sense for collation APIs, and it would be
// possible to express this in BCP 47 language tags via Unicode
// extensions (eg., es-u-co-trad is Spanish with traditional
// sorting). However, for storing names in fonts, the distinction
// does not make sense, so we give “es” in both cases.
3082:"es",1034:"es",21514:"es-US",14346:"es-UY",8202:"es-VE",2077:"sv-FI",1053:"sv",1114:"syr",1064:"tg",2143:"tzm",1097:"ta",1092:"tt",1098:"te",1054:"th",1105:"bo",1055:"tr",1090:"tk",1152:"ug",1058:"uk",1070:"hsb",1056:"ur",2115:"uz-Cyrl",1091:"uz",1066:"vi",1106:"cy",1160:"wo",1157:"sah",1144:"ii",1130:"yo"};
// The `name` naming table.
// NameIDs for the name table.
// Returns a IETF BCP 47 language code, for example 'zh-Hant'
// for 'Chinese in the traditional script'.
function getLanguageCode(platformID,languageID,ltag){switch(platformID){case 0:// Unicode
if(65535===languageID)return"und";if(ltag)return ltag[languageID];break;case 1:// Macintosh
return macLanguages[languageID];case 3:// Windows
return windowsLanguages[languageID]}}var macScriptEncodings={0:"macintosh",// smRoman
1:"x-mac-japanese",// smJapanese
2:"x-mac-chinesetrad",// smTradChinese
3:"x-mac-korean",// smKorean
6:"x-mac-greek",// smGreek
7:"x-mac-cyrillic",// smCyrillic
9:"x-mac-devanagai",// smDevanagari
10:"x-mac-gurmukhi",// smGurmukhi
11:"x-mac-gujarati",// smGujarati
12:"x-mac-oriya",// smOriya
13:"x-mac-bengali",// smBengali
14:"x-mac-tamil",// smTamil
15:"x-mac-telugu",// smTelugu
16:"x-mac-kannada",// smKannada
17:"x-mac-malayalam",// smMalayalam
18:"x-mac-sinhalese",// smSinhalese
19:"x-mac-burmese",// smBurmese
20:"x-mac-khmer",// smKhmer
21:"x-mac-thai",// smThai
22:"x-mac-lao",// smLao
23:"x-mac-georgian",// smGeorgian
24:"x-mac-armenian",// smArmenian
25:"x-mac-chinesesimp",// smSimpChinese
26:"x-mac-tibetan",// smTibetan
27:"x-mac-mongolian",// smMongolian
28:"x-mac-ethiopic",// smEthiopic
29:"x-mac-ce",// smCentralEuroRoman
30:"x-mac-vietnamese",// smVietnamese
31:"x-mac-extarabic"},macLanguageEncodings={15:"x-mac-icelandic",// langIcelandic
17:"x-mac-turkish",// langTurkish
18:"x-mac-croatian",// langCroatian
24:"x-mac-ce",// langLithuanian
25:"x-mac-ce",// langPolish
26:"x-mac-ce",// langHungarian
27:"x-mac-ce",// langEstonian
28:"x-mac-ce",// langLatvian
30:"x-mac-icelandic",// langFaroese
37:"x-mac-romanian",// langRomanian
38:"x-mac-ce",// langCzech
39:"x-mac-ce",// langSlovak
40:"x-mac-ce",// langSlovenian
143:"x-mac-inuit",// langInuktitut
146:"x-mac-gaelic"};
// MacOS script ID → encoding. This table stores the default case,
// which can be overridden by macLanguageEncodings.
function getEncoding(platformID,encodingID,languageID){switch(platformID){case 0:// Unicode
return"utf-16";case 1:// Apple Macintosh
return macLanguageEncodings[languageID]||macScriptEncodings[encodingID];case 3:// Microsoft Windows
if(1===encodingID||10===encodingID)return"utf-16"}}
// Parse the naming `name` table.
// FIXME: Format 1 additional fields are not supported yet.
// ltag is the content of the `ltag' table, such as ['en', 'zh-Hans', 'de-CH-1904'].
// {23: 'foo'} → {'foo': 23}
// ['bar', 'baz'] → {'bar': 0, 'baz': 1}
function reverseDict(dict){var result={};for(var key in dict)result[dict[key]]=parseInt(key);return result}function makeNameRecord(platformID,encodingID,languageID,nameID,length,offset){return new table.Record("NameRecord",[{name:"platformID",type:"USHORT",value:platformID},{name:"encodingID",type:"USHORT",value:encodingID},{name:"languageID",type:"USHORT",value:languageID},{name:"nameID",type:"USHORT",value:nameID},{name:"length",type:"USHORT",value:length},{name:"offset",type:"USHORT",value:offset}])}
// Finds the position of needle in haystack, or -1 if not there.
// Like String.indexOf(), but for arrays.
function addStringToPool(s,pool){var offset=function(needle,haystack){var needleLength=needle.length,limit=haystack.length-needleLength+1;loop:for(var pos=0;pos<limit;pos++)for(;pos<limit;pos++){for(var k=0;k<needleLength;k++)if(haystack[pos+k]!==needle[k])continue loop;return pos}return-1}(s,pool);if(offset<0){offset=pool.length;for(var i=0,len=s.length;i<len;++i)pool.push(s[i])}return offset}var _name={parse:function(data,start,ltag){for(var name={},p=new parse.Parser(data,start),format=p.parseUShort(),count=p.parseUShort(),stringOffset=p.offset+p.parseUShort(),i=0;i<count;i++){var platformID=p.parseUShort(),encodingID=p.parseUShort(),languageID=p.parseUShort(),nameID=p.parseUShort(),property=nameTableNames[nameID]||nameID,byteLength=p.parseUShort(),offset=p.parseUShort(),language=getLanguageCode(platformID,languageID,ltag),encoding=getEncoding(platformID,encodingID,languageID);if(void 0!==encoding&&void 0!==language){var text=void 0;if(text="utf-16"===encoding?decode.UTF16(data,stringOffset+offset,byteLength):decode.MACSTRING(data,stringOffset+offset,byteLength,encoding)){var translations=name[property];void 0===translations&&(translations=name[property]={}),translations[language]=text}}}return 1===format&&p.parseUShort(),name},make:function(names,ltag){var nameID,nameIDs=[],namesWithNumericKeys={},nameTableIds=reverseDict(nameTableNames);for(var key in names){var id=nameTableIds[key];if(void 0===id&&(id=key),nameID=parseInt(id),isNaN(nameID))throw new Error('Name table entry "'+key+'" does not exist, see nameTableNames for complete list.');namesWithNumericKeys[nameID]=names[key],nameIDs.push(nameID)}for(var macLanguageIds=reverseDict(macLanguages),windowsLanguageIds=reverseDict(windowsLanguages),nameRecords=[],stringPool=[],i=0;i<nameIDs.length;i++){var translations=namesWithNumericKeys[nameID=nameIDs[i]];for(var lang in translations){var text=translations[lang],macPlatform=1,macLanguage=macLanguageIds[lang],macScript=macLanguageToScript[macLanguage],macEncoding=getEncoding(macPlatform,macScript,macLanguage),macName=encode.MACSTRING(text,macEncoding);
// For MacOS, we try to emit the name in the form that was introduced
// in the initial version of the TrueType spec (in the late 1980s).
// However, this can fail for various reasons: the requested BCP 47
// language code might not have an old-style Mac equivalent;
// we might not have a codec for the needed character encoding;
// or the name might contain characters that cannot be expressed
// in the old-style Macintosh encoding. In case of failure, we emit
// the name in a more modern fashion (Unicode encoding with BCP 47
// language tags) that is recognized by MacOS 10.5, released in 2009.
// If fonts were only read by operating systems, we could simply
// emit all names in the modern form; this would be much easier.
// However, there are many applications and libraries that read
// 'name' tables directly, and these will usually only recognize
// the ancient form (silently skipping the unrecognized names).
void 0===macName&&(macPlatform=0,(// Unicode
macLanguage=ltag.indexOf(lang))<0&&(macLanguage=ltag.length,ltag.push(lang)),macScript=4,// Unicode 2.0 and later
macName=encode.UTF16(text));var macNameOffset=addStringToPool(macName,stringPool);nameRecords.push(makeNameRecord(macPlatform,macScript,macLanguage,nameID,macName.length,macNameOffset));var winLanguage=windowsLanguageIds[lang];if(void 0!==winLanguage){var winName=encode.UTF16(text),winNameOffset=addStringToPool(winName,stringPool);nameRecords.push(makeNameRecord(3,1,winLanguage,nameID,winName.length,winNameOffset))}}}nameRecords.sort(function(a,b){return a.platformID-b.platformID||a.encodingID-b.encodingID||a.languageID-b.languageID||a.nameID-b.nameID});for(var t=new table.Table("name",[{name:"format",type:"USHORT",value:0},{name:"count",type:"USHORT",value:nameRecords.length},{name:"stringOffset",type:"USHORT",value:6+12*nameRecords.length}]),r=0;r<nameRecords.length;r++)t.fields.push({name:"record_"+r,type:"RECORD",value:nameRecords[r]});return t.fields.push({name:"strings",type:"LITERAL",value:stringPool}),t}},unicodeRanges=[{begin:0,end:127},// Basic Latin
{begin:128,end:255},// Latin-1 Supplement
{begin:256,end:383},// Latin Extended-A
{begin:384,end:591},// Latin Extended-B
{begin:592,end:687},// IPA Extensions
{begin:688,end:767},// Spacing Modifier Letters
{begin:768,end:879},// Combining Diacritical Marks
{begin:880,end:1023},// Greek and Coptic
{begin:11392,end:11519},// Coptic
{begin:1024,end:1279},// Cyrillic
{begin:1328,end:1423},// Armenian
{begin:1424,end:1535},// Hebrew
{begin:42240,end:42559},// Vai
{begin:1536,end:1791},// Arabic
{begin:1984,end:2047},// NKo
{begin:2304,end:2431},// Devanagari
{begin:2432,end:2559},// Bengali
{begin:2560,end:2687},// Gurmukhi
{begin:2688,end:2815},// Gujarati
{begin:2816,end:2943},// Oriya
{begin:2944,end:3071},// Tamil
{begin:3072,end:3199},// Telugu
{begin:3200,end:3327},// Kannada
{begin:3328,end:3455},// Malayalam
{begin:3584,end:3711},// Thai
{begin:3712,end:3839},// Lao
{begin:4256,end:4351},// Georgian
{begin:6912,end:7039},// Balinese
{begin:4352,end:4607},// Hangul Jamo
{begin:7680,end:7935},// Latin Extended Additional
{begin:7936,end:8191},// Greek Extended
{begin:8192,end:8303},// General Punctuation
{begin:8304,end:8351},// Superscripts And Subscripts
{begin:8352,end:8399},// Currency Symbol
{begin:8400,end:8447},// Combining Diacritical Marks For Symbols
{begin:8448,end:8527},// Letterlike Symbols
{begin:8528,end:8591},// Number Forms
{begin:8592,end:8703},// Arrows
{begin:8704,end:8959},// Mathematical Operators
{begin:8960,end:9215},// Miscellaneous Technical
{begin:9216,end:9279},// Control Pictures
{begin:9280,end:9311},// Optical Character Recognition
{begin:9312,end:9471},// Enclosed Alphanumerics
{begin:9472,end:9599},// Box Drawing
{begin:9600,end:9631},// Block Elements
{begin:9632,end:9727},// Geometric Shapes
{begin:9728,end:9983},// Miscellaneous Symbols
{begin:9984,end:10175},// Dingbats
{begin:12288,end:12351},// CJK Symbols And Punctuation
{begin:12352,end:12447},// Hiragana
{begin:12448,end:12543},// Katakana
{begin:12544,end:12591},// Bopomofo
{begin:12592,end:12687},// Hangul Compatibility Jamo
{begin:43072,end:43135},// Phags-pa
{begin:12800,end:13055},// Enclosed CJK Letters And Months
{begin:13056,end:13311},// CJK Compatibility
{begin:44032,end:55215},// Hangul Syllables
{begin:55296,end:57343},// Non-Plane 0 *
{begin:67840,end:67871},// Phoenicia
{begin:19968,end:40959},// CJK Unified Ideographs
{begin:57344,end:63743},// Private Use Area (plane 0)
{begin:12736,end:12783},// CJK Strokes
{begin:64256,end:64335},// Alphabetic Presentation Forms
{begin:64336,end:65023},// Arabic Presentation Forms-A
{begin:65056,end:65071},// Combining Half Marks
{begin:65040,end:65055},// Vertical Forms
{begin:65104,end:65135},// Small Form Variants
{begin:65136,end:65279},// Arabic Presentation Forms-B
{begin:65280,end:65519},// Halfwidth And Fullwidth Forms
{begin:65520,end:65535},// Specials
{begin:3840,end:4095},// Tibetan
{begin:1792,end:1871},// Syriac
{begin:1920,end:1983},// Thaana
{begin:3456,end:3583},// Sinhala
{begin:4096,end:4255},// Myanmar
{begin:4608,end:4991},// Ethiopic
{begin:5024,end:5119},// Cherokee
{begin:5120,end:5759},// Unified Canadian Aboriginal Syllabics
{begin:5760,end:5791},// Ogham
{begin:5792,end:5887},// Runic
{begin:6016,end:6143},// Khmer
{begin:6144,end:6319},// Mongolian
{begin:10240,end:10495},// Braille Patterns
{begin:40960,end:42127},// Yi Syllables
{begin:5888,end:5919},// Tagalog
{begin:66304,end:66351},// Old Italic
{begin:66352,end:66383},// Gothic
{begin:66560,end:66639},// Deseret
{begin:118784,end:119039},// Byzantine Musical Symbols
{begin:119808,end:120831},// Mathematical Alphanumeric Symbols
{begin:1044480,end:1048573},// Private Use (plane 15)
{begin:65024,end:65039},// Variation Selectors
{begin:917504,end:917631},// Tags
{begin:6400,end:6479},// Limbu
{begin:6480,end:6527},// Tai Le
{begin:6528,end:6623},// New Tai Lue
{begin:6656,end:6687},// Buginese
{begin:11264,end:11359},// Glagolitic
{begin:11568,end:11647},// Tifinagh
{begin:19904,end:19967},// Yijing Hexagram Symbols
{begin:43008,end:43055},// Syloti Nagri
{begin:65536,end:65663},// Linear B Syllabary
{begin:65856,end:65935},// Ancient Greek Numbers
{begin:66432,end:66463},// Ugaritic
{begin:66464,end:66527},// Old Persian
{begin:66640,end:66687},// Shavian
{begin:66688,end:66735},// Osmanya
{begin:67584,end:67647},// Cypriot Syllabary
{begin:68096,end:68191},// Kharoshthi
{begin:119552,end:119647},// Tai Xuan Jing Symbols
{begin:73728,end:74751},// Cuneiform
{begin:119648,end:119679},// Counting Rod Numerals
{begin:7040,end:7103},// Sundanese
{begin:7168,end:7247},// Lepcha
{begin:7248,end:7295},// Ol Chiki
{begin:43136,end:43231},// Saurashtra
{begin:43264,end:43311},// Kayah Li
{begin:43312,end:43359},// Rejang
{begin:43520,end:43615},// Cham
{begin:65936,end:65999},// Ancient Symbols
{begin:66e3,end:66047},// Phaistos Disc
{begin:66208,end:66271},// Carian
{begin:127024,end:127135}];
// The `OS/2` table contains metrics required in OpenType fonts.
var os2={parse:
// Parse the OS/2 and Windows metrics `OS/2` table
function(data,start){var os2={},p=new parse.Parser(data,start);os2.version=p.parseUShort(),os2.xAvgCharWidth=p.parseShort(),os2.usWeightClass=p.parseUShort(),os2.usWidthClass=p.parseUShort(),os2.fsType=p.parseUShort(),os2.ySubscriptXSize=p.parseShort(),os2.ySubscriptYSize=p.parseShort(),os2.ySubscriptXOffset=p.parseShort(),os2.ySubscriptYOffset=p.parseShort(),os2.ySuperscriptXSize=p.parseShort(),os2.ySuperscriptYSize=p.parseShort(),os2.ySuperscriptXOffset=p.parseShort(),os2.ySuperscriptYOffset=p.parseShort(),os2.yStrikeoutSize=p.parseShort(),os2.yStrikeoutPosition=p.parseShort(),os2.sFamilyClass=p.parseShort(),os2.panose=[];for(var i=0;i<10;i++)os2.panose[i]=p.parseByte();return os2.ulUnicodeRange1=p.parseULong(),os2.ulUnicodeRange2=p.parseULong(),os2.ulUnicodeRange3=p.parseULong(),os2.ulUnicodeRange4=p.parseULong(),os2.achVendID=String.fromCharCode(p.parseByte(),p.parseByte(),p.parseByte(),p.parseByte()),os2.fsSelection=p.parseUShort(),os2.usFirstCharIndex=p.parseUShort(),os2.usLastCharIndex=p.parseUShort(),os2.sTypoAscender=p.parseShort(),os2.sTypoDescender=p.parseShort(),os2.sTypoLineGap=p.parseShort(),os2.usWinAscent=p.parseUShort(),os2.usWinDescent=p.parseUShort(),os2.version>=1&&(os2.ulCodePageRange1=p.parseULong(),os2.ulCodePageRange2=p.parseULong()),os2.version>=2&&(os2.sxHeight=p.parseShort(),os2.sCapHeight=p.parseShort(),os2.usDefaultChar=p.parseUShort(),os2.usBreakChar=p.parseUShort(),os2.usMaxContent=p.parseUShort()),os2},make:function(options){return new table.Table("OS/2",[{name:"version",type:"USHORT",value:3},{name:"xAvgCharWidth",type:"SHORT",value:0},{name:"usWeightClass",type:"USHORT",value:0},{name:"usWidthClass",type:"USHORT",value:0},{name:"fsType",type:"USHORT",value:0},{name:"ySubscriptXSize",type:"SHORT",value:650},{name:"ySubscriptYSize",type:"SHORT",value:699},{name:"ySubscriptXOffset",type:"SHORT",value:0},{name:"ySubscriptYOffset",type:"SHORT",value:140},{name:"ySuperscriptXSize",type:"SHORT",value:650},{name:"ySuperscriptYSize",type:"SHORT",value:699},{name:"ySuperscriptXOffset",type:"SHORT",value:0},{name:"ySuperscriptYOffset",type:"SHORT",value:479},{name:"yStrikeoutSize",type:"SHORT",value:49},{name:"yStrikeoutPosition",type:"SHORT",value:258},{name:"sFamilyClass",type:"SHORT",value:0},{name:"bFamilyType",type:"BYTE",value:0},{name:"bSerifStyle",type:"BYTE",value:0},{name:"bWeight",type:"BYTE",value:0},{name:"bProportion",type:"BYTE",value:0},{name:"bContrast",type:"BYTE",value:0},{name:"bStrokeVariation",type:"BYTE",value:0},{name:"bArmStyle",type:"BYTE",value:0},{name:"bLetterform",type:"BYTE",value:0},{name:"bMidline",type:"BYTE",value:0},{name:"bXHeight",type:"BYTE",value:0},{name:"ulUnicodeRange1",type:"ULONG",value:0},{name:"ulUnicodeRange2",type:"ULONG",value:0},{name:"ulUnicodeRange3",type:"ULONG",value:0},{name:"ulUnicodeRange4",type:"ULONG",value:0},{name:"achVendID",type:"CHARARRAY",value:"XXXX"},{name:"fsSelection",type:"USHORT",value:0},{name:"usFirstCharIndex",type:"USHORT",value:0},{name:"usLastCharIndex",type:"USHORT",value:0},{name:"sTypoAscender",type:"SHORT",value:0},{name:"sTypoDescender",type:"SHORT",value:0},{name:"sTypoLineGap",type:"SHORT",value:0},{name:"usWinAscent",type:"USHORT",value:0},{name:"usWinDescent",type:"USHORT",value:0},{name:"ulCodePageRange1",type:"ULONG",value:0},{name:"ulCodePageRange2",type:"ULONG",value:0},{name:"sxHeight",type:"SHORT",value:0},{name:"sCapHeight",type:"SHORT",value:0},{name:"usDefaultChar",type:"USHORT",value:0},{name:"usBreakChar",type:"USHORT",value:0},{name:"usMaxContext",type:"USHORT",value:0}],options)},unicodeRanges,getUnicodeRange:function(unicode){for(var i=0;i<unicodeRanges.length;i+=1){var range=unicodeRanges[i];if(unicode>=range.begin&&unicode<range.end)return i}return-1}};
// The `post` table stores additional PostScript information, such as glyph names.
// Parse the PostScript `post` table
var post={parse:function(data,start){var post={},p=new parse.Parser(data,start);switch(post.version=p.parseVersion(),post.italicAngle=p.parseFixed(),post.underlinePosition=p.parseShort(),post.underlineThickness=p.parseShort(),post.isFixedPitch=p.parseULong(),post.minMemType42=p.parseULong(),post.maxMemType42=p.parseULong(),post.minMemType1=p.parseULong(),post.maxMemType1=p.parseULong(),post.version){case 1:post.names=standardNames.slice();break;case 2:post.numberOfGlyphs=p.parseUShort(),post.glyphNameIndex=new Array(post.numberOfGlyphs);for(var i=0;i<post.numberOfGlyphs;i++)post.glyphNameIndex[i]=p.parseUShort();post.names=[];for(var i$1=0;i$1<post.numberOfGlyphs;i$1++)if(post.glyphNameIndex[i$1]>=standardNames.length){var nameLength=p.parseChar();post.names.push(p.parseString(nameLength))}break;case 2.5:post.numberOfGlyphs=p.parseUShort(),post.offset=new Array(post.numberOfGlyphs);for(var i$2=0;i$2<post.numberOfGlyphs;i$2++)post.offset[i$2]=p.parseChar()}return post},make:function(){return new table.Table("post",[{name:"version",type:"FIXED",value:196608},{name:"italicAngle",type:"FIXED",value:0},{name:"underlinePosition",type:"FWORD",value:0},{name:"underlineThickness",type:"FWORD",value:0},{name:"isFixedPitch",type:"ULONG",value:0},{name:"minMemType42",type:"ULONG",value:0},{name:"maxMemType42",type:"ULONG",value:0},{name:"minMemType1",type:"ULONG",value:0},{name:"maxMemType1",type:"ULONG",value:0}])}},subtableParsers=new Array(9);
// The `GSUB` table contains ligatures, among other things.
// subtableParsers[0] is unused
// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#SS
subtableParsers[1]=function(){var start=this.offset+this.relativeOffset,substFormat=this.parseUShort();return 1===substFormat?{substFormat:1,coverage:this.parsePointer(Parser.coverage),deltaGlyphId:this.parseUShort()}:2===substFormat?{substFormat:2,coverage:this.parsePointer(Parser.coverage),substitute:this.parseOffset16List()}:void check.assert(!1,"0x"+start.toString(16)+": lookup type 1 format must be 1 or 2.")},
// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#MS
subtableParsers[2]=function(){var substFormat=this.parseUShort();return check.argument(1===substFormat,"GSUB Multiple Substitution Subtable identifier-format must be 1"),{substFormat,coverage:this.parsePointer(Parser.coverage),sequences:this.parseListOfLists()}},
// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#AS
subtableParsers[3]=function(){var substFormat=this.parseUShort();return check.argument(1===substFormat,"GSUB Alternate Substitution Subtable identifier-format must be 1"),{substFormat,coverage:this.parsePointer(Parser.coverage),alternateSets:this.parseListOfLists()}},
// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#LS
subtableParsers[4]=function(){var substFormat=this.parseUShort();return check.argument(1===substFormat,"GSUB ligature table identifier-format must be 1"),{substFormat,coverage:this.parsePointer(Parser.coverage),ligatureSets:this.parseListOfLists(function(){return{ligGlyph:this.parseUShort(),components:this.parseUShortList(this.parseUShort()-1)}})}};var lookupRecordDesc={sequenceIndex:Parser.uShort,lookupListIndex:Parser.uShort};
// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#CSF
subtableParsers[5]=function(){var start=this.offset+this.relativeOffset,substFormat=this.parseUShort();if(1===substFormat)return{substFormat,coverage:this.parsePointer(Parser.coverage),ruleSets:this.parseListOfLists(function(){var glyphCount=this.parseUShort(),substCount=this.parseUShort();return{input:this.parseUShortList(glyphCount-1),lookupRecords:this.parseRecordList(substCount,lookupRecordDesc)}})};if(2===substFormat)return{substFormat,coverage:this.parsePointer(Parser.coverage),classDef:this.parsePointer(Parser.classDef),classSets:this.parseListOfLists(function(){var glyphCount=this.parseUShort(),substCount=this.parseUShort();return{classes:this.parseUShortList(glyphCount-1),lookupRecords:this.parseRecordList(substCount,lookupRecordDesc)}})};if(3===substFormat){var glyphCount=this.parseUShort(),substCount=this.parseUShort();return{substFormat,coverages:this.parseList(glyphCount,Parser.pointer(Parser.coverage)),lookupRecords:this.parseRecordList(substCount,lookupRecordDesc)}}check.assert(!1,"0x"+start.toString(16)+": lookup type 5 format must be 1, 2 or 3.")},
// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#CC
subtableParsers[6]=function(){var start=this.offset+this.relativeOffset,substFormat=this.parseUShort();return 1===substFormat?{substFormat:1,coverage:this.parsePointer(Parser.coverage),chainRuleSets:this.parseListOfLists(function(){return{backtrack:this.parseUShortList(),input:this.parseUShortList(this.parseShort()-1),lookahead:this.parseUShortList(),lookupRecords:this.parseRecordList(lookupRecordDesc)}})}:2===substFormat?{substFormat:2,coverage:this.parsePointer(Parser.coverage),backtrackClassDef:this.parsePointer(Parser.classDef),inputClassDef:this.parsePointer(Parser.classDef),lookaheadClassDef:this.parsePointer(Parser.classDef),chainClassSet:this.parseListOfLists(function(){return{backtrack:this.parseUShortList(),input:this.parseUShortList(this.parseShort()-1),lookahead:this.parseUShortList(),lookupRecords:this.parseRecordList(lookupRecordDesc)}})}:3===substFormat?{substFormat:3,backtrackCoverage:this.parseList(Parser.pointer(Parser.coverage)),inputCoverage:this.parseList(Parser.pointer(Parser.coverage)),lookaheadCoverage:this.parseList(Parser.pointer(Parser.coverage)),lookupRecords:this.parseRecordList(lookupRecordDesc)}:void check.assert(!1,"0x"+start.toString(16)+": lookup type 6 format must be 1, 2 or 3.")},
// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#ES
subtableParsers[7]=function(){
// Extension Substitution subtable
var substFormat=this.parseUShort();check.argument(1===substFormat,"GSUB Extension Substitution subtable identifier-format must be 1");var extensionLookupType=this.parseUShort(),extensionParser=new Parser(this.data,this.offset+this.parseULong());return{substFormat:1,lookupType:extensionLookupType,extension:subtableParsers[extensionLookupType].call(extensionParser)}},
// https://www.microsoft.com/typography/OTSPEC/GSUB.htm#RCCS
subtableParsers[8]=function(){var substFormat=this.parseUShort();return check.argument(1===substFormat,"GSUB Reverse Chaining Contextual Single Substitution Subtable identifier-format must be 1"),{substFormat,coverage:this.parsePointer(Parser.coverage),backtrackCoverage:this.parseList(Parser.pointer(Parser.coverage)),lookaheadCoverage:this.parseList(Parser.pointer(Parser.coverage)),substitutes:this.parseUShortList()}};
// GSUB Writing //////////////////////////////////////////////
var subtableMakers=new Array(9);subtableMakers[1]=function(subtable){return 1===subtable.substFormat?new table.Table("substitutionTable",[{name:"substFormat",type:"USHORT",value:1},{name:"coverage",type:"TABLE",value:new table.Coverage(subtable.coverage)},{name:"deltaGlyphID",type:"USHORT",value:subtable.deltaGlyphId}]):new table.Table("substitutionTable",[{name:"substFormat",type:"USHORT",value:2},{name:"coverage",type:"TABLE",value:new table.Coverage(subtable.coverage)}].concat(table.ushortList("substitute",subtable.substitute)))},subtableMakers[2]=function(subtable){return check.assert(1===subtable.substFormat,"Lookup type 2 substFormat must be 1."),new table.Table("substitutionTable",[{name:"substFormat",type:"USHORT",value:1},{name:"coverage",type:"TABLE",value:new table.Coverage(subtable.coverage)}].concat(table.tableList("seqSet",subtable.sequences,function(sequenceSet){return new table.Table("sequenceSetTable",table.ushortList("sequence",sequenceSet))})))},subtableMakers[3]=function(subtable){return check.assert(1===subtable.substFormat,"Lookup type 3 substFormat must be 1."),new table.Table("substitutionTable",[{name:"substFormat",type:"USHORT",value:1},{name:"coverage",type:"TABLE",value:new table.Coverage(subtable.coverage)}].concat(table.tableList("altSet",subtable.alternateSets,function(alternateSet){return new table.Table("alternateSetTable",table.ushortList("alternate",alternateSet))})))},subtableMakers[4]=function(subtable){return check.assert(1===subtable.substFormat,"Lookup type 4 substFormat must be 1."),new table.Table("substitutionTable",[{name:"substFormat",type:"USHORT",value:1},{name:"coverage",type:"TABLE",value:new table.Coverage(subtable.coverage)}].concat(table.tableList("ligSet",subtable.ligatureSets,function(ligatureSet){return new table.Table("ligatureSetTable",table.tableList("ligature",ligatureSet,function(ligature){return new table.Table("ligatureTable",[{name:"ligGlyph",type:"USHORT",value:ligature.ligGlyph}].concat(table.ushortList("component",ligature.components,ligature.components.length+1)))}))})))},subtableMakers[6]=function(subtable){if(1===subtable.substFormat){var returnTable=new table.Table("chainContextTable",[{name:"substFormat",type:"USHORT",value:subtable.substFormat},{name:"coverage",type:"TABLE",value:new table.Coverage(subtable.coverage)}].concat(table.tableList("chainRuleSet",subtable.chainRuleSets,function(chainRuleSet){return new table.Table("chainRuleSetTable",table.tableList("chainRule",chainRuleSet,function(chainRule){var tableData=table.ushortList("backtrackGlyph",chainRule.backtrack,chainRule.backtrack.length).concat(table.ushortList("inputGlyph",chainRule.input,chainRule.input.length+1)).concat(table.ushortList("lookaheadGlyph",chainRule.lookahead,chainRule.lookahead.length)).concat(table.ushortList("substitution",[],chainRule.lookupRecords.length));return chainRule.lookupRecords.forEach(function(record,i){tableData=tableData.concat({name:"sequenceIndex"+i,type:"USHORT",value:record.sequenceIndex}).concat({name:"lookupListIndex"+i,type:"USHORT",value:record.lookupListIndex})}),new table.Table("chainRuleTable",tableData)}))})));return returnTable}if(2===subtable.substFormat)check.assert(!1,"lookup type 6 format 2 is not yet supported.");else if(3===subtable.substFormat){var tableData=[{name:"substFormat",type:"USHORT",value:subtable.substFormat}];return tableData.push({name:"backtrackGlyphCount",type:"USHORT",value:subtable.backtrackCoverage.length}),subtable.backtrackCoverage.forEach(function(coverage,i){tableData.push({name:"backtrackCoverage"+i,type:"TABLE",value:new table.Coverage(coverage)})}),tableData.push({name:"inputGlyphCount",type:"USHORT",value:subtable.inputCoverage.length}),subtable.inputCoverage.forEach(function(coverage,i){tableData.push({name:"inputCoverage"+i,type:"TABLE",value:new table.Coverage(coverage)})}),tableData.push({name:"lookaheadGlyphCount",type:"USHORT",value:subtable.lookaheadCoverage.length}),subtable.lookaheadCoverage.forEach(function(coverage,i){tableData.push({name:"lookaheadCoverage"+i,type:"TABLE",value:new table.Coverage(coverage)})}),tableData.push({name:"substitutionCount",type:"USHORT",value:subtable.lookupRecords.length}),subtable.lookupRecords.forEach(function(record,i){tableData=tableData.concat({name:"sequenceIndex"+i,type:"USHORT",value:record.sequenceIndex}).concat({name:"lookupListIndex"+i,type:"USHORT",value:record.lookupListIndex})}),new table.Table("chainContextTable",tableData)}check.assert(!1,"lookup type 6 format must be 1, 2 or 3.")};var gsub={parse:
// https://www.microsoft.com/typography/OTSPEC/gsub.htm
function(data,start){var p=new Parser(data,start=start||0),tableVersion=p.parseVersion(1);return check.argument(1===tableVersion||1.1===tableVersion,"Unsupported GSUB table version."),1===tableVersion?{version:tableVersion,scripts:p.parseScriptList(),features:p.parseFeatureList(),lookups:p.parseLookupList(subtableParsers)}:{version:tableVersion,scripts:p.parseScriptList(),features:p.parseFeatureList(),lookups:p.parseLookupList(subtableParsers),variations:p.parseFeatureVariationsList()}},make:function(gsub){return new table.Table("GSUB",[{name:"version",type:"ULONG",value:65536},{name:"scripts",type:"TABLE",value:new table.ScriptList(gsub.scripts)},{name:"features",type:"TABLE",value:new table.FeatureList(gsub.features)},{name:"lookups",type:"TABLE",value:new table.LookupList(gsub.lookups,subtableMakers)}])}};
// The `GPOS` table contains kerning pairs, among other things.
// Parse the metadata `meta` table.
// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6meta.html
var meta={parse:function(data,start){var p=new parse.Parser(data,start),tableVersion=p.parseULong();check.argument(1===tableVersion,"Unsupported META table version."),p.parseULong(),// flags - currently unused and set to 0
p.parseULong();for(// tableOffset
var numDataMaps=p.parseULong(),tags={},i=0;i<numDataMaps;i++){var tag=p.parseTag(),dataOffset=p.parseULong(),dataLength=p.parseULong(),text=decode.UTF8(data,start+dataOffset,dataLength);tags[tag]=text}return tags},make:function(tags){var numTags=Object.keys(tags).length,stringPool="",stringPoolOffset=16+12*numTags,result=new table.Table("meta",[{name:"version",type:"ULONG",value:1},{name:"flags",type:"ULONG",value:0},{name:"offset",type:"ULONG",value:stringPoolOffset},{name:"numTags",type:"ULONG",value:numTags}]);for(var tag in tags){var pos=stringPool.length;stringPool+=tags[tag],result.fields.push({name:"tag "+tag,type:"TAG",value:tag}),result.fields.push({name:"offset "+tag,type:"ULONG",value:stringPoolOffset+pos}),result.fields.push({name:"length "+tag,type:"ULONG",value:tags[tag].length})}return result.fields.push({name:"stringPool",type:"CHARARRAY",value:stringPool}),result}};
// The `sfnt` wrapper provides organization for the tables in the font.
function log2(v){return Math.log(v)/Math.log(2)|0}function computeCheckSum(bytes){for(;bytes.length%4!=0;)bytes.push(0);for(var sum=0,i=0;i<bytes.length;i+=4)sum+=(bytes[i]<<24)+(bytes[i+1]<<16)+(bytes[i+2]<<8)+bytes[i+3];return sum%=Math.pow(2,32)}function makeTableRecord(tag,checkSum,offset,length){return new table.Record("Table Record",[{name:"tag",type:"TAG",value:void 0!==tag?tag:""},{name:"checkSum",type:"ULONG",value:void 0!==checkSum?checkSum:0},{name:"offset",type:"ULONG",value:void 0!==offset?offset:0},{name:"length",type:"ULONG",value:void 0!==length?length:0}])}function makeSfntTable(tables){var sfnt=new table.Table("sfnt",[{name:"version",type:"TAG",value:"OTTO"},{name:"numTables",type:"USHORT",value:0},{name:"searchRange",type:"USHORT",value:0},{name:"entrySelector",type:"USHORT",value:0},{name:"rangeShift",type:"USHORT",value:0}]);sfnt.tables=tables,sfnt.numTables=tables.length;var highestPowerOf2=Math.pow(2,log2(sfnt.numTables));sfnt.searchRange=16*highestPowerOf2,sfnt.entrySelector=log2(highestPowerOf2),sfnt.rangeShift=16*sfnt.numTables-sfnt.searchRange;for(var recordFields=[],tableFields=[],offset=sfnt.sizeOf()+makeTableRecord().sizeOf()*sfnt.numTables;offset%4!=0;)offset+=1,tableFields.push({name:"padding",type:"BYTE",value:0});for(var i=0;i<tables.length;i+=1){var t=tables[i];check.argument(4===t.tableName.length,"Table name"+t.tableName+" is invalid.");var tableLength=t.sizeOf(),tableRecord=makeTableRecord(t.tableName,computeCheckSum(t.encode()),offset,tableLength);for(recordFields.push({name:tableRecord.tag+" Table Record",type:"RECORD",value:tableRecord}),tableFields.push({name:t.tableName+" table",type:"RECORD",value:t}),offset+=tableLength,check.argument(!isNaN(offset),"Something went wrong calculating the offset.");offset%4!=0;)offset+=1,tableFields.push({name:"padding",type:"BYTE",value:0})}
// Table records need to be sorted alphabetically.
return recordFields.sort(function(r1,r2){return r1.value.tag>r2.value.tag?1:-1}),sfnt.fields=sfnt.fields.concat(recordFields),sfnt.fields=sfnt.fields.concat(tableFields),sfnt}
// Get the metrics for a character. If the string has more than one character
// this function returns metrics for the first available character.
// You can provide optional fallback metrics if no characters are available.
function metricsForChar(font,chars,notFoundMetrics){for(var i=0;i<chars.length;i+=1){var glyphIndex=font.charToGlyphIndex(chars[i]);if(glyphIndex>0)return font.glyphs.get(glyphIndex).getMetrics()}return notFoundMetrics}function average(vs){for(var sum=0,i=0;i<vs.length;i+=1)sum+=vs[i];return sum/vs.length}
// Convert the font object to a SFNT data structure.
// This structure contains all the necessary tables and metadata to create a binary OTF file.
var sfnt={make:makeSfntTable,fontToTable:function(font){for(var firstCharIndex,xMins=[],yMins=[],xMaxs=[],yMaxs=[],advanceWidths=[],leftSideBearings=[],rightSideBearings=[],lastCharIndex=0,ulUnicodeRange1=0,ulUnicodeRange2=0,ulUnicodeRange3=0,ulUnicodeRange4=0,i=0;i<font.glyphs.length;i+=1){var glyph=font.glyphs.get(i),unicode=0|glyph.unicode;if(isNaN(glyph.advanceWidth))throw new Error("Glyph "+glyph.name+" ("+i+"): advanceWidth is not a number.");(firstCharIndex>unicode||void 0===firstCharIndex)&&unicode>0&&(firstCharIndex=unicode),lastCharIndex<unicode&&(lastCharIndex=unicode);var position=os2.getUnicodeRange(unicode);if(position<32)ulUnicodeRange1|=1<<position;else if(position<64)ulUnicodeRange2|=1<<position-32;else if(position<96)ulUnicodeRange3|=1<<position-64;else{if(!(position<123))throw new Error("Unicode ranges bits > 123 are reserved for internal usage");
// Skip non-important characters.
ulUnicodeRange4|=1<<position-96}if(".notdef"!==glyph.name){var metrics=glyph.getMetrics();xMins.push(metrics.xMin),yMins.push(metrics.yMin),xMaxs.push(metrics.xMax),yMaxs.push(metrics.yMax),leftSideBearings.push(metrics.leftSideBearing),rightSideBearings.push(metrics.rightSideBearing),advanceWidths.push(glyph.advanceWidth)}}var globals={xMin:Math.min.apply(null,xMins),yMin:Math.min.apply(null,yMins),xMax:Math.max.apply(null,xMaxs),yMax:Math.max.apply(null,yMaxs),advanceWidthMax:Math.max.apply(null,advanceWidths),advanceWidthAvg:average(advanceWidths),minLeftSideBearing:Math.min.apply(null,leftSideBearings),maxLeftSideBearing:Math.max.apply(null,leftSideBearings),minRightSideBearing:Math.min.apply(null,rightSideBearings)};globals.ascender=font.ascender,globals.descender=font.descender;var headTable=head.make({flags:3,// 00000011 (baseline for font at y=0; left sidebearing point at x=0)
unitsPerEm:font.unitsPerEm,xMin:globals.xMin,yMin:globals.yMin,xMax:globals.xMax,yMax:globals.yMax,lowestRecPPEM:3,createdTimestamp:font.createdTimestamp}),hheaTable=hhea.make({ascender:globals.ascender,descender:globals.descender,advanceWidthMax:globals.advanceWidthMax,minLeftSideBearing:globals.minLeftSideBearing,minRightSideBearing:globals.minRightSideBearing,xMaxExtent:globals.maxLeftSideBearing+(globals.xMax-globals.xMin),numberOfHMetrics:font.glyphs.length}),maxpTable=maxp.make(font.glyphs.length),os2Table=os2.make(Object.assign({xAvgCharWidth:Math.round(globals.advanceWidthAvg),usFirstCharIndex:firstCharIndex,usLastCharIndex:lastCharIndex,ulUnicodeRange1,ulUnicodeRange2,ulUnicodeRange3,ulUnicodeRange4,
// See http://typophile.com/node/13081 for more info on vertical metrics.
// We get metrics for typical characters (such as "x" for xHeight).
// We provide some fallback characters if characters are unavailable: their
// ordering was chosen experimentally.
sTypoAscender:globals.ascender,sTypoDescender:globals.descender,sTypoLineGap:0,usWinAscent:globals.yMax,usWinDescent:Math.abs(globals.yMin),ulCodePageRange1:1,// FIXME: hard-code Latin 1 support for now
sxHeight:metricsForChar(font,"xyvw",{yMax:Math.round(globals.ascender/2)}).yMax,sCapHeight:metricsForChar(font,"HIKLEFJMNTZBDPRAGOQSUVWXY",globals).yMax,usDefaultChar:font.hasChar(" ")?32:0,// Use space as the default character, if available.
usBreakChar:font.hasChar(" ")?32:0},font.tables.os2)),hmtxTable=hmtx.make(font.glyphs),cmapTable=cmap.make(font.glyphs),englishFamilyName=font.getEnglishName("fontFamily"),englishStyleName=font.getEnglishName("fontSubfamily"),englishFullName=englishFamilyName+" "+englishStyleName,postScriptName=font.getEnglishName("postScriptName");postScriptName||(postScriptName=englishFamilyName.replace(/\s/g,"")+"-"+englishStyleName);var names={};for(var n in font.names)names[n]=font.names[n];names.uniqueID||(names.uniqueID={en:font.getEnglishName("manufacturer")+":"+englishFullName}),names.postScriptName||(names.postScriptName={en:postScriptName}),names.preferredFamily||(names.preferredFamily=font.names.fontFamily),names.preferredSubfamily||(names.preferredSubfamily=font.names.fontSubfamily);var languageTags=[],nameTable=_name.make(names,languageTags),ltagTable=languageTags.length>0?ltag.make(languageTags):void 0,postTable=post.make(),cffTable=cff.make(font.glyphs,{version:font.getEnglishName("version"),fullName:englishFullName,familyName:englishFamilyName,weightName:englishStyleName,postScriptName,unitsPerEm:font.unitsPerEm,fontBBox:[0,globals.yMin,globals.ascender,globals.advanceWidthMax]}),metaTable=font.metas&&Object.keys(font.metas).length>0?meta.make(font.metas):void 0,tables=[headTable,hheaTable,maxpTable,os2Table,nameTable,cmapTable,postTable,cffTable,hmtxTable];ltagTable&&tables.push(ltagTable),
// Optional tables
font.tables.gsub&&tables.push(gsub.make(font.tables.gsub)),metaTable&&tables.push(metaTable);for(var sfntTable=makeSfntTable(tables),checkSum=computeCheckSum(sfntTable.encode()),tableFields=sfntTable.fields,checkSumAdjusted=!1,i$1=0
// Compute the font's checkSum and store it in head.checkSumAdjustment.
;i$1<tableFields.length;i$1+=1)if("head table"===tableFields[i$1].name){tableFields[i$1].value.checkSumAdjustment=2981146554-checkSum,checkSumAdjusted=!0;break}if(!checkSumAdjusted)throw new Error("Could not find head table with checkSum to adjust.");return sfntTable},computeCheckSum};
// The Layout object is the prototype of Substitution objects, and provides
function searchTag(arr,tag){for(
/* jshint bitwise: false */
var imin=0,imax=arr.length-1;imin<=imax;){var imid=imin+imax>>>1,val=arr[imid].tag;if(val===tag)return imid;val<tag?imin=imid+1:imax=imid-1}
// Not found: return -1-insertion point
return-imin-1}function binSearch(arr,value){for(
/* jshint bitwise: false */
var imin=0,imax=arr.length-1;imin<=imax;){var imid=imin+imax>>>1,val=arr[imid];if(val===value)return imid;val<value?imin=imid+1:imax=imid-1}
// Not found: return -1-insertion point
return-imin-1}
// binary search in a list of ranges (coverage, class definition)
function searchRange(ranges,value){for(
// jshint bitwise: false
var range,imin=0,imax=ranges.length-1;imin<=imax;){var imid=imin+imax>>>1,start=(range=ranges[imid]).start;if(start===value)return range;start<value?imin=imid+1:imax=imid-1}if(imin>0)return value>(range=ranges[imin-1]).end?0:range}
/**
 * @exports opentype.Layout
 * @class
 */function Layout(font,tableName){this.font=font,this.tableName=tableName}
// The Position object provides utility methods to manipulate
/**
 * @exports opentype.Position
 * @class
 * @extends opentype.Layout
 * @param {opentype.Font}
 * @constructor
 */
function Position(font){Layout.call(this,font,"gpos")}
// The Substitution object provides utility methods to manipulate
/**
 * @exports opentype.Substitution
 * @class
 * @extends opentype.Layout
 * @param {opentype.Font}
 * @constructor
 */
function Substitution(font){Layout.call(this,font,"gsub")}
// Check if 2 arrays of primitives are equal.
function arraysEqual(ar1,ar2){var n=ar1.length;if(n!==ar2.length)return!1;for(var i=0;i<n;i++)if(ar1[i]!==ar2[i])return!1;return!0}
// Find the first subtable of a lookup table in a particular format.
function getSubstFormat(lookupTable,format,defaultSubtable){for(var subtables=lookupTable.subtables,i=0;i<subtables.length;i++){var subtable=subtables[i];if(subtable.substFormat===format)return subtable}if(defaultSubtable)return subtables.push(defaultSubtable),defaultSubtable}function nodeBufferToArrayBuffer(buffer){for(var ab=new ArrayBuffer(buffer.length),view=new Uint8Array(ab),i=0;i<buffer.length;++i)view[i]=buffer[i];return ab}function checkArgument(expression,message){if(!expression)throw message}
// The `glyf` table describes the glyphs in TrueType outline format.
// Parse the coordinate data for a glyph.
function parseGlyphCoordinate(p,flag,previousValue,shortVectorBitMask,sameBitMask){var v;return(flag&shortVectorBitMask)>0?(
// The coordinate is 1 byte long.
v=p.parseByte(),
// The `same` bit is re-used for short values to signify the sign of the value.
0===(flag&sameBitMask)&&(v=-v),v=previousValue+v):
//  The coordinate is 2 bytes long.
// If the `same` bit is set, the coordinate is the same as the previous coordinate.
v=(flag&sameBitMask)>0?previousValue:previousValue+p.parseShort(),v}
// Parse a TrueType glyph.
function parseGlyph(glyph,data,start){var flags,flag,p=new parse.Parser(data,start);if(glyph.numberOfContours=p.parseShort(),glyph._xMin=p.parseShort(),glyph._yMin=p.parseShort(),glyph._xMax=p.parseShort(),glyph._yMax=p.parseShort(),glyph.numberOfContours>0){for(
// This glyph is not a composite.
var endPointIndices=glyph.endPointIndices=[],i=0;i<glyph.numberOfContours;i+=1)endPointIndices.push(p.parseUShort());glyph.instructionLength=p.parseUShort(),glyph.instructions=[];for(var i$1=0;i$1<glyph.instructionLength;i$1+=1)glyph.instructions.push(p.parseByte());var numberOfCoordinates=endPointIndices[endPointIndices.length-1]+1;flags=[];for(var i$2=0;i$2<numberOfCoordinates;i$2+=1)
// If bit 3 is set, we repeat this flag n times, where n is the next byte.
if(flag=p.parseByte(),flags.push(flag),(8&flag)>0)for(var repeatCount=p.parseByte(),j=0;j<repeatCount;j+=1)flags.push(flag),i$2+=1;if(check.argument(flags.length===numberOfCoordinates,"Bad flags."),endPointIndices.length>0){var point,points=[];
// X/Y coordinates are relative to the previous point, except for the first point which is relative to 0,0.
if(numberOfCoordinates>0){for(var i$3=0;i$3<numberOfCoordinates;i$3+=1)flag=flags[i$3],(point={}).onCurve=!!(1&flag),point.lastPointOfContour=endPointIndices.indexOf(i$3)>=0,points.push(point);for(var px=0,i$4=0;i$4<numberOfCoordinates;i$4+=1)flag=flags[i$4],(point=points[i$4]).x=parseGlyphCoordinate(p,flag,px,2,16),px=point.x;for(var py=0,i$5=0;i$5<numberOfCoordinates;i$5+=1)flag=flags[i$5],(point=points[i$5]).y=parseGlyphCoordinate(p,flag,py,4,32),py=point.y}glyph.points=points}else glyph.points=[]}else if(0===glyph.numberOfContours)glyph.points=[];else{glyph.isComposite=!0,glyph.points=[],glyph.components=[];for(var moreComponents=!0;moreComponents;){flags=p.parseUShort();var component={glyphIndex:p.parseUShort(),xScale:1,scale01:0,scale10:0,yScale:1,dx:0,dy:0};(1&flags)>0?
// The arguments are words
(2&flags)>0?(
// values are offset
component.dx=p.parseShort(),component.dy=p.parseShort()):
// values are matched points
component.matchedPoints=[p.parseUShort(),p.parseUShort()]:
// The arguments are bytes
(2&flags)>0?(
// values are offset
component.dx=p.parseChar(),component.dy=p.parseChar()):
// values are matched points
component.matchedPoints=[p.parseByte(),p.parseByte()],(8&flags)>0?
// We have a scale
component.xScale=component.yScale=p.parseF2Dot14():(64&flags)>0?(
// We have an X / Y scale
component.xScale=p.parseF2Dot14(),component.yScale=p.parseF2Dot14()):(128&flags)>0&&(
// We have a 2x2 transformation
component.xScale=p.parseF2Dot14(),component.scale01=p.parseF2Dot14(),component.scale10=p.parseF2Dot14(),component.yScale=p.parseF2Dot14()),glyph.components.push(component),moreComponents=!!(32&flags)}if(256&flags){
// We have instructions
glyph.instructionLength=p.parseUShort(),glyph.instructions=[];for(var i$6=0;i$6<glyph.instructionLength;i$6+=1)glyph.instructions.push(p.parseByte())}}}
// Transform an array of points and return a new array.
function transformPoints(points,transform){for(var newPoints=[],i=0;i<points.length;i+=1){var pt=points[i],newPt={x:transform.xScale*pt.x+transform.scale01*pt.y+transform.dx,y:transform.scale10*pt.x+transform.yScale*pt.y+transform.dy,onCurve:pt.onCurve,lastPointOfContour:pt.lastPointOfContour};newPoints.push(newPt)}return newPoints}
// Convert the TrueType glyph outline to a Path.
function getPath(points){var p=new Path;if(!points)return p;for(var contours=function(points){for(var contours=[],currentContour=[],i=0;i<points.length;i+=1){var pt=points[i];currentContour.push(pt),pt.lastPointOfContour&&(contours.push(currentContour),currentContour=[])}return check.argument(0===currentContour.length,"There are still points left in the current contour."),contours}(points),contourIndex=0;contourIndex<contours.length;++contourIndex){var contour=contours[contourIndex],prev=null,curr=contour[contour.length-1],next=contour[0];if(curr.onCurve)p.moveTo(curr.x,curr.y);else if(next.onCurve)p.moveTo(next.x,next.y);else{
// If both first and last points are off-curve, start at their middle.
var start={x:.5*(curr.x+next.x),y:.5*(curr.y+next.y)};p.moveTo(start.x,start.y)}for(var i=0;i<contour.length;++i)if(prev=curr,curr=next,next=contour[(i+1)%contour.length],curr.onCurve)
// This is a straight line.
p.lineTo(curr.x,curr.y);else{var next2=next;prev.onCurve||{x:.5*(curr.x+prev.x),y:.5*(curr.y+prev.y)},next.onCurve||(next2={x:.5*(curr.x+next.x),y:.5*(curr.y+next.y)}),p.quadraticCurveTo(curr.x,curr.y,next2.x,next2.y)}p.closePath()}return p}function buildPath(glyphs,glyph){if(glyph.isComposite)for(var j=0;j<glyph.components.length;j+=1){var component=glyph.components[j],componentGlyph=glyphs.get(component.glyphIndex);if(
// Force the ttfGlyphLoader to parse the glyph.
componentGlyph.getPath(),componentGlyph.points){var transformedPoints=void 0;if(void 0===component.matchedPoints)
// component positioned by offset
transformedPoints=transformPoints(componentGlyph.points,component);else{
// component positioned by matched points
if(component.matchedPoints[0]>glyph.points.length-1||component.matchedPoints[1]>componentGlyph.points.length-1)throw Error("Matched points out of range in "+glyph.name);var firstPt=glyph.points[component.matchedPoints[0]],secondPt=componentGlyph.points[component.matchedPoints[1]],transform={xScale:component.xScale,scale01:component.scale01,scale10:component.scale10,yScale:component.yScale,dx:0,dy:0};secondPt=transformPoints([secondPt],transform)[0],transform.dx=firstPt.x-secondPt.x,transform.dy=firstPt.y-secondPt.y,transformedPoints=transformPoints(componentGlyph.points,transform)}glyph.points=glyph.points.concat(transformedPoints)}}return getPath(glyph.points)}Layout.prototype={
/**
     * Binary search an object by "tag" property
     * @instance
     * @function searchTag
     * @memberof opentype.Layout
     * @param  {Array} arr
     * @param  {string} tag
     * @return {number}
     */
searchTag,
/**
     * Binary search in a list of numbers
     * @instance
     * @function binSearch
     * @memberof opentype.Layout
     * @param  {Array} arr
     * @param  {number} value
     * @return {number}
     */
binSearch,
/**
     * Get or create the Layout table (GSUB, GPOS etc).
     * @param  {boolean} create - Whether to create a new one.
     * @return {Object} The GSUB or GPOS table.
     */
getTable:function(create){var layout=this.font.tables[this.tableName];return!layout&&create&&(layout=this.font.tables[this.tableName]=this.createDefaultTable()),layout},
/**
     * Returns all scripts in the substitution table.
     * @instance
     * @return {Array}
     */
getScriptNames:function(){var layout=this.getTable();return layout?layout.scripts.map(function(script){return script.tag}):[]},
/**
     * Returns the best bet for a script name.
     * Returns 'DFLT' if it exists.
     * If not, returns 'latn' if it exists.
     * If neither exist, returns undefined.
     */
getDefaultScriptName:function(){var layout=this.getTable();if(layout){for(var hasLatn=!1,i=0;i<layout.scripts.length;i++){var name=layout.scripts[i].tag;if("DFLT"===name)return name;"latn"===name&&(hasLatn=!0)}return hasLatn?"latn":void 0}},
/**
     * Returns all LangSysRecords in the given script.
     * @instance
     * @param {string} [script='DFLT']
     * @param {boolean} create - forces the creation of this script table if it doesn't exist.
     * @return {Object} An object with tag and script properties.
     */
getScriptTable:function(script,create){var layout=this.getTable(create);if(layout){script=script||"DFLT";var scripts=layout.scripts,pos=searchTag(layout.scripts,script);if(pos>=0)return scripts[pos].script;if(create){var scr={tag:script,script:{defaultLangSys:{reserved:0,reqFeatureIndex:65535,featureIndexes:[]},langSysRecords:[]}};return scripts.splice(-1-pos,0,scr),scr.script}}},
/**
     * Returns a language system table
     * @instance
     * @param {string} [script='DFLT']
     * @param {string} [language='dlft']
     * @param {boolean} create - forces the creation of this langSysTable if it doesn't exist.
     * @return {Object}
     */
getLangSysTable:function(script,language,create){var scriptTable=this.getScriptTable(script,create);if(scriptTable){if(!language||"dflt"===language||"DFLT"===language)return scriptTable.defaultLangSys;var pos=searchTag(scriptTable.langSysRecords,language);if(pos>=0)return scriptTable.langSysRecords[pos].langSys;if(create){var langSysRecord={tag:language,langSys:{reserved:0,reqFeatureIndex:65535,featureIndexes:[]}};return scriptTable.langSysRecords.splice(-1-pos,0,langSysRecord),langSysRecord.langSys}}},
/**
     * Get a specific feature table.
     * @instance
     * @param {string} [script='DFLT']
     * @param {string} [language='dlft']
     * @param {string} feature - One of the codes listed at https://www.microsoft.com/typography/OTSPEC/featurelist.htm
     * @param {boolean} create - forces the creation of the feature table if it doesn't exist.
     * @return {Object}
     */
getFeatureTable:function(script,language,feature,create){var langSysTable=this.getLangSysTable(script,language,create);if(langSysTable){
// The FeatureIndex array of indices is in arbitrary order,
// even if allFeatures is sorted alphabetically by feature tag.
for(var featureRecord,featIndexes=langSysTable.featureIndexes,allFeatures=this.font.tables[this.tableName].features,i=0;i<featIndexes.length;i++)if((featureRecord=allFeatures[featIndexes[i]]).tag===feature)return featureRecord.feature;if(create){var index=allFeatures.length;
// Automatic ordering of features would require to shift feature indexes in the script list.
return check.assert(0===index||feature>=allFeatures[index-1].tag,"Features must be added in alphabetical order."),featureRecord={tag:feature,feature:{params:0,lookupListIndexes:[]}},allFeatures.push(featureRecord),featIndexes.push(index),featureRecord.feature}}},
/**
     * Get the lookup tables of a given type for a script/language/feature.
     * @instance
     * @param {string} [script='DFLT']
     * @param {string} [language='dlft']
     * @param {string} feature - 4-letter feature code
     * @param {number} lookupType - 1 to 9
     * @param {boolean} create - forces the creation of the lookup table if it doesn't exist, with no subtables.
     * @return {Object[]}
     */
getLookupTables:function(script,language,feature,lookupType,create){var featureTable=this.getFeatureTable(script,language,feature,create),tables=[];if(featureTable){
// lookupListIndexes are in no particular order, so use naive search.
for(var lookupTable,lookupListIndexes=featureTable.lookupListIndexes,allLookups=this.font.tables[this.tableName].lookups,i=0;i<lookupListIndexes.length;i++)(lookupTable=allLookups[lookupListIndexes[i]]).lookupType===lookupType&&tables.push(lookupTable);if(0===tables.length&&create){lookupTable={lookupType,lookupFlag:0,subtables:[],markFilteringSet:void 0};var index=allLookups.length;return allLookups.push(lookupTable),lookupListIndexes.push(index),[lookupTable]}}return tables},
/**
     * Find a glyph in a class definition table
     * https://docs.microsoft.com/en-us/typography/opentype/spec/chapter2#class-definition-table
     * @param {object} classDefTable - an OpenType Layout class definition table
     * @param {number} glyphIndex - the index of the glyph to find
     * @returns {number} -1 if not found
     */
getGlyphClass:function(classDefTable,glyphIndex){switch(classDefTable.format){case 1:return classDefTable.startGlyph<=glyphIndex&&glyphIndex<classDefTable.startGlyph+classDefTable.classes.length?classDefTable.classes[glyphIndex-classDefTable.startGlyph]:0;case 2:var range=searchRange(classDefTable.ranges,glyphIndex);return range?range.classId:0}},
/**
     * Find a glyph in a coverage table
     * https://docs.microsoft.com/en-us/typography/opentype/spec/chapter2#coverage-table
     * @param {object} coverageTable - an OpenType Layout coverage table
     * @param {number} glyphIndex - the index of the glyph to find
     * @returns {number} -1 if not found
     */
getCoverageIndex:function(coverageTable,glyphIndex){switch(coverageTable.format){case 1:var index=binSearch(coverageTable.glyphs,glyphIndex);return index>=0?index:-1;case 2:var range=searchRange(coverageTable.ranges,glyphIndex);return range?range.index+glyphIndex-range.start:-1}},
/**
     * Returns the list of glyph indexes of a coverage table.
     * Format 1: the list is stored raw
     * Format 2: compact list as range records.
     * @instance
     * @param  {Object} coverageTable
     * @return {Array}
     */
expandCoverage:function(coverageTable){if(1===coverageTable.format)return coverageTable.glyphs;for(var glyphs=[],ranges=coverageTable.ranges,i=0;i<ranges.length;i++)for(var range=ranges[i],start=range.start,end=range.end,j=start;j<=end;j++)glyphs.push(j);return glyphs}},Position.prototype=Layout.prototype,
/**
 * Init some data for faster and easier access later.
 */
Position.prototype.init=function(){var script=this.getDefaultScriptName();this.defaultKerningTables=this.getKerningTables(script)},
/**
 * Find a glyph pair in a list of lookup tables of type 2 and retrieve the xAdvance kerning value.
 *
 * @param {integer} leftIndex - left glyph index
 * @param {integer} rightIndex - right glyph index
 * @returns {integer}
 */
Position.prototype.getKerningValue=function(kerningLookups,leftIndex,rightIndex){for(var i=0;i<kerningLookups.length;i++)for(var subtables=kerningLookups[i].subtables,j=0;j<subtables.length;j++){var subtable=subtables[j],covIndex=this.getCoverageIndex(subtable.coverage,leftIndex);if(!(covIndex<0))switch(subtable.posFormat){case 1:for(
// Search Pair Adjustment Positioning Format 1
var pairSet=subtable.pairSets[covIndex],k=0;k<pairSet.length;k++){var pair=pairSet[k];if(pair.secondGlyph===rightIndex)return pair.value1&&pair.value1.xAdvance||0}break;// left glyph found, not right glyph - try next subtable
case 2:
// Search Pair Adjustment Positioning Format 2
var class1=this.getGlyphClass(subtable.classDef1,leftIndex),class2=this.getGlyphClass(subtable.classDef2,rightIndex),pair$1=subtable.classRecords[class1][class2];return pair$1.value1&&pair$1.value1.xAdvance||0}}return 0},
/**
 * List all kerning lookup tables.
 *
 * @param {string} [script='DFLT'] - use font.position.getDefaultScriptName() for a better default value
 * @param {string} [language='dflt']
 * @return {object[]} The list of kerning lookup tables (may be empty), or undefined if there is no GPOS table (and we should use the kern table)
 */
Position.prototype.getKerningTables=function(script,language){if(this.font.tables.gpos)return this.getLookupTables(script,language,"kern",2)},Substitution.prototype=Layout.prototype,
/**
 * Create a default GSUB table.
 * @return {Object} gsub - The GSUB table.
 */
Substitution.prototype.createDefaultTable=function(){
// Generate a default empty GSUB table with just a DFLT script and dflt lang sys.
return{version:1,scripts:[{tag:"DFLT",script:{defaultLangSys:{reserved:0,reqFeatureIndex:65535,featureIndexes:[]},langSysRecords:[]}}],features:[],lookups:[]}},
/**
 * List all single substitutions (lookup type 1) for a given script, language, and feature.
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 * @param {string} feature - 4-character feature name ('aalt', 'salt', 'ss01'...)
 * @return {Array} substitutions - The list of substitutions.
 */
Substitution.prototype.getSingle=function(feature,script,language){for(var substitutions=[],lookupTables=this.getLookupTables(script,language,feature,1),idx=0;idx<lookupTables.length;idx++)for(var subtables=lookupTables[idx].subtables,i=0;i<subtables.length;i++){var subtable=subtables[i],glyphs=this.expandCoverage(subtable.coverage),j=void 0;if(1===subtable.substFormat){var delta=subtable.deltaGlyphId;for(j=0;j<glyphs.length;j++){var glyph=glyphs[j];substitutions.push({sub:glyph,by:glyph+delta})}}else{var substitute=subtable.substitute;for(j=0;j<glyphs.length;j++)substitutions.push({sub:glyphs[j],by:substitute[j]})}}return substitutions},
/**
 * List all multiple substitutions (lookup type 2) for a given script, language, and feature.
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 * @param {string} feature - 4-character feature name ('ccmp', 'stch')
 * @return {Array} substitutions - The list of substitutions.
 */
Substitution.prototype.getMultiple=function(feature,script,language){for(var substitutions=[],lookupTables=this.getLookupTables(script,language,feature,2),idx=0;idx<lookupTables.length;idx++)for(var subtables=lookupTables[idx].subtables,i=0;i<subtables.length;i++){var subtable=subtables[i],glyphs=this.expandCoverage(subtable.coverage),j=void 0;for(j=0;j<glyphs.length;j++){var glyph=glyphs[j],replacements=subtable.sequences[j];substitutions.push({sub:glyph,by:replacements})}}return substitutions},
/**
 * List all alternates (lookup type 3) for a given script, language, and feature.
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 * @param {string} feature - 4-character feature name ('aalt', 'salt'...)
 * @return {Array} alternates - The list of alternates
 */
Substitution.prototype.getAlternates=function(feature,script,language){for(var alternates=[],lookupTables=this.getLookupTables(script,language,feature,3),idx=0;idx<lookupTables.length;idx++)for(var subtables=lookupTables[idx].subtables,i=0;i<subtables.length;i++)for(var subtable=subtables[i],glyphs=this.expandCoverage(subtable.coverage),alternateSets=subtable.alternateSets,j=0;j<glyphs.length;j++)alternates.push({sub:glyphs[j],by:alternateSets[j]});return alternates},
/**
 * List all ligatures (lookup type 4) for a given script, language, and feature.
 * The result is an array of ligature objects like { sub: [ids], by: id }
 * @param {string} feature - 4-letter feature name ('liga', 'rlig', 'dlig'...)
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 * @return {Array} ligatures - The list of ligatures.
 */
Substitution.prototype.getLigatures=function(feature,script,language){for(var ligatures=[],lookupTables=this.getLookupTables(script,language,feature,4),idx=0;idx<lookupTables.length;idx++)for(var subtables=lookupTables[idx].subtables,i=0;i<subtables.length;i++)for(var subtable=subtables[i],glyphs=this.expandCoverage(subtable.coverage),ligatureSets=subtable.ligatureSets,j=0;j<glyphs.length;j++)for(var startGlyph=glyphs[j],ligSet=ligatureSets[j],k=0;k<ligSet.length;k++){var lig=ligSet[k];ligatures.push({sub:[startGlyph].concat(lig.components),by:lig.ligGlyph})}return ligatures},
/**
 * Add or modify a single substitution (lookup type 1)
 * Format 2, more flexible, is always used.
 * @param {string} feature - 4-letter feature name ('liga', 'rlig', 'dlig'...)
 * @param {Object} substitution - { sub: id, by: id } (format 1 is not supported)
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 */
Substitution.prototype.addSingle=function(feature,substitution,script,language){var subtable=getSubstFormat(this.getLookupTables(script,language,feature,1,!0)[0],2,{// lookup type 1 subtable, format 2, coverage format 1
substFormat:2,coverage:{format:1,glyphs:[]},substitute:[]});check.assert(1===subtable.coverage.format,"Single: unable to modify coverage table format "+subtable.coverage.format);var coverageGlyph=substitution.sub,pos=this.binSearch(subtable.coverage.glyphs,coverageGlyph);pos<0&&(pos=-1-pos,subtable.coverage.glyphs.splice(pos,0,coverageGlyph),subtable.substitute.splice(pos,0,0)),subtable.substitute[pos]=substitution.by},
/**
 * Add or modify a multiple substitution (lookup type 2)
 * @param {string} feature - 4-letter feature name ('ccmp', 'stch')
 * @param {Object} substitution - { sub: id, by: [id] } for format 2.
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 */
Substitution.prototype.addMultiple=function(feature,substitution,script,language){check.assert(substitution.by instanceof Array&&substitution.by.length>1,'Multiple: "by" must be an array of two or more ids');var subtable=getSubstFormat(this.getLookupTables(script,language,feature,2,!0)[0],1,{// lookup type 2 subtable, format 1, coverage format 1
substFormat:1,coverage:{format:1,glyphs:[]},sequences:[]});check.assert(1===subtable.coverage.format,"Multiple: unable to modify coverage table format "+subtable.coverage.format);var coverageGlyph=substitution.sub,pos=this.binSearch(subtable.coverage.glyphs,coverageGlyph);pos<0&&(pos=-1-pos,subtable.coverage.glyphs.splice(pos,0,coverageGlyph),subtable.sequences.splice(pos,0,0)),subtable.sequences[pos]=substitution.by},
/**
 * Add or modify an alternate substitution (lookup type 3)
 * @param {string} feature - 4-letter feature name ('liga', 'rlig', 'dlig'...)
 * @param {Object} substitution - { sub: id, by: [ids] }
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 */
Substitution.prototype.addAlternate=function(feature,substitution,script,language){var subtable=getSubstFormat(this.getLookupTables(script,language,feature,3,!0)[0],1,{// lookup type 3 subtable, format 1, coverage format 1
substFormat:1,coverage:{format:1,glyphs:[]},alternateSets:[]});check.assert(1===subtable.coverage.format,"Alternate: unable to modify coverage table format "+subtable.coverage.format);var coverageGlyph=substitution.sub,pos=this.binSearch(subtable.coverage.glyphs,coverageGlyph);pos<0&&(pos=-1-pos,subtable.coverage.glyphs.splice(pos,0,coverageGlyph),subtable.alternateSets.splice(pos,0,0)),subtable.alternateSets[pos]=substitution.by},
/**
 * Add a ligature (lookup type 4)
 * Ligatures with more components must be stored ahead of those with fewer components in order to be found
 * @param {string} feature - 4-letter feature name ('liga', 'rlig', 'dlig'...)
 * @param {Object} ligature - { sub: [ids], by: id }
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 */
Substitution.prototype.addLigature=function(feature,ligature,script,language){var lookupTable=this.getLookupTables(script,language,feature,4,!0)[0],subtable=lookupTable.subtables[0];subtable||(subtable={// lookup type 4 subtable, format 1, coverage format 1
substFormat:1,coverage:{format:1,glyphs:[]},ligatureSets:[]},lookupTable.subtables[0]=subtable),check.assert(1===subtable.coverage.format,"Ligature: unable to modify coverage table format "+subtable.coverage.format);var coverageGlyph=ligature.sub[0],ligComponents=ligature.sub.slice(1),ligatureTable={ligGlyph:ligature.by,components:ligComponents},pos=this.binSearch(subtable.coverage.glyphs,coverageGlyph);if(pos>=0){for(
// ligatureSet already exists
var ligatureSet=subtable.ligatureSets[pos],i=0;i<ligatureSet.length;i++)
// If ligature already exists, return.
if(arraysEqual(ligatureSet[i].components,ligComponents))return;
// ligature does not exist: add it.
ligatureSet.push(ligatureTable)}else
// Create a new ligatureSet and add coverage for the first glyph.
pos=-1-pos,subtable.coverage.glyphs.splice(pos,0,coverageGlyph),subtable.ligatureSets.splice(pos,0,[ligatureTable])},
/**
 * List all feature data for a given script and language.
 * @param {string} feature - 4-letter feature name
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 * @return {Array} substitutions - The list of substitutions.
 */
Substitution.prototype.getFeature=function(feature,script,language){if(/ss\d\d/.test(feature))
// ss01 - ss20
return this.getSingle(feature,script,language);switch(feature){case"aalt":case"salt":return this.getSingle(feature,script,language).concat(this.getAlternates(feature,script,language));case"dlig":case"liga":case"rlig":return this.getLigatures(feature,script,language);case"ccmp":return this.getMultiple(feature,script,language).concat(this.getLigatures(feature,script,language));case"stch":return this.getMultiple(feature,script,language)}},
/**
 * Add a substitution to a feature for a given script and language.
 * @param {string} feature - 4-letter feature name
 * @param {Object} sub - the substitution to add (an object like { sub: id or [ids], by: id or [ids] })
 * @param {string} [script='DFLT']
 * @param {string} [language='dflt']
 */
Substitution.prototype.add=function(feature,sub,script,language){if(/ss\d\d/.test(feature))
// ss01 - ss20
return this.addSingle(feature,sub,script,language);switch(feature){case"aalt":case"salt":return"number"==typeof sub.by?this.addSingle(feature,sub,script,language):this.addAlternate(feature,sub,script,language);case"dlig":case"liga":case"rlig":return this.addLigature(feature,sub,script,language);case"ccmp":return sub.by instanceof Array?this.addMultiple(feature,sub,script,language):this.addLigature(feature,sub,script,language)}};var instructionTable,exec,execGlyph,execComponent,glyf={getPath,parse:
// Parse all the glyphs according to the offsets from the `loca` table.
function(data,start,loca,font,opt){return opt.lowMemory?function(data,start,loca,font){var glyphs=new glyphset.GlyphSet(font);return font._push=function(i){var offset=loca[i];offset!==loca[i+1]?glyphs.push(i,glyphset.ttfGlyphLoader(font,i,parseGlyph,data,start+offset,buildPath)):glyphs.push(i,glyphset.glyphLoader(font,i))},glyphs}(data,start,loca,font):function(data,start,loca,font){
// The last element of the loca table is invalid.
for(var glyphs=new glyphset.GlyphSet(font),i=0;i<loca.length-1;i+=1){var offset=loca[i];offset!==loca[i+1]?glyphs.push(i,glyphset.ttfGlyphLoader(font,i,parseGlyph,data,start+offset,buildPath)):glyphs.push(i,glyphset.glyphLoader(font,i))}return glyphs}(data,start,loca,font)}};
/* A TrueType font hinting interpreter.
*
* (c) 2017 Axel Kittenberger
*
* This interpreter has been implemented according to this documentation:
* https://developer.apple.com/fonts/TrueType-Reference-Manual/RM05/Chap5.html
*
* According to the documentation F24DOT6 values are used for pixels.
* That means calculation is 1/64 pixel accurate and uses integer operations.
* However, Javascript has floating point operations by default and only
* those are available. One could make a case to simulate the 1/64 accuracy
* exactly by truncating after every division operation
* (for example with << 0) to get pixel exactly results as other TrueType
* implementations. It may make sense since some fonts are pixel optimized
* by hand using DELTAP instructions. The current implementation doesn't
* and rather uses full floating point precision.
*
* xScale, yScale and rotation is currently ignored.
*
* A few non-trivial instructions are missing as I didn't encounter yet
* a font that used them to test a possible implementation.
*
* Some fonts seem to use undocumented features regarding the twilight zone.
* Only some of them are implemented as they were encountered.
*
* The exports.DEBUG statements are removed on the minified distribution file.
*/
/*
* Creates a hinting object.
*
* There ought to be exactly one
* for each truetype font that is used for hinting.
*/
function Hinting(font){
// the font this hinting object is for
this.font=font,this.getCommands=function(hPoints){return glyf.getPath(hPoints).commands},
// cached states
this._fpgmState=this._prepState=void 0,
// errorState
// 0 ... all okay
// 1 ... had an error in a glyf,
//       continue working but stop spamming
//       the console
// 2 ... error at prep, stop hinting at this ppem
// 3 ... error at fpeg, stop hinting for this font at all
this._errorState=0}
/*
* Not rounding.
*/function roundOff(v){return v}
/*
* Rounding to grid.
*/function roundToGrid(v){
//Rounding in TT is supposed to "symmetrical around zero"
return Math.sign(v)*Math.round(Math.abs(v))}
/*
* Rounding to double grid.
*/function roundToDoubleGrid(v){return Math.sign(v)*Math.round(Math.abs(2*v))/2}
/*
* Rounding to half grid.
*/function roundToHalfGrid(v){return Math.sign(v)*(Math.round(Math.abs(v)+.5)-.5)}
/*
* Rounding to up to grid.
*/function roundUpToGrid(v){return Math.sign(v)*Math.ceil(Math.abs(v))}
/*
* Rounding to down to grid.
*/function roundDownToGrid(v){return Math.sign(v)*Math.floor(Math.abs(v))}
/*
* Super rounding.
*/var roundSuper=function(v){var period=this.srPeriod,phase=this.srPhase,sign=1;
// according to http://xgridfit.sourceforge.net/round.html
return v<0&&(v=-v,sign=-1),v+=this.srThreshold-phase,v=Math.trunc(v/period)*period,(v+=phase)<0?phase*sign:v*sign},xUnitVector={x:1,y:0,axis:"x",
// Gets the projected distance between two points.
// o1/o2 ... if true, respective original position is used.
distance:function(p1,p2,o1,o2){return(o1?p1.xo:p1.x)-(o2?p2.xo:p2.x)},
// Moves point p so the moved position has the same relative
// position to the moved positions of rp1 and rp2 than the
// original positions had.
// See APPENDIX on INTERPOLATE at the bottom of this file.
interpolate:function(p,rp1,rp2,pv){var do1,do2,doa1,doa2,dm1,dm2,dt;if(!pv||pv===this)return do1=p.xo-rp1.xo,do2=p.xo-rp2.xo,dm1=rp1.x-rp1.xo,dm2=rp2.x-rp2.xo,0===(dt=(doa1=Math.abs(do1))+(doa2=Math.abs(do2)))?void(p.x=p.xo+(dm1+dm2)/2):void(p.x=p.xo+(dm1*doa2+dm2*doa1)/dt);do1=pv.distance(p,rp1,!0,!0),do2=pv.distance(p,rp2,!0,!0),dm1=pv.distance(rp1,rp1,!1,!0),dm2=pv.distance(rp2,rp2,!1,!0),0!==(dt=(doa1=Math.abs(do1))+(doa2=Math.abs(do2)))?xUnitVector.setRelative(p,p,(dm1*doa2+dm2*doa1)/dt,pv,!0):xUnitVector.setRelative(p,p,(dm1+dm2)/2,pv,!0)},
// Slope of line normal to this
normalSlope:Number.NEGATIVE_INFINITY,
// Sets the point 'p' relative to point 'rp'
// by the distance 'd'.
// See APPENDIX on SETRELATIVE at the bottom of this file.
// p   ... point to set
// rp  ... reference point
// d   ... distance on projection vector
// pv  ... projection vector (undefined = this)
// org ... if true, uses the original position of rp as reference.
setRelative:function(p,rp,d,pv,org){if(pv&&pv!==this){var rpx=org?rp.xo:rp.x,rpy=org?rp.yo:rp.y,rpdx=rpx+d*pv.x,rpdy=rpy+d*pv.y;p.x=rpdx+(p.y-rpdy)/pv.normalSlope}else p.x=(org?rp.xo:rp.x)+d},
// Slope of vector line.
slope:0,
// Touches the point p.
touch:function(p){p.xTouched=!0},
// Tests if a point p is touched.
touched:function(p){return p.xTouched},
// Untouches the point p.
untouch:function(p){p.xTouched=!1}},yUnitVector={x:0,y:1,axis:"y",
// Gets the projected distance between two points.
// o1/o2 ... if true, respective original position is used.
distance:function(p1,p2,o1,o2){return(o1?p1.yo:p1.y)-(o2?p2.yo:p2.y)},
// Moves point p so the moved position has the same relative
// position to the moved positions of rp1 and rp2 than the
// original positions had.
// See APPENDIX on INTERPOLATE at the bottom of this file.
interpolate:function(p,rp1,rp2,pv){var do1,do2,doa1,doa2,dm1,dm2,dt;if(!pv||pv===this)return do1=p.yo-rp1.yo,do2=p.yo-rp2.yo,dm1=rp1.y-rp1.yo,dm2=rp2.y-rp2.yo,0===(dt=(doa1=Math.abs(do1))+(doa2=Math.abs(do2)))?void(p.y=p.yo+(dm1+dm2)/2):void(p.y=p.yo+(dm1*doa2+dm2*doa1)/dt);do1=pv.distance(p,rp1,!0,!0),do2=pv.distance(p,rp2,!0,!0),dm1=pv.distance(rp1,rp1,!1,!0),dm2=pv.distance(rp2,rp2,!1,!0),0!==(dt=(doa1=Math.abs(do1))+(doa2=Math.abs(do2)))?yUnitVector.setRelative(p,p,(dm1*doa2+dm2*doa1)/dt,pv,!0):yUnitVector.setRelative(p,p,(dm1+dm2)/2,pv,!0)},
// Slope of line normal to this.
normalSlope:0,
// Sets the point 'p' relative to point 'rp'
// by the distance 'd'
// See APPENDIX on SETRELATIVE at the bottom of this file.
// p   ... point to set
// rp  ... reference point
// d   ... distance on projection vector
// pv  ... projection vector (undefined = this)
// org ... if true, uses the original position of rp as reference.
setRelative:function(p,rp,d,pv,org){if(pv&&pv!==this){var rpx=org?rp.xo:rp.x,rpy=org?rp.yo:rp.y,rpdx=rpx+d*pv.x,rpdy=rpy+d*pv.y;p.y=rpdy+pv.normalSlope*(p.x-rpdx)}else p.y=(org?rp.yo:rp.y)+d},
// Slope of vector line.
slope:Number.POSITIVE_INFINITY,
// Touches the point p.
touch:function(p){p.yTouched=!0},
// Tests if a point p is touched.
touched:function(p){return p.yTouched},
// Untouches the point p.
untouch:function(p){p.yTouched=!1}};
/*
* Unit vector of x-axis.
*/
/*
* Creates a unit vector that is not x- or y-axis.
*/
function UnitVector(x,y){this.x=x,this.y=y,this.axis=void 0,this.slope=y/x,this.normalSlope=-x/y,Object.freeze(this)}
/*
* Gets the projected distance between two points.
* o1/o2 ... if true, respective original position is used.
*/
/*
* Returns a unit vector with x/y coordinates.
*/
function getUnitVector(x,y){var d=Math.sqrt(x*x+y*y);return y/=d,1===(x/=d)&&0===y?xUnitVector:0===x&&1===y?yUnitVector:new UnitVector(x,y)}
/*
* Creates a point in the hinting engine.
*/function HPoint(x,y,lastPointOfContour,onCurve){this.x=this.xo=Math.round(64*x)/64,// hinted x value and original x-value
this.y=this.yo=Math.round(64*y)/64,// hinted y value and original y-value
this.lastPointOfContour=lastPointOfContour,this.onCurve=onCurve,this.prevPointOnContour=void 0,this.nextPointOnContour=void 0,this.xTouched=!1,this.yTouched=!1,Object.preventExtensions(this)}
/*
* Returns the next touched point on the contour.
*
* v  ... unit vector to test touch axis.
*/Object.freeze(xUnitVector),Object.freeze(yUnitVector),UnitVector.prototype.distance=function(p1,p2,o1,o2){return this.x*xUnitVector.distance(p1,p2,o1,o2)+this.y*yUnitVector.distance(p1,p2,o1,o2)},
/*
* Moves point p so the moved position has the same relative
* position to the moved positions of rp1 and rp2 than the
* original positions had.
*
* See APPENDIX on INTERPOLATE at the bottom of this file.
*/
UnitVector.prototype.interpolate=function(p,rp1,rp2,pv){var dm1,dm2,do1,do2,doa1,doa2,dt;do1=pv.distance(p,rp1,!0,!0),do2=pv.distance(p,rp2,!0,!0),dm1=pv.distance(rp1,rp1,!1,!0),dm2=pv.distance(rp2,rp2,!1,!0),0!==(dt=(doa1=Math.abs(do1))+(doa2=Math.abs(do2)))?this.setRelative(p,p,(dm1*doa2+dm2*doa1)/dt,pv,!0):this.setRelative(p,p,(dm1+dm2)/2,pv,!0)},
/*
* Sets the point 'p' relative to point 'rp'
* by the distance 'd'
*
* See APPENDIX on SETRELATIVE at the bottom of this file.
*
* p   ...  point to set
* rp  ... reference point
* d   ... distance on projection vector
* pv  ... projection vector (undefined = this)
* org ... if true, uses the original position of rp as reference.
*/
UnitVector.prototype.setRelative=function(p,rp,d,pv,org){pv=pv||this;var rpx=org?rp.xo:rp.x,rpy=org?rp.yo:rp.y,rpdx=rpx+d*pv.x,rpdy=rpy+d*pv.y,pvns=pv.normalSlope,fvs=this.slope,px=p.x,py=p.y;p.x=(fvs*px-pvns*rpdx+rpdy-py)/(fvs-pvns),p.y=fvs*(p.x-px)+py},
/*
* Touches the point p.
*/
UnitVector.prototype.touch=function(p){p.xTouched=!0,p.yTouched=!0},HPoint.prototype.nextTouched=function(v){for(var p=this.nextPointOnContour;!v.touched(p)&&p!==this;)p=p.nextPointOnContour;return p},
/*
* Returns the previous touched point on the contour
*
* v  ... unit vector to test touch axis.
*/
HPoint.prototype.prevTouched=function(v){for(var p=this.prevPointOnContour;!v.touched(p)&&p!==this;)p=p.prevPointOnContour;return p};
/*
* The zero point.
*/
var HPZero=Object.freeze(new HPoint(0,0)),defaultState={cvCutIn:17/16,// control value cut in
deltaBase:9,deltaShift:.125,loop:1,// loops some instructions
minDis:1,// minimum distance
autoFlip:!0};
/*
* The default state of the interpreter.
*
* Note: Freezing the defaultState and then deriving from it
* makes the V8 Javascript engine going awkward,
* so this is avoided, albeit the defaultState shouldn't
* ever change.
*/
/*
* The current state of the interpreter.
*
* env  ... 'fpgm' or 'prep' or 'glyf'
* prog ... the program
*/
function State(env,prog){switch(this.env=env,this.stack=[],this.prog=prog,env){case"glyf":this.zp0=this.zp1=this.zp2=1,this.rp0=this.rp1=this.rp2=0;
/* fall through */case"prep":this.fv=this.pv=this.dpv=xUnitVector,this.round=roundToGrid}}
/*
* Executes a glyph program.
*
* This does the hinting for each glyph.
*
* Returns an array of moved points.
*
* glyph: the glyph to hint
* ppem: the size the glyph is rendered for
*/
/*
* Initializes the twilight zone.
*
* This is only done if a SZPx instruction
* refers to the twilight zone.
*/
function initTZone(state){
// no idea if this is actually correct...
for(var tZone=state.tZone=new Array(state.gZone.length),i=0;i<tZone.length;i++)tZone[i]=new HPoint(0,0)}
/*
* Skips the instruction pointer ahead over an IF/ELSE block.
* handleElse .. if true breaks on matching ELSE
*/function skip(state,handleElse){var ins,prog=state.prog,ip=state.ip,nesting=1;do{if(88===(ins=prog[++ip]))nesting++;else if(89===ins)nesting--;else if(64===ins)ip+=prog[ip+1]+1;else if(65===ins)ip+=2*prog[ip+1]+1;else if(ins>=176&&ins<=183)ip+=ins-176+1;else if(ins>=184&&ins<=191)ip+=2*(ins-184+1);else if(handleElse&&1===nesting&&27===ins)break}while(nesting>0);state.ip=ip}
/*----------------------------------------------------------*
*          And then a lot of instructions...                *
*----------------------------------------------------------*/
// SVTCA[a] Set freedom and projection Vectors To Coordinate Axis
// 0x00-0x01
function SVTCA(v,state){exports.DEBUG&&console.log(state.step,"SVTCA["+v.axis+"]"),state.fv=state.pv=state.dpv=v}
// SPVTCA[a] Set Projection Vector to Coordinate Axis
// 0x02-0x03
function SPVTCA(v,state){exports.DEBUG&&console.log(state.step,"SPVTCA["+v.axis+"]"),state.pv=state.dpv=v}
// SFVTCA[a] Set Freedom Vector to Coordinate Axis
// 0x04-0x05
function SFVTCA(v,state){exports.DEBUG&&console.log(state.step,"SFVTCA["+v.axis+"]"),state.fv=v}
// SPVTL[a] Set Projection Vector To Line
// 0x06-0x07
function SPVTL(a,state){var dx,dy,stack=state.stack,p2i=stack.pop(),p1i=stack.pop(),p2=state.z2[p2i],p1=state.z1[p1i];exports.DEBUG&&console.log("SPVTL["+a+"]",p2i,p1i),a?(dx=p2.y-p1.y,dy=p1.x-p2.x):(dx=p1.x-p2.x,dy=p1.y-p2.y),state.pv=state.dpv=getUnitVector(dx,dy)}
// SFVTL[a] Set Freedom Vector To Line
// 0x08-0x09
function SFVTL(a,state){var dx,dy,stack=state.stack,p2i=stack.pop(),p1i=stack.pop(),p2=state.z2[p2i],p1=state.z1[p1i];exports.DEBUG&&console.log("SFVTL["+a+"]",p2i,p1i),a?(dx=p2.y-p1.y,dy=p1.x-p2.x):(dx=p1.x-p2.x,dy=p1.y-p2.y),state.fv=getUnitVector(dx,dy)}
// SPVFS[] Set Projection Vector From Stack
// 0x0A
// POP[] POP top stack element
// 0x21
function POP(state){exports.DEBUG&&console.log(state.step,"POP[]"),state.stack.pop()}
// CLEAR[] CLEAR the stack
// 0x22
// MDAP[a] Move Direct Absolute Point
// 0x2E-0x2F
function MDAP(round,state){var pi=state.stack.pop(),p=state.z0[pi],fv=state.fv,pv=state.pv;exports.DEBUG&&console.log(state.step,"MDAP["+round+"]",pi);var d=pv.distance(p,HPZero);round&&(d=state.round(d)),fv.setRelative(p,HPZero,d,pv),fv.touch(p),state.rp0=state.rp1=pi}
// IUP[a] Interpolate Untouched Points through the outline
// 0x30
function IUP(v,state){var cp,pp,np,z2=state.z2,pLen=z2.length-2;exports.DEBUG&&console.log(state.step,"IUP["+v.axis+"]");for(var i=0;i<pLen;i++)cp=z2[i],// current point
// if this point has been touched go on
v.touched(cp)||
// no point on the contour has been touched?
(pp=cp.prevTouched(v))!==cp&&(pp===(np=cp.nextTouched(v))&&
// only one point on the contour has been touched
// so simply moves the point like that
v.setRelative(cp,cp,v.distance(pp,pp,!1,!0),v,!0),v.interpolate(cp,pp,np,v))}
// SHP[] SHift Point using reference point
// 0x32-0x33
function SHP(a,state){for(var stack=state.stack,rpi=a?state.rp1:state.rp2,rp=(a?state.z0:state.z1)[rpi],fv=state.fv,pv=state.pv,loop=state.loop,z2=state.z2;loop--;){var pi=stack.pop(),p=z2[pi],d=pv.distance(rp,rp,!1,!0);fv.setRelative(p,p,d,pv),fv.touch(p),exports.DEBUG&&console.log(state.step,(state.loop>1?"loop "+(state.loop-loop)+": ":"")+"SHP["+(a?"rp1":"rp2")+"]",pi)}state.loop=1}
// SHC[] SHift Contour using reference point
// 0x36-0x37
function SHC(a,state){var stack=state.stack,rpi=a?state.rp1:state.rp2,rp=(a?state.z0:state.z1)[rpi],fv=state.fv,pv=state.pv,ci=stack.pop(),sp=state.z2[state.contours[ci]],p=sp;exports.DEBUG&&console.log(state.step,"SHC["+a+"]",ci);var d=pv.distance(rp,rp,!1,!0);do{p!==rp&&fv.setRelative(p,p,d,pv),p=p.nextPointOnContour}while(p!==sp)}
// SHZ[] SHift Zone using reference point
// 0x36-0x37
function SHZ(a,state){var z,p,stack=state.stack,rpi=a?state.rp1:state.rp2,rp=(a?state.z0:state.z1)[rpi],fv=state.fv,pv=state.pv,e=stack.pop();switch(exports.DEBUG&&console.log(state.step,"SHZ["+a+"]",e),e){case 0:z=state.tZone;break;case 1:z=state.gZone;break;default:throw new Error("Invalid zone")}for(var d=pv.distance(rp,rp,!1,!0),pLen=z.length-2,i=0;i<pLen;i++)p=z[i],fv.setRelative(p,p,d,pv)}
// SHPIX[] SHift point by a PIXel amount
// 0x38
// MSIRP[a] Move Stack Indirect Relative Point
// 0x3A-0x3B
function MSIRP(a,state){var stack=state.stack,d=stack.pop()/64,pi=stack.pop(),p=state.z1[pi],rp0=state.z0[state.rp0],fv=state.fv,pv=state.pv;fv.setRelative(p,rp0,d,pv),fv.touch(p),exports.DEBUG&&console.log(state.step,"MSIRP["+a+"]",d,pi),state.rp1=state.rp0,state.rp2=pi,a&&(state.rp0=pi)}
// ALIGNRP[] Align to reference point.
// 0x3C
// MIAP[a] Move Indirect Absolute Point
// 0x3E-0x3F
function MIAP(round,state){var stack=state.stack,n=stack.pop(),pi=stack.pop(),p=state.z0[pi],fv=state.fv,pv=state.pv,cv=state.cvt[n];exports.DEBUG&&console.log(state.step,"MIAP["+round+"]",n,"(",cv,")",pi);var d=pv.distance(p,HPZero);round&&(Math.abs(d-cv)<state.cvCutIn&&(d=cv),d=state.round(d)),fv.setRelative(p,HPZero,d,pv),0===state.zp0&&(p.xo=p.x,p.yo=p.y),fv.touch(p),state.rp0=state.rp1=pi}
// NPUSB[] PUSH N Bytes
// 0x40
// GC[] Get Coordinate projected onto the projection vector
// 0x46-0x47
function GC(a,state){var stack=state.stack,pi=stack.pop(),p=state.z2[pi];exports.DEBUG&&console.log(state.step,"GC["+a+"]",pi),stack.push(64*state.dpv.distance(p,HPZero,a,!1))}
// MD[a] Measure Distance
// 0x49-0x4A
function MD(a,state){var stack=state.stack,pi2=stack.pop(),pi1=stack.pop(),p2=state.z1[pi2],p1=state.z0[pi1],d=state.dpv.distance(p1,p2,a,a);exports.DEBUG&&console.log(state.step,"MD["+a+"]",pi2,pi1,"->",d),state.stack.push(Math.round(64*d))}
// MPPEM[] Measure Pixels Per EM
// 0x4B
// DELTAP1[] DELTA exception P1
// DELTAP2[] DELTA exception P2
// DELTAP3[] DELTA exception P3
// 0x5D, 0x71, 0x72
function DELTAP123(b,state){var stack=state.stack,n=stack.pop(),fv=state.fv,pv=state.pv,ppem=state.ppem,base=state.deltaBase+16*(b-1),ds=state.deltaShift,z0=state.z0;exports.DEBUG&&console.log(state.step,"DELTAP["+b+"]",n,stack);for(var i=0;i<n;i++){var pi=stack.pop(),arg=stack.pop();if(base+((240&arg)>>4)===ppem){var mag=(15&arg)-8;mag>=0&&mag++,exports.DEBUG&&console.log(state.step,"DELTAPFIX",pi,"by",mag*ds);var p=z0[pi];fv.setRelative(p,p,mag*ds,pv)}}}
// SDB[] Set Delta Base in the graphics state
// 0x5E
// ROUND[ab] ROUND value
// 0x68-0x6B
function ROUND(dt,state){var stack=state.stack,n=stack.pop();exports.DEBUG&&console.log(state.step,"ROUND[]"),stack.push(64*state.round(n/64))}
// WCVTF[] Write Control Value Table in Funits
// 0x70
// DELTAC1[] DELTA exception C1
// DELTAC2[] DELTA exception C2
// DELTAC3[] DELTA exception C3
// 0x73, 0x74, 0x75
function DELTAC123(b,state){var stack=state.stack,n=stack.pop(),ppem=state.ppem,base=state.deltaBase+16*(b-1),ds=state.deltaShift;exports.DEBUG&&console.log(state.step,"DELTAC["+b+"]",n,stack);for(var i=0;i<n;i++){var c=stack.pop(),arg=stack.pop();if(base+((240&arg)>>4)===ppem){var mag=(15&arg)-8;mag>=0&&mag++;var delta=mag*ds;exports.DEBUG&&console.log(state.step,"DELTACFIX",c,"by",delta),state.cvt[c]+=delta}}}
// SROUND[] Super ROUND
// 0x76
// SDPVTL[a] Set Dual Projection Vector To Line
// 0x86-0x87
function SDPVTL(a,state){var dx,dy,stack=state.stack,p2i=stack.pop(),p1i=stack.pop(),p2=state.z2[p2i],p1=state.z1[p1i];exports.DEBUG&&console.log(state.step,"SDPVTL["+a+"]",p2i,p1i),a?(dx=p2.y-p1.y,dy=p1.x-p2.x):(dx=p1.x-p2.x,dy=p1.y-p2.y),state.dpv=getUnitVector(dx,dy)}
// GETINFO[] GET INFOrmation
// 0x88
// PUSHB[abc] PUSH Bytes
// 0xB0-0xB7
function PUSHB(n,state){var stack=state.stack,prog=state.prog,ip=state.ip;exports.DEBUG&&console.log(state.step,"PUSHB["+n+"]");for(var i=0;i<n;i++)stack.push(prog[++ip]);state.ip=ip}
// PUSHW[abc] PUSH Words
// 0xB8-0xBF
function PUSHW(n,state){var ip=state.ip,prog=state.prog,stack=state.stack;exports.DEBUG&&console.log(state.ip,"PUSHW["+n+"]");for(var i=0;i<n;i++){var w=prog[++ip]<<8|prog[++ip];32768&w&&(w=-(1+(65535^w))),stack.push(w)}state.ip=ip}
// MDRP[abcde] Move Direct Relative Point
// 0xD0-0xEF
// (if indirect is 0)

// and

// MIRP[abcde] Move Indirect Relative Point
// 0xE0-0xFF
// (if indirect is 1)
function MDRP_MIRP(indirect,setRp0,keepD,ro,dt,state){var od,d,sign,cv,stack=state.stack,cvte=indirect&&stack.pop(),pi=stack.pop(),rp0i=state.rp0,rp=state.z0[rp0i],p=state.z1[pi],md=state.minDis,fv=state.fv,pv=state.dpv;sign=(d=od=pv.distance(p,rp,!0,!0))>=0?1:-1,// Math.sign would be 0 in case of 0
// TODO consider autoFlip
d=Math.abs(d),indirect&&(cv=state.cvt[cvte],ro&&Math.abs(d-cv)<state.cvCutIn&&(d=cv)),keepD&&d<md&&(d=md),ro&&(d=state.round(d)),fv.setRelative(p,rp,sign*d,pv),fv.touch(p),exports.DEBUG&&console.log(state.step,(indirect?"MIRP[":"MDRP[")+(setRp0?"M":"m")+(keepD?">":"_")+(ro?"R":"_")+(0===dt?"Gr":1===dt?"Bl":2===dt?"Wh":"")+"]",indirect?cvte+"("+state.cvt[cvte]+","+cv+")":"",pi,"(d =",od,"->",sign*d,")"),state.rp1=state.rp0,state.rp2=pi,setRp0&&(state.rp0=pi)}
/*
* The instruction table.
*/
/*****************************
  Mathematical Considerations
******************************

fv ... refers to freedom vector
pv ... refers to projection vector
rp ... refers to reference point
p  ... refers to to point being operated on
d  ... refers to distance

SETRELATIVE:
============

case freedom vector == x-axis:
------------------------------

                        (pv)
                     .-'
              rpd .-'
               .-*
          d .-'90°'
         .-'       '
      .-'           '
   *-'               ' b
  rp                  '
                       '
                        '
            p *----------*-------------- (fv)
                          pm

  rpdx = rpx + d * pv.x
  rpdy = rpy + d * pv.y

  equation of line b

   y - rpdy = pvns * (x- rpdx)

   y = p.y

   x = rpdx + ( p.y - rpdy ) / pvns


case freedom vector == y-axis:
------------------------------

    * pm
    |\
    | \
    |  \
    |   \
    |    \
    |     \
    |      \
    |       \
    |        \
    |         \ b
    |          \
    |           \
    |            \    .-' (pv)
    |         90° \.-'
    |           .-'* rpd
    |        .-'
    *     *-'  d
    p     rp

  rpdx = rpx + d * pv.x
  rpdy = rpy + d * pv.y

  equation of line b:
           pvns ... normal slope to pv

   y - rpdy = pvns * (x - rpdx)

   x = p.x

   y = rpdy +  pvns * (p.x - rpdx)



generic case:
-------------


                              .'(fv)
                            .'
                          .* pm
                        .' !
                      .'    .
                    .'      !
                  .'         . b
                .'           !
               *              .
              p               !
                         90°   .    ... (pv)
                           ...-*-'''
                  ...---'''    rpd
         ...---'''   d
   *--'''
  rp

    rpdx = rpx + d * pv.x
    rpdy = rpy + d * pv.y

 equation of line b:
    pvns... normal slope to pv

    y - rpdy = pvns * (x - rpdx)

 equation of freedom vector line:
    fvs ... slope of freedom vector (=fy/fx)

    y - py = fvs * (x - px)


  on pm both equations are true for same x/y

    y - rpdy = pvns * (x - rpdx)

    y - py = fvs * (x - px)

  form to y and set equal:

    pvns * (x - rpdx) + rpdy = fvs * (x - px) + py

  expand:

    pvns * x - pvns * rpdx + rpdy = fvs * x - fvs * px + py

  switch:

    fvs * x - fvs * px + py = pvns * x - pvns * rpdx + rpdy

  solve for x:

    fvs * x - pvns * x = fvs * px - pvns * rpdx - py + rpdy



          fvs * px - pvns * rpdx + rpdy - py
    x =  -----------------------------------
                 fvs - pvns

  and:

    y = fvs * (x - px) + py



INTERPOLATE:
============

Examples of point interpolation.

The weight of the movement of the reference point gets bigger
the further the other reference point is away, thus the safest
option (that is avoiding 0/0 divisions) is to weight the
original distance of the other point by the sum of both distances.

If the sum of both distances is 0, then move the point by the
arithmetic average of the movement of both reference points.




           (+6)
    rp1o *---->*rp1
         .     .                          (+12)
         .     .                  rp2o *---------->* rp2
         .     .                       .           .
         .     .                       .           .
         .    10          20           .           .
         |.........|...................|           .
               .   .                               .
               .   . (+8)                          .
                po *------>*p                      .
               .           .                       .
               .    12     .          24           .
               |...........|.......................|
                                  36


-------



           (+10)
    rp1o *-------->*rp1
         .         .                      (-10)
         .         .              rp2 *<---------* rpo2
         .         .                   .         .
         .         .                   .         .
         .    10   .          30       .         .
         |.........|.............................|
                   .                   .
                   . (+5)              .
                po *--->* p            .
                   .    .              .
                   .    .   20         .
                   |....|..............|
                     5        15


-------


           (+10)
    rp1o *-------->*rp1
         .         .
         .         .
    rp2o *-------->*rp2


                               (+10)
                          po *-------->* p

-------


           (+10)
    rp1o *-------->*rp1
         .         .
         .         .(+30)
    rp2o *---------------------------->*rp2


                                        (+25)
                          po *----------------------->* p



vim: set ts=4 sw=4 expandtab:
*****/
/**
 * Converts a string into a list of tokens.
 */
/**
 * Create a new token
 * @param {string} char a single char
 */
function Token(char){this.char=char,this.state={},this.activeState=null}
/**
 * Create a new context range
 * @param {number} startIndex range start index
 * @param {number} endOffset range end index offset
 * @param {string} contextName owner context name
 */function ContextRange(startIndex,endOffset,contextName){this.contextName=contextName,this.startIndex=startIndex,this.endOffset=endOffset}
/**
 * Check context start and end
 * @param {string} contextName a unique context name
 * @param {function} checkStart a predicate function the indicates a context's start
 * @param {function} checkEnd a predicate function the indicates a context's end
 */function ContextChecker(contextName,checkStart,checkEnd){this.contextName=contextName,this.openRange=null,this.ranges=[],this.checkStart=checkStart,this.checkEnd=checkEnd}
/**
 * @typedef ContextParams
 * @type Object
 * @property {array} context context items
 * @property {number} currentIndex current item index
 */
/**
 * Create a context params
 * @param {array} context a list of items
 * @param {number} currentIndex current item index
 */function ContextParams(context,currentIndex){this.context=context,this.index=currentIndex,this.length=context.length,this.current=context[currentIndex],this.backtrack=context.slice(0,currentIndex),this.lookahead=context.slice(currentIndex+1)}
/**
 * Create an event instance
 * @param {string} eventId event unique id
 */function Event(eventId){this.eventId=eventId,this.subscribers=[]}
/**
 * Initialize a core events and auto subscribe required event handlers
 * @param {any} events an object that enlists core events handlers
 */function initializeCoreEvents(events){var this$1=this,coreEvents=["start","end","next","newToken","contextStart","contextEnd","insertToken","removeToken","removeRange","replaceToken","replaceRange","composeRUD","updateContextsRanges"];coreEvents.forEach(function(eventId){Object.defineProperty(this$1.events,eventId,{value:new Event(eventId)})}),events&&coreEvents.forEach(function(eventId){var event=events[eventId];"function"==typeof event&&this$1.events[eventId].subscribe(event)});["insertToken","removeToken","removeRange","replaceToken","replaceRange","composeRUD"].forEach(function(eventId){this$1.events[eventId].subscribe(this$1.updateContextsRanges)})}
/**
 * Converts a string into a list of tokens
 * @param {any} events tokenizer core events
 */function Tokenizer(events){this.tokens=[],this.registeredContexts={},this.contextCheckers=[],this.events={},this.registeredModifiers=[],initializeCoreEvents.call(this,events)}
/**
 * Sets the state of a token, usually called by a state modifier.
 * @param {string} key state item key
 * @param {any} value state item value
 */
// ╭─┄┄┄────────────────────────┄─────────────────────────────────────────────╮
// ┊ Character Class Assertions ┊ Checks if a char belongs to a certain class ┊
// ╰─╾──────────────────────────┄─────────────────────────────────────────────╯
// jscs:disable maximumLineLength
/**
 * Check if a char is Arabic
 * @param {string} c a single char
 */
function isArabicChar(c){return/[\u0600-\u065F\u066A-\u06D2\u06FA-\u06FF]/.test(c)}
/**
 * Check if a char is an isolated arabic char
 * @param {string} c a single char
 */function isIsolatedArabicChar(char){return/[\u0630\u0690\u0621\u0631\u0661\u0671\u0622\u0632\u0672\u0692\u06C2\u0623\u0673\u0693\u06C3\u0624\u0694\u06C4\u0625\u0675\u0695\u06C5\u06E5\u0676\u0696\u06C6\u0627\u0677\u0697\u06C7\u0648\u0688\u0698\u06C8\u0689\u0699\u06C9\u068A\u06CA\u066B\u068B\u06CB\u068C\u068D\u06CD\u06FD\u068E\u06EE\u06FE\u062F\u068F\u06CF\u06EF]/.test(char)}
/**
 * Check if a char is an Arabic Tashkeel char
 * @param {string} c a single char
 */function isTashkeelArabicChar(char){return/[\u0600-\u0605\u060C-\u060E\u0610-\u061B\u061E\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/.test(char)}
/**
 * Check if a char is Latin
 * @param {string} c a single char
 */function isLatinChar(c){return/[A-z]/.test(c)}
/**
 * Check if a char is whitespace char
 * @param {string} c a single char
 */
/**
 * Query a feature by some of it's properties to lookup a glyph substitution.
 */
/**
 * Create feature query instance
 * @param {Font} font opentype font instance
 */
function FeatureQuery(font){this.font=font,this.features={}}
/**
 * @typedef SubstitutionAction
 * @type Object
 * @property {number} id substitution type
 * @property {string} tag feature tag
 * @property {any} substitution substitution value(s)
 */
/**
 * Create a substitution action instance
 * @param {SubstitutionAction} action
 */function SubstitutionAction(action){this.id=action.id,this.tag=action.tag,this.substitution=action.substitution}
/**
 * Lookup a coverage table
 * @param {number} glyphIndex glyph index
 * @param {CoverageTable} coverage coverage table
 */function lookupCoverage(glyphIndex,coverage){if(!glyphIndex)return-1;switch(coverage.format){case 1:return coverage.glyphs.indexOf(glyphIndex);case 2:for(var ranges=coverage.ranges,i=0;i<ranges.length;i++){var range=ranges[i];if(glyphIndex>=range.start&&glyphIndex<=range.end){var offset=glyphIndex-range.start;return range.index+offset}}break;default:return-1;// not found
}return-1}
/**
 * Handle a single substitution - format 1
 * @param {ContextParams} contextParams context params to lookup
 */function singleSubstitutionFormat1(glyphIndex,subtable){return-1===lookupCoverage(glyphIndex,subtable.coverage)?null:glyphIndex+subtable.deltaGlyphId}
/**
 * Handle a single substitution - format 2
 * @param {ContextParams} contextParams context params to lookup
 */function singleSubstitutionFormat2(glyphIndex,subtable){var substituteIndex=lookupCoverage(glyphIndex,subtable.coverage);return-1===substituteIndex?null:subtable.substitute[substituteIndex]}
/**
 * Lookup a list of coverage tables
 * @param {any} coverageList a list of coverage tables
 * @param {ContextParams} contextParams context params to lookup
 */function lookupCoverageList(coverageList,contextParams){for(var lookupList=[],i=0;i<coverageList.length;i++){var coverage=coverageList[i],glyphIndex=contextParams.current,lookupIndex=lookupCoverage(glyphIndex=Array.isArray(glyphIndex)?glyphIndex[0]:glyphIndex,coverage);-1!==lookupIndex&&lookupList.push(lookupIndex)}return lookupList.length!==coverageList.length?-1:lookupList}
/**
 * Handle chaining context substitution - format 3
 * @param {ContextParams} contextParams context params to lookup
 */function chainingSubstitutionFormat3(contextParams,subtable){var lookupsCount=subtable.inputCoverage.length+subtable.lookaheadCoverage.length+subtable.backtrackCoverage.length;if(contextParams.context.length<lookupsCount)return[];
// INPUT LOOKUP //
var inputLookups=lookupCoverageList(subtable.inputCoverage,contextParams);if(-1===inputLookups)return[];
// LOOKAHEAD LOOKUP //
var lookaheadOffset=subtable.inputCoverage.length-1;if(contextParams.lookahead.length<subtable.lookaheadCoverage.length)return[];for(var lookaheadContext=contextParams.lookahead.slice(lookaheadOffset);lookaheadContext.length&&isTashkeelArabicChar(lookaheadContext[0].char);)lookaheadContext.shift();var lookaheadParams=new ContextParams(lookaheadContext,0),lookaheadLookups=lookupCoverageList(subtable.lookaheadCoverage,lookaheadParams),backtrackContext=[].concat(contextParams.backtrack);for(backtrackContext.reverse();backtrackContext.length&&isTashkeelArabicChar(backtrackContext[0].char);)backtrackContext.shift();if(backtrackContext.length<subtable.backtrackCoverage.length)return[];var backtrackParams=new ContextParams(backtrackContext,0),backtrackLookups=lookupCoverageList(subtable.backtrackCoverage,backtrackParams),substitutions=[];if(inputLookups.length===subtable.inputCoverage.length&&lookaheadLookups.length===subtable.lookaheadCoverage.length&&backtrackLookups.length===subtable.backtrackCoverage.length)for(var i=0;i<subtable.lookupRecords.length;i++)for(var lookupListIndex=subtable.lookupRecords[i].lookupListIndex,lookupTable=this.getLookupByIndex(lookupListIndex),s=0;s<lookupTable.subtables.length;s++){var subtable$1=lookupTable.subtables[s],lookup=this.getLookupMethod(lookupTable,subtable$1);if("12"===this.getSubstitutionType(lookupTable,subtable$1))for(var n=0;n<inputLookups.length;n++){var substitution=lookup(contextParams.get(n));substitution&&substitutions.push(substitution)}}return substitutions}
/**
 * Handle ligature substitution - format 1
 * @param {ContextParams} contextParams context params to lookup
 */function ligatureSubstitutionFormat1(contextParams,subtable){
// COVERAGE LOOKUP //
var ligature,ligSetIndex=lookupCoverage(contextParams.current,subtable.coverage);if(-1===ligSetIndex)return null;
// COMPONENTS LOOKUP
// (!) note, components are ordered in the written direction.
for(var ligatureSet=subtable.ligatureSets[ligSetIndex],s=0;s<ligatureSet.length;s++){ligature=ligatureSet[s];for(var l=0;l<ligature.components.length;l++){if(contextParams.lookahead[l]!==ligature.components[l])break;if(l===ligature.components.length-1)return ligature}}return null}
/**
 * Handle decomposition substitution - format 1
 * @param {number} glyphIndex glyph index
 * @param {any} subtable subtable
 */function decompositionSubstitutionFormat1(glyphIndex,subtable){var substituteIndex=lookupCoverage(glyphIndex,subtable.coverage);return-1===substituteIndex?null:subtable.sequences[substituteIndex]}
/**
 * Get default script features indexes
 */Hinting.prototype.exec=function(glyph,ppem){if("number"!=typeof ppem)throw new Error("Point size is not a number!");
// Received a fatal error, don't do any hinting anymore.
if(!(this._errorState>2)){var font=this.font,prepState=this._prepState;if(!prepState||prepState.ppem!==ppem){var fpgmState=this._fpgmState;if(!fpgmState){
// Executes the fpgm state.
// This is used by fonts to define functions.
State.prototype=defaultState,(fpgmState=this._fpgmState=new State("fpgm",font.tables.fpgm)).funcs=[],fpgmState.font=font,exports.DEBUG&&(console.log("---EXEC FPGM---"),fpgmState.step=-1);try{exec(fpgmState)}catch(e){return console.log("Hinting error in FPGM:"+e),void(this._errorState=3)}}
// Executes the prep program for this ppem setting.
// This is used by fonts to set cvt values
// depending on to be rendered font size.
State.prototype=fpgmState,(prepState=this._prepState=new State("prep",font.tables.prep)).ppem=ppem;
// Creates a copy of the cvt table
// and scales it to the current ppem setting.
var oCvt=font.tables.cvt;if(oCvt)for(var cvt=prepState.cvt=new Array(oCvt.length),scale=ppem/font.unitsPerEm,c=0;c<oCvt.length;c++)cvt[c]=oCvt[c]*scale;else prepState.cvt=[];exports.DEBUG&&(console.log("---EXEC PREP---"),prepState.step=-1);try{exec(prepState)}catch(e){this._errorState<2&&console.log("Hinting error in PREP:"+e),this._errorState=2}}if(!(this._errorState>1))try{return execGlyph(glyph,prepState)}catch(e){return this._errorState<1&&(console.log("Hinting error:"+e),console.log("Note: further hinting errors are silenced")),void(this._errorState=1)}}},
/*
* Executes the hinting program for a glyph.
*/
execGlyph=function(glyph,prepState){
// original point positions
var contours,gZone,state,xScale=prepState.ppem/prepState.font.unitsPerEm,yScale=xScale,components=glyph.components;if(State.prototype=prepState,components){var font=prepState.font;gZone=[],contours=[];for(var i=0;i<components.length;i++){var c=components[i],cg=font.glyphs.get(c.glyphIndex);state=new State("glyf",cg.instructions),exports.DEBUG&&(console.log("---EXEC COMP "+i+"---"),state.step=-1),execComponent(cg,state,xScale,yScale);for(
// appends the computed points to the result array
// post processes the component points
var dx=Math.round(c.dx*xScale),dy=Math.round(c.dy*yScale),gz=state.gZone,cc=state.contours,pi=0;pi<gz.length;pi++){var p=gz[pi];p.xTouched=p.yTouched=!1,p.xo=p.x=p.x+dx,p.yo=p.y=p.y+dy}var gLen=gZone.length;gZone.push.apply(gZone,gz);for(var j=0;j<cc.length;j++)contours.push(cc[j]+gLen)}glyph.instructions&&!state.inhibitGridFit&&(
// the composite has instructions on its own
(state=new State("glyf",glyph.instructions)).gZone=state.z0=state.z1=state.z2=gZone,state.contours=contours,
// note: HPZero cannot be used here, since
//       the point might be modified
gZone.push(new HPoint(0,0),new HPoint(Math.round(glyph.advanceWidth*xScale),0)),exports.DEBUG&&(console.log("---EXEC COMPOSITE---"),state.step=-1),exec(state),gZone.length-=2)}else state=new State("glyf",glyph.instructions),exports.DEBUG&&(console.log("---EXEC GLYPH---"),state.step=-1),execComponent(glyph,state,xScale,yScale),gZone=state.gZone;return gZone},
/*
* Executes the hinting program for a component of a multi-component glyph
* or of the glyph itself for a non-component glyph.
*/
execComponent=function(glyph,state,xScale,yScale){// current point
for(var cp,sp,np,points=glyph.points||[],pLen=points.length,gZone=state.gZone=state.z0=state.z1=state.z2=[],contours=state.contours=[],i=0;i<pLen;i++)cp=points[i],gZone[i]=new HPoint(cp.x*xScale,cp.y*yScale,cp.lastPointOfContour,cp.onCurve);
// Chain links the contours.
// next point
for(var i$1=0;i$1<pLen;i$1++)cp=gZone[i$1],sp||(sp=cp,contours.push(i$1)),cp.lastPointOfContour?(cp.nextPointOnContour=sp,sp.prevPointOnContour=cp,sp=void 0):(np=gZone[i$1+1],cp.nextPointOnContour=np,np.prevPointOnContour=cp);if(!state.inhibitGridFit){if(exports.DEBUG){console.log("PROCESSING GLYPH",state.stack);for(var i$2=0;i$2<pLen;i$2++)console.log(i$2,gZone[i$2].x,gZone[i$2].y)}if(gZone.push(new HPoint(0,0),new HPoint(Math.round(glyph.advanceWidth*xScale),0)),exec(state),
// Removes the extra points.
gZone.length-=2,exports.DEBUG){console.log("FINISHED GLYPH",state.stack);for(var i$3=0;i$3<pLen;i$3++)console.log(i$3,gZone[i$3].x,gZone[i$3].y)}}},
/*
* Executes the program loaded in state.
*/
exec=function(state){var prog=state.prog;if(prog){var ins,pLen=prog.length;for(state.ip=0;state.ip<pLen;state.ip++){if(exports.DEBUG&&state.step++,!(ins=instructionTable[prog[state.ip]]))throw new Error("unknown instruction: 0x"+Number(prog[state.ip]).toString(16));ins(state)}}},instructionTable=[
/* 0x00 */SVTCA.bind(void 0,yUnitVector),
/* 0x01 */SVTCA.bind(void 0,xUnitVector),
/* 0x02 */SPVTCA.bind(void 0,yUnitVector),
/* 0x03 */SPVTCA.bind(void 0,xUnitVector),
/* 0x04 */SFVTCA.bind(void 0,yUnitVector),
/* 0x05 */SFVTCA.bind(void 0,xUnitVector),
/* 0x06 */SPVTL.bind(void 0,0),
/* 0x07 */SPVTL.bind(void 0,1),
/* 0x08 */SFVTL.bind(void 0,0),
/* 0x09 */SFVTL.bind(void 0,1),function(state){var stack=state.stack,y=stack.pop(),x=stack.pop();exports.DEBUG&&console.log(state.step,"SPVFS[]",y,x),state.pv=state.dpv=getUnitVector(x,y)}
// SFVFS[] Set Freedom Vector From Stack
// 0x0B
,function(state){var stack=state.stack,y=stack.pop(),x=stack.pop();exports.DEBUG&&console.log(state.step,"SPVFS[]",y,x),state.fv=getUnitVector(x,y)}
// GPV[] Get Projection Vector
// 0x0C
,function(state){var stack=state.stack,pv=state.pv;exports.DEBUG&&console.log(state.step,"GPV[]"),stack.push(16384*pv.x),stack.push(16384*pv.y)}
// GFV[] Get Freedom Vector
// 0x0C
,function(state){var stack=state.stack,fv=state.fv;exports.DEBUG&&console.log(state.step,"GFV[]"),stack.push(16384*fv.x),stack.push(16384*fv.y)}
// SFVTPV[] Set Freedom Vector To Projection Vector
// 0x0E
,function(state){state.fv=state.pv,exports.DEBUG&&console.log(state.step,"SFVTPV[]")}
// ISECT[] moves point p to the InterSECTion of two lines
// 0x0F
,function(state){var stack=state.stack,pa0i=stack.pop(),pa1i=stack.pop(),pb0i=stack.pop(),pb1i=stack.pop(),pi=stack.pop(),z0=state.z0,z1=state.z1,pa0=z0[pa0i],pa1=z0[pa1i],pb0=z1[pb0i],pb1=z1[pb1i],p=state.z2[pi];exports.DEBUG&&console.log("ISECT[], ",pa0i,pa1i,pb0i,pb1i,pi);
// math from
// en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_points_on_each_line
var x1=pa0.x,y1=pa0.y,x2=pa1.x,y2=pa1.y,x3=pb0.x,y3=pb0.y,x4=pb1.x,y4=pb1.y,div=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4),f1=x1*y2-y1*x2,f2=x3*y4-y3*x4;p.x=(f1*(x3-x4)-f2*(x1-x2))/div,p.y=(f1*(y3-y4)-f2*(y1-y2))/div}
// SRP0[] Set Reference Point 0
// 0x10
,function(state){state.rp0=state.stack.pop(),exports.DEBUG&&console.log(state.step,"SRP0[]",state.rp0)}
// SRP1[] Set Reference Point 1
// 0x11
,function(state){state.rp1=state.stack.pop(),exports.DEBUG&&console.log(state.step,"SRP1[]",state.rp1)}
// SRP1[] Set Reference Point 2
// 0x12
,function(state){state.rp2=state.stack.pop(),exports.DEBUG&&console.log(state.step,"SRP2[]",state.rp2)}
// SZP0[] Set Zone Pointer 0
// 0x13
,function(state){var n=state.stack.pop();switch(exports.DEBUG&&console.log(state.step,"SZP0[]",n),state.zp0=n,n){case 0:state.tZone||initTZone(state),state.z0=state.tZone;break;case 1:state.z0=state.gZone;break;default:throw new Error("Invalid zone pointer")}}
// SZP1[] Set Zone Pointer 1
// 0x14
,function(state){var n=state.stack.pop();switch(exports.DEBUG&&console.log(state.step,"SZP1[]",n),state.zp1=n,n){case 0:state.tZone||initTZone(state),state.z1=state.tZone;break;case 1:state.z1=state.gZone;break;default:throw new Error("Invalid zone pointer")}}
// SZP2[] Set Zone Pointer 2
// 0x15
,function(state){var n=state.stack.pop();switch(exports.DEBUG&&console.log(state.step,"SZP2[]",n),state.zp2=n,n){case 0:state.tZone||initTZone(state),state.z2=state.tZone;break;case 1:state.z2=state.gZone;break;default:throw new Error("Invalid zone pointer")}}
// SZPS[] Set Zone PointerS
// 0x16
,function(state){var n=state.stack.pop();switch(exports.DEBUG&&console.log(state.step,"SZPS[]",n),state.zp0=state.zp1=state.zp2=n,n){case 0:state.tZone||initTZone(state),state.z0=state.z1=state.z2=state.tZone;break;case 1:state.z0=state.z1=state.z2=state.gZone;break;default:throw new Error("Invalid zone pointer")}}
// SLOOP[] Set LOOP variable
// 0x17
,function(state){state.loop=state.stack.pop(),exports.DEBUG&&console.log(state.step,"SLOOP[]",state.loop)}
// RTG[] Round To Grid
// 0x18
,function(state){exports.DEBUG&&console.log(state.step,"RTG[]"),state.round=roundToGrid}
// RTHG[] Round To Half Grid
// 0x19
,function(state){exports.DEBUG&&console.log(state.step,"RTHG[]"),state.round=roundToHalfGrid}
// SMD[] Set Minimum Distance
// 0x1A
,function(state){var d=state.stack.pop();exports.DEBUG&&console.log(state.step,"SMD[]",d),state.minDis=d/64}
// ELSE[] ELSE clause
// 0x1B
,function(state){
// This instruction has been reached by executing a then branch
// so it just skips ahead until matching EIF.
// In case the IF was negative the IF[] instruction already
// skipped forward over the ELSE[]
exports.DEBUG&&console.log(state.step,"ELSE[]"),skip(state,!1)}
// JMPR[] JuMP Relative
// 0x1C
,function(state){var o=state.stack.pop();exports.DEBUG&&console.log(state.step,"JMPR[]",o),
// A jump by 1 would do nothing.
state.ip+=o-1}
// SCVTCI[] Set Control Value Table Cut-In
// 0x1D
,function(state){var n=state.stack.pop();exports.DEBUG&&console.log(state.step,"SCVTCI[]",n),state.cvCutIn=n/64}
// DUP[] DUPlicate top stack element
// 0x20
,
/* 0x1E */void 0,// TODO SSWCI
/* 0x1F */void 0,function(state){var stack=state.stack;exports.DEBUG&&console.log(state.step,"DUP[]"),stack.push(stack[stack.length-1])},
/* 0x21 */POP,function(state){exports.DEBUG&&console.log(state.step,"CLEAR[]"),state.stack.length=0}
// SWAP[] SWAP the top two elements on the stack
// 0x23
,function(state){var stack=state.stack,a=stack.pop(),b=stack.pop();exports.DEBUG&&console.log(state.step,"SWAP[]"),stack.push(a),stack.push(b)}
// DEPTH[] DEPTH of the stack
// 0x24
,function(state){var stack=state.stack;exports.DEBUG&&console.log(state.step,"DEPTH[]"),stack.push(stack.length)}
// LOOPCALL[] LOOPCALL function
// 0x2A
,
// CINDEX[] Copy the INDEXed element to the top of the stack
// 0x25
function(state){var stack=state.stack,k=stack.pop();exports.DEBUG&&console.log(state.step,"CINDEX[]",k),
// In case of k == 1, it copies the last element after popping
// thus stack.length - k.
stack.push(stack[stack.length-k])}
// MINDEX[] Move the INDEXed element to the top of the stack
// 0x26
,function(state){var stack=state.stack,k=stack.pop();exports.DEBUG&&console.log(state.step,"MINDEX[]",k),stack.push(stack.splice(stack.length-k,1)[0])}
// FDEF[] Function DEFinition
// 0x2C
,
/* 0x27 */void 0,// TODO ALIGNPTS
/* 0x28 */void 0,
/* 0x29 */void 0,function(state){var stack=state.stack,fn=stack.pop(),c=stack.pop();exports.DEBUG&&console.log(state.step,"LOOPCALL[]",fn,c);
// saves callers program
var cip=state.ip,cprog=state.prog;state.prog=state.funcs[fn];
// executes the function
for(var i=0;i<c;i++)exec(state),exports.DEBUG&&console.log(++state.step,i+1<c?"next loopcall":"done loopcall",i);
// restores the callers program
state.ip=cip,state.prog=cprog}
// CALL[] CALL function
// 0x2B
,function(state){var fn=state.stack.pop();exports.DEBUG&&console.log(state.step,"CALL[]",fn);
// saves callers program
var cip=state.ip,cprog=state.prog;state.prog=state.funcs[fn],
// executes the function
exec(state),
// restores the callers program
state.ip=cip,state.prog=cprog,exports.DEBUG&&console.log(++state.step,"returning from",fn)},function(state){if("fpgm"!==state.env)throw new Error("FDEF not allowed here");var stack=state.stack,prog=state.prog,ip=state.ip,fn=stack.pop(),ipBegin=ip;for(exports.DEBUG&&console.log(state.step,"FDEF[]",fn);45!==prog[++ip];);state.ip=ip,state.funcs[fn]=prog.slice(ipBegin+1,ip)},
/* 0x2D */void 0,// ENDF (eaten by FDEF)
/* 0x2E */MDAP.bind(void 0,0),
/* 0x2F */MDAP.bind(void 0,1),
/* 0x30 */IUP.bind(void 0,yUnitVector),
/* 0x31 */IUP.bind(void 0,xUnitVector),
/* 0x32 */SHP.bind(void 0,0),
/* 0x33 */SHP.bind(void 0,1),
/* 0x34 */SHC.bind(void 0,0),
/* 0x35 */SHC.bind(void 0,1),
/* 0x36 */SHZ.bind(void 0,0),
/* 0x37 */SHZ.bind(void 0,1),function(state){for(var stack=state.stack,loop=state.loop,fv=state.fv,d=stack.pop()/64,z2=state.z2;loop--;){var pi=stack.pop(),p=z2[pi];exports.DEBUG&&console.log(state.step,(state.loop>1?"loop "+(state.loop-loop)+": ":"")+"SHPIX[]",pi,d),fv.setRelative(p,p,d),fv.touch(p)}state.loop=1}
// IP[] Interpolate Point
// 0x39
,function(state){for(var stack=state.stack,rp1i=state.rp1,rp2i=state.rp2,loop=state.loop,rp1=state.z0[rp1i],rp2=state.z1[rp2i],fv=state.fv,pv=state.dpv,z2=state.z2;loop--;){var pi=stack.pop(),p=z2[pi];exports.DEBUG&&console.log(state.step,(state.loop>1?"loop "+(state.loop-loop)+": ":"")+"IP[]",pi,rp1i,"<->",rp2i),fv.interpolate(p,rp1,rp2,pv),fv.touch(p)}state.loop=1},
/* 0x3A */MSIRP.bind(void 0,0),
/* 0x3B */MSIRP.bind(void 0,1),function(state){for(var stack=state.stack,rp0i=state.rp0,rp0=state.z0[rp0i],loop=state.loop,fv=state.fv,pv=state.pv,z1=state.z1;loop--;){var pi=stack.pop(),p=z1[pi];exports.DEBUG&&console.log(state.step,(state.loop>1?"loop "+(state.loop-loop)+": ":"")+"ALIGNRP[]",pi),fv.setRelative(p,rp0,0,pv),fv.touch(p)}state.loop=1}
// RTG[] Round To Double Grid
// 0x3D
,function(state){exports.DEBUG&&console.log(state.step,"RTDG[]"),state.round=roundToDoubleGrid},
/* 0x3E */MIAP.bind(void 0,0),
/* 0x3F */MIAP.bind(void 0,1),function(state){var prog=state.prog,ip=state.ip,stack=state.stack,n=prog[++ip];exports.DEBUG&&console.log(state.step,"NPUSHB[]",n);for(var i=0;i<n;i++)stack.push(prog[++ip]);state.ip=ip}
// NPUSHW[] PUSH N Words
// 0x41
,function(state){var ip=state.ip,prog=state.prog,stack=state.stack,n=prog[++ip];exports.DEBUG&&console.log(state.step,"NPUSHW[]",n);for(var i=0;i<n;i++){var w=prog[++ip]<<8|prog[++ip];32768&w&&(w=-(1+(65535^w))),stack.push(w)}state.ip=ip}
// WS[] Write Store
// 0x42
,function(state){var stack=state.stack,store=state.store;store||(store=state.store=[]);var v=stack.pop(),l=stack.pop();exports.DEBUG&&console.log(state.step,"WS",v,l),store[l]=v}
// RS[] Read Store
// 0x43
,function(state){var stack=state.stack,store=state.store,l=stack.pop();exports.DEBUG&&console.log(state.step,"RS",l);var v=store&&store[l]||0;stack.push(v)}
// WCVTP[] Write Control Value Table in Pixel units
// 0x44
,function(state){var stack=state.stack,v=stack.pop(),l=stack.pop();exports.DEBUG&&console.log(state.step,"WCVTP",v,l),state.cvt[l]=v/64}
// RCVT[] Read Control Value Table entry
// 0x45
,function(state){var stack=state.stack,cvte=stack.pop();exports.DEBUG&&console.log(state.step,"RCVT",cvte),stack.push(64*state.cvt[cvte])},
/* 0x46 */GC.bind(void 0,0),
/* 0x47 */GC.bind(void 0,1),
/* 0x48 */void 0,// TODO SCFS
/* 0x49 */MD.bind(void 0,0),
/* 0x4A */MD.bind(void 0,1),function(state){exports.DEBUG&&console.log(state.step,"MPPEM[]"),state.stack.push(state.ppem)}
// FLIPON[] set the auto FLIP Boolean to ON
// 0x4D
,
/* 0x4C */void 0,function(state){exports.DEBUG&&console.log(state.step,"FLIPON[]"),state.autoFlip=!0}
// LT[] Less Than
// 0x50
,
/* 0x4E */void 0,// TODO FLIPOFF
/* 0x4F */void 0,function(state){var stack=state.stack,e2=stack.pop(),e1=stack.pop();exports.DEBUG&&console.log(state.step,"LT[]",e2,e1),stack.push(e1<e2?1:0)}
// LTEQ[] Less Than or EQual
// 0x53
,function(state){var stack=state.stack,e2=stack.pop(),e1=stack.pop();exports.DEBUG&&console.log(state.step,"LTEQ[]",e2,e1),stack.push(e1<=e2?1:0)}
// GTEQ[] Greater Than
// 0x52
,function(state){var stack=state.stack,e2=stack.pop(),e1=stack.pop();exports.DEBUG&&console.log(state.step,"GT[]",e2,e1),stack.push(e1>e2?1:0)}
// GTEQ[] Greater Than or EQual
// 0x53
,function(state){var stack=state.stack,e2=stack.pop(),e1=stack.pop();exports.DEBUG&&console.log(state.step,"GTEQ[]",e2,e1),stack.push(e1>=e2?1:0)}
// EQ[] EQual
// 0x54
,function(state){var stack=state.stack,e2=stack.pop(),e1=stack.pop();exports.DEBUG&&console.log(state.step,"EQ[]",e2,e1),stack.push(e2===e1?1:0)}
// NEQ[] Not EQual
// 0x55
,function(state){var stack=state.stack,e2=stack.pop(),e1=stack.pop();exports.DEBUG&&console.log(state.step,"NEQ[]",e2,e1),stack.push(e2!==e1?1:0)}
// ODD[] ODD
// 0x56
,function(state){var stack=state.stack,n=stack.pop();exports.DEBUG&&console.log(state.step,"ODD[]",n),stack.push(Math.trunc(n)%2?1:0)}
// EVEN[] EVEN
// 0x57
,function(state){var stack=state.stack,n=stack.pop();exports.DEBUG&&console.log(state.step,"EVEN[]",n),stack.push(Math.trunc(n)%2?0:1)}
// IF[] IF test
// 0x58
,function(state){var test=state.stack.pop();exports.DEBUG&&console.log(state.step,"IF[]",test),
// if test is true it just continues
// if not the ip is skipped until matching ELSE or EIF
test||(skip(state,!0),exports.DEBUG&&console.log(state.step,"EIF[]"))}
// EIF[] End IF
// 0x59
,function(state){
// this can be reached normally when
// executing an else branch.
// -> just ignore it
exports.DEBUG&&console.log(state.step,"EIF[]")}
// AND[] logical AND
// 0x5A
,function(state){var stack=state.stack,e2=stack.pop(),e1=stack.pop();exports.DEBUG&&console.log(state.step,"AND[]",e2,e1),stack.push(e2&&e1?1:0)}
// OR[] logical OR
// 0x5B
,function(state){var stack=state.stack,e2=stack.pop(),e1=stack.pop();exports.DEBUG&&console.log(state.step,"OR[]",e2,e1),stack.push(e2||e1?1:0)}
// NOT[] logical NOT
// 0x5C
,function(state){var stack=state.stack,e=stack.pop();exports.DEBUG&&console.log(state.step,"NOT[]",e),stack.push(e?0:1)},
/* 0x5D */DELTAP123.bind(void 0,1),function(state){var n=state.stack.pop();exports.DEBUG&&console.log(state.step,"SDB[]",n),state.deltaBase=n}
// SDS[] Set Delta Shift in the graphics state
// 0x5F
,function(state){var n=state.stack.pop();exports.DEBUG&&console.log(state.step,"SDS[]",n),state.deltaShift=Math.pow(.5,n)}
// ADD[] ADD
// 0x60
,function(state){var stack=state.stack,n2=stack.pop(),n1=stack.pop();exports.DEBUG&&console.log(state.step,"ADD[]",n2,n1),stack.push(n1+n2)}
// SUB[] SUB
// 0x61
,function(state){var stack=state.stack,n2=stack.pop(),n1=stack.pop();exports.DEBUG&&console.log(state.step,"SUB[]",n2,n1),stack.push(n1-n2)}
// DIV[] DIV
// 0x62
,function(state){var stack=state.stack,n2=stack.pop(),n1=stack.pop();exports.DEBUG&&console.log(state.step,"DIV[]",n2,n1),stack.push(64*n1/n2)}
// MUL[] MUL
// 0x63
,function(state){var stack=state.stack,n2=stack.pop(),n1=stack.pop();exports.DEBUG&&console.log(state.step,"MUL[]",n2,n1),stack.push(n1*n2/64)}
// ABS[] ABSolute value
// 0x64
,function(state){var stack=state.stack,n=stack.pop();exports.DEBUG&&console.log(state.step,"ABS[]",n),stack.push(Math.abs(n))}
// NEG[] NEGate
// 0x65
,function(state){var stack=state.stack,n=stack.pop();exports.DEBUG&&console.log(state.step,"NEG[]",n),stack.push(-n)}
// FLOOR[] FLOOR
// 0x66
,function(state){var stack=state.stack,n=stack.pop();exports.DEBUG&&console.log(state.step,"FLOOR[]",n),stack.push(64*Math.floor(n/64))}
// CEILING[] CEILING
// 0x67
,function(state){var stack=state.stack,n=stack.pop();exports.DEBUG&&console.log(state.step,"CEILING[]",n),stack.push(64*Math.ceil(n/64))},
/* 0x68 */ROUND.bind(void 0,0),
/* 0x69 */ROUND.bind(void 0,1),
/* 0x6A */ROUND.bind(void 0,2),
/* 0x6B */ROUND.bind(void 0,3),
/* 0x6C */void 0,// TODO NROUND[ab]
/* 0x6D */void 0,// TODO NROUND[ab]
/* 0x6E */void 0,// TODO NROUND[ab]
/* 0x6F */void 0,function(state){var stack=state.stack,v=stack.pop(),l=stack.pop();exports.DEBUG&&console.log(state.step,"WCVTF[]",v,l),state.cvt[l]=v*state.ppem/state.font.unitsPerEm},
/* 0x71 */DELTAP123.bind(void 0,2),
/* 0x72 */DELTAP123.bind(void 0,3),
/* 0x73 */DELTAC123.bind(void 0,1),
/* 0x74 */DELTAC123.bind(void 0,2),
/* 0x75 */DELTAC123.bind(void 0,3),function(state){var period,n=state.stack.pop();switch(exports.DEBUG&&console.log(state.step,"SROUND[]",n),state.round=roundSuper,192&n){case 0:period=.5;break;case 64:period=1;break;case 128:period=2;break;default:throw new Error("invalid SROUND value")}switch(state.srPeriod=period,48&n){case 0:state.srPhase=0;break;case 16:state.srPhase=.25*period;break;case 32:state.srPhase=.5*period;break;case 48:state.srPhase=.75*period;break;default:throw new Error("invalid SROUND value")}n&=15,state.srThreshold=0===n?0:(n/8-.5)*period}
// S45ROUND[] Super ROUND 45 degrees
// 0x77
,function(state){var period,n=state.stack.pop();switch(exports.DEBUG&&console.log(state.step,"S45ROUND[]",n),state.round=roundSuper,192&n){case 0:period=Math.sqrt(2)/2;break;case 64:period=Math.sqrt(2);break;case 128:period=2*Math.sqrt(2);break;default:throw new Error("invalid S45ROUND value")}switch(state.srPeriod=period,48&n){case 0:state.srPhase=0;break;case 16:state.srPhase=.25*period;break;case 32:state.srPhase=.5*period;break;case 48:state.srPhase=.75*period;break;default:throw new Error("invalid S45ROUND value")}n&=15,state.srThreshold=0===n?0:(n/8-.5)*period}
// ROFF[] Round Off
// 0x7A
,
/* 0x78 */void 0,// TODO JROT[]
/* 0x79 */void 0,function(state){exports.DEBUG&&console.log(state.step,"ROFF[]"),state.round=roundOff}
// RUTG[] Round Up To Grid
// 0x7C
,
/* 0x7B */void 0,function(state){exports.DEBUG&&console.log(state.step,"RUTG[]"),state.round=roundUpToGrid}
// RDTG[] Round Down To Grid
// 0x7D
,function(state){exports.DEBUG&&console.log(state.step,"RDTG[]"),state.round=roundDownToGrid}
// SCANCTRL[] SCAN conversion ConTRoL
// 0x85
,
/* 0x7E */POP,// actually SANGW, supposed to do only a pop though
/* 0x7F */POP,// actually AA, supposed to do only a pop though
/* 0x80 */void 0,// TODO FLIPPT
/* 0x81 */void 0,// TODO FLIPRGON
/* 0x82 */void 0,// TODO FLIPRGOFF
/* 0x83 */void 0,
/* 0x84 */void 0,function(state){var n=state.stack.pop();
// ignored by opentype.js
exports.DEBUG&&console.log(state.step,"SCANCTRL[]",n)},
/* 0x86 */SDPVTL.bind(void 0,0),
/* 0x87 */SDPVTL.bind(void 0,1),function(state){var stack=state.stack,sel=stack.pop(),r=0;exports.DEBUG&&console.log(state.step,"GETINFO[]",sel),
// v35 as in no subpixel hinting
1&sel&&(r=35),
// TODO rotation and stretch currently not supported
// and thus those GETINFO are always 0.
// opentype.js is always gray scaling
32&sel&&(r|=4096),stack.push(r)}
// ROLL[] ROLL the top three stack elements
// 0x8A
,
/* 0x89 */void 0,function(state){var stack=state.stack,a=stack.pop(),b=stack.pop(),c=stack.pop();exports.DEBUG&&console.log(state.step,"ROLL[]"),stack.push(b),stack.push(a),stack.push(c)}
// MAX[] MAXimum of top two stack elements
// 0x8B
,function(state){var stack=state.stack,e2=stack.pop(),e1=stack.pop();exports.DEBUG&&console.log(state.step,"MAX[]",e2,e1),stack.push(Math.max(e1,e2))}
// MIN[] MINimum of top two stack elements
// 0x8C
,function(state){var stack=state.stack,e2=stack.pop(),e1=stack.pop();exports.DEBUG&&console.log(state.step,"MIN[]",e2,e1),stack.push(Math.min(e1,e2))}
// SCANTYPE[] SCANTYPE
// 0x8D
,function(state){var n=state.stack.pop();
// ignored by opentype.js
exports.DEBUG&&console.log(state.step,"SCANTYPE[]",n)}
// INSTCTRL[] INSTCTRL
// 0x8D
,function(state){var s=state.stack.pop(),v=state.stack.pop();switch(exports.DEBUG&&console.log(state.step,"INSTCTRL[]",s,v),s){case 1:return void(state.inhibitGridFit=!!v);case 2:return void(state.ignoreCvt=!!v);default:throw new Error("invalid INSTCTRL[] selector")}},
/* 0x8F */void 0,
/* 0x90 */void 0,
/* 0x91 */void 0,
/* 0x92 */void 0,
/* 0x93 */void 0,
/* 0x94 */void 0,
/* 0x95 */void 0,
/* 0x96 */void 0,
/* 0x97 */void 0,
/* 0x98 */void 0,
/* 0x99 */void 0,
/* 0x9A */void 0,
/* 0x9B */void 0,
/* 0x9C */void 0,
/* 0x9D */void 0,
/* 0x9E */void 0,
/* 0x9F */void 0,
/* 0xA0 */void 0,
/* 0xA1 */void 0,
/* 0xA2 */void 0,
/* 0xA3 */void 0,
/* 0xA4 */void 0,
/* 0xA5 */void 0,
/* 0xA6 */void 0,
/* 0xA7 */void 0,
/* 0xA8 */void 0,
/* 0xA9 */void 0,
/* 0xAA */void 0,
/* 0xAB */void 0,
/* 0xAC */void 0,
/* 0xAD */void 0,
/* 0xAE */void 0,
/* 0xAF */void 0,
/* 0xB0 */PUSHB.bind(void 0,1),
/* 0xB1 */PUSHB.bind(void 0,2),
/* 0xB2 */PUSHB.bind(void 0,3),
/* 0xB3 */PUSHB.bind(void 0,4),
/* 0xB4 */PUSHB.bind(void 0,5),
/* 0xB5 */PUSHB.bind(void 0,6),
/* 0xB6 */PUSHB.bind(void 0,7),
/* 0xB7 */PUSHB.bind(void 0,8),
/* 0xB8 */PUSHW.bind(void 0,1),
/* 0xB9 */PUSHW.bind(void 0,2),
/* 0xBA */PUSHW.bind(void 0,3),
/* 0xBB */PUSHW.bind(void 0,4),
/* 0xBC */PUSHW.bind(void 0,5),
/* 0xBD */PUSHW.bind(void 0,6),
/* 0xBE */PUSHW.bind(void 0,7),
/* 0xBF */PUSHW.bind(void 0,8),
/* 0xC0 */MDRP_MIRP.bind(void 0,0,0,0,0,0),
/* 0xC1 */MDRP_MIRP.bind(void 0,0,0,0,0,1),
/* 0xC2 */MDRP_MIRP.bind(void 0,0,0,0,0,2),
/* 0xC3 */MDRP_MIRP.bind(void 0,0,0,0,0,3),
/* 0xC4 */MDRP_MIRP.bind(void 0,0,0,0,1,0),
/* 0xC5 */MDRP_MIRP.bind(void 0,0,0,0,1,1),
/* 0xC6 */MDRP_MIRP.bind(void 0,0,0,0,1,2),
/* 0xC7 */MDRP_MIRP.bind(void 0,0,0,0,1,3),
/* 0xC8 */MDRP_MIRP.bind(void 0,0,0,1,0,0),
/* 0xC9 */MDRP_MIRP.bind(void 0,0,0,1,0,1),
/* 0xCA */MDRP_MIRP.bind(void 0,0,0,1,0,2),
/* 0xCB */MDRP_MIRP.bind(void 0,0,0,1,0,3),
/* 0xCC */MDRP_MIRP.bind(void 0,0,0,1,1,0),
/* 0xCD */MDRP_MIRP.bind(void 0,0,0,1,1,1),
/* 0xCE */MDRP_MIRP.bind(void 0,0,0,1,1,2),
/* 0xCF */MDRP_MIRP.bind(void 0,0,0,1,1,3),
/* 0xD0 */MDRP_MIRP.bind(void 0,0,1,0,0,0),
/* 0xD1 */MDRP_MIRP.bind(void 0,0,1,0,0,1),
/* 0xD2 */MDRP_MIRP.bind(void 0,0,1,0,0,2),
/* 0xD3 */MDRP_MIRP.bind(void 0,0,1,0,0,3),
/* 0xD4 */MDRP_MIRP.bind(void 0,0,1,0,1,0),
/* 0xD5 */MDRP_MIRP.bind(void 0,0,1,0,1,1),
/* 0xD6 */MDRP_MIRP.bind(void 0,0,1,0,1,2),
/* 0xD7 */MDRP_MIRP.bind(void 0,0,1,0,1,3),
/* 0xD8 */MDRP_MIRP.bind(void 0,0,1,1,0,0),
/* 0xD9 */MDRP_MIRP.bind(void 0,0,1,1,0,1),
/* 0xDA */MDRP_MIRP.bind(void 0,0,1,1,0,2),
/* 0xDB */MDRP_MIRP.bind(void 0,0,1,1,0,3),
/* 0xDC */MDRP_MIRP.bind(void 0,0,1,1,1,0),
/* 0xDD */MDRP_MIRP.bind(void 0,0,1,1,1,1),
/* 0xDE */MDRP_MIRP.bind(void 0,0,1,1,1,2),
/* 0xDF */MDRP_MIRP.bind(void 0,0,1,1,1,3),
/* 0xE0 */MDRP_MIRP.bind(void 0,1,0,0,0,0),
/* 0xE1 */MDRP_MIRP.bind(void 0,1,0,0,0,1),
/* 0xE2 */MDRP_MIRP.bind(void 0,1,0,0,0,2),
/* 0xE3 */MDRP_MIRP.bind(void 0,1,0,0,0,3),
/* 0xE4 */MDRP_MIRP.bind(void 0,1,0,0,1,0),
/* 0xE5 */MDRP_MIRP.bind(void 0,1,0,0,1,1),
/* 0xE6 */MDRP_MIRP.bind(void 0,1,0,0,1,2),
/* 0xE7 */MDRP_MIRP.bind(void 0,1,0,0,1,3),
/* 0xE8 */MDRP_MIRP.bind(void 0,1,0,1,0,0),
/* 0xE9 */MDRP_MIRP.bind(void 0,1,0,1,0,1),
/* 0xEA */MDRP_MIRP.bind(void 0,1,0,1,0,2),
/* 0xEB */MDRP_MIRP.bind(void 0,1,0,1,0,3),
/* 0xEC */MDRP_MIRP.bind(void 0,1,0,1,1,0),
/* 0xED */MDRP_MIRP.bind(void 0,1,0,1,1,1),
/* 0xEE */MDRP_MIRP.bind(void 0,1,0,1,1,2),
/* 0xEF */MDRP_MIRP.bind(void 0,1,0,1,1,3),
/* 0xF0 */MDRP_MIRP.bind(void 0,1,1,0,0,0),
/* 0xF1 */MDRP_MIRP.bind(void 0,1,1,0,0,1),
/* 0xF2 */MDRP_MIRP.bind(void 0,1,1,0,0,2),
/* 0xF3 */MDRP_MIRP.bind(void 0,1,1,0,0,3),
/* 0xF4 */MDRP_MIRP.bind(void 0,1,1,0,1,0),
/* 0xF5 */MDRP_MIRP.bind(void 0,1,1,0,1,1),
/* 0xF6 */MDRP_MIRP.bind(void 0,1,1,0,1,2),
/* 0xF7 */MDRP_MIRP.bind(void 0,1,1,0,1,3),
/* 0xF8 */MDRP_MIRP.bind(void 0,1,1,1,0,0),
/* 0xF9 */MDRP_MIRP.bind(void 0,1,1,1,0,1),
/* 0xFA */MDRP_MIRP.bind(void 0,1,1,1,0,2),
/* 0xFB */MDRP_MIRP.bind(void 0,1,1,1,0,3),
/* 0xFC */MDRP_MIRP.bind(void 0,1,1,1,1,0),
/* 0xFD */MDRP_MIRP.bind(void 0,1,1,1,1,1),
/* 0xFE */MDRP_MIRP.bind(void 0,1,1,1,1,2),
/* 0xFF */MDRP_MIRP.bind(void 0,1,1,1,1,3)],Token.prototype.setState=function(key,value){return this.state[key]=value,this.activeState={key,value:this.state[key]},this.activeState},Token.prototype.getState=function(stateId){return this.state[stateId]||null},
/**
 * Checks if an index exists in the tokens list.
 * @param {number} index token index
 */
Tokenizer.prototype.inboundIndex=function(index){return index>=0&&index<this.tokens.length},
/**
 * Compose and apply a list of operations (replace, update, delete)
 * @param {array} RUDs replace, update and delete operations
 * TODO: Perf. Optimization (lengthBefore === lengthAfter ? dispatch once)
 */
Tokenizer.prototype.composeRUD=function(RUDs){var this$1=this,state=RUDs.map(function(RUD){return this$1[RUD[0]].apply(this$1,RUD.slice(1).concat(true))}),hasFAILObject=function(obj){return"object"==typeof obj&&obj.hasOwnProperty("FAIL")};if(state.every(hasFAILObject))return{FAIL:"composeRUD: one or more operations hasn't completed successfully",report:state.filter(hasFAILObject)};this.dispatch("composeRUD",[state.filter(function(op){return!hasFAILObject(op)})])},
/**
 * Replace a range of tokens with a list of tokens
 * @param {number} startIndex range start index
 * @param {number} offset range offset
 * @param {token} tokens a list of tokens to replace
 * @param {boolean} silent dispatch events and update context ranges
 */
Tokenizer.prototype.replaceRange=function(startIndex,offset,tokens,silent){offset=null!==offset?offset:this.tokens.length;var isTokenType=tokens.every(function(token){return token instanceof Token});if(!isNaN(startIndex)&&this.inboundIndex(startIndex)&&isTokenType){var replaced=this.tokens.splice.apply(this.tokens,[startIndex,offset].concat(tokens));return silent||this.dispatch("replaceToken",[startIndex,offset,tokens]),[replaced,tokens]}return{FAIL:"replaceRange: invalid tokens or startIndex."}},
/**
 * Replace a token with another token
 * @param {number} index token index
 * @param {token} token a token to replace
 * @param {boolean} silent dispatch events and update context ranges
 */
Tokenizer.prototype.replaceToken=function(index,token,silent){if(!isNaN(index)&&this.inboundIndex(index)&&token instanceof Token){var replaced=this.tokens.splice(index,1,token);return silent||this.dispatch("replaceToken",[index,token]),[replaced[0],token]}return{FAIL:"replaceToken: invalid token or index."}},
/**
 * Removes a range of tokens
 * @param {number} startIndex range start index
 * @param {number} offset range offset
 * @param {boolean} silent dispatch events and update context ranges
 */
Tokenizer.prototype.removeRange=function(startIndex,offset,silent){offset=isNaN(offset)?this.tokens.length:offset;var tokens=this.tokens.splice(startIndex,offset);return silent||this.dispatch("removeRange",[tokens,startIndex,offset]),tokens},
/**
 * Remove a token at a certain index
 * @param {number} index token index
 * @param {boolean} silent dispatch events and update context ranges
 */
Tokenizer.prototype.removeToken=function(index,silent){if(!isNaN(index)&&this.inboundIndex(index)){var token=this.tokens.splice(index,1);return silent||this.dispatch("removeToken",[token,index]),token}return{FAIL:"removeToken: invalid token index."}},
/**
 * Insert a list of tokens at a certain index
 * @param {array} tokens a list of tokens to insert
 * @param {number} index insert the list of tokens at index
 * @param {boolean} silent dispatch events and update context ranges
 */
Tokenizer.prototype.insertToken=function(tokens,index,silent){return tokens.every(function(token){return token instanceof Token})?(this.tokens.splice.apply(this.tokens,[index,0].concat(tokens)),silent||this.dispatch("insertToken",[tokens,index]),tokens):{FAIL:"insertToken: invalid token(s)."}},
/**
 * A state modifier that is called on 'newToken' event
 * @param {string} modifierId state modifier id
 * @param {function} condition a predicate function that returns true or false
 * @param {function} modifier a function to update token state
 */
Tokenizer.prototype.registerModifier=function(modifierId,condition,modifier){this.events.newToken.subscribe(function(token,contextParams){var conditionParams=[token,contextParams],modifierParams=[token,contextParams];if(null===condition||!0===condition.apply(this,conditionParams)){var newStateValue=modifier.apply(this,modifierParams);token.setState(modifierId,newStateValue)}}),this.registeredModifiers.push(modifierId)},
/**
 * Subscribe a handler to an event
 * @param {function} eventHandler an event handler function
 */
Event.prototype.subscribe=function(eventHandler){return"function"==typeof eventHandler?this.subscribers.push(eventHandler)-1:{FAIL:"invalid '"+this.eventId+"' event handler"}},
/**
 * Unsubscribe an event handler
 * @param {string} subsId subscription id
 */
Event.prototype.unsubscribe=function(subsId){this.subscribers.splice(subsId,1)},
/**
 * Sets context params current value index
 * @param {number} index context params current value index
 */
ContextParams.prototype.setCurrentIndex=function(index){this.index=index,this.current=this.context[index],this.backtrack=this.context.slice(0,index),this.lookahead=this.context.slice(index+1)},
/**
 * Get an item at an offset from the current value
 * example (current value is 3):
 *  1    2   [3]   4    5   |   items values
 * -2   -1    0    1    2   |   offset values
 * @param {number} offset an offset from current value index
 */
ContextParams.prototype.get=function(offset){switch(!0){case 0===offset:return this.current;case offset<0&&Math.abs(offset)<=this.backtrack.length:return this.backtrack.slice(offset)[0];case offset>0&&offset<=this.lookahead.length:return this.lookahead[offset-1];default:return null}},
/**
 * Converts a context range into a string value
 * @param {contextRange} range a context range
 */
Tokenizer.prototype.rangeToText=function(range){if(range instanceof ContextRange)return this.getRangeTokens(range).map(function(token){return token.char}).join("")},
/**
 * Converts all tokens into a string
 */
Tokenizer.prototype.getText=function(){return this.tokens.map(function(token){return token.char}).join("")},
/**
 * Get a context by name
 * @param {string} contextName context name to get
 */
Tokenizer.prototype.getContext=function(contextName){var context=this.registeredContexts[contextName];return context||null},
/**
 * Subscribes a new event handler to an event
 * @param {string} eventName event name to subscribe to
 * @param {function} eventHandler a function to be invoked on event
 */
Tokenizer.prototype.on=function(eventName,eventHandler){var event=this.events[eventName];return event?event.subscribe(eventHandler):null},
/**
 * Dispatches an event
 * @param {string} eventName event name
 * @param {any} args event handler arguments
 */
Tokenizer.prototype.dispatch=function(eventName,args){var this$1=this,event=this.events[eventName];event instanceof Event&&event.subscribers.forEach(function(subscriber){subscriber.apply(this$1,args||[])})},
/**
 * Register a new context checker
 * @param {string} contextName a unique context name
 * @param {function} contextStartCheck a predicate function that returns true on context start
 * @param {function} contextEndCheck  a predicate function that returns true on context end
 * TODO: call tokenize on registration to update context ranges with the new context.
 */
Tokenizer.prototype.registerContextChecker=function(contextName,contextStartCheck,contextEndCheck){if(this.getContext(contextName))return{FAIL:"context name '"+contextName+"' is already registered."};if("function"!=typeof contextStartCheck)return{FAIL:"missing context start check."};if("function"!=typeof contextEndCheck)return{FAIL:"missing context end check."};var contextCheckers=new ContextChecker(contextName,contextStartCheck,contextEndCheck);return this.registeredContexts[contextName]=contextCheckers,this.contextCheckers.push(contextCheckers),contextCheckers},
/**
 * Gets a context range tokens
 * @param {contextRange} range a context range
 */
Tokenizer.prototype.getRangeTokens=function(range){var endIndex=range.startIndex+range.endOffset;return[].concat(this.tokens.slice(range.startIndex,endIndex))},
/**
 * Gets the ranges of a context
 * @param {string} contextName context name
 */
Tokenizer.prototype.getContextRanges=function(contextName){var context=this.getContext(contextName);return context?context.ranges:{FAIL:"context checker '"+contextName+"' is not registered."}},
/**
 * Resets context ranges to run context update
 */
Tokenizer.prototype.resetContextsRanges=function(){var registeredContexts=this.registeredContexts;for(var contextName in registeredContexts){if(registeredContexts.hasOwnProperty(contextName))registeredContexts[contextName].ranges=[]}},
/**
 * Updates context ranges
 */
Tokenizer.prototype.updateContextsRanges=function(){this.resetContextsRanges();for(var chars=this.tokens.map(function(token){return token.char}),i=0;i<chars.length;i++){var contextParams=new ContextParams(chars,i);this.runContextCheck(contextParams)}this.dispatch("updateContextsRanges",[this.registeredContexts])},
/**
 * Sets the end offset of an open range
 * @param {number} offset range end offset
 * @param {string} contextName context name
 */
Tokenizer.prototype.setEndOffset=function(offset,contextName){var range=new ContextRange(this.getContext(contextName).openRange.startIndex,offset,contextName),ranges=this.getContext(contextName).ranges;return range.rangeId=contextName+"."+ranges.length,ranges.push(range),this.getContext(contextName).openRange=null,range},
/**
 * Runs a context check on the current context
 * @param {contextParams} contextParams current context params
 */
Tokenizer.prototype.runContextCheck=function(contextParams){var this$1=this,index=contextParams.index;this.contextCheckers.forEach(function(contextChecker){var contextName=contextChecker.contextName,openRange=this$1.getContext(contextName).openRange;if(!openRange&&contextChecker.checkStart(contextParams)&&(openRange=new ContextRange(index,null,contextName),this$1.getContext(contextName).openRange=openRange,this$1.dispatch("contextStart",[contextName,index])),openRange&&contextChecker.checkEnd(contextParams)){var offset=index-openRange.startIndex+1,range=this$1.setEndOffset(offset,contextName);this$1.dispatch("contextEnd",[contextName,range])}})},
/**
 * Converts a text into a list of tokens
 * @param {string} text a text to tokenize
 */
Tokenizer.prototype.tokenize=function(text){this.tokens=[],this.resetContextsRanges();var chars=Array.from(text);this.dispatch("start");for(var i=0;i<chars.length;i++){var char=chars[i],contextParams=new ContextParams(chars,i);this.dispatch("next",[contextParams]),this.runContextCheck(contextParams);var token=new Token(char);this.tokens.push(token),this.dispatch("newToken",[token,contextParams])}return this.dispatch("end",[this.tokens]),this.tokens},FeatureQuery.prototype.getDefaultScriptFeaturesIndexes=function(){for(var scripts=this.font.tables.gsub.scripts,s=0;s<scripts.length;s++){var script=scripts[s];if("DFLT"===script.tag)return script.script.defaultLangSys.featureIndexes}return[]},
/**
 * Get feature indexes of a specific script
 * @param {string} scriptTag script tag
 */
FeatureQuery.prototype.getScriptFeaturesIndexes=function(scriptTag){if(!this.font.tables.gsub)return[];if(!scriptTag)return this.getDefaultScriptFeaturesIndexes();for(var scripts=this.font.tables.gsub.scripts,i=0;i<scripts.length;i++){var script=scripts[i];if(script.tag===scriptTag&&script.script.defaultLangSys)return script.script.defaultLangSys.featureIndexes;var langSysRecords=script.langSysRecords;if(langSysRecords)for(var j=0;j<langSysRecords.length;j++){var langSysRecord=langSysRecords[j];if(langSysRecord.tag===scriptTag)return langSysRecord.langSys.featureIndexes}}return this.getDefaultScriptFeaturesIndexes()},
/**
 * Map a feature tag to a gsub feature
 * @param {any} features gsub features
 * @param {string} scriptTag script tag
 */
FeatureQuery.prototype.mapTagsToFeatures=function(features,scriptTag){for(var tags={},i=0;i<features.length;i++){var tag=features[i].tag,feature=features[i].feature;tags[tag]=feature}this.features[scriptTag].tags=tags},
/**
 * Get features of a specific script
 * @param {string} scriptTag script tag
 */
FeatureQuery.prototype.getScriptFeatures=function(scriptTag){var features=this.features[scriptTag];if(this.features.hasOwnProperty(scriptTag))return features;var featuresIndexes=this.getScriptFeaturesIndexes(scriptTag);if(!featuresIndexes)return null;var gsub=this.font.tables.gsub;return features=featuresIndexes.map(function(index){return gsub.features[index]}),this.features[scriptTag]=features,this.mapTagsToFeatures(features,scriptTag),features},
/**
 * Get substitution type
 * @param {any} lookupTable lookup table
 * @param {any} subtable subtable
 */
FeatureQuery.prototype.getSubstitutionType=function(lookupTable,subtable){return lookupTable.lookupType.toString()+subtable.substFormat.toString()},
/**
 * Get lookup method
 * @param {any} lookupTable lookup table
 * @param {any} subtable subtable
 */
FeatureQuery.prototype.getLookupMethod=function(lookupTable,subtable){var this$1=this;switch(this.getSubstitutionType(lookupTable,subtable)){case"11":return function(glyphIndex){return singleSubstitutionFormat1.apply(this$1,[glyphIndex,subtable])};case"12":return function(glyphIndex){return singleSubstitutionFormat2.apply(this$1,[glyphIndex,subtable])};case"63":return function(contextParams){return chainingSubstitutionFormat3.apply(this$1,[contextParams,subtable])};case"41":return function(contextParams){return ligatureSubstitutionFormat1.apply(this$1,[contextParams,subtable])};case"21":return function(glyphIndex){return decompositionSubstitutionFormat1.apply(this$1,[glyphIndex,subtable])};default:throw new Error("lookupType: "+lookupTable.lookupType+" - substFormat: "+subtable.substFormat+" is not yet supported")}},
/**
 * [ LOOKUP TYPES ]
 * -------------------------------
 * Single                        1;
 * Multiple                      2;
 * Alternate                     3;
 * Ligature                      4;
 * Context                       5;
 * ChainingContext               6;
 * ExtensionSubstitution         7;
 * ReverseChainingContext        8;
 * -------------------------------
 *
 */
/**
 * @typedef FQuery
 * @type Object
 * @param {string} tag feature tag
 * @param {string} script feature script
 * @param {ContextParams} contextParams context params
 */
/**
 * Lookup a feature using a query parameters
 * @param {FQuery} query feature query
 */
FeatureQuery.prototype.lookupFeature=function(query){var contextParams=query.contextParams,currentIndex=contextParams.index,feature=this.getFeature({tag:query.tag,script:query.script});if(!feature)return new Error("font '"+this.font.names.fullName.en+"' doesn't support feature '"+query.tag+"' for script '"+query.script+"'.");for(var lookups=this.getFeatureLookups(feature),substitutions=[].concat(contextParams.context),l=0;l<lookups.length;l++)for(var lookupTable=lookups[l],subtables=this.getLookupSubtables(lookupTable),s=0;s<subtables.length;s++){var subtable=subtables[s],substType=this.getSubstitutionType(lookupTable,subtable),lookup=this.getLookupMethod(lookupTable,subtable),substitution=void 0;switch(substType){case"11":(substitution=lookup(contextParams.current))&&substitutions.splice(currentIndex,1,new SubstitutionAction({id:11,tag:query.tag,substitution}));break;case"12":(substitution=lookup(contextParams.current))&&substitutions.splice(currentIndex,1,new SubstitutionAction({id:12,tag:query.tag,substitution}));break;case"63":substitution=lookup(contextParams),Array.isArray(substitution)&&substitution.length&&substitutions.splice(currentIndex,1,new SubstitutionAction({id:63,tag:query.tag,substitution}));break;case"41":(substitution=lookup(contextParams))&&substitutions.splice(currentIndex,1,new SubstitutionAction({id:41,tag:query.tag,substitution}));break;case"21":(substitution=lookup(contextParams.current))&&substitutions.splice(currentIndex,1,new SubstitutionAction({id:21,tag:query.tag,substitution}))}contextParams=new ContextParams(substitutions,currentIndex),Array.isArray(substitution)&&!substitution.length||(substitution=null)}return substitutions.length?substitutions:null},
/**
 * Checks if a font supports a specific features
 * @param {FQuery} query feature query object
 */
FeatureQuery.prototype.supports=function(query){if(!query.script)return!1;this.getScriptFeatures(query.script);var supportedScript=this.features.hasOwnProperty(query.script);if(!query.tag)return supportedScript;var supportedFeature=this.features[query.script].some(function(feature){return feature.tag===query.tag});return supportedScript&&supportedFeature},
/**
 * Get lookup table subtables
 * @param {any} lookupTable lookup table
 */
FeatureQuery.prototype.getLookupSubtables=function(lookupTable){return lookupTable.subtables||null},
/**
 * Get lookup table by index
 * @param {number} index lookup table index
 */
FeatureQuery.prototype.getLookupByIndex=function(index){return this.font.tables.gsub.lookups[index]||null},
/**
 * Get lookup tables for a feature
 * @param {string} feature
 */
FeatureQuery.prototype.getFeatureLookups=function(feature){
// TODO: memoize
return feature.lookupListIndexes.map(this.getLookupByIndex.bind(this))},
/**
 * Query a feature by it's properties
 * @param {any} query an object that describes the properties of a query
 */
FeatureQuery.prototype.getFeature=function(query){if(!this.font)return{FAIL:"No font was found"};this.features.hasOwnProperty(query.script)||this.getScriptFeatures(query.script);var scriptFeatures=this.features[query.script];return scriptFeatures?scriptFeatures.tags[query.tag]?this.features[query.script].tags[query.tag]:null:{FAIL:"No feature for script "+query.script}};var arabicWordCheck={startCheck:
/**
 * Arabic word context checkers
 */
function(contextParams){var char=contextParams.current,prevChar=contextParams.get(-1);
// ? arabic first char
return null===prevChar&&isArabicChar(char)||
// ? arabic char preceded with a non arabic char
!isArabicChar(prevChar)&&isArabicChar(char)},endCheck:function(contextParams){var nextChar=contextParams.get(1);
// ? last arabic char
return null===nextChar||
// ? next char is not arabic
!isArabicChar(nextChar)}};
/**
 * Arabic sentence context checkers
 */var arabicSentenceCheck={startCheck:function(contextParams){var char=contextParams.current,prevChar=contextParams.get(-1);
// ? an arabic char preceded with a non arabic char
return(isArabicChar(char)||isTashkeelArabicChar(char))&&!isArabicChar(prevChar)},endCheck:function(contextParams){var nextChar=contextParams.get(1);switch(!0){case null===nextChar:return!0;case!isArabicChar(nextChar)&&!isTashkeelArabicChar(nextChar):var nextIsWhitespace=/\s/.test(nextChar);if(!nextIsWhitespace)return!0;if(nextIsWhitespace){var arabicCharAhead;if(arabicCharAhead=contextParams.lookahead.some(function(c){return isArabicChar(c)||isTashkeelArabicChar(c)}),!arabicCharAhead)return!0}break;default:return!1}}};
/**
 * Apply single substitution format 1
 * @param {Array} substitutions substitutions
 * @param {any} tokens a list of tokens
 * @param {number} index token index
 */
/**
 * Supported substitutions
 */
var SUBSTITUTIONS={11:function(action,tokens,index){tokens[index].setState(action.tag,action.substitution)}
/**
 * Apply single substitution format 2
 * @param {Array} substitutions substitutions
 * @param {any} tokens a list of tokens
 * @param {number} index token index
 */,12:function(action,tokens,index){tokens[index].setState(action.tag,action.substitution)}
/**
 * Apply chaining context substitution format 3
 * @param {Array} substitutions substitutions
 * @param {any} tokens a list of tokens
 * @param {number} index token index
 */,63:function(action,tokens,index){action.substitution.forEach(function(subst,offset){tokens[index+offset].setState(action.tag,subst)})}
/**
 * Apply ligature substitution format 1
 * @param {Array} substitutions substitutions
 * @param {any} tokens a list of tokens
 * @param {number} index token index
 */,41:function(action,tokens,index){var token=tokens[index];token.setState(action.tag,action.substitution.ligGlyph);for(var compsCount=action.substitution.components.length,i=0;i<compsCount;i++)(token=tokens[index+i+1]).setState("deleted",!0)}};
/**
 * Apply substitutions to a list of tokens
 * @param {Array} substitutions substitutions
 * @param {any} tokens a list of tokens
 * @param {number} index token index
 */function applySubstitution(action,tokens,index){action instanceof SubstitutionAction&&SUBSTITUTIONS[action.id]&&SUBSTITUTIONS[action.id](action,tokens,index)}
/**
 * Apply Arabic presentation forms to a range of tokens
 */
/**
 * Check if a char can be connected to it's preceding char
 * @param {ContextParams} charContextParams context params of a char
 */
/**
 * Apply arabic presentation forms to a list of tokens
 * @param {ContextRange} range a range of tokens
 */
function arabicPresentationForms(range){var this$1=this,tags=this.featuresTags.arab,tokens=this.tokenizer.getRangeTokens(range);if(1!==tokens.length){var contextParams=new ContextParams(tokens.map(function(token){return token.getState("glyphIndex")}),0),charContextParams=new ContextParams(tokens.map(function(token){return token.char}),0);tokens.forEach(function(token,index){if(!isTashkeelArabicChar(token.char)){contextParams.setCurrentIndex(index),charContextParams.setCurrentIndex(index);var tag,CONNECT=0;// 2 bits 00 (10: can connect next) (01: can connect prev)
switch(function(charContextParams){for(var backtrack=[].concat(charContextParams.backtrack),i=backtrack.length-1;i>=0;i--){var prevChar=backtrack[i],isolated=isIsolatedArabicChar(prevChar),tashkeel=isTashkeelArabicChar(prevChar);if(!isolated&&!tashkeel)return!0;if(isolated)return!1}return!1}
/**
 * Check if a char can be connected to it's proceeding char
 * @param {ContextParams} charContextParams context params of a char
 */(charContextParams)&&(CONNECT|=1),function(charContextParams){if(isIsolatedArabicChar(charContextParams.current))return!1;for(var i=0;i<charContextParams.lookahead.length;i++)if(!isTashkeelArabicChar(charContextParams.lookahead[i]))return!0;return!1}(charContextParams)&&(CONNECT|=2),CONNECT){case 1:tag="fina";break;case 2:tag="init";break;case 3:tag="medi"}if(-1!==tags.indexOf(tag)){var substitutions=this$1.query.lookupFeature({tag,script:"arab",contextParams});if(substitutions instanceof Error)return console.info(substitutions.message);substitutions.forEach(function(action,index){action instanceof SubstitutionAction&&(applySubstitution(action,tokens,index),contextParams.context[index]=action.substitution)})}}})}}
/**
 * Apply Arabic required ligatures feature to a range of tokens
 */
/**
 * Update context params
 * @param {any} tokens a list of tokens
 * @param {number} index current item index
 */function getContextParams(tokens,index){return new ContextParams(tokens.map(function(token){return token.activeState.value}),index||0)}
/**
 * Apply Arabic required ligatures to a context range
 * @param {ContextRange} range a range of tokens
 */function arabicRequiredLigatures(range){var this$1=this,tokens=this.tokenizer.getRangeTokens(range),contextParams=getContextParams(tokens);contextParams.context.forEach(function(glyphIndex,index){contextParams.setCurrentIndex(index);var substitutions=this$1.query.lookupFeature({tag:"rlig",script:"arab",contextParams});substitutions.length&&(substitutions.forEach(function(action){return applySubstitution(action,tokens,index)}),contextParams=getContextParams(tokens))})}
/**
 * Latin word context checkers
 */var latinWordCheck={startCheck:function(contextParams){var char=contextParams.current,prevChar=contextParams.get(-1);
// ? latin first char
return null===prevChar&&isLatinChar(char)||
// ? latin char preceded with a non latin char
!isLatinChar(prevChar)&&isLatinChar(char)},endCheck:function(contextParams){var nextChar=contextParams.get(1);
// ? last latin char
return null===nextChar||
// ? next char is not latin
!isLatinChar(nextChar)}};
/**
 * Apply Latin ligature feature to a range of tokens
 */
/**
 * Update context params
 * @param {any} tokens a list of tokens
 * @param {number} index current item index
 */function getContextParams$1(tokens,index){return new ContextParams(tokens.map(function(token){return token.activeState.value}),index||0)}
/**
 * Apply Arabic required ligatures to a context range
 * @param {ContextRange} range a range of tokens
 */function latinLigature(range){var this$1=this,tokens=this.tokenizer.getRangeTokens(range),contextParams=getContextParams$1(tokens);contextParams.context.forEach(function(glyphIndex,index){contextParams.setCurrentIndex(index);var substitutions=this$1.query.lookupFeature({tag:"liga",script:"latn",contextParams});substitutions.length&&(substitutions.forEach(function(action){return applySubstitution(action,tokens,index)}),contextParams=getContextParams$1(tokens))})}
/**
 * Infer bidirectional properties for a given text and apply
 * the corresponding layout rules.
 */
/**
 * Create Bidi. features
 * @param {string} baseDir text base direction. value either 'ltr' or 'rtl'
 */function Bidi(baseDir){this.baseDir=baseDir||"ltr",this.tokenizer=new Tokenizer,this.featuresTags={}}
/**
 * Sets Bidi text
 * @param {string} text a text input
 */
/**
 * Register arabic word check
 */
function registerContextChecker(checkId){var check=this.contextChecks[checkId+"Check"];return this.tokenizer.registerContextChecker(checkId,check.startCheck,check.endCheck)}
/**
 * Perform pre tokenization procedure then
 * tokenize text input
 */function tokenizeText(){return registerContextChecker.call(this,"latinWord"),registerContextChecker.call(this,"arabicWord"),registerContextChecker.call(this,"arabicSentence"),this.tokenizer.tokenize(this.text)}
/**
 * Reverse arabic sentence layout
 * TODO: check base dir before applying adjustments - priority low
 */function reverseArabicSentences(){var this$1=this;this.tokenizer.getContextRanges("arabicSentence").forEach(function(range){var rangeTokens=this$1.tokenizer.getRangeTokens(range);this$1.tokenizer.replaceRange(range.startIndex,range.endOffset,rangeTokens.reverse())})}
/**
 * Register supported features tags
 * @param {script} script script tag
 * @param {Array} tags features tags list
 */
/**
 * Check if 'glyphIndex' is registered
 */
function checkGlyphIndexStatus(){if(-1===this.tokenizer.registeredModifiers.indexOf("glyphIndex"))throw new Error("glyphIndex modifier is required to apply arabic presentation features.")}
/**
 * Apply arabic presentation forms features
 */function applyArabicPresentationForms(){var this$1=this;this.featuresTags.hasOwnProperty("arab")&&(checkGlyphIndexStatus.call(this),this.tokenizer.getContextRanges("arabicWord").forEach(function(range){arabicPresentationForms.call(this$1,range)}))}
/**
 * Apply required arabic ligatures
 */function applyArabicRequireLigatures(){var this$1=this;this.featuresTags.hasOwnProperty("arab")&&(-1!==this.featuresTags.arab.indexOf("rlig")&&(checkGlyphIndexStatus.call(this),this.tokenizer.getContextRanges("arabicWord").forEach(function(range){arabicRequiredLigatures.call(this$1,range)})))}
/**
 * Apply required arabic ligatures
 */function applyLatinLigatures(){var this$1=this;this.featuresTags.hasOwnProperty("latn")&&(-1!==this.featuresTags.latn.indexOf("liga")&&(checkGlyphIndexStatus.call(this),this.tokenizer.getContextRanges("latinWord").forEach(function(range){latinLigature.call(this$1,range)})))}
/**
 * Check if a context is registered
 * @param {string} contextId context id
 */
// The Font object
/**
 * @typedef FontOptions
 * @type Object
 * @property {Boolean} empty - whether to create a new empty font
 * @property {string} familyName
 * @property {string} styleName
 * @property {string=} fullName
 * @property {string=} postScriptName
 * @property {string=} designer
 * @property {string=} designerURL
 * @property {string=} manufacturer
 * @property {string=} manufacturerURL
 * @property {string=} license
 * @property {string=} licenseURL
 * @property {string=} version
 * @property {string=} description
 * @property {string=} copyright
 * @property {string=} trademark
 * @property {Number} unitsPerEm
 * @property {Number} ascender
 * @property {Number} descender
 * @property {Number} createdTimestamp
 * @property {string=} weightClass
 * @property {string=} widthClass
 * @property {string=} fsSelection
 */
/**
 * A Font represents a loaded OpenType font file.
 * It contains a set of glyphs and methods to draw text on a drawing context,
 * or to get a path representing the text.
 * @exports opentype.Font
 * @class
 * @param {FontOptions}
 * @constructor
 */
function Font(options){(options=options||{}).tables=options.tables||{},options.empty||(
// Check that we've provided the minimum set of names.
checkArgument(options.familyName,"When creating a new Font object, familyName is required."),checkArgument(options.styleName,"When creating a new Font object, styleName is required."),checkArgument(options.unitsPerEm,"When creating a new Font object, unitsPerEm is required."),checkArgument(options.ascender,"When creating a new Font object, ascender is required."),checkArgument(options.descender<=0,"When creating a new Font object, negative descender value is required."),
// OS X will complain if the names are empty, so we put a single space everywhere by default.
this.names={fontFamily:{en:options.familyName||" "},fontSubfamily:{en:options.styleName||" "},fullName:{en:options.fullName||options.familyName+" "+options.styleName},
// postScriptName may not contain any whitespace
postScriptName:{en:options.postScriptName||(options.familyName+options.styleName).replace(/\s/g,"")},designer:{en:options.designer||" "},designerURL:{en:options.designerURL||" "},manufacturer:{en:options.manufacturer||" "},manufacturerURL:{en:options.manufacturerURL||" "},license:{en:options.license||" "},licenseURL:{en:options.licenseURL||" "},version:{en:options.version||"Version 0.1"},description:{en:options.description||" "},copyright:{en:options.copyright||" "},trademark:{en:options.trademark||" "}},this.unitsPerEm=options.unitsPerEm||1e3,this.ascender=options.ascender,this.descender=options.descender,this.createdTimestamp=options.createdTimestamp,this.tables=Object.assign(options.tables,{os2:Object.assign({usWeightClass:options.weightClass||this.usWeightClasses.MEDIUM,usWidthClass:options.widthClass||this.usWidthClasses.MEDIUM,fsSelection:options.fsSelection||this.fsSelectionValues.REGULAR},options.tables.os2)})),this.supported=!0,// Deprecated: parseBuffer will throw an error if font is not supported.
this.glyphs=new glyphset.GlyphSet(this,options.glyphs||[]),this.encoding=new DefaultEncoding(this),this.position=new Position(this),this.substitution=new Substitution(this),this.tables=this.tables||{},
// needed for low memory mode only.
this._push=null,this._hmtxTableData={},Object.defineProperty(this,"hinting",{get:function(){return this._hinting?this._hinting:"truetype"===this.outlinesFormat?this._hinting=new Hinting(this):void 0}})}
/**
 * Check if the font has a glyph for the given character.
 * @param  {string}
 * @return {Boolean}
 */
// The `fvar` table stores font variation axes and instances.
function addName(name,names){var nameString=JSON.stringify(name),nameID=256;for(var nameKey in names){var n=parseInt(nameKey);if(n&&!(n<256)){if(JSON.stringify(names[nameKey])===nameString)return n;nameID<=n&&(nameID=n+1)}}return names[nameID]=name,nameID}function makeFvarAxis(n,axis,names){var nameID=addName(axis.name,names);return[{name:"tag_"+n,type:"TAG",value:axis.tag},{name:"minValue_"+n,type:"FIXED",value:axis.minValue<<16},{name:"defaultValue_"+n,type:"FIXED",value:axis.defaultValue<<16},{name:"maxValue_"+n,type:"FIXED",value:axis.maxValue<<16},{name:"flags_"+n,type:"USHORT",value:0},{name:"nameID_"+n,type:"USHORT",value:nameID}]}function parseFvarAxis(data,start,names){var axis={},p=new parse.Parser(data,start);return axis.tag=p.parseTag(),axis.minValue=p.parseFixed(),axis.defaultValue=p.parseFixed(),axis.maxValue=p.parseFixed(),p.skip("uShort",1),// reserved for flags; no values defined
axis.name=names[p.parseUShort()]||{},axis}function makeFvarInstance(n,inst,axes,names){for(var fields=[{name:"nameID_"+n,type:"USHORT",value:addName(inst.name,names)},{name:"flags_"+n,type:"USHORT",value:0}],i=0;i<axes.length;++i){var axisTag=axes[i].tag;fields.push({name:"axis_"+n+" "+axisTag,type:"FIXED",value:inst.coordinates[axisTag]<<16})}return fields}function parseFvarInstance(data,start,axes,names){var inst={},p=new parse.Parser(data,start);inst.name=names[p.parseUShort()]||{},p.skip("uShort",1),// reserved for flags; no values defined
inst.coordinates={};for(var i=0;i<axes.length;++i)inst.coordinates[axes[i].tag]=p.parseFixed();return inst}Bidi.prototype.setText=function(text){this.text=text},
/**
 * Store essential context checks:
 * arabic word check for applying gsub features
 * arabic sentence check for adjusting arabic layout
 */
Bidi.prototype.contextChecks={latinWordCheck,arabicWordCheck,arabicSentenceCheck},Bidi.prototype.registerFeatures=function(script,tags){var this$1=this,supportedTags=tags.filter(function(tag){return this$1.query.supports({script,tag})});this.featuresTags.hasOwnProperty(script)?this.featuresTags[script]=this.featuresTags[script].concat(supportedTags):this.featuresTags[script]=supportedTags},
/**
 * Apply GSUB features
 * @param {Array} tagsList a list of features tags
 * @param {string} script a script tag
 * @param {Font} font opentype font instance
 */
Bidi.prototype.applyFeatures=function(font,features){if(!font)throw new Error("No valid font was provided to apply features");this.query||(this.query=new FeatureQuery(font));for(var f=0;f<features.length;f++){var feature=features[f];this.query.supports({script:feature.script})&&this.registerFeatures(feature.script,feature.tags)}},
/**
 * Register a state modifier
 * @param {string} modifierId state modifier id
 * @param {function} condition a predicate function that returns true or false
 * @param {function} modifier a modifier function to set token state
 */
Bidi.prototype.registerModifier=function(modifierId,condition,modifier){this.tokenizer.registerModifier(modifierId,condition,modifier)},Bidi.prototype.checkContextReady=function(contextId){return!!this.tokenizer.getContext(contextId)},
/**
 * Apply features to registered contexts
 */
Bidi.prototype.applyFeaturesToContexts=function(){this.checkContextReady("arabicWord")&&(applyArabicPresentationForms.call(this),applyArabicRequireLigatures.call(this)),this.checkContextReady("latinWord")&&applyLatinLigatures.call(this),this.checkContextReady("arabicSentence")&&reverseArabicSentences.call(this)},
/**
 * process text input
 * @param {string} text an input text
 */
Bidi.prototype.processText=function(text){this.text&&this.text===text||(this.setText(text),tokenizeText.call(this),this.applyFeaturesToContexts())},
/**
 * Process a string of text to identify and adjust
 * bidirectional text entities.
 * @param {string} text input text
 */
Bidi.prototype.getBidiText=function(text){return this.processText(text),this.tokenizer.getText()},
/**
 * Get the current state index of each token
 * @param {text} text an input text
 */
Bidi.prototype.getTextGlyphs=function(text){this.processText(text);for(var indexes=[],i=0;i<this.tokenizer.tokens.length;i++){var token=this.tokenizer.tokens[i];if(!token.state.deleted){var index=token.activeState.value;indexes.push(Array.isArray(index)?index[0]:index)}}return indexes},Font.prototype.hasChar=function(c){return null!==this.encoding.charToGlyphIndex(c)},
/**
 * Convert the given character to a single glyph index.
 * Note that this function assumes that there is a one-to-one mapping between
 * the given character and a glyph; for complex scripts this might not be the case.
 * @param  {string}
 * @return {Number}
 */
Font.prototype.charToGlyphIndex=function(s){return this.encoding.charToGlyphIndex(s)},
/**
 * Convert the given character to a single Glyph object.
 * Note that this function assumes that there is a one-to-one mapping between
 * the given character and a glyph; for complex scripts this might not be the case.
 * @param  {string}
 * @return {opentype.Glyph}
 */
Font.prototype.charToGlyph=function(c){var glyphIndex=this.charToGlyphIndex(c),glyph=this.glyphs.get(glyphIndex);return glyph||(
// .notdef
glyph=this.glyphs.get(0)),glyph},
/**
 * Update features
 * @param {any} options features options
 */
Font.prototype.updateFeatures=function(options){
// TODO: update all features options not only 'latn'.
return this.defaultRenderOptions.features.map(function(feature){return"latn"===feature.script?{script:"latn",tags:feature.tags.filter(function(tag){return options[tag]})}:feature})},
/**
 * Convert the given text to a list of Glyph objects.
 * Note that there is no strict one-to-one mapping between characters and
 * glyphs, so the list of returned glyphs can be larger or smaller than the
 * length of the given string.
 * @param  {string}
 * @param  {GlyphRenderOptions} [options]
 * @return {opentype.Glyph[]}
 */
Font.prototype.stringToGlyphs=function(s,options){var this$1=this,bidi=new Bidi;bidi.registerModifier("glyphIndex",null,function(token){return this$1.charToGlyphIndex(token.char)});
// roll-back to default features
var features=options?this.updateFeatures(options.features):this.defaultRenderOptions.features;bidi.applyFeatures(this,features);for(var indexes=bidi.getTextGlyphs(s),length=indexes.length,glyphs=new Array(length),notdef=this.glyphs.get(0),i=0;i<length;i+=1)glyphs[i]=this.glyphs.get(indexes[i])||notdef;return glyphs},
/**
 * @param  {string}
 * @return {Number}
 */
Font.prototype.nameToGlyphIndex=function(name){return this.glyphNames.nameToGlyphIndex(name)},
/**
 * @param  {string}
 * @return {opentype.Glyph}
 */
Font.prototype.nameToGlyph=function(name){var glyphIndex=this.nameToGlyphIndex(name),glyph=this.glyphs.get(glyphIndex);return glyph||(
// .notdef
glyph=this.glyphs.get(0)),glyph},
/**
 * @param  {Number}
 * @return {String}
 */
Font.prototype.glyphIndexToName=function(gid){return this.glyphNames.glyphIndexToName?this.glyphNames.glyphIndexToName(gid):""},
/**
 * Retrieve the value of the kerning pair between the left glyph (or its index)
 * and the right glyph (or its index). If no kerning pair is found, return 0.
 * The kerning value gets added to the advance width when calculating the spacing
 * between glyphs.
 * For GPOS kerning, this method uses the default script and language, which covers
 * most use cases. To have greater control, use font.position.getKerningValue .
 * @param  {opentype.Glyph} leftGlyph
 * @param  {opentype.Glyph} rightGlyph
 * @return {Number}
 */
Font.prototype.getKerningValue=function(leftGlyph,rightGlyph){leftGlyph=leftGlyph.index||leftGlyph,rightGlyph=rightGlyph.index||rightGlyph;var gposKerning=this.position.defaultKerningTables;return gposKerning?this.position.getKerningValue(gposKerning,leftGlyph,rightGlyph):this.kerningPairs[leftGlyph+","+rightGlyph]||0;
// "kern" table
},
/**
 * @typedef GlyphRenderOptions
 * @type Object
 * @property {string} [script] - script used to determine which features to apply. By default, 'DFLT' or 'latn' is used.
 *                               See https://www.microsoft.com/typography/otspec/scripttags.htm
 * @property {string} [language='dflt'] - language system used to determine which features to apply.
 *                                        See https://www.microsoft.com/typography/developers/opentype/languagetags.aspx
 * @property {boolean} [kerning=true] - whether to include kerning values
 * @property {object} [features] - OpenType Layout feature tags. Used to enable or disable the features of the given script/language system.
 *                                 See https://www.microsoft.com/typography/otspec/featuretags.htm
 */
Font.prototype.defaultRenderOptions={kerning:!0,features:[
/**
         * these 4 features are required to render Arabic text properly
         * and shouldn't be turned off when rendering arabic text.
         */
{script:"arab",tags:["init","medi","fina","rlig"]},{script:"latn",tags:["liga","rlig"]}]},
/**
 * Helper function that invokes the given callback for each glyph in the given text.
 * The callback gets `(glyph, x, y, fontSize, options)`.* @param  {string} text
 * @param {string} text - The text to apply.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {GlyphRenderOptions=} options
 * @param  {Function} callback
 */
Font.prototype.forEachGlyph=function(text,x,y,fontSize,options,callback){x=void 0!==x?x:0,y=void 0!==y?y:0,fontSize=void 0!==fontSize?fontSize:72,options=Object.assign({},this.defaultRenderOptions,options);var kerningLookups,fontScale=1/this.unitsPerEm*fontSize,glyphs=this.stringToGlyphs(text,options);if(options.kerning){var script=options.script||this.position.getDefaultScriptName();kerningLookups=this.position.getKerningTables(script,options.language)}for(var i=0;i<glyphs.length;i+=1){var glyph=glyphs[i];if(callback.call(this,glyph,x,y,fontSize,options),glyph.advanceWidth&&(x+=glyph.advanceWidth*fontScale),options.kerning&&i<glyphs.length-1)x+=(kerningLookups?this.position.getKerningValue(kerningLookups,glyph.index,glyphs[i+1].index):this.getKerningValue(glyph,glyphs[i+1]))*fontScale;options.letterSpacing?x+=options.letterSpacing*fontSize:options.tracking&&(x+=options.tracking/1e3*fontSize)}return x},
/**
 * Create a Path object that represents the given text.
 * @param  {string} text - The text to create.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {GlyphRenderOptions=} options
 * @return {opentype.Path}
 */
Font.prototype.getPath=function(text,x,y,fontSize,options){var fullPath=new Path;return this.forEachGlyph(text,x,y,fontSize,options,function(glyph,gX,gY,gFontSize){var glyphPath=glyph.getPath(gX,gY,gFontSize,options,this);fullPath.extend(glyphPath)}),fullPath},
/**
 * Create an array of Path objects that represent the glyphs of a given text.
 * @param  {string} text - The text to create.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {GlyphRenderOptions=} options
 * @return {opentype.Path[]}
 */
Font.prototype.getPaths=function(text,x,y,fontSize,options){var glyphPaths=[];return this.forEachGlyph(text,x,y,fontSize,options,function(glyph,gX,gY,gFontSize){var glyphPath=glyph.getPath(gX,gY,gFontSize,options,this);glyphPaths.push(glyphPath)}),glyphPaths},
/**
 * Returns the advance width of a text.
 *
 * This is something different than Path.getBoundingBox() as for example a
 * suffixed whitespace increases the advanceWidth but not the bounding box
 * or an overhanging letter like a calligraphic 'f' might have a quite larger
 * bounding box than its advance width.
 *
 * This corresponds to canvas2dContext.measureText(text).width
 *
 * @param  {string} text - The text to create.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {GlyphRenderOptions=} options
 * @return advance width
 */
Font.prototype.getAdvanceWidth=function(text,fontSize,options){return this.forEachGlyph(text,0,0,fontSize,options,function(){})},
/**
 * Draw the text on the given drawing context.
 * @param  {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param  {string} text - The text to create.
 * @param  {number} [x=0] - Horizontal position of the beginning of the text.
 * @param  {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param  {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param  {GlyphRenderOptions=} options
 */
Font.prototype.draw=function(ctx,text,x,y,fontSize,options){this.getPath(text,x,y,fontSize,options).draw(ctx)},
/**
 * Draw the points of all glyphs in the text.
 * On-curve points will be drawn in blue, off-curve points will be drawn in red.
 * @param {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param {string} text - The text to create.
 * @param {number} [x=0] - Horizontal position of the beginning of the text.
 * @param {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param {GlyphRenderOptions=} options
 */
Font.prototype.drawPoints=function(ctx,text,x,y,fontSize,options){this.forEachGlyph(text,x,y,fontSize,options,function(glyph,gX,gY,gFontSize){glyph.drawPoints(ctx,gX,gY,gFontSize)})},
/**
 * Draw lines indicating important font measurements for all glyphs in the text.
 * Black lines indicate the origin of the coordinate system (point 0,0).
 * Blue lines indicate the glyph bounding box.
 * Green line indicates the advance width of the glyph.
 * @param {CanvasRenderingContext2D} ctx - A 2D drawing context, like Canvas.
 * @param {string} text - The text to create.
 * @param {number} [x=0] - Horizontal position of the beginning of the text.
 * @param {number} [y=0] - Vertical position of the *baseline* of the text.
 * @param {number} [fontSize=72] - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`.
 * @param {GlyphRenderOptions=} options
 */
Font.prototype.drawMetrics=function(ctx,text,x,y,fontSize,options){this.forEachGlyph(text,x,y,fontSize,options,function(glyph,gX,gY,gFontSize){glyph.drawMetrics(ctx,gX,gY,gFontSize)})},
/**
 * @param  {string}
 * @return {string}
 */
Font.prototype.getEnglishName=function(name){var translations=this.names[name];if(translations)return translations.en},
/**
 * Validate
 */
Font.prototype.validate=function(){var _this=this;function assertNamePresent(name){var englishName=_this.getEnglishName(name);englishName&&englishName.trim().length}
// Identification information
assertNamePresent("fontFamily"),assertNamePresent("weightName"),assertNamePresent("manufacturer"),assertNamePresent("copyright"),assertNamePresent("version"),this.unitsPerEm},
/**
 * Convert the font object to a SFNT data structure.
 * This structure contains all the necessary tables and metadata to create a binary OTF file.
 * @return {opentype.Table}
 */
Font.prototype.toTables=function(){return sfnt.fontToTable(this)},
/**
 * @deprecated Font.toBuffer is deprecated. Use Font.toArrayBuffer instead.
 */
Font.prototype.toBuffer=function(){return console.warn("Font.toBuffer is deprecated. Use Font.toArrayBuffer instead."),this.toArrayBuffer()},
/**
 * Converts a `opentype.Font` into an `ArrayBuffer`
 * @return {ArrayBuffer}
 */
Font.prototype.toArrayBuffer=function(){for(var bytes=this.toTables().encode(),buffer=new ArrayBuffer(bytes.length),intArray=new Uint8Array(buffer),i=0;i<bytes.length;i++)intArray[i]=bytes[i];return buffer},
/**
 * Initiate a download of the OpenType font.
 */
Font.prototype.download=function(fileName){var familyName=this.getEnglishName("fontFamily"),styleName=this.getEnglishName("fontSubfamily");fileName=fileName||familyName.replace(/\s/g,"")+"-"+styleName+".otf";var arrayBuffer=this.toArrayBuffer();if("undefined"!=typeof window)if(window.URL=window.URL||window.webkitURL,window.URL){var dataView=new DataView(arrayBuffer),blob=new Blob([dataView],{type:"font/opentype"}),link=document.createElement("a");link.href=window.URL.createObjectURL(blob),link.download=fileName;var event=document.createEvent("MouseEvents");event.initEvent("click",!0,!1),link.dispatchEvent(event)}else console.warn("Font file could not be downloaded. Try using a different browser.");else{var fs=__webpack_require__(7256),buffer=function(ab){for(var buffer=new Buffer(ab.byteLength),view=new Uint8Array(ab),i=0;i<buffer.length;++i)buffer[i]=view[i];return buffer}(arrayBuffer);fs.writeFileSync(fileName,buffer)}},
/**
 * @private
 */
Font.prototype.fsSelectionValues={ITALIC:1,//1
UNDERSCORE:2,//2
NEGATIVE:4,//4
OUTLINED:8,//8
STRIKEOUT:16,//16
BOLD:32,//32
REGULAR:64,//64
USER_TYPO_METRICS:128,//128
WWS:256,//256
OBLIQUE:512},
/**
 * @private
 */
Font.prototype.usWidthClasses={ULTRA_CONDENSED:1,EXTRA_CONDENSED:2,CONDENSED:3,SEMI_CONDENSED:4,MEDIUM:5,SEMI_EXPANDED:6,EXPANDED:7,EXTRA_EXPANDED:8,ULTRA_EXPANDED:9},
/**
 * @private
 */
Font.prototype.usWeightClasses={THIN:100,EXTRA_LIGHT:200,LIGHT:300,NORMAL:400,MEDIUM:500,SEMI_BOLD:600,BOLD:700,EXTRA_BOLD:800,BLACK:900};var fvar={make:function(fvar,names){var result=new table.Table("fvar",[{name:"version",type:"ULONG",value:65536},{name:"offsetToData",type:"USHORT",value:0},{name:"countSizePairs",type:"USHORT",value:2},{name:"axisCount",type:"USHORT",value:fvar.axes.length},{name:"axisSize",type:"USHORT",value:20},{name:"instanceCount",type:"USHORT",value:fvar.instances.length},{name:"instanceSize",type:"USHORT",value:4+4*fvar.axes.length}]);result.offsetToData=result.sizeOf();for(var i=0;i<fvar.axes.length;i++)result.fields=result.fields.concat(makeFvarAxis(i,fvar.axes[i],names));for(var j=0;j<fvar.instances.length;j++)result.fields=result.fields.concat(makeFvarInstance(j,fvar.instances[j],fvar.axes,names));return result},parse:function(data,start,names){var p=new parse.Parser(data,start),tableVersion=p.parseULong();check.argument(65536===tableVersion,"Unsupported fvar table version.");var offsetToData=p.parseOffset16();
// Skip countSizePairs.
p.skip("uShort",1);for(var axisCount=p.parseUShort(),axisSize=p.parseUShort(),instanceCount=p.parseUShort(),instanceSize=p.parseUShort(),axes=[],i=0;i<axisCount;i++)axes.push(parseFvarAxis(data,start+offsetToData+i*axisSize,names));for(var instances=[],instanceStart=start+offsetToData+axisCount*axisSize,j=0;j<instanceCount;j++)instances.push(parseFvarInstance(data,instanceStart+j*instanceSize,axes,names));return{axes,instances}}},attachList=function(){return{coverage:this.parsePointer(Parser.coverage),attachPoints:this.parseList(Parser.pointer(Parser.uShortList))}},caretValue=function(){var format=this.parseUShort();return check.argument(1===format||2===format||3===format,"Unsupported CaretValue table version."),1===format?{coordinate:this.parseShort()}:2===format?{pointindex:this.parseShort()}:3===format?{coordinate:this.parseShort()}:void 0},ligGlyph=function(){return this.parseList(Parser.pointer(caretValue))},ligCaretList=function(){return{coverage:this.parsePointer(Parser.coverage),ligGlyphs:this.parseList(Parser.pointer(ligGlyph))}},markGlyphSets=function(){// Version
return this.parseUShort(),this.parseList(Parser.pointer(Parser.coverage))};
// The `GDEF` table contains various glyph properties
var gdef={parse:function(data,start){var p=new Parser(data,start=start||0),tableVersion=p.parseVersion(1);check.argument(1===tableVersion||1.2===tableVersion||1.3===tableVersion,"Unsupported GDEF table version.");var gdef={version:tableVersion,classDef:p.parsePointer(Parser.classDef),attachList:p.parsePointer(attachList),ligCaretList:p.parsePointer(ligCaretList),markAttachClassDef:p.parsePointer(Parser.classDef)};return tableVersion>=1.2&&(gdef.markGlyphSets=p.parsePointer(markGlyphSets)),gdef}},subtableParsers$1=new Array(10);
// The `GPOS` table contains kerning pairs, among other things.
// subtableParsers[0] is unused
// https://docs.microsoft.com/en-us/typography/opentype/spec/gpos#lookup-type-1-single-adjustment-positioning-subtable
// this = Parser instance
subtableParsers$1[1]=function(){var start=this.offset+this.relativeOffset,posformat=this.parseUShort();return 1===posformat?{posFormat:1,coverage:this.parsePointer(Parser.coverage),value:this.parseValueRecord()}:2===posformat?{posFormat:2,coverage:this.parsePointer(Parser.coverage),values:this.parseValueRecordList()}:void check.assert(!1,"0x"+start.toString(16)+": GPOS lookup type 1 format must be 1 or 2.")},
// https://docs.microsoft.com/en-us/typography/opentype/spec/gpos#lookup-type-2-pair-adjustment-positioning-subtable
subtableParsers$1[2]=function(){var start=this.offset+this.relativeOffset,posFormat=this.parseUShort();check.assert(1===posFormat||2===posFormat,"0x"+start.toString(16)+": GPOS lookup type 2 format must be 1 or 2.");var coverage=this.parsePointer(Parser.coverage),valueFormat1=this.parseUShort(),valueFormat2=this.parseUShort();if(1===posFormat)
// Adjustments for Glyph Pairs
return{posFormat,coverage,valueFormat1,valueFormat2,pairSets:this.parseList(Parser.pointer(Parser.list(function(){return{// pairValueRecord
secondGlyph:this.parseUShort(),value1:this.parseValueRecord(valueFormat1),value2:this.parseValueRecord(valueFormat2)}})))};if(2===posFormat){var classDef1=this.parsePointer(Parser.classDef),classDef2=this.parsePointer(Parser.classDef),class1Count=this.parseUShort(),class2Count=this.parseUShort();return{
// Class Pair Adjustment
posFormat,coverage,valueFormat1,valueFormat2,classDef1,classDef2,class1Count,class2Count,classRecords:this.parseList(class1Count,Parser.list(class2Count,function(){return{value1:this.parseValueRecord(valueFormat1),value2:this.parseValueRecord(valueFormat2)}}))}}},subtableParsers$1[3]=function(){return{error:"GPOS Lookup 3 not supported"}},subtableParsers$1[4]=function(){return{error:"GPOS Lookup 4 not supported"}},subtableParsers$1[5]=function(){return{error:"GPOS Lookup 5 not supported"}},subtableParsers$1[6]=function(){return{error:"GPOS Lookup 6 not supported"}},subtableParsers$1[7]=function(){return{error:"GPOS Lookup 7 not supported"}},subtableParsers$1[8]=function(){return{error:"GPOS Lookup 8 not supported"}},subtableParsers$1[9]=function(){return{error:"GPOS Lookup 9 not supported"}};
// GPOS Writing //////////////////////////////////////////////
// NOT SUPPORTED
var subtableMakers$1=new Array(10);var gpos={parse:
// https://docs.microsoft.com/en-us/typography/opentype/spec/gpos
function(data,start){var p=new Parser(data,start=start||0),tableVersion=p.parseVersion(1);return check.argument(1===tableVersion||1.1===tableVersion,"Unsupported GPOS table version "+tableVersion),1===tableVersion?{version:tableVersion,scripts:p.parseScriptList(),features:p.parseFeatureList(),lookups:p.parseLookupList(subtableParsers$1)}:{version:tableVersion,scripts:p.parseScriptList(),features:p.parseFeatureList(),lookups:p.parseLookupList(subtableParsers$1),variations:p.parseFeatureVariationsList()}},make:function(gpos){return new table.Table("GPOS",[{name:"version",type:"ULONG",value:65536},{name:"scripts",type:"TABLE",value:new table.ScriptList(gpos.scripts)},{name:"features",type:"TABLE",value:new table.FeatureList(gpos.features)},{name:"lookups",type:"TABLE",value:new table.LookupList(gpos.lookups,subtableMakers$1)}])}};
// The `kern` table contains kerning pairs.
var kern={parse:
// Parse the `kern` table which contains kerning pairs.
function(data,start){var p=new parse.Parser(data,start),tableVersion=p.parseUShort();if(0===tableVersion)return function(p){var pairs={};
// Skip nTables.
p.skip("uShort");var subtableVersion=p.parseUShort();check.argument(0===subtableVersion,"Unsupported kern sub-table version."),
// Skip subtableLength, subtableCoverage
p.skip("uShort",2);var nPairs=p.parseUShort();
// Skip searchRange, entrySelector, rangeShift.
p.skip("uShort",3);for(var i=0;i<nPairs;i+=1){var leftIndex=p.parseUShort(),rightIndex=p.parseUShort(),value=p.parseShort();pairs[leftIndex+","+rightIndex]=value}return pairs}(p);if(1===tableVersion)return function(p){var pairs={};
// The Mac kern table stores the version as a fixed (32 bits) but we only loaded the first 16 bits.
// Skip the rest.
p.skip("uShort"),
//check.argument(nTables === 1, 'Only 1 subtable is supported (got ' + nTables + ').');
p.parseULong()>1&&console.warn("Only the first kern subtable is supported."),p.skip("uLong");var subtableVersion=255&p.parseUShort();if(p.skip("uShort"),0===subtableVersion){var nPairs=p.parseUShort();
// Skip searchRange, entrySelector, rangeShift.
p.skip("uShort",3);for(var i=0;i<nPairs;i+=1){var leftIndex=p.parseUShort(),rightIndex=p.parseUShort(),value=p.parseShort();pairs[leftIndex+","+rightIndex]=value}}return pairs}(p);throw new Error("Unsupported kern table version ("+tableVersion+").")}};
// The `loca` table stores the offsets to the locations of the glyphs in the font.
// Parse the `loca` table. This table stores the offsets to the locations of the glyphs in the font,
// relative to the beginning of the glyphData table.
// The number of glyphs stored in the `loca` table is specified in the `maxp` table (under numGlyphs)
// The loca table has two versions: a short version where offsets are stored as uShorts, and a long
// version where offsets are stored as uLongs. The `head` table specifies which version to use
// (under indexToLocFormat).
var loca={parse:function(data,start,numGlyphs,shortVersion){for(var p=new parse.Parser(data,start),parseFn=shortVersion?p.parseUShort:p.parseULong,glyphOffsets=[],i=0;i<numGlyphs+1;i+=1){var glyphOffset=parseFn.call(p);shortVersion&&(
// The short table version stores the actual offset divided by 2.
glyphOffset*=2),glyphOffsets.push(glyphOffset)}return glyphOffsets}};
// opentype.js
/**
 * The opentype library.
 * @namespace opentype
 */
// File loaders /////////////////////////////////////////////////////////
/**
 * Loads a font from a file. The callback throws an error message as the first parameter if it fails
 * and the font as an ArrayBuffer in the second parameter if it succeeds.
 * @param  {string} path - The path of the file
 * @param  {Function} callback - The function to call when the font load completes
 */function loadFromFile(path,callback){__webpack_require__(7256).readFile(path,function(err,buffer){if(err)return callback(err.message);callback(null,nodeBufferToArrayBuffer(buffer))})}
/**
 * Loads a font from a URL. The callback throws an error message as the first parameter if it fails
 * and the font as an ArrayBuffer in the second parameter if it succeeds.
 * @param  {string} url - The URL of the font file.
 * @param  {Function} callback - The function to call when the font load completes
 */function loadFromUrl(url,callback){var request=new XMLHttpRequest;request.open("get",url,!0),request.responseType="arraybuffer",request.onload=function(){return request.response?callback(null,request.response):callback("Font could not be loaded: "+request.statusText)},request.onerror=function(){callback("Font could not be loaded")},request.send()}
// Table Directory Entries //////////////////////////////////////////////
/**
 * Parses OpenType table entries.
 * @param  {DataView}
 * @param  {Number}
 * @return {Object[]}
 */function parseOpenTypeTableEntries(data,numTables){for(var tableEntries=[],p=12,i=0;i<numTables;i+=1){var tag=parse.getTag(data,p),checksum=parse.getULong(data,p+4),offset=parse.getULong(data,p+8),length=parse.getULong(data,p+12);tableEntries.push({tag,checksum,offset,length,compression:!1}),p+=16}return tableEntries}
/**
 * Parses WOFF table entries.
 * @param  {DataView}
 * @param  {Number}
 * @return {Object[]}
 */
/**
 * @typedef TableData
 * @type Object
 * @property {DataView} data - The DataView
 * @property {number} offset - The data offset.
 */
/**
 * @param  {DataView}
 * @param  {Object}
 * @return {TableData}
 */
function uncompressTable(data,tableEntry){if("WOFF"===tableEntry.compression){var inBuffer=new Uint8Array(data.buffer,tableEntry.offset+2,tableEntry.compressedLength-2),outBuffer=new Uint8Array(tableEntry.length);if(tinyInflate(inBuffer,outBuffer),outBuffer.byteLength!==tableEntry.length)throw new Error("Decompression error: "+tableEntry.tag+" decompressed length doesn't match recorded length");return{data:new DataView(outBuffer.buffer,0),offset:0}}return{data,offset:tableEntry.offset}}
// Public API ///////////////////////////////////////////////////////////
/**
 * Parse the OpenType file data (as an ArrayBuffer) and return a Font object.
 * Throws an error if the font could not be parsed.
 * @param  {ArrayBuffer}
 * @param  {Object} opt - options for parsing
 * @return {opentype.Font}
 */function parseBuffer(buffer,opt){var indexToLocFormat,ltagTable;opt=null==opt?{}:opt;
// Since the constructor can also be called to create new fonts from scratch, we indicate this
// should be an empty font that we'll fill with our own data.
var numTables,cffTableEntry,fvarTableEntry,glyfTableEntry,gdefTableEntry,gposTableEntry,gsubTableEntry,hmtxTableEntry,kernTableEntry,locaTableEntry,nameTableEntry,metaTableEntry,p,font=new Font({empty:!0}),data=new DataView(buffer,0),tableEntries=[],signature=parse.getTag(data,0);
// OpenType fonts use big endian byte ordering.
// We can't rely on typed array view types, because they operate with the endianness of the host computer.
// Instead we use DataViews where we can specify endianness.
if(signature===String.fromCharCode(0,1,0,0)||"true"===signature||"typ1"===signature)font.outlinesFormat="truetype",tableEntries=parseOpenTypeTableEntries(data,numTables=parse.getUShort(data,4));else if("OTTO"===signature)font.outlinesFormat="cff",tableEntries=parseOpenTypeTableEntries(data,numTables=parse.getUShort(data,4));else{if("wOFF"!==signature)throw new Error("Unsupported OpenType signature "+signature);var flavor=parse.getTag(data,4);if(flavor===String.fromCharCode(0,1,0,0))font.outlinesFormat="truetype";else{if("OTTO"!==flavor)throw new Error("Unsupported OpenType flavor "+signature);font.outlinesFormat="cff"}tableEntries=function(data,numTables){// offset to the first table directory entry.
for(var tableEntries=[],p=44,i=0;i<numTables;i+=1){var tag=parse.getTag(data,p),offset=parse.getULong(data,p+4),compLength=parse.getULong(data,p+8),origLength=parse.getULong(data,p+12),compression=void 0;compression=compLength<origLength&&"WOFF",tableEntries.push({tag,offset,compression,compressedLength:compLength,length:origLength}),p+=20}return tableEntries}(data,numTables=parse.getUShort(data,12))}for(var i=0;i<numTables;i+=1){var tableEntry=tableEntries[i],table=void 0;switch(tableEntry.tag){case"cmap":table=uncompressTable(data,tableEntry),font.tables.cmap=cmap.parse(table.data,table.offset),font.encoding=new CmapEncoding(font.tables.cmap);break;case"cvt ":table=uncompressTable(data,tableEntry),p=new parse.Parser(table.data,table.offset),font.tables.cvt=p.parseShortList(tableEntry.length/2);break;case"fvar":fvarTableEntry=tableEntry;break;case"fpgm":table=uncompressTable(data,tableEntry),p=new parse.Parser(table.data,table.offset),font.tables.fpgm=p.parseByteList(tableEntry.length);break;case"head":table=uncompressTable(data,tableEntry),font.tables.head=head.parse(table.data,table.offset),font.unitsPerEm=font.tables.head.unitsPerEm,indexToLocFormat=font.tables.head.indexToLocFormat;break;case"hhea":table=uncompressTable(data,tableEntry),font.tables.hhea=hhea.parse(table.data,table.offset),font.ascender=font.tables.hhea.ascender,font.descender=font.tables.hhea.descender,font.numberOfHMetrics=font.tables.hhea.numberOfHMetrics;break;case"hmtx":hmtxTableEntry=tableEntry;break;case"ltag":table=uncompressTable(data,tableEntry),ltagTable=ltag.parse(table.data,table.offset);break;case"maxp":table=uncompressTable(data,tableEntry),font.tables.maxp=maxp.parse(table.data,table.offset),font.numGlyphs=font.tables.maxp.numGlyphs;break;case"name":nameTableEntry=tableEntry;break;case"OS/2":table=uncompressTable(data,tableEntry),font.tables.os2=os2.parse(table.data,table.offset);break;case"post":table=uncompressTable(data,tableEntry),font.tables.post=post.parse(table.data,table.offset),font.glyphNames=new GlyphNames(font.tables.post);break;case"prep":table=uncompressTable(data,tableEntry),p=new parse.Parser(table.data,table.offset),font.tables.prep=p.parseByteList(tableEntry.length);break;case"glyf":glyfTableEntry=tableEntry;break;case"loca":locaTableEntry=tableEntry;break;case"CFF ":cffTableEntry=tableEntry;break;case"kern":kernTableEntry=tableEntry;break;case"GDEF":gdefTableEntry=tableEntry;break;case"GPOS":gposTableEntry=tableEntry;break;case"GSUB":gsubTableEntry=tableEntry;break;case"meta":metaTableEntry=tableEntry}}var nameTable=uncompressTable(data,nameTableEntry);if(font.tables.name=_name.parse(nameTable.data,nameTable.offset,ltagTable),font.names=font.tables.name,glyfTableEntry&&locaTableEntry){var shortVersion=0===indexToLocFormat,locaTable=uncompressTable(data,locaTableEntry),locaOffsets=loca.parse(locaTable.data,locaTable.offset,font.numGlyphs,shortVersion),glyfTable=uncompressTable(data,glyfTableEntry);font.glyphs=glyf.parse(glyfTable.data,glyfTable.offset,locaOffsets,font,opt)}else{if(!cffTableEntry)throw new Error("Font doesn't contain TrueType or CFF outlines.");var cffTable=uncompressTable(data,cffTableEntry);cff.parse(cffTable.data,cffTable.offset,font,opt)}var hmtxTable=uncompressTable(data,hmtxTableEntry);if(hmtx.parse(font,hmtxTable.data,hmtxTable.offset,font.numberOfHMetrics,font.numGlyphs,font.glyphs,opt),addGlyphNames(font,opt),kernTableEntry){var kernTable=uncompressTable(data,kernTableEntry);font.kerningPairs=kern.parse(kernTable.data,kernTable.offset)}else font.kerningPairs={};if(gdefTableEntry){var gdefTable=uncompressTable(data,gdefTableEntry);font.tables.gdef=gdef.parse(gdefTable.data,gdefTable.offset)}if(gposTableEntry){var gposTable=uncompressTable(data,gposTableEntry);font.tables.gpos=gpos.parse(gposTable.data,gposTable.offset),font.position.init()}if(gsubTableEntry){var gsubTable=uncompressTable(data,gsubTableEntry);font.tables.gsub=gsub.parse(gsubTable.data,gsubTable.offset)}if(fvarTableEntry){var fvarTable=uncompressTable(data,fvarTableEntry);font.tables.fvar=fvar.parse(fvarTable.data,fvarTable.offset,font.names)}if(metaTableEntry){var metaTable=uncompressTable(data,metaTableEntry);font.tables.meta=meta.parse(metaTable.data,metaTable.offset),font.metas=font.tables.meta}return font}
/**
 * Asynchronously load the font from a URL or a filesystem. When done, call the callback
 * with two arguments `(err, font)`. The `err` will be null on success,
 * the `font` is a Font object.
 * We use the node.js callback convention so that
 * opentype.js can integrate with frameworks like async.js.
 * @alias opentype.load
 * @param  {string} url - The URL of the font to load.
 * @param  {Function} callback - The callback.
 */function load(url,callback,opt){opt=null==opt?{}:opt;var loadFn="undefined"==typeof window&&!opt.isUrl?loadFromFile:loadFromUrl;return new Promise(function(resolve,reject){loadFn(url,function(err,arrayBuffer){if(err){if(callback)return callback(err);reject(err)}var font;try{font=parseBuffer(arrayBuffer,opt)}catch(e){if(callback)return callback(e,null);reject(e)}if(callback)return callback(null,font);resolve(font)})})}
/**
 * Synchronously load the font from a URL or file.
 * When done, returns the font object or throws an error.
 * @alias opentype.loadSync
 * @param  {string} url - The URL of the font to load.
 * @param  {Object} opt - opt.lowMemory
 * @return {opentype.Font}
 */function loadSync(url,opt){return parseBuffer(nodeBufferToArrayBuffer(__webpack_require__(7256).readFileSync(url)),opt)}
/* harmony default export */const __WEBPACK_DEFAULT_EXPORT__=Object.freeze({__proto__:null,Font,Glyph,Path,BoundingBox,_parse:parse,parse:parseBuffer,load,loadSync});
//# sourceMappingURL=opentype.module.js.map
/***/},
/***/4765(module){"use strict";var replace=String.prototype.replace,percentTwenties=/%20/g,Format_RFC1738="RFC1738",Format_RFC3986="RFC3986";module.exports={default:Format_RFC3986,formatters:{RFC1738:function(value){return replace.call(value,percentTwenties,"+")},RFC3986:function(value){return String(value)}},RFC1738:Format_RFC1738,RFC3986:Format_RFC3986}},
/***/5373(module,__unused_webpack_exports,__webpack_require__){"use strict";var stringify=__webpack_require__(8636),parse=__webpack_require__(2642),formats=__webpack_require__(4765);module.exports={formats,parse,stringify}},
/***/2642(module,__unused_webpack_exports,__webpack_require__){"use strict";var utils=__webpack_require__(7720),has=Object.prototype.hasOwnProperty,isArray=Array.isArray,defaults={allowDots:!1,allowEmptyArrays:!1,allowPrototypes:!1,allowSparse:!1,arrayLimit:20,charset:"utf-8",charsetSentinel:!1,comma:!1,decodeDotInKeys:!1,decoder:utils.decode,delimiter:"&",depth:5,duplicates:"combine",ignoreQueryPrefix:!1,interpretNumericEntities:!1,parameterLimit:1e3,parseArrays:!0,plainObjects:!1,strictDepth:!1,strictMerge:!0,strictNullHandling:!1,throwOnLimitExceeded:!1},interpretNumericEntities=function(str){return str.replace(/&#(\d+);/g,function($0,numberStr){return String.fromCharCode(parseInt(numberStr,10))})},parseArrayValue=function(val,options,currentArrayLength){if(val&&"string"==typeof val&&options.comma&&val.indexOf(",")>-1)return val.split(",");if(options.throwOnLimitExceeded&&currentArrayLength>=options.arrayLimit)throw new RangeError("Array limit exceeded. Only "+options.arrayLimit+" element"+(1===options.arrayLimit?"":"s")+" allowed in an array.");return val},parseKeys=function(givenKey,val,options,valuesParsed){if(givenKey){var keys=function(givenKey,options){var key=options.allowDots?givenKey.replace(/\.([^.[]+)/g,"[$1]"):givenKey;if(options.depth<=0){if(!options.plainObjects&&has.call(Object.prototype,key)&&!options.allowPrototypes)return;return[key]}var child=/(\[[^[\]]*])/g,segment=/(\[[^[\]]*])/.exec(key),parent=segment?key.slice(0,segment.index):key,keys=[];if(parent){if(!options.plainObjects&&has.call(Object.prototype,parent)&&!options.allowPrototypes)return;keys[keys.length]=parent}for(var i=0;null!==(segment=child.exec(key))&&i<options.depth;){i+=1;var segmentContent=segment[1].slice(1,-1);if(!options.plainObjects&&has.call(Object.prototype,segmentContent)&&!options.allowPrototypes)return;keys[keys.length]=segment[1]}if(segment){if(!0===options.strictDepth)throw new RangeError("Input depth exceeded depth option of "+options.depth+" and strictDepth is true");keys[keys.length]="["+key.slice(segment.index)+"]"}return keys}(givenKey,options);if(keys)return function(chain,val,options,valuesParsed){var currentArrayLength=0;if(chain.length>0&&"[]"===chain[chain.length-1]){var parentKey=chain.slice(0,-1).join("");currentArrayLength=Array.isArray(val)&&val[parentKey]?val[parentKey].length:0}for(var leaf=valuesParsed?val:parseArrayValue(val,options,currentArrayLength),i=chain.length-1;i>=0;--i){var obj,root=chain[i];if("[]"===root&&options.parseArrays)
// leaf is already an overflow object, preserve it
obj=utils.isOverflow(leaf)?leaf:options.allowEmptyArrays&&(""===leaf||options.strictNullHandling&&null===leaf)?[]:utils.combine([],leaf,options.arrayLimit,options.plainObjects);else{obj=options.plainObjects?{__proto__:null}:{};var cleanRoot="["===root.charAt(0)&&"]"===root.charAt(root.length-1)?root.slice(1,-1):root,decodedRoot=options.decodeDotInKeys?cleanRoot.replace(/%2E/g,"."):cleanRoot,index=parseInt(decodedRoot,10),isValidArrayIndex=!isNaN(index)&&root!==decodedRoot&&String(index)===decodedRoot&&index>=0&&options.parseArrays;if(options.parseArrays||""!==decodedRoot)if(isValidArrayIndex&&index<options.arrayLimit)(obj=[])[index]=leaf;else{if(isValidArrayIndex&&options.throwOnLimitExceeded)throw new RangeError("Array limit exceeded. Only "+options.arrayLimit+" element"+(1===options.arrayLimit?"":"s")+" allowed in an array.");isValidArrayIndex?(obj[index]=leaf,utils.markOverflow(obj,index)):"__proto__"!==decodedRoot&&(obj[decodedRoot]=leaf)}else obj={0:leaf}}leaf=obj}return leaf}(keys,val,options,valuesParsed)}};module.exports=function(str,opts){var options=function(opts){if(!opts)return defaults;if(void 0!==opts.allowEmptyArrays&&"boolean"!=typeof opts.allowEmptyArrays)throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");if(void 0!==opts.decodeDotInKeys&&"boolean"!=typeof opts.decodeDotInKeys)throw new TypeError("`decodeDotInKeys` option can only be `true` or `false`, when provided");if(null!==opts.decoder&&void 0!==opts.decoder&&"function"!=typeof opts.decoder)throw new TypeError("Decoder has to be a function.");if(void 0!==opts.charset&&"utf-8"!==opts.charset&&"iso-8859-1"!==opts.charset)throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");if(void 0!==opts.throwOnLimitExceeded&&"boolean"!=typeof opts.throwOnLimitExceeded)throw new TypeError("`throwOnLimitExceeded` option must be a boolean");var charset=void 0===opts.charset?defaults.charset:opts.charset,duplicates=void 0===opts.duplicates?defaults.duplicates:opts.duplicates;if("combine"!==duplicates&&"first"!==duplicates&&"last"!==duplicates)throw new TypeError("The duplicates option must be either combine, first, or last");return{allowDots:void 0===opts.allowDots?!0===opts.decodeDotInKeys||defaults.allowDots:!!opts.allowDots,allowEmptyArrays:"boolean"==typeof opts.allowEmptyArrays?!!opts.allowEmptyArrays:defaults.allowEmptyArrays,allowPrototypes:"boolean"==typeof opts.allowPrototypes?opts.allowPrototypes:defaults.allowPrototypes,allowSparse:"boolean"==typeof opts.allowSparse?opts.allowSparse:defaults.allowSparse,arrayLimit:"number"==typeof opts.arrayLimit?opts.arrayLimit:defaults.arrayLimit,charset,charsetSentinel:"boolean"==typeof opts.charsetSentinel?opts.charsetSentinel:defaults.charsetSentinel,comma:"boolean"==typeof opts.comma?opts.comma:defaults.comma,decodeDotInKeys:"boolean"==typeof opts.decodeDotInKeys?opts.decodeDotInKeys:defaults.decodeDotInKeys,decoder:"function"==typeof opts.decoder?opts.decoder:defaults.decoder,delimiter:"string"==typeof opts.delimiter||utils.isRegExp(opts.delimiter)?opts.delimiter:defaults.delimiter,
// eslint-disable-next-line no-implicit-coercion, no-extra-parens
depth:"number"==typeof opts.depth||!1===opts.depth?+opts.depth:defaults.depth,duplicates,ignoreQueryPrefix:!0===opts.ignoreQueryPrefix,interpretNumericEntities:"boolean"==typeof opts.interpretNumericEntities?opts.interpretNumericEntities:defaults.interpretNumericEntities,parameterLimit:"number"==typeof opts.parameterLimit?opts.parameterLimit:defaults.parameterLimit,parseArrays:!1!==opts.parseArrays,plainObjects:"boolean"==typeof opts.plainObjects?opts.plainObjects:defaults.plainObjects,strictDepth:"boolean"==typeof opts.strictDepth?!!opts.strictDepth:defaults.strictDepth,strictMerge:"boolean"==typeof opts.strictMerge?!!opts.strictMerge:defaults.strictMerge,strictNullHandling:"boolean"==typeof opts.strictNullHandling?opts.strictNullHandling:defaults.strictNullHandling,throwOnLimitExceeded:"boolean"==typeof opts.throwOnLimitExceeded&&opts.throwOnLimitExceeded}}(opts);if(""===str||null==str)return options.plainObjects?{__proto__:null}:{};for(var tempObj="string"==typeof str?function(str,options){var obj={__proto__:null},cleanStr=options.ignoreQueryPrefix?str.replace(/^\?/,""):str;cleanStr=cleanStr.replace(/%5B/gi,"[").replace(/%5D/gi,"]");var limit=options.parameterLimit===1/0?void 0:options.parameterLimit,parts=cleanStr.split(options.delimiter,options.throwOnLimitExceeded?limit+1:limit);if(options.throwOnLimitExceeded&&parts.length>limit)throw new RangeError("Parameter limit exceeded. Only "+limit+" parameter"+(1===limit?"":"s")+" allowed.");var i,skipIndex=-1,charset=options.charset;// Keep track of where the utf8 sentinel was found
if(options.charsetSentinel)for(i=0;i<parts.length;++i)0===parts[i].indexOf("utf8=")&&("utf8=%E2%9C%93"===parts[i]?charset="utf-8":"utf8=%26%2310003%3B"===parts[i]&&(charset="iso-8859-1"),skipIndex=i,i=parts.length);for(i=0;i<parts.length;++i)if(i!==skipIndex){var key,val,part=parts[i],bracketEqualsPos=part.indexOf("]="),pos=-1===bracketEqualsPos?part.indexOf("="):bracketEqualsPos+1;if(-1===pos?(key=options.decoder(part,defaults.decoder,charset,"key"),val=options.strictNullHandling?null:""):null!==(key=options.decoder(part.slice(0,pos),defaults.decoder,charset,"key"))&&(val=utils.maybeMap(parseArrayValue(part.slice(pos+1),options,isArray(obj[key])?obj[key].length:0),function(encodedVal){return options.decoder(encodedVal,defaults.decoder,charset,"value")})),val&&options.interpretNumericEntities&&"iso-8859-1"===charset&&(val=interpretNumericEntities(String(val))),part.indexOf("[]=")>-1&&(val=isArray(val)?[val]:val),options.comma&&isArray(val)&&val.length>options.arrayLimit){if(options.throwOnLimitExceeded)throw new RangeError("Array limit exceeded. Only "+options.arrayLimit+" element"+(1===options.arrayLimit?"":"s")+" allowed in an array.");val=utils.combine([],val,options.arrayLimit,options.plainObjects)}if(null!==key){var existing=has.call(obj,key);existing&&("combine"===options.duplicates||part.indexOf("[]=")>-1)?obj[key]=utils.combine(obj[key],val,options.arrayLimit,options.plainObjects):existing&&"last"!==options.duplicates||(obj[key]=val)}}return obj}(str,options):str,obj=options.plainObjects?{__proto__:null}:{},keys=Object.keys(tempObj),i=0;i<keys.length;++i){var key=keys[i],newObj=parseKeys(key,tempObj[key],options,"string"==typeof str);obj=utils.merge(obj,newObj,options)}return!0===options.allowSparse?obj:utils.compact(obj)}},
/***/8636(module,__unused_webpack_exports,__webpack_require__){"use strict";var getSideChannel=__webpack_require__(920),utils=__webpack_require__(7720),formats=__webpack_require__(4765),has=Object.prototype.hasOwnProperty,arrayPrefixGenerators={brackets:function(prefix){return prefix+"[]"},comma:"comma",indices:function(prefix,key){return prefix+"["+key+"]"},repeat:function(prefix){return prefix}},isArray=Array.isArray,push=Array.prototype.push,pushToArray=function(arr,valueOrArray){push.apply(arr,isArray(valueOrArray)?valueOrArray:[valueOrArray])},toISO=Date.prototype.toISOString,defaultFormat=formats.default,defaults={addQueryPrefix:!1,allowDots:!1,allowEmptyArrays:!1,arrayFormat:"indices",charset:"utf-8",charsetSentinel:!1,commaRoundTrip:!1,delimiter:"&",encode:!0,encodeDotInKeys:!1,encoder:utils.encode,encodeValuesOnly:!1,filter:void 0,format:defaultFormat,formatter:formats.formatters[defaultFormat],
// deprecated
indices:!1,serializeDate:function(date){return toISO.call(date)},skipNulls:!1,strictNullHandling:!1},sentinel={},stringify=function stringify(object,prefix,generateArrayPrefix,commaRoundTrip,allowEmptyArrays,strictNullHandling,skipNulls,encodeDotInKeys,encoder,filter,sort,allowDots,serializeDate,format,formatter,encodeValuesOnly,charset,sideChannel){for(var v,obj=object,tmpSc=sideChannel,step=0,findFlag=!1;void 0!==(tmpSc=tmpSc.get(sentinel))&&!findFlag;){
// Where object last appeared in the ref tree
var pos=tmpSc.get(object);if(step+=1,void 0!==pos){if(pos===step)throw new RangeError("Cyclic object value");findFlag=!0}void 0===tmpSc.get(sentinel)&&(step=0)}if("function"==typeof filter?obj=filter(prefix,obj):obj instanceof Date?obj=serializeDate(obj):"comma"===generateArrayPrefix&&isArray(obj)&&(obj=utils.maybeMap(obj,function(value){return value instanceof Date?serializeDate(value):value})),null===obj){if(strictNullHandling)return encoder&&!encodeValuesOnly?encoder(prefix,defaults.encoder,charset,"key",format):prefix;obj=""}if("string"==typeof(v=obj)||"number"==typeof v||"boolean"==typeof v||"symbol"==typeof v||"bigint"==typeof v||utils.isBuffer(obj))return encoder?[formatter(encodeValuesOnly?prefix:encoder(prefix,defaults.encoder,charset,"key",format))+"="+formatter(encoder(obj,defaults.encoder,charset,"value",format))]:[formatter(prefix)+"="+formatter(String(obj))];var objKeys,values=[];if(void 0===obj)return values;if("comma"===generateArrayPrefix&&isArray(obj))
// we need to join elements in
encodeValuesOnly&&encoder&&(obj=utils.maybeMap(obj,encoder)),objKeys=[{value:obj.length>0?obj.join(",")||null:void 0}];else if(isArray(filter))objKeys=filter;else{var keys=Object.keys(obj);objKeys=sort?keys.sort(sort):keys}var encodedPrefix=encodeDotInKeys?String(prefix).replace(/\./g,"%2E"):String(prefix),adjustedPrefix=commaRoundTrip&&isArray(obj)&&1===obj.length?encodedPrefix+"[]":encodedPrefix;if(allowEmptyArrays&&isArray(obj)&&0===obj.length)return adjustedPrefix+"[]";for(var j=0;j<objKeys.length;++j){var key=objKeys[j],value="object"==typeof key&&key&&void 0!==key.value?key.value:obj[key];if(!skipNulls||null!==value){var encodedKey=allowDots&&encodeDotInKeys?String(key).replace(/\./g,"%2E"):String(key),keyPrefix=isArray(obj)?"function"==typeof generateArrayPrefix?generateArrayPrefix(adjustedPrefix,encodedKey):adjustedPrefix:adjustedPrefix+(allowDots?"."+encodedKey:"["+encodedKey+"]");sideChannel.set(object,step);var valueSideChannel=getSideChannel();valueSideChannel.set(sentinel,sideChannel),pushToArray(values,stringify(value,keyPrefix,generateArrayPrefix,commaRoundTrip,allowEmptyArrays,strictNullHandling,skipNulls,encodeDotInKeys,"comma"===generateArrayPrefix&&encodeValuesOnly&&isArray(obj)?null:encoder,filter,sort,allowDots,serializeDate,format,formatter,encodeValuesOnly,charset,valueSideChannel))}}return values};module.exports=function(object,opts){var objKeys,obj=object,options=function(opts){if(!opts)return defaults;if(void 0!==opts.allowEmptyArrays&&"boolean"!=typeof opts.allowEmptyArrays)throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");if(void 0!==opts.encodeDotInKeys&&"boolean"!=typeof opts.encodeDotInKeys)throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");if(null!==opts.encoder&&void 0!==opts.encoder&&"function"!=typeof opts.encoder)throw new TypeError("Encoder has to be a function.");var charset=opts.charset||defaults.charset;if(void 0!==opts.charset&&"utf-8"!==opts.charset&&"iso-8859-1"!==opts.charset)throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");var format=formats.default;if(void 0!==opts.format){if(!has.call(formats.formatters,opts.format))throw new TypeError("Unknown format option provided.");format=opts.format}var arrayFormat,formatter=formats.formatters[format],filter=defaults.filter;if(("function"==typeof opts.filter||isArray(opts.filter))&&(filter=opts.filter),arrayFormat=opts.arrayFormat in arrayPrefixGenerators?opts.arrayFormat:"indices"in opts?opts.indices?"indices":"repeat":defaults.arrayFormat,"commaRoundTrip"in opts&&"boolean"!=typeof opts.commaRoundTrip)throw new TypeError("`commaRoundTrip` must be a boolean, or absent");var allowDots=void 0===opts.allowDots?!0===opts.encodeDotInKeys||defaults.allowDots:!!opts.allowDots;return{addQueryPrefix:"boolean"==typeof opts.addQueryPrefix?opts.addQueryPrefix:defaults.addQueryPrefix,allowDots,allowEmptyArrays:"boolean"==typeof opts.allowEmptyArrays?!!opts.allowEmptyArrays:defaults.allowEmptyArrays,arrayFormat,charset,charsetSentinel:"boolean"==typeof opts.charsetSentinel?opts.charsetSentinel:defaults.charsetSentinel,commaRoundTrip:!!opts.commaRoundTrip,delimiter:void 0===opts.delimiter?defaults.delimiter:opts.delimiter,encode:"boolean"==typeof opts.encode?opts.encode:defaults.encode,encodeDotInKeys:"boolean"==typeof opts.encodeDotInKeys?opts.encodeDotInKeys:defaults.encodeDotInKeys,encoder:"function"==typeof opts.encoder?opts.encoder:defaults.encoder,encodeValuesOnly:"boolean"==typeof opts.encodeValuesOnly?opts.encodeValuesOnly:defaults.encodeValuesOnly,filter,format,formatter,serializeDate:"function"==typeof opts.serializeDate?opts.serializeDate:defaults.serializeDate,skipNulls:"boolean"==typeof opts.skipNulls?opts.skipNulls:defaults.skipNulls,sort:"function"==typeof opts.sort?opts.sort:null,strictNullHandling:"boolean"==typeof opts.strictNullHandling?opts.strictNullHandling:defaults.strictNullHandling}}(opts);"function"==typeof options.filter?obj=(0,options.filter)("",obj):isArray(options.filter)&&(objKeys=options.filter);var keys=[];if("object"!=typeof obj||null===obj)return"";var generateArrayPrefix=arrayPrefixGenerators[options.arrayFormat],commaRoundTrip="comma"===generateArrayPrefix&&options.commaRoundTrip;objKeys||(objKeys=Object.keys(obj)),options.sort&&objKeys.sort(options.sort);for(var sideChannel=getSideChannel(),i=0;i<objKeys.length;++i){var key=objKeys[i],value=obj[key];options.skipNulls&&null===value||pushToArray(keys,stringify(value,key,generateArrayPrefix,commaRoundTrip,options.allowEmptyArrays,options.strictNullHandling,options.skipNulls,options.encodeDotInKeys,options.encode?options.encoder:null,options.filter,options.sort,options.allowDots,options.serializeDate,options.format,options.formatter,options.encodeValuesOnly,options.charset,sideChannel))}var joined=keys.join(options.delimiter),prefix=!0===options.addQueryPrefix?"?":"";return options.charsetSentinel&&("iso-8859-1"===options.charset?
// encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
prefix+="utf8=%26%2310003%3B&":
// encodeURIComponent('✓')
prefix+="utf8=%E2%9C%93&"),joined.length>0?prefix+joined:""}},
/***/7720(module,__unused_webpack_exports,__webpack_require__){"use strict";var formats=__webpack_require__(4765),getSideChannel=__webpack_require__(920),has=Object.prototype.hasOwnProperty,isArray=Array.isArray,overflowChannel=getSideChannel(),markOverflow=function(obj,maxIndex){return overflowChannel.set(obj,maxIndex),obj},isOverflow=function(obj){return overflowChannel.has(obj)},getMaxIndex=function(obj){return overflowChannel.get(obj)},setMaxIndex=function(obj,maxIndex){overflowChannel.set(obj,maxIndex)},hexTable=function(){for(var array=[],i=0;i<256;++i)array[array.length]="%"+((i<16?"0":"")+i.toString(16)).toUpperCase();return array}(),arrayToObject=function(source,options){for(var obj=options&&options.plainObjects?{__proto__:null}:{},i=0;i<source.length;++i)void 0!==source[i]&&(obj[i]=source[i]);return obj};module.exports={arrayToObject,assign:function(target,source){return Object.keys(source).reduce(function(acc,key){return acc[key]=source[key],acc},target)},combine:function(a,b,arrayLimit,plainObjects){
// If 'a' is already an overflow object, add to it
if(isOverflow(a)){var newIndex=getMaxIndex(a)+1;return a[newIndex]=b,setMaxIndex(a,newIndex),a}var result=[].concat(a,b);return result.length>arrayLimit?markOverflow(arrayToObject(result,{plainObjects}),result.length-1):result},compact:function(value){for(var queue=[{obj:{o:value},prop:"o"}],refs=[],i=0;i<queue.length;++i)for(var item=queue[i],obj=item.obj[item.prop],keys=Object.keys(obj),j=0;j<keys.length;++j){var key=keys[j],val=obj[key];"object"==typeof val&&null!==val&&-1===refs.indexOf(val)&&(queue[queue.length]={obj,prop:key},refs[refs.length]=val)}return function(queue){for(;queue.length>1;){var item=queue.pop(),obj=item.obj[item.prop];if(isArray(obj)){for(var compacted=[],j=0;j<obj.length;++j)void 0!==obj[j]&&(compacted[compacted.length]=obj[j]);item.obj[item.prop]=compacted}}}(queue),value},decode:function(str,defaultDecoder,charset){var strWithoutPlus=str.replace(/\+/g," ");if("iso-8859-1"===charset)
// unescape never throws, no try...catch needed:
return strWithoutPlus.replace(/%[0-9a-f]{2}/gi,unescape);
// utf-8
try{return decodeURIComponent(strWithoutPlus)}catch(e){return strWithoutPlus}},encode:function(str,defaultEncoder,charset,kind,format){
// This code was originally written by Brian White (mscdex) for the io.js core querystring library.
// It has been adapted here for stricter adherence to RFC 3986
if(0===str.length)return str;var string=str;if("symbol"==typeof str?string=Symbol.prototype.toString.call(str):"string"!=typeof str&&(string=String(str)),"iso-8859-1"===charset)return escape(string).replace(/%u[0-9a-f]{4}/gi,function($0){return"%26%23"+parseInt($0.slice(2),16)+"%3B"});for(var out="",j=0;j<string.length;j+=1024){for(var segment=string.length>=1024?string.slice(j,j+1024):string,arr=[],i=0;i<segment.length;++i){var c=segment.charCodeAt(i);45===c||46===c||95===c||126===c||c>=48&&c<=57||c>=65&&c<=90||c>=97&&c<=122||format===formats.RFC1738&&(40===c||41===c)?arr[arr.length]=segment.charAt(i):c<128?arr[arr.length]=hexTable[c]:c<2048?arr[arr.length]=hexTable[192|c>>6]+hexTable[128|63&c]:c<55296||c>=57344?arr[arr.length]=hexTable[224|c>>12]+hexTable[128|c>>6&63]+hexTable[128|63&c]:(i+=1,c=65536+((1023&c)<<10|1023&segment.charCodeAt(i)),arr[arr.length]=hexTable[240|c>>18]+hexTable[128|c>>12&63]+hexTable[128|c>>6&63]+hexTable[128|63&c])}out+=arr.join("")}return out},isBuffer:function(obj){return!(!obj||"object"!=typeof obj)&&!!(obj.constructor&&obj.constructor.isBuffer&&obj.constructor.isBuffer(obj))},isOverflow,isRegExp:function(obj){return"[object RegExp]"===Object.prototype.toString.call(obj)},markOverflow,maybeMap:function(val,fn){if(isArray(val)){for(var mapped=[],i=0;i<val.length;i+=1)mapped[mapped.length]=fn(val[i]);return mapped}return fn(val)},merge:function merge(target,source,options){
/* eslint no-param-reassign: 0 */
if(!source)return target;if("object"!=typeof source&&"function"!=typeof source){if(isArray(target)){var nextIndex=target.length;if(options&&"number"==typeof options.arrayLimit&&nextIndex>options.arrayLimit)return markOverflow(arrayToObject(target.concat(source),options),nextIndex);target[nextIndex]=source}else{if(!target||"object"!=typeof target)return[target,source];if(isOverflow(target)){
// Add at next numeric index for overflow objects
var newIndex=getMaxIndex(target)+1;target[newIndex]=source,setMaxIndex(target,newIndex)}else{if(options&&options.strictMerge)return[target,source];(options&&(options.plainObjects||options.allowPrototypes)||!has.call(Object.prototype,source))&&(target[source]=!0)}}return target}if(!target||"object"!=typeof target){if(isOverflow(source)){for(
// Create new object with target at 0, source values shifted by 1
var sourceKeys=Object.keys(source),result=options&&options.plainObjects?{__proto__:null,0:target}:{0:target},m=0;m<sourceKeys.length;m++){result[parseInt(sourceKeys[m],10)+1]=source[sourceKeys[m]]}return markOverflow(result,getMaxIndex(source)+1)}var combined=[target].concat(source);return options&&"number"==typeof options.arrayLimit&&combined.length>options.arrayLimit?markOverflow(arrayToObject(combined,options),combined.length-1):combined}var mergeTarget=target;return isArray(target)&&!isArray(source)&&(mergeTarget=arrayToObject(target,options)),isArray(target)&&isArray(source)?(source.forEach(function(item,i){if(has.call(target,i)){var targetItem=target[i];targetItem&&"object"==typeof targetItem&&item&&"object"==typeof item?target[i]=merge(targetItem,item,options):target[target.length]=item}else target[i]=item}),target):Object.keys(source).reduce(function(acc,key){var value=source[key];if(has.call(acc,key)?acc[key]=merge(acc[key],value,options):acc[key]=value,isOverflow(source)&&!isOverflow(acc)&&markOverflow(acc,getMaxIndex(source)),isOverflow(acc)){var keyNum=parseInt(key,10);String(keyNum)===key&&keyNum>=0&&keyNum>getMaxIndex(acc)&&setMaxIndex(acc,keyNum)}return acc},mergeTarget)}}},
/***/4803(module,__unused_webpack_exports,__webpack_require__){"use strict";var inspect=__webpack_require__(8859),$TypeError=__webpack_require__(9675),listGetNode=function(list,key,isDelete){
// eslint-disable-next-line eqeqeq
for(
/** @type {typeof list | NonNullable<(typeof list)['next']>} */
var curr,prev=list
/** @type {(typeof list)['next']} */;null!=(curr=prev.next);prev=curr)if(curr.key===key)return prev.next=curr.next,isDelete||(
// eslint-disable-next-line no-extra-parens
curr.next=/** @type {NonNullable<typeof list.next>} */list.next,list.next=curr),curr};
/** @type {import('.')} */
module.exports=function(){
/** @typedef {ReturnType<typeof getSideChannelList>} Channel */
/** @typedef {Parameters<Channel['get']>[0]} K */
/** @typedef {Parameters<Channel['set']>[1]} V */
/** @type {import('./list.d.ts').RootNode<V, K> | undefined} */var $o,channel={assert:function(key){if(!channel.has(key))throw new $TypeError("Side channel does not contain "+inspect(key))},delete:function(key){var root=$o&&$o.next,deletedNode=function(objects,key){if(objects)return listGetNode(objects,key,!0)}($o,key);return deletedNode&&root&&root===deletedNode&&($o=void 0),!!deletedNode},get:function(key){return function(objects,key){if(objects){var node=listGetNode(objects,key);return node&&node.value}}($o,key)},has:function(key){return function(objects,key){return!!objects&&!!listGetNode(objects,key)}($o,key)},set:function(key,value){$o||(
// Initialize the linked list as an empty node, so that we don't have to special-case handling of the first node: we can always refer to it as (previous node).next, instead of something like (list).head
$o={next:void 0}),
// eslint-disable-next-line no-extra-parens
function(objects,key,value){var node=listGetNode(objects,key);node?node.value=value:
// Prepend the new node to the beginning of the list
objects.next=/** @type {import('./list.d.ts').ListNode<typeof value, typeof key>} */{// eslint-disable-line no-param-reassign, no-extra-parens
key,next:objects.next,value}}(/** @type {NonNullable<typeof $o>} */$o,key,value)}};
/** @type {Channel} */
// @ts-expect-error TODO: figure out why this is erroring
return channel}},
/***/507(module,__unused_webpack_exports,__webpack_require__){"use strict";var GetIntrinsic=__webpack_require__(453),callBound=__webpack_require__(6556),inspect=__webpack_require__(8859),$TypeError=__webpack_require__(9675),$Map=GetIntrinsic("%Map%",!0),$mapGet=callBound("Map.prototype.get",!0),$mapSet=callBound("Map.prototype.set",!0),$mapHas=callBound("Map.prototype.has",!0),$mapDelete=callBound("Map.prototype.delete",!0),$mapSize=callBound("Map.prototype.size",!0);
/** @type {import('.')} */
module.exports=!!$Map&&/** @type {Exclude<import('.'), false>} */function(){
/** @typedef {ReturnType<typeof getSideChannelMap>} Channel */
/** @typedef {Parameters<Channel['get']>[0]} K */
/** @typedef {Parameters<Channel['set']>[1]} V */
/** @type {Map<K, V> | undefined} */var $m,channel={assert:function(key){if(!channel.has(key))throw new $TypeError("Side channel does not contain "+inspect(key))},delete:function(key){if($m){var result=$mapDelete($m,key);return 0===$mapSize($m)&&($m=void 0),result}return!1},get:function(key){// eslint-disable-line consistent-return
if($m)return $mapGet($m,key)},has:function(key){return!!$m&&$mapHas($m,key)},set:function(key,value){$m||(
// @ts-expect-error TS can't handle narrowing a variable inside a closure
$m=new $Map),$mapSet($m,key,value)}};
/** @type {Channel} */
// @ts-expect-error TODO: figure out why TS is erroring here
return channel}},
/***/2271(module,__unused_webpack_exports,__webpack_require__){"use strict";var GetIntrinsic=__webpack_require__(453),callBound=__webpack_require__(6556),inspect=__webpack_require__(8859),getSideChannelMap=__webpack_require__(507),$TypeError=__webpack_require__(9675),$WeakMap=GetIntrinsic("%WeakMap%",!0),$weakMapGet=callBound("WeakMap.prototype.get",!0),$weakMapSet=callBound("WeakMap.prototype.set",!0),$weakMapHas=callBound("WeakMap.prototype.has",!0),$weakMapDelete=callBound("WeakMap.prototype.delete",!0);
/** @type {import('.')} */
module.exports=$WeakMap?/** @type {Exclude<import('.'), false>} */function(){
/** @typedef {ReturnType<typeof getSideChannelWeakMap>} Channel */
/** @typedef {Parameters<Channel['get']>[0]} K */
/** @typedef {Parameters<Channel['set']>[1]} V */
/** @type {WeakMap<K & object, V> | undefined} */var $wm,$m,channel={assert:function(key){if(!channel.has(key))throw new $TypeError("Side channel does not contain "+inspect(key))},delete:function(key){if($WeakMap&&key&&("object"==typeof key||"function"==typeof key)){if($wm)return $weakMapDelete($wm,key)}else if(getSideChannelMap&&$m)return $m.delete(key);return!1},get:function(key){return $WeakMap&&key&&("object"==typeof key||"function"==typeof key)&&$wm?$weakMapGet($wm,key):$m&&$m.get(key)},has:function(key){return $WeakMap&&key&&("object"==typeof key||"function"==typeof key)&&$wm?$weakMapHas($wm,key):!!$m&&$m.has(key)},set:function(key,value){$WeakMap&&key&&("object"==typeof key||"function"==typeof key)?($wm||($wm=new $WeakMap),$weakMapSet($wm,key,value)):getSideChannelMap&&($m||($m=getSideChannelMap()),
// eslint-disable-next-line no-extra-parens
/** @type {NonNullable<typeof $m>} */$m.set(key,value))}};
/** @type {Channel | undefined} */
// @ts-expect-error TODO: figure out why this is erroring
return channel}:getSideChannelMap},
/***/920(module,__unused_webpack_exports,__webpack_require__){"use strict";var $TypeError=__webpack_require__(9675),inspect=__webpack_require__(8859),getSideChannelList=__webpack_require__(4803),getSideChannelMap=__webpack_require__(507),makeChannel=__webpack_require__(2271)||getSideChannelMap||getSideChannelList;
/** @type {import('.')} */
module.exports=function(){
/** @typedef {ReturnType<typeof getSideChannel>} Channel */
/** @type {Channel | undefined} */var $channelData,channel={assert:function(key){if(!channel.has(key))throw new $TypeError("Side channel does not contain "+inspect(key))},delete:function(key){return!!$channelData&&$channelData.delete(key)},get:function(key){return $channelData&&$channelData.get(key)},has:function(key){return!!$channelData&&$channelData.has(key)},set:function(key,value){$channelData||($channelData=makeChannel()),$channelData.set(key,value)}};
/** @type {Channel} */
// @ts-expect-error TODO: figure out why this is erroring
return channel}},
/***/4195(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Defaults=void 0;class Defaults{}exports.Defaults=Defaults,
/** Default texture size applied to both width & length. */
Defaults.TEXTURE_SIZE=4096,
/** Default number of horizontal/vertical bands per glyph for spatial indexing. */
Defaults.BAND_COUNT=32,Defaults.FONT_SIZE=24,
/** Maximum allowed supersample count. The shader has patterns up to 16 samples. */
Defaults.MAX_SUPERSAMPLE_COUNT=16,Defaults.SlugText={
/** Default font size in pixels. */
FontSize:24,Text:"",WordWrap:!1,WordWrapwidth:0,Supersampling:!1,
/** Default number of supersamples when supersampling is enabled. */
SupersampleCount:4,
/** Fill color default (white, fully opaque). */
FillColor:[1,1,1,1],
/** Stroke defaults. Width 0 = disabled. */
StrokeWidth:0,StrokeColor:[0,0,0,1],StrokeAlphaMode:"uniform",StrokeAlphaStart:1,StrokeAlphaRate:0,
/** Drop shadow defaults (matches PIXI.Text). */
DropShadowAlpha:1,DropShadowAngle:Math.PI/6,DropShadowBlur:0,DropShadowColor:[0,0,0,1],DropShadowDistance:5}},
/***/8330(__unused_webpack_module,exports,__webpack_require__){"use strict";var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.SlugFont=void 0;const opentype_js_1=__importDefault(__webpack_require__(945)),defaults_1=__webpack_require__(4195),curves_1=__webpack_require__(5708),bands_1=__webpack_require__(1382),pack_1=__webpack_require__(8238);exports.SlugFont=
/**
 * Preprocesses font glyph outlines into GPU-ready curve and band textures
 * for the Slug rendering algorithm.
 */
class{constructor(textureWidth=defaults_1.Defaults.TEXTURE_SIZE){if(textureWidth<=0||textureWidth&textureWidth-1)throw new Error(`textureWidth must be a power of 2, got ${textureWidth}`);this.textureWidth=textureWidth,this.curveData=new Float32Array(0),this.bandData=new Uint32Array(0),this.glyphs=new Map,this.advances=new Map,this.unitsPerEm=0,this.ascender=0,this.descender=0,this.gpuCache=null,this._gpuDestroy=null}
/**
     * Set the GPU cache cleanup function. Called by version-specific factories
     * (e.g. slugFontGpuV8) when they populate gpuCache.
     */setGpuDestroy(fn){this._gpuDestroy=fn}
/**
     * Destroy GPU resources (textures, etc.) owned by this font.
     * Call only after all SlugText instances using this font are destroyed.
     */destroyGpu(){this._gpuDestroy&&(this._gpuDestroy(),this._gpuDestroy=null),this.gpuCache=null}
/**
     * GPU memory consumed by this font's curve and band textures, in bytes.
     * Both textures use rgba32float (4 channels × 4 bytes per texel).
     * Band data is uint32 reinterpreted as float32 bit patterns on upload.
     * This is shared across all SlugText instances that use this font.
     */memoryBytes(){const textureWidth=this.textureWidth;// rgba32float
return((Math.ceil(this.curveData.length/4/textureWidth)||1)+(Math.ceil(this.bandData.length/4/textureWidth)||1))*textureWidth*16}async load(fontData){const font=opentype_js_1.default.parse(fontData);this.unitsPerEm=font.unitsPerEm,this.ascender=font.ascender,this.descender=font.descender;const glyphList=[];for(let i=0;i<font.glyphs.length;i++){const glyph=font.glyphs.get(i),charCode=glyph.unicode;if(
// Store advance width for all glyphs (including space/empty)
void 0!==charCode&&glyph.advanceWidth&&this.advances.set(charCode,glyph.advanceWidth),!glyph.path||0===glyph.path.commands.length)continue;if(void 0===charCode)continue;
// Extract quadratic Bezier curves from glyph path
const{curves,contourStarts}=(0,curves_1.slugGlyphCurves)(glyph.path.commands);if(0===curves.length)continue;
// Compute bounding box from glyph metrics
const bounds=glyph.getBoundingBox(),bandResult=(0,bands_1.slugGlyphBands)(curves,bounds.x1,bounds.y1,bounds.x2,bounds.y2),glyphData={charCode,curves,contourStarts,bounds:{minX:bounds.x1,minY:bounds.y1,maxX:bounds.x2,maxY:bounds.y2},advanceWidth:glyph.advanceWidth??0,lsb:glyph.leftSideBearing??0,hBandCount:bandResult.hBandCount,vBandCount:bandResult.vBandCount,hBands:bandResult.hBands,vBands:bandResult.vBands,curveOffset:0,bandOffset:0};
// Compute band assignments
glyphList.push(glyphData),this.glyphs.set(charCode,glyphData)}
// Pack all glyph data into GPU textures
const packed=(0,pack_1.slugTexturePack)(glyphList,this.textureWidth);this.curveData=packed.curveData,this.bandData=packed.bandData,
// Invalidate any existing GPU cache since font data changed.
this.destroyGpu()}}},
/***/1382(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugGlyphBands=
/**
 * Assign curves to horizontal and vertical bands for spatial indexing.
 * The glyph's bounding box is divided into a grid of bands.
 * Each band records which curves overlap it, so the fragment shader
 * only tests the relevant subset of curves per pixel.
 */
function(curves,boundsMinX,boundsMinY,boundsMaxX,boundsMaxY,bandCount=defaults_1.Defaults.BAND_COUNT){const width=boundsMaxX-boundsMinX,height=boundsMaxY-boundsMinY;
// Avoid division by zero for zero-area glyphs (e.g. space)
if(width<1e-10||height<1e-10||0===curves.length)return{hBandCount:0,vBandCount:0,hBands:[],vBands:[]};const hBandCount=Math.min(bandCount,curves.length),vBandCount=Math.min(bandCount,curves.length),hBands=[],vBands=[];for(let i=0;i<hBandCount;i++)hBands.push([]);for(let i=0;i<vBandCount;i++)vBands.push([]);
// Compute bandScale and bandOffset using float32 round-trip to match GPU precision.
// The shader receives these as float32 vertex attributes and computes:
//   bandIndex = int(renderCoord * bandScale + bandOffset)
// where renderCoord is also float32. Using float64 here would assign curves to
// bands that the shader never selects, causing missing-curve artifacts.

// Use a SINGLE shared scale for both axes (square band grid), matching the
// reference implementation. The scale is based on the larger dimension so both
// axes fit within the band count. The narrower axis won't span all bands.
const maxDim=Math.max(width,height),clampedBandCount=Math.max(hBandCount,vBandCount),_f32=new Float32Array(4);_f32[0]=clampedBandCount/maxDim;// shared bandScale (float32)
const bandScale=_f32[0];_f32[1]=-boundsMinY*bandScale,// hBandOffset
_f32[2]=-boundsMinX*bandScale;// vBandOffset
const hBandScale=bandScale,hBandOffset=_f32[1],vBandScale=bandScale,vBandOffset=_f32[2];for(let i=0;i<curves.length;i++){const[cMinX,cMinY,cMaxX,cMaxY]=curveBounds(curves[i]),hStart=Math.max(0,Math.floor(cMinY*hBandScale+hBandOffset)-1),hEnd=Math.min(hBandCount-1,Math.floor(cMaxY*hBandScale+hBandOffset)+1);
// Compute band range using the same float32 arithmetic the shader uses.
// Extend by 1 band on each side as a safety margin: the shader's float32
// band-index calculation may round differently than the CPU's, placing a
// pixel in an adjacent band. Without this margin, curves at band boundaries
// are missing from one side, producing horizontal/vertical line artifacts
// that shift with the text's screen position.
for(let b=hStart;b<=hEnd;b++)hBands[b].push(i);const vStart=Math.max(0,Math.floor(cMinX*vBandScale+vBandOffset)-1),vEnd=Math.min(vBandCount-1,Math.floor(cMaxX*vBandScale+vBandOffset)+1);for(let b=vStart;b<=vEnd;b++)vBands[b].push(i)}
// Sort each band's curve list in descending order of max coordinate.
// frag.glsl breaks early once max coord drops below the pixel threshold,
// so the sort order must be descending for the early-exit to be correct.
for(let b=0;b<hBandCount;b++)hBands[b].sort((a,b)=>{const maxXa=Math.max(curves[a].p1x,curves[a].p2x,curves[a].p3x);return Math.max(curves[b].p1x,curves[b].p2x,curves[b].p3x)-maxXa});for(let b=0;b<vBandCount;b++)vBands[b].sort((a,b)=>{const maxYa=Math.max(curves[a].p1y,curves[a].p2y,curves[a].p3y);return Math.max(curves[b].p1y,curves[b].p2y,curves[b].p3y)-maxYa});return{hBandCount,vBandCount,hBands,vBands}}
/***/;const defaults_1=__webpack_require__(4195),_boundsF32=new Float32Array(6);
/**
 * Compute the axis-aligned bounding box of a quadratic Bezier curve.
 * Returns [minX, minY, maxX, maxY].
 *
 * Uses float32-truncated coordinates to match what the GPU sees in the curve
 * texture (see port_risks.md JS-1). Without this, a curve whose float64 bounds
 * barely reach into band N might not reach it in float32, causing the shader
 * to miss the curve at that band boundary → horizontal/vertical line artifacts.
 */function curveBounds(curve){
// Truncate to float32 to match the precision stored in the curve texture.
_boundsF32[0]=curve.p1x,_boundsF32[1]=curve.p1y,_boundsF32[2]=curve.p2x,_boundsF32[3]=curve.p2y,_boundsF32[4]=curve.p3x,_boundsF32[5]=curve.p3y;const p1x=_boundsF32[0],p1y=_boundsF32[1],p2x=_boundsF32[2],p2y=_boundsF32[3],p3x=_boundsF32[4],p3y=_boundsF32[5];
// For a quadratic Bezier B(t) = (1-t)^2*p1 + 2(1-t)t*p2 + t^2*p3,
// the extrema occur at t = (p1 - p2) / (p1 - 2*p2 + p3) for each axis.
let minX=Math.min(p1x,p3x),maxX=Math.max(p1x,p3x),minY=Math.min(p1y,p3y),maxY=Math.max(p1y,p3y);
// Check x-axis extremum
const denomX=p1x-2*p2x+p3x;if(Math.abs(denomX)>1e-10){const tx=(p1x-p2x)/denomX;if(tx>0&&tx<1){const oneMinusT=1-tx,ex=oneMinusT*oneMinusT*p1x+2*oneMinusT*tx*p2x+tx*tx*p3x;minX=Math.min(minX,ex),maxX=Math.max(maxX,ex)}}
// Check y-axis extremum
const denomY=p1y-2*p2y+p3y;if(Math.abs(denomY)>1e-10){const ty=(p1y-p2y)/denomY;if(ty>0&&ty<1){const oneMinusT=1-ty,ey=oneMinusT*oneMinusT*p1y+2*oneMinusT*ty*p2y+ty*ty*p3y;minY=Math.min(minY,ey),maxY=Math.max(maxY,ey)}}return[minX,minY,maxX,maxY]}},
/***/5708(__unused_webpack_module,exports){"use strict";
/**
 * Convert a cubic Bezier curve to two quadratic Bezier approximations.
 * This is an approximation — a single cubic can't be exactly represented
 * by one quadratic, so we split at t=0.5 and fit each half with the
 * best-fit quadratic control point: (3*(p1+p2) - p0 - p3) / 4.
 */
function cubicToQuadratics(x0,y0,x1,y1,x2,y2,x3,y3){
// Split cubic [x0,x1,x2,x3] at t=0.5 using de Casteljau to get
// two cubic halves: [x0, q0, r0, mid] and [mid, r1, q2, x3].
const q0x=.5*(x0+x1),q0y=.5*(y0+y1),mx=.5*(x1+x2),my=.5*(y1+y2),q2x=.5*(x2+x3),q2y=.5*(y2+y3),r0x=.5*(q0x+mx),r0y=.5*(q0y+my),r1x=.5*(mx+q2x),r1y=.5*(my+q2y),midX=.5*(r0x+r1x),midY=.5*(r0y+r1y);return[{p1x:x0,p1y:y0,p2x:.25*(3*(q0x+r0x)-x0-midX),p2y:.25*(3*(q0y+r0y)-y0-midY),p3x:midX,p3y:midY},{p1x:midX,p1y:midY,p2x:.25*(3*(r1x+q2x)-midX-x3),p2y:.25*(3*(r1y+q2y)-midY-y3),p3x:x3,p3y:y3}]}
/**
 * Convert a line segment to a degenerate quadratic Bezier curve.
 * The control point is placed at the midpoint so the curve evaluates
 * as a straight line.
 */function lineToQuadratic(x0,y0,x1,y1){return{p1x:x0,p1y:y0,p2x:.5*(x0+x1),p2y:.5*(y0+y1),p3x:x1,p3y:y1}}
/**
 * Extract quadratic Bezier curves from an opentype.js path command list.
 * Converts lines and cubic Beziers to quadratics so the Slug shader
 * only needs to handle one curve type.
 *
 * Returns both the curves and contour boundary indices for shared-endpoint
 * texture packing.
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.lineToQuadratic=lineToQuadratic,exports.slugGlyphCurves=function(commands){const curves=[],contourStarts=[];let curX=0,curY=0,subpathStartX=0,subpathStartY=0;for(const cmd of commands)switch(cmd.type){case"M":contourStarts.push(curves.length),curX=cmd.x,curY=cmd.y,subpathStartX=cmd.x,subpathStartY=cmd.y;break;case"L":curves.push(lineToQuadratic(curX,curY,cmd.x,cmd.y)),curX=cmd.x,curY=cmd.y;break;case"Q":curves.push({p1x:curX,p1y:curY,p2x:cmd.x1,p2y:cmd.y1,p3x:cmd.x,p3y:cmd.y}),curX=cmd.x,curY=cmd.y;break;case"C":curves.push(...cubicToQuadratics(curX,curY,cmd.x1,cmd.y1,cmd.x2,cmd.y2,cmd.x,cmd.y)),curX=cmd.x,curY=cmd.y;break;case"Z":
// Close path: add closing line if the current position is not already at the subpath start.
(Math.abs(curX-subpathStartX)>1e-6||Math.abs(curY-subpathStartY)>1e-6)&&curves.push(lineToQuadratic(curX,curY,subpathStartX,subpathStartY)),curX=subpathStartX,curY=subpathStartY}return{curves,contourStarts}}
/***/},
/***/2727(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugGlyphQuads=slugGlyphQuads,exports.slugGlyphQuadsMultiline=
/**
 * Build quads for multiple lines of text with vertical line spacing.
 * Each line is laid out at a Y offset of `lineIndex * lineHeight` pixels.
 * All lines share a single vertex/index buffer for efficient rendering.
 *
 * @param lines			Array of text strings, one per line.
 * @param glyphs		Glyph data map from SlugFont.
 * @param advances		Advance width map for all glyphs.
 * @param unitsPerEm	Font units per em.
 * @param fontSize		Desired font size in pixels.
 * @param textureWidth	Width of the curve/band textures.
 * @param lineHeight	Vertical distance between lines in pixels.
 * @param color			Text color as [r, g, b, a] in 0-1 range.
 * @param extraExpand	Extra outward expansion in pixels per side.
 */
function(lines,glyphs,advances,unitsPerEm,fontSize,textureWidth,lineHeight,color=[1,1,1,1],extraExpand=0){if(lines.length<=1)return slugGlyphQuads(lines[0]||"",glyphs,advances,unitsPerEm,fontSize,textureWidth,color,extraExpand);
// Build quads per line, then merge into a single buffer.
const perLine=[];let totalQuads=0;for(let l=0;l<lines.length;l++){const q=slugGlyphQuads(lines[l],glyphs,advances,unitsPerEm,fontSize,textureWidth,color,extraExpand);perLine.push(q),totalQuads+=q.quadCount}if(0===totalQuads)return{vertices:new Float32Array(0),indices:new Uint32Array(0),quadCount:0};const totalIdxs=6*totalQuads,vertices=new Float32Array(4*totalQuads*20),indices=new Uint32Array(totalIdxs);let vertOffset=0,idxOffset=0,baseVertex=0;for(let l=0;l<perLine.length;l++){const q=perLine[l];if(0===q.quadCount)continue;const yShift=l*lineHeight,srcVerts=q.vertices,srcIdxs=q.indices;
// Copy vertices with Y offset applied to position (float index 1 per vertex)
for(let v=0;v<4*q.quadCount;v++){const srcOff=20*v,dstOff=vertOffset+srcOff;
// Copy all 20 floats
for(let f=0;f<20;f++)vertices[dstOff+f]=srcVerts[srcOff+f];
// Shift posY (index 1) by line offset
vertices[dstOff+1]+=yShift}
// Copy indices with base vertex offset
for(let j=0;j<srcIdxs.length;j++)indices[idxOffset+j]=srcIdxs[j]+baseVertex;vertOffset+=4*q.quadCount*20,idxOffset+=srcIdxs.length,baseVertex+=4*q.quadCount}return{vertices,indices,quadCount:totalQuads}}
/***/;
/**
 * Number of floats per vertex for each attribute.
 * All 5 attributes are vec4 (4 floats each), totaling 20 floats per vertex.
 */
const _packBuf=new ArrayBuffer(4),_packU32=new Uint32Array(_packBuf),_packF32=new Float32Array(_packBuf),_f32=new Float32Array(4);
/** Number of vertices per glyph quad. */
/**
 * Pack a float into a uint32 bit pattern, stored as a float.
 * Used to pass packed integer data through float vertex attributes.
 */
function packUint16Pair(low,high){return _packU32[0]=(65535&high)<<16|65535&low,_packF32[0]}
/**
 * Pack band max indices into a single float via uint32 reinterpretation.
 * low16 becomes glyphData.z (bandMax.x) in the shader → clamps vertical bandIndex.x.
 * high16 becomes glyphData.w (bandMax.y) in the shader → clamps horizontal bandIndex.y.
 */function packBandMax(low16_vBandMax,high16_hBandMax){return packUint16Pair(low16_vBandMax,high16_hBandMax)}
/**
 * Build per-glyph quads with the 5 vertex attributes required by the Slug shaders.
 *
 * For each character in the text string, looks up the glyph data from the font
 * and emits a quad (4 vertices, 6 indices) with:
 *   - aPositionNormal (vec4): position xy + normal zw
 *   - aTexcoord (vec4): em-space uv + packed glyph location + packed band data
 *   - aJacobian (vec4): inverse Jacobian entries (identity for axis-aligned)
 *   - aBanding (vec4): band scale/offset
 *   - aColor (vec4): vertex color RGBA
 *
 * @param text			Text string to build quads for.
 * @param glyphs		Glyph data map from SlugFont (keyed by char code).
 * @param advances		Advance width map for all glyphs (including empty ones like space).
 * @param unitsPerEm	Font units per em for coordinate normalization.
 * @param fontSize		Desired font size in pixels.
 * @param textureWidth	Width of the curve/band textures (must match font).
 * @param color			Text color as [r, g, b, a] in 0-1 range.
 * @param extraExpand	Extra outward expansion in pixels per side (e.g. stroke width). Default 0.
 */function slugGlyphQuads(text,glyphs,advances,unitsPerEm,fontSize,textureWidth,color=[1,1,1,1],extraExpand=0){const scale=fontSize/unitsPerEm,invScale=1/scale,negInvScale=-invScale,cr=color[0],cg=color[1],cb=color[2],ca=color[3];
// Count renderable glyphs and find the tallest glyph's top in em-space.
// We use the actual max bounds.maxY (not the font's typographic ascender)
// so that position(0,0) aligns the top of the tallest rendered glyph to y=0,
// matching PixiJS Text behavior. The typographic ascender from the OS/2 table
// includes extra line-gap space that would produce a visible offset.
let quadCount=0,maxGlyphTop=0;for(let i=0;i<text.length;i++){const g=glyphs.get(text.charCodeAt(i));g&&(quadCount++,g.bounds.maxY>maxGlyphTop&&(maxGlyphTop=g.bounds.maxY))}const baselineY=maxGlyphTop*scale,vertices=new Float32Array(4*quadCount*20),indices=new Uint32Array(6*quadCount);let cursorX=0,quadIdx=0;for(let i=0;i<text.length;i++){const charCode=text.charCodeAt(i),glyph=glyphs.get(charCode);if(!glyph){
// No curves for this char (e.g. space) — advance cursor using advance width
const adv=advances.get(charCode);adv&&(cursorX+=adv*scale);continue}const{bounds,hBandCount,vBandCount,bandOffset}=glyph,x0=cursorX+bounds.minX*scale-extraExpand,y0=-bounds.maxY*scale+baselineY-extraExpand,x1=cursorX+bounds.maxX*scale+extraExpand,y1=-bounds.minY*scale+baselineY+extraExpand,emExpand=extraExpand*invScale,u0=bounds.minX-emExpand,v0=bounds.minY-emExpand,u1=bounds.maxX+emExpand,v1=bounds.maxY+emExpand,glyphWidth=bounds.maxX-bounds.minX,glyphHeight=bounds.maxY-bounds.minY,maxDim=Math.max(glyphWidth,glyphHeight),bandCount=Math.max(hBandCount,vBandCount);
// Glyph quad corners in pixel space.
// Font Y is up (ascenders positive), screen Y is down.
// Negate Y to flip, then add baselineY so that position(0,0)
// places the ascender line at screen y=0.
// extraExpand pushes each edge outward by N pixels (for stroke).
_f32[0]=maxDim>0?bandCount/maxDim:0;// shared scale
const bandScale=_f32[0];_f32[1]=-bounds.minX*bandScale,// vBandOffset (X → vertical band)
_f32[2]=-bounds.minY*bandScale;// hBandOffset (Y → horizontal band)
const bandScaleX=bandScale,bandScaleY=bandScale,bandOffsetX=_f32[1],bandOffsetY=_f32[2],packedLocation=packUint16Pair(bandOffset%textureWidth,Math.floor(bandOffset/textureWidth)),packedBands=packBandMax(vBandCount-1,hBandCount-1),baseVertex=4*quadIdx;
// Corner 0: screen top-left = font (minX, maxY)
let off=20*baseVertex;vertices[off]=x0,// posX
vertices[off+1]=y0,// posY
vertices[off+2]=-1,// normalX
vertices[off+3]=-1,// normalY
vertices[off+4]=u0,// emU
vertices[off+5]=v1,// emV
vertices[off+6]=packedLocation,vertices[off+7]=packedBands,vertices[off+8]=invScale,// jac.x
vertices[off+9]=0,// jac.y
vertices[off+10]=0,// jac.z
vertices[off+11]=negInvScale,// jac.w
vertices[off+12]=bandScaleX,vertices[off+13]=bandScaleY,vertices[off+14]=bandOffsetX,vertices[off+15]=bandOffsetY,vertices[off+16]=cr,vertices[off+17]=cg,vertices[off+18]=cb,vertices[off+19]=ca,
// Corner 1: screen top-right = font (maxX, maxY)
off+=20,vertices[off]=x1,vertices[off+1]=y0,vertices[off+2]=1,vertices[off+3]=-1,vertices[off+4]=u1,vertices[off+5]=v1,vertices[off+6]=packedLocation,vertices[off+7]=packedBands,vertices[off+8]=invScale,vertices[off+9]=0,vertices[off+10]=0,vertices[off+11]=negInvScale,vertices[off+12]=bandScaleX,vertices[off+13]=bandScaleY,vertices[off+14]=bandOffsetX,vertices[off+15]=bandOffsetY,vertices[off+16]=cr,vertices[off+17]=cg,vertices[off+18]=cb,vertices[off+19]=ca,
// Corner 2: screen bottom-right = font (maxX, minY)
off+=20,vertices[off]=x1,vertices[off+1]=y1,vertices[off+2]=1,vertices[off+3]=1,vertices[off+4]=u1,vertices[off+5]=v0,vertices[off+6]=packedLocation,vertices[off+7]=packedBands,vertices[off+8]=invScale,vertices[off+9]=0,vertices[off+10]=0,vertices[off+11]=negInvScale,vertices[off+12]=bandScaleX,vertices[off+13]=bandScaleY,vertices[off+14]=bandOffsetX,vertices[off+15]=bandOffsetY,vertices[off+16]=cr,vertices[off+17]=cg,vertices[off+18]=cb,vertices[off+19]=ca,
// Corner 3: screen bottom-left = font (minX, minY)
off+=20,vertices[off]=x0,vertices[off+1]=y1,vertices[off+2]=-1,vertices[off+3]=1,vertices[off+4]=u0,vertices[off+5]=v0,vertices[off+6]=packedLocation,vertices[off+7]=packedBands,vertices[off+8]=invScale,vertices[off+9]=0,vertices[off+10]=0,vertices[off+11]=negInvScale,vertices[off+12]=bandScaleX,vertices[off+13]=bandScaleY,vertices[off+14]=bandOffsetX,vertices[off+15]=bandOffsetY,vertices[off+16]=cr,vertices[off+17]=cg,vertices[off+18]=cb,vertices[off+19]=ca;
// Two triangles: [0,1,2] and [0,2,3]
const idxOffset=6*quadIdx;indices[idxOffset]=baseVertex,indices[idxOffset+1]=baseVertex+1,indices[idxOffset+2]=baseVertex+2,indices[idxOffset+3]=baseVertex,indices[idxOffset+4]=baseVertex+2,indices[idxOffset+5]=baseVertex+3,cursorX+=glyph.advanceWidth*scale,quadIdx++}return{vertices,indices,quadCount}}},
/***/8518(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.SlugTextMixin=
/**
 * Mixin that adds shared SlugText state and property accessors to a
 * Container base class. Each PixiJS version passes its own Container:
 *
 * ```typescript
 * // v8
 * import {Container} from 'pixi.js';
 * class SlugText extends SlugTextMixin(Container) { ... }
 *
 * // v6/v7
 * import {Container} from '@pixi/display';
 * class SlugText extends SlugTextMixin(Container) { ... }
 * ```
 *
 * The returned class manages text, font, fontSize, color, wordWrap,
 * supersampling, memory tracking, and rebuild lifecycle. Subclasses
 * implement `rebuild()` with version-specific GPU APIs.
 *
 * Fields use public `_` prefix instead of `protected` to avoid TS4094
 * ("Property of exported anonymous class type may not be private or
 * protected"). The `_` convention signals internal use.
 */
function(Base){return class extends Base{
/**
         * Initialize shared fields from a SlugTextInit object.
         * Called by the subclass constructor after super().
         * Subclass must call rebuild() separately after version-specific init.
         */
initBase(init){this._text=(0,strong_types_1.stringValue)(init.text,defaults_1.Defaults.SlugText.Text),this._font=init.slugFont,this._fontRef=new WeakRef(init.slugFont),this._fontSize=(0,strong_types_1.numberValue)(init.options?.fontSize,defaults_1.Defaults.SlugText.FontSize);const fill=init.options?.fill;this._color=fill?[fill[0],fill[1],fill[2],fill[3]]:[...defaults_1.Defaults.SlugText.FillColor],this._supersampling=(0,strong_types_1.booleanValue)(init.supersampling,defaults_1.Defaults.SlugText.Supersampling),this._supersampleCount=(0,strong_types_1.numberValue)(init.supersampleCount,defaults_1.Defaults.SlugText.SupersampleCount),this._wordWrap=(0,strong_types_1.booleanValue)(init.options?.wordWrap,defaults_1.Defaults.SlugText.WordWrap),this._wordWrapWidth=(0,strong_types_1.numberValue)(init.options?.wordWrapWidth,defaults_1.Defaults.SlugText.WordWrapwidth),this._breakWords=(0,strong_types_1.booleanValue)(init.options?.breakWords,!1),this._vertexBytes=0,this._indexBytes=0,this._rebuildCount=0;
// Stroke
const stroke=init.options?.stroke;this._strokeWidth=(0,strong_types_1.numberValue)(stroke?.width,defaults_1.Defaults.SlugText.StrokeWidth),this._strokeColor=stroke?.color?[stroke.color[0],stroke.color[1],stroke.color[2],stroke.color[3]]:[...defaults_1.Defaults.SlugText.StrokeColor],this._strokeAlphaMode=stroke?.alphaMode??defaults_1.Defaults.SlugText.StrokeAlphaMode,this._strokeAlphaStart=(0,strong_types_1.numberValue)(stroke?.alphaStart,defaults_1.Defaults.SlugText.StrokeAlphaStart),this._strokeAlphaRate=(0,strong_types_1.numberValue)(stroke?.alphaRate,defaults_1.Defaults.SlugText.StrokeAlphaRate);
// Drop shadow — presence of the object enables it
const ds=init.options?.dropShadow;this._dropShadow=ds?{alpha:(0,strong_types_1.numberValue)(ds.alpha,defaults_1.Defaults.SlugText.DropShadowAlpha),angle:(0,strong_types_1.numberValue)(ds.angle,defaults_1.Defaults.SlugText.DropShadowAngle),blur:(0,strong_types_1.numberValue)(ds.blur,defaults_1.Defaults.SlugText.DropShadowBlur),color:ds.color?[ds.color[0],ds.color[1],ds.color[2],ds.color[3]]:[...defaults_1.Defaults.SlugText.DropShadowColor],distance:(0,strong_types_1.numberValue)(ds.distance,defaults_1.Defaults.SlugText.DropShadowDistance)}:null}
/**
         * Called when supersampling is toggled. Override to update shader
         * uniforms without a full rebuild.
         */onSupersamplingChanged(){}
/**
         * Called when supersample count changes. Override to update shader
         * uniforms without a full rebuild.
         */onSupersampleCountChanged(){}
// --- Property accessors ---
get text(){return this._text}set text(value){this._text!==value&&(this._text=value,this.rebuild())}get font(){return this._fontRef?.deref()??null}set font(value){this._font!==value&&(this._font=value,this._fontRef=new WeakRef(value),this.rebuild())}get fontSize(){return this._fontSize}set fontSize(value){this._fontSize!==value&&(this._fontSize=value,this.rebuild())}get color(){return this._color}set color(value){this._color[0]===value[0]&&this._color[1]===value[1]&&this._color[2]===value[2]&&this._color[3]===value[3]||(this._color=value,this.rebuild())}get wordWrap(){return this._wordWrap}set wordWrap(value){this._wordWrap!==value&&(this._wordWrap=value,this.rebuild())}get wordWrapWidth(){return this._wordWrapWidth}set wordWrapWidth(value){this._wordWrapWidth!==value&&(this._wordWrapWidth=value,this.rebuild())}get breakWords(){return this._breakWords}set breakWords(value){this._breakWords!==value&&(this._breakWords=value,this._wordWrap&&this.rebuild())}
// --- Stroke ---
/** Stroke width in pixels. 0 = no stroke. */
get strokeWidth(){return this._strokeWidth}set strokeWidth(value){this._strokeWidth!==value&&(this._strokeWidth=value,this.rebuild())}
/** Stroke color as [r, g, b, a] in 0-1 range. */get strokeColor(){return this._strokeColor}set strokeColor(value){this._strokeColor=value,this._strokeWidth>0&&this.rebuild()}
/** Stroke alpha mode: 'uniform' for uniform, 'gradient' for per-pixel fade. */get strokeAlphaMode(){return this._strokeAlphaMode}set strokeAlphaMode(value){this._strokeAlphaMode!==value&&(this._strokeAlphaMode=value,this._strokeWidth>0&&this.rebuild())}
/** Starting alpha for gradient mode (innermost stroke pixel). */get strokeAlphaStart(){return this._strokeAlphaStart}set strokeAlphaStart(value){this._strokeAlphaStart!==value&&(this._strokeAlphaStart=value,this._strokeWidth>0&&"gradient"===this._strokeAlphaMode&&this.rebuild())}
/** Alpha change per pixel outward in gradient mode. */get strokeAlphaRate(){return this._strokeAlphaRate}set strokeAlphaRate(value){this._strokeAlphaRate!==value&&(this._strokeAlphaRate=value,this._strokeWidth>0&&"gradient"===this._strokeAlphaMode&&this.rebuild())}
/** Stroke configuration object, or null if disabled. */get stroke(){return this._strokeWidth<=0?null:{color:this._strokeColor,width:this._strokeWidth,alphaMode:this._strokeAlphaMode,alphaStart:this._strokeAlphaStart,alphaRate:this._strokeAlphaRate}}set stroke(value){const newWidth=(0,strong_types_1.numberValue)(value?.width,0),newColor=value?.color?[value.color[0],value.color[1],value.color[2],value.color[3]]:[...defaults_1.Defaults.SlugText.StrokeColor],newAlphaMode=value?.alphaMode??defaults_1.Defaults.SlugText.StrokeAlphaMode,newAlphaStart=(0,strong_types_1.numberValue)(value?.alphaStart,defaults_1.Defaults.SlugText.StrokeAlphaStart),newAlphaRate=(0,strong_types_1.numberValue)(value?.alphaRate,defaults_1.Defaults.SlugText.StrokeAlphaRate),changed=this._strokeWidth!==newWidth||this._strokeColor[0]!==newColor[0]||this._strokeColor[1]!==newColor[1]||this._strokeColor[2]!==newColor[2]||this._strokeColor[3]!==newColor[3]||this._strokeAlphaMode!==newAlphaMode||this._strokeAlphaStart!==newAlphaStart||this._strokeAlphaRate!==newAlphaRate;this._strokeWidth=newWidth,this._strokeColor=newColor,this._strokeAlphaMode=newAlphaMode,this._strokeAlphaStart=newAlphaStart,this._strokeAlphaRate=newAlphaRate,changed&&this.rebuild()}
// --- Drop shadow ---
/**
         * Drop shadow configuration, or null if disabled.
         * Setting to a partial object fills missing fields with defaults.
         * Setting to null disables the shadow.
         */
get dropShadow(){return this._dropShadow}set dropShadow(value){if(null===value){if(null===this._dropShadow)return;this._dropShadow=null}else this._dropShadow={alpha:(0,strong_types_1.numberValue)(value.alpha,defaults_1.Defaults.SlugText.DropShadowAlpha),angle:(0,strong_types_1.numberValue)(value.angle,defaults_1.Defaults.SlugText.DropShadowAngle),blur:(0,strong_types_1.numberValue)(value.blur,defaults_1.Defaults.SlugText.DropShadowBlur),color:value.color?[value.color[0],value.color[1],value.color[2],value.color[3]]:[...defaults_1.Defaults.SlugText.DropShadowColor],distance:(0,strong_types_1.numberValue)(value.distance,defaults_1.Defaults.SlugText.DropShadowDistance)};this.rebuild()}
// --- Supersampling ---
get supersampling(){return this._supersampling}set supersampling(value){this._supersampling!==value&&(this._supersampling=value,this.onSupersamplingChanged())}get supersampleCount(){return this._supersampleCount}set supersampleCount(value){const clamped=Math.min(Math.max(value,1),defaults_1.Defaults.MAX_SUPERSAMPLE_COUNT);this._supersampleCount!==clamped&&(this._supersampleCount=clamped,this.onSupersampleCountChanged())}get rebuildCount(){return this._rebuildCount}meshMemoryBytes(){return this._vertexBytes+this._indexBytes}totalMemoryBytes(){const font=this._fontRef?.deref();return this.meshMemoryBytes()+(font?font.memoryBytes():0)}}}
/***/;const defaults_1=__webpack_require__(4195),strong_types_1=__webpack_require__(6859)},
/***/8238(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugTexturePack=
/**
 * Pack preprocessed glyph data into curve and band textures.
 *
 * **Curve texture layout** (float RGBA, `textureWidth` wide):
 * Uses the shared-endpoint optimization: within each contour of N curves,
 * consecutive curves share endpoints (curve K's p3 == curve K+1's p1).
 * Each curve occupies 1 texel [p1.x, p1.y, p2.x, p2.y], and a sentinel
 * texel [p3.x, p3.y, 0, 0] follows the last curve in each contour.
 * The shader reads p3 as texelFetch(curveLoc.x + 1, curveLoc.y).xy,
 * which naturally reads the next curve's p1 or the sentinel — no shader
 * change required.
 *
 * For a contour of N curves this uses N+1 texels instead of 2N (~45% savings).
 *
 * **Band texture layout** (uint RGBA, `textureWidth` wide):
 * Per glyph, a contiguous block containing:
 *   1. Band headers (one per horizontal band, then one per vertical band):
 *      [curveCount, curveListOffset, 0, 0]
 *      curveListOffset is relative to glyph.bandOffset (used by CalcBandLoc in frag.glsl).
 *   2. Curve reference lists (one entry per curve in the band):
 *      [curveTexelX, curveTexelY, 0, 0]
 *      curveTexelX/Y are the 2D coordinates of the curve's p12 texel in uCurveTexture.
 *      Each list is row-aligned so it never straddles a row boundary.
 */
function(glyphs,textureWidth){if(4096!==textureWidth)throw new Error(`textureWidth must be 4096 to match kLogBandTextureWidth=12 in frag.glsl, got ${textureWidth}`);const widthMask=textureWidth-1;// 0xFFF for bitwise mod
// First pass: compute total sizes, simulating row alignment.
let totalCurveTexels=0,totalBandTexels=0;for(const glyph of glyphs){
// Shared-endpoint curve texels per contour
const starts=glyph.contourStarts;for(let c=0;c<starts.length;c++){const contourBegin=starts[c],contourSize=(c+1<starts.length?starts[c+1]:glyph.curves.length)-contourBegin;0!==contourSize&&(totalCurveTexels+=countContourTexels(contourSize,totalCurveTexels,textureWidth))}
// Band headers must all fit on one row.
const hcount=glyph.hBandCount+glyph.vBandCount,hcol=totalBandTexels&widthMask;hcol+hcount>textureWidth&&(totalBandTexels+=textureWidth-hcol),totalBandTexels+=hcount;
// Curve reference lists — simulate row alignment.
for(const band of glyph.hBands){if(band.length>0){const col=totalBandTexels&widthMask;col+band.length>textureWidth&&(totalBandTexels+=textureWidth-col)}totalBandTexels+=band.length}for(const band of glyph.vBands){if(band.length>0){const col=totalBandTexels&widthMask;col+band.length>textureWidth&&(totalBandTexels+=textureWidth-col)}totalBandTexels+=band.length}}
// Compute texture height from texel count (round up to full rows)
const curveRows=Math.ceil(totalCurveTexels/textureWidth)||1,bandRows=Math.ceil(totalBandTexels/textureWidth)||1,curveData=new Float32Array(curveRows*textureWidth*4),bandData=new Uint32Array(bandRows*textureWidth*4);
// Second pass: pack data
let curveTexelIdx=0,bandTexelIdx=0;for(const glyph of glyphs){glyph.curveOffset=curveTexelIdx;
// Pack curves using shared-endpoint layout.
// Track each curve's p12 texel index for band references below.
const curveTexels=new Uint32Array(glyph.curves.length),starts=glyph.contourStarts;for(let c=0;c<starts.length;c++){const contourBegin=starts[c],contourEnd=c+1<starts.length?starts[c+1]:glyph.curves.length;if(0===contourEnd-contourBegin)continue;
// Pack each curve's p12 texel. The shader reads p3 from curveLoc.x+1,
// which is the next curve's p12 texel (whose .xy == current curve's p3).
for(let i=contourBegin;i<contourEnd;i++){
// Ensure this texel and the +1 texel are on the same row.
(curveTexelIdx&widthMask)===widthMask&&curveTexelIdx++,curveTexels[i]=curveTexelIdx;const curve=glyph.curves[i],base=4*curveTexelIdx;curveData[base]=curve.p1x,curveData[base+1]=curve.p1y,curveData[base+2]=curve.p2x,curveData[base+3]=curve.p2y,curveTexelIdx++}
// Sentinel texel: holds the last curve's p3 so the shader's
// curveLoc.x+1 read works for the final curve in the contour.
// Row-alignment: the last curve's texel was placed such that +1
// is on the same row (handled by the skip above). The sentinel
// itself also needs its +1 neighbor check skipped since nothing
// reads sentinel+1, but we still must not leave curveTexelIdx
// on the last column for the next contour's first curve.
const lastCurve=glyph.curves[contourEnd-1],sentBase=4*curveTexelIdx;curveData[sentBase]=lastCurve.p3x,curveData[sentBase+1]=lastCurve.p3y,curveTexelIdx++}
// --- Band texture packing (unchanged logic) ---
// Pad to next row if band headers would straddle a row boundary.
const headerCount=glyph.hBandCount+glyph.vBandCount,headerCol=bandTexelIdx&widthMask;headerCol+headerCount>textureWidth&&(bandTexelIdx+=textureWidth-headerCol),glyph.bandOffset=bandTexelIdx;
// NOTE: Band headers, curve references, and curve sentinels only write
// channels 0-1 (xy). Channels 2-3 (zw) are left at zero from the typed
// array allocation. The shader only reads .xy (fetchBand, texelFetch .xy).
// If the shader or band format ever reads .zw, add explicit writes back.
const headerStart=bandTexelIdx;bandTexelIdx+=headerCount;
// Pack horizontal band headers + curve lists
for(let b=0;b<glyph.hBandCount;b++){const band=glyph.hBands[b],headerBase=4*(headerStart+b);if(band.length>0){const col=bandTexelIdx&widthMask;col+band.length>textureWidth&&(bandTexelIdx+=textureWidth-col)}bandData[headerBase]=band.length,bandData[headerBase+1]=bandTexelIdx-glyph.bandOffset;for(const curveIdx of band){const refBase=4*bandTexelIdx,absCurveTexel=curveTexels[curveIdx];bandData[refBase]=absCurveTexel&widthMask,bandData[refBase+1]=absCurveTexel>>>12,bandTexelIdx++}}
// Pack vertical band headers + curve lists
for(let b=0;b<glyph.vBandCount;b++){const band=glyph.vBands[b],headerBase=4*(headerStart+glyph.hBandCount+b);if(band.length>0){const col=bandTexelIdx&widthMask;col+band.length>textureWidth&&(bandTexelIdx+=textureWidth-col)}bandData[headerBase]=band.length,bandData[headerBase+1]=bandTexelIdx-glyph.bandOffset;for(const curveIdx of band){const refBase=4*bandTexelIdx,absCurveTexel=curveTexels[curveIdx];bandData[refBase]=absCurveTexel&widthMask,bandData[refBase+1]=absCurveTexel>>>12,bandTexelIdx++}}}return{curveData,bandData}}
/***/;// 4096
/**
 * Compute the number of curve texels needed per contour using the
 * shared-endpoint layout. Within a contour of N curves, each curve
 * gets 1 texel [p1x,p1y,p2x,p2y], plus 1 sentinel texel at the end
 * holding the last curve's p3 as [p3x,p3y,0,0]. The shader reads p3
 * via curveLoc.x+1, which naturally hits the next curve's p1 (== current
 * curve's p3) or the sentinel for the last curve.
 *
 * Row alignment: each curve's texel and the texel at +1 must share
 * a row. If a texel would land on the last column, skip to the next row.
 */
function countContourTexels(contourSize,startIdx,textureWidth){let idx=startIdx;
// N curve texels + 1 sentinel, each needing its +1 neighbor on the same row
const totalTexels=contourSize+1;for(let i=0;i<totalTexels;i++)(idx&textureWidth-1)==textureWidth-1&&idx++,idx++;return idx-startIdx}},
/***/2754(__unused_webpack_module,exports,__webpack_require__){"use strict";var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugFontGpuV6=
/**
 * Create or retrieve cached V6 GPU resources for a SlugFont.
 * On first call, creates curve/band textures and a compiled Program.
 * On subsequent calls, returns the same cached object.
 */
function(font){if(font.gpuCache)return font.gpuCache;const textureWidth=font.textureWidth,curveRows=Math.ceil(font.curveData.length/4/textureWidth)||1,curveBase=core_1.BaseTexture.fromBuffer(font.curveData,textureWidth,curveRows,{format:core_1.FORMATS.RGBA,type:core_1.TYPES.FLOAT}),curveTexture=new core_1.Texture(curveBase),bandRows=Math.ceil(font.bandData.length/4/textureWidth)||1,bandDataAsFloat=new Float32Array(font.bandData.buffer,font.bandData.byteOffset,font.bandData.length),bandBase=core_1.BaseTexture.fromBuffer(bandDataAsFloat,textureWidth,bandRows,{format:core_1.FORMATS.RGBA,type:core_1.TYPES.FLOAT}),bandTexture=new core_1.Texture(bandBase),program=core_1.Program.from(vert_glsl_1.default,frag_glsl_1.default),cache={curveTexture,bandTexture,program};
// Curve texture: RGBA float32
return font.gpuCache=cache,font.setGpuDestroy(()=>{curveTexture.destroy(!0),bandTexture.destroy(!0)}),cache}
/***/;const core_1=__webpack_require__(3780),vert_glsl_1=__importDefault(__webpack_require__(1038)),frag_glsl_1=__importDefault(__webpack_require__(9155));
// v6 shares the v7 vertex shader (same uniform names: projectionMatrix, translationMatrix).
},
/***/5827(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugShader=
/**
 * Creates a per-instance PixiJS v6 Shader for the Slug rendering algorithm.
 * The Program and textures are shared across instances (from SlugFont's GPU cache).
 *
 * Requires WebGL2 context for integer textures, texelFetch, and flat varyings.
 * v6 defaults to WebGL1 — the application must set `preferWebGLVersion: 2`.
 *
 * Uses the v7 vertex shader since v6 and v7 share the same uniform names
 * (projectionMatrix, translationMatrix) auto-populated by the Mesh renderer.
 */
function(program,curveTexture,bandTexture,resolution){const uniforms={uCurveTexture:curveTexture,uBandTexture:bandTexture,uResolution:new Float32Array(resolution),uSupersampleCount:0,uStrokeExpand:0,uStrokeAlphaStart:1,uStrokeAlphaRate:0};return new core_1.Shader(program,uniforms)}
/***/;const core_1=__webpack_require__(3780)},
/***/7241(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.SlugText=void 0;const core_1=__webpack_require__(3780),display_1=__webpack_require__(6492),mesh_1=__webpack_require__(9564),quad_1=__webpack_require__(2727),gpu_1=__webpack_require__(2754),shader_1=__webpack_require__(5827),SlugTextV6Base=(0,__webpack_require__(8518).SlugTextMixin)(display_1.Container);exports.SlugText=
/**
 * Renderable text element using the Slug algorithm for PixiJS v6.
 * Extends Container (via SlugTextMixin) for scene graph compatibility.
 *
 * Note: Requires WebGL2. The application must be configured with
 * `preferWebGLVersion: 2` to enable the WebGL2 features required by Slug.
 */
class extends SlugTextV6Base{constructor(init){super(),this.initBase(init),this._meshes=[],this._shader=null,this.rebuild()}onSupersamplingChanged(){this._shader&&(this._shader.uniforms.uSupersampleCount=this._supersampling?this._supersampleCount:0)}onSupersampleCountChanged(){this._shader&&this._supersampling&&(this._shader.uniforms.uSupersampleCount=this._supersampleCount)}_buildMesh(quads,gpu){const vertexBuffer=new core_1.Buffer(quads.vertices.buffer,!0),geometry=new core_1.Geometry;geometry.addAttribute("aPositionNormal",vertexBuffer,4,!1,core_1.TYPES.FLOAT,80,0),geometry.addAttribute("aTexcoord",vertexBuffer,4,!1,core_1.TYPES.FLOAT,80,16),geometry.addAttribute("aJacobian",vertexBuffer,4,!1,core_1.TYPES.FLOAT,80,32),geometry.addAttribute("aBanding",vertexBuffer,4,!1,core_1.TYPES.FLOAT,80,48),geometry.addAttribute("aColor",vertexBuffer,4,!1,core_1.TYPES.FLOAT,80,64);const indices16=new Uint16Array(quads.indices.length);for(let i=0;i<quads.indices.length;i++)indices16[i]=quads.indices[i];geometry.addIndex(indices16);const shader=(0,shader_1.slugShader)(gpu.program,gpu.curveTexture,gpu.bandTexture,[800,400]);return shader.uniforms.uSupersampleCount=this._supersampling?this._supersampleCount:0,{mesh:new mesh_1.Mesh(geometry,shader),shader}}rebuild(){this._rebuildCount++;for(const mesh of this._meshes)this.removeChild(mesh),mesh.destroy();this._meshes=[],this._shader=null;const font=this._fontRef?.deref();if(!font||0===this._text.length||0===font.glyphs.size)return;const gpu=(0,gpu_1.slugFontGpuV6)(font),hasShadow=null!==this._dropShadow,hasStroke=this._strokeWidth>0;if(hasShadow){const ds=this._dropShadow,shadowAlpha=ds.alpha??1,shadowColor=ds.color?[ds.color[0],ds.color[1],ds.color[2],shadowAlpha]:[0,0,0,shadowAlpha],blur=ds.blur??0,shadowQuads=(0,quad_1.slugGlyphQuads)(this._text,font.glyphs,font.advances,font.unitsPerEm,this._fontSize,font.textureWidth,shadowColor,blur);if(shadowQuads.quadCount>0){const{mesh,shader}=this._buildMesh(shadowQuads,gpu);shader.uniforms.uStrokeExpand=blur,blur>0&&(shader.uniforms.uStrokeAlphaStart=shadowAlpha,shader.uniforms.uStrokeAlphaRate=-shadowAlpha/blur);const angle=ds.angle??Math.PI/6,dist=ds.distance??5;mesh.x=Math.cos(angle)*dist,mesh.y=Math.sin(angle)*dist,this.addChild(mesh),this._meshes.push(mesh)}}if(hasStroke){const strokeQuads=(0,quad_1.slugGlyphQuads)(this._text,font.glyphs,font.advances,font.unitsPerEm,this._fontSize,font.textureWidth,this._strokeColor,this._strokeWidth);if(strokeQuads.quadCount>0){const{mesh,shader}=this._buildMesh(strokeQuads,gpu);shader.uniforms.uStrokeExpand=this._strokeWidth,shader.uniforms.uStrokeAlphaStart=this._strokeAlphaStart,shader.uniforms.uStrokeAlphaRate="gradient"===this._strokeAlphaMode?this._strokeAlphaRate:0,this.addChild(mesh),this._meshes.push(mesh)}}const fillQuads=(0,quad_1.slugGlyphQuads)(this._text,font.glyphs,font.advances,font.unitsPerEm,this._fontSize,font.textureWidth,this._color);if(fillQuads.quadCount>0){const{mesh,shader}=this._buildMesh(fillQuads,gpu);this._shader=shader,this.addChild(mesh),this._meshes.push(mesh),this._vertexBytes=fillQuads.vertices.byteLength,this._indexBytes=fillQuads.indices.byteLength}}destroy(){for(const mesh of this._meshes)mesh.destroy();this._meshes=[],super.destroy()}}},
/***/1270(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;/*! https://mths.be/punycode v1.4.1 by @mathias */
/* module decorator */module=__webpack_require__.nmd(module),function(){
/** Detect free variables */
exports&&exports.nodeType,module&&module.nodeType;var freeGlobal="object"==typeof __webpack_require__.g&&__webpack_require__.g;freeGlobal.global!==freeGlobal&&freeGlobal.window!==freeGlobal&&freeGlobal.self;
/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */var punycode,
/** Highest positive signed 32-bit float value */
maxInt=2147483647,// '\x2D'
/** Regular expressions */
regexPunycode=/^xn--/,regexNonASCII=/[^\x20-\x7E]/,// unprintable ASCII chars + non-ASCII chars
regexSeparators=/[\x2E\u3002\uFF0E\uFF61]/g,// RFC 3490 separators
/** Error messages */
errors={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},floor=Math.floor,stringFromCharCode=String.fromCharCode;
/*--------------------------------------------------------------------------*/
/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */function error(type){throw new RangeError(errors[type])}
/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */function map(array,fn){for(var length=array.length,result=[];length--;)result[length]=fn(array[length]);return result}
/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */function mapDomain(string,fn){var parts=string.split("@"),result="";return parts.length>1&&(
// In email addresses, only the domain name should be punycoded. Leave
// the local part (i.e. everything up to `@`) intact.
result=parts[0]+"@",string=parts[1]),result+map((
// Avoid `split(regex)` for IE8 compatibility. See #17.
string=string.replace(regexSeparators,".")).split("."),fn).join(".")}
/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */function ucs2decode(string){for(var value,extra,output=[],counter=0,length=string.length;counter<length;)(value=string.charCodeAt(counter++))>=55296&&value<=56319&&counter<length?56320==(64512&(
// high surrogate, and there is a next character
extra=string.charCodeAt(counter++)))?// low surrogate
output.push(((1023&value)<<10)+(1023&extra)+65536):(
// unmatched surrogate; only append this code unit, in case the next
// code unit is the high surrogate of a surrogate pair
output.push(value),counter--):output.push(value);return output}
/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */function ucs2encode(array){return map(array,function(value){var output="";return value>65535&&(output+=stringFromCharCode((value-=65536)>>>10&1023|55296),value=56320|1023&value),output+=stringFromCharCode(value)}).join("")}
/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */function basicToDigit(codePoint){return codePoint-48<10?codePoint-22:codePoint-65<26?codePoint-65:codePoint-97<26?codePoint-97:36}
/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */function digitToBasic(digit,flag){
//  0..25 map to ASCII a..z or A..Z
// 26..35 map to ASCII 0..9
return digit+22+75*(digit<26)-((0!=flag)<<5)}
/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */function adapt(delta,numPoints,firstTime){var k=0;for(delta=firstTime?floor(delta/700):delta>>1,delta+=floor(delta/numPoints);delta>455;k+=36)delta=floor(delta/35);return floor(k+36*delta/(delta+38))}
/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */function decode(input){
// Don't use UCS-2
var out,basic,j,index,oldi,w,k,digit,t,
/** Cached calculation results */
baseMinusT,output=[],inputLength=input.length,i=0,n=128,bias=72;
// Handle the basic code points: let `basic` be the number of input code
// points before the last delimiter, or `0` if there is none, then copy
// the first basic code points to the output.
for((basic=input.lastIndexOf("-"))<0&&(basic=0),j=0;j<basic;++j)
// if it's not a basic code point
input.charCodeAt(j)>=128&&error("not-basic"),output.push(input.charCodeAt(j));
// Main decoding loop: start just after the last delimiter if any basic code
// points were copied; start at the beginning otherwise.
for(index=basic>0?basic+1:0;index<inputLength;){
// `index` is the index of the next character to be consumed.
// Decode a generalized variable-length integer into `delta`,
// which gets added to `i`. The overflow checking is easier
// if we increase `i` as we go, then subtract off its starting
// value at the end to obtain `delta`.
for(oldi=i,w=1,k=36;index>=inputLength&&error("invalid-input"),((digit=basicToDigit(input.charCodeAt(index++)))>=36||digit>floor((maxInt-i)/w))&&error("overflow"),i+=digit*w,!(digit<(t=k<=bias?1:k>=bias+26?26:k-bias));k+=36)w>floor(maxInt/(baseMinusT=36-t))&&error("overflow"),w*=baseMinusT;bias=adapt(i-oldi,out=output.length+1,0==oldi),
// `i` was supposed to wrap around from `out` to `0`,
// incrementing `n` each time, so we'll fix that now:
floor(i/out)>maxInt-n&&error("overflow"),n+=floor(i/out),i%=out,
// Insert `n` at position `i` of the output
output.splice(i++,0,n)}return ucs2encode(output)}
/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */function encode(input){var n,delta,handledCPCount,basicLength,bias,j,m,q,k,t,currentValue,
/** `inputLength` will hold the number of code points in `input`. */
inputLength,
/** Cached calculation results */
handledCPCountPlusOne,baseMinusT,qMinusT,output=[];
// Convert the input in UCS-2 to Unicode
// Handle the basic code points
for(
// Cache the length
inputLength=(input=ucs2decode(input)).length,
// Initialize the state
n=128,delta=0,bias=72,j=0;j<inputLength;++j)(currentValue=input[j])<128&&output.push(stringFromCharCode(currentValue));
// Main encoding loop:
for(handledCPCount=basicLength=output.length,
// `handledCPCount` is the number of code points that have been handled;
// `basicLength` is the number of basic code points.
// Finish the basic string - if it is not empty - with a delimiter
basicLength&&output.push("-");handledCPCount<inputLength;){
// All non-basic code points < n have been handled already. Find the next
// larger one:
for(m=maxInt,j=0;j<inputLength;++j)(currentValue=input[j])>=n&&currentValue<m&&(m=currentValue);
// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
// but guard against overflow
for(m-n>floor((maxInt-delta)/(handledCPCountPlusOne=handledCPCount+1))&&error("overflow"),delta+=(m-n)*handledCPCountPlusOne,n=m,j=0;j<inputLength;++j)if((currentValue=input[j])<n&&++delta>maxInt&&error("overflow"),currentValue==n){
// Represent delta as a generalized variable-length integer
for(q=delta,k=36;!(q<(t=k<=bias?1:k>=bias+26?26:k-bias));k+=36)qMinusT=q-t,baseMinusT=36-t,output.push(stringFromCharCode(digitToBasic(t+qMinusT%baseMinusT,0))),q=floor(qMinusT/baseMinusT);output.push(stringFromCharCode(digitToBasic(q,0))),bias=adapt(delta,handledCPCountPlusOne,handledCPCount==basicLength),delta=0,++handledCPCount}++delta,++n}return output.join("")}
/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
/*--------------------------------------------------------------------------*/
/** Define the public API */
punycode={
/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
version:"1.4.1",
/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
ucs2:{decode:ucs2decode,encode:ucs2encode},decode,encode,toASCII:
/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
function(input){return mapDomain(input,function(string){return regexNonASCII.test(string)?"xn--"+encode(string):string})},toUnicode:function(input){return mapDomain(input,function(string){return regexPunycode.test(string)?decode(string.slice(4).toLowerCase()):string})}},void 0===(__WEBPACK_AMD_DEFINE_RESULT__=function(){return punycode}.call(exports,__webpack_require__,exports,module))||(module.exports=__WEBPACK_AMD_DEFINE_RESULT__)}()},
/***/8835(__unused_webpack_module,exports,__webpack_require__){"use strict";
/*
 * Copyright Joyent, Inc. and other Node contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 */var punycode=__webpack_require__(1270);function Url(){this.protocol=null,this.slashes=null,this.auth=null,this.host=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.query=null,this.pathname=null,this.path=null,this.href=null}
// Reference: RFC 3986, RFC 1808, RFC 2396
/*
 * define these here so at least they only have to be
 * compiled once on the first module load.
 */var protocolPattern=/^([a-z0-9.+-]+:)/i,portPattern=/:[0-9]*$/,
// Special case for a simple path URL
simplePathPattern=/^(\/\/?(?!\/)[^?\s]*)(\?[^\s]*)?$/,
// RFC 2396: characters not allowed for various reasons.
unwise=["{","}","|","\\","^","`"].concat(["<",">",'"',"`"," ","\r","\n","\t"]),
// Allowed by RFCs, but cause of XSS attacks.  Always escape these.
autoEscape=["'"].concat(unwise),
/*
   * Characters that are never ever allowed in a hostname.
   * Note that any invalid chars are also handled, but these
   * are the ones that are *expected* to be seen, so we fast-path
   * them.
   */
nonHostChars=["%","/","?",";","#"].concat(autoEscape),hostEndingChars=["/","?","#"],hostnamePartPattern=/^[+a-z0-9A-Z_-]{0,63}$/,hostnamePartStart=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,
// protocols that can allow "unsafe" and "unwise" chars.
unsafeProtocol={javascript:!0,"javascript:":!0},
// protocols that never have a hostname.
hostlessProtocol={javascript:!0,"javascript:":!0},
// protocols that always contain a // bit.
slashedProtocol={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0},querystring=__webpack_require__(5373);function urlParse(url,parseQueryString,slashesDenoteHost){if(url&&"object"==typeof url&&url instanceof Url)return url;var u=new Url;return u.parse(url,parseQueryString,slashesDenoteHost),u}Url.prototype.parse=function(url,parseQueryString,slashesDenoteHost){if("string"!=typeof url)throw new TypeError("Parameter 'url' must be a string, not "+typeof url);
/*
   * Copy chrome, IE, opera backslash-handling behavior.
   * Back slashes before the query string get converted to forward slashes
   * See: https://code.google.com/p/chromium/issues/detail?id=25916
   */var queryIndex=url.indexOf("?"),splitter=-1!==queryIndex&&queryIndex<url.indexOf("#")?"?":"#",uSplit=url.split(splitter);uSplit[0]=uSplit[0].replace(/\\/g,"/");var rest=url=uSplit.join(splitter);
/*
   * trim before proceeding.
   * This is to support parse stuff like "  http://foo.com  \n"
   */if(rest=rest.trim(),!slashesDenoteHost&&1===url.split("#").length){
// Try fast path regexp
var simplePath=simplePathPattern.exec(rest);if(simplePath)return this.path=rest,this.href=rest,this.pathname=simplePath[1],simplePath[2]?(this.search=simplePath[2],this.query=parseQueryString?querystring.parse(this.search.substr(1)):this.search.substr(1)):parseQueryString&&(this.search="",this.query={}),this}var proto=protocolPattern.exec(rest);if(proto){var lowerProto=(proto=proto[0]).toLowerCase();this.protocol=lowerProto,rest=rest.substr(proto.length)}
/*
   * figure out if it's got a host
   * user@server is *always* interpreted as a hostname, and url
   * resolution will treat //foo/bar as host=foo,path=bar because that's
   * how the browser resolves relative URLs.
   */if(slashesDenoteHost||proto||rest.match(/^\/\/[^@/]+@[^@/]+/)){var slashes="//"===rest.substr(0,2);!slashes||proto&&hostlessProtocol[proto]||(rest=rest.substr(2),this.slashes=!0)}if(!hostlessProtocol[proto]&&(slashes||proto&&!slashedProtocol[proto])){for(
/*
     * there's a hostname.
     * the first instance of /, ?, ;, or # ends the host.
     *
     * If there is an @ in the hostname, then non-host chars *are* allowed
     * to the left of the last @ sign, unless some host-ending character
     * comes *before* the @-sign.
     * URLs are obnoxious.
     *
     * ex:
     * http://a@b@c/ => user:a@b host:c
     * http://a@b?@c => user:a host:c path:/?@c
     */
/*
     * v0.12 TODO(isaacs): This is not quite how Chrome does things.
     * Review our test case against browsers more comprehensively.
     */
// find the first instance of any hostEndingChars
var auth,atSign,hostEnd=-1,i=0;i<hostEndingChars.length;i++){-1!==(hec=rest.indexOf(hostEndingChars[i]))&&(-1===hostEnd||hec<hostEnd)&&(hostEnd=hec)}
/*
     * at this point, either we have an explicit point where the
     * auth portion cannot go past, or the last @ char is the decider.
     */
/*
     * Now we have a portion which is definitely the auth.
     * Pull that off.
     */
-1!==(
// atSign can be anywhere.
atSign=-1===hostEnd?rest.lastIndexOf("@"):rest.lastIndexOf("@",hostEnd))&&(auth=rest.slice(0,atSign),rest=rest.slice(atSign+1),this.auth=decodeURIComponent(auth)),
// the host is the remaining to the left of the first non-host char
hostEnd=-1;for(i=0;i<nonHostChars.length;i++){var hec;-1!==(hec=rest.indexOf(nonHostChars[i]))&&(-1===hostEnd||hec<hostEnd)&&(hostEnd=hec)}
// if we still have not hit it, then the entire thing is a host.
-1===hostEnd&&(hostEnd=rest.length),this.host=rest.slice(0,hostEnd),rest=rest.slice(hostEnd),
// pull out port.
this.parseHost(),
/*
     * we've indicated that there is a hostname,
     * so even if it's empty, it has to be present.
     */
this.hostname=this.hostname||"";
/*
     * if hostname begins with [ and ends with ]
     * assume that it's an IPv6 address.
     */
var ipv6Hostname="["===this.hostname[0]&&"]"===this.hostname[this.hostname.length-1];
// validate a little.
if(!ipv6Hostname)for(var hostparts=this.hostname.split(/\./),l=(i=0,hostparts.length);i<l;i++){var part=hostparts[i];if(part&&!part.match(hostnamePartPattern)){for(var newpart="",j=0,k=part.length;j<k;j++)part.charCodeAt(j)>127?
/*
               * we replace non-ASCII char with a temporary placeholder
               * we need this to make sure size of hostname is not
               * broken by replacing non-ASCII by nothing
               */
newpart+="x":newpart+=part[j];
// we test again with ASCII char only
if(!newpart.match(hostnamePartPattern)){var validParts=hostparts.slice(0,i),notHost=hostparts.slice(i+1),bit=part.match(hostnamePartStart);bit&&(validParts.push(bit[1]),notHost.unshift(bit[2])),notHost.length&&(rest="/"+notHost.join(".")+rest),this.hostname=validParts.join(".");break}}}this.hostname.length>255?this.hostname="":
// hostnames are always lower case.
this.hostname=this.hostname.toLowerCase(),ipv6Hostname||(
/*
       * IDNA Support: Returns a punycoded representation of "domain".
       * It only converts parts of the domain name that
       * have non-ASCII characters, i.e. it doesn't matter if
       * you call it with a domain that already is ASCII-only.
       */
this.hostname=punycode.toASCII(this.hostname));var p=this.port?":"+this.port:"",h=this.hostname||"";this.host=h+p,this.href+=this.host,
/*
     * strip [ and ] from the hostname
     * the host field still retains them, though
     */
ipv6Hostname&&(this.hostname=this.hostname.substr(1,this.hostname.length-2),"/"!==rest[0]&&(rest="/"+rest))}
/*
   * now rest is set to the post-host stuff.
   * chop off any delim chars.
   */if(!unsafeProtocol[lowerProto])
/*
     * First, make 100% sure that any "autoEscape" chars get
     * escaped, even if encodeURIComponent doesn't think they
     * need to be.
     */
for(i=0,l=autoEscape.length;i<l;i++){var ae=autoEscape[i];if(-1!==rest.indexOf(ae)){var esc=encodeURIComponent(ae);esc===ae&&(esc=escape(ae)),rest=rest.split(ae).join(esc)}}
// chop off from the tail first.
var hash=rest.indexOf("#");-1!==hash&&(
// got a fragment string.
this.hash=rest.substr(hash),rest=rest.slice(0,hash));var qm=rest.indexOf("?");
// to support http.request
if(-1!==qm?(this.search=rest.substr(qm),this.query=rest.substr(qm+1),parseQueryString&&(this.query=querystring.parse(this.query)),rest=rest.slice(0,qm)):parseQueryString&&(
// no query string, but parseQueryString still requested
this.search="",this.query={}),rest&&(this.pathname=rest),slashedProtocol[lowerProto]&&this.hostname&&!this.pathname&&(this.pathname="/"),this.pathname||this.search){p=this.pathname||"";var s=this.search||"";this.path=p+s}
// finally, reconstruct the href based on what has been validated.
return this.href=this.format(),this},Url.prototype.format=function(){var auth=this.auth||"";auth&&(auth=(auth=encodeURIComponent(auth)).replace(/%3A/i,":"),auth+="@");var protocol=this.protocol||"",pathname=this.pathname||"",hash=this.hash||"",host=!1,query="";this.host?host=auth+this.host:this.hostname&&(host=auth+(-1===this.hostname.indexOf(":")?this.hostname:"["+this.hostname+"]"),this.port&&(host+=":"+this.port)),this.query&&"object"==typeof this.query&&Object.keys(this.query).length&&(query=querystring.stringify(this.query,{arrayFormat:"repeat",addQueryPrefix:!1}));var search=this.search||query&&"?"+query||"";return protocol&&":"!==protocol.substr(-1)&&(protocol+=":")
/*
   * only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
   * unless they had them to begin with.
   */,this.slashes||(!protocol||slashedProtocol[protocol])&&!1!==host?(host="//"+(host||""),pathname&&"/"!==pathname.charAt(0)&&(pathname="/"+pathname)):host||(host=""),hash&&"#"!==hash.charAt(0)&&(hash="#"+hash),search&&"?"!==search.charAt(0)&&(search="?"+search),protocol+host+(pathname=pathname.replace(/[?#]/g,function(match){return encodeURIComponent(match)}))+(search=search.replace("#","%23"))+hash},Url.prototype.resolve=function(relative){return this.resolveObject(urlParse(relative,!1,!0)).format()},Url.prototype.resolveObject=function(relative){if("string"==typeof relative){var rel=new Url;rel.parse(relative,!1,!0),relative=rel}for(var result=new Url,tkeys=Object.keys(this),tk=0;tk<tkeys.length;tk++){var tkey=tkeys[tk];result[tkey]=this[tkey]}
/*
   * hash is always overridden, no matter what.
   * even href="" will remove it.
   */
// if the relative url is empty, then there's nothing left to do here.
if(result.hash=relative.hash,""===relative.href)return result.href=result.format(),result;
// hrefs like //foo/bar always cut to the protocol.
if(relative.slashes&&!relative.protocol){for(
// take everything except the protocol from relative
var rkeys=Object.keys(relative),rk=0;rk<rkeys.length;rk++){var rkey=rkeys[rk];"protocol"!==rkey&&(result[rkey]=relative[rkey])}
// urlParse appends trailing / to urls like http://www.example.com
return slashedProtocol[result.protocol]&&result.hostname&&!result.pathname&&(result.pathname="/",result.path=result.pathname),result.href=result.format(),result}if(relative.protocol&&relative.protocol!==result.protocol){
/*
     * if it's a known url protocol, then changing
     * the protocol does weird things
     * first, if it's not file:, then we MUST have a host,
     * and if there was a path
     * to begin with, then we MUST have a path.
     * if it is file:, then the host is dropped,
     * because that's known to be hostless.
     * anything else is assumed to be absolute.
     */
if(!slashedProtocol[relative.protocol]){for(var keys=Object.keys(relative),v=0;v<keys.length;v++){var k=keys[v];result[k]=relative[k]}return result.href=result.format(),result}if(result.protocol=relative.protocol,relative.host||hostlessProtocol[relative.protocol])result.pathname=relative.pathname;else{for(var relPath=(relative.pathname||"").split("/");relPath.length&&!(relative.host=relPath.shift()););relative.host||(relative.host=""),relative.hostname||(relative.hostname=""),""!==relPath[0]&&relPath.unshift(""),relPath.length<2&&relPath.unshift(""),result.pathname=relPath.join("/")}
// to support http.request
if(result.search=relative.search,result.query=relative.query,result.host=relative.host||"",result.auth=relative.auth,result.hostname=relative.hostname||relative.host,result.port=relative.port,result.pathname||result.search){var p=result.pathname||"",s=result.search||"";result.path=p+s}return result.slashes=result.slashes||relative.slashes,result.href=result.format(),result}var isSourceAbs=result.pathname&&"/"===result.pathname.charAt(0),isRelAbs=relative.host||relative.pathname&&"/"===relative.pathname.charAt(0),mustEndAbs=isRelAbs||isSourceAbs||result.host&&relative.pathname,removeAllDots=mustEndAbs,srcPath=result.pathname&&result.pathname.split("/")||[],psychotic=(relPath=relative.pathname&&relative.pathname.split("/")||[],result.protocol&&!slashedProtocol[result.protocol]);
/*
   * if the url is a non-slashed url, then relative
   * links like ../.. should be able
   * to crawl up to the hostname, as well.  This is strange.
   * result.protocol has already been set by now.
   * Later on, put the first path part into the host field.
   */if(psychotic&&(result.hostname="",result.port=null,result.host&&(""===srcPath[0]?srcPath[0]=result.host:srcPath.unshift(result.host)),result.host="",relative.protocol&&(relative.hostname=null,relative.port=null,relative.host&&(""===relPath[0]?relPath[0]=relative.host:relPath.unshift(relative.host)),relative.host=null),mustEndAbs=mustEndAbs&&(""===relPath[0]||""===srcPath[0])),isRelAbs)
// it's absolute.
result.host=relative.host||""===relative.host?relative.host:result.host,result.hostname=relative.hostname||""===relative.hostname?relative.hostname:result.hostname,result.search=relative.search,result.query=relative.query,srcPath=relPath;else if(relPath.length)
/*
     * it's relative
     * throw away the existing file, and take the new path instead.
     */
srcPath||(srcPath=[]),srcPath.pop(),srcPath=srcPath.concat(relPath),result.search=relative.search,result.query=relative.query;else if(null!=relative.search){
/*
     * just pull out the search.
     * like href='?foo'.
     * Put this after the other two cases because it simplifies the booleans
     */
if(psychotic)result.host=srcPath.shift(),result.hostname=result.host,(authInHost=!!(result.host&&result.host.indexOf("@")>0)&&result.host.split("@"))&&(result.auth=authInHost.shift(),result.hostname=authInHost.shift(),result.host=result.hostname);return result.search=relative.search,result.query=relative.query,
// to support http.request
null===result.pathname&&null===result.search||(result.path=(result.pathname?result.pathname:"")+(result.search?result.search:"")),result.href=result.format(),result}if(!srcPath.length)
/*
     * no path at all.  easy.
     * we've already handled the other stuff above.
     */
return result.pathname=null,
// to support http.request
result.search?result.path="/"+result.search:result.path=null,result.href=result.format(),result;
/*
   * if a url ENDs in . or .., then it must get a trailing slash.
   * however, if it ends in anything else non-slashy,
   * then it must NOT get a trailing slash.
   */for(var last=srcPath.slice(-1)[0],hasTrailingSlash=(result.host||relative.host||srcPath.length>1)&&("."===last||".."===last)||""===last,up=0,i=srcPath.length;i>=0;i--)"."===(last=srcPath[i])?srcPath.splice(i,1):".."===last?(srcPath.splice(i,1),up++):up&&(srcPath.splice(i,1),up--);
// if the path is allowed to go above the root, restore leading ..s
if(!mustEndAbs&&!removeAllDots)for(;up--;up)srcPath.unshift("..");!mustEndAbs||""===srcPath[0]||srcPath[0]&&"/"===srcPath[0].charAt(0)||srcPath.unshift(""),hasTrailingSlash&&"/"!==srcPath.join("/").substr(-1)&&srcPath.push("");var authInHost,isAbsolute=""===srcPath[0]||srcPath[0]&&"/"===srcPath[0].charAt(0);
// put the host back
psychotic&&(result.hostname=isAbsolute?"":srcPath.length?srcPath.shift():"",result.host=result.hostname,(authInHost=!!(result.host&&result.host.indexOf("@")>0)&&result.host.split("@"))&&(result.auth=authInHost.shift(),result.hostname=authInHost.shift(),result.host=result.hostname));return(mustEndAbs=mustEndAbs||result.host&&srcPath.length)&&!isAbsolute&&srcPath.unshift(""),srcPath.length>0?result.pathname=srcPath.join("/"):(result.pathname=null,result.path=null),
// to support request.http
null===result.pathname&&null===result.search||(result.path=(result.pathname?result.pathname:"")+(result.search?result.search:"")),result.auth=relative.auth||result.auth,result.slashes=result.slashes||relative.slashes,result.href=result.format(),result},Url.prototype.parseHost=function(){var host=this.host,port=portPattern.exec(host);port&&(":"!==(port=port[0])&&(this.port=port.substr(1)),host=host.substr(0,host.length-port.length)),host&&(this.hostname=host)},exports.parse=urlParse,exports.resolve=function(source,relative){return urlParse(source,!1,!0).resolve(relative)},exports.resolveObject=function(source,relative){return source?urlParse(source,!1,!0).resolveObject(relative):relative},exports.format=
// format a parsed object into a url string
function(obj){
/*
   * ensure it's an object, and not a string url.
   * If it's an obj, this is a no-op.
   * this way, you can call url_format() on strings
   * to clean up potentially wonky urls.
   */
return"string"==typeof obj&&(obj=urlParse(obj)),obj instanceof Url?obj.format():Url.prototype.format.call(obj)},exports.Url=Url},
/***/9155(module){"use strict";module.exports="#version 300 es\n// ===================================================\n// Slug algorithm fragment shader — GLSL ES 3.00 port.\n// Based on the reference Slug shader by Eric Lengyel.\n// ===================================================\nprecision highp float;\nprecision highp int;\nprecision highp sampler2D;\n\n#define kLogBandTextureWidth 12\n#define kMaxCurvesPerBand 512\n#define kQuadraticEpsilon 0.0001\n\nin vec4 vColor;\nin vec2 vTexcoord;\nflat in vec4 vBanding;\nflat in ivec4 vGlyph;\n\nuniform sampler2D uCurveTexture;\nuniform sampler2D uBandTexture;\nuniform int uSupersampleCount;\nuniform float uStrokeExpand;     // Stroke expansion in pixels. 0 = normal fill.\nuniform float uStrokeAlphaStart; // Starting alpha at inner stroke edge. @default 1.0\nuniform float uStrokeAlphaRate;  // Alpha change per pixel outward. 0 = uniform. @default 0.0\n\n// Band texture stores uint32 data as float32 bit patterns (ArrayBuffer reinterpretation).\n// floatBitsToUint recovers the exact uint32 values losslessly — no rounding needed.\nuvec2 fetchBand(ivec2 coord)\n{\n\tvec2 raw = texelFetch(uBandTexture, coord, 0).xy;\n\treturn uvec2(floatBitsToUint(raw.x), floatBitsToUint(raw.y));\n}\n\nivec2 CalcBandLoc(ivec2 glyphLoc, uint offset)\n{\n\tivec2 bandLoc = ivec2(glyphLoc.x + int(offset), glyphLoc.y);\n\tbandLoc.y += bandLoc.x >> kLogBandTextureWidth;\n\tbandLoc.x &= (1 << kLogBandTextureWidth) - 1;\n\treturn bandLoc;\n}\n\n// Combine horizontal and vertical fractional winding into coverage.\n// Near edges (high weight): weighted average provides smooth antialiasing.\n// Interior (low weight): max(abs(xcov), abs(ycov)) provides solid fill.\n// max() is used instead of min() to handle glyphs with oppositely-wound\n// contours where one axis cancels to ~0 while the other reads ~1.\nfloat CalcCoverage(float xcov, float ycov, float xwgt, float ywgt)\n{\n\tfloat coverage = max(\n\t\tabs(xcov * xwgt + ycov * ywgt) / max(xwgt + ywgt, 1.0 / 65536.0),\n\t\tmax(abs(xcov), abs(ycov))\n\t);\n\n\treturn clamp(sqrt(abs(coverage)), 0.0, 1.0);\n}\n\nout vec4 fragColor;\n\n// Returns vec2(coverage, minBoundaryDist).\n// minBoundaryDist is the minimum absolute distance (in pixels) from this\n// pixel to any curve crossing — an approximation of the distance to the\n// nearest glyph boundary. Used for stroke alpha gradient.\nvec2 SlugRenderEx(vec2 renderCoord, vec4 bandTransform, ivec4 glyphData, float strokePx)\n{\n\tvec2 pixelsPerEm = vec2(1.0 / max(fwidth(renderCoord.x), 1.0 / 65536.0),\n\t                        1.0 / max(fwidth(renderCoord.y), 1.0 / 65536.0));\n\n\t// Early-out threshold: expanded by stroke so curves within stroke range\n\t// are not skipped. When strokePx is 0 this reduces to the original -0.5.\n\tfloat earlyOutBias = -0.5 - strokePx;\n\n\tivec2 bandMax = glyphData.zw;\n\tbandMax.y &= 0x00FF;\n\n\tivec2 bandIndex = clamp(ivec2(renderCoord * bandTransform.xy + bandTransform.zw), ivec2(0, 0), bandMax);\n\tivec2 glyphLoc = glyphData.xy;\n\n\tfloat xcov = 0.0;\n\tfloat xwgt = 0.0;\n\tfloat minDist = 1e10;\n\n\t// ---------------------------------------------------------------\n\t// Horizontal ray (+X direction)\n\t// ---------------------------------------------------------------\n\n\tuvec2 hbandData = fetchBand(ivec2(glyphLoc.x + bandIndex.y, glyphLoc.y));\n\tivec2 hbandLoc = CalcBandLoc(glyphLoc, hbandData.y);\n\n\tint hcount = min(int(hbandData.x), kMaxCurvesPerBand);\n\tfor (int curveIndex = 0; curveIndex < hcount; curveIndex++)\n\t{\n\t\tivec2 curveLoc = ivec2(fetchBand(ivec2(hbandLoc.x + curveIndex, hbandLoc.y)));\n\t\tvec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);\n\t\tvec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;\n\n\t\tif (max(max(p12.x, p12.z), p3.x) * pixelsPerEm.x < earlyOutBias) break;\n\n\t\tuint code = (0x2E74u >> (((p12.y > 0.0) ? 2u : 0u) +\n\t\t        ((p12.w > 0.0) ? 4u : 0u) + ((p3.y > 0.0) ? 8u : 0u))) & 3u;\n\n\t\tif (code != 0u)\n\t\t{\n\t\t\tfloat ax = p12.x - p12.z * 2.0 + p3.x;\n\t\t\tfloat ay = p12.y - p12.w * 2.0 + p3.y;\n\t\t\tfloat bx = p12.x - p12.z;\n\t\t\tfloat by = p12.y - p12.w;\n\t\t\tfloat ra = 1.0 / ay;\n\n\t\t\tfloat d = sqrt(max(by * by - ay * p12.y, 0.0));\n\t\t\tfloat t1 = (by - d) * ra;\n\t\t\tfloat t2 = (by + d) * ra;\n\n\t\t\tif (abs(ay) < kQuadraticEpsilon)\n\t\t\t{\n\t\t\t\tif (abs(by) < kQuadraticEpsilon) continue;\n\t\t\t\tt1 = p12.y * 0.5 / by;\n\t\t\t\tt2 = t1;\n\t\t\t}\n\n\t\t\tfloat x1 = (ax * t1 - bx * 2.0) * t1 + p12.x;\n\t\t\tfloat x2 = (ax * t2 - bx * 2.0) * t2 + p12.x;\n\t\t\tx1 *= pixelsPerEm.x;\n\t\t\tx2 *= pixelsPerEm.x;\n\n\t\t\t// Track minimum distance to any curve crossing (unsigned).\n\t\t\tif ((code & 1u) != 0u) minDist = min(minDist, abs(x1));\n\t\t\tif (code > 1u) minDist = min(minDist, abs(x2));\n\n\t\t\t// Stroke dilation: entry crossings shift inward (+strokePx),\n\t\t\t// exit crossings shift outward (-strokePx).\n\t\t\tif ((code & 1u) != 0u)\n\t\t\t{\n\t\t\t\tfloat sx1 = x1 + strokePx;\n\t\t\t\txcov += clamp(sx1 + 0.5, 0.0, 1.0);\n\t\t\t\txwgt = max(xwgt, clamp(1.0 - abs(sx1) * 2.0, 0.0, 1.0));\n\t\t\t}\n\n\t\t\tif (code > 1u)\n\t\t\t{\n\t\t\t\tfloat sx2 = x2 - strokePx;\n\t\t\t\txcov -= clamp(sx2 + 0.5, 0.0, 1.0);\n\t\t\t\txwgt = max(xwgt, clamp(1.0 - abs(sx2) * 2.0, 0.0, 1.0));\n\t\t\t}\n\t\t}\n\t}\n\n\t// ---------------------------------------------------------------\n\t// Vertical ray (+Y direction)\n\t// Same solver as horizontal with x↔y roles swapped.\n\t// ---------------------------------------------------------------\n\n\tfloat ycov = 0.0;\n\tfloat ywgt = 0.0;\n\n\tuvec2 vbandData = fetchBand(ivec2(glyphLoc.x + bandMax.y + 1 + bandIndex.x, glyphLoc.y));\n\tivec2 vbandLoc = CalcBandLoc(glyphLoc, vbandData.y);\n\n\tint vcount = min(int(vbandData.x), kMaxCurvesPerBand);\n\tfor (int curveIndex = 0; curveIndex < vcount; curveIndex++)\n\t{\n\t\tivec2 curveLoc = ivec2(fetchBand(ivec2(vbandLoc.x + curveIndex, vbandLoc.y)));\n\t\tvec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);\n\t\tvec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;\n\n\t\tif (max(max(p12.y, p12.w), p3.y) * pixelsPerEm.y < earlyOutBias) break;\n\n\t\tuint code = (0x2E74u >> (((p12.x > 0.0) ? 2u : 0u) +\n\t\t        ((p12.z > 0.0) ? 4u : 0u) + ((p3.x > 0.0) ? 8u : 0u))) & 3u;\n\n\t\tif (code != 0u)\n\t\t{\n\t\t\tfloat ax = p12.y - p12.w * 2.0 + p3.y;\n\t\t\tfloat ay = p12.x - p12.z * 2.0 + p3.x;\n\t\t\tfloat bx = p12.y - p12.w;\n\t\t\tfloat by = p12.x - p12.z;\n\t\t\tfloat ra = 1.0 / ay;\n\n\t\t\tfloat d = sqrt(max(by * by - ay * p12.x, 0.0));\n\t\t\tfloat t1 = (by - d) * ra;\n\t\t\tfloat t2 = (by + d) * ra;\n\n\t\t\tif (abs(ay) < kQuadraticEpsilon)\n\t\t\t{\n\t\t\t\tif (abs(by) < kQuadraticEpsilon) continue;\n\t\t\t\tt1 = p12.x * 0.5 / by;\n\t\t\t\tt2 = t1;\n\t\t\t}\n\n\t\t\tfloat y1 = (ax * t1 - bx * 2.0) * t1 + p12.y;\n\t\t\tfloat y2 = (ax * t2 - bx * 2.0) * t2 + p12.y;\n\t\t\ty1 *= pixelsPerEm.y;\n\t\t\ty2 *= pixelsPerEm.y;\n\n\t\t\t// Track minimum distance to any curve crossing (unsigned).\n\t\t\tif ((code & 1u) != 0u) minDist = min(minDist, abs(y1));\n\t\t\tif (code > 1u) minDist = min(minDist, abs(y2));\n\n\t\t\t// Vertical stroke dilation: signs flipped from horizontal\n\t\t\t// because +Y em-space is up but +Y screen-space is down.\n\t\t\tif ((code & 1u) != 0u)\n\t\t\t{\n\t\t\t\tfloat sy1 = y1 - strokePx;\n\t\t\t\tycov += clamp(sy1 + 0.5, 0.0, 1.0);\n\t\t\t\tywgt = max(ywgt, clamp(1.0 - abs(sy1) * 2.0, 0.0, 1.0));\n\t\t\t}\n\n\t\t\tif (code > 1u)\n\t\t\t{\n\t\t\t\tfloat sy2 = y2 + strokePx;\n\t\t\t\tycov -= clamp(sy2 + 0.5, 0.0, 1.0);\n\t\t\t\tywgt = max(ywgt, clamp(1.0 - abs(sy2) * 2.0, 0.0, 1.0));\n\t\t\t}\n\t\t}\n\t}\n\n\tfloat coverage = CalcCoverage(xcov, ycov, xwgt, ywgt);\n\treturn vec2(coverage, minDist);\n}\n\n// Convenience wrapper that returns only coverage (used by fill pass and supersampling).\nfloat SlugRender(vec2 renderCoord, vec4 bandTransform, ivec4 glyphData, float strokePx)\n{\n\treturn SlugRenderEx(renderCoord, bandTransform, glyphData, strokePx).x;\n}\n\nvoid main()\n{\n\tfloat coverage;\n\tint sampleCount = min(uSupersampleCount, 16);\n\tfloat strokePx = uStrokeExpand;\n\tbool useGradientAlpha = (strokePx > 0.0 && uStrokeAlphaRate != 0.0);\n\n\t// When gradient alpha is active and no supersampling, use SlugRenderEx\n\t// to get both coverage and boundary distance in a single pass.\n\tif (useGradientAlpha && sampleCount <= 1)\n\t{\n\t\tvec2 result = SlugRenderEx(vTexcoord, vBanding, vGlyph, strokePx);\n\t\tcoverage = result.x;\n\n\t\t// minDist is the distance from the pixel to the nearest original\n\t\t// glyph boundary (before stroke expansion). Pixels at the inner\n\t\t// stroke edge have minDist ≈ 0, outer edge have minDist ≈ strokePx.\n\t\t// The per-pixel alpha is: alphaStart + alphaRate * minDist\n\t\tfloat dist = clamp(result.y, 0.0, strokePx);\n\t\tfloat alpha = clamp(uStrokeAlphaStart + uStrokeAlphaRate * dist, 0.0, 1.0);\n\t\tfragColor = vColor * coverage * alpha;\n\t\treturn;\n\t}\n\n\tif (sampleCount <= 1)\n\t{\n\t\tcoverage = SlugRender(vTexcoord, vBanding, vGlyph, strokePx);\n\t}\n\telse\n\t{\n\t\t// Supersampling with configurable sample count.\n\t\t// Offsets are in em-space, derived from screen-space derivatives so they\n\t\t// scale correctly at any font size or transform.\n\t\tvec2 dx = dFdx(vTexcoord) * 0.5;\n\t\tvec2 dy = dFdy(vTexcoord) * 0.5;\n\n\t\tif (sampleCount <= 2)\n\t\t{\n\t\t\t// 2-sample: diagonal pair\n\t\t\tfloat c0 = SlugRender(vTexcoord + dx * 0.25 + dy * 0.25, vBanding, vGlyph, strokePx);\n\t\t\tfloat c1 = SlugRender(vTexcoord - dx * 0.25 - dy * 0.25, vBanding, vGlyph, strokePx);\n\t\t\tcoverage = (c0 + c1) * 0.5;\n\t\t}\n\t\telse if (sampleCount <= 4)\n\t\t{\n\t\t\t// 4-sample rotated-grid supersampling (RGSS pattern).\n\t\t\tfloat c0 = SlugRender(vTexcoord + dx * 0.125 + dy * 0.375, vBanding, vGlyph, strokePx);\n\t\t\tfloat c1 = SlugRender(vTexcoord - dx * 0.125 - dy * 0.375, vBanding, vGlyph, strokePx);\n\t\t\tfloat c2 = SlugRender(vTexcoord + dx * 0.375 - dy * 0.125, vBanding, vGlyph, strokePx);\n\t\t\tfloat c3 = SlugRender(vTexcoord - dx * 0.375 + dy * 0.125, vBanding, vGlyph, strokePx);\n\t\t\tcoverage = (c0 + c1 + c2 + c3) * 0.25;\n\t\t}\n\t\telse if (sampleCount <= 8)\n\t\t{\n\t\t\t// 8-sample: 8-queens pattern (good spatial distribution)\n\t\t\tfloat c0 = SlugRender(vTexcoord + dx * 0.0625 + dy * 0.4375, vBanding, vGlyph, strokePx);\n\t\t\tfloat c1 = SlugRender(vTexcoord - dx * 0.0625 - dy * 0.4375, vBanding, vGlyph, strokePx);\n\t\t\tfloat c2 = SlugRender(vTexcoord + dx * 0.3125 - dy * 0.0625, vBanding, vGlyph, strokePx);\n\t\t\tfloat c3 = SlugRender(vTexcoord - dx * 0.3125 + dy * 0.0625, vBanding, vGlyph, strokePx);\n\t\t\tfloat c4 = SlugRender(vTexcoord + dx * 0.1875 + dy * 0.1875, vBanding, vGlyph, strokePx);\n\t\t\tfloat c5 = SlugRender(vTexcoord - dx * 0.1875 - dy * 0.1875, vBanding, vGlyph, strokePx);\n\t\t\tfloat c6 = SlugRender(vTexcoord + dx * 0.4375 - dy * 0.3125, vBanding, vGlyph, strokePx);\n\t\t\tfloat c7 = SlugRender(vTexcoord - dx * 0.4375 + dy * 0.3125, vBanding, vGlyph, strokePx);\n\t\t\tcoverage = (c0 + c1 + c2 + c3 + c4 + c5 + c6 + c7) * 0.125;\n\t\t}\n\t\telse\n\t\t{\n\t\t\t// 16-sample: 4x4 jittered grid for maximum quality\n\t\t\tfloat sum = 0.0;\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.0625 + dy * 0.4375, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.4375 + dy * 0.0625, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.3125 - dy * 0.1875, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.1875 - dy * 0.3125, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.1875 + dy * 0.1875, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.0625 - dy * 0.4375, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.4375 - dy * 0.0625, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.3125 + dy * 0.3125, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.125 + dy * 0.375, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.375 + dy * 0.125, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.375 - dy * 0.125, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.125 - dy * 0.375, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.25 + dy * 0.25, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.25 - dy * 0.25, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.0 + dy * 0.0, vBanding, vGlyph, strokePx);\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.5 + dy * 0.5, vBanding, vGlyph, strokePx);\n\t\t\tcoverage = sum * 0.0625;\n\t\t}\n\t}\n\n\t// Apply stroke alpha (uStrokeAlphaStart). For fill passes (uStrokeExpand == 0)\n\t// uStrokeAlphaStart defaults to 1.0, so this is a no-op.\n\tfragColor = vColor * coverage * uStrokeAlphaStart;\n}\n"},
/***/1038(module){"use strict";module.exports="#version 300 es\n// ===================================================\n// Slug algorithm vertex shader — GLSL ES 3.00 port.\n// PixiJS v7 variant: uses v7 uniform names.\n// ===================================================\n\n// Per-vertex attribute layout:\n//\n// 0 - pos  : object-space vertex coords (xy) and normal vector (zw)\n// 1 - tex  : em-space sample coords (xy), packed glyph data location (z), packed band max + flags (w)\n// 2 - jac  : inverse Jacobian matrix entries (00, 01, 10, 11)\n// 3 - bnd  : band scale x, band scale y, band offset x, band offset y\n// 4 - col  : vertex color (rgba)\n\nprecision highp float;\nprecision highp int;\n\nlayout(location = 0) in vec4 aPositionNormal; // pos xy + normal zw\nlayout(location = 1) in vec4 aTexcoord;       // em-space uv + packed glyph loc + packed bands\nlayout(location = 2) in vec4 aJacobian;       // inverse Jacobian (00, 01, 10, 11)\nlayout(location = 3) in vec4 aBanding;        // band scale xy + band offset xy\nlayout(location = 4) in vec4 aColor;          // vertex color rgba\n\n// PixiJS v7 uniforms — names differ from v8.\n// projectionMatrix is auto-populated via renderer.globalUniforms.\n// translationMatrix is set per-mesh by Mesh._renderDefault().\nuniform mat3 projectionMatrix;\nuniform mat3 translationMatrix;\n\n// Viewport size must be provided manually in v7 (no built-in uResolution).\nuniform vec2 uResolution;\n\nout vec4 vColor;\nout vec2 vTexcoord;\nflat out vec4 vBanding;\nflat out ivec4 vGlyph;\n\nvoid SlugUnpack(vec4 tex, vec4 bnd, out vec4 vbnd, out ivec4 vgly)\n{\n\tuvec2 g = floatBitsToUint(tex.zw);\n\tvgly = ivec4(\n\t\tint(g.x & 0xFFFFu),\n\t\tint(g.x >> 16u),\n\t\tint(g.y & 0xFFFFu),\n\t\tint(g.y >> 16u)\n\t);\n\tvbnd = bnd;\n}\n\nvec2 SlugDilate(vec4 pos, vec4 tex, vec4 jac, mat4 mvp, vec2 dim, out vec2 vpos)\n{\n\t// INVARIANT: pos.zw (normal) must be nonzero.\n\tvec2 n = normalize(pos.zw);\n\n\tvec4 Mpos = mvp * vec4(pos.xy, 0.0, 1.0);\n\tvec4 Mn   = mvp * vec4(n,      0.0, 0.0);\n\n\tfloat s = Mpos.w;\n\tfloat t = Mn.w;\n\n\tfloat u = (s * Mn.x - t * Mpos.x) * dim.x;\n\tfloat v = (s * Mn.y - t * Mpos.y) * dim.y;\n\n\tfloat s2 = s * s;\n\tfloat st = s * t;\n\tfloat uv = u * u + v * v;\n\n\tfloat denom = uv - st * st;\n\tif (abs(denom) < 1e-10)\n\t{\n\t\tvpos = pos.xy;\n\t\treturn tex.xy;\n\t}\n\n\tvec2 d = pos.zw * (s2 * (st + sqrt(uv)) / denom);\n\n\tvpos = pos.xy + d;\n\treturn vec2(tex.x + dot(d, jac.xy), tex.y + dot(d, jac.zw));\n}\n\nvoid main()\n{\n\t// Combine projection and world transform into a single 2D affine mat3,\n\t// then lift it to a column-major mat4 for the Slug dilation algorithm.\n\t// The W row is (0,0,0,1) — correct for orthographic projection.\n\tmat3 m = projectionMatrix * translationMatrix;\n\tmat4 mvp = mat4(\n\t\tm[0][0], m[0][1], 0.0, 0.0,  // column 0\n\t\tm[1][0], m[1][1], 0.0, 0.0,  // column 1\n\t\t0.0,     0.0,     1.0, 0.0,  // column 2\n\t\tm[2][0], m[2][1], 0.0, 1.0   // column 3\n\t);\n\n\tvec2 dim = uResolution * 0.5;\n\n\tvec2 p;\n\tvTexcoord = SlugDilate(aPositionNormal, aTexcoord, aJacobian, mvp, dim, p);\n\n\tgl_Position = mvp * vec4(p, 0.0, 1.0);\n\n\tSlugUnpack(aTexcoord, aBanding, vBanding, vGlyph);\n\tvColor = aColor;\n}\n"},
/***/3780(module){"use strict";module.exports=__WEBPACK_EXTERNAL_MODULE__3780__},
/***/6492(module){"use strict";module.exports=__WEBPACK_EXTERNAL_MODULE__6492__},
/***/9564(module){"use strict";module.exports=__WEBPACK_EXTERNAL_MODULE__9564__},
/***/2634(){
/* (ignored) */
/***/},
/***/7256(){
/* (ignored) */
/***/}
/******/},__webpack_module_cache__={};
/************************************************************************/
/******/ // The module cache
/******/
/******/
/******/ // The require function
/******/function __webpack_require__(moduleId){
/******/ // Check if module is in cache
/******/var cachedModule=__webpack_module_cache__[moduleId];
/******/if(void 0!==cachedModule)
/******/return cachedModule.exports;
/******/
/******/ // Create a new module (and put it into the cache)
/******/var module=__webpack_module_cache__[moduleId]={
/******/id:moduleId,
/******/loaded:!1,
/******/exports:{}
/******/};
/******/
/******/ // Execute the module function
/******/
/******/
/******/ // Return the exports of the module
/******/return __webpack_modules__[moduleId].call(module.exports,module,module.exports,__webpack_require__),
/******/
/******/ // Flag the module as loaded
/******/module.loaded=!0,module.exports;
/******/}
/******/
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/
/******/ // define getter functions for harmony exports
/******/__webpack_require__.d=(exports,definition)=>{
/******/for(var key in definition)
/******/__webpack_require__.o(definition,key)&&!__webpack_require__.o(exports,key)&&
/******/Object.defineProperty(exports,key,{enumerable:!0,get:definition[key]})
/******/;
/******/},
/******/__webpack_require__.g=function(){
/******/if("object"==typeof globalThis)return globalThis;
/******/try{
/******/return this||new Function("return this")();
/******/}catch(e){
/******/if("object"==typeof window)return window;
/******/}
/******/}(),
/******/__webpack_require__.o=(obj,prop)=>Object.prototype.hasOwnProperty.call(obj,prop)
/******/,
/******/ // define __esModule on exports
/******/__webpack_require__.r=exports=>{
/******/"undefined"!=typeof Symbol&&Symbol.toStringTag&&
/******/Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"})
/******/,Object.defineProperty(exports,"__esModule",{value:!0})},
/******/__webpack_require__.nmd=module=>(
/******/module.paths=[],
/******/module.children||(module.children=[])
/******/,module);
/******/
/************************************************************************/
var __webpack_exports__={};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
/******/return(()=>{"use strict";var exports=__webpack_exports__;Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugFontGpuV6=exports.slugShader=exports.SlugText=exports.SlugFont=void 0;var font_1=__webpack_require__(8330);Object.defineProperty(exports,"SlugFont",{enumerable:!0,get:function(){return font_1.SlugFont}});var text_1=__webpack_require__(7241);Object.defineProperty(exports,"SlugText",{enumerable:!0,get:function(){return text_1.SlugText}});var shader_1=__webpack_require__(5827);Object.defineProperty(exports,"slugShader",{enumerable:!0,get:function(){return shader_1.slugShader}});var gpu_1=__webpack_require__(2754);Object.defineProperty(exports,"slugFontGpuV6",{enumerable:!0,get:function(){return gpu_1.slugFontGpuV6}})})(),__webpack_exports__;
/******/})());