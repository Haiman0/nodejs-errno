var path = require('path')
var Container = require('./Container')

module.exports = Domain

/**
 * @class
 * @classdesc ErrID wrapper and derivation<br>
 * Container needs a unique identifier to define the type of error.<br>
 * The identities is essentially a string (similar to posixpath).<br>
 * This class is used to wrap and format the string to ensure the legitimacy of the identifier.<br>
 * In addition, the class also provides some tools to derive other identities.
 * @param {string}
 * @param {Container}
 */
function Domain(current, container) {
	this._current = current ||  '/'
	this._container = null

	if(container){
		if(container instanceof Container){
			this._container = container
		} else{
			throw new TypeError('container argument must be a instance of Container')
		}
	}
}

/**
 * @lends Domain.prototype
 */
var fn = Domain.prototype

fn._format = function (str){
	//删除重复和末尾的斜杠 以及..和.符号的去除 头部必须以/开始
	var domain = path.posix.normalize('/' + str + '/.')
	return domain;
}

/**
 * Format the id string
 * @return {string}
 */
fn.toString = function (){
	return this._format(this._current)
}

/**
 * Paste the '/' + string at the end of the current id to get another id<br>
 * You can use "/" symbol in literally to classify or specify range the error.<br>
 * In the internal '/' symbol is used to determine the level, resulting in a different 'code'.
 * @param  {string}
 * @return {Domain}
 */
fn.sec = function (sub) {
	var newDomain = path.posix.join(this._current, sub)
	return new Domain(newDomain, this._container)
}

/**
 * Paste the string at the end of the current id to get another id
 * @param  {string}
 * @return {Domain}
 */
fn.link = function (str){
	var newDomain = this._current + str
	return new Domain(newDomain, this._container)
}

fn.parent = function (){
	var tmp = this.sec('..')
	return tmp
}

fn.getLevel = function (){
	var tmp = this.toString()
	tmp = tmp.split('/')
	return tmp.length - 1
}

fn.getSec = function (){
	return path.posix.basename(this.toString())
}

fn.setContainer = function (container){
	if(container instanceof Container){
		this._container = container
	} else{
		throw new TypeError('container argument must be a instance of Container')
	}
	return this
}

fn.getContainer = function (){
	return this._container
}

fn.make = function (/*arguments*/){
	if(!this._container){
		throw new Error('container not set, you can via constructor arguments or call #setContainer function to set')
	}
	var args = Array.prototype.slice.call(arguments)
	args.unshift(this)

	return this._container.make.apply(this._container, args)
}


fn.isInstance = function (err){
	if(!this._container){
		throw new Error('container not set, you can via constructor arguments or call #setContainer function to set')
	}

	return this._container.instanceOf(err, this)
}