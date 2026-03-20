!function(root,factory){"object"==typeof exports&&"object"==typeof module?module.exports=factory(require("pixi.js")):"function"==typeof define&&define.amd?define([],factory):"object"==typeof exports?exports.pixiSlug=factory(require("pixi.js")):root.pixiSlug=factory(root.PIXI)}(this,__WEBPACK_EXTERNAL_MODULE__0__=>/******/(()=>{// webpackBootstrap
/******/var __webpack_modules__={
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
Font.prototype.download=function(fileName){var familyName=this.getEnglishName("fontFamily"),styleName=this.getEnglishName("fontSubfamily");fileName=fileName||familyName.replace(/\s/g,"")+"-"+styleName+".otf";var arrayBuffer=this.toArrayBuffer();if("undefined"!=typeof window)if(window.URL=window.URL||window.webkitURL,window.URL){var dataView=new DataView(arrayBuffer),blob=new Blob([dataView],{type:"font/opentype"}),link=document.createElement("a");link.href=window.URL.createObjectURL(blob),link.download=fileName;var event=document.createEvent("MouseEvents");event.initEvent("click",!0,!1),link.dispatchEvent(event)}else console.warn("Font file could not be downloaded. Try using a different browser.");else{var fs=__webpack_require__(256),buffer=function(ab){for(var buffer=new Buffer(ab.byteLength),view=new Uint8Array(ab),i=0;i<buffer.length;++i)buffer[i]=view[i];return buffer}(arrayBuffer);fs.writeFileSync(fileName,buffer)}},
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
 */function loadFromFile(path,callback){__webpack_require__(256).readFile(path,function(err,buffer){if(err)return callback(err.message);callback(null,nodeBufferToArrayBuffer(buffer))})}
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
 */function loadSync(url,opt){return parseBuffer(nodeBufferToArrayBuffer(__webpack_require__(256).readFileSync(url)),opt)}
/* harmony default export */const __WEBPACK_DEFAULT_EXPORT__=Object.freeze({__proto__:null,Font,Glyph,Path,BoundingBox,_parse:parse,parse:parseBuffer,load,loadSync});
//# sourceMappingURL=opentype.module.js.map
/***/},
/***/195(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Defaults=void 0;class Defaults{}exports.Defaults=Defaults,
/** Default texture size applied to both width & length. */
Defaults.TEXTURE_SIZE=4096,
/** Default number of horizontal/vertical bands per glyph for spatial indexing. */
Defaults.BAND_COUNT=32,
/** Default font size in pixels. */
Defaults.FONT_SIZE=24,
/** Default number of supersamples when supersampling is enabled. */
Defaults.SUPERSAMPLE_COUNT=4,
/** Maximum allowed supersample count. The shader has patterns up to 16 samples. */
Defaults.MAX_SUPERSAMPLE_COUNT=16},
/***/330(__unused_webpack_module,exports,__webpack_require__){"use strict";var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.SlugFont=void 0;const opentype_js_1=__importDefault(__webpack_require__(945)),defaults_1=__webpack_require__(195),curves_1=__webpack_require__(708),bands_1=__webpack_require__(382),pack_1=__webpack_require__(238);exports.SlugFont=
/**
 * Preprocesses font glyph outlines into GPU-ready curve and band textures
 * for the Slug rendering algorithm.
 */
class{constructor(textureWidth=defaults_1.Defaults.TEXTURE_SIZE){if(textureWidth<=0||textureWidth&textureWidth-1)throw new Error(`textureWidth must be a power of 2, got ${textureWidth}`);this.textureWidth=textureWidth,this.curveData=new Float32Array(0),this.bandData=new Uint32Array(0),this.glyphs=new Map,this.advances=new Map,this.unitsPerEm=0}
/**
     * Load and preprocess a font file into curve and band texture data.
     * Extracts glyph outlines as quadratic Bezier curves and packs them
     * into the format expected by the Slug shaders.
     *
     * @param fontData		ArrayBuffer containing the font file (TTF/OTF)
     */
/**
     * GPU memory consumed by this font's curve and band textures, in bytes.
     * Both textures use rgba32float (4 channels × 4 bytes per texel).
     * This is shared across all SlugText instances that use this font.
     */memoryBytes(){const textureWidth=this.textureWidth;// rgba32float
return((Math.ceil(this.curveData.length/4/textureWidth)||1)+(Math.ceil(this.bandData.length/4/textureWidth)||1))*textureWidth*16}async load(fontData){const font=opentype_js_1.default.parse(fontData);this.unitsPerEm=font.unitsPerEm;const glyphList=[];for(let i=0;i<font.glyphs.length;i++){const glyph=font.glyphs.get(i),charCode=glyph.unicode;if(
// Store advance width for all glyphs (including space/empty)
void 0!==charCode&&glyph.advanceWidth&&this.advances.set(charCode,glyph.advanceWidth),!glyph.path||0===glyph.path.commands.length)continue;if(void 0===charCode)continue;
// Extract quadratic Bezier curves from glyph path
const curves=(0,curves_1.slugGlyphCurves)(glyph.path.commands);if(0===curves.length)continue;
// Compute bounding box from glyph metrics
const bounds=glyph.getBoundingBox(),bandResult=(0,bands_1.slugGlyphBands)(curves,bounds.x1,bounds.y1,bounds.x2,bounds.y2),glyphData={charCode,curves,bounds:{minX:bounds.x1,minY:bounds.y1,maxX:bounds.x2,maxY:bounds.y2},advanceWidth:glyph.advanceWidth??0,lsb:glyph.leftSideBearing??0,hBandCount:bandResult.hBandCount,vBandCount:bandResult.vBandCount,hBands:bandResult.hBands,vBands:bandResult.vBands,curveOffset:0,bandOffset:0};
// Compute band assignments
glyphList.push(glyphData),this.glyphs.set(charCode,glyphData)}
// Pack all glyph data into GPU textures
const packed=(0,pack_1.slugTexturePack)(glyphList,this.textureWidth);this.curveData=packed.curveData,this.bandData=packed.bandData}}},
/***/382(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugGlyphBands=
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
/***/;const defaults_1=__webpack_require__(195),_boundsF32=new Float32Array(6);
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
/***/708(__unused_webpack_module,exports){"use strict";
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
 */Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugGlyphCurves=function(commands){const curves=[];let curX=0,curY=0,subpathStartX=0,subpathStartY=0;for(const cmd of commands)switch(cmd.type){case"M":curX=cmd.x,curY=cmd.y,subpathStartX=cmd.x,subpathStartY=cmd.y;break;case"L":curves.push(lineToQuadratic(curX,curY,cmd.x,cmd.y)),curX=cmd.x,curY=cmd.y;break;case"Q":curves.push({p1x:curX,p1y:curY,p2x:cmd.x1,p2y:cmd.y1,p3x:cmd.x,p3y:cmd.y}),curX=cmd.x,curY=cmd.y;break;case"C":curves.push(...cubicToQuadratics(curX,curY,cmd.x1,cmd.y1,cmd.x2,cmd.y2,cmd.x,cmd.y)),curX=cmd.x,curY=cmd.y;break;case"Z":
// Close path: add closing line if the current position is not already at the subpath start.
(Math.abs(curX-subpathStartX)>1e-6||Math.abs(curY-subpathStartY)>1e-6)&&curves.push(lineToQuadratic(curX,curY,subpathStartX,subpathStartY)),curX=subpathStartX,curY=subpathStartY}return curves}
/***/},
/***/727(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugGlyphQuads=
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
 */
function(text,glyphs,advances,unitsPerEm,fontSize,textureWidth,color=[1,1,1,1]){const scale=fontSize/unitsPerEm;
// Count renderable glyphs and find the tallest glyph's top in em-space.
// We use the actual max bounds.maxY (not the font's typographic ascender)
// so that position(0,0) aligns the top of the tallest rendered glyph to y=0,
// matching PixiJS Text behavior. The typographic ascender from the OS/2 table
// includes extra line-gap space that would produce a visible offset.
let quadCount=0,maxGlyphTop=0;for(let i=0;i<text.length;i++){const g=glyphs.get(text.charCodeAt(i));g&&(quadCount++,g.bounds.maxY>maxGlyphTop&&(maxGlyphTop=g.bounds.maxY))}const baselineY=maxGlyphTop*scale,vertices=new Float32Array(4*quadCount*20),indices=new Uint32Array(6*quadCount);let cursorX=0,quadIdx=0;for(let i=0;i<text.length;i++){const charCode=text.charCodeAt(i),glyph=glyphs.get(charCode);if(!glyph){
// No curves for this char (e.g. space) — advance cursor using advance width
const adv=advances.get(charCode);adv&&(cursorX+=adv*scale);continue}const{bounds,hBandCount,vBandCount,bandOffset}=glyph,x0=cursorX+bounds.minX*scale,y0=-bounds.maxY*scale+baselineY,x1=cursorX+bounds.maxX*scale,y1=-bounds.minY*scale+baselineY,u0=bounds.minX,v0=bounds.minY,u1=bounds.maxX,v1=bounds.maxY,glyphWidth=bounds.maxX-bounds.minX,glyphHeight=bounds.maxY-bounds.minY,maxDim=Math.max(glyphWidth,glyphHeight),bandCount=Math.max(hBandCount,vBandCount),_f32=new Float32Array(4);
// Glyph quad corners in pixel space.
// Font Y is up (ascenders positive), screen Y is down.
// Negate Y to flip, then add baselineY so that position(0,0)
// places the ascender line at screen y=0.
_f32[0]=maxDim>0?bandCount/maxDim:0;// shared scale
const bandScale=_f32[0];_f32[1]=-bounds.minX*bandScale,// vBandOffset (X → vertical band)
_f32[2]=-bounds.minY*bandScale;// hBandOffset (Y → horizontal band)
const bandScaleX=bandScale,bandScaleY=bandScale,bandOffsetX=_f32[1],bandOffsetY=_f32[2],packedLocation=packUint16Pair(bandOffset%textureWidth,Math.floor(bandOffset/textureWidth)),packedBands=packBandMax(vBandCount-1,hBandCount-1),corners=[{px:x0,py:y0,nx:-1,ny:-1,eu:u0,ev:v1},// screen top-left = font (minX, maxY)
{px:x1,py:y0,nx:1,ny:-1,eu:u1,ev:v1},// screen top-right = font (maxX, maxY)
{px:x1,py:y1,nx:1,ny:1,eu:u1,ev:v0},// screen bottom-right = font (maxX, minY)
{px:x0,py:y1,nx:-1,ny:1,eu:u0,ev:v0}],baseVertex=4*quadIdx;for(let c=0;c<4;c++){const corner=corners[c],offset=20*(baseVertex+c);
// aPositionNormal (vec4): position xy + normal zw
vertices[offset]=corner.px,vertices[offset+1]=corner.py,vertices[offset+2]=corner.nx,vertices[offset+3]=corner.ny,
// aTexcoord (vec4): em-space uv + packed glyph location + packed bands
vertices[offset+4]=corner.eu,vertices[offset+5]=corner.ev,vertices[offset+6]=packedLocation,vertices[offset+7]=packedBands,
// aJacobian (vec4): inverse Jacobian mapping screen-space dilation back to em-space.
// Screen coords: x = fontX * scale, y = -fontY * scale (Y-flipped).
// So: d_emX = d_screenX / scale, d_emY = -d_screenY / scale.
vertices[offset+8]=1/scale,// jac.x: d(emX)/d(screenX)
vertices[offset+9]=0,// jac.y: d(emX)/d(screenY)
vertices[offset+10]=0,// jac.z: d(emY)/d(screenX)
vertices[offset+11]=-1/scale,// jac.w: d(emY)/d(screenY) — negative due to Y-flip
// aBanding (vec4): band scale xy + band offset xy
vertices[offset+12]=bandScaleX,vertices[offset+13]=bandScaleY,vertices[offset+14]=bandOffsetX,vertices[offset+15]=bandOffsetY,
// aColor (vec4): vertex color RGBA
vertices[offset+16]=color[0],vertices[offset+17]=color[1],vertices[offset+18]=color[2],vertices[offset+19]=color[3]}
// Two triangles: [0,1,2] and [0,2,3]
const idxOffset=6*quadIdx;indices[idxOffset]=baseVertex,indices[idxOffset+1]=baseVertex+1,indices[idxOffset+2]=baseVertex+2,indices[idxOffset+3]=baseVertex,indices[idxOffset+4]=baseVertex+2,indices[idxOffset+5]=baseVertex+3,cursorX+=glyph.advanceWidth*scale,quadIdx++}return{vertices,indices,quadCount}}
/***/;
/**
 * Pack a float into a uint32 bit pattern, stored as a float.
 * Used to pass packed integer data through float vertex attributes.
 */
function packUint16Pair(low,high){const uint32=(65535&high)<<16|65535&low,buf=new ArrayBuffer(4);
// Reinterpret uint32 bits as float32
return new Uint32Array(buf)[0]=uint32,new Float32Array(buf)[0]}
/**
 * Pack band max indices into a single float via uint32 reinterpretation.
 * low16 becomes glyphData.z (bandMax.x) in the shader → clamps vertical bandIndex.x.
 * high16 becomes glyphData.w (bandMax.y) in the shader → clamps horizontal bandIndex.y.
 */function packBandMax(low16_vBandMax,high16_hBandMax){return packUint16Pair(low16_vBandMax,high16_hBandMax)}},
/***/238(__unused_webpack_module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugTexturePack=// 4096
/**
 * Pack preprocessed glyph data into curve and band textures.
 *
 * **Curve texture layout** (float RGBA, `textureWidth` wide):
 * Each curve occupies 2 consecutive texels:
 *   texel 0: [p1.x, p1.y, p2.x, p2.y]
 *   texel 1: [p3.x, p3.y, 0, 0]
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
function(glyphs,textureWidth){if(4096!==textureWidth)throw new Error(`textureWidth must be 4096 to match kLogBandTextureWidth=12 in frag.glsl, got ${textureWidth}`);
// First pass: compute total sizes, simulating row alignment for curve lists.
let totalCurveTexels=0,totalBandTexels=0;for(const glyph of glyphs){
// 2 texels per curve; each pair must be on the same row so the shader can
// read p3 as curveLoc.x + 1 without crossing a row boundary.
for(let i=0;i<glyph.curves.length;i++)totalCurveTexels%textureWidth===textureWidth-1&&totalCurveTexels++,totalCurveTexels+=2;
// Band headers must all fit on one row (shader accesses them with a fixed row).
// Simulate the same padding the second pass applies.
const hcount=glyph.hBandCount+glyph.vBandCount,hcol=totalBandTexels%textureWidth;hcol+hcount>textureWidth&&(totalBandTexels+=textureWidth-hcol),totalBandTexels+=hcount;
// Curve reference lists — simulate row alignment so the size estimate matches
// the actual layout produced in the second pass.
for(const band of glyph.hBands){if(band.length>0){const col=totalBandTexels%textureWidth;col+band.length>textureWidth&&(totalBandTexels+=textureWidth-col)}totalBandTexels+=band.length}for(const band of glyph.vBands){if(band.length>0){const col=totalBandTexels%textureWidth;col+band.length>textureWidth&&(totalBandTexels+=textureWidth-col)}totalBandTexels+=band.length}}
// Compute texture height from texel count (round up to full rows)
const curveRows=Math.ceil(totalCurveTexels/textureWidth)||1,bandRows=Math.ceil(totalBandTexels/textureWidth)||1,curveData=new Float32Array(curveRows*textureWidth*4),bandData=new Uint32Array(bandRows*textureWidth*4);
// Second pass: pack data
let curveTexelIdx=0,bandTexelIdx=0;for(const glyph of glyphs){glyph.curveOffset=curveTexelIdx;
// Pack curves into curve texture.
// Each curve occupies 2 consecutive texels; skip the last column of a row
// if needed so p12 and p3 are always on the same row (shader reads p3 as
// curveLoc.x + 1 with no row-wrapping).
// Track each curve's actual p12 texel index for band references below.
const curveTexels=new Array(glyph.curves.length);for(let i=0;i<glyph.curves.length;i++){curveTexelIdx%textureWidth===textureWidth-1&&curveTexelIdx++,curveTexels[i]=curveTexelIdx;const curve=glyph.curves[i],base0=4*curveTexelIdx;curveData[base0]=curve.p1x,curveData[base0+1]=curve.p1y,curveData[base0+2]=curve.p2x,curveData[base0+3]=curve.p2y,curveTexelIdx++;const base1=4*curveTexelIdx;curveData[base1]=curve.p3x,curveData[base1+1]=curve.p3y,curveData[base1+2]=0,curveData[base1+3]=0,curveTexelIdx++}
// The shader fetches all band headers using a fixed row (glyphLoc.y) with
// glyphLoc.x + bandIndex as the column — no row-wrapping. So all headers
// must fit within one texture row. Pad to next row if they would overflow.
const headerCount=glyph.hBandCount+glyph.vBandCount,headerCol=bandTexelIdx%textureWidth;headerCol+headerCount>textureWidth&&(bandTexelIdx+=textureWidth-headerCol),
// Record band offset for this glyph
glyph.bandOffset=bandTexelIdx;
// Reserve header space
const headerStart=bandTexelIdx;bandTexelIdx+=headerCount;
// Pack horizontal band headers + curve lists
for(let b=0;b<glyph.hBandCount;b++){const band=glyph.hBands[b],headerBase=4*(headerStart+b);
// Align curve list to avoid straddling a row boundary.
// frag.glsl accesses the list as fetchBand(ivec2(hbandLoc.x + curveIndex, hbandLoc.y))
// with a fixed row, so the entire list must fit within one row.
if(band.length>0){const col=bandTexelIdx%textureWidth;col+band.length>textureWidth&&(bandTexelIdx+=textureWidth-col)}bandData[headerBase]=band.length,
// Offset is relative to glyph.bandOffset — CalcBandLoc in frag.glsl
// adds it to glyphLoc and handles row wrapping.
bandData[headerBase+1]=bandTexelIdx-glyph.bandOffset,bandData[headerBase+2]=0,bandData[headerBase+3]=0;for(const curveIdx of band){const refBase=4*bandTexelIdx,absCurveTexel=curveTexels[curveIdx];
// 2D texel coordinates of p12 in uCurveTexture.
bandData[refBase]=absCurveTexel%textureWidth,bandData[refBase+1]=Math.floor(absCurveTexel/textureWidth),bandData[refBase+2]=0,bandData[refBase+3]=0,bandTexelIdx++}}
// Pack vertical band headers + curve lists
for(let b=0;b<glyph.vBandCount;b++){const band=glyph.vBands[b],headerBase=4*(headerStart+glyph.hBandCount+b);if(band.length>0){const col=bandTexelIdx%textureWidth;col+band.length>textureWidth&&(bandTexelIdx+=textureWidth-col)}bandData[headerBase]=band.length,bandData[headerBase+1]=bandTexelIdx-glyph.bandOffset,bandData[headerBase+2]=0,bandData[headerBase+3]=0;for(const curveIdx of band){const refBase=4*bandTexelIdx,absCurveTexel=curveTexels[curveIdx];bandData[refBase]=absCurveTexel%textureWidth,bandData[refBase+1]=Math.floor(absCurveTexel/textureWidth),bandData[refBase+2]=0,bandData[refBase+3]=0,bandTexelIdx++}}}return{curveData,bandData}}
/***/},
/***/636(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.SlugPipe=void 0;const pixi_js_1=__webpack_require__(0),text_1=__webpack_require__(291);
/**
 * PixiJS v8 render pipe for SlugText renderables.
 * Handles the rendering lifecycle for Slug-based text objects.
 */
class SlugPipe{constructor(renderer){this._renderer=renderer}addRenderable(renderable){text_1.SlugText}updateRenderable(renderable){text_1.SlugText}validateRenderable(renderable){return renderable instanceof text_1.SlugText;
// TODO: Return whether instruction set needs rebuilding
}destroyRenderable(renderable){text_1.SlugText}}exports.SlugPipe=SlugPipe,SlugPipe.extension={type:pixi_js_1.ExtensionType.WebGLPipes,name:"slug-pipe"},
// Register the pipe as a PixiJS v8 extension
pixi_js_1.extensions.add(SlugPipe)},
/***/445(__unused_webpack_module,exports,__webpack_require__){"use strict";var __importDefault=this&&this.__importDefault||function(mod){return mod&&mod.__esModule?mod:{default:mod}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugShader=
/**
 * Creates a PixiJS v8 Shader configured for the Slug rendering algorithm.
 * Matrix and viewport uniforms (uProjectionMatrix, uWorldTransformMatrix, uResolution)
 * are auto-populated each frame by PixiJS v8's global uniform system.
 */
function(curveTexture,bandTexture){const glProgram=pixi_js_1.GlProgram.from({vertex:vert_glsl_1.default,fragment:frag_glsl_1.default}),uniforms=new pixi_js_1.UniformGroup({uSupersampleCount:{value:0,type:"i32"}});
// PixiJS v8 UniformGroup has no 'bool' type — use i32 (0/1).
// WebGL maps glUniform1i to GLSL bool uniforms correctly.
return{shader:new pixi_js_1.Shader({glProgram,resources:{uCurveTexture:curveTexture.source,uBandTexture:bandTexture.source,uSupersamplingGroup:uniforms}}),uniforms}}
/***/;const pixi_js_1=__webpack_require__(0),vert_glsl_1=__importDefault(__webpack_require__(972)),frag_glsl_1=__importDefault(__webpack_require__(155))},
/***/291(__unused_webpack_module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.SlugText=void 0;const pixi_js_1=__webpack_require__(0),defaults_1=__webpack_require__(195),quad_1=__webpack_require__(727),shader_1=__webpack_require__(445);
/**
 * Renderable text element using the Slug algorithm for PixiJS v8.
 * Renders font glyphs directly from quadratic Bezier curves on the GPU.
 */
class SlugText extends pixi_js_1.Container{constructor(text,font,fontSize=defaults_1.Defaults.FONT_SIZE){super(),this._text=text,this._font=font,this._fontSize=fontSize,this._color=[1,1,1,1],this._mesh=null,this._curveTexture=null,this._bandTexture=null,this._supersampling=!1,this._supersampleCount=defaults_1.Defaults.SUPERSAMPLE_COUNT,this._uniforms=null,this._vertexBytes=0,this._indexBytes=0,this._rebuildCount=0,this.rebuild()}
/** The text string to render. */get text(){return this._text}set text(value){this._text!==value&&(this._text=value,this.rebuild())}
/** The Slug font used for rendering. */get font(){return this._font}set font(value){this._font!==value&&(this._font=value,this.rebuild())}
/** Font size in pixels. */get fontSize(){return this._fontSize}set fontSize(value){this._fontSize!==value&&(this._fontSize=value,this.rebuild())}
/** Text color as [r, g, b, a] in 0-1 range. */get color(){return this._color}set color(value){this._color=value,this.rebuild()}
/** Enable supersampling for smoother edges. */get supersampling(){return this._supersampling}set supersampling(value){this._supersampling!==value&&(this._supersampling=value,this._uniforms&&(this._uniforms.uniforms.uSupersampleCount=value?this._supersampleCount:0))}
/** Number of supersamples (2, 4, 8, or 16). Only used when supersampling is true. */get supersampleCount(){return this._supersampleCount}set supersampleCount(value){const clamped=Math.min(Math.max(value,1),defaults_1.Defaults.MAX_SUPERSAMPLE_COUNT);this._supersampleCount!==clamped&&(this._supersampleCount=clamped,this._uniforms&&this._supersampling&&(this._uniforms.uniforms.uSupersampleCount=clamped))}
/**
     * Build mesh geometry and shader for current text + font.
     * Creates per-glyph quads with the 5 vertex attributes required by the Slug shaders,
     * creates separate curve and band GPU textures from the font data, and assembles a Mesh.
     */rebuild(){if(this._rebuildCount++,
// Clean up previous mesh and textures
this._mesh&&(this.removeChild(this._mesh),this._mesh.destroy(),this._mesh=null),this._curveTexture?.destroy(),this._curveTexture=null,this._bandTexture?.destroy(),this._bandTexture=null,0===this._text.length||0===this._font.glyphs.size)return;
// Build per-glyph quads with all 5 vertex attributes
const quads=(0,quad_1.slugGlyphQuads)(this._text,this._font.glyphs,this._font.advances,this._font.unitsPerEm,this._fontSize,this._font.textureWidth,this._color);if(0===quads.quadCount)return;
// Track GPU buffer sizes for memoryBytes() reporting.
// vertices: Float32Array → 4 bytes per element.
// indices: Uint16Array → 2 bytes per element.
this._vertexBytes=quads.vertices.byteLength,this._indexBytes=quads.indices.byteLength;
// Create geometry with 5 interleaved vec4 attributes
const vertexBuffer=new pixi_js_1.Buffer({data:quads.vertices,label:"slug-vertex-buffer",usage:pixi_js_1.BufferUsage.VERTEX}),geometry=new pixi_js_1.Geometry({attributes:{aPositionNormal:{buffer:vertexBuffer,format:"float32x4",stride:80,offset:0},aTexcoord:{buffer:vertexBuffer,format:"float32x4",stride:80,offset:16},aJacobian:{buffer:vertexBuffer,format:"float32x4",stride:80,offset:32},aBanding:{buffer:vertexBuffer,format:"float32x4",stride:80,offset:48},aColor:{buffer:vertexBuffer,format:"float32x4",stride:80,offset:64}},indexBuffer:quads.indices});// 20 floats * 4 bytes per float
let minX=1/0,minY=1/0,maxX=-1/0,maxY=-1/0;for(let i=0;i<quads.vertices.length;i+=20){const vx=quads.vertices[i],vy=quads.vertices[i+1];vx<minX&&(minX=vx),vx>maxX&&(maxX=vx),vy<minY&&(minY=vy),vy>maxY&&(maxY=vy)}this.boundsArea=new pixi_js_1.Rectangle(minX,minY,maxX-minX,maxY-minY);const textureWidth=this._font.textureWidth,curveRows=Math.ceil(this._font.curveData.length/4/textureWidth)||1;
// Curve texture: RGBA float32, one texel per 2 control points
this._curveTexture=new pixi_js_1.Texture({source:new pixi_js_1.BufferImageSource({resource:this._font.curveData,width:textureWidth,height:curveRows,format:"rgba32float",autoGenerateMipmaps:!1,scaleMode:"nearest",alphaMode:"no-premultiply-alpha"})});
// Band texture: Uint32 integer values converted to Float32 float values and uploaded
// as rgba32float. The shader recovers uint values via float-to-uint cast: uint(raw.x).
// This is a VALUE conversion (6 → 6.0), NOT a bit-pattern reinterpretation.
// Safe for all values < 2^24 (see port_risks.md JS-2).
// DO NOT change to bit-pattern reinterpretation without also changing fetchBand()
// in frag.glsl from uint() to floatBitsToUint().
const bandRows=Math.ceil(this._font.bandData.length/4/textureWidth)||1;this._bandTexture=new pixi_js_1.Texture({source:new pixi_js_1.BufferImageSource({resource:(()=>{const f=new Float32Array(this._font.bandData.length);for(let i=0;i<this._font.bandData.length;i++)f[i]=this._font.bandData[i];return f})(),width:textureWidth,height:bandRows,format:"rgba32float",autoGenerateMipmaps:!1,scaleMode:"nearest",alphaMode:"no-premultiply-alpha"})});const{shader,uniforms}=(0,shader_1.slugShader)(this._curveTexture,this._bandTexture);this._uniforms=uniforms,this._uniforms.uniforms.uSupersampleCount=this._supersampling?this._supersampleCount:0;const mesh=new pixi_js_1.Mesh({geometry,shader});this._mesh=mesh,this.addChild(mesh)}
/** Number of times rebuild() has been called on this instance. */get rebuildCount(){return this._rebuildCount}
/**
     * GPU memory consumed by this text object's vertex and index buffers, in bytes.
     * Does not include the font textures — those are shared and reported by SlugFont.memoryBytes().
     */meshMemoryBytes(){return this._vertexBytes+this._indexBytes}
/**
     * Total GPU memory for this text object plus its font's textures, in bytes.
     * Use this when the font is not shared, or to get a complete per-instance total.
     */totalMemoryBytes(){return this.meshMemoryBytes()+this._font.memoryBytes()}destroy(){this._mesh?.destroy(),this._curveTexture?.destroy(),this._bandTexture?.destroy(),super.destroy()}}exports.SlugText=SlugText},
/***/155(module){"use strict";module.exports="#version 300 es\r\n// ===================================================\r\n// Slug algorithm fragment shader — GLSL ES 3.00 port.\r\n// Based on the reference Slug shader by Eric Lengyel.\r\n// ===================================================\r\nprecision highp float;\r\nprecision highp int;\r\nprecision highp sampler2D;\r\n\r\n#define kLogBandTextureWidth 12\r\n#define kMaxCurvesPerBand 512\r\n#define kQuadraticEpsilon 0.0001\r\n\r\nin vec4 vColor;\r\nin vec2 vTexcoord;\r\nflat in vec4 vBanding;\r\nflat in ivec4 vGlyph;\r\n\r\nuniform sampler2D uCurveTexture;\r\nuniform sampler2D uBandTexture;\r\nuniform int uSupersampleCount;\r\n\r\nuvec2 fetchBand(ivec2 coord)\r\n{\r\n\tvec2 raw = texelFetch(uBandTexture, coord, 0).xy;\r\n\treturn uvec2(uint(raw.x + 0.5), uint(raw.y + 0.5));\r\n}\r\n\r\nivec2 CalcBandLoc(ivec2 glyphLoc, uint offset)\r\n{\r\n\tivec2 bandLoc = ivec2(glyphLoc.x + int(offset), glyphLoc.y);\r\n\tbandLoc.y += bandLoc.x >> kLogBandTextureWidth;\r\n\tbandLoc.x &= (1 << kLogBandTextureWidth) - 1;\r\n\treturn bandLoc;\r\n}\r\n\r\n// Combine horizontal and vertical fractional winding into coverage.\r\n// Near edges (high weight): weighted average provides smooth antialiasing.\r\n// Interior (low weight): max(abs(xcov), abs(ycov)) provides solid fill.\r\n// max() is used instead of min() to handle glyphs with oppositely-wound\r\n// contours where one axis cancels to ~0 while the other reads ~1.\r\nfloat CalcCoverage(float xcov, float ycov, float xwgt, float ywgt)\r\n{\r\n\tfloat coverage = max(\r\n\t\tabs(xcov * xwgt + ycov * ywgt) / max(xwgt + ywgt, 1.0 / 65536.0),\r\n\t\tmax(abs(xcov), abs(ycov))\r\n\t);\r\n\r\n\treturn clamp(sqrt(abs(coverage)), 0.0, 1.0);\r\n}\r\n\r\nout vec4 fragColor;\r\n\r\nfloat SlugRender(vec2 renderCoord, vec4 bandTransform, ivec4 glyphData)\r\n{\r\n\tvec2 pixelsPerEm = vec2(1.0 / max(fwidth(renderCoord.x), 1.0 / 65536.0),\r\n\t                        1.0 / max(fwidth(renderCoord.y), 1.0 / 65536.0));\r\n\r\n\tivec2 bandMax = glyphData.zw;\r\n\tbandMax.y &= 0x00FF;\r\n\r\n\tivec2 bandIndex = clamp(ivec2(renderCoord * bandTransform.xy + bandTransform.zw), ivec2(0, 0), bandMax);\r\n\tivec2 glyphLoc = glyphData.xy;\r\n\r\n\tfloat xcov = 0.0;\r\n\tfloat xwgt = 0.0;\r\n\r\n\t// ---------------------------------------------------------------\r\n\t// Horizontal ray (+X direction)\r\n\t// ---------------------------------------------------------------\r\n\r\n\tuvec2 hbandData = fetchBand(ivec2(glyphLoc.x + bandIndex.y, glyphLoc.y));\r\n\tivec2 hbandLoc = CalcBandLoc(glyphLoc, hbandData.y);\r\n\r\n\tint hcount = min(int(hbandData.x), kMaxCurvesPerBand);\r\n\tfor (int curveIndex = 0; curveIndex < hcount; curveIndex++)\r\n\t{\r\n\t\tivec2 curveLoc = ivec2(fetchBand(ivec2(hbandLoc.x + curveIndex, hbandLoc.y)));\r\n\t\tvec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);\r\n\t\tvec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;\r\n\r\n\t\tif (max(max(p12.x, p12.z), p3.x) * pixelsPerEm.x < -0.5) break;\r\n\r\n\t\tuint code = (0x2E74u >> (((p12.y > 0.0) ? 2u : 0u) +\r\n\t\t        ((p12.w > 0.0) ? 4u : 0u) + ((p3.y > 0.0) ? 8u : 0u))) & 3u;\r\n\r\n\t\tif (code != 0u)\r\n\t\t{\r\n\t\t\tfloat ax = p12.x - p12.z * 2.0 + p3.x;\r\n\t\t\tfloat ay = p12.y - p12.w * 2.0 + p3.y;\r\n\t\t\tfloat bx = p12.x - p12.z;\r\n\t\t\tfloat by = p12.y - p12.w;\r\n\t\t\tfloat ra = 1.0 / ay;\r\n\r\n\t\t\tfloat d = sqrt(max(by * by - ay * p12.y, 0.0));\r\n\t\t\tfloat t1 = (by - d) * ra;\r\n\t\t\tfloat t2 = (by + d) * ra;\r\n\r\n\t\t\tif (abs(ay) < kQuadraticEpsilon)\r\n\t\t\t{\r\n\t\t\t\tif (abs(by) < kQuadraticEpsilon) continue;\r\n\t\t\t\tt1 = p12.y * 0.5 / by;\r\n\t\t\t\tt2 = t1;\r\n\t\t\t}\r\n\r\n\t\t\tfloat x1 = (ax * t1 - bx * 2.0) * t1 + p12.x;\r\n\t\t\tfloat x2 = (ax * t2 - bx * 2.0) * t2 + p12.x;\r\n\t\t\tx1 *= pixelsPerEm.x;\r\n\t\t\tx2 *= pixelsPerEm.x;\r\n\r\n\t\t\tif ((code & 1u) != 0u)\r\n\t\t\t{\r\n\t\t\t\txcov += clamp(x1 + 0.5, 0.0, 1.0);\r\n\t\t\t\txwgt = max(xwgt, clamp(1.0 - abs(x1) * 2.0, 0.0, 1.0));\r\n\t\t\t}\r\n\r\n\t\t\tif (code > 1u)\r\n\t\t\t{\r\n\t\t\t\txcov -= clamp(x2 + 0.5, 0.0, 1.0);\r\n\t\t\t\txwgt = max(xwgt, clamp(1.0 - abs(x2) * 2.0, 0.0, 1.0));\r\n\t\t\t}\r\n\t\t}\r\n\t}\r\n\r\n\t// ---------------------------------------------------------------\r\n\t// Vertical ray (+Y direction)\r\n\t// Same solver as horizontal with x↔y roles swapped.\r\n\t// ---------------------------------------------------------------\r\n\r\n\tfloat ycov = 0.0;\r\n\tfloat ywgt = 0.0;\r\n\r\n\tuvec2 vbandData = fetchBand(ivec2(glyphLoc.x + bandMax.y + 1 + bandIndex.x, glyphLoc.y));\r\n\tivec2 vbandLoc = CalcBandLoc(glyphLoc, vbandData.y);\r\n\r\n\tint vcount = min(int(vbandData.x), kMaxCurvesPerBand);\r\n\tfor (int curveIndex = 0; curveIndex < vcount; curveIndex++)\r\n\t{\r\n\t\tivec2 curveLoc = ivec2(fetchBand(ivec2(vbandLoc.x + curveIndex, vbandLoc.y)));\r\n\t\tvec4 p12 = texelFetch(uCurveTexture, curveLoc, 0) - vec4(renderCoord, renderCoord);\r\n\t\tvec2 p3 = texelFetch(uCurveTexture, ivec2(curveLoc.x + 1, curveLoc.y), 0).xy - renderCoord;\r\n\r\n\t\tif (max(max(p12.y, p12.w), p3.y) * pixelsPerEm.y < -0.5) break;\r\n\r\n\t\tuint code = (0x2E74u >> (((p12.x > 0.0) ? 2u : 0u) +\r\n\t\t        ((p12.z > 0.0) ? 4u : 0u) + ((p3.x > 0.0) ? 8u : 0u))) & 3u;\r\n\r\n\t\tif (code != 0u)\r\n\t\t{\r\n\t\t\tfloat ax = p12.y - p12.w * 2.0 + p3.y;\r\n\t\t\tfloat ay = p12.x - p12.z * 2.0 + p3.x;\r\n\t\t\tfloat bx = p12.y - p12.w;\r\n\t\t\tfloat by = p12.x - p12.z;\r\n\t\t\tfloat ra = 1.0 / ay;\r\n\r\n\t\t\tfloat d = sqrt(max(by * by - ay * p12.x, 0.0));\r\n\t\t\tfloat t1 = (by - d) * ra;\r\n\t\t\tfloat t2 = (by + d) * ra;\r\n\r\n\t\t\tif (abs(ay) < kQuadraticEpsilon)\r\n\t\t\t{\r\n\t\t\t\tif (abs(by) < kQuadraticEpsilon) continue;\r\n\t\t\t\tt1 = p12.x * 0.5 / by;\r\n\t\t\t\tt2 = t1;\r\n\t\t\t}\r\n\r\n\t\t\tfloat y1 = (ax * t1 - bx * 2.0) * t1 + p12.y;\r\n\t\t\tfloat y2 = (ax * t2 - bx * 2.0) * t2 + p12.y;\r\n\t\t\ty1 *= pixelsPerEm.y;\r\n\t\t\ty2 *= pixelsPerEm.y;\r\n\r\n\t\t\tif ((code & 1u) != 0u)\r\n\t\t\t{\r\n\t\t\t\tycov += clamp(y1 + 0.5, 0.0, 1.0);\r\n\t\t\t\tywgt = max(ywgt, clamp(1.0 - abs(y1) * 2.0, 0.0, 1.0));\r\n\t\t\t}\r\n\r\n\t\t\tif (code > 1u)\r\n\t\t\t{\r\n\t\t\t\tycov -= clamp(y2 + 0.5, 0.0, 1.0);\r\n\t\t\t\tywgt = max(ywgt, clamp(1.0 - abs(y2) * 2.0, 0.0, 1.0));\r\n\t\t\t}\r\n\t\t}\r\n\t}\r\n\r\n\treturn CalcCoverage(xcov, ycov, xwgt, ywgt);\r\n}\r\n\r\nvoid main()\r\n{\r\n\tfloat coverage;\r\n\tint sampleCount = min(uSupersampleCount, 16);\r\n\r\n\tif (sampleCount <= 1)\r\n\t{\r\n\t\tcoverage = SlugRender(vTexcoord, vBanding, vGlyph);\r\n\t}\r\n\telse\r\n\t{\r\n\t\t// Supersampling with configurable sample count.\r\n\t\t// Offsets are in em-space, derived from screen-space derivatives so they\r\n\t\t// scale correctly at any font size or transform.\r\n\t\tvec2 dx = dFdx(vTexcoord) * 0.5;\r\n\t\tvec2 dy = dFdy(vTexcoord) * 0.5;\r\n\r\n\t\tif (sampleCount <= 2)\r\n\t\t{\r\n\t\t\t// 2-sample: diagonal pair\r\n\t\t\tfloat c0 = SlugRender(vTexcoord + dx * 0.25 + dy * 0.25, vBanding, vGlyph);\r\n\t\t\tfloat c1 = SlugRender(vTexcoord - dx * 0.25 - dy * 0.25, vBanding, vGlyph);\r\n\t\t\tcoverage = (c0 + c1) * 0.5;\r\n\t\t}\r\n\t\telse if (sampleCount <= 4)\r\n\t\t{\r\n\t\t\t// 4-sample rotated-grid supersampling (RGSS pattern).\r\n\t\t\tfloat c0 = SlugRender(vTexcoord + dx * 0.125 + dy * 0.375, vBanding, vGlyph);\r\n\t\t\tfloat c1 = SlugRender(vTexcoord - dx * 0.125 - dy * 0.375, vBanding, vGlyph);\r\n\t\t\tfloat c2 = SlugRender(vTexcoord + dx * 0.375 - dy * 0.125, vBanding, vGlyph);\r\n\t\t\tfloat c3 = SlugRender(vTexcoord - dx * 0.375 + dy * 0.125, vBanding, vGlyph);\r\n\t\t\tcoverage = (c0 + c1 + c2 + c3) * 0.25;\r\n\t\t}\r\n\t\telse if (sampleCount <= 8)\r\n\t\t{\r\n\t\t\t// 8-sample: 8-queens pattern (good spatial distribution)\r\n\t\t\tfloat c0 = SlugRender(vTexcoord + dx * 0.0625 + dy * 0.4375, vBanding, vGlyph);\r\n\t\t\tfloat c1 = SlugRender(vTexcoord - dx * 0.0625 - dy * 0.4375, vBanding, vGlyph);\r\n\t\t\tfloat c2 = SlugRender(vTexcoord + dx * 0.3125 - dy * 0.0625, vBanding, vGlyph);\r\n\t\t\tfloat c3 = SlugRender(vTexcoord - dx * 0.3125 + dy * 0.0625, vBanding, vGlyph);\r\n\t\t\tfloat c4 = SlugRender(vTexcoord + dx * 0.1875 + dy * 0.1875, vBanding, vGlyph);\r\n\t\t\tfloat c5 = SlugRender(vTexcoord - dx * 0.1875 - dy * 0.1875, vBanding, vGlyph);\r\n\t\t\tfloat c6 = SlugRender(vTexcoord + dx * 0.4375 - dy * 0.3125, vBanding, vGlyph);\r\n\t\t\tfloat c7 = SlugRender(vTexcoord - dx * 0.4375 + dy * 0.3125, vBanding, vGlyph);\r\n\t\t\tcoverage = (c0 + c1 + c2 + c3 + c4 + c5 + c6 + c7) * 0.125;\r\n\t\t}\r\n\t\telse\r\n\t\t{\r\n\t\t\t// 16-sample: 4x4 jittered grid for maximum quality\r\n\t\t\tfloat sum = 0.0;\r\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.0625 + dy * 0.4375, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.4375 + dy * 0.0625, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.3125 - dy * 0.1875, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.1875 - dy * 0.3125, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.1875 + dy * 0.1875, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.0625 - dy * 0.4375, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.4375 - dy * 0.0625, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.3125 + dy * 0.3125, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.125 + dy * 0.375, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.375 + dy * 0.125, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.375 - dy * 0.125, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.125 - dy * 0.375, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.25 + dy * 0.25, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord - dx * 0.25 - dy * 0.25, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.0 + dy * 0.0, vBanding, vGlyph);\r\n\t\t\tsum += SlugRender(vTexcoord + dx * 0.5 + dy * 0.5, vBanding, vGlyph);\r\n\t\t\tcoverage = sum * 0.0625;\r\n\t\t}\r\n\t}\r\n\r\n\tfragColor = vColor * coverage;\r\n}\r\n"},
/***/972(module){"use strict";module.exports="#version 300 es\n// ===================================================\n// Slug algorithm vertex shader — GLSL ES 3.00 port.\n// Original HLSL reference shader by Eric Lengyel.\n// SPDX-License-Identifier: MIT OR Apache-2.0\n// Copyright 2017, by Eric Lengyel.\n// ===================================================\n\n// Per-vertex attribute layout:\n//\n// 0 - pos  : object-space vertex coords (xy) and normal vector (zw)\n// 1 - tex  : em-space sample coords (xy), packed glyph data location (z), packed band max + flags (w)\n// 2 - jac  : inverse Jacobian matrix entries (00, 01, 10, 11)\n// 3 - bnd  : band scale x, band scale y, band offset x, band offset y\n// 4 - col  : vertex color (rgba)\n\nprecision highp float;\nprecision highp int;\n\nlayout(location = 0) in vec4 aPositionNormal; // pos xy + normal zw\nlayout(location = 1) in vec4 aTexcoord;       // em-space uv + packed glyph loc + packed bands\nlayout(location = 2) in vec4 aJacobian;       // inverse Jacobian (00, 01, 10, 11)\nlayout(location = 3) in vec4 aBanding;        // band scale xy + band offset xy\nlayout(location = 4) in vec4 aColor;          // vertex color rgba\n\n// PixiJS v8 global uniforms — auto-populated each frame by the renderer (bind group 100).\nuniform mat3 uProjectionMatrix; // Orthographic projection: world pixels → NDC.\nuniform vec2 uResolution;       // Viewport size in pixels (width, height).\n\n// PixiJS v8 local uniforms — per-object transform injected by MeshPipe (bind group 101).\nuniform mat3 uTransformMatrix;  // World transform of this mesh: local → world pixels.\n\nout vec4 vColor;\nout vec2 vTexcoord;\nflat out vec4 vBanding;\nflat out ivec4 vGlyph;\n\n// Unpack glyph metadata from bit-packed float32 vertex attributes.\n// Reads aTexcoord.zw (packed integers) and aBanding (band transform) —\n// independent of the em-space coords in aTexcoord.xy used by SlugDilate.\nvoid SlugUnpack(vec4 tex, vec4 bnd, out vec4 vbnd, out ivec4 vgly)\n{\n\tuvec2 g = floatBitsToUint(tex.zw);\n\tvgly = ivec4(\n\t\tint(g.x & 0xFFFFu),\n\t\tint(g.x >> 16u),\n\t\tint(g.y & 0xFFFFu),\n\t\tint(g.y >> 16u)\n\t);\n\tvbnd = bnd;\n}\n\n// Compute dynamic glyph dilation (Lengyel 2019).\n// Expands the bounding polygon by 0.5 pixels in viewport space so the\n// rasterizer generates fragments for boundary pixels whose centers fall\n// just outside the undilated quad.\n//\n// The displacement uses pos.zw (the raw scaled normal, e.g. (-1,-1) at corners)\n// rather than the unit normal n. The scalar factor is derived from n via u and v,\n// and the magnitude of pos.zw is absorbed into the quadratic solution — this is\n// correct per the Dynamic Glyph Dilation paper.\nvec2 SlugDilate(vec4 pos, vec4 tex, vec4 jac, mat4 mvp, vec2 dim, out vec2 vpos)\n{\n\t// INVARIANT: pos.zw (normal) must be nonzero. quad.ts always sets\n\t// normals to (-1,-1), (1,-1), (1,1), (-1,1) for quad corners.\n\tvec2 n = normalize(pos.zw);\n\n\t// Project position and normal through the MVP matrix.\n\tvec4 Mpos = mvp * vec4(pos.xy, 0.0, 1.0);\n\tvec4 Mn   = mvp * vec4(n,      0.0, 0.0);\n\n\tfloat s = Mpos.w;\n\tfloat t = Mn.w;\n\n\tfloat u = (s * Mn.x - t * Mpos.x) * dim.x;\n\tfloat v = (s * Mn.y - t * Mpos.y) * dim.y;\n\n\tfloat s2 = s * s;\n\tfloat st = s * t;\n\tfloat uv = u * u + v * v;\n\n\t// Solve: (uv - st²)d² - 2s³t·d - s⁴ = 0\n\t// Guard the denominator against division-by-zero (undefined in GLSL ES,\n\t// see port_risks.md GLSL-3). For orthographic 2D, t=0 always so the\n\t// denominator is uv = u²+v². It is zero only when the normal projects\n\t// to zero screen-space length (degenerate MVP or zero viewport).\n\t// In that case, skip dilation — the vertex stays at its original position.\n\tfloat denom = uv - st * st;\n\tif (abs(denom) < 1e-10)\n\t{\n\t\tvpos = pos.xy;\n\t\treturn tex.xy;\n\t}\n\n\tvec2 d = pos.zw * (s2 * (st + sqrt(uv)) / denom);\n\n\tvpos = pos.xy + d;\n\treturn vec2(tex.x + dot(d, jac.xy), tex.y + dot(d, jac.zw));\n}\n\nvoid main()\n{\n\t// Combine projection and world transform into a single 2D affine mat3,\n\t// then lift it to a column-major mat4 for the Slug dilation algorithm.\n\t// The W row is (0,0,0,1) — correct for orthographic projection.\n\t// For perspective, the W row would need to carry the actual projection terms.\n\tmat3 m = uProjectionMatrix * uTransformMatrix;\n\tmat4 mvp = mat4(\n\t\tm[0][0], m[0][1], 0.0, 0.0,  // column 0\n\t\tm[1][0], m[1][1], 0.0, 0.0,  // column 1\n\t\t0.0,     0.0,     1.0, 0.0,  // column 2\n\t\tm[2][0], m[2][1], 0.0, 1.0   // column 3\n\t);\n\n\t// Half viewport converts clip-space normal vectors to pixel-space distances.\n\tvec2 dim = uResolution * 0.5;\n\n\tvec2 p;\n\tvTexcoord = SlugDilate(aPositionNormal, aTexcoord, aJacobian, mvp, dim, p);\n\n\tgl_Position = mvp * vec4(p, 0.0, 1.0);\n\n\tSlugUnpack(aTexcoord, aBanding, vBanding, vGlyph);\n\tvColor = aColor;\n}\n"},
/***/0(module){"use strict";module.exports=__WEBPACK_EXTERNAL_MODULE__0__},
/***/256(){
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
/******/ // no module.id needed
/******/ // no module.loaded needed
/******/exports:{}
/******/};
/******/
/******/ // Execute the module function
/******/
/******/
/******/ // Return the exports of the module
/******/return __webpack_modules__[moduleId].call(module.exports,module,module.exports,__webpack_require__),module.exports;
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
/******/__webpack_require__.o=(obj,prop)=>Object.prototype.hasOwnProperty.call(obj,prop)
/******/,
/******/ // define __esModule on exports
/******/__webpack_require__.r=exports=>{
/******/"undefined"!=typeof Symbol&&Symbol.toStringTag&&
/******/Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"})
/******/,Object.defineProperty(exports,"__esModule",{value:!0})};
/******/
/************************************************************************/
var __webpack_exports__={};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
/******/return(()=>{"use strict";var exports=__webpack_exports__;Object.defineProperty(exports,"__esModule",{value:!0}),exports.slugShader=exports.SlugPipe=exports.SlugText=exports.SlugFont=void 0;var font_1=__webpack_require__(330);Object.defineProperty(exports,"SlugFont",{enumerable:!0,get:function(){return font_1.SlugFont}});var text_1=__webpack_require__(291);Object.defineProperty(exports,"SlugText",{enumerable:!0,get:function(){return text_1.SlugText}});var pipe_1=__webpack_require__(636);Object.defineProperty(exports,"SlugPipe",{enumerable:!0,get:function(){return pipe_1.SlugPipe}});var shader_1=__webpack_require__(445);Object.defineProperty(exports,"slugShader",{enumerable:!0,get:function(){return shader_1.slugShader}})})(),__webpack_exports__;
/******/})());