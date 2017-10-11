var path = require('path')
var fs = require('fs')

module.exports = Container

//延后加载, 避免循环依赖导致引用问题
var Domain = require('./Domain')

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

	fn.root = new Domain('/', this)

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
		this._appendDirNode(new Domain(contents.order[i], this))
	}
}

fn._appendLevelNode = function (domain){
	var level, dir, prefix;
	level = domain.getLevel()
	dir = domain.parent().toString()
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
	node = domain.getSec()

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
	var domainStr, dirNodeInfo;

	if(typeof domain !== 'string'){
		throw new TypeError('domain argument must be a String')
	}

	if(desc && typeof desc !== 'string'){
		throw new TypeError('desc argument must be a String')
	}

	if(typeof factory !== 'function'){
		throw new TypeError('factory argument must be a Function')
	}


	domain = new Domain(domain)
	domainStr = domain.toString()
	if(this._hasDefined(domainStr)){
		throw new Error('error was been defined')
	}

	dirNodeInfo = this._appendDirNode(domain)

	this._list[domainStr] = {
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

fn.make = function (domain/*, ..arguments*/){
	if(domain == null){
		throw new Error('domain argument is required')
	}

	if(typeof domain === 'string'){
		domain = new Domain(domain)
	} else {
		if( !(domain instanceof Domain) ){
			throw new TypeError('domain argument must be a String or instance of Domain')
		}
	}

	domain = domain.toString()

	var def = this._list[domain]

	if(!def){
		throw new ReferenceError('error is not defined')
	}

	var args = Array.prototype.slice.call(arguments)

	args.shift()
	args.unshift({
		code: def.code,
		desc: def.desc
	})

	var err = def.factory.apply(null, args)

	if(typeof err === 'object'){
		err.$errno_domain = domain
		err.$errno_code = def.code
	}

	return err
}

fn.instanceOf = function (err, domain){
	if(typeof err !== 'object')
		return false

	if(err.$errno_domain == null || err.$errno_code == null){
		return false
	}


	if(typeof domain === 'string'){
		domain = new Domain(domain)
	}

	if(!(domain instanceof Domain)){
		return false
	}

	var domainStr = domain.toString()

	if( !this._hasDefined(domainStr) ){
		return false
	}

	var def = this._list[domainStr]

	if(err.$errno_domain !== domainStr){
		return false
	}

	if(err.$errno_code !== def.code){
		return false
	}


	return true

}