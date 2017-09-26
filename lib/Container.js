var path = require('path')
var fs = require('fs')

module.exports = Container

var lockFiles = []

function Container(options) {
	options = options || {}

	this._lockFile = null
	this._levels = {}
	this._childs = {}
	this._list = {}

	this._lockedContents = { order: []}

	if(options.lockFile){
		if(!path.isAbsolute(options.lockFile)){
			throw new Error('options.lockFile argument must be a absolute path')
		}
		this._lockFile = path.normalize(options.lockFile)
	}


	if(this._lockFile){
		if(lockFiles.indexOf(this._lockFile) > -1){
			throw new Error('lockFile was been used')
		}
		lockFiles.push(this._lockFile)
	}

	this._readLockFile()

}

var fn = Container.prototype


fn._readLockFile = function (){
	if(this._lockFile == null) return;
	var contents 
	try {
		contents = fs.readFileSync(this._lockFile, {encoding: 'utf8'})
	} catch (e){
		if(e.code === 'ENOENT'){
			return;
		}
		throw e;
	}

	contents = JSON.parse(contents)
	this._lockedContents.order = contents.order

	for (var i = 0; i < contents.order.length; i++) {
		this._appendDirNode(contents.order[i])
	}
}

fn._formatDomain = function (domain){
	//删除重复和末尾的斜杠 以及..和.符号的去除 头部必须以/开始
	domain = path.posix.normalize('/' + domain + '/.')
	return domain;
}

fn._appendLevelNode = function (domain){
	var level, dir, prefix;
	domain = domain.split('/')
	level = domain.length - 1
	dir = domain.slice(0, level)
	if(!this._levels[level]){
		this._levels[level] = {}
	}

	if(!this._levels[level][dir]){
		prefix = '1'
		for (var i = 1; i < level; i++) {
			prefix += '1'
		}

		prefix = parseInt(prefix)
		prefix += Object.keys(this._levels[level]).length

		if((prefix + '').length > level){
			throw new Error('number of nodes at the current level overflows( level:' + level + ', max: ' + (Math.pow(10, level) - Math.pow(10, level - 1) - 1) + ')')
		}
		this._levels[level][dir] = {
			prefix: prefix,
			path: dir
		}
	}

	return this._levels[level][dir]
}

fn._appendDirNode = function (domain){
	var levelNodeInfo, dir, node, code;
	levelNodeInfo = this._appendLevelNode(domain)
	dir = levelNodeInfo.path
	node = path.posix.basename(domain)

	if(!this._childs[dir]){
		this._childs[dir] = []
	}

	if(!this._childs[dir][node]){
		code = levelNodeInfo.prefix * 10
		code += ''
		code += Object.keys(this._childs[dir]).length + 1
		this._childs[dir][node] = {
			code: code
		}
	}

	return this._childs[dir][node]

}

fn._hasDefined = function (domain){
	return Boolean(this._list[domain])
}

fn.def = function (domain, desc, factory){
	var dirNodeInfo;
	if(typeof domain !== 'string'){
		throw new TypeError('domain argument must be a String')
	}
	domain = this._formatDomain(domain)

	if(this._hasDefined(domain)){
		throw new Error('error was been defined')
	}

	dirNodeInfo = this._appendDirNode(domain)

	this._list[domain] = {
		code	: dirNodeInfo.code,
		desc	: desc,
		factory	: factory
	}

	return {
		code	: dirNodeInfo.code,
		desc	: desc,
	}
}

fn.lock = function (cb){
	if(this._lockFile == null){
		throw new Error('not set lockFile')
	}
	cb = cb || function (e) { if(e){ throw e }}
	var data;

	for (var d in this._list) {
		if(this._lockedContents.order.indexOf(d) === -1){
			this._lockedContents.order.push(d)
		}
	}

	data = JSON.stringify(this._lockedContents, null, 4)

	fs.writeFile(this._lockFile, data, cb)
}

