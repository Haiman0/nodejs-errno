var path = require('path')

module.exports = Domain

function Domain(current) {
	this._current = current ||  '/'
}

var fn = Domain.prototype

fn._format = function (str){
	//删除重复和末尾的斜杠 以及..和.符号的去除 头部必须以/开始
	var domain = path.posix.normalize('/' + str + '/.')
	return domain;
}

fn.toString = function (){
	return this._format(this._current)
}

fn.sec = function (sub) {
	var newDomain = path.posix.join(this._current, sub)
	return new Domain(newDomain)
}

fn.link = function (str){
	var newDomain = this._current + str
	return new Domain(newDomain)
}

fn.parent = function (){
	var tmp = this.join('..')
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